import { useEffect } from 'react';
import { useAppStore } from '../../store/useApp';
import { sfx } from '../audio/sfx';

/**
 * Đồng bộ các tuỳ chọn toàn cục:
 * prefers-reduced-motion của OS → store; cờ CSS; muted/volume → SoundManager.
 */
export function useGlobalPreferences(): void {
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const setReducedMotion = useAppStore((s) => s.setReducedMotion);
  const customCursor = useAppStore((s) => s.customCursor);
  const muted = useAppStore((s) => s.muted);
  const volume = useAppStore((s) => s.volume);

  // Tôn trọng prefers-reduced-motion của hệ điều hành ở lần mở đầu.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReducedMotion(true);
    }
  }, [setReducedMotion]);

  // Đồng bộ cờ CSS toàn cục để các animation thuần CSS cũng tắt.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.reducedMotion = reducedMotion ? 'true' : 'false';
  }, [reducedMotion]);

  // Đồng bộ trạng thái con trỏ công sở retro lên root document.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.customCursor = customCursor ? 'true' : 'false';
  }, [customCursor]);

  // Store muted/volume → SoundManager. Context chỉ tạo sau thao tác người dùng.
  useEffect(() => {
    sfx.setEnabled(!muted);
  }, [muted]);

  useEffect(() => {
    sfx.setVolume(volume);
  }, [volume]);

  // Một listener duy nhất để resume AudioContext sau cú click/phím đầu tiên.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const resume = () => sfx.resume();
    window.addEventListener('pointerdown', resume);
    window.addEventListener('keydown', resume);
    return () => {
      window.removeEventListener('pointerdown', resume);
      window.removeEventListener('keydown', resume);
    };
  }, []);
}
