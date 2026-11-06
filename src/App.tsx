import React, { useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { useAppStore, Role } from './store/useApp';
import { usePlaybackStore } from './store/playback';
import { useAuthStore } from './store/useAuth';
import { screenVariants } from './ui/motion';
import { Hud } from './ui/shell/Hud';
import { Settings } from './ui/shell/Settings';
import { SceneWipe } from './ui/shell/SceneWipe';
import { useGlobalPreferences } from './ui/shell/useGlobalPreferences';
import { Title } from './ui/scenes/Title';
import { ScenarioPicker } from './ui/scenes/ScenarioPicker';
import { TypographyTest } from './ui/scenes/TypographyTest';
import { StudentDesk } from './ui/desks/StudentDesk';
import { ControlRoom } from './ui/desks/ControlRoom';
import { AdvisorDesk } from './ui/desks/AdvisorDesk';
import { CtsvDesk } from './ui/desks/CtsvDesk';
import { PrincipalDesk } from './ui/desks/PrincipalDesk';
import { MiniMap } from './ui/shell/MiniMap';
import { CaptionCard } from './ui/shell/CaptionCard';
import { FullscreenMapOverlay } from './ui/map/FullscreenMapOverlay';
import { WorkToast } from './ui/shell/WorkToast';
import { CaseReport } from './ui/scenes/CaseReport';
import { DirectorBanner } from './ui/shell/DirectorBanner';
import { Help } from './ui/shell/Help';
import { AsIs } from './ui/scenes/AsIs';
import { LoginPortal } from './ui/scenes/LoginPortal';
import { findReportEndEvent } from './data/caseReport';
import { initSupabaseSync } from './data/caseRegistry';
import { sfx } from './ui/audio/sfx';
import { DustMotes } from './ui/kit/DustMotes';

export const App: React.FC = () => {
  const [isTypography, setIsTypography] = useState(false);
  const {
    screen,
    role,
    scenarioId,
    sessionMode,
    mode,
    setRole,
    toggleMute,
    resetCase,
    cycleSpeed,
    setMode,
    mapFullscreen,
    toggleMapFullscreen,
    toggleCaptionPinned,
    miniMapVisible,
    toggleMiniMap,
    toggleDevTools,
    reducedMotion,
    settingsOpen,
    setSettingsOpen,
    helpOpen,
    setHelpOpen,
    toggleHelp,
    asIsOpen,
    setAsIsOpen,
  } = useAppStore();

  useGlobalPreferences();

  const initScenario = usePlaybackStore((s) => s.initScenario);
  const stepNext = usePlaybackStore((s) => s.stepNext);
  const advanceDays = usePlaybackStore((s) => s.advanceDays);
  const resetPlayback = usePlaybackStore((s) => s.reset);
  const startDirector = usePlaybackStore((s) => s.startDirector);
  const isPaused = usePlaybackStore((s) => s.isPaused);
  const pause = usePlaybackStore((s) => s.pause);
  const resume = usePlaybackStore((s) => s.resume);
  const reportEnd = usePlaybackStore((s) => findReportEndEvent(s.currentEventLog));
  const reportDismissed = usePlaybackStore((s) => s.reportDismissed);
  const setReportDismissed = usePlaybackStore((s) => s.setReportDismissed);
  const reportVisible = sessionMode === 'demo' && Boolean(reportEnd) && !reportDismissed;
  const canAccessRole = useAuthStore((s) => s.canAccessRole);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('typography')) {
      setIsTypography(true);
    }
  }, []);

  // Initialize Supabase Cloud Sync (if configured)
  useEffect(() => {
    const cleanup = initSupabaseSync();
    return cleanup;
  }, []);

  // Initialize playback when entering desk
  useEffect(() => {
    if (screen === 'desk') {
      const pbState = usePlaybackStore.getState();
      const targetScenario = scenarioId || 's1';
      // Chỉ khởi tạo lại khi chưa có engine, chưa có kịch bản/draft hoặc người dùng đổi kịch bản khác
      if (!pbState.engine || !pbState.scenario || !pbState.submissionDraft || pbState.scenario.id !== targetScenario) {
        initScenario(targetScenario);
      }
      if (mode === 'director') {
        startDirector();
      }
    }
  }, [screen, scenarioId, mode, initScenario, startDirector]);

  // Global keyboard shortcuts (docs/03 mục 8)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Hộp thoại đang mở: chỉ Esc đóng, chặn phím tắt phía sau.
      if (helpOpen) {
        if (e.key === 'Escape') setHelpOpen(false);
        return;
      }
      if (asIsOpen) {
        if (e.key === 'Escape') setAsIsOpen(false);
        return;
      }
      if (settingsOpen) {
        if (e.key === 'Escape') setSettingsOpen(false);
        return;
      }

      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'Escape') {
        if (mapFullscreen) {
          toggleMapFullscreen();
          return;
        }
        if (reportVisible) {
          setReportDismissed(true);
          return;
        }
      }

      switch (e.key) {
        case '1':
          if (canAccessRole('student')) setRole('student');
          else sfx.play('buzz');
          break;
        case '2':
          if (canAccessRole('system')) setRole('system');
          else sfx.play('buzz');
          break;
        case '3':
          if (canAccessRole('advisor')) setRole('advisor');
          else sfx.play('buzz');
          break;
        case '4':
          if (canAccessRole('ctsv')) setRole('ctsv');
          else sfx.play('buzz');
          break;
        case '5':
          if (canAccessRole('principal')) setRole('principal');
          else sfx.play('buzz');
          break;
        case 'b':
        case 'B':
          toggleMapFullscreen();
          break;
        case 'n':
          toggleMiniMap();
          break;
        case ' ':
          e.preventDefault();
          if (mode === 'step') {
            stepNext();
          } else {
            if (isPaused) {
              resume();
            } else {
              pause();
            }
          }
          break;
        case 't':
        case 'T':
          e.preventDefault();
          if (e.repeat) return;
          if (e.shiftKey) {
            sfx.playCalendarTear();
            advanceDays(3);
          } else {
            sfx.playClockTick();
            advanceDays(1);
          }
          break;
        case 'p':
        case 'P':
          toggleCaptionPinned();
          break;
        case 'm':
        case 'M':
          toggleMute();
          break;
        case 'r':
        case 'R':
          resetPlayback();
          resetCase();
          break;
        case '+':
        case '=':
        case '-':
          cycleSpeed();
          break;
        case 's':
        case 'S':
          setMode('step');
          break;
        case 'd':
        case 'D':
          startDirector();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen?.().catch(() => {});
          } else {
            document.exitFullscreen?.().catch(() => {});
          }
          break;
        case '?':
          e.preventDefault();
          toggleHelp();
          break;
        case '`':
          e.preventDefault();
          toggleDevTools();
          break;
        default:
          if (e.key === '/' && e.shiftKey) {
            e.preventDefault();
            toggleHelp();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    setRole,
    toggleMute,
    resetCase,
    cycleSpeed,
    setMode,
    mode,
    mapFullscreen,
    toggleMapFullscreen,
    toggleCaptionPinned,
    toggleMiniMap,
    stepNext,
    advanceDays,
    resetPlayback,
    startDirector,
    isPaused,
    pause,
    resume,
    toggleDevTools,
    reportVisible,
    setReportDismissed,
    settingsOpen,
    setSettingsOpen,
    helpOpen,
    setHelpOpen,
    toggleHelp,
    asIsOpen,
    setAsIsOpen,
    canAccessRole,
  ]);

  if (isTypography) {
    return <TypographyTest />;
  }

  const renderDesk = (activeRole: Role) => {
    switch (activeRole) {
      case 'student':
        return <StudentDesk />;
      case 'system':
        return <ControlRoom />;
      case 'advisor':
        return <AdvisorDesk />;
      case 'ctsv':
        return <CtsvDesk />;
      case 'principal':
        return <PrincipalDesk />;
    }
  };

  return (
    <MotionConfig reducedMotion={reducedMotion ? 'always' : 'never'}>
      <div
        style={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <AnimatePresence mode="wait">
        {screen === 'title' && <Title key="title" />}

        {screen === 'login' && <LoginPortal key="login" initialMode="login" />}

        {screen === 'register' && <LoginPortal key="register" initialMode="register" />}

        {screen === 'scenario' && <ScenarioPicker key="scenario" />}

        {screen === 'desk' && (
          <motion.div
            key="desk-shell"
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100vh',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <DustMotes />
            <Hud />
            {sessionMode === 'demo' && <DirectorBanner />}
            <main
              id="desk-surface"
              className={sessionMode === 'demo' && miniMapVisible ? 'has-minimap' : ''}
              style={{
                flex: 1,
                position: 'relative',
                overflowY: 'auto',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                transition: 'padding 0.2s ease',
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={role}
                  variants={screenVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    width: '100%',
                    marginBlock: 'auto',
                  }}
                >
                  {renderDesk(role)}
                </motion.div>
              </AnimatePresence>
            </main>

            {/* Thanh caption gắn đáy khung — chỉ hiện ở chế độ demo mô phỏng */}
            {sessionMode === 'demo' && <CaptionCard />}

            {/* Bottom-right MiniMap — chỉ hiện ở chế độ demo mô phỏng */}
            {sessionMode === 'demo' && <MiniMap />}

            {/* Toast "có việc mới" (không tự chuyển vai) */}
            <WorkToast />

            {/* Báo cáo cuối ca — chỉ mở ở chế độ demo mô phỏng */}
            {reportVisible && <CaseReport />}

            {/* Fullscreen Map Overlay */}
            {sessionMode === 'demo' && <FullscreenMapOverlay />}
          </motion.div>
        )}
      </AnimatePresence>

      <SceneWipe />
      <Settings />
      <Help />
      <AsIs />
      </div>
    </MotionConfig>
  );
};

export default App;
