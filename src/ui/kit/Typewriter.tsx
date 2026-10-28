import React, { useEffect, useState } from 'react';

interface TypewriterProps {
  text: string;
  speedMs?: number;
  onComplete?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const Typewriter: React.FC<TypewriterProps> = ({
  text,
  speedMs = 30,
  onComplete,
  className = '',
  style = {},
}) => {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    let index = 0;
    setDisplayed('');
    const timer = setInterval(() => {
      index++;
      if (index <= text.length) {
        setDisplayed(text.slice(0, index));
      } else {
        clearInterval(timer);
        onComplete?.();
      }
    }, speedMs);

    return () => clearInterval(timer);
  }, [text, speedMs, onComplete]);

  return (
    <span className={className} style={{ fontFamily: 'var(--font-paper)', ...style }}>
      {displayed}
      <span style={{ animation: 'blink 1s infinite', opacity: 0.8 }}>_</span>
    </span>
  );
};
