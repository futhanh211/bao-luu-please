import { EngineInstance } from '../../engine/engine';
import {
  EngineEvent,
  StudentApplicationForm,
  StudentRecord,
  ReviewerBrief,
} from '../../engine/types';
import { ScenarioConfig } from '../../data/scenarios';
import { StudentChatContext } from '../../data/knowledge-base';
import { ChatMessage } from '../../ai/provider';
import { MapDisplayState } from '../../ui/map/mapState';
import { CtsvResult } from '../../data/inspection';
import { CustomTestDataConfig } from '../../data/customTestData';

export interface SubmissionDraft {
  form: StudentApplicationForm;
  attachedEvidenceIds: string[];
}

export interface SubmitOptions {
  /** Dùng form + toàn bộ minh chứng chuẩn của kịch bản (giữ hành vi M2). */
  useScenarioDefaults?: boolean;
}

/** Kết quả soi của CTSV được giữ theo caseId để đổi vai rồi quay lại vẫn còn. */
export interface CtsvInspectionRecord {
  marks: string[];
  result: CtsvResult | null;
  sealed: boolean;
}

export interface PlaybackStoreState {
  engine: EngineInstance | null;
  scenario: ScenarioConfig | null;
  mapState: MapDisplayState;
  isPlaying: boolean;
  isPaused: boolean;
  isWaitingUserTask: boolean;
  waitingTaskId: string | null;
  waitingTaskIds: string[];
  currentEventLog: EngineEvent[];
  eventDays: number[];
  activeCaptionNodeId: string | null;
  submissionDraft: SubmissionDraft | null;
  submitted: boolean;
  studentRecord: StudentRecord | null;
  disagreements: number;
  ctsvInspections: Record<string, CtsvInspectionRecord>;
  reportDismissed: boolean;
  customTestConfig: CustomTestDataConfig | null;
  isCustomCase: boolean;

  initScenario: (scenarioId: string) => void;
  initStudentSession: (
    student: {
      mssv: string;
      name: string;
      className: string;
      faculty: string;
      email?: string;
      phone?: string;
    },
    scenarioId?: string
  ) => void;
  applyCustomTestData: (config: CustomTestDataConfig) => void;
  start: () => Promise<void>;
  startDirector: () => Promise<void>;
  submitApplication: (options?: SubmitOptions) => Promise<void>;
  updateDraftForm: (patch: Partial<StudentApplicationForm>) => void;
  attachEvidence: (evidenceId: string) => void;
  detachEvidence: (evidenceId: string) => void;
  pause: () => void;
  resume: () => Promise<void>;
  stepNext: () => Promise<void>;
  completeUserTask: (taskId: string, outcome: unknown) => Promise<void>;
  askReviewerBrief: (role: 'advisor' | 'ctsv') => Promise<ReviewerBrief | null>;
  askAssistant: (history: ChatMessage[], ctx: StudentChatContext) => Promise<string>;
  setAiMode: (mode: 'mock' | 'live') => boolean;
  recordHumanDecision: (taskId: string, human: string, ai: string) => void;
  advanceDays: (days: number) => Promise<void>;
  setCtsvMarks: (caseId: string, marks: string[]) => void;
  sealCtsvInspection: (caseId: string, result: CtsvResult) => void;
  setReportDismissed: (dismissed: boolean) => void;
  reset: () => void;
  setActiveCaption: (nodeId: string | null) => void;
}
