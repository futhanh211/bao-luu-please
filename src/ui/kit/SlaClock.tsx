import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useApp';
import { sfx } from '../audio/sfx';

interface SlaClockProps {
  days: number;
  maxDays: number;
}

export const SlaClock: React.FC<SlaClockProps> = ({ days, maxDays }) => {
  const speed = useAppStore((s) => s.speed);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const safeMax = Math.max(1, maxDays);
  const progress = Math.min(1, Math.max(0, days / safeMax));
  const angle = progress * 300;
  const overdue = days >= safeMax;

  const prevDays = useRef(days);
  useEffect(() => {
    if (days > prevDays.current) {
      if (days - prevDays.current >= 3) {
        sfx.playCalendarTear();
      } else {
        sfx.playClockTick();
      }
    }
    prevDays.current = days;
  }, [days]);

  return (
    <div className="sla-clock" data-overdue={overdue}>
      <svg viewBox="0 0 100 100" width="86" height="86" aria-hidden="true">
        <circle cx="50" cy="50" r="44" fill="var(--paper-dim)" stroke="var(--ink)" strokeWidth="2.5" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * 30 * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={50 + Math.sin(a) * 36}
              y1={50 - Math.cos(a) * 36}
              x2={50 + Math.sin(a) * 41}
              y2={50 - Math.cos(a) * 41}
              stroke="var(--ink-soft)"
              strokeWidth="2"
            />
          );
        })}
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="20"
          stroke={overdue ? 'var(--stamp-red)' : 'var(--stamp-blue)'}
          strokeWidth="4"
          strokeLinecap="round"
          style={{
            transformOrigin: '50px 50px',
            transform: `rotate(${angle}deg)`,
            transition: reducedMotion ? 'none' : `transform ${600 / speed}ms ease-out`,
          }}
        />
        <circle cx="50" cy="50" r="5" fill="var(--ink)" />
      </svg>
      <div className="sla-clock-label">
        <strong>
          Đã chờ {days}/{maxDays} ngày
        </strong>
        <span>{overdue ? 'QUÁ HẠN SLA' : 'trong hạn xử lý'}</span>
      </div>
    </div>
  );
};
