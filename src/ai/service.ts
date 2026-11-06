import { AIProvider, DocScanInput, DocScanResult, ReviewerBrief } from '../engine/types';
import { MockAIProvider } from './mock';
import {
  OcrScanResult,
  UploadedEvidenceFile,
  StudentEvidenceOptionKey,
} from './ocrTypes';

/** Nguồn thực tế đang trả lời: mock, live, hoặc đã rơi về mock giữa ca. */
export type AISource = 'mock' | 'live' | 'fallback';

type Touchpoint = 'AI-1' | 'AI-2' | 'AI-3' | 'AI-4' | 'AI-OCR';

type SourceListener = (source: AISource) => void;
type ActivityListener = (touchpoint: string | null) => void;

/**
 * Điều phối mock/live. AI lỗi thì rơi về mock và giữ fallback tới khi đổi mode,
 * nhờ vậy demo không bao giờ treo vì mạng.
 */
export class AIService implements AIProvider {
  public mode: 'mock' | 'live';
  public source: AISource;

  private sourceListeners = new Set<SourceListener>();
  private activityListeners = new Set<ActivityListener>();

  constructor(
    private mock: MockAIProvider,
    private live: AIProvider | null,
    initialMode: 'mock' | 'live' = 'mock'
  ) {
    this.mode = initialMode === 'live' && live ? 'live' : 'mock';
    this.source = this.mode;
  }

  public setMode(mode: 'mock' | 'live'): boolean {
    if (mode === 'live' && !this.live) return false;
    this.mode = mode;
    this.setSource(mode);
    return true;
  }

  public onSourceChange(fn: SourceListener): () => void {
    this.sourceListeners.add(fn);
    return () => this.sourceListeners.delete(fn);
  }

  public onActivity(fn: ActivityListener): () => void {
    this.activityListeners.add(fn);
    return () => this.activityListeners.delete(fn);
  }

  public dispose(): void {
    this.sourceListeners.clear();
    this.activityListeners.clear();
  }

  private setSource(source: AISource): void {
    this.source = source;
    for (const listener of this.sourceListeners) listener(source);
  }

  private setActivity(touchpoint: string | null): void {
    for (const listener of this.activityListeners) listener(touchpoint);
  }

  private async run<T>(
    touchpoint: Touchpoint,
    liveCall: (live: AIProvider) => Promise<T>,
    mockCall: () => Promise<T>
  ): Promise<T> {
    this.setActivity(touchpoint);
    try {
      if (this.mode === 'live' && this.live && this.source !== 'fallback') {
        try {
          return await liveCall(this.live);
        } catch {
          this.setSource('fallback');
        }
      }
      return await mockCall();
    } finally {
      this.setActivity(null);
    }
  }

  public analyzeDocuments(input: DocScanInput): Promise<DocScanResult> {
    return this.run(
      'AI-1',
      (live) => live.analyzeDocuments(input),
      () => this.mock.analyzeDocuments(input)
    );
  }

  public chat(history: unknown[], ctx: unknown): Promise<string> {
    return this.run(
      'AI-2',
      (live) => live.chat(history, ctx),
      () => this.mock.chat(history, ctx)
    );
  }

  public reviewerBrief(role: 'advisor' | 'ctsv', ctx: unknown): Promise<ReviewerBrief> {
    return this.run(
      'AI-3',
      (live) => live.reviewerBrief(role, ctx),
      () => this.mock.reviewerBrief(role, ctx)
    );
  }

  public draftText(
    kind: 'return' | 'reject' | 'decisionBasis',
    ctx: unknown
  ): Promise<string> {
    return this.run(
      'AI-4',
      (live) => live.draftText(kind, ctx),
      () => this.mock.draftText(kind, ctx)
    );
  }

  public scanDocument(
    file: UploadedEvidenceFile,
    optionKey: StudentEvidenceOptionKey
  ): Promise<OcrScanResult> {
    return this.run(
      'AI-OCR',
      async (live) => {
        if (!live.scanDocument) throw new Error('Live AI không hỗ trợ scanDocument');
        const res = await live.scanDocument(file, optionKey);
        return res as OcrScanResult;
      },
      () => this.mock.scanDocument(file, optionKey)
    );
  }
}
