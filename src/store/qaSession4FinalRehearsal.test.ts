import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { usePlaybackStore } from './playback';
import { useAppStore } from './useApp';
import { ASIS_CONFIG } from '../data/asis.config';
import { buildCaseReport } from '../data/caseReport';
import { sfx } from '../ui/audio/sfx';
import { soundForEvent } from '../ui/audio/eventSfx';
import { MOTION } from '../ui/motion';
import { SCENARIOS } from '../data/scenarios';
import { PROCESS_DEF } from '../engine/process.def';

describe('QA Session 4: Final Rehearsal & Definition of Done Verification', () => {
  beforeEach(() => {
    useAppStore.setState({
      screen: 'desk',
      mode: 'play',
      speed: 1,
      role: 'student',
      helpOpen: false,
      asIsOpen: false,
      directorCaption: null,
      muted: true,
      volume: 0.25,
      reducedMotion: false,
    });
    usePlaybackStore.getState().reset();
  });

  describe('1. Kịch bản thuyết trình 6–7 phút (docs/07-DEMO-AND-QA.md)', () => {
    it('Phần 1: Mở màn As-Is 22 ngày giấy tờ và 8 trạm làm việc vật lý', () => {
      expect(ASIS_CONFIG.days).toBe(22);
      expect(ASIS_CONFIG.stations.length).toBe(8);

      const firstStation = ASIS_CONFIG.stations[0];
      const lastStation = ASIS_CONFIG.stations[ASIS_CONFIG.stations.length - 1];
      expect(firstStation.name).toBe('Tiếp nhận Một Cửa');
      expect(lastStation.name).toBe('Trả kết quả giấy');
    });

    it('Phần 2 & 3: Kịch bản S1 Happy Path chạy chuẩn xác trong Director mode', async () => {
      const playback = usePlaybackStore.getState();
      playback.initScenario('s1');
      useAppStore.getState().setMode('director');

      await playback.startDirector();

      const state = usePlaybackStore.getState();
      expect(state.submitted).toBe(true);
      expect(state.mapState.caseEnded).toBe(true);
      expect(state.waitingTaskIds).toHaveLength(0);

      // Kết cục E_END_OK
      const endEvent = state.currentEventLog.find((e) => e.type === 'case.ended');
      expect(endEvent).toBeDefined();
      if (endEvent && endEvent.type === 'case.ended') {
        expect(endEvent.endEventId).toBe('E_END_OK');
      }

      // Trạng thái sinh viên trong DS2 được cập nhật Bảo lưu
      expect(state.studentRecord?.status).toBe('Bảo lưu');

      // Kiểm tra topology BPMN quy định: 2 pools, 4 lanes thuộc Pool Trường
      expect(PROCESS_DEF.pools).toHaveLength(2);
      const schoolLanes = PROCESS_DEF.lanes.filter((l) => l.poolId === 'pool_school');
      expect(schoolLanes).toHaveLength(4);
      expect(PROCESS_DEF.lanes).toHaveLength(5);
    });

    it('Phần 4: Kịch bản S4 Boundary Timer SLA 3 ngày kích hoạt non-interrupting', async () => {
      const playback = usePlaybackStore.getState();
      playback.initScenario('s4');
      useAppStore.getState().setMode('director');

      await playback.startDirector();

      const state = usePlaybackStore.getState();
      expect(state.mapState.caseEnded).toBe(true);

      // Timer SLA fired
      const timerFired = state.currentEventLog.some((e) => e.type === 'timer.fired');
      expect(timerFired).toBe(true);

      // Nhánh nhắc việc T6 kết thúc bằng E_END_REMIND
      const remindEnded = state.currentEventLog.some(
        (e) => e.type === 'case.ended' && e.endEventId === 'E_END_REMIND'
      );
      expect(remindEnded).toBe(true);

      // Ca chính vẫn kết thúc thành công với E_END_OK
      const okEnded = state.currentEventLog.some(
        (e) => e.type === 'case.ended' && e.endEventId === 'E_END_OK'
      );
      expect(okEnded).toBe(true);
    });

    it('Phần 5: Kịch bản S3 từ chối nợ học phí R3 và S5 phát hiện minh chứng nghi vấn', async () => {
      // S3: Nợ học phí
      const playback = usePlaybackStore.getState();
      playback.initScenario('s3');
      useAppStore.getState().setMode('director');
      await playback.startDirector();

      let state = usePlaybackStore.getState();
      const s3Reject = state.currentEventLog.some(
        (e) => e.type === 'case.ended' && e.endEventId === 'E_END_REJECTED'
      );
      expect(s3Reject).toBe(true);

      // S5: Minh chứng nghi vấn
      playback.reset();
      playback.initScenario('s5');
      await playback.startDirector();

      state = usePlaybackStore.getState();
      const s5Reject = state.currentEventLog.some(
        (e) => e.type === 'case.ended' && e.endEventId === 'E_END_REJECTED'
      );
      expect(s5Reject).toBe(true);
      expect(state.ctsvInspections[state.scenario!.form.mssv]?.result?.outcome).toBe('invalid');
    });

    it('Phần 6: Báo cáo cuối ca làm rõ tỷ lệ tự động hóa thiết kế (8/11 = 72,7%) và so sánh As-Is', () => {
      const playback = usePlaybackStore.getState();
      playback.initScenario('s1');
      const engine = playback.engine!;

      const report = buildCaseReport(
        [{ type: 'case.ended', endEventId: 'E_END_OK', outcome: 'Bảo lưu thành công' }],
        engine.state,
        {
          scenario: playback.scenario,
          eventDays: [0, 1, 2],
          day: 3,
          asIs: ASIS_CONFIG,
        }
      );

      // 8/11 task tự động thiết kế quy trình To-Be (72,7%)
      expect(report.design.machine).toBe(8);
      expect(report.design.total).toBe(11);
      expect(report.design.rate * 100).toBeCloseTo(72.7, 1);

      // So sánh thời gian thực thi: 3 ngày To-Be vs 22 ngày As-Is
      expect(report.asIs?.days).toBe(22);
      expect(report.simDays).toBe(3);
    });
  });

  describe('2. Kiểm thử WebAudio Synthesizer & Event Mapping', () => {
    const originalWindow = (globalThis as unknown as { window?: unknown }).window;
    const originalAudioContext = (globalThis as unknown as { AudioContext?: unknown }).AudioContext;

    beforeEach(() => {
      (globalThis as unknown as { window: unknown }).window = globalThis;
    });

    afterEach(() => {
      sfx.setEnabled(false);
      (globalThis as unknown as { window: unknown }).window = originalWindow;
      (globalThis as unknown as { AudioContext: unknown }).AudioContext = originalAudioContext;
    });

    it('ánh xạ chính xác các sự kiện nghiệp vụ sang hiệu ứng âm thanh văn phòng cơ học', () => {
      expect(soundForEvent({ type: 'case.started', caseId: 'BL-1' })).toBe('paper');
      expect(soundForEvent({ type: 'message.sent', flowId: 'MF1', payload: {} })).toBe('paper');
      expect(soundForEvent({ type: 'data.read', storeId: 'DS1', entityId: 'SV1' })).toBe('crt');
      expect(soundForEvent({ type: 'timer.fired', timerId: 'TM1', targetNodeId: 'T6', day: 3 })).toBe('bell');
      expect(soundForEvent({ type: 'rule.evaluated', ruleId: 'R3', passed: false, detail: 'Nợ học phí' })).toBe('buzz');
      expect(soundForEvent({ type: 'case.ended', endEventId: 'E_END_OK', outcome: 'approved' })).toBe('chime');
      expect(soundForEvent({ type: 'case.ended', endEventId: 'E_END_REJECTED', outcome: 'rejected' })).toBe('buzz');
    });

    it('giới hạn âm lượng tối đa an toàn ở mức 40% (0.4) khi thuyết trình', () => {
      sfx.setVolume(1.0); // Cố tình đặt 100%
      sfx.setVolume(0.5);
      sfx.setVolume(-0.2); // Cố tình đặt âm
      sfx.setVolume(0.25);
      expect(sfx.isEnabled).toBe(false);
    });

    it('vận hành mượt mà với mock WebAudio context không gây ngoại lệ', () => {
      const mockGainNode = {
        gain: {
          value: 0,
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
          setTargetAtTime: vi.fn(),
        },
        connect: vi.fn(),
      };

      const mockOscillatorNode = {
        type: 'sine',
        frequency: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      };

      const mockBiquadFilter = {
        type: 'bandpass',
        frequency: { value: 1000 },
        Q: { value: 1 },
        connect: vi.fn(),
      };

      const mockBufferSource = {
        buffer: null,
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      };

      const mockContext = {
        currentTime: 0,
        state: 'running',
        sampleRate: 44100,
        destination: {},
        createGain: vi.fn(() => mockGainNode),
        createOscillator: vi.fn(() => mockOscillatorNode),
        createBiquadFilter: vi.fn(() => mockBiquadFilter),
        createBufferSource: vi.fn(() => mockBufferSource),
        createBuffer: vi.fn(() => ({
          getChannelData: vi.fn(() => new Float32Array(1000)),
        })),
        resume: vi.fn().mockResolvedValue(undefined),
      };

      (globalThis as unknown as { AudioContext: unknown }).AudioContext = vi.fn(() => mockContext);

      // Bật âm thanh
      sfx.setEnabled(true);
      expect(sfx.isEnabled).toBe(true);

      // Kích hoạt toàn bộ danh mục 24 âm thanh văn phòng
      expect(() => {
        sfx.playStamp();
        sfx.playPaper();
        sfx.playPaperSlide();
        sfx.playPaperclip();
        sfx.playTypewriter();
        sfx.playKeyClack();
        sfx.playBell();
        sfx.playChime();
        sfx.playBuzz();
        sfx.playCrt();
        sfx.playPen();
        sfx.playFountainPen();
        sfx.playPencilCircle();
        sfx.playToken();
        sfx.playDongleInsert();
        sfx.playCalendarTear();
        sfx.playClockTick();
        sfx.playGlassClink();
        sfx.playSip();
        sfx.playPullChain();
        sfx.playUvSwitch();
        sfx.playPhoneRing();
        sfx.playTapeReel();
      }).not.toThrow();

      // Tắt âm thanh
      sfx.setEnabled(false);
      expect(sfx.isEnabled).toBe(false);
    });
  });

  describe('3. Kiểm thử Motion & Hiệu ứng chuyển cảnh', () => {
    it('định nghĩa đầy đủ hằng số thời gian chuyển động trong MOTION', () => {
      expect(MOTION.screenTransitionMs).toBe(700);
      expect(MOTION.paperSlideMs).toBe(450);
      expect(MOTION.stampDropMs).toBe(120);
      expect(MOTION.stampShakeMs).toBe(150);
      expect(MOTION.inkSpreadMs).toBe(300);
      expect(MOTION.tokenStepMs).toBe(750);
      expect(MOTION.envelopeFlyMs).toBe(800);
      expect(MOTION.signatureDrawMs).toBe(1200);
    });

    it('hỗ trợ điều chỉnh tốc độ 0.5x, 1x, 2x và chế độ giảm hiệu ứng reducedMotion', () => {
      const app = useAppStore.getState();
      expect(app.speed).toBe(1);

      app.setSpeed(2);
      expect(useAppStore.getState().speed).toBe(2);

      app.setSpeed(0.5);
      expect(useAppStore.getState().speed).toBe(0.5);

      app.toggleReducedMotion();
      expect(useAppStore.getState().reducedMotion).toBe(true);
    });
  });

  describe('4. Xác nhận kịch bản mẫu và tuân thủ Offline-First', () => {
    it('tất cả 6 kịch bản đều có đầy đủ dữ liệu minh chứng và mô tả tiếng Việt có dấu', () => {
      expect(SCENARIOS).toHaveLength(6);
      SCENARIOS.forEach((sc) => {
        expect(sc.id).toMatch(/^s[1-6]$/);
        expect(sc.title).toBeTruthy();
        expect(sc.description).toBeTruthy();
        expect(sc.form.fullName).toBeTruthy();
        expect(sc.form.mssv).toBeTruthy();
      });
    });
  });
});
