import { describe, expect, it } from 'vitest';
import type { EngineEvent } from '../../engine/types';
import { soundForEvent } from './eventSfx';

const cases: Array<{ event: EngineEvent; expected: string | null }> = [
  { event: { type: 'case.started', caseId: 'BL-1' }, expected: 'paper' },
  { event: { type: 'message.sent', flowId: 'MF1', payload: {} }, expected: 'paper' },
  { event: { type: 'data.read', storeId: 'DS1', entityId: 'SV1' }, expected: 'crt' },
  { event: { type: 'timer.fired', timerId: 'TM1', targetNodeId: 'T6', day: 3 }, expected: 'bell' },
  {
    event: { type: 'task.completed', nodeId: 'T1', taskId: 'task-1', outcome: null },
    expected: 'crt',
  },
  {
    event: { type: 'task.completed', nodeId: 'T4', taskId: 'task-4', outcome: 'confirmed' },
    expected: null,
  },
  {
    event: { type: 'rule.evaluated', ruleId: 'R3', passed: false, detail: 'Nợ học phí' },
    expected: 'buzz',
  },
  {
    event: { type: 'case.ended', endEventId: 'E_END_OK', outcome: 'approved' },
    expected: 'chime',
  },
  {
    event: { type: 'case.ended', endEventId: 'E_END_REJECTED', outcome: 'rejected' },
    expected: 'buzz',
  },
  { event: { type: 'node.entered', nodeId: 'T1', tokenId: 'tok-1' }, expected: null },
];

describe('soundForEvent', () => {
  it.each(cases)('trả về $expected', ({ event, expected }) => {
    expect(soundForEvent(event)).toBe(expected);
  });
});
