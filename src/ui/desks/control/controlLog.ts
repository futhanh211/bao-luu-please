import { EngineEvent } from '../../../engine/types';
import { PROCESS_DEF } from '../../../engine/process.def';
import { DocScanResult, ReviewerBrief } from '../../../engine/types';

const DECISION_LABEL: Record<ReviewerBrief['suggestedDecision'], string> = {
  confirm: 'XÁC NHẬN',
  decline: 'KHÔNG XÁC NHẬN',
  valid: 'HỢP LỆ',
  invalid: 'KHÔNG HỢP LỆ',
};

function truncate(text: string, max = 48): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

export type ControlTone = 'info' | 'ok' | 'warn' | 'fail';

export interface ControlLine {
  id: string;
  tag: string;
  kind: string;
  text: string;
  tone: ControlTone;
}

export interface ControlLogContext {
  /** Số minh chứng của ca — dùng cho dòng DocScan. */
  evidenceCount?: number;
}

const LANE_LABEL: Record<string, string> = {
  L2: 'Cố vấn',
  L3: 'CTSV',
  L4: 'BGH',
  lane_student: 'Sinh viên',
};

const TASK_KIND: Record<string, string> = {
  serviceTask: 'SERVICE',
  sendTask: 'SEND',
  businessRuleTask: 'RULE',
  userTask: 'USER',
};

const MESSAGE_LINE: Record<string, { tag: string; text: string }> = {
  MF1: { tag: 'MF1', text: 'SEND  Sinh viên → Trường: Đơn + minh chứng (MF1)' },
  MF2: { tag: 'T2', text: 'SEND  → Sinh viên: Thông báo hồ sơ chưa hợp lệ (MF2)' },
  MF3: { tag: 'T7', text: 'SEND  → Sinh viên: Thông báo không đủ điều kiện (MF3)' },
  MF4: { tag: 'T11', text: 'SEND  → Sinh viên: Quyết định đã ký số (MF4)' },
  INTERNAL_ADVISOR_REMIND: { tag: 'T6', text: 'SEND  → Cố vấn: nhắc việc quá hạn SLA' },
};

const DOC_STAGE: Record<string, string> = {
  created: 'tạo mới',
  drafted: 'soạn dự thảo',
  signed: 'đã ký số',
};

const DOC_NODE: Record<string, string> = { DO1: 'T1', DO2: 'T8', DO3: 'T9' };

function nodeName(nodeId: string): string {
  return PROCESS_DEF.nodes.find((n) => n.id === nodeId)?.name ?? nodeId;
}

function nodeType(nodeId: string): string {
  return PROCESS_DEF.nodes.find((n) => n.id === nodeId)?.type ?? '';
}

function nextGatewayTarget(log: EngineEvent[], index: number, nodeId: string): string | null {
  for (let i = index + 1; i < log.length; i += 1) {
    const event = log[i];
    if (event.type === 'edge.traversed' && event.from === nodeId) return event.to;
  }
  return null;
}

function line(
  index: number,
  tag: string,
  kind: string,
  text: string,
  tone: ControlTone = 'info'
): ControlLine {
  return { id: `ctl_${index}`, tag, kind, text, tone };
}

function fromEntered(event: Extract<EngineEvent, { type: 'node.entered' }>, index: number): ControlLine | null {
  const type = nodeType(event.nodeId);
  const kind = TASK_KIND[type];
  if (!kind) return null;
  if (type === 'userTask') return null; // log khi task.assigned để có lane
  if (type === 'serviceTask') {
    return line(index, event.nodeId, 'SERVICE', `bắt đầu: ${nodeName(event.nodeId)}`);
  }
  if (type === 'sendTask') {
    return line(index, event.nodeId, 'SEND', `soạn thông điệp: ${nodeName(event.nodeId)}`);
  }
  return line(index, event.nodeId, 'RULE', 'nạp bộ luật R1–R4 và gọi DS1');
}

function fromCompleted(
  event: Extract<EngineEvent, { type: 'node.completed' }>,
  index: number,
  log: EngineEvent[]
): ControlLine | null {
  const type = nodeType(event.nodeId);
  if (type === 'serviceTask') {
    return line(index, event.nodeId, 'SERVICE', `${nodeName(event.nodeId)} … OK`, 'ok');
  }
  if (type === 'sendTask') {
    return line(index, event.nodeId, 'SEND', `${nodeName(event.nodeId)} → đã gửi`, 'ok');
  }
  if (type === 'businessRuleTask') {
    return line(index, event.nodeId, 'RULE', 'hoàn tất đối chiếu điều kiện', 'ok');
  }
  if (type === 'gatewayXor') {
    const target = nextGatewayTarget(log, index, event.nodeId);
    const answer = target === 'T2' || target === 'T7' ? 'KHÔNG' : 'CÓ';
    return line(index, event.nodeId, 'XOR', `${nodeName(event.nodeId)} → ${answer}`, answer === 'CÓ' ? 'ok' : 'warn');
  }
  return null;
}

function fromTaskAssigned(
  event: Extract<EngineEvent, { type: 'task.assigned' }>,
  index: number
): ControlLine {
  const who = LANE_LABEL[event.lane] ?? event.lane;
  return line(index, event.nodeId, 'USER', `chờ ${who}…`, 'warn');
}

function fromTaskCompleted(
  event: Extract<EngineEvent, { type: 'task.completed' }>,
  index: number
): ControlLine {
  const outcome = event.outcome;
  let answer = String(outcome);
  if (event.taskId === 'T4') answer = outcome === 'confirmed' ? 'XÁC NHẬN' : 'KHÔNG XÁC NHẬN';
  if (event.taskId === 'T5') answer = outcome === 'valid' ? 'HỢP LỆ' : 'KHÔNG HỢP LỆ';
  if (event.taskId === 'T9') answer = 'ĐÃ KÝ SỐ';
  const who = event.taskId === 'T4' ? 'Cố vấn' : event.taskId === 'T5' ? 'CTSV' : 'BGH';
  return line(index, event.taskId, 'USER', `${who}: ${answer}`, 'ok');
}

function fromRule(
  event: Extract<EngineEvent, { type: 'rule.evaluated' }>,
  index: number
): ControlLine {
  const mark = event.passed ? '✓' : '✗';
  return line(
    index,
    'T3',
    'RULE',
    `${event.ruleId} ${mark}  ${event.detail}`,
    event.passed ? 'ok' : 'fail'
  );
}

function fromAi(
  event: Extract<EngineEvent, { type: 'ai.responded' }>,
  index: number,
  context: ControlLogContext
): ControlLine {
  const result = event.result;
  if (result && typeof result === 'object') {
    if ('confidence' in result) {
      const scan = result as DocScanResult;
      const count = context.evidenceCount ?? 1;
      return line(
        index,
        event.touchpoint,
        'AI',
        `DocScan  đọc ${count} minh chứng … confidence ${scan.confidence.toFixed(2)}`,
        scan.anomalies.length > 0 ? 'warn' : 'ok'
      );
    }
    if ('suggestedDecision' in result && 'summary' in result) {
      const brief = result as ReviewerBrief;
      return line(
        index,
        event.touchpoint,
        'AI',
        `Brief  ${truncate(brief.summary)} → ${DECISION_LABEL[brief.suggestedDecision]}`,
        'ok'
      );
    }
  }
  if (typeof result === 'string') {
    return line(index, event.touchpoint, 'AI', `Draft  ${truncate(result)}`, 'ok');
  }
  return line(index, event.touchpoint, 'AI', `Draft  soạn văn bản (${event.source})`, 'ok');
}

/** EngineEvent → dòng log CRT. Hàm THUẦN, không phụ thuộc React/DOM. */
export function buildControlLines(
  log: EngineEvent[],
  context: ControlLogContext = {}
): ControlLine[] {
  const lines: ControlLine[] = [];

  log.forEach((event, index) => {
    switch (event.type) {
      case 'case.started':
        lines.push(line(index, 'CASE', 'START', `mở ca ${event.caseId} · nhận đơn trực tuyến`));
        break;
      case 'node.entered': {
        const item = fromEntered(event, index);
        if (item) lines.push(item);
        break;
      }
      case 'node.completed': {
        const item = fromCompleted(event, index, log);
        if (item) lines.push(item);
        break;
      }
      case 'token.split':
        lines.push(
          line(index, 'G2', 'AND', `tách ${event.newTokens.length} nhánh: T3 | T4 | T5`, 'ok')
        );
        break;
      case 'token.merged':
        lines.push(
          line(index, 'G3', 'AND', `hội tụ ${event.mergedTokenIds.length} nhánh → G4`, 'ok')
        );
        break;
      case 'task.assigned':
        lines.push(fromTaskAssigned(event, index));
        break;
      case 'task.completed':
        lines.push(fromTaskCompleted(event, index));
        break;
      case 'rule.evaluated':
        lines.push(fromRule(event, index));
        break;
      case 'message.sent': {
        const mapped = MESSAGE_LINE[event.flowId];
        if (mapped) {
          lines.push(line(index, mapped.tag, 'SEND', mapped.text, 'ok'));
        }
        break;
      }
      case 'data.read': {
        const tag = event.storeId === 'DS1' ? 'T3' : 'T1';
        lines.push(line(index, tag, 'DATA', `${event.storeId} ← đọc hồ sơ ${event.entityId}`));
        break;
      }
      case 'data.written': {
        const payload = event.payload as { status?: string } | undefined;
        const status = payload?.status ? ` = ${payload.status}` : '';
        lines.push(line(index, 'T10', 'DATA', `${event.storeId} → ghi status${status}`, 'ok'));
        break;
      }
      case 'dataobject.changed': {
        const tag = DOC_NODE[event.id] ?? event.id;
        lines.push(
          line(index, tag, 'DOC', `${event.id} ${nodeName(event.id)} → ${DOC_STAGE[event.stage] ?? event.stage}`, 'ok')
        );
        break;
      }
      case 'timer.scheduled':
        lines.push(line(index, 'BT1', 'TIMER', `hẹn nhắc việc vào ngày ${event.fireAtDay}`));
        break;
      case 'timer.fired':
        lines.push(
          line(index, 'BT1', 'TIMER', `đủ 3 ngày làm việc → kích hoạt T6`, 'warn')
        );
        break;
      case 'ai.requested':
        lines.push(
          line(index, event.touchpoint, 'AI', `yêu cầu ${event.touchpoint} từ ${event.source}…`)
        );
        break;
      case 'ai.responded':
        lines.push(fromAi(event, index, context));
        break;
      case 'human.disagreed':
        lines.push(
          line(index, event.taskId, 'USER', `⚠ Người ≠ AI (${event.human} / ${event.ai})`, 'warn')
        );
        break;
      case 'case.ended':
        lines.push(
          line(
            index,
            'END',
            'STOP',
            event.endEventId === 'E_END_REMIND'
              ? 'Hoàn tất nhắc việc (nhánh phụ)'
              : event.outcome,
            event.endEventId === 'E_END_REMIND' ? 'warn' : 'ok'
          )
        );
        break;
      default:
        break;
    }
  });

  return lines;
}
