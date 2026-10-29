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
          <span>🔄</span>
          HÀNH TRÌNH CHUYỂN PHÁT CẶP HỒ SƠ GIẤY (TUẦN TỰ QUA 8 PHÒNG BAN)
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
                  <span>📁</span>
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
