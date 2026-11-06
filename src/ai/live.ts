import { AIProvider, DocScanInput, DocScanResult, ReviewerBrief } from '../engine/types';
import { asCaseSummary, CaseSummary, ChatMessage } from './provider';
import {
  PromptBundle,
  buildChatPayload,
  buildDocScanPayload,
  buildDraftPayload,
  buildReviewerPayload,
  buildOcrPayload,
} from './prompts';
import {
  parseJsonObject,
  validateBrief,
  validateDocScan,
  validateDraft,
  validateOcrResult,
} from './validate';
import {
  OcrScanResult,
  UploadedEvidenceFile,
  StudentEvidenceOptionKey,
} from './ocrTypes';

export class LiveAIError extends Error {}

/** Lỗi không nên thử lại (4xx, nội dung rỗng, JSON sai) — fallback ngay. */
class NonRetryableAIError extends LiveAIError {}

const TIMEOUT_MS = 4000;
const MAX_ATTEMPTS = 2;

export function getCustomGeminiKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem('bao_luu_custom_gemini_key') || '';
  } catch {
    return '';
  }
}

export function saveCustomGeminiKey(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (!key.trim()) {
      localStorage.removeItem('bao_luu_custom_gemini_key');
    } else {
      localStorage.setItem('bao_luu_custom_gemini_key', key.trim());
    }
  } catch {
    // Ignore storage errors in test environments
  }
}

/** Live bật khi có API key (từ biến môi trường VITE_GEMINI_API_KEY hoặc lưu trong trình duyệt). */
export function isLiveAvailable(): boolean {
  if (typeof window === 'undefined') return false;

  const env = import.meta.env;
  const customKey = getCustomGeminiKey();
  const key = (customKey || (env?.VITE_GEMINI_API_KEY ?? '')).trim();
  const model = (env?.VITE_GEMINI_MODEL ?? 'gemini-1.5-flash').trim();
  return key.length > 0 && model.length > 0;
}

export function createLiveAIFromEnv(): LiveAIProvider | null {
  if (!isLiveAvailable()) return null;
  const env = import.meta.env;
  const customKey = getCustomGeminiKey();
  const key = (customKey || (env?.VITE_GEMINI_API_KEY ?? '')).trim();
  const model = (env?.VITE_GEMINI_MODEL ?? 'gemini-1.5-flash').trim();
  return new LiveAIProvider(key, model);
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

function toChatMessages(history: unknown[]): ChatMessage[] {
  const messages: ChatMessage[] = [];
  if (!Array.isArray(history)) return messages;
  for (const item of history) {
    if (!item || typeof item !== 'object') continue;
    const candidate = item as { role?: unknown; content?: unknown };
    if (candidate.role !== 'user' && candidate.role !== 'assistant') continue;
    if (typeof candidate.content !== 'string') continue;
    messages.push({ role: candidate.role, content: candidate.content });
  }
  return messages;
}

/**
 * Gọi Gemini REST trực tiếp từ browser (đúng phạm vi demo offline-first).
 * Key không bao giờ nằm trong URL/log; lỗi luôn ném ra để AIService fallback mock.
 */
export class LiveAIProvider implements AIProvider {
  public mode: 'live' = 'live';

  constructor(
    private apiKey: string,
    private model: string,
    private timeoutMs: number = TIMEOUT_MS
  ) {}

  private endpoint(): string {
    const model = this.model.replace(/^models\//, '');
    return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent`;
  }

  private async generate(bundle: PromptBundle): Promise<string> {
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
      { text: bundle.user },
    ];
    if (bundle.imagePart) {
      parts.push({
        inlineData: {
          mimeType: bundle.imagePart.mimeType,
          data: bundle.imagePart.data,
        },
      });
    }

    const body = JSON.stringify({
      systemInstruction: { parts: [{ text: bundle.system }] },
      contents: [{ role: 'user', parts }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1000,
        responseMimeType: bundle.json ? 'application/json' : 'text/plain',
      },
    });

    let lastError: unknown = new LiveAIError('Không gọi được Gemini');

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await fetch(this.endpoint(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.apiKey },
          body,
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (response.ok) {
          const data = (await response.json()) as GeminiResponse;
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text || !text.trim()) throw new NonRetryableAIError('Gemini trả về nội dung rỗng');
          return text;
        }

        // 4xx là lỗi cấu hình/quyền → fallback ngay, không thử lại.
        if (response.status >= 400 && response.status < 500) {
          throw new NonRetryableAIError(`Gemini từ chối yêu cầu (${response.status})`);
        }
        lastError = new LiveAIError(`Gemini lỗi máy chủ (${response.status})`);
      } catch (error) {
        clearTimeout(timer);
        if (error instanceof NonRetryableAIError) throw error;
        lastError = error;
      }
    }

    throw lastError instanceof Error ? lastError : new LiveAIError('Không gọi được Gemini');
  }

  public async analyzeDocuments(input: DocScanInput): Promise<DocScanResult> {
    const text = await this.generate(buildDocScanPayload(input));
    const raw = parseJsonObject(text);
    const result = raw ? validateDocScan(raw) : null;
    if (!result) throw new LiveAIError('Gemini trả JSON đọc hồ sơ không hợp lệ');
    return result;
  }

  public async chat(history: unknown[], ctx: unknown): Promise<string> {
    const text = await this.generate(buildChatPayload(toChatMessages(history), ctx));
    const trimmed = text.trim();
    if (!trimmed) throw new LiveAIError('Gemini trả lời rỗng');
    return trimmed;
  }

  public async reviewerBrief(role: 'advisor' | 'ctsv', ctx: unknown): Promise<ReviewerBrief> {
    const summary = asCaseSummary(ctx);
    if (!summary) throw new LiveAIError('Thiếu dữ kiện ca để tóm tắt');
    const text = await this.generate(buildReviewerPayload(role, summary));
    const raw = parseJsonObject(text);
    const brief = raw ? validateBrief(raw, role) : null;
    if (!brief) throw new LiveAIError('Gemini trả JSON tóm tắt không hợp lệ');
    return brief;
  }

  public async draftText(
    kind: 'return' | 'reject' | 'decisionBasis',
    ctx: unknown
  ): Promise<string> {
    const summary: CaseSummary | null = asCaseSummary(ctx);
    if (!summary) throw new LiveAIError('Thiếu dữ kiện ca để soạn văn bản');
    const text = await this.generate(buildDraftPayload(kind, summary));
    const raw = parseJsonObject(text);
    const draft = validateDraft(raw ?? text);
    if (!draft) throw new LiveAIError('Gemini soạn văn bản không hợp lệ');
    return draft;
  }

  public async scanDocument(
    file: UploadedEvidenceFile,
    optionKey: StudentEvidenceOptionKey
  ): Promise<OcrScanResult> {
    const payload = buildOcrPayload(file, optionKey);
    const text = await this.generate(payload);
    const raw = parseJsonObject(text);
    const result = raw ? validateOcrResult(raw, optionKey) : null;
    if (!result) throw new LiveAIError('Gemini trả JSON OCR không hợp lệ');
    return result;
  }
}

/**
 * Kiểm tra kết nối API Gemini thực tế (Health check & Latency test)
 * Phục vụ mục 4.1 ">= 1 tích hợp bên ngoài" của đề cương báo cáo.
 */
export async function testGeminiConnection(
  customKey?: string,
  customModel?: string
): Promise<{ success: boolean; latencyMs: number; message: string; modelUsed: string }> {
  const env = typeof import.meta !== 'undefined' ? import.meta.env : ({} as Record<string, string>);
  const key = (customKey || env?.VITE_GEMINI_API_KEY || '').trim();
  const model = (customModel || env?.VITE_GEMINI_MODEL || 'gemini-1.5-flash').trim();

  if (!key) {
    return {
      success: false,
      latencyMs: 0,
      message: 'Chưa cấu hình API Key (VITE_GEMINI_API_KEY trong .env.local hoặc nhập trực tiếp).',
      modelUsed: model,
    };
  }

  const cleanModel = model.replace(/^models\//, '');
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cleanModel)}:generateContent`;
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Ping test. Reply "PONG" in 1 word.' }] }],
        generationConfig: { maxOutputTokens: 10, temperature: 0.1 },
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const latencyMs = Date.now() - startTime;

    if (response.ok) {
      const data = (await response.json()) as GeminiResponse;
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'OK';
      return {
        success: true,
        latencyMs,
        message: `Kết nối thành công! Phản hồi từ ${cleanModel}: "${reply}" (${latencyMs}ms)`,
        modelUsed: cleanModel,
      };
    } else {
      const errText = await response.text().catch(() => '');
      return {
        success: false,
        latencyMs,
        message: `Lỗi HTTP ${response.status}: ${errText.slice(0, 150)}`,
        modelUsed: cleanModel,
      };
    }
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      latencyMs,
      message: `Kết nối thất bại (${msg})`,
      modelUsed: cleanModel,
    };
  }
}
