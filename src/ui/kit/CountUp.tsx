import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../store/useApp';

interface CountUpProps {
  value: number;
  durationMs?: number;
  className?: string;
}

/** Số liệu đếm lên 400ms; tắt khi giảm hiệu ứng, chia theo tốc độ ca. */
export const CountUp: React.FC<CountUpProps> = ({ value, durationMs = 400, className = '' }) => {
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const speed = useAppStore((s) => s.speed) || 1;
  const [display, setDisplay] = useState(reducedMotion ? value : 0);
  const fromRef = useRef(0);

  useEffect(() => {
    if (reducedMotion || typeof requestAnimationFrame === 'undefined') {
      fromRef.current = value;
      setDisplay(value);
      return undefined;
    }

    const from = fromRef.current;
    const duration = Math.max(80, durationMs / speed);
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs, speed, reducedMotion]);

  return <span className={className}>{display}</span>;
};
