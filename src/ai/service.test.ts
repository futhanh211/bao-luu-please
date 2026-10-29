import { describe, expect, it } from 'vitest';
import { AIService, AISource } from './service';
import { MockAIProvider } from './mock';
import { AIProvider, DocScanResult, ReviewerBrief } from '../engine/types';

const FAKE_SCAN: DocScanResult = {
  evidenceType: 'live_doc',
  typeMatchesReason: true,
  extracted: {},
  anomalies: [],
  confidence: 0.9,
};

class FakeLive implements AIProvider {
  public mode: 'live' = 'live';
  public calls = 0;

  constructor(private shouldFail: boolean) {}

  private guard<T>(value: T): T {
    this.calls += 1;
    if (this.shouldFail) throw new Error('live hỏng');
    return value;
  }

  public analyzeDocuments(): Promise<DocScanResult> {
    return Promise.resolve(this.guard({ ...FAKE_SCAN, evidenceType: 'live_doc' }));
  }

  public chat(): Promise<string> {
    return Promise.resolve(this.guard('trả lời live'));
  }

  public reviewerBrief(): Promise<ReviewerBrief> {
    return Promise.resolve(
      this.guard({
        summary: 'live',
        points: ['live'],
        suggestedDecision: 'valid' as const,
        rationale: 'live',
      })
    );
  }

  public draftText(): Promise<string> {
    return Promise.resolve(this.guard('văn bản live'));
  }
}

const input = {
  form: {
    fullName: 'Nguyễn Minh Khoa',
    mssv: '3121102001',
    className: '47K12.1',
    faculty: 'Khoa CNTT',
    phone: '0905123456',
    email: 'khoa.nm@due.edu.vn',
    reason: 'Ốm đau/tai nạn điều trị dài' as const,
    semesterCount: 2 as const,
    startSemester: 'Học kỳ 1, Năm học 2026-2027',
    commitment: true,
  },
  evidence: [
    {
      id: 'ev_01',
      type: 'medical_record',
      name: 'Giấy ra viện Bệnh viện Đa khoa Đà Nẵng',
      content: 'Điều trị chấn thương',
    },
  ],
};

describe('AIService · chọn nguồn và fallback', () => {
  it('mode mock thì gọi mock và source = mock', async () => {
    const live = new FakeLive(false);
    const service = new AIService(new MockAIProvider(undefined, 0), live, 'mock');

    const result = await service.analyzeDocuments(input);

    expect(service.source).toBe('mock');
    expect(result.evidenceType).toBe('medical_record');
    expect(live.calls).toBe(0);
  });

  it('mode live + live chạy được → trả kết quả live, source = live', async () => {
    const live = new FakeLive(false);
    const service = new AIService(new MockAIProvider(undefined, 0), live, 'live');

    const result = await service.analyzeDocuments(input);

    expect(service.source).toBe('live');
    expect(result.evidenceType).toBe('live_doc');
    expect(live.calls).toBe(1);
  });

  it('live lỗi → rơi về mock, source = fallback và không gọi live lần nữa', async () => {
    const live = new FakeLive(true);
    const mock = new MockAIProvider(undefined, 0);
    const service = new AIService(mock, live, 'live');
    const sources: AISource[] = [];
    service.onSourceChange((source) => sources.push(source));

    const first = await service.analyzeDocuments(input);
    const second = await service.analyzeDocuments(input);

    expect(service.source).toBe('fallback');
    expect(sources).toContain('fallback');
    expect(first.evidenceType).toBe('medical_record');
    expect(second.evidenceType).toBe('medical_record');
    expect(live.calls).toBe(1);
  });

  it('bật live khi không cấu hình → false, mode giữ mock', () => {
    const service = new AIService(new MockAIProvider(undefined, 0), null, 'mock');

    expect(service.setMode('live')).toBe(false);
    expect(service.mode).toBe('mock');
    expect(service.source).toBe('mock');
  });

  it('phát activity đúng điểm chạm rồi trả về null', async () => {
    const service = new AIService(new MockAIProvider(undefined, 0), null, 'mock');
    const events: (string | null)[] = [];
    service.onActivity((touchpoint) => events.push(touchpoint));

    await service.chat([{ role: 'user', content: 'Tiến độ hồ sơ?' }], { submitted: false });

    expect(events[0]).toBe('AI-2');
    expect(events[events.length - 1]).toBeNull();
  });

  it('dispose gỡ toàn bộ listener', async () => {
    const service = new AIService(new MockAIProvider(undefined, 0), null, 'mock');
    const events: (string | null)[] = [];
    service.onActivity((touchpoint) => events.push(touchpoint));

    service.dispose();
    await service.chat([{ role: 'user', content: 'Xin chào' }], {});

    expect(events).toHaveLength(0);
  });
});
