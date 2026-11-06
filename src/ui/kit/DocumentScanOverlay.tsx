import React, { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../../store/useApp';
import { MOTION } from '../motion';
import { sfx } from '../../ui/audio/sfx';
import { StudentEvidenceOptionKey } from '../../data/customTestData';

export interface DocumentScanOverlayProps {
  isScanning: boolean;
  progress?: number; // 0 - 100
  statusText?: string;
  documentType?: StudentEvidenceOptionKey;
  fileName?: string;
  onComplete?: () => void;
  children?: React.ReactNode;
  className?: string;
  reducedMotion?: boolean;
}

export const DocumentScanOverlay: React.FC<DocumentScanOverlayProps> = ({
  isScanning,
  progress: controlledProgress,
  statusText,
  documentType,
  fileName,
  onComplete,
  children,
  className = '',
  reducedMotion: propReducedMotion,
}) => {
  const storeSpeed = useAppStore((state) => state.speed);
  const storeReducedMotion = useAppStore((state) => state.reducedMotion);

  const speed = storeSpeed;
  const reducedMotion =
    propReducedMotion !== undefined ? propReducedMotion : storeReducedMotion;

  const [internalProgress, setInternalProgress] = useState(0);
  const [laserY, setLaserY] = useState(0); // 0% to 100%
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const currentProgress = controlledProgress !== undefined ? controlledProgress : internalProgress;

  // Xử lý vòng lặp quét (khi không truyền progress từ ngoài)
  useEffect(() => {
    if (!isScanning) {
      setInternalProgress(0);
      setLaserY(0);
      return;
    }

    sfx.playScannerSweep();

    // Thời lượng quét co giãn theo tốc độ (0.5x, 1x, 2x)
    const totalDuration = Math.max(200, (MOTION.scannerSweepMs || 1200) / speed);
    const intervalTime = 30;
    const step = 100 / (totalDuration / intervalTime);

    let progressAccumulator = 0;
    const interval = setInterval(() => {
      progressAccumulator += step;
      if (progressAccumulator >= 100) {
        progressAccumulator = 100;
        clearInterval(interval);
        setInternalProgress(100);
        setLaserY(100);
        sfx.playOcrSuccess();
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
      } else {
        setInternalProgress(Math.floor(progressAccumulator));
        setLaserY(progressAccumulator);
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isScanning, speed]);

  // Âm thanh báo thành công khi progress ngoài chạm 100%
  useEffect(() => {
    if (controlledProgress === 100 && isScanning) {
      sfx.playOcrSuccess();
      onCompleteRef.current?.();
    }
  }, [controlledProgress, isScanning]);

  // Thông điệp trạng thái linh hoạt theo tiến trình
  const computedStatus = (): string => {
    if (statusText) return statusText;
    if (currentProgress < 35) {
      return 'ĐANG QUÉT QUANG HỌC OCR VĂN BẢN...';
    }
    if (currentProgress < 75) {
      if (documentType === 'military') return 'TRÍCH XUẤT LỆNH GỌI & ĐƠN VỊ BAN HÀNH...';
      if (documentType === 'hardship') return 'XÁC THỰC HOÀN CẢNH & CHÍNH QUYỀN ĐỊA PHƯƠNG...';
      if (documentType === 'personal') return 'PHÂN TÍCH NỘI DUNG ĐỀ ĐẠT & ĐƠN VỊ TIẾP NHẬN...';
      return 'TRÍCH XUẤT THỰC THỂ Y KHOA & BỆNH ÁN...';
    }
    return 'ĐỐI CHIẾU CHỮ KÝ VÀ CON DẤU MỘC ĐỎ...';
  };

  return (
    <div
      className={`scanner-viewport ${className}`}
      data-scanning={isScanning}
      data-reduced-motion={reducedMotion}
      aria-busy={isScanning}
      aria-label="Khung ngắm máy quét quang học OCR"
    >
      {/* Nội dung bên trong (hình ảnh hoặc giấy tờ) */}
      {children}

      {/* Lớp phủ HUD khi đang quét */}
      {isScanning && (
        <div className="scanner-overlay-layer">
          {/* Lưới tọa độ quang học (Reticle dots) */}
          <div className="scanner-grid" aria-hidden="true" />

          {/* 4 góc ngắm quang học Viewfinder */}
          <div className="scanner-corner scanner-corner--tl" aria-hidden="true" />
          <div className="scanner-corner scanner-corner--tr" aria-hidden="true" />
          <div className="scanner-corner scanner-corner--bl" aria-hidden="true" />
          <div className="scanner-corner scanner-corner--br" aria-hidden="true" />

          {/* Hộp vùng nhận diện OCR giả lập */}
          {!reducedMotion && (
            <>
              <div
                className="scanner-target-box"
                style={{ top: '14%', left: '12%', width: '45%', height: '18%' }}
                aria-hidden="true"
              />
              <div
                className="scanner-target-box"
                style={{ top: '42%', left: '10%', width: '78%', height: '24%', animationDelay: '0.3s' }}
                aria-hidden="true"
              />
              <div
                className="scanner-target-box"
                style={{ top: '72%', right: '12%', width: '32%', height: '16%', animationDelay: '0.6s' }}
                aria-hidden="true"
              />
            </>
          )}

          {/* Tia laser quét ngang */}
          {!reducedMotion && (
            <div
              className="scanner-laser-line"
              style={{
                top: `${laserY}%`,
                transition: 'top 0.04s linear',
              }}
              aria-hidden="true"
            >
              <div className="scanner-laser-beam" />
            </div>
          )}

          {/* Thanh HUD trạng thái ở chân khung ngắm */}
          <div className="scanner-hud-bar">
            <div className="scanner-hud-header">
              <div className="scanner-hud-status">
                <span className="scanner-hud-dot" aria-hidden="true" />
                <span style={{ fontWeight: 600 }}>{computedStatus()}</span>
              </div>
              <span className="scanner-hud-pct">{Math.floor(currentProgress)}%</span>
            </div>

            {/* Thanh tiến trình quang học */}
            <div className="scanner-progress-track" role="progressbar" aria-valuenow={Math.floor(currentProgress)} aria-valuemin={0} aria-valuemax={100}>
              <div
                className="scanner-progress-fill"
                style={{ width: `${currentProgress}%` }}
              />
            </div>

            {fileName && (
              <div style={{ fontSize: 11, opacity: 0.8, color: 'var(--paper-dim)', marginTop: 2 }}>
                Tệp: <strong>{fileName}</strong>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
