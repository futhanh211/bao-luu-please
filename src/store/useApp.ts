import { create } from 'zustand';

export type Screen = 'title' | 'scenario' | 'desk' | 'report';
export type Role = 'student' | 'system' | 'advisor' | 'ctsv' | 'principal';
export type PlayMode = 'play' | 'step' | 'director';
export type AppSpeed = 0.5 | 1 | 2;
export type AIMode = 'mock' | 'live';

export interface RoleInfo {
  id: Role;
  label: string;
  shortKey: string;
  subtitle: string;
}

export const ROLES: RoleInfo[] = [
  { id: 'student', label: 'Sinh viên', shortKey: '1', subtitle: 'Cổng tiếp nhận trực tuyến (Pool Sinh viên)' },
  { id: 'system', label: 'Hệ thống', shortKey: '2', subtitle: 'Phòng điều phối quy trình tự động (Lane L1)' },
  { id: 'advisor', label: 'Cố vấn', shortKey: '3', subtitle: 'Bàn Cố vấn học tập (Lane L2 · T4)' },
  { id: 'ctsv', label: 'CTSV', shortKey: '4', subtitle: 'Bàn Phòng Công tác sinh viên (Lane L3 · T5)' },
  { id: 'principal', label: 'BGH', shortKey: '5', subtitle: 'Bàn Ban Giám hiệu ký số (Lane L4 · T9)' },
];

interface AppState {
  screen: Screen;
  role: Role;
  mode: PlayMode;
  speed: AppSpeed;
  day: number;
  caseCode: string;
  scenarioId: string | null;
  muted: boolean;
  reducedMotion: boolean;
  aiMode: AIMode;
  captionPinned: boolean;
  mapFullscreen: boolean;

  // Actions
  setScreen: (screen: Screen) => void;
  setRole: (role: Role) => void;
  setMode: (mode: PlayMode) => void;
  setSpeed: (speed: AppSpeed) => void;
  cycleSpeed: () => void;
  setScenario: (scenarioId: string) => void;
  toggleMute: () => void;
  toggleReducedMotion: () => void;
  toggleCaptionPinned: () => void;
  toggleMapFullscreen: () => void;
  resetCase: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  screen: 'title',
  role: 'student',
  mode: 'play',
  speed: 1,
  day: 0,
  caseCode: 'BL-2026-88',
  scenarioId: null,
  muted: true,
  reducedMotion: false,
  aiMode: 'mock',
  captionPinned: false,
  mapFullscreen: false,

  setScreen: (screen) => set({ screen }),
  setRole: (role) => set({ role }),
  setMode: (mode) => set({ mode }),
  setSpeed: (speed) => set({ speed }),
  cycleSpeed: () =>
    set((state) => {
      const speeds: AppSpeed[] = [0.5, 1, 2];
      const nextIdx = (speeds.indexOf(state.speed) + 1) % speeds.length;
      return { speed: speeds[nextIdx] };
    }),
  setScenario: (scenarioId) => set({ scenarioId, screen: 'desk' }),
  toggleMute: () => set((state) => ({ muted: !state.muted })),
  toggleReducedMotion: () => set((state) => ({ reducedMotion: !state.reducedMotion })),
  toggleCaptionPinned: () => set((state) => ({ captionPinned: !state.captionPinned })),
  toggleMapFullscreen: () => set((state) => ({ mapFullscreen: !state.mapFullscreen })),
  resetCase: () =>
    set({
      screen: 'scenario',
      role: 'student',
      day: 0,
      scenarioId: null,
      mode: 'play',
    }),
}));
