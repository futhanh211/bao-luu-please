import React from 'react';
import { useAppStore } from '../../store/useApp';
import { MOTION } from '../motion';
import { Typewriter } from './Typewriter';

interface AiTextProps {
  text: string;
  speedMs?: number;
  className?: string;
  style?: React.CSSProperties;
  onComplete?: () => void;
}

/** Chữ do AI tạo: gõ từng ký tự, tôn trọng tốc độ ca và chế độ nhẹ. */
export const AiText: React.FC<AiTextProps> = ({
  text,
  speedMs,
  className = '',
  style,
  onComplete,
}) => {
  const speed = useAppStore((s) => s.speed) || 1;
  const reducedMotion = useAppStore((s) => s.reducedMotion);

  if (reducedMotion) {
    return (
      <span className={className} style={style}>
        {text}
      </span>
    );
  }

  return (
    <Typewriter
      text={text}
      speedMs={(speedMs ?? MOTION.aiTypewriterCharMs) / speed}
      className={className}
      style={style}
      onComplete={onComplete}
    />
  );
};
