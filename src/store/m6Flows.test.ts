import { beforeEach, describe, expect, it } from 'vitest';
import { usePlaybackStore } from './playback';
import { useAppStore } from './useApp';
import { EngineEvent } from '../engine/types';

const pb = () => usePlaybackStore.getState();

function ai3Pairs(log: EngineEvent[], source: string): EngineEvent[] {
  return log.filter(
    (event) =>
      (event.type === 'ai.requested' || event.type === 'ai.responded') &&
      event.touchpoint === 'AI-3' &&
      event.source === source
  );
}

describe('M6 · AI-3 log, chat, công tắc nguồn (headless)', () => {
  beforeEach(() => {
    useAppStore.setState({ aiMode: 'mock', aiStatus: 'mock', aiBusy: null });
    usePlaybackStore.setState({ isPlaying: false, isPaused: false });
  });

  it('không có .env.local thì không bật được LIVE, mode giữ mock', () => {
    pb().initScenario('s1');

    expect(pb().setAiMode('live')).toBe(false);
    expect(useAppStore.getState().aiMode).toBe('mock');
    expect(useAppStore.getState().aiLiveAvailable).toBe(false);
  });

  it('AI-3: ghi đúng 1 cặp ai.requested/ai.responded cho Cố vấn, bấm lại không nhân đôi', async () => {
    pb().initScenario('s1');

    const first = await pb().askReviewerBrief('advisor');
    expect(first).not.toBeNull();
    expect(ai3Pairs(pb().currentEventLog, 'T4')).toHaveLength(2);
    expect(pb().eventDays.length).toBe(pb().currentEventLog.length);

    await pb().askReviewerBrief('advisor');
    expect(ai3Pairs(pb().currentEventLog, 'T4')).toHaveLength(2);
  });

  it('chat AI-2 trả lời theo ngữ cảnh và không ghi vào log BPMN', async () => {
    pb().initScenario('s1');
    const before = pb().currentEventLog.length;

    const answer = await pb().askAssistant(
      [{ role: 'user', content: 'Tiến độ hồ sơ của tôi?' }],
      { submitted: false }
    );

    expect(answer.length).toBeGreaterThan(0);
    expect(answer).toContain('nộp');
    expect(pb().currentEventLog.length).toBe(before);
  });

  it('S5: AI-3 của CTSV đề xuất KHÔNG HỢP LỆ và ghi log nguồn T5', async () => {
    pb().initScenario('s5');

    const brief = await pb().askReviewerBrief('ctsv');

    expect(brief?.suggestedDecision).toBe('invalid');
    expect(ai3Pairs(pb().currentEventLog, 'T5')).toHaveLength(2);
  });

  it('reset dọn trạng thái AI đang bận', () => {
    pb().initScenario('s1');
    useAppStore.getState().setAiBusy('AI-1');

    pb().reset();

    expect(useAppStore.getState().aiBusy).toBeNull();
  });
});
