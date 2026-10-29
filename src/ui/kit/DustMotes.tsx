import React from 'react';
import { useAppStore } from '../../store/useApp';

interface Particle {
  x: number;
  y: number;
  size: number;
  duration: number;
  opacity: number;
  blur: number;
  anim: string;
}

const PARTICLES: Particle[] = [
  { x: 22, y: 16, size: 2.2, duration: 11, opacity: 0.5, blur: 0.3, anim: 'dust-float-1' },
  { x: 34, y: 24, size: 1.5, duration: 14, opacity: 0.45, blur: 0, anim: 'dust-float-2' },
  { x: 42, y: 12, size: 2.8, duration: 9, opacity: 0.65, blur: 0.5, anim: 'dust-float-3' },
  { x: 48, y: 28, size: 1.2, duration: 16, opacity: 0.35, blur: 0, anim: 'dust-float-1' },
  { x: 53, y: 19, size: 2.0, duration: 12, opacity: 0.55, blur: 0.2, anim: 'dust-float-2' },
  { x: 61, y: 31, size: 1.6, duration: 15, opacity: 0.4, blur: 0.1, anim: 'dust-float-3' },
  { x: 68, y: 15, size: 2.4, duration: 10, opacity: 0.6, blur: 0.4, anim: 'dust-float-1' },
  { x: 28, y: 38, size: 1.3, duration: 17, opacity: 0.35, blur: 0, anim: 'dust-float-2' },
  { x: 38, y: 46, size: 1.8, duration: 13, opacity: 0.45, blur: 0.2, anim: 'dust-float-3' },
  { x: 46, y: 36, size: 2.6, duration: 10, opacity: 0.6, blur: 0.4, anim: 'dust-float-1' },
  { x: 56, y: 44, size: 1.4, duration: 18, opacity: 0.35, blur: 0, anim: 'dust-float-2' },
  { x: 64, y: 42, size: 2.1, duration: 12, opacity: 0.5, blur: 0.3, anim: 'dust-float-3' },
  { x: 32, y: 55, size: 1.1, duration: 19, opacity: 0.3, blur: 0, anim: 'dust-float-1' },
  { x: 50, y: 52, size: 1.9, duration: 14, opacity: 0.45, blur: 0.2, anim: 'dust-float-2' },
  { x: 58, y: 58, size: 2.3, duration: 11, opacity: 0.55, blur: 0.3, anim: 'dust-float-3' },
  { x: 72, y: 26, size: 1.5, duration: 15, opacity: 0.4, blur: 0, anim: 'dust-float-1' },
];

/**
 * Hạt bụi vàng li ti bay lơ lửng trong luồng sáng xiên bàn làm việc.
 * Mang lại cảm giác điện ảnh hoài cổ như ánh nắng chiếu qua cửa sổ văn phòng hành chính.
 * Tuyệt đối không chiếm diện tích màn hình, không chặn thao tác click (pointer-events: none).
 */
export const DustMotes: React.FC = () => {
  const reducedMotion = useAppStore((s) => s.reducedMotion);

  if (reducedMotion) return null;

  return (
    <div
      className="dust-motes-container"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 2,
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      {/* Vạt nắng xiên dịu nhẹ chiếu qua cửa sổ góc trên bàn làm việc */}
      <div
        className="sunlight-shaft"
        style={{
          position: 'absolute',
          top: '-25%',
          left: '12%',
          width: '52%',
          height: '150%',
          background:
            'linear-gradient(125deg, rgba(255, 245, 205, 0.038) 0%, rgba(255, 235, 175, 0.016) 38%, transparent 72%)',
          transform: 'rotate(-10deg)',
          transformOrigin: 'top left',
          filter: 'blur(36px)',
          pointerEvents: 'none',
        }}
      />

      {PARTICLES.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 235, 175, 0.75)',
            boxShadow: `0 0 ${p.size * 2}px rgba(255, 235, 175, 0.8)`,
            filter: p.blur > 0 ? `blur(${p.blur}px)` : undefined,
            opacity: p.opacity,
            animation: `${p.anim} ${p.duration}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.55}s`,
          }}
        />
      ))}
    </div>
  );
};
