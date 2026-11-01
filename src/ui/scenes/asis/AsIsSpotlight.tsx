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
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{currentStation.location}</span>
        </span>
      </div>

      <div className="asis-spotlight-grid">
        {/* Thao tác thủ công */}
        <div className="asis-action-card">
          <div className="asis-action-row">
            <div className="asis-delay-stamp">
              <span>CHỜ:</span>
              <strong>+{currentStation.days} NGÀY</strong>
            </div>
            <div className="asis-action-detail">
              <strong>Nghiệp vụ thực hiện:</strong>
              <span>{currentStation.action}</span>
            </div>
          </div>
          <div className="asis-action-legwork">
            <span className="asis-legwork-bullet">●</span>
            <span>Sinh viên phải trực tiếp đến tận phòng ban nộp hồ sơ giấy và chờ xin chữ ký</span>
          </div>
        </div>

        {/* Giấy ghi chú điểm nghẽn thực tế */}
        <div className="asis-sticky-note">
          <div className="asis-sticky-header">
            <span>TÌNH HUỐNG THỰC TẾ & NGUYÊN NHÂN TẮC NGHẼN</span>
            <span className="asis-sticky-tag">ĐIỂM NGHẼN</span>
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
