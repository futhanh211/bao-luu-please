import { describe, it, expect, beforeEach } from 'vitest';
import { createEngine } from './engine';
import { PROCESS_DEF } from './process.def';
import { getScenarioById } from '../data/scenarios';
import { MockAIProvider } from '../ai/mock';
import { Clock } from './clock';
import { InMemoryStudentsDB } from '../data/students.db';
import { InMemoryAcademicFinanceDB } from '../data/academic-finance.db';
import { EngineEvent, SentMessage } from './types';
import { composeLetter } from '../data/letters';

describe('Prompt 2 · Kiểm thử Kịch bản Ngoại lệ & Rẽ nhánh BPMN (S2, S3, S5)', () => {
  let clock: Clock;
  let ai: MockAIProvider;
  let studentsDb: InMemoryStudentsDB;
  let financeDb: InMemoryAcademicFinanceDB;
  let events: EngineEvent[];

  beforeEach(() => {
    clock = new Clock();
    ai = new MockAIProvider();
    studentsDb = new InMemoryStudentsDB();
    financeDb = new InMemoryAcademicFinanceDB();
    events = [];
  });

  function setupEngine(scenarioId: string) {
    const sc = getScenarioById(scenarioId);
    if (!sc) throw new Error(`Không tìm thấy kịch bản ${scenarioId}`);
    ai.setScript(sc.aiScript);

    const deps = {
      clock,
      ai,
      db: {
        ds1: financeDb,
        ds2: studentsDb,
      },
    };

    const engine = createEngine(PROCESS_DEF, sc, deps);
    engine.subscribe((e) => events.push(e));
    return { sc, engine, deps };
  }

  it('1. S2 (Thu Hà - Quên minh chứng): T1 phát hiện -> G1 rẽ MF2 -> Thư yêu cầu bổ sung -> E_END_RETURNED', async () => {
    const { sc, engine } = setupEngine('s2');

    // 1. Kiểm tra cấu hình ban đầu
    expect(sc.studentName).toBe('Trần Thu Hà');
    expect(sc.mssv).toBe('3121102002');
    expect(sc.evidence).toHaveLength(0); // Không đính kèm minh chứng

    // 2. Nộp đơn
    engine.start();
    await engine.runUntilBlocked();

    // 3. Kiểm tra rẽ nhánh tại G1 sang T2 (MF2)
    const edgeG1 = events.find(
      (e) => e.type === 'edge.traversed' && e.from === 'G1'
    );
    expect(edgeG1).toBeDefined();
    expect((edgeG1 as { to: string }).to).toBe('T2'); // Rẽ nhánh sang T2 (thông báo MF2)

    // 4. Kiểm tra sự kiện kết thúc tại E_END_RETURNED
    const ended = events.find((e) => e.type === 'case.ended');
    expect(ended).toBeDefined();
    expect((ended as { endEventId: string }).endEventId).toBe('E_END_RETURNED');
    expect((ended as { outcome: string }).outcome).toBe('Trả hồ sơ');

    // 5. Kiểm tra Thư trả hồ sơ MF2 gửi vào Hộp thư sinh viên
    const msgSent = events.find((e) => e.type === 'message.sent' && (e as { flowId: string }).flowId === 'MF2');
    expect(msgSent).toBeDefined();
    if (!msgSent || msgSent.type !== 'message.sent') throw new Error('MF2 not sent');
    const payload = msgSent.payload as SentMessage;
    expect(payload.content).toContain('Trần Thu Hà');
    expect(payload.content).toContain('chưa có tài liệu minh chứng đính kèm');

    // Soạn thư giao diện
    const letter = composeLetter('MF2', msgSent.payload);
    expect(letter.title).toBe('Hồ sơ chưa hợp lệ');
    expect(letter.aiGenerated).toBe(true);
    expect(letter.sections[0].heading).toBe('Nội dung còn thiếu / chưa hợp lệ');
    expect(letter.sections[0].lines).toContain('• Chưa đính kèm minh chứng hợp lệ cho lý do nghỉ học đã khai');

    // 6. Bắt lỗi CSDL: CSDL sinh viên KHÔNG bị sửa nhầm sang "Bảo lưu"
    const studentInDb = studentsDb.get('3121102002');
    expect(studentInDb).toBeDefined();
    expect(studentInDb?.status).toBe('Đang học'); // Phải giữ nguyên 'Đang học'
    expect(engine.state.studentStatus).toBe('Đang học');

    // Quyết định DO2/DO3 không được tạo hay ký
    expect(engine.state.dataObjects.DO2).toBe(false);
    expect(engine.state.dataObjects.DO3).toBe(false);
  });

  it('2. S3 (Tuấn Kiệt - Nợ học phí 7.500.000 VNĐ): R3 báo đỏ -> G4 rẽ MF3 -> Thư giải thích công nợ AI -> E_END_REJECTED', async () => {
    const { sc, engine } = setupEngine('s3');

    // 1. Kiểm tra cấu hình học phí & sinh viên
    expect(sc.studentName).toBe('Lê Tuấn Kiệt');
    expect(sc.mssv).toBe('3121102003');
    const finRec = financeDb.get('3121102003');
    expect(finRec?.tuitionDebt).toBe(7500000); // Nợ 7.5 triệu VNĐ

    // 2. Nộp đơn
    engine.start();
    await engine.runUntilBlocked();

    // 3. T3 tra cứu CSDL Tài chính -> R3 vi phạm
    expect(engine.state.ruleResult.pass).toBe(false);
    expect(engine.state.ruleResult.violations).toContain(
      'Công nợ học phí = 0 (Còn nợ học phí: 7.500.000 VNĐ)'
    );

    // 4. Các vai người xử lý song song T4 (Cố vấn) và T5 (CTSV)
    expect(engine.getWaitingTasks()).toContain('T4');
    expect(engine.getWaitingTasks()).toContain('T5');

    // Cố vấn xác nhận
    await engine.completeUserTask('T4', 'confirmed');
    // CTSV thẩm tra giấy tờ UBND xác nhận gia đình khó khăn hợp lệ
    await engine.completeUserTask('T5', 'valid');

    await engine.runUntilBlocked();

    // 5. Cổng G4 đánh giá điều kiện -> rẽ nhánh từ chối sang T7 (MF3)
    const edgeG4 = events.find(
      (e) => e.type === 'edge.traversed' && e.from === 'G4'
    );
    expect(edgeG4).toBeDefined();
    expect((edgeG4 as { to: string }).to).toBe('T7'); // Rẽ nhánh từ chối sang T7 (thông báo MF3)

    // 6. Kết thúc tại E_END_REJECTED
    const ended = events.find((e) => e.type === 'case.ended');
    expect(ended).toBeDefined();
    expect((ended as { endEventId: string }).endEventId).toBe('E_END_REJECTED');
    expect((ended as { outcome: string }).outcome).toBe('Từ chối');

    // 7. Kiểm tra Thư từ chối MF3 gửi cho sinh viên
    const msgSent = events.find((e) => e.type === 'message.sent' && (e as { flowId: string }).flowId === 'MF3');
    expect(msgSent).toBeDefined();
    if (!msgSent || msgSent.type !== 'message.sent') throw new Error('MF3 not sent');
    const payload = msgSent.payload as SentMessage;
    // Lời giải thích do AI soạn
    expect(payload.content).toContain('Lê Tuấn Kiệt');
    expect(payload.content).toContain('7.500.000 VNĐ');

    // Soạn thư giao diện
    const letter = composeLetter('MF3', msgSent.payload);
    expect(letter.title).toBe('Không đủ điều kiện bảo lưu');
    expect(letter.intro).toContain('7.500.000 VNĐ');

    // 8. Bắt lỗi "Đúng người đúng tội":
    // Chỉ nêu vi phạm học phí, KHÔNG đổ lỗi nhầm cho Cố vấn hay CTSV
    expect(letter.sections[0].lines).toEqual([
      '• Công nợ học phí = 0 (Còn nợ học phí: 7.500.000 VNĐ)',
    ]);
    expect(letter.sections[0].lines.some((l) => l.includes('Cố vấn'))).toBe(false);
    expect(letter.sections[0].lines.some((l) => l.includes('Công tác sinh viên'))).toBe(false);

    // 9. Bắt lỗi CSDL: CSDL sinh viên KHÔNG bị sửa nhầm sang "Bảo lưu"
    const studentInDb = studentsDb.get('3121102003');
    expect(studentInDb).toBeDefined();
    expect(studentInDb?.status).toBe('Đang học'); // Phải giữ nguyên 'Đang học'
    expect(engine.state.studentStatus).toBe('Đang học');
  });

  it('3. S5 (Khánh Linh - Minh chứng nghi vấn / Người ≠ AI): CTSV soi lệch và đóng KHÔNG HỢP LỆ -> G4 rẽ MF3 -> E_END_REJECTED', async () => {
    const { sc, engine } = setupEngine('s5');

    // 1. Kiểm tra cấu hình sinh viên & minh chứng
    expect(sc.studentName).toBe('Hoàng Khánh Linh');
    expect(sc.mssv).toBe('3121102005');
    expect(sc.evidence).toHaveLength(1);
    const ev = sc.evidence[0];
    expect(ev.name).toContain('Phòng khám');

    // Kiểm tra các trường nghi vấn
    const nameField = ev.fields?.find((f) => f.id === 'patientName');
    expect(nameField?.value).toBe('Hoàng Khánh Lình'); // Lệch tên
    const dischargeField = ev.fields?.find((f) => f.id === 'dischargeDate');
    expect(dischargeField?.value).toBe('10/10/2026'); // Trước ngày vào 15/10/2026
    const stampField = ev.fields?.find((f) => f.id === 'hospitalStamp');
    expect(stampField?.value).toBe('Không có'); // Thiếu dấu đỏ

    // 2. Nộp đơn
    engine.start();
    await engine.runUntilBlocked();

    // 3. T3 tra cứu quy tắc R1-R4: Tất cả đều ĐẠT (học phí = 0, đủ 3 kỳ, không kỷ luật)
    expect(engine.state.ruleResult.pass).toBe(true);
    expect(engine.state.ruleResult.violations).toHaveLength(0);

    // 4. Cố vấn xác nhận T4
    await engine.completeUserTask('T4', 'confirmed');

    // 5. CTSV tại T5: phát hiện minh chứng giả mạo/tẩy xóa -> Đóng dấu KHÔNG HỢP LỆ (invalid)
    await engine.completeUserTask('T5', 'invalid');

    await engine.runUntilBlocked();

    // 6. Cổng G4 đánh giá -> Rẽ nhánh từ chối sang T7 (MF3) vì CTSV invalid
    const edgeG4 = events.find(
      (e) => e.type === 'edge.traversed' && e.from === 'G4'
    );
    expect(edgeG4).toBeDefined();
    expect((edgeG4 as { to: string }).to).toBe('T7');

    // 7. Kết thúc tại E_END_REJECTED
    const ended = events.find((e) => e.type === 'case.ended');
    expect(ended).toBeDefined();
    expect((ended as { endEventId: string }).endEventId).toBe('E_END_REJECTED');
    expect((ended as { outcome: string }).outcome).toBe('Từ chối');

    // 8. Kiểm tra Thư từ chối MF3 gửi cho sinh viên
    const msgSent = events.find((e) => e.type === 'message.sent' && (e as { flowId: string }).flowId === 'MF3');
    expect(msgSent).toBeDefined();
    if (!msgSent || msgSent.type !== 'message.sent') throw new Error('MF3 not sent');
    const payload = msgSent.payload as SentMessage;
    expect(payload.content).toContain('Hoàng Khánh Linh');
    expect(payload.content).toContain('tài liệu minh chứng y tế không hợp lệ');

    // Soạn thư giao diện
    const letter = composeLetter('MF3', msgSent.payload);
    expect(letter.title).toBe('Không đủ điều kiện bảo lưu');
    expect(letter.intro).toContain('Hoàng Khánh Linh');

    // 9. Bắt lỗi "Đúng người đúng tội":
    // Chỉ nêu minh chứng không hợp lệ từ CTSV, KHÔNG vu oan nợ học phí hay quy tắc đào tạo
    expect(letter.sections[0].lines).toEqual([
      '• Phòng Công tác sinh viên kết luận minh chứng không hợp lệ',
    ]);
    expect(letter.sections[0].lines.some((l) => l.includes('học phí'))).toBe(false);

    // 10. Bắt lỗi CSDL: CSDL sinh viên KHÔNG bị sửa nhầm sang "Bảo lưu"
    const studentInDb = studentsDb.get('3121102005');
    expect(studentInDb).toBeDefined();
    expect(studentInDb?.status).toBe('Đang học'); // Phải giữ nguyên 'Đang học'
    expect(engine.state.studentStatus).toBe('Đang học');
  });
});
