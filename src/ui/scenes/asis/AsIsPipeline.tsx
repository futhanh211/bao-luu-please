import React from 'react';
import { motion } from 'framer-motion';
import { AsIsStation } from '../../../data/asis.config';

interface AsIsPipelineProps {
  stations: AsIsStation[];
  currentIdx: number;
  onSelectStation: (index: number) => void;
}

export const AsIsPipeline: React.FC<AsIsPipelineProps> = ({
  stations,
  currentIdx,
  onSelectStation,
}) => {
  return (
    <div className="asis-pipeline-section">
      <div className="asis-pipeline-header">
        <span className="asis-pipeline-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
            <path d="M2 10h20" />
          </svg>
          <span>HÀNH TRÌNH CHUYỂN PHÁT CẶP HỒ SƠ GIẤY (TUẦN TỰ QUA 8 PHÒNG BAN)</span>
        </span>
        <span className="asis-pipeline-hint">
          Nhấp chuột vào trạm bất kỳ để xem chi tiết
        </span>
      </div>

      <div className="asis-pipeline-grid">
        {stations.map((st, idx) => {
          const isPassed = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const status = isCurrent ? 'active' : isPassed ? 'passed' : 'future';

          return (
            <div
              key={st.id}
              className="asis-station-card"
              data-status={status}
              onClick={() => onSelectStation(idx)}
              title={`Trạm ${idx + 1}: ${st.name} (+${st.days} ngày)`}
            >
              <div className="asis-card-top-row">
                <span className="asis-card-status">
                  {isPassed ? '✓ ĐÃ QUA' : isCurrent ? '▶ ĐANG XỬ LÝ' : `BƯỚC ${idx + 1}`}
                </span>
                <span className="asis-card-delay">+{st.days}d</span>
              </div>

              <div className="asis-card-name">{st.name}</div>
              <div className="asis-card-role">{st.role}</div>

              {isCurrent && (
                <motion.div
                  layoutId="active-folder-badge"
                  className="asis-active-folder-badge"
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span>HỒ SƠ TẠI ĐÂY</span>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
