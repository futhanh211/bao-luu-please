// Token & Particle Animation along BPMN SVG Paths
// Uses requestAnimationFrame + SVGPathElement.getPointAtLength
// Cleans up all rAF and timeouts on cancel/reset

export interface AnimatedTokenItem {
  id: string;
  x: number;
  y: number;
  opacity: number;
  isEnvelope?: boolean;
  color?: string;
}

type TokenListener = (tokens: AnimatedTokenItem[]) => void;

export class TokenAnimManager {
  private rafIds: Set<number> = new Set();
  private timeoutIds: Set<ReturnType<typeof setTimeout>> = new Set();
  private activeTokens: Map<string, AnimatedTokenItem> = new Map();
  private listeners: Set<TokenListener> = new Set();
  /** Callback onComplete của animation đang chạy — phải được gọi kể cả khi bị huỷ. */
  private pendingCompletions: Set<() => void> = new Set();

  /** Nhiều component (map thu nhỏ + overlay) cùng nghe; trả về hàm huỷ đăng ký. */
  public subscribe(cb: TokenListener): () => void {
    this.listeners.add(cb);
    cb(Array.from(this.activeTokens.values()));
    return () => {
      this.listeners.delete(cb);
    };
  }

  public setOnUpdate(cb: TokenListener): () => void {
    return this.subscribe(cb);
  }

  private notify() {
    const tokens = Array.from(this.activeTokens.values());
    this.listeners.forEach((cb) => cb(tokens));
  }

  /** Bọc onComplete để chỉ chạy đúng một lần và luôn được settle khi cancelAll(). */
  private trackCompletion(onComplete?: () => void): () => void {
    if (!onComplete) return () => {};
    let done = false;
    const settle = () => {
      if (done) return;
      done = true;
      this.pendingCompletions.delete(settle);
      onComplete();
    };
    this.pendingCompletions.add(settle);
    return settle;
  }

  public animatePath(
    tokenId: string,
    pathString: string,
    durationMs: number,
    speed = 1,
    isEnvelope = false,
    color = 'var(--amber)',
    onComplete?: () => void
  ): void {
    if (typeof document === 'undefined' || typeof requestAnimationFrame === 'undefined') {
      onComplete?.();
      return;
    }

    const scaledDuration = Math.max(100, durationMs / (speed || 1));
    const pathElem = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathElem.setAttribute('d', pathString);
    const totalLength = pathElem.getTotalLength ? pathElem.getTotalLength() : 100;

    const startTime = performance.now();
    const animId = `anim_${tokenId}_${Date.now()}`;
    const finish = this.trackCompletion(onComplete);

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / scaledDuration);

      if (pathElem.getPointAtLength) {
        const pt = pathElem.getPointAtLength(progress * totalLength);
        this.activeTokens.set(animId, {
          id: animId,
          x: pt.x,
          y: pt.y,
          opacity: progress < 0.9 ? 1 : (1 - progress) * 10,
          isEnvelope,
          color,
        });
      }

      this.notify();

      if (progress < 1) {
        const nextRaf = requestAnimationFrame(step);
        this.rafIds.add(nextRaf);
      } else {
        this.activeTokens.delete(animId);
        this.notify();
        finish();
      }
    };

    const firstRaf = requestAnimationFrame(step);
    this.rafIds.add(firstRaf);
  }

  public animateSplit(
    origin: { x: number; y: number },
    targets: Array<{ x: number; y: number }>,
    durationMs: number,
    speed = 1,
    onComplete?: () => void
  ): void {
    if (typeof document === 'undefined' || typeof requestAnimationFrame === 'undefined') {
      onComplete?.();
      return;
    }

    const scaledDuration = Math.max(80, durationMs / (speed || 1));
    const startTime = performance.now();
    const ids = targets.map((_, i) => `split_${Date.now()}_${i}`);

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / scaledDuration);

      targets.forEach((tgt, i) => {
        const curX = origin.x + (tgt.x - origin.x) * progress;
        const curY = origin.y + (tgt.y - origin.y) * progress;
        this.activeTokens.set(ids[i], {
          id: ids[i],
          x: curX,
          y: curY,
          opacity: 1,
          color: 'var(--amber)',
        });
      });

      this.notify();

      if (progress < 1) {
        const nextRaf = requestAnimationFrame(step);
        this.rafIds.add(nextRaf);
      } else {
        ids.forEach((id) => this.activeTokens.delete(id));
        this.notify();
        onComplete?.();
      }
    };

    const raf = requestAnimationFrame(step);
    this.rafIds.add(raf);
  }

  public cancelAll(): void {
    this.rafIds.forEach((id) => cancelAnimationFrame(id));
    this.rafIds.clear();
    this.timeoutIds.forEach((id) => clearTimeout(id));
    this.timeoutIds.clear();
    this.activeTokens.clear();
    this.notify();
  }
}

export const tokenAnimManager = new TokenAnimManager();
