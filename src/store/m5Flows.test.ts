import { beforeEach, describe, expect, it } from 'vitest';
import { usePlaybackStore } from './playback';
import { useAppStore } from './useApp';
import { buildCaseReport, findReportEndEvent } from '../data/caseReport';

const pb = () => usePlaybackStore.getState();

async function waitFor(cond: () => boolean, label: string, timeout = 20000): Promise<void> {
  const started = Date.now();
  while (!cond()) {
    if (Date.now() - started > timeout) throw new Error(`Timeout khi chờ: ${label}`);
    await new Promise((r) => setTimeout(r, 10));
  }
}

function report() {
  const state = pb();
  if (!state.engine) throw new Error('Engine chưa khởi tạo');
  return buildCaseReport(state.currentEventLog, state.engine.state, {
    scenario: state.scenario,
    eventDays: state.eventDays,
    day: state.mapState.counters.day,
  });
}

/** Điều kiện App dùng để tự mở báo cáo: có end chính + chưa bị người dùng đóng. */
function reportVisible(): boolean {
  return Boolean(findReportEndEvent(pb().currentEventLog)) && !pb().reportDismissed;
}

async function submit(id: string): Promise<void> {
  pb().initScenario(id);
  await pb().submitApplication({ useScenarioDefaults: true });
}

describe('M5 · luồng cuối ca S2–S5 + cổng báo cáo (headless)', () => {
  beforeEach(() => {
    useAppStore.setState({ mode: 'play', speed: 2, reducedMotion: true });
    usePlaybackStore.setState({ isPlaying: false, isPaused: false, reportDismissed: false });
  });

  it('S2: trả hồ sơ ngay → báo cáo tự mở; đóng rồi mở lại từ HUD; bàn bị khóa', async () => {
    await submit('s2');
    await waitFor(() => pb().mapState.caseEnded, 'S2 kết thúc');

    expect(reportVisible()).toBe(true);
    const data = report();
    expect(data.endEventId).toBe('E_END_RETURNED');
    expect(data.machineRun).toBe(2);
    expect(data.humanRun).toBe(0);
    expect(data.messagesSent).toBe(1);
    expect(data.asIs).toBeNull();

    pb().setReportDismissed(true);
    expect(reportVisible()).toBe(false);
    pb().setReportDismissed(false);
    expect(reportVisible()).toBe(true);

    const logLength = pb().currentEventLog.length;
    await pb().completeUserTask('T4', 'confirmed');
    await pb().advanceDays(3);
    expect(pb().currentEventLog.length).toBe(logLength);
    expect(pb().mapState.counters.day).toBe(0);
  });

  it('S3: nợ học phí → T4/T5 xong → E_END_REJECTED; báo cáo có R3 đỏ', async () => {
    await submit('s3');
    await waitFor(() => pb().waitingTaskIds.includes('T4'), 'T4 chờ');

    await pb().completeUserTask('T4', 'confirmed');
    await waitFor(() => pb().waitingTaskIds.includes('T5'), 'T5 chờ');
    await pb().completeUserTask('T5', 'valid');
    await waitFor(() => pb().mapState.caseEnded, 'S3 kết thúc');

    expect(reportVisible()).toBe(true);
    const data = report();
    expect(data.endEventId).toBe('E_END_REJECTED');
    expect(data.machineRun).toBe(3);
    expect(data.humanRun).toBe(2);
    expect(data.rulesFailed).toBe(1);
    expect(data.rules.find((rule) => rule.id === 'R3')?.passed).toBe(false);
  });

  it('S4: E_END_REMIND không mở báo cáo; chỉ E_END_OK cuối mới mở', async () => {
    await submit('s4');
    await waitFor(() => pb().waitingTaskIds.includes('T4'), 'T4 chờ');

    expect(findReportEndEvent(pb().currentEventLog)).toBeNull();
    expect(reportVisible()).toBe(false);

    await pb().advanceDays(3);
    await waitFor(
      () => pb().currentEventLog.some((event) => event.type === 'timer.fired'),
      'timer.fired'
    );

    const hasRemind = pb().currentEventLog.some(
      (event) => event.type === 'case.ended' && event.endEventId === 'E_END_REMIND'
    );
    expect(hasRemind).toBe(true);
    expect(findReportEndEvent(pb().currentEventLog)).toBeNull();
    expect(reportVisible()).toBe(false);

    await pb().completeUserTask('T4', 'confirmed');
    await waitFor(() => pb().waitingTaskIds.includes('T5'), 'T5 chờ');
    await pb().completeUserTask('T5', 'valid');
    await waitFor(() => pb().waitingTaskIds.includes('T9'), 'T9 chờ');
    await pb().completeUserTask('T9', { signerName: 'PGS.TS. Đoàn Ngọc Phi Anh' });
    await waitFor(() => pb().mapState.caseEnded, 'S4 kết thúc');

    expect(reportVisible()).toBe(true);
    const data = report();
    expect(data.endEventId).toBe('E_END_OK');
    expect(data.machineRun).toBe(6);
    expect(data.humanRun).toBe(3);
    expect(data.remindersFired).toBe(1);
    expect(data.simDays).toBe(3);
  });

  it('S5: CTSV đóng KHÔNG HỢP LỆ → E_END_REJECTED; báo cáo ghi nhận người quyết', async () => {
    await submit('s5');
    await waitFor(() => pb().waitingTaskIds.includes('T4'), 'T4 chờ');

    await pb().completeUserTask('T4', 'confirmed');
    await waitFor(() => pb().waitingTaskIds.includes('T5'), 'T5 chờ');
    await pb().completeUserTask('T5', 'invalid');
    await waitFor(() => pb().mapState.caseEnded, 'S5 kết thúc');

    expect(reportVisible()).toBe(true);
    const data = report();
    expect(data.endEventId).toBe('E_END_REJECTED');
    expect(data.machineRun).toBe(3);
    expect(data.humanRun).toBe(2);
    expect(data.steps.find((step) => step.nodeId === 'T5')?.detail).toBe('Không hợp lệ');
    expect(data.rulesFailed).toBe(0);
  });
});
