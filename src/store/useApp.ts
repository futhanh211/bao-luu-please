import { create } from 'zustand';
import { AIStatus } from '../ai/provider';
import { isLiveAvailable } from '../ai/live';

export type Screen = 'title' | 'scenario' | 'desk' | 'report' | 'login' | 'register';
export type Role = 'student' | 'system' | 'advisor' | 'ctsv' | 'principal';
export type PlayMode = 'play' | 'step' | 'director';
export type AppSpeed = 0.5 | 1 | 2;
export type AIMode = 'mock' | 'live';
export type SessionMode = 'demo' | 'portal';

export interface RoleInfo {
  id: Role;
  label: string;
  shortLabel: string;
  shortKey: string;
  subtitle: string;
}

export const ROLES: RoleInfo[] = [
  { id: 'student', label: 'Sinh viên', shortLabel: 'SV', shortKey: '1', subtitle: 'Cổng tiếp nhận trực tuyến (Pool Sinh viên)' },
  { id: 'system', label: 'Hệ thống', shortLabel: 'HT', shortKey: '2', subtitle: 'Phòng điều phối quy trình tự động (Lane L1)' },
  { id: 'advisor', label: 'Cố vấn', shortLabel: 'CV', shortKey: '3', subtitle: 'Bàn Cố vấn học tập (Lane L2 · T4)' },
  { id: 'ctsv', label: 'CTSV', shortLabel: 'CTSV', shortKey: '4', subtitle: 'Bàn Phòng Công tác sinh viên (Lane L3 · T5)' },
  { id: 'principal', label: 'BGH', shortLabel: 'BGH', shortKey: '5', subtitle: 'Bàn Ban Giám hiệu ký số (Lane L4 · T9)' },
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
  /** Âm lượng tổng, tối đa 0.4 (40%) theo 03-UI-UX-DESIGN §7. */
  volume: number;
  reducedMotion: boolean;
  /** Con trỏ chuột phong cách công sở retro (bàn gỗ, con dấu, ngòi bút, kính lúp). */
  customCursor: boolean;
  settingsOpen: boolean;
  aiMode: AIMode;
  /** Nguồn thực tế đang trả lời (mock/live/fallback) — do AIService phát lên. */
  aiStatus: AIStatus;
  /** Điểm chạm AI đang chạy (AI-1…AI-4) hoặc null. */
  aiBusy: string | null;
  /** Có cấu hình live hợp lệ trong .env.local hay không. */
  aiLiveAvailable: boolean;
  captionPinned: boolean;
  mapFullscreen: boolean;
  miniMapVisible: boolean;
  devTools: boolean;
  helpOpen: boolean;
  asIsOpen: boolean;
  directorCaption: string | null;
  sessionMode: SessionMode;

  // Actions
  setScreen: (screen: Screen) => void;
  setCaseCode: (caseCode: string) => void;
  setRole: (role: Role) => void;
  setSessionMode: (sessionMode: SessionMode) => void;
  setMode: (mode: PlayMode) => void;
  setSpeed: (speed: AppSpeed) => void;
  cycleSpeed: () => void;
  setScenario: (scenarioId: string) => void;
  setAiMode: (mode: AIMode) => void;
  setAiStatus: (status: AIStatus) => void;
  setAiBusy: (touchpoint: string | null) => void;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
  toggleReducedMotion: () => void;
  setReducedMotion: (reduced: boolean) => void;
  toggleCustomCursor: () => void;
  setCustomCursor: (customCursor: boolean) => void;
  toggleSettings: () => void;
  setSettingsOpen: (open: boolean) => void;
  toggleHelp: () => void;
  setHelpOpen: (open: boolean) => void;
  toggleAsIs: () => void;
  setAsIsOpen: (open: boolean) => void;
  setDirectorCaption: (caption: string | null) => void;
  toggleCaptionPinned: () => void;
  toggleMapFullscreen: () => void;
  toggleMiniMap: () => void;
  toggleDevTools: () => void;
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
  volume: 0.4,
  reducedMotion: false,
  customCursor: true,
  settingsOpen: false,
  aiMode: 'mock',
  aiStatus: 'mock',
  aiBusy: null,
  aiLiveAvailable: isLiveAvailable(),
  captionPinned: false,
  mapFullscreen: false,
  miniMapVisible: true,
  devTools: false,
  helpOpen: false,
  asIsOpen: false,
  directorCaption: null,
  sessionMode: 'demo',

  setScreen: (screen) => set({ screen }),
  setCaseCode: (caseCode) => set({ caseCode }),
  setRole: (role) => set({ role }),
  setSessionMode: (sessionMode) => set({ sessionMode }),
  setMode: (mode) => set({ mode }),
  setSpeed: (speed) => set({ speed }),
  cycleSpeed: () =>
    set((state) => {
      const speeds: AppSpeed[] = [0.5, 1, 2];
      const nextIdx = (speeds.indexOf(state.speed) + 1) % speeds.length;
      return { speed: speeds[nextIdx] };
    }),
  setScenario: (scenarioId) => set({ scenarioId, screen: 'desk' }),
  setAiMode: (aiMode) => set({ aiMode }),
  setAiStatus: (aiStatus) => set({ aiStatus }),
  setAiBusy: (aiBusy) => set({ aiBusy }),
  toggleMute: () => set((state) => ({ muted: !state.muted })),
  setVolume: (volume) =>
    set({ volume: Math.max(0, Math.min(0.4, Number.isFinite(volume) ? volume : 0)) }),
  toggleReducedMotion: () => set((state) => ({ reducedMotion: !state.reducedMotion })),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  toggleCustomCursor: () => set((state) => ({ customCursor: !state.customCursor })),
  setCustomCursor: (customCursor) => set({ customCursor }),
  toggleSettings: () => set((state) => ({ settingsOpen: !state.settingsOpen })),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  toggleHelp: () => set((state) => ({ helpOpen: !state.helpOpen })),
  setHelpOpen: (helpOpen) => set({ helpOpen }),
  toggleAsIs: () => set((state) => ({ asIsOpen: !state.asIsOpen })),
  setAsIsOpen: (asIsOpen) => set({ asIsOpen }),
  setDirectorCaption: (directorCaption) => set({ directorCaption }),
  toggleCaptionPinned: () => set((state) => ({ captionPinned: !state.captionPinned })),
  toggleMapFullscreen: () => set((state) => ({ mapFullscreen: !state.mapFullscreen })),
  toggleMiniMap: () => set((state) => ({ miniMapVisible: !state.miniMapVisible })),
  toggleDevTools: () => set((state) => ({ devTools: !state.devTools })),
  resetCase: () =>
    set({
      screen: 'scenario',
      role: 'student',
      day: 0,
      scenarioId: null,
      mode: 'play',
      aiBusy: null,
      directorCaption: null,
      helpOpen: false,
      asIsOpen: false,
    }),
}));
