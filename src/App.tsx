import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore, Role } from './store/useApp';
import { screenVariants } from './ui/motion';
import { Hud } from './ui/shell/Hud';
import { Title } from './ui/scenes/Title';
import { ScenarioPicker } from './ui/scenes/ScenarioPicker';
import { TypographyTest } from './ui/scenes/TypographyTest';
import { StudentDesk } from './ui/desks/StudentDesk';
import { ControlRoom } from './ui/desks/ControlRoom';
import { AdvisorDesk } from './ui/desks/AdvisorDesk';
import { CtsvDesk } from './ui/desks/CtsvDesk';
import { PrincipalDesk } from './ui/desks/PrincipalDesk';

export const App: React.FC = () => {
  const [isTypography, setIsTypography] = useState(false);
  const {
    screen,
    role,
    setRole,
    toggleMute,
    resetCase,
    cycleSpeed,
    setMode,
  } = useAppStore();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('typography')) {
      setIsTypography(true);
    }
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      switch (e.key) {
        case '1':
          setRole('student');
          break;
        case '2':
          setRole('system');
          break;
        case '3':
          setRole('advisor');
          break;
        case '4':
          setRole('ctsv');
          break;
        case '5':
          setRole('principal');
          break;
        case 'm':
        case 'M':
          toggleMute();
          break;
        case 'r':
        case 'R':
          resetCase();
          break;
        case '+':
        case '=':
        case '-':
          cycleSpeed();
          break;
        case 'p':
        case 'P':
          setMode('play');
          break;
        case 's':
        case 'S':
          setMode('step');
          break;
        case 'd':
        case 'D':
          setMode('director');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setRole, toggleMute, resetCase, cycleSpeed, setMode]);

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
            }}
          >
            <Hud />
            <main
              style={{
                flex: 1,
                position: 'relative',
                overflowY: 'auto',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px 20px',
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
                  }}
                >
                  {renderDesk(role)}
                </motion.div>
              </AnimatePresence>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
