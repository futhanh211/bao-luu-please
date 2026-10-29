import { Clock } from '../../engine/clock';
import { MockAIProvider } from '../../ai/mock';
import { AIService } from '../../ai/service';
import { createLiveAIFromEnv } from '../../ai/live';
import { InMemoryStudentsDB } from '../../data/students.db';
import { InMemoryAcademicFinanceDB } from '../../data/academic-finance.db';
import { EngineEvent } from '../../engine/types';
import { ScenarioConfig } from '../../data/scenarios';

export interface QueuedEvent {
  event: EngineEvent;
  day: number;
}

export interface PlaybackSession {
  clock: Clock;
  ai: AIService;
  studentsDb: InMemoryStudentsDB;
  academicFinanceDb: InMemoryAcademicFinanceDB;
}

/** Trạng thái sống ngoài store — chỉ module playback được đụng tới. */
let eventQueue: QueuedEvent[] = [];
let queueProcessing = false;
let playbackClock: Clock | null = null;
let activeAI: AIService | null = null;
let activeStudentsDb: InMemoryStudentsDB | null = null;
let activeAcademicFinanceDb: InMemoryAcademicFinanceDB | null = null;

/** AI mock chậm 700ms khi chạy thật; test headless không có window nên trả ngay. */
export function aiDelayMs(): number {
  return typeof window === 'undefined' ? 0 : 700;
}

export function beginSession(
  scenario: ScenarioConfig,
  initialMode: 'mock' | 'live' = 'mock'
): PlaybackSession {
  activeAI?.dispose();

  const clock = new Clock(0);
  const studentsDb = new InMemoryStudentsDB();
  const academicFinanceDb = new InMemoryAcademicFinanceDB();
  const mock = new MockAIProvider(scenario.aiScript, aiDelayMs());
  const ai = new AIService(mock, createLiveAIFromEnv(), initialMode);

  playbackClock = clock;
  activeAI = ai;
  activeStudentsDb = studentsDb;
  activeAcademicFinanceDb = academicFinanceDb;
  eventQueue = [];
  queueProcessing = false;

  return { clock, ai, studentsDb, academicFinanceDb };
}

export function clearSessionQueue(): void {
  eventQueue = [];
  queueProcessing = false;
}

export function enqueueEvent(event: EngineEvent): void {
  eventQueue.push({ event, day: playbackClock ? playbackClock.getDay() : 0 });
}

export function shiftQueuedEvent(): QueuedEvent | undefined {
  return eventQueue.shift();
}

export function queuedCount(): number {
  return eventQueue.length;
}

export function isQueueProcessing(): boolean {
  return queueProcessing;
}

export function setQueueProcessing(value: boolean): void {
  queueProcessing = value;
}

export function getPlaybackDay(): number {
  return playbackClock?.getDay() ?? 0;
}

export function getActiveAI(): AIService | null {
  return activeAI;
}

export function getActiveStudentsDb(): InMemoryStudentsDB | null {
  return activeStudentsDb;
}

export function getActiveAcademicFinanceDb(): InMemoryAcademicFinanceDB | null {
  return activeAcademicFinanceDb;
}
