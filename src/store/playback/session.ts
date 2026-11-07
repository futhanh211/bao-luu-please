import { Clock } from '../../engine/clock';
import { MockAIProvider } from '../../ai/mock';
import { AIService } from '../../ai/service';
import { createLiveAIFromEnv } from '../../ai/live';
import { InMemoryStudentsDB } from '../../data/students.db';
import { InMemoryAcademicFinanceDB } from '../../data/academic-finance.db';
import { EngineEvent } from '../../engine/types';
import { ScenarioConfig } from '../../data/scenarios';
import { getRegisteredStudents } from '../../data/userRegistry';

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

  // Nạp toàn bộ tài khoản sinh viên đã đăng ký vào DB phiên làm việc
  try {
    const registered = getRegisteredStudents();
    for (const s of registered) {
      studentsDb.upsert({
        mssv: s.mssv,
        name: s.name,
        className: s.className,
        faculty: s.faculty,
        phone: s.phone || '0905123456',
        email: s.email,
        status: 'Đang học',
      });
      if (!academicFinanceDb.get(s.mssv)) {
        academicFinanceDb.upsert({
          mssv: s.mssv,
          semestersCompleted: 3,
          gpaNote: 'GPA tích lũy: 3.25 / 4.0 - Đủ điều kiện học vụ',
          discipline: 'none',
          tuitionDebt: 0,
          forcedWithdrawal: false,
        });
      }
    }
  } catch {
    // Ignore
  }

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
