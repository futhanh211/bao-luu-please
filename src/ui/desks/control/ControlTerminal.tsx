import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../../store/useApp';
import { ControlLine } from './controlLog';

const MAX_LINES = 200;

/** AI-2 là chat cổng thông tin nên không hiện trong terminal của Lane L1. */
const AI_ACTIVITY_TEXT: Record<string, string> = {
  'AI-1': 'đang đọc hồ sơ và minh chứng…',
  'AI-3': 'đang tóm tắt hồ sơ cho người duyệt…',
  'AI-4': 'đang soạn văn bản…',
};

interface ControlTerminalProps {
  lines: ControlLine[];
}

/** Màn CRT: gõ từng ký tự dòng mới, tự cuộn đáy, giữ tối đa 200 dòng. */
export const ControlTerminal: React.FC<ControlTerminalProps> = ({ lines }) => {
  const speed = useAppStore((s) => s.speed) || 1;
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const toggleReducedMotion = useAppStore((s) => s.toggleReducedMotion);

  const [typed, setTyped] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const aiBusy = useAppStore((s) => s.aiBusy);
  const aiActivity = aiBusy && AI_ACTIVITY_TEXT[aiBusy] ? aiBusy : null;

  const visible = lines.slice(-MAX_LINES);
  const last = visible[visible.length - 1];
  const lastId = last?.id;
  const lastLength = last?.text.length ?? 0;

  useEffect(() => {
    if (!lastId || lastLength === 0) {
      setTyped(0);
      return undefined;
    }
    if (reducedMotion) {
      setTyped(lastLength);
      return undefined;
    }

    setTyped(0);
    const charMs = Math.max(4, 15 / speed);
    const timer = setInterval(() => {
      setTyped((current) => {
        if (current >= lastLength) {
          clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, charMs);

    return () => clearInterval(timer);
  }, [lastId, lastLength, reducedMotion, speed]);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [lastId, typed, visible.length]);

  return (
    <section className="control-panel control-terminal">
      <div className="control-panel-head">
        <h2 className="control-panel-title">Terminal hệ thống</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="control-panel-note">L1 · event engine</span>
          <button
            type="button"
            className="desk-btn desk-btn-small"
            onClick={toggleReducedMotion}
            title="Tắt nhấp nháy CRT và hiệu ứng gõ chữ"
            aria-pressed={reducedMotion}
          >
            {reducedMotion ? '◻ Chế độ nhẹ: BẬT' : '◼ Chế độ nhẹ: TẮT'}
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="crt-terminal"
        data-scanlines={reducedMotion ? 'false' : 'true'}
        data-flicker={reducedMotion ? 'false' : 'true'}
        role="log"
        aria-live="polite"
      >
        {visible.length === 0 && (
          <div className="crt-line">
            <span className="crt-tag">SYS</span>
            <span className="crt-line-text">Chờ hồ sơ · chưa có sự kiện nào.</span>
          </div>
        )}

        {visible.map((item, index) => {
          const isLast = index === visible.length - 1;
          const text = isLast ? item.text.slice(0, typed) : item.text;
          return (
            <div key={item.id} className="crt-line" data-tone={item.tone}>
              <span className="crt-tag">[{item.tag}]</span>
              <span className="crt-line-text">
                {item.kind.padEnd(7, ' ')} {text}
                {isLast && typed < item.text.length && <span className="crt-caret" />}
              </span>
            </div>
          );
        })}

        {aiActivity && (
          <div className="crt-line" data-tone="info">
            <span className="crt-tag">[{aiActivity}]</span>
            <span className="crt-line-text ai-pulse">
              {'AI'.padEnd(7, ' ')} {AI_ACTIVITY_TEXT[aiActivity]}
            </span>
          </div>
        )}
      </div>
    </section>
  );
};
