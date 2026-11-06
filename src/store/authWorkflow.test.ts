import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './useAuth';
import { usePlaybackStore } from './playback';
import { useAppStore, ROLES } from './useApp';

describe('Luồng phối hợp Sinh viên nộp đơn -> Giảng viên duyệt đơn', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
    useAppStore.getState().setSessionMode('demo');
    usePlaybackStore.getState().reset();
    usePlaybackStore.getState().initScenario('s1');
  });

  it('sinh viên nộp đơn thành công và dữ liệu được bảo toàn khi giảng viên đăng nhập', async () => {
    // 1. Sinh viên Nguyễn Minh Khoa đăng nhập
    useAuthStore.getState().loginAsStudent('3121102001');
    expect(useAuthStore.getState().currentUser?.name).toBe('Nguyễn Minh Khoa');
    expect(useAppStore.getState().role).toBe('student');

    // 2. Sinh viên nộp đơn trực tuyến
    await usePlaybackStore.getState().submitApplication({ useScenarioDefaults: true });

    // Sau khi nộp, hệ thống chạy qua T1, T2, T3 và dừng ở T4 (Cố vấn) và T5 (CTSV)
    const pbStateAfterSubmit = usePlaybackStore.getState();
    expect(pbStateAfterSubmit.submitted).toBe(true);
    expect(pbStateAfterSubmit.waitingTaskIds).toContain('T4');
    expect(pbStateAfterSubmit.waitingTaskIds).toContain('T5');

    // 3. Sinh viên đăng xuất
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);

    // 4. Giảng viên TS. Lê Hoài Nam (Cố vấn) đăng nhập
    const officerOk = useAuthStore.getState().loginAsOfficer('advisor_nam');
    expect(officerOk).toBe(true);
    expect(useAuthStore.getState().currentUser?.name).toBe('TS. Lê Hoài Nam');
    // Role tự động chuyển sang bàn Cố vấn (advisor)
    expect(useAppStore.getState().role).toBe('advisor');

    // 5. Kiểm tra dữ liệu hồ sơ: Đơn của sinh viên vẫn còn nguyên vẹn, không bị mất
    const currentPbState = usePlaybackStore.getState();
    expect(currentPbState.submitted).toBe(true);
    expect(currentPbState.waitingTaskIds).toContain('T4');
    expect(currentPbState.scenario?.form.fullName).toBe('Nguyễn Minh Khoa');

    // 6. Giảng viên thực hiện đóng dấu phê duyệt (hoàn thành T4)
    await usePlaybackStore.getState().completeUserTask('T4', 'confirmed');
    expect(usePlaybackStore.getState().waitingTaskIds).not.toContain('T4');
  });

  it('xác thực quyền hạn các bàn khi đăng nhập để hiển thị tab rút gọn (is-locked / role-tab-locked)', () => {
    // Khi Sinh viên đăng nhập: chỉ bàn sinh viên được phép, 4 bàn còn lại bị khóa
    useAuthStore.getState().loginAsStudent('3121102001');
    const { canAccessRole } = useAuthStore.getState();

    const accessible = ROLES.filter((r) => canAccessRole(r.id)).map((r) => r.id);
    const locked = ROLES.filter((r) => !canAccessRole(r.id)).map((r) => r.id);

    expect(accessible).toEqual(['student']);
    expect(locked).toEqual(['system', 'advisor', 'ctsv', 'principal']);

    // Mọi bàn bị khóa đều có shortLabel hợp lệ để render gọn gàng
    ROLES.forEach((r) => {
      expect(r.shortLabel).toBeDefined();
      expect(r.shortLabel.length).toBeLessThanOrEqual(4);
    });
  });

  it('phân biệt rạch ròi sessionMode giữa demo và portal; chặn CaseReport khi ở chế độ portal', async () => {
    // 1. Chế độ demo thông thường
    useAppStore.getState().setSessionMode('demo');
    expect(useAppStore.getState().sessionMode).toBe('demo');

    // Nộp đơn và giải quyết hết ca trong chế độ demo
    await usePlaybackStore.getState().submitApplication({ useScenarioDefaults: true });
    await usePlaybackStore.getState().completeUserTask('T4', 'confirmed');
    await usePlaybackStore.getState().completeUserTask('T5', 'valid');
    await usePlaybackStore.getState().completeUserTask('T9', { signerName: 'PGS.TS. Trần Đình Khôi' });

    // Ca kết thúc, trong chế độ demo: reportVisible sẽ bật
    const pbState = usePlaybackStore.getState();
    const hasEnded = pbState.currentEventLog.some((e) => e.type === 'case.ended');
    expect(hasEnded).toBe(true);
    const isReportVisibleInDemo =
      useAppStore.getState().sessionMode === 'demo' &&
      Boolean(hasEnded) &&
      !pbState.reportDismissed;
    expect(isReportVisibleInDemo).toBe(true);

    // 2. Chuyển sang chế độ portal (đăng nhập)
    useAuthStore.getState().loginAsOfficer('bgh_khoi');
    expect(useAppStore.getState().sessionMode).toBe('portal');

    // Trong chế độ portal: reportVisible TUYỆT ĐỐI KHÔNG BẬT (false)
    const isReportVisibleInPortal =
      useAppStore.getState().sessionMode === 'demo' &&
      Boolean(hasEnded) &&
      !pbState.reportDismissed;
    expect(isReportVisibleInPortal).toBe(false);
  });

  it('khởi tạo phiên sinh viên mới (initStudentSession) xóa sạch phiên cũ và nạp đúng thông tin', () => {
    // 1. Giả định phiên trước đó đã nộp đơn
    usePlaybackStore.getState().initStudentSession({
      mssv: '3121102008',
      name: 'Phan Thanh Tùng',
      className: '46K21.1',
      faculty: 'Khoa Kinh tế',
    });

    const state = usePlaybackStore.getState();
    expect(state.submitted).toBe(false);
    expect(state.submissionDraft?.form.fullName).toBe('Phan Thanh Tùng');
    expect(state.submissionDraft?.form.mssv).toBe('3121102008');
    expect(state.submissionDraft?.form.className).toBe('46K21.1');
    expect(state.submissionDraft?.form.faculty).toBe('Khoa Kinh tế');
    expect(state.currentEventLog).toHaveLength(0);
  });

  it('chuẩn bị nộp lại hồ sơ (prepareStudentResubmission) mở khóa form, sinh mã ca mới và giữ dữ liệu đã điền', async () => {
    // 1. Khởi tạo phiên sinh viên nộp thiếu minh chứng (s2)
    useAppStore.getState().setSessionMode('portal');
    usePlaybackStore.getState().initScenario('s2');

    // Nộp đơn không có minh chứng đính kèm
    await usePlaybackStore.getState().submitApplication();

    const stateAfterSubmit = usePlaybackStore.getState();
    expect(stateAfterSubmit.submitted).toBe(true);
    const hasReturned = stateAfterSubmit.currentEventLog.some(
      (e) => e.type === 'case.ended' && e.endEventId === 'E_END_RETURNED'
    );
    expect(hasReturned).toBe(true);

    const oldCaseCode = useAppStore.getState().caseCode;

    // 2. Sinh viên bấm "Nộp lại hồ sơ khác" -> gọi prepareStudentResubmission
    usePlaybackStore.getState().prepareStudentResubmission();

    const stateAfterResubmit = usePlaybackStore.getState();
    // Đã mở khóa đơn để bổ sung minh chứng và nộp lại
    expect(stateAfterResubmit.submitted).toBe(false);
    expect(stateAfterResubmit.isPlaying).toBe(false);
    expect(stateAfterResubmit.currentEventLog).toHaveLength(0);
    expect(stateAfterResubmit.mapState.caseEnded).toBe(false);

    // Form dữ liệu của sinh viên vẫn được bảo lưu (không bắt gõ lại từ đầu)
    expect(stateAfterResubmit.submissionDraft?.form.fullName).toBe('Trần Thu Hà');
    expect(stateAfterResubmit.submissionDraft?.form.mssv).toBe('3121102002');

    // Mã ca mới được sinh ra
    const newCaseCode = useAppStore.getState().caseCode;
    expect(newCaseCode).not.toBe(oldCaseCode);

    // Dọn dẹp sessionMode sau test
    useAppStore.getState().setSessionMode('demo');
    usePlaybackStore.getState().reset();
  });
});
