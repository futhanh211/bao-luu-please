import { Clock } from './clock';

export type NodeType =
  | 'startMessage'
  | 'startPlain'
  | 'endNone'
  | 'serviceTask'
  | 'sendTask'
  | 'businessRuleTask'
  | 'userTask'
  | 'gatewayXor'
  | 'gatewayAnd'
  | 'boundaryTimer'
  | 'dataObject'
  | 'dataStore';

export interface Node {
  id: string;
  type: NodeType;
  name: string;
  lane: string;
  pool: string;
  config?: Record<string, unknown>;
}

export type EdgeType = 'sequence' | 'message';

export interface Edge {
  id: string;
  from: string;
  to: string;
  label?: string;
  type?: EdgeType;
  condition?: (state: CaseState) => boolean;
  isDefault?: boolean;
}

export interface Pool {
  id: string;
  name: string;
}

export interface Lane {
  id: string;
  poolId: string;
  name: string;
}

export interface ProcessDef {
  pools: Pool[];
  lanes: Lane[];
  nodes: Node[];
  edges: Edge[];
}

export interface Token {
  id: string;
  at: string;
  caseId: string;
  branch?: string;
}

// Student application form data
export interface StudentApplicationForm {
  fullName: string;
  mssv: string;
  className: string;
  faculty: string;
  phone: string;
  email: string;
  reason: 'Ốm đau/tai nạn điều trị dài' | 'Nghĩa vụ quân sự' | 'Hoàn cảnh gia đình' | 'Lý do cá nhân khác';
  semesterCount: 1 | 2;
  startSemester: string;
  commitment: boolean;
}

export interface EvidenceItem {
  id: string;
  type: string;
  name: string;
  content: string;
  issueNotes?: string;
}

export interface ValidityState {
  complete: boolean;
  missing: string[];
  evidenceOk: boolean;
}

export interface RuleResultState {
  pass: boolean;
  violations: string[];
}

export interface AdvisorState {
  status: 'pending' | 'confirmed' | 'declined';
  remindedAt?: number;
}

export interface CtsvState {
  status: 'pending' | 'valid' | 'invalid';
  notes?: string;
}

export interface SentMessage {
  id: string;
  flowId?: string;
  recipient: 'student' | 'advisor';
  title: string;
  content: string;
  day: number;
  attachments?: string[];
}

export interface DecisionDoc {
  number: string;
  decisionDate: string;
  studentName: string;
  mssv: string;
  faculty: string;
  durationSemesters: number;
  startSemester: string;
  basisText: string;
  signed: boolean;
  signerName?: string;
}

// Exactly matches 01-PROCESS-SPEC.md section 5
export interface CaseState {
  caseId: string;
  form: StudentApplicationForm;
  evidence: EvidenceItem[];
  validity: ValidityState;
  ruleResult: RuleResultState;
  advisor: AdvisorState;
  ctsv: CtsvState;
  eligible: boolean;
  studentStatus: 'Đang học' | 'Bảo lưu';
  messages: SentMessage[];
  decisionDoc?: DecisionDoc;
  dataObjects: {
    DO1: boolean; // Hồ sơ bảo lưu
    DO2: boolean; // Dự thảo quyết định
    DO3: boolean; // Quyết định nghỉ học tạm thời
  };
}

// Events specified in 04-ARCHITECTURE.md section 4.3
export type EngineEvent =
  | { type: 'case.started'; caseId: string }
  | { type: 'node.entered'; nodeId: string; tokenId: string }
  | { type: 'node.completed'; nodeId: string; tokenId: string; outcome?: unknown }
  | { type: 'edge.traversed'; edgeId: string; tokenId: string; from: string; to: string }
  | { type: 'token.split'; fromTokenId: string; newTokens: string[] }
  | { type: 'token.merged'; mergedTokenIds: string[]; resultingTokenId: string }
  | { type: 'task.assigned'; nodeId: string; lane: string; taskId: string }
  | { type: 'task.completed'; nodeId: string; taskId: string; outcome: unknown }
  | { type: 'rule.evaluated'; ruleId: string; passed: boolean; detail: string }
  | { type: 'message.sent'; flowId: string; payload: unknown }
  | { type: 'data.read'; storeId: string; entityId: string }
  | { type: 'data.written'; storeId: string; entityId: string; payload: unknown }
  | { type: 'dataobject.changed'; id: string; stage: string; payload?: unknown }
  | { type: 'timer.scheduled'; timerId: string; targetNodeId: string; fireAtDay: number }
  | { type: 'timer.fired'; timerId: string; targetNodeId: string; day: number }
  | { type: 'ai.requested'; touchpoint: string; source: string; payload?: unknown }
  | { type: 'ai.responded'; touchpoint: string; source: string; result: unknown }
  | { type: 'case.ended'; endEventId: string; outcome: string };

// Database interfaces for dependency injection
export interface StudentRecord {
  mssv: string;
  name: string;
  className: string;
  faculty: string;
  phone: string;
  email: string;
  status: 'Đang học' | 'Bảo lưu';
}

export interface AcademicFinanceRecord {
  mssv: string;
  semestersCompleted: number;
  gpaNote: string;
  discipline: 'none' | 'warning' | 'suspended';
  tuitionDebt: number;
  forcedWithdrawal: boolean;
}

export interface StudentsDB {
  get(mssv: string): StudentRecord | undefined;
  updateStudentStatus(mssv: string, status: 'Đang học' | 'Bảo lưu'): void;
}

export interface AcademicFinanceDB {
  get(mssv: string): AcademicFinanceRecord | undefined;
}

// Forward declare AIProvider interface (defined in ai/provider.ts)
export interface DocScanInput {
  form: StudentApplicationForm;
  evidence: EvidenceItem[];
}

export interface DocScanResult {
  evidenceType: string;
  typeMatchesReason: boolean;
  extracted: Record<string, string>;
  anomalies: { field: string; issue: string; severity: 'low' | 'medium' | 'high' }[];
  confidence: number;
}

export interface ReviewerBrief {
  summary: string;
  points: string[];
  suggestedDecision: 'confirm' | 'decline' | 'valid' | 'invalid';
  rationale: string;
}

export interface AIProvider {
  mode: 'mock' | 'live';
  analyzeDocuments(input: DocScanInput): Promise<DocScanResult>;
  chat(history: unknown[], ctx: unknown): Promise<string>;
  reviewerBrief(role: 'advisor' | 'ctsv', ctx: unknown): Promise<ReviewerBrief>;
  draftText(kind: 'return' | 'reject' | 'decisionBasis', ctx: unknown): Promise<string>;
}

export interface EngineDeps {
  clock: Clock;
  ai: AIProvider;
  db: {
    ds1: AcademicFinanceDB;
    ds2: StudentsDB;
  };
  random?: () => number;
}
