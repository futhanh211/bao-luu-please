import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MOTION } from '../motion';
import { useAppStore } from '../../store/useApp';
import { sfx } from '../audio/sfx';

type StampColor = 'red' | 'green' | 'blue';
type Phase = 'ready' | 'drop' | 'spread' | 'rest';

interface StampProps {
  label: string;
  color?: StampColor;
  onLanded?: () => void;
  autoPlay?: boolean;
  seed?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  angle?: number;
  className?: string;
}

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Góc nghiêng tự nhiên ngẫu nhiên sinh động cho cảm giác dập dấu thủ công. */
export function seededStampAngle(seed: string): number {
  return -4 + (hashSeed(seed) % 81) / 10;
}

export function randomStampAngle(): number {
  // Tránh góc 0° phẳng lì, nghiêng từ -5.5° đến -1.5° hoặc +1.5° đến +5.5°
  const sign = Math.random() < 0.5 ? -1 : 1;
  const mag = 1.8 + Math.random() * 3.8;
  return Number((sign * mag).toFixed(1));
}

export const Stamp: React.FC<StampProps> = ({
  label,
  color = 'red',
  onLanded,
  autoPlay = false,
  seed,
  disabled = false,
  size = 'md',
  angle,
  className = '',
}) => {
  const speed = useAppStore((s) => s.speed);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const [phase, setPhase] = useState<Phase>('ready');
  const running = useRef(false);
  const landed = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onLandedRef = useRef(onLanded);
  onLandedRef.current = onLanded;

  // Góc nghiêng tự nhiên: nếu có góc chỉ định thì dùng, nếu có seed thì dùng seeded, nếu không thì sinh góc ngẫu nhiên sống động
  const [naturalTilt] = useState<number>(() => {
    if (angle !== undefined) return angle;
    if (seed) return seededStampAngle(seed);
    return randomStampAngle();
  });
  const tilt = angle ?? naturalTilt;

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const land = useCallback(() => {
    if (landed.current) return;
    landed.current = true;
    onLandedRef.current?.();
  }, []);

  const play = useCallback(() => {
    if (disabled || running.current) return;
    running.current = true;

    if (reducedMotion) {
      setPhase('rest');
      sfx.play('stamp_heavy');
      land();
      return;
    }

    setPhase('drop');
    const dropMs = MOTION.stampDropMs / speed;
    const shakeMs = Math.max(MOTION.stampShakeMs, 180) / speed;
    const spreadMs = MOTION.inkSpreadMs / speed;

    timers.current.push(setTimeout(() => sfx.play('stamp_heavy'), dropMs));

    const surface = typeof document !== 'undefined' ? document.getElementById('desk-surface') : null;
    if (surface) {
      surface.style.setProperty('--stamp-shake-ms', `${shakeMs}ms`);
      surface.classList.remove('desk-shake-heavy');
      // Buộc reflow để trigger lại animation nếu dập liên tục
      void surface.offsetWidth;
      surface.classList.add('desk-shake-heavy');
      timers.current.push(
        setTimeout(() => surface.classList.remove('desk-shake-heavy'), shakeMs)
      );
    }

    timers.current.push(setTimeout(() => setPhase('spread'), dropMs));
    timers.current.push(
      setTimeout(() => {
        setPhase('rest');
        land();
      }, dropMs + spreadMs)
    );
  }, [disabled, land, reducedMotion, speed]);

  useEffect(() => {
    if (autoPlay) play();
    return () => {
      clearTimers();
      if (typeof document !== 'undefined') {
        document.getElementById('desk-surface')?.classList.remove('desk-shake');
      }
      // StrictMode chạy effect 2 lần: lần chạy lại phải được phép animation lại.
      if (autoPlay) {
        running.current = false;
        landed.current = false;
      }
    };
    // Chỉ chạy một lần khi mount; autoPlay là cờ duy nhất cần theo dõi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay]);

  const isInteractive = Boolean(onLanded);

  return (
    <button
      type="button"
      className={`stamp-mark stamp-${color} stamp-size-${size} ${className}`}
      data-phase={phase}
      data-interactive={isInteractive}
      disabled={!isInteractive || disabled}
      onClick={play}
      style={{ '--stamp-angle': `${tilt}deg`, '--stamp-drop-ms': `${MOTION.stampDropMs / speed}ms`, '--stamp-spread-ms': `${MOTION.inkSpreadMs / speed}ms` } as React.CSSProperties}
      data-reduced={reducedMotion ? 'true' : 'false'}
      aria-label={label}
    >
      {label}
    </button>
  );
};
