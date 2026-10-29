import React from 'react';
import { AsIsStation } from '../../../data/asis.config';

interface AsIsSpotlightProps {
  currentStation: AsIsStation;
  currentIdx: number;
  totalStations: number;
}

export const AsIsSpotlight: React.FC<AsIsSpotlightProps> = ({
  currentStation,
  currentIdx,
  totalStations,
}) => {
  return (
    <div className="asis-spotlight">
      <div className="asis-spotlight-head">
        <div className="asis-spotlight-title-group">
          <span className="asis-station-badge">
            TRẠM {currentIdx + 1} / {totalStations}
          </span>
          <h2 className="asis-station-name">
            {currentStation.name} ·{' '}
            <span className="asis-station-role">{currentStation.role}</span>
          </h2>
        </div>
        <span className="asis-location-pill" title="Địa điểm xử lý trực tiếp">
          📍 {currentStation.location}
        </span>
      </div>

      <div className="asis-spotlight-grid">
        {/* Thao tác thủ công */}
        <div className="asis-action-card">
          <div className="asis-action-row">
            <div className="asis-delay-stamp">
              <span>⏱ CHỜ:</span>
              <strong>+{currentStation.days} NGÀY</strong>
            </div>
            <div className="asis-action-detail">
              <strong>Nghiệp vụ thực hiện:</strong>
              {currentStation.action}
            </div>
          </div>
          <div className="asis-action-legwork">
            <span>🚶</span>
            <span>Sinh viên phải trực tiếp đến tận phòng ban nộp hồ sơ giấy / lấy chữ ký</span>
          </div>
        </div>

        {/* Giấy ghi chú điểm nghẽn thực tế */}
        <div className="asis-sticky-note">
          <div className="asis-sticky-header">
            <span>📌 TÌNH HUỐNG THỰC TẾ & NGUYÊN NHÂN TẮC NGHẼN:</span>
            <span>ĐIỂM NGHẼN THỰC ĐỊA</span>
          </div>
          <div className="asis-sticky-body">
            <span className="asis-sticky-quote-icon">“</span>
            <span>{currentStation.gag}”</span>
          </div>
        </div>
      </div>
    </div>
  );
};
