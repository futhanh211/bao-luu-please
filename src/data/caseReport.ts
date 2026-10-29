import { PROCESS_DEF } from '../engine/process.def';
import { CaseState, EngineEvent, NodeType } from '../engine/types';
import { ScenarioConfig } from './scenarios';
import { AsIsConfig } from './asis.config';

export type ReportActor = 'MÁY' | 'NGƯỜI';
export type ReportOutcomeKind = 'success' | 'rejected' | 'returned' | 'unknown';
export type CaseEndedEvent = Extract<EngineEvent, { type: 'case.ended' }>;

export interface ReportStep {
  nodeId: string;
  name: string;
  actor: ReportActor;
  day: number;
  detail: string;
}

export interface ReportRule {
  id: string;
  passed: boolean;
  detail: string;
}

export interface CaseReport {
  caseId: string;
  scenarioCode: string;
  scenarioTitle: string;
  studentName: string;
  mssv: string;
  faculty: string;
  outcome: string;
  endEventId: string;
  outcomeKind: ReportOutcomeKind;
  simDays: number;
  machineRun: number;
  humanRun: number;
  /** Tỉ lệ tự động thực tế của ca (0..1), tính từ event. */
  automationRate: number;
  /** Chỉ số thiết kế tĩnh của quy trình To-Be. */
  design: { machine: number; total: number; rate: number };
  messagesSent: number;
  dbReads: number;
  dbWrites: number;
  aiTouches: number;
  disagreements: number;
  remindersFired: number;
  rulesFailed: number;
  rules: ReportRule[];
  steps: ReportStep[];
  asIs: AsIsConfig | null;
  decisionNumber: string | null;
}

export interface CaseReportExtras {
  scenario?: ScenarioConfig | null;
  /** Ngày giả lập song song với events (playback ghi lại). */
  eventDays?: number[];
  /** Ngày hiện tại của ca (đồng hồ engine). */
  day?: number;
  asIs?: AsIsConfig | null;
}

/** Chỉ 3 end event chính mới mở báo cáo; E_END_REMIND là nhánh nhắc việc. */
export const MAIN_END_EVENT_IDS = ['E_END_OK', 'E_END_REJECTED', 'E_END_RETURNED'] as const;

const MACHINE_TYPES: NodeType[] = ['serviceTask', 'sendTask', 'businessRuleTask'];
const STUDENT_FLOWS = ['MF2', 'MF3', 'MF4'];

const NODE_BY_ID = new Map(PROCESS_DEF.nodes.map((node) => [node.id, node]));

const DESIGN_TASKS = PROCESS_DEF.nodes.filter(
  (node) =>
    node.lane !== 'lane_student' &&
    (MACHINE_TYPES.includes(node.type) || node.type === 'userTask')
);
const DESIGN_MACHINE = DESIGN_TASKS.filter((node) => MACHINE_TYPES.includes(node.type)).length;

export function isMainEndEvent(event: EngineEvent): event is CaseEndedEvent {
  return (
    event.type === 'case.ended' &&
    (MAIN_END_EVENT_IDS as readonly string[]).includes(event.endEventId)
  );
}

/** End event chính cuối cùng (bỏ qua nhánh nhắc việc E_END_REMIND). */
export function findReportEndEvent(events: EngineEvent[]): CaseEndedEvent | null {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = events[i];
    if (isMainEndEvent(event)) return event;
  }
  return null;
}

function outcomeKind(endEventId: string): ReportOutcomeKind {
  if (endEventId === 'E_END_OK') return 'success';
  if (endEventId === 'E_END_REJECTED') return 'rejected';
  if (endEventId === 'E_END_RETURNED') return 'returned';
  return 'unknown';
}

function humanDetail(nodeId: string, outcome: unknown): string {
  if (nodeId === 'T4') {
    if (outcome === 'confirmed') return 'Xác nhận bảo lưu';
    if (outcome === 'declined') return 'Không xác nhận';
    return 'Đã xử lý';
  }
  if (nodeId === 'T5') {
    if (outcome === 'valid') return 'Hợp lệ';
    if (outcome === 'invalid') return 'Không hợp lệ';
    return 'Đã xử lý';
  }
  if (nodeId === 'T9') return 'Đã ký số';
  return 'Đã xử lý';
}

function machineDetail(type: NodeType): string {
  if (type === 'sendTask') return 'Gửi thông điệp';
  if (type === 'businessRuleTask') return 'Đối chiếu R1–R4';
  return 'Xử lý tự động';
}

function buildSteps(events: EngineEvent[], eventDays: number[]): ReportStep[] {
  const steps: ReportStep[] = [];
  const seen = new Set<string>();

  events.forEach((event, index) => {
    if (event.type !== 'node.completed') return;
    const node = NODE_BY_ID.get(event.nodeId);
    if (!node) return;
    if (node.lane === 'lane_student') return; // đơn của SV không tính vào quy trình trường
    const isMachine = MACHINE_TYPES.includes(node.type);
    const isHuman = node.type === 'userTask';
    if (!isMachine && !isHuman) return;
    if (seen.has(node.id)) return;
    seen.add(node.id);

    steps.push({
      nodeId: node.id,
      name: node.name,
      actor: isMachine ? 'MÁY' : 'NGƯỜI',
      day: eventDays[index] ?? 0,
      detail: isMachine ? machineDetail(node.type) : humanDetail(node.id, event.outcome),
    });
  });

  return steps;
}

/**
 * Dựng báo cáo cuối ca từ event log thật + state engine.
 * Hàm THUẦN: không đọc store, không phụ thuộc React/DOM.
 */
export function buildCaseReport(
  events: EngineEvent[],
  caseState: CaseState,
  extras: CaseReportExtras = {}
): CaseReport {
  const endEvent = findReportEndEvent(events);
  const steps = buildSteps(events, extras.eventDays ?? []);
  const machineRun = steps.filter((step) => step.actor === 'MÁY').length;
  const humanRun = steps.filter((step) => step.actor === 'NGƯỜI').length;
  const totalRun = machineRun + humanRun;

  const rules: ReportRule[] = events.flatMap((event) =>
    event.type === 'rule.evaluated'
      ? [{ id: event.ruleId, passed: event.passed, detail: event.detail }]
      : []
  );

  const messagesSent = events.filter(
    (event) => event.type === 'message.sent' && STUDENT_FLOWS.includes(event.flowId)
  ).length;

  return {
    caseId: caseState.caseId,
    scenarioCode: extras.scenario?.code ?? caseState.caseId,
    scenarioTitle: extras.scenario?.title ?? '',
    studentName: caseState.form.fullName || extras.scenario?.studentName || '—',
    mssv: caseState.form.mssv,
    faculty: caseState.form.faculty,
    outcome: endEvent?.outcome ?? 'Chưa kết thúc',
    endEventId: endEvent?.endEventId ?? '',
    outcomeKind: outcomeKind(endEvent?.endEventId ?? ''),
    simDays: extras.day ?? 0,
    machineRun,
    humanRun,
    automationRate: totalRun > 0 ? machineRun / totalRun : 0,
    design: {
      machine: DESIGN_MACHINE,
      total: DESIGN_TASKS.length,
      rate: DESIGN_TASKS.length > 0 ? DESIGN_MACHINE / DESIGN_TASKS.length : 0,
    },
    messagesSent,
    dbReads: events.filter((event) => event.type === 'data.read').length,
    dbWrites: events.filter((event) => event.type === 'data.written').length,
    aiTouches: events.filter((event) => event.type === 'ai.responded').length,
    disagreements: events.filter((event) => event.type === 'human.disagreed').length,
    remindersFired: events.filter((event) => event.type === 'timer.fired').length,
    rulesFailed: rules.filter((rule) => !rule.passed).length,
    rules,
    steps,
    asIs: extras.asIs ?? null,
    decisionNumber: caseState.decisionDoc?.number ?? null,
  };
}
