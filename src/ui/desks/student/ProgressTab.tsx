import React from 'react';
import { StudentProgressItem, ProgressTone } from '../studentProgress';

const TONE_COLOR: Record<ProgressTone, string> = {
  neutral: 'var(--ink-soft)',
  info: 'var(--stamp-blue)',
  ok: 'var(--stamp-green)',
  warn: 'var(--amber)',
  error: 'var(--stamp-red)',
};

interface Props {
  items: StudentProgressItem[];
  waitingTask: string | null;
}

export const ProgressTab: React.FC<Props> = ({ items, waitingTask }) => {
  if (items.length === 0) {
    return (
      <div className="student-dropzone" style={{ textAlign: 'center', padding: 18 }}>
        Chưa có tiến độ.
        <br />
        Nộp đơn để hệ thống bắt đầu ghi nhận từng bước.
      </div>
    );
  }

  return (
    <div>
      {waitingTask && (
        <div
          style={{
            fontSize: 11,
            fontFamily: 'var(--font-paper)',
            padding: 7,
            border: '1px dashed var(--amber)',
            background: 'var(--wash-amber)',
            marginBottom: 10,
            lineHeight: 1.4,
          }}
        >
          Đang chờ xử lý tại bước <strong>{waitingTask}</strong>.
        </div>
      )}

      <ol className="student-timeline">
        {items.map((item, index) => {
          const isLatest = index === items.length - 1;
          const color = TONE_COLOR[item.tone];
          return (
            <li key={item.id} style={{ display: 'flex', gap: 9, position: 'relative', paddingBottom: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 14 }}>
                <span
                  style={{
                    width: isLatest ? 11 : 8,
                    height: isLatest ? 11 : 8,
                    borderRadius: '50%',
                    background: isLatest ? color : 'var(--paper)',
                    border: `2px solid ${color}`,
                    boxShadow: isLatest ? `0 0 6px ${color}` : 'none',
                    marginTop: 3,
                    flexShrink: 0,
                  }}
                />
                {index < items.length - 1 && (
                  <span style={{ flex: 1, width: 1, background: 'var(--paper-line)', marginTop: 2 }} />
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-paper)',
                    fontSize: isLatest ? 13 : 12,
                    fontWeight: isLatest ? 'bold' : 'normal',
                    color: isLatest ? 'var(--ink)' : 'var(--ink-soft)',
                    lineHeight: 1.35,
                    background: isLatest ? 'var(--wash-amber)' : 'transparent',
                    padding: isLatest ? '2px 4px' : 0,
                  }}
                >
                  {item.label}
                  {isLatest && (
                    <span style={{ fontSize: 9, color, marginLeft: 6, letterSpacing: 0.5 }}>MỚI NHẤT</span>
                  )}
                </div>
                {item.detail && (
                  <div style={{ fontSize: 10.5, color: 'var(--ink-soft)', lineHeight: 1.4, marginTop: 1 }}>
                    {item.detail}
                  </div>
                )}
                <div style={{ fontSize: 9.5, color: 'var(--ink-soft)', marginTop: 2 }}>Ngày {item.day}</div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
