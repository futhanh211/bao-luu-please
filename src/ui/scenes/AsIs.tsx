import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../../store/useApp';
import { ASIS_CONFIG, AsIsStation } from '../../data/asis.config';
import { sfx } from '../audio/sfx';
import { AsIsSpotlight } from './asis/AsIsSpotlight';
import { AsIsPipeline } from './asis/AsIsPipeline';
import { AsIsComparison } from './asis/AsIsComparison';

export const AsIs: React.FC = () => {
  const asIsOpen = useAppStore((s) => s.asIsOpen);
  const setAsIsOpen = useAppStore((s) => s.setAsIsOpen);
  const speed = useAppStore((s) => s.speed);

  const stations: AsIsStation[] = ASIS_CONFIG.stations;
  const totalDays = ASIS_CONFIG.days;

  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [accumDays, setAccumDays] = useState<number>(stations[0]?.days || 0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setAsIsOpen(false);
  }, [setAsIsOpen]);

  const handleNext = useCallback(() => {
    setCurrentIdx((prev) => {
      if (prev < stations.length - 1) {
        sfx.playPaper();
        return prev + 1;
      }
      return prev;
    });
  }, [stations.length]);

  const handlePrev = useCallback(() => {
    setCurrentIdx((prev) => {
      if (prev > 0) {
        sfx.playPaper();
        return prev - 1;
      }
      return prev;
    });
  }, []);

  const handleReplay = useCallback(() => {
    setCurrentIdx(0);
    setIsPlaying(true);
    sfx.playPaper();
  }, []);

  const handleSelectStation = useCallback((idx: number) => {
    setCurrentIdx(idx);
    setIsPlaying(false);
    sfx.playPaper();
  }, []);

  // Keyboard navigation: Escape, Space, ArrowLeft, ArrowRight
  useEffect(() => {
    if (!asIsOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [asIsOpen, close, handlePrev, handleNext]);

  // Simulation timer
  useEffect(() => {
    if (!asIsOpen) {
      setCurrentIdx(0);
      setIsPlaying(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const daysSoFar = stations.slice(0, currentIdx + 1).reduce((acc, s) => acc + s.days, 0);
    setAccumDays(daysSoFar);

    if (!isPlaying) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    if (currentIdx < stations.length - 1) {
      const stepDuration = Math.max(1200, Math.round(2500 / speed));
      timerRef.current = setTimeout(() => {
        setCurrentIdx((prev) => {
          const next = prev + 1;
          sfx.playPaper();
          return next;
        });
      }, stepDuration);
    } else {
      sfx.play('chime');
      setIsPlaying(false);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [asIsOpen, currentIdx, isPlaying, speed, stations]);

  if (!asIsOpen) return null;

  const currentStation = stations[currentIdx] || stations[0];
  const progressPercent = Math.min(100, Math.round((accumDays / totalDays) * 100));

  return (
    <div
      className="asis-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <section
        className="asis-card"
        role="dialog"
        aria-modal="true"
        aria-label="Mô phỏng quy trình As-Is"
      >
        {/* Header với đồng hồ cơ học và nhãn bối cảnh */}
        <header className="asis-header">
          <div className="asis-header-titles">
            <div className="asis-eyebrow">
              <span className="asis-eyebrow-badge">BỐI CẢNH HIỆN HÀNH</span>
              <span>QUY TRÌNH THỦ TỤC GIẤY TẠI ĐH KINH TẾ – ĐH ĐÀ NẴNG</span>
            </div>
            <h1 className="asis-title">
              <span className="asis-title-icon">📂</span>
              MÔ PHỎNG QUY TRÌNH AS-IS (22 NGÀY LÀM VIỆC)
            </h1>
          </div>

          <div className="asis-header-right">
            {/* Retro Odometer Display */}
            <div className="asis-odometer" title={`Đã tích lũy ${accumDays} trên tổng ${totalDays} ngày làm việc`}>
              <div className="asis-odometer-row">
                <span className="asis-odometer-label">ĐÃ MẤT:</span>
                <span className="asis-odometer-num">{accumDays}</span>
                <span>/ {totalDays} NGÀY</span>
              </div>
              <div className="asis-odometer-bar">
                <div className="asis-odometer-fill" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            <button
              type="button"
              className="asis-close-btn"
              onClick={close}
              title="Đóng mô phỏng (Phím Esc)"
              aria-label="Đóng As-Is"
            >
              ✕
            </button>
          </div>
        </header>

        {/* Nội dung chính */}
        <div className="asis-body">
          {/* Spotlight: Trạm đang xử lý & Giấy note điểm nghẽn thực tế */}
          <AsIsSpotlight
            currentStation={currentStation}
            currentIdx={currentIdx}
            totalStations={stations.length}
          />

          {/* Hành trình 8 trạm kết nối */}
          <AsIsPipeline
            stations={stations}
            currentIdx={currentIdx}
            onSelectStation={handleSelectStation}
          />

          {/* Bảng so sánh As-Is (Hiện hành) vs To-Be (Bảo lưu, Please) */}
          <AsIsComparison />
        </div>

        {/* Footer điều khiển */}
        <footer className="asis-footer">
          <div className="asis-controls-left">
            <button
              type="button"
              className="asis-btn-primary"
              data-playing={isPlaying}
              onClick={() => setIsPlaying((p) => !p)}
              title="Phím tắt: Phím Cách (Space)"
            >
              {isPlaying ? '⏸ TẠM DỪNG' : '▶ TỰ ĐỘNG CHẠY'}
            </button>

            <button
              type="button"
              className="asis-btn-step"
              onClick={handlePrev}
              disabled={currentIdx === 0}
              title="Phím tắt: Phím Mũi tên Trái"
            >
              ◀ Trạm trước
            </button>

            <button
              type="button"
              className="asis-btn-step"
              onClick={handleNext}
              disabled={currentIdx === stations.length - 1}
              title="Phím tắt: Phím Mũi tên Phải"
            >
              Trạm kế tiếp ▶
            </button>

            <button
              type="button"
              className="asis-btn-replay"
              onClick={handleReplay}
              title="Xem lại hành trình từ đầu"
            >
              ↻ Xem lại từ đầu
            </button>

            <span className="asis-keyboard-hint">
              [Phím tắt: Space · ◀ / ▶ · Esc]
            </span>
          </div>

          <button
            type="button"
            className="asis-btn-close"
            onClick={close}
            title="Đóng cửa sổ mô phỏng (Esc)"
          >
            ĐÓNG (ESC)
          </button>
        </footer>
      </section>
    </div>
  );
};
