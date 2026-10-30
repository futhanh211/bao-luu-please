import { describe, it, expect, beforeEach } from 'vitest';
import { usePlaybackStore } from './playback';
import { useAppStore, Role } from './useApp';
import { useAuthStore } from './useAuth';
import { CUSTOM_PRESETS, CustomTestDataConfig } from '../data/customTestData';
import { getActiveStudentsDb, queuedCount } from './playback/session';
import { getDeskPhase } from '../ui/desks/deskState';

const pb = () => usePlaybackStore.getState();

async function waitFor(cond: () => boolean, label: string, timeout = 10000): Promise<void> {
  const started = Date.now();
  while (!cond()) {
    if (Date.now() - started > timeout) {
      throw new Error(`Timeout khi chờ: ${label}`);
    }
    await new Promise((r) => setTimeout(r, 10));
  }
}

describe('QA Session 2: Test và catch bug toàn bộ 6 kịch bản BPMN', () => {
  beforeEach(() => {
    useAppStore.setState({
      screen: 'desk',
      mode: 'play',
      speed: 2,
      role: 'student',
      reducedMotion: true,
      helpOpen: false,
      asIsOpen: false,
      directorCaption: null,
      sessionMode: 'demo',
    });
    useAuthStore.getState().logout();
    pb().reset();
  });

  // =========================================================================
  // 1. KỊCH BẢN S1 · HAPPY PATH (BẢO LƯU THÀNH CÔNG)
  // =========================================================================
  it('Kịch bản S1: Happy path -> T1 -> G1 -> G2 (AND Split 3 nhánh) -> T4 & T5 song song -> G3 -> G4 -> T8 -> T9 -> T10 -> T11 -> E_END_OK', async () => {
    pb().initScenario('s1');
    expect(pb().submitted).toBe(false);

    // SV nộp đơn
    await pb().submitApplication({ useScenarioDefaults: true });
    expect(pb().submitted).toBe(true);

    // AND Split (G2) tạo ra 3 nhánh: T3 (xong ngay), T4 (chờ CV), T5 (chờ CTSV)
    expect(pb().waitingTaskIds).toContain('T4');
    expect(pb().waitingTaskIds).toContain('T5');
    expect(pb().mapState.visibleDataObjects.DO1).toBe(true);

    // Cố vấn (T4) duyệt
    await pb().completeUserTask('T4', 'confirmed');
    expect(pb().waitingTaskIds).not.toContain('T4');
    expect(pb().waitingTaskIds).toContain('T5');

    // CTSV (T5) duyệt
    await pb().completeUserTask('T5', 'valid');
    expect(pb().waitingTaskIds).not.toContain('T5');

    // G3 Join -> G4 XOR -> T8 Dự thảo (DO2) -> Chờ BGH (T9)
    await waitFor(() => pb().waitingTaskIds.includes('T9'), 'BGH T9 waiting');
    expect(pb().mapState.visibleDataObjects.DO2).toBe(true);
    expect(pb().engine?.state.decisionDoc?.signed).toBe(false);

    // BGH (T9) ký số
    await pb().completeUserTask('T9', { signerName: 'PGS.TS. Đoàn Ngọc Phi Anh' });

    // T10 cập nhật DS2, T11 gửi MF4, ca kết thúc tại E_END_OK
    await waitFor(() => pb().mapState.caseEnded, 'case ended');
    expect(pb().mapState.endOutcome).toBe('Bảo lưu thành công');
    expect(pb().engine?.state.studentStatus).toBe('Bảo lưu');
    expect(getActiveStudentsDb()?.get(pb().scenario!.form.mssv)?.status).toBe('Bảo lưu');
    expect(pb().mapState.visibleDataObjects.DO3).toBe(true);

    // Thông điệp MF4 được gửi
    const mf4 = pb().currentEventLog.find((e) => e.type === 'message.sent' && e.flowId === 'MF4');
    expect(mf4).toBeDefined();

    // Không kích hoạt nhánh từ chối hoặc trả đơn
    expect(pb().currentEventLog.some((e) => e.type === 'message.sent' && e.flowId === 'MF2')).toBe(false);
    expect(pb().currentEventLog.some((e) => e.type === 'message.sent' && e.flowId === 'MF3')).toBe(false);
  });

  // =========================================================================
  // 2. KỊCH BẢN S2 · TRẢ ĐƠN TẠI T1/G1 (THIẾU MINH CHỨNG)
  // =========================================================================
  it('Kịch bản S2: Hồ sơ thiếu minh chứng -> T1 phát hiện -> G1 Không -> T2 (MF2) -> E_END_RETURNED', async () => {
    pb().initScenario('s2');
    expect(pb().submissionDraft?.attachedEvidenceIds).toHaveLength(0);

    // SV nộp đơn không có minh chứng
    await pb().submitApplication();

    // Ca kết thúc ngay tại E_END_RETURNED
    await waitFor(() => pb().mapState.caseEnded, 'case ended');
    expect(pb().mapState.endOutcome).toBe('Trả hồ sơ');

    // Kiểm tra không bao giờ đi vào G2, T3, T4, T5, T8, T9
    const nodeCompletedIds = pb().currentEventLog
      .filter((e) => e.type === 'node.completed')
      .map((e) => (e as { nodeId: string }).nodeId);

    expect(nodeCompletedIds).toContain('T1');
    expect(nodeCompletedIds).toContain('G1');
    expect(nodeCompletedIds).toContain('T2');
    expect(nodeCompletedIds).toContain('E_END_RETURNED');

    expect(nodeCompletedIds).not.toContain('G2');
    expect(nodeCompletedIds).not.toContain('T3');
    expect(nodeCompletedIds).not.toContain('T4');
    expect(nodeCompletedIds).not.toContain('T5');
    expect(nodeCompletedIds).not.toContain('T8');
    expect(nodeCompletedIds).not.toContain('T9');

    // MF2 được gửi
    const mf2 = pb().currentEventLog.find((e) => e.type === 'message.sent' && e.flowId === 'MF2');
    expect(mf2).toBeDefined();
  });

  // =========================================================================
  // 3. KỊCH BẢN S3 · TỪ CHỐI DO NỢ HỌC PHÍ R3 TẠI G4
  // =========================================================================
  it('Kịch bản S3: Nợ học phí -> T1 qua G1 -> G2 AND Split -> T3 vi phạm R3 -> T4 & T5 vẫn chạy -> G3 Join -> G4 Không -> T7 (MF3) -> E_END_REJECTED', async () => {
    pb().initScenario('s3');
    await pb().submitApplication({ useScenarioDefaults: true });

    // Kiểm tra T3 đánh rớt R3
    expect(pb().engine?.state.ruleResult.pass).toBe(false);
    expect(pb().engine?.state.ruleResult.violations.some((v) => v.includes('học phí'))).toBe(true);

    // Cố vấn và CTSV hoàn thành phần việc của mình
    expect(pb().waitingTaskIds).toContain('T4');
    expect(pb().waitingTaskIds).toContain('T5');
    await pb().completeUserTask('T4', 'confirmed');
    await pb().completeUserTask('T5', 'valid');

    // G3 Join -> G4 rẽ nhánh Không (do R3 vi phạm) -> T7 -> E_END_REJECTED
    await waitFor(() => pb().mapState.caseEnded, 'case ended');
    expect(pb().mapState.endOutcome).toBe('Từ chối');
    expect(pb().currentEventLog.some((e) => e.type === 'case.ended' && e.endEventId === 'E_END_REJECTED')).toBe(true);

    // Gửi thông báo MF3
    const mf3 = pb().currentEventLog.find((e) => e.type === 'message.sent' && e.flowId === 'MF3');
    expect(mf3).toBeDefined();

    // Tuyệt đối không vào T8 và T9
    const completedNodes = pb().currentEventLog
      .filter((e) => e.type === 'node.completed')
      .map((e) => (e as { nodeId: string }).nodeId);
    expect(completedNodes).not.toContain('T8');
    expect(completedNodes).not.toContain('T9');
    expect(completedNodes).toContain('T7');
  });

  // =========================================================================
  // 4. KỊCH BẢN S4 · BOUNDARY TIMER QUÁ HẠN SLA TẠI T4 / T6
  // =========================================================================
  it('Kịch bản S4: Boundary Timer SLA -> Quá hạn 3 ngày -> T6 nhắc việc -> T4 vẫn chờ -> Cố vấn duyệt tiếp -> E_END_OK', async () => {
    pb().initScenario('s4');
    await pb().submitApplication({ useScenarioDefaults: true });

    expect(pb().waitingTaskIds).toContain('T4');
    expect(pb().waitingTaskIds).toContain('T5');

    // Tua 1 ngày: chưa quá hạn (day = 1 < 3), timer chưa kích hoạt
    await pb().advanceDays(1);
    expect(pb().mapState.counters.day).toBe(1);
    expect(pb().currentEventLog.some((e) => e.type === 'timer.fired')).toBe(false);

    // Tua tiếp 3 ngày: day = 4 (>= 3), boundary timer BT1 bắn
    await pb().advanceDays(3);
    expect(pb().mapState.counters.day).toBe(4);

    const timerFired = pb().currentEventLog.filter((e) => e.type === 'timer.fired');
    expect(timerFired).toHaveLength(1);

    // T6 chạy và gửi tin nhắn nhắc việc cho Cố vấn
    expect(pb().engine?.state.advisor.remindedAt).toBe(4);
    expect(pb().engine?.state.messages.some((m) => m.recipient === 'advisor')).toBe(true);

    // Nhánh nhắc kết thúc tại E_END_REMIND, NHƯNG ca chính không kết thúc (non-interrupting)
    expect(pb().mapState.caseEnded).toBe(false);
    expect(pb().waitingTaskIds).toContain('T4');

    // Tua tiếp không bị bắn lặp timer
    await pb().advanceDays(2);
    expect(pb().currentEventLog.filter((e) => e.type === 'timer.fired')).toHaveLength(1);

    // Hoàn tất T4, T5, T9 -> ca kết thúc thành công E_END_OK
    await pb().completeUserTask('T4', 'confirmed');
    await pb().completeUserTask('T5', 'valid');
    await waitFor(() => pb().waitingTaskIds.includes('T9'), 'T9 waiting');
    await pb().completeUserTask('T9', { signerName: 'Lãnh đạo BGH' });

    await waitFor(() => pb().mapState.caseEnded, 'case ended');
    expect(pb().mapState.endOutcome).toBe('Bảo lưu thành công');
  });

  // =========================================================================
  // 5. KỊCH BẢN S5 · CTSV PHÁT HIỆN MINH CHỨNG NGHI VẤN
  // =========================================================================
  it('Kịch bản S5: Minh chứng nghi vấn -> AI-1 cảnh báo -> CTSV dập dấu KHÔNG HỢP LỆ -> G4 từ chối -> E_END_REJECTED', async () => {
    pb().initScenario('s5');
    await pb().submitApplication({ useScenarioDefaults: true });

    // Cố vấn xác nhận
    await pb().completeUserTask('T4', 'confirmed');

    // CTSV thẩm tra phát hiện bất thường và chọn 'invalid'
    expect(pb().waitingTaskIds).toContain('T5');
    await pb().completeUserTask('T5', 'invalid');

    // G4 tổng hợp: ctsv.status = 'invalid' -> eligible = false -> rẽ T7 -> E_END_REJECTED
    await waitFor(() => pb().mapState.caseEnded, 'case ended');
    expect(pb().mapState.endOutcome).toBe('Từ chối');
    expect(pb().currentEventLog.some((e) => e.type === 'case.ended' && e.endEventId === 'E_END_REJECTED')).toBe(true);

    const mf3 = pb().currentEventLog.find((e) => e.type === 'message.sent' && e.flowId === 'MF3');
    expect(mf3).toBeDefined();
  });

  // =========================================================================
  // 6. CA TỰ NHẬP SINH VIÊN (CUSTOM STUDENT CASE)
  // =========================================================================
  describe('6. Ca tự nhập sinh viên (Custom Student & Presets)', () => {
    it('Đăng nhập sinh viên tự do tùy ý -> Lưu giữ thông tin xuyên suốt T4, T5, T9 -> Quyết định ghi đúng tên MSSV tự nhập', async () => {
      const customStudent = {
        mssv: '3121108888',
        name: 'Võ Hoàng Yến',
        className: '48K12.3',
        faculty: 'Khoa Thương mại điện tử',
        phone: '0905888999',
        email: 'yen.vh@due.udn.vn',
      };

      // Đăng nhập cổng sinh viên
      useAuthStore.getState().loginAsStudent(customStudent.mssv, customStudent);
      pb().initStudentSession(customStudent, undefined, 'valid_medical');

      expect(pb().isCustomCase).toBe(true);
      expect(pb().scenario?.studentName).toBe('Võ Hoàng Yến');
      expect(pb().scenario?.mssv).toBe('3121108888');
      expect(pb().submissionDraft?.form.fullName).toBe('Võ Hoàng Yến');
      expect(pb().submissionDraft?.form.mssv).toBe('3121108888');

      // Đính kèm minh chứng hợp lệ và nộp đơn
      const medEv = pb().scenario!.evidence[0];
      if (medEv) {
        pb().attachEvidence(medEv.id);
      }
      await pb().submitApplication();

      // Cố vấn duyệt
      await pb().completeUserTask('T4', 'confirmed');
      // CTSV duyệt
      await pb().completeUserTask('T5', 'valid');

      // T8 soạn quyết định -> kiểm tra quyết định mang đúng thông tin sinh viên tự nhập
      await waitFor(() => pb().waitingTaskIds.includes('T9'), 'T9 waiting');
      const doc = pb().engine?.state.decisionDoc;
      expect(doc).toBeDefined();
      expect(doc?.studentName).toBe('Võ Hoàng Yến');
      expect(doc?.mssv).toBe('3121108888');
      expect(doc?.faculty).toBe('Khoa Thương mại điện tử');
      expect(doc?.number).toBe('BL-8888/QĐ-ĐHKT');

      // BGH ký số
      await pb().completeUserTask('T9', { signerName: 'Ban Giám hiệu Ký' });
      await waitFor(() => pb().mapState.caseEnded, 'case ended');
      expect(pb().mapState.endOutcome).toBe('Bảo lưu thành công');

      // Kiểm tra CSDL DS2 được cập nhật đúng cho MSSV tự nhập
      const dbRecord = getActiveStudentsDb()?.get('3121108888');
      expect(dbRecord?.status).toBe('Bảo lưu');
    });

    it('Tự nhập sinh viên nhưng quên nộp minh chứng -> T1 trả hồ sơ tại G1', async () => {
      usePlaybackStore.getState().initScenario('s6');
      const noEvConfig: CustomTestDataConfig = {
        ...CUSTOM_PRESETS[0].config,
        fullName: 'Nguyễn Văn Quên',
        mssv: '3121107777',
        evidencePreset: 'none',
      };
      pb().applyCustomTestData(noEvConfig);
      await pb().submitApplication();

      await waitFor(() => pb().mapState.caseEnded, 'case ended');
      expect(pb().mapState.endOutcome).toBe('Trả hồ sơ');
      expect(pb().currentEventLog.some((e) => e.type === 'message.sent' && e.flowId === 'MF2')).toBe(true);
    });

    it('Tự nhập sinh viên vi phạm nợ học phí R3 -> Bị từ chối tại G4', async () => {
      usePlaybackStore.getState().initScenario('s6');
      const debtConfig: CustomTestDataConfig = {
        ...CUSTOM_PRESETS[0].config,
        fullName: 'Phan Quốc Nợ',
        mssv: '3121106666',
        tuitionDebt: 5000000,
        evidencePreset: 'valid_medical',
      };
      pb().applyCustomTestData(debtConfig);
      await pb().submitApplication();

      await pb().completeUserTask('T4', 'confirmed');
      await pb().completeUserTask('T5', 'valid');

      await waitFor(() => pb().mapState.caseEnded, 'case ended');
      expect(pb().mapState.endOutcome).toBe('Từ chối');
    });
  });

  // =========================================================================
  // 7. KIỂM TRA CHUỖI THAO TÁC CHUYỂN VAI VÀ TRẠNG THÁI BÀN (DESK PHASES)
  // =========================================================================
  describe('7. Chuỗi thao tác chuyển vai và trạng thái bàn', () => {
    it('Chuyển vai qua lại không làm mất trạng thái hay gây lỗi', async () => {
      const app = useAppStore.getState();
      pb().initScenario('s1');
      await pb().submitApplication({ useScenarioDefaults: true });

      // Khi T4 & T5 đang chờ:
      // Bàn Cố vấn (T4) phải là 'waiting'
      expect(getDeskPhase({
        submitted: true,
        waitingTaskId: pb().waitingTaskId,
        waitingTaskIds: pb().waitingTaskIds,
        caseEnded: false,
        completedTaskIds: [],
        taskId: 'T4',
      })).toBe('waiting');

      // Bàn CTSV (T5) phải là 'waiting'
      expect(getDeskPhase({
        submitted: true,
        waitingTaskId: pb().waitingTaskId,
        waitingTaskIds: pb().waitingTaskIds,
        caseEnded: false,
        completedTaskIds: [],
        taskId: 'T5',
      })).toBe('waiting');

      // Bàn BGH (T9) phải là 'upcoming'
      expect(getDeskPhase({
        submitted: true,
        waitingTaskId: pb().waitingTaskId,
        waitingTaskIds: pb().waitingTaskIds,
        caseEnded: false,
        completedTaskIds: [],
        taskId: 'T9',
      })).toBe('upcoming');

      // Chuyển vai liên tục giữa 5 tab vai
      const roles: Role[] = ['student', 'advisor', 'ctsv', 'principal', 'system'];
      for (const r of roles) {
        app.setRole(r);
        expect(useAppStore.getState().role).toBe(r);
      }

      // Hoàn tất T4
      await pb().completeUserTask('T4', 'confirmed');

      // Bàn Cố vấn (T4) chuyển sang 'done'
      expect(getDeskPhase({
        submitted: true,
        waitingTaskId: pb().waitingTaskId,
        waitingTaskIds: pb().waitingTaskIds,
        caseEnded: false,
        completedTaskIds: ['T4'],
        taskId: 'T4',
      })).toBe('done');

      // Bàn CTSV vẫn 'waiting'
      expect(getDeskPhase({
        submitted: true,
        waitingTaskId: pb().waitingTaskId,
        waitingTaskIds: pb().waitingTaskIds,
        caseEnded: false,
        completedTaskIds: ['T4'],
        taskId: 'T5',
      })).toBe('waiting');
    });

    it('Phân quyền canAccessRole ngăn truy cập trái vai khi đã đăng nhập', () => {
      const auth = useAuthStore.getState();

      // Chưa đăng nhập: cho phép xem mọi bàn (chế độ demo)
      expect(auth.canAccessRole('student')).toBe(true);
      expect(auth.canAccessRole('advisor')).toBe(true);
      expect(auth.canAccessRole('principal')).toBe(true);

      // Đăng nhập vai Sinh viên: chỉ được vào bàn Sinh viên
      auth.loginAsStudent('3121102001');
      expect(auth.canAccessRole('student')).toBe(true);
      expect(auth.canAccessRole('advisor')).toBe(false);
      expect(auth.canAccessRole('ctsv')).toBe(false);
      expect(auth.canAccessRole('principal')).toBe(false);

      // Đăng nhập vai Cố vấn: chỉ được vào bàn Cố vấn (và hệ thống)
      auth.loginAsOfficer('advisor_nam');
      expect(auth.canAccessRole('advisor')).toBe(true);
      expect(auth.canAccessRole('ctsv')).toBe(false);
      expect(auth.canAccessRole('principal')).toBe(false);
    });
  });

  // =========================================================================
  // 8. KIỂM TRA RESET CA KHÔNG RÒ RỈ STATE (10 LẦN LIÊN TIẾP)
  // =========================================================================
  describe('8. Reset ca không rò rỉ state', () => {
    it('Reset 10 lần liên tiếp không làm rò rỉ token, event queue hay duplicate subscriptions', async () => {
      for (let i = 0; i < 10; i++) {
        pb().initScenario('s1');
        await pb().submitApplication({ useScenarioDefaults: true });
        expect(pb().waitingTaskIds.length).toBeGreaterThan(0);

        // Reset ca
        pb().reset();

        // Kiểm tra mọi state được dọn sạch tuyệt đối
        expect(pb().submitted).toBe(false);
        expect(pb().isPlaying).toBe(false);
        expect(pb().isWaitingUserTask).toBe(false);
        expect(pb().waitingTaskId).toBeNull();
        expect(pb().waitingTaskIds).toHaveLength(0);
        expect(pb().currentEventLog).toHaveLength(0);
        expect(pb().eventDays).toHaveLength(0);
        expect(pb().mapState.counters.day).toBe(0);
        expect(pb().mapState.counters.tasksAutoRun).toBe(0);
        expect(pb().mapState.caseEnded).toBe(false);
        expect(queuedCount()).toBe(0);
      }
    });

    it('Chuyển đổi luân phiên giữa các kịch bản không bị lẫn lộn dữ liệu ca cũ', async () => {
      // 1. Chạy nửa chừng S3 (nợ học phí)
      pb().initScenario('s3');
      await pb().submitApplication({ useScenarioDefaults: true });
      expect(pb().scenario?.code).toBe('S3');
      expect(pb().engine?.state.ruleResult.pass).toBe(false);

      // 2. Chuyển sang S1 (Happy path)
      pb().initScenario('s1');
      expect(pb().scenario?.code).toBe('S1');
      expect(pb().submitted).toBe(false);
      expect(pb().currentEventLog).toHaveLength(0);

      // Nộp S1 -> ruleResult của S1 phải là pass
      await pb().submitApplication({ useScenarioDefaults: true });
      expect(pb().engine?.state.ruleResult.pass).toBe(true);
      expect(pb().engine?.state.ruleResult.violations).toHaveLength(0);

      // 3. Chuyển sang S2 (Thiếu minh chứng)
      pb().initScenario('s2');
      expect(pb().scenario?.code).toBe('S2');
      expect(pb().submitted).toBe(false);
      await pb().submitApplication();
      await waitFor(() => pb().mapState.caseEnded, 'S2 ended');
      expect(pb().mapState.endOutcome).toBe('Trả hồ sơ');
    });
  });

  // =========================================================================
  // 9. KIỂM TRA CÁC ĐIỀU KIỆN RẼ NHÁNH TỔ HỢP TẠI G4
  // =========================================================================
  describe('9. Điều kiện rẽ nhánh tổ hợp tại G4 XOR Gateway', () => {
    it('Tổ hợp: Pass luật + Cố vấn TỪ CHỐI + CTSV hợp lệ -> G4 rẽ Không (T7 -> E_END_REJECTED)', async () => {
      pb().initScenario('s1');
      await pb().submitApplication({ useScenarioDefaults: true });

      // Cố vấn từ chối (declined)
      await pb().completeUserTask('T4', 'declined');
      // CTSV hợp lệ (valid)
      await pb().completeUserTask('T5', 'valid');

      await waitFor(() => pb().mapState.caseEnded, 'case ended');
      expect(pb().mapState.endOutcome).toBe('Từ chối');
      expect(pb().engine?.state.eligible).toBe(false);
    });

    it('Tổ hợp: Vi phạm R2 (kỷ luật) -> G4 rẽ Không (T7 -> E_END_REJECTED)', async () => {
      pb().initScenario('s6');
      const discPreset = CUSTOM_PRESETS.find((p) => p.id === 'fail_r2_discipline')!;
      pb().applyCustomTestData(discPreset.config);
      await pb().submitApplication();

      await pb().completeUserTask('T4', 'confirmed');
      await pb().completeUserTask('T5', 'valid');

      await waitFor(() => pb().mapState.caseEnded, 'case ended');
      expect(pb().mapState.endOutcome).toBe('Từ chối');
      expect(pb().engine?.state.ruleResult.violations.some((v) => v.includes('kỷ luật'))).toBe(true);
    });

    it('Tổ hợp: Vi phạm R4 (buộc thôi học) -> G4 rẽ Không (T7 -> E_END_REJECTED)', async () => {
      pb().initScenario('s6');
      const r4Preset = CUSTOM_PRESETS.find((p) => p.id === 'fail_r4_forced')!;
      pb().applyCustomTestData(r4Preset.config);
      await pb().submitApplication();

      await pb().completeUserTask('T4', 'confirmed');
      await pb().completeUserTask('T5', 'valid');

      await waitFor(() => pb().mapState.caseEnded, 'case ended');
      expect(pb().mapState.endOutcome).toBe('Từ chối');
      expect(pb().engine?.state.ruleResult.violations.some((v) => v.includes('buộc thôi học'))).toBe(true);
    });
  });
});
