import { afterEach, describe, expect, it, vi } from 'vitest';
import { LiveAIProvider, isLiveAvailable, LiveAIError } from './live';
import { CaseSummary } from './provider';

interface FakeResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}

function stubFetch(bodies: unknown[]): ReturnType<typeof vi.fn> {
  let index = 0;
  const fake = vi.fn(() => {
    const body = bodies[Math.min(index, bodies.length - 1)];
    index += 1;
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(body),
    } satisfies FakeResponse);
  });
  vi.stubGlobal('fetch', fake);
  return fake;
}

function geminiText(text: string): unknown {
  return { candidates: [{ content: { parts: [{ text }] } }] };
}

const form: CaseSummary['form'] = {
  fullName: 'Nguyễn Minh Khoa',
  mssv: '3121102001',
  className: '47K12.1',
  faculty: 'Khoa CNTT',
  phone: '0905123456',
  email: 'khoa.nm@due.edu.vn',
  reason: 'Ốm đau/tai nạn điều trị dài',
  semesterCount: 2,
  startSemester: 'Học kỳ 1, Năm học 2026-2027',
  commitment: true,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('LiveAIProvider · gọi Gemini bằng fetch giả', () => {
  it('AI-1: JSON hợp lệ → DocScanResult', async () => {
    stubFetch([
      geminiText(
        JSON.stringify({
          evidenceType: 'medical_record',
          typeMatchesReason: true,
          extracted: { hospital: 'Bệnh viện Đa khoa Đà Nẵng' },
          anomalies: [{ field: 'hospitalStamp', issue: 'Dấu mờ', severity: 'medium' }],
          confidence: 0.8,
        })
      ),
    ]);
    const live = new LiveAIProvider('key-gia', 'gemini-2.0-flash');

    const result = await live.analyzeDocuments({
      form,
      evidence: [{ id: 'ev', type: 'medical_record', name: 'Giấy ra viện', content: '...' }],
    });

    expect(result.evidenceType).toBe('medical_record');
    expect(result.anomalies[0].severity).toBe('medium');
    expect(result.confidence).toBe(0.8);
  });

  it('AI-2: trả văn bản thường', async () => {
    stubFetch([geminiText('Bạn mở tab Tiến độ để xem hồ sơ nhé.')]);
    const live = new LiveAIProvider('key-gia', 'gemini-2.0-flash');

    const answer = await live.chat([{ role: 'user', content: 'Tiến độ?' }], { submitted: true });

    expect(answer).toContain('Tiến độ');
  });

  it('JSON hỏng → ném lỗi để AIService fallback', async () => {
    stubFetch([geminiText('xin lỗi tôi không trả JSON')]);
    const live = new LiveAIProvider('key-gia', 'gemini-2.0-flash');

    await expect(
      live.analyzeDocuments({ form, evidence: [] })
    ).rejects.toBeInstanceOf(LiveAIError);
  });

  it('suggestedDecision sai bộ của vai → ném lỗi', async () => {
    stubFetch([
      geminiText(
        JSON.stringify({
          summary: 'Tóm tắt',
          points: ['Một điểm'],
          suggestedDecision: 'valid',
          rationale: 'Vì vậy',
        })
      ),
    ]);
    const live = new LiveAIProvider('key-gia', 'gemini-2.0-flash');

    await expect(live.reviewerBrief('advisor', { form })).rejects.toBeInstanceOf(LiveAIError);
  });

  it('response thiếu candidates → ném lỗi', async () => {
    stubFetch([{ }]);
    const live = new LiveAIProvider('key-gia', 'gemini-2.0-flash');

    await expect(live.chat([], {})).rejects.toBeInstanceOf(LiveAIError);
  });

  it('key không nằm trong URL', async () => {
    const fake = stubFetch([geminiText('ok')]);
    const live = new LiveAIProvider('key-bi-mat', 'gemini-2.0-flash');

    await live.chat([], {});

    const [url, init] = fake.mock.calls[0] as [string, RequestInit];
    expect(url).not.toContain('key-bi-mat');
    expect(url).toContain('gemini-2.0-flash:generateContent');
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('key-bi-mat');
  });

  it('môi trường node không có window → isLiveAvailable() = false', () => {
    expect(isLiveAvailable()).toBe(false);
  });
});
