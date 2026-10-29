import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../store/useApp';
import { MOTION } from '../motion';
import { sfx } from '../audio/sfx';

/** Vệt giấy quét ngang khi đổi màn; bỏ qua khi giảm hiệu ứng. */
export const SceneWipe: React.FC = () => {
  const screen = useAppStore((s) => s.screen);
  const speed = useAppStore((s) => s.speed) || 1;
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const [wipeKey, setWipeKey] = useState(0);
  const previous = useRef(screen);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      previous.current = screen;
      return;
    }
    if (previous.current === screen) return;
    previous.current = screen;
    if (reducedMotion) return;
    sfx.playPaper();
    setWipeKey((key) => key + 1);
  }, [screen, reducedMotion]);

  if (wipeKey === 0) return null;

  // Giữ sàn ~420ms để tốc độ 2× vẫn kịp nhìn thấy vệt giấy.
  const wipeMs = Math.min(1000, Math.max(420, MOTION.screenTransitionMs / speed));

  return (
    <div
      key={wipeKey}
      className="scene-wipe"
      aria-hidden="true"
      style={{ '--wipe-ms': `${Math.round(wipeMs)}ms` } as React.CSSProperties}
    />
  );
};
