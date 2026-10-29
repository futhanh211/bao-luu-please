import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './useApp';

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState({
      screen: 'title',
      role: 'student',
      mode: 'play',
      speed: 1,
      muted: true,
      day: 0,
      scenarioId: null,
      customCursor: true,
    });
  });

  it('changes screen correctly', () => {
    const { setScreen } = useAppStore.getState();
    setScreen('scenario');
    expect(useAppStore.getState().screen).toBe('scenario');
  });

  it('switches role correctly', () => {
    const { setRole } = useAppStore.getState();
    setRole('advisor');
    expect(useAppStore.getState().role).toBe('advisor');
    setRole('principal');
    expect(useAppStore.getState().role).toBe('principal');
  });

  it('cycles speed correctly', () => {
    const { cycleSpeed } = useAppStore.getState();
    expect(useAppStore.getState().speed).toBe(1);
    cycleSpeed();
    expect(useAppStore.getState().speed).toBe(2);
    cycleSpeed();
    expect(useAppStore.getState().speed).toBe(0.5);
    cycleSpeed();
    expect(useAppStore.getState().speed).toBe(1);
  });

  it('sets scenario and navigates to desk', () => {
    const { setScenario } = useAppStore.getState();
    setScenario('s1');
    expect(useAppStore.getState().scenarioId).toBe('s1');
    expect(useAppStore.getState().screen).toBe('desk');
  });

  it('toggles and sets customCursor correctly', () => {
    const { toggleCustomCursor, setCustomCursor } = useAppStore.getState();
    expect(useAppStore.getState().customCursor).toBe(true);
    toggleCustomCursor();
    expect(useAppStore.getState().customCursor).toBe(false);
    setCustomCursor(true);
    expect(useAppStore.getState().customCursor).toBe(true);
  });

  it('provides valid short labels for all 5 roles for compact responsive HUD', async () => {
    const { ROLES } = await import('./useApp');
    expect(ROLES).toHaveLength(5);
    const shortLabels = ROLES.map((r) => r.shortLabel);
    expect(shortLabels).toEqual(['SV', 'HT', 'CV', 'CTSV', 'BGH']);
  });
});
