import { describe, it, expect, beforeEach } from 'vitest';
import { usePlaybackStore } from './playback';
import { useAppStore } from './useApp';
import { ASIS_CONFIG } from '../data/asis.config';
import { buildCaseReport } from '../data/caseReport';

describe('M7 · Presentation Tools & Director Mode Flows', () => {
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

  it('runs scenario S1 to completion automatically in Director mode (DoD)', async () => {
    const playback = usePlaybackStore.getState();
    playback.initScenario('s1');

    useAppStore.getState().setMode('director');

    // Kích hoạt Director
    await playback.startDirector();

    const stateAfter = usePlaybackStore.getState();

    // 1. Hồ sơ đã nộp thành công
    expect(stateAfter.submitted).toBe(true);

    // 2. Ca kết thúc đạt kết cục E_END_OK
    expect(stateAfter.mapState.caseEnded).toBe(true);
    expect(stateAfter.waitingTaskIds.length).toBe(0);

    // 3. Sự kiện kết thúc ca
    const endEvent = stateAfter.currentEventLog.find((e) => e.type === 'case.ended');
    expect(endEvent).toBeDefined();
    if (endEvent && endEvent.type === 'case.ended') {
      expect(endEvent.endEventId).toBe('E_END_OK');
    }

    // 4. CSDL sinh viên được cập nhật Bảo lưu tại T10
    const student = stateAfter.studentRecord;
    expect(student?.status).toBe('Bảo lưu');

    // 5. Thuyết minh đạo diễn được cập nhật
    const caption = useAppStore.getState().directorCaption;
    expect(caption).toContain('🎬 ĐẠO DIỄN');
  });

  it('handles scenario S4 Boundary Timer SLA auto-advance in Director mode', async () => {
    const playback = usePlaybackStore.getState();
    playback.initScenario('s4');

    useAppStore.getState().setMode('director');
    await playback.startDirector();

    const stateAfter = usePlaybackStore.getState();
    expect(stateAfter.mapState.caseEnded).toBe(true);

    // Kiểm tra timer.fired đã được kích hoạt do advisorDelayDays > 3
    const timerFired = stateAfter.currentEventLog.some((e) => e.type === 'timer.fired');
    expect(timerFired).toBe(true);

    // Nhánh nhắc việc E_END_REMIND đã hoàn tất
    const remindEnded = stateAfter.currentEventLog.some(
      (e) => e.type === 'case.ended' && e.endEventId === 'E_END_REMIND'
    );
    expect(remindEnded).toBe(true);

    // Ca chính vẫn kết thúc thành công với E_END_OK
    const okEnded = stateAfter.currentEventLog.some(
      (e) => e.type === 'case.ended' && e.endEventId === 'E_END_OK'
    );
    expect(okEnded).toBe(true);
  });

  it('handles scenario S5 anomaly detection & CTSV invalid stamp in Director mode', async () => {
    const playback = usePlaybackStore.getState();
    playback.initScenario('s5');

    useAppStore.getState().setMode('director');
    await playback.startDirector();

    const stateAfter = usePlaybackStore.getState();
    expect(stateAfter.mapState.caseEnded).toBe(true);

    // S5 kết cục từ chối E_END_REJECTED
    const rejectedEnded = stateAfter.currentEventLog.some(
      (e) => e.type === 'case.ended' && e.endEventId === 'E_END_REJECTED'
    );
    expect(rejectedEnded).toBe(true);

    // Kiểm tra CTSV đã đánh dấu và chốt không hợp lệ
    const inspection = stateAfter.ctsvInspections[stateAfter.scenario!.form.mssv];
    expect(inspection).toBeDefined();
    expect(inspection?.sealed).toBe(true);
    expect(inspection?.result?.outcome).toBe('invalid');
  });

  it('provides valid ASIS_CONFIG with 22 days and integrates into CaseReport', () => {
    expect(ASIS_CONFIG).not.toBeNull();
    expect(ASIS_CONFIG.days).toBe(22);
    expect(ASIS_CONFIG.stations.length).toBe(8);

    // Kiểm tra các trạm chính
    const stationNames = ASIS_CONFIG.stations.map((s) => s.name);
    expect(stationNames).toContain('Tiếp nhận Một Cửa');
    expect(stationNames).toContain('Cố vấn học tập');
    expect(stationNames).toContain('Phòng CTSV');
    expect(stationNames).toContain('Phòng Đào tạo');
    expect(stationNames).toContain('Phòng Kế hoạch - Tài chính');
    expect(stationNames).toContain('Ban Giám hiệu');
    expect(stationNames).toContain('Bộ phận Văn thư');
    expect(stationNames).toContain('Trả kết quả giấy');

    // Chạy thử tạo CaseReport
    const playback = usePlaybackStore.getState();
    playback.initScenario('s1');
    const engine = playback.engine!;

    const report = buildCaseReport(
      [{ type: 'case.ended', endEventId: 'E_END_OK', outcome: 'Bảo lưu thành công' }],
      engine.state,
      {
        scenario: playback.scenario,
        eventDays: [0],
        day: 3,
        asIs: ASIS_CONFIG,
      }
    );

    expect(report.asIs).not.toBeNull();
    expect(report.asIs?.days).toBe(22);
    expect(report.asIs?.stations.length).toBe(8);
    expect(report.simDays).toBe(3);
  });

  it('supports toggling Help and As-Is modals and changing playback modes', () => {
    const app = useAppStore.getState();
    expect(app.helpOpen).toBe(false);
    expect(app.asIsOpen).toBe(false);

    // Toggle Help
    app.toggleHelp();
    expect(useAppStore.getState().helpOpen).toBe(true);
    app.setHelpOpen(false);
    expect(useAppStore.getState().helpOpen).toBe(false);

    // Toggle As-Is
    app.toggleAsIs();
    expect(useAppStore.getState().asIsOpen).toBe(true);
    app.setAsIsOpen(false);
    expect(useAppStore.getState().asIsOpen).toBe(false);

    // Playback mode cycle
    app.setMode('director');
    expect(useAppStore.getState().mode).toBe('director');
    app.setMode('step');
    expect(useAppStore.getState().mode).toBe('step');
    app.setMode('play');
    expect(useAppStore.getState().mode).toBe('play');
  });
});
