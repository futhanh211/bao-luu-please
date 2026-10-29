import { beforeEach, describe, expect, it } from 'vitest';
import { usePlaybackStore } from './playback';
import { useAppStore } from './useApp';
import { EngineEvent } from '../engine/types';
import { findTaskAssignedDay, hasTimerFired } from '../ui/desks/deskState';

const pb = () => usePlaybackStore.getState();

async function waitFor(cond: () => boolean, label: string, timeout = 20000): Promise<void> {
  const started = Date.now();
  while (!cond()) {
    if (Date.now() - started > timeout) {
      throw new Error(`Timeout khi chờ: ${label}`);
    }
    await new Promise((r) => setTimeout(r, 20));
  }
}

function lastEndEvent(log: EngineEvent[]) {
  for (let i = log.length - 1; i >= 0; i -= 1) {
    const event = log[i];
    if (event.type === 'case.ended') return event;
  }
  return null;
}

async function startAtAdvisor(scenarioId: string) {
  pb().initScenario(scenarioId);
  await pb().submitApplication({ useScenarioDefaults: true });
  await waitFor(() => pb().waitingTaskIds.includes('T4'), 'T4 waiting');
}

describe('M4 · luồng bàn con người qua playback/store (headless)', () => {
  beforeEach(() => {
    useAppStore.setState({ mode: 'play', speed: 2, reducedMotion: true });
    usePlaybackStore.setState({ isPlaying: false, isPaused: false });
  });

  it('S1: nộp → Cố vấn xác nhận → CTSV hợp lệ → BGH ký số → E_END_OK', async () => {
    await startAtAdvisor('s1');

    await pb().completeUserTask('T4', 'confirmed');
    await waitFor(() => pb().waitingTaskIds.includes('T5'), 'T5 waiting');

    const brief = await pb().askReviewerBrief('ctsv');
    expect(brief?.suggestedDecision).toBe('valid');
    if (brief) pb().recordHumanDecision('T5', 'valid', brief.suggestedDecision);
    expect(pb().disagreements).toBe(0);

    await pb().completeUserTask('T5', 'valid');
    await waitFor(() => pb().waitingTaskIds.includes('T9'), 'T9 waiting');

    await pb().completeUserTask('T9', { signerName: 'PGS.TS. Đoàn Ngọc Phi Anh' });
    await waitFor(() => pb().mapState.caseEnded, 'case ended');

    const end = lastEndEvent(pb().currentEventLog);
    expect(end?.type === 'case.ended' ? end.endEventId : null).toBe('E_END_OK');
    expect(pb().mapState.endOutcome).toBe('Bảo lưu thành công');
    expect(pb().disagreements).toBe(0);
    expect(pb().eventDays.length).toBe(pb().currentEventLog.length);
  }, 30000);

  it('S5: theo AI (KHÔNG HỢP LỆ) → E_END_REJECTED, disagreements = 0', async () => {
    await startAtAdvisor('s5');
    await pb().completeUserTask('T4', 'confirmed');
    await waitFor(() => pb().waitingTaskIds.includes('T5'), 'T5 waiting');

    const brief = await pb().askReviewerBrief('ctsv');
    expect(brief?.suggestedDecision).toBe('invalid');
    expect(brief?.points).toHaveLength(3);
    if (brief) pb().recordHumanDecision('T5', 'invalid', brief.suggestedDecision);
    expect(pb().disagreements).toBe(0);

    await pb().completeUserTask('T5', 'invalid');
    await waitFor(() => pb().mapState.caseEnded, 'case ended');

    const end = lastEndEvent(pb().currentEventLog);
    expect(end?.type === 'case.ended' ? end.endEventId : null).toBe('E_END_REJECTED');
    expect(pb().mapState.endOutcome).toBe('Từ chối');
    expect(pb().disagreements).toBe(0);
  }, 30000);

  it('S5: người chọn HỢP LỆ trái AI → disagreements = 1 và có log "Người ≠ AI"', async () => {
    await startAtAdvisor('s5');
    await pb().completeUserTask('T4', 'confirmed');
    await waitFor(() => pb().waitingTaskIds.includes('T5'), 'T5 waiting');

    const brief = await pb().askReviewerBrief('ctsv');
    expect(brief?.suggestedDecision).toBe('invalid');
    if (brief) pb().recordHumanDecision('T5', 'valid', brief.suggestedDecision);

    expect(pb().disagreements).toBe(1);
    const disagreed = pb().currentEventLog.filter((e) => e.type === 'human.disagreed');
    expect(disagreed).toHaveLength(1);

    await pb().completeUserTask('T5', 'valid');
    await waitFor(() => pb().waitingTaskIds.includes('T9'), 'T9 waiting');
    await pb().completeUserTask('T9', { signerName: 'PGS.TS. Đoàn Ngọc Phi Anh' });
    await waitFor(() => pb().mapState.caseEnded, 'case ended');

    const end = lastEndEvent(pb().currentEventLog);
    expect(end?.type === 'case.ended' ? end.endEventId : null).toBe('E_END_OK');
  }, 30000);

  it('S4: chờ quá SLA → advanceDays(3) bắn timer + thư nhắc, T4 xác nhận → E_END_OK', async () => {
    await startAtAdvisor('s4');
    expect(pb().mapState.counters.day).toBe(0);

    await pb().advanceDays(3);
    await waitFor(() => hasTimerFired(pb().currentEventLog), 'timer.fired');
    await waitFor(
      () => Boolean(pb().engine?.state.messages.some((m) => m.recipient === 'advisor')),
      'reminder message'
    );

    const log = pb().currentEventLog;
    expect(pb().mapState.counters.day).toBe(3);
    expect(pb().mapState.caseEnded).toBe(false);
    expect(findTaskAssignedDay(log, pb().eventDays, 'T4')).toBe(0);
    expect(pb().engine?.state.advisor.remindedAt).toBe(3);
    expect(pb().waitingTaskIds.includes('T4')).toBe(true);

    await pb().completeUserTask('T4', 'confirmed');
    await waitFor(() => pb().waitingTaskIds.includes('T5'), 'T5 waiting');
    await pb().completeUserTask('T5', 'valid');
    await waitFor(() => pb().waitingTaskIds.includes('T9'), 'T9 waiting');
    await pb().completeUserTask('T9', { signerName: 'PGS.TS. Đoàn Ngọc Phi Anh' });
    await waitFor(() => pb().mapState.caseEnded, 'case ended');

    const end = lastEndEvent(pb().currentEventLog);
    expect(end?.type === 'case.ended' ? end.endEventId : null).toBe('E_END_OK');
    expect(pb().mapState.caseEnded).toBe(true);
  }, 30000);
});
