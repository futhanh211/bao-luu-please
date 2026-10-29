import { describe, it, expect, beforeEach } from 'vitest';
import { usePlaybackStore } from './playback';
import { useAppStore } from './useApp';
import { CUSTOM_PRESETS, CustomTestDataConfig } from '../data/customTestData';
import { getActiveStudentsDb, getActiveAcademicFinanceDb } from './playback/session';

describe('Prompt 3: Boundary Timer SLA (BT1) & Bảng Cấu hình Giảng viên (S6)', () => {
  beforeEach(() => {
    useAppStore.setState({
      screen: 'desk',
      mode: 'play',
      speed: 1,
      role: 'student',
      helpOpen: false,
      asIsOpen: false,
      directorCaption: null,
    });
    usePlaybackStore.getState().reset();
  });

  describe('1. Kịch bản S4 · Boundary Timer BT1 (non-interrupting SLA)', () => {
    it('S4: Nộp đơn -> Tua +1 ngày (T) và +3 ngày (Shift+T) -> BT1 kích hoạt T6 -> E_END_REMIND mà T4 KHÔNG bị hủy -> Cố vấn duyệt -> E_END_OK', async () => {
      usePlaybackStore.getState().initScenario('s4');
      await usePlaybackStore.getState().submitApplication();

      const stateAfterSubmit = usePlaybackStore.getState();
      expect(stateAfterSubmit.submitted).toBe(true);
      expect(stateAfterSubmit.waitingTaskIds).toContain('T4');
      expect(stateAfterSubmit.waitingTaskIds).toContain('T5');
      expect(stateAfterSubmit.mapState.counters.day).toBe(0);

      // Tua 1 ngày (phím 'T')
      await usePlaybackStore.getState().advanceDays(1);
      const stateDay1 = usePlaybackStore.getState();
      expect(stateDay1.mapState.counters.day).toBe(1);
      expect(stateDay1.currentEventLog.some((e) => e.type === 'timer.fired')).toBe(false);

      // Tua 3 ngày (phím 'Shift+T') -> ngày 4 (>= 3) -> BT1 kích hoạt
      await usePlaybackStore.getState().advanceDays(3);
      const stateDay4 = usePlaybackStore.getState();
      expect(stateDay4.mapState.counters.day).toBe(4);

      const timerFiredEvents = stateDay4.currentEventLog.filter((e) => e.type === 'timer.fired');
      expect(timerFiredEvents).toHaveLength(1);
      expect((timerFiredEvents[0] as { timerId: string }).timerId).toBe('BT1');

      // Task T6 hoàn tất E_END_REMIND nhưng T4 không bị hủy (non-interrupting)
      expect(stateDay4.currentEventLog.some((e) => e.type === 'case.ended' && e.endEventId === 'E_END_REMIND')).toBe(true);
      expect(stateDay4.mapState.caseEnded).toBe(false);
      expect(stateDay4.waitingTaskIds).toContain('T4');

      // Tua tiếp không bị bắn trùng timer
      await usePlaybackStore.getState().advanceDays(1);
      expect(usePlaybackStore.getState().currentEventLog.filter((e) => e.type === 'timer.fired')).toHaveLength(1);

      // Cố vấn xác nhận -> CTSV duyệt -> BGH ký số -> hoàn tất E_END_OK
      await usePlaybackStore.getState().completeUserTask('T4', 'confirmed');
      await usePlaybackStore.getState().completeUserTask('T5', 'valid');
      await usePlaybackStore.getState().completeUserTask('T9', { signerName: 'PGS.TS. Đoàn Ngọc Phi Anh' });

      const finalState = usePlaybackStore.getState();
      expect(finalState.mapState.caseEnded).toBe(true);
      expect(finalState.currentEventLog.some((e) => e.type === 'case.ended' && e.endEventId === 'E_END_OK')).toBe(true);
      expect(finalState.studentRecord?.status).toBe('Bảo lưu');
    });

    it('Cancels BT1 boundary timer if T4 is completed before SLA deadline', async () => {
      const store = usePlaybackStore.getState();
      store.initScenario('s4');
      await usePlaybackStore.getState().submitApplication();

      // Cố vấn xử lý ngay tại Ngày 0 (trước hạn SLA 3 ngày)
      await usePlaybackStore.getState().completeUserTask('T4', 'confirmed');

      // Tua ngày qua hạn SLA (+4 ngày)
      await usePlaybackStore.getState().advanceDays(4);

      // Timer KHÔNG được kích hoạt vì T4 đã hoàn tất
      const state = usePlaybackStore.getState();
      const timerFired = state.currentEventLog.some((e) => e.type === 'timer.fired');
      expect(timerFired).toBe(false);
    });
  });

  describe('2. Kịch bản S6 · Bảng Cấu hình Giảng viên (7 Presets & Custom Data)', () => {
    it('Preset 1 (Chuẩn): Đủ điều kiện bảo lưu -> E_END_OK', async () => {
      usePlaybackStore.getState().initScenario('s6');
      const preset = CUSTOM_PRESETS.find((p) => p.id === 'happy_path')!;
      usePlaybackStore.getState().applyCustomTestData(preset.config);

      await usePlaybackStore.getState().submitApplication();
      await usePlaybackStore.getState().completeUserTask('T4', 'confirmed');
      await usePlaybackStore.getState().completeUserTask('T5', 'valid');
      await usePlaybackStore.getState().completeUserTask('T9', { signerName: 'Hiệu trưởng' });

      const state = usePlaybackStore.getState();
      expect(state.mapState.caseEnded).toBe(true);
      expect(state.currentEventLog.some((e) => e.type === 'case.ended' && e.endEventId === 'E_END_OK')).toBe(true);
    });

    it('Preset 2 (Nợ học phí): Vi phạm R3 -> từ chối tại G4 -> E_END_REJECTED', async () => {
      usePlaybackStore.getState().initScenario('s6');
      const preset = CUSTOM_PRESETS.find((p) => p.id === 'fail_r3_debt')!;
      usePlaybackStore.getState().applyCustomTestData(preset.config);

      await usePlaybackStore.getState().submitApplication();
      await usePlaybackStore.getState().completeUserTask('T4', 'confirmed');
      await usePlaybackStore.getState().completeUserTask('T5', 'valid');

      const state = usePlaybackStore.getState();
      expect(state.mapState.caseEnded).toBe(true);
      expect(state.currentEventLog.some((e) => e.type === 'case.ended' && e.endEventId === 'E_END_REJECTED')).toBe(true);
      expect(state.currentEventLog.some((e) => e.type === 'rule.evaluated' && e.ruleId === 'R3' && !e.passed)).toBe(true);
    });

    it('Preset 3 (Chưa đủ 1 kỳ): Vi phạm R1 -> từ chối tại G4 -> E_END_REJECTED', async () => {
      usePlaybackStore.getState().initScenario('s6');
      const preset = CUSTOM_PRESETS.find((p) => p.id === 'fail_r1_semester')!;
      usePlaybackStore.getState().applyCustomTestData(preset.config);

      await usePlaybackStore.getState().submitApplication();
      await usePlaybackStore.getState().completeUserTask('T4', 'confirmed');
      await usePlaybackStore.getState().completeUserTask('T5', 'valid');

      const state = usePlaybackStore.getState();
      expect(state.mapState.caseEnded).toBe(true);
      expect(state.currentEventLog.some((e) => e.type === 'case.ended' && e.endEventId === 'E_END_REJECTED')).toBe(true);
      expect(state.currentEventLog.some((e) => e.type === 'rule.evaluated' && e.ruleId === 'R1' && !e.passed)).toBe(true);
    });

    it('Preset 4 (Kỷ luật): Vi phạm R2 -> từ chối tại G4 -> E_END_REJECTED', async () => {
      usePlaybackStore.getState().initScenario('s6');
      const preset = CUSTOM_PRESETS.find((p) => p.id === 'fail_r2_discipline')!;
      usePlaybackStore.getState().applyCustomTestData(preset.config);

      await usePlaybackStore.getState().submitApplication();
      await usePlaybackStore.getState().completeUserTask('T4', 'confirmed');
      await usePlaybackStore.getState().completeUserTask('T5', 'valid');

      const state = usePlaybackStore.getState();
      expect(state.mapState.caseEnded).toBe(true);
      expect(state.currentEventLog.some((e) => e.type === 'case.ended' && e.endEventId === 'E_END_REJECTED')).toBe(true);
      expect(state.currentEventLog.some((e) => e.type === 'rule.evaluated' && e.ruleId === 'R2' && !e.passed)).toBe(true);
    });

    it('Preset 5 (Buộc thôi học): Vi phạm R4 -> từ chối tại G4 -> E_END_REJECTED', async () => {
      usePlaybackStore.getState().initScenario('s6');
      const preset = CUSTOM_PRESETS.find((p) => p.id === 'fail_r4_forced')!;
      usePlaybackStore.getState().applyCustomTestData(preset.config);

      await usePlaybackStore.getState().submitApplication();
      await usePlaybackStore.getState().completeUserTask('T4', 'confirmed');
      await usePlaybackStore.getState().completeUserTask('T5', 'valid');

      const state = usePlaybackStore.getState();
      expect(state.mapState.caseEnded).toBe(true);
      expect(state.currentEventLog.some((e) => e.type === 'case.ended' && e.endEventId === 'E_END_REJECTED')).toBe(true);
      expect(state.currentEventLog.some((e) => e.type === 'rule.evaluated' && e.ruleId === 'R4' && !e.passed)).toBe(true);
    });

    it('Preset 6 (Nghi vấn): Minh chứng có bất thường -> CTSV từ chối -> E_END_REJECTED', async () => {
      usePlaybackStore.getState().initScenario('s6');
      const preset = CUSTOM_PRESETS.find((p) => p.id === 'suspicious_evidence')!;
      usePlaybackStore.getState().applyCustomTestData(preset.config);

      await usePlaybackStore.getState().submitApplication();
      await usePlaybackStore.getState().completeUserTask('T4', 'confirmed');
      await usePlaybackStore.getState().completeUserTask('T5', 'invalid');

      const state = usePlaybackStore.getState();
      expect(state.mapState.caseEnded).toBe(true);
      expect(state.currentEventLog.some((e) => e.type === 'case.ended' && e.endEventId === 'E_END_REJECTED')).toBe(true);
    });

    it('Preset 7 (Quên minh chứng): Không đính kèm -> Trả hồ sơ ngay tại G1 -> E_END_RETURNED', async () => {
      usePlaybackStore.getState().initScenario('s6');
      const preset = CUSTOM_PRESETS.find((p) => p.id === 'missing_evidence')!;
      usePlaybackStore.getState().applyCustomTestData(preset.config);

      await usePlaybackStore.getState().submitApplication();

      const state = usePlaybackStore.getState();
      expect(state.mapState.caseEnded).toBe(true);
      expect(state.currentEventLog.some((e) => e.type === 'case.ended' && e.endEventId === 'E_END_RETURNED')).toBe(true);
    });

    it('Tùy biến tự do: Gõ tùy ý MSSV/Họ tên/Nợ tiền -> Áp dụng & Đồng bộ CSDL -> Engine xử lý đúng 100%', async () => {
      usePlaybackStore.getState().initScenario('s6');

      const customConfig: CustomTestDataConfig = {
        fullName: '  Nguyễn Văn Giảng Viên  ',
        mssv: '  3121107777  ',
        className: '47K99.9',
        faculty: 'Khoa Kiểm toán',
        phone: '0905111222',
        email: 'gv.test@due.edu.vn',
        reason: 'Ốm đau/tai nạn điều trị dài',
        semesterCount: 1,
        startSemester: 'Học kỳ 1, Năm học 2026-2027',
        commitment: true,
        semestersCompleted: 3,
        discipline: 'none',
        tuitionDebt: 15000000, // Nợ 15 triệu
        forcedWithdrawal: false,
        evidencePreset: 'valid_medical',
      };

      // Bấm "Áp dụng & Đồng bộ CSDL" (hoặc nhấn Enter)
      usePlaybackStore.getState().applyCustomTestData(customConfig);

      // Kiểm tra CSDL DS1 và DS2 đã nhận đúng dữ liệu đã trim
      const studentsDb = getActiveStudentsDb();
      const academicDb = getActiveAcademicFinanceDb();
      expect(studentsDb?.get('3121107777')?.name).toBe('Nguyễn Văn Giảng Viên');
      expect(academicDb?.get('3121107777')?.tuitionDebt).toBe(15000000);

      // Nộp đơn
      await usePlaybackStore.getState().submitApplication();

      // Cố vấn duyệt, CTSV duyệt
      await usePlaybackStore.getState().completeUserTask('T4', 'confirmed');
      await usePlaybackStore.getState().completeUserTask('T5', 'valid');

      // Engine xử lý: R3 phát hiện nợ 15 triệu -> từ chối tại G4
      const state = usePlaybackStore.getState();
      expect(state.mapState.caseEnded).toBe(true);
      expect(state.currentEventLog.some((e) => e.type === 'case.ended' && e.endEventId === 'E_END_REJECTED')).toBe(true);

      const r3Event = state.currentEventLog.find((e) => e.type === 'rule.evaluated' && e.ruleId === 'R3');
      expect(r3Event).toBeDefined();
      if (r3Event && r3Event.type === 'rule.evaluated') {
        expect(r3Event.passed).toBe(false);
      }
    });

    it('Bắt lỗi CSDL upsert & cache: Reset ca và chạy preset khác không bị nhiễm cache CSDL cũ và vẫn nhận event đầy đủ', async () => {
      // Chạy ca 1: happy_path -> hoàn tất thành công (status trong DS2 thành 'Bảo lưu')
      usePlaybackStore.getState().initScenario('s6');
      const happyPreset = CUSTOM_PRESETS.find((p) => p.id === 'happy_path')!;
      usePlaybackStore.getState().applyCustomTestData(happyPreset.config);
      await usePlaybackStore.getState().submitApplication();
      await usePlaybackStore.getState().completeUserTask('T4', 'confirmed');
      await usePlaybackStore.getState().completeUserTask('T5', 'valid');
      await usePlaybackStore.getState().completeUserTask('T9', { signerName: 'Hiệu trưởng' });

      expect(usePlaybackStore.getState().mapState.caseEnded).toBe(true);
      expect(usePlaybackStore.getState().studentRecord?.status).toBe('Bảo lưu');

      // Bấm ĐẶT LẠI (Reset)
      usePlaybackStore.getState().reset();

      // Kiểm tra CSDL sinh viên đã được phục hồi về 'Đang học', không bị kẹt cache 'Bảo lưu'
      const studentsDb = getActiveStudentsDb();
      expect(studentsDb?.get(happyPreset.config.mssv)?.status).toBe('Đang học');

      // Chạy ca 2: chuyển sang fail_r3_debt
      const debtPreset = CUSTOM_PRESETS.find((p) => p.id === 'fail_r3_debt')!;
      usePlaybackStore.getState().applyCustomTestData(debtPreset.config);
      await usePlaybackStore.getState().submitApplication();
      await usePlaybackStore.getState().completeUserTask('T4', 'confirmed');
      await usePlaybackStore.getState().completeUserTask('T5', 'valid');

      // Ca 2 phải chạy bình thường, event log nhận đầy đủ và kết thúc ở E_END_REJECTED
      const state2 = usePlaybackStore.getState();
      expect(state2.mapState.caseEnded).toBe(true);
      expect(state2.currentEventLog.some((e) => e.type === 'case.ended' && e.endEventId === 'E_END_REJECTED')).toBe(true);
    });
  });
});
