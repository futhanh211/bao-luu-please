import React from 'react';
import { EvidenceItem } from '../../../engine/types';
import { EvidencePaper } from './EvidencePaper';

interface EvidenceZoomProps {
  evidence: EvidenceItem;
  marks: string[];
  onToggle: (key: string) => void;
  onClose: () => void;
  locked?: boolean;
}

/** Bản phóng to đủ đọc trên máy chiếu (chữ >= 18px). */
export const EvidenceZoom: React.FC<EvidenceZoomProps> = ({
  evidence,
  marks,
  onToggle,
  onClose,
  locked,
}) => (
  <div className="evidence-zoom" role="dialog" aria-modal="true" onClick={onClose}>
    <div className="evidence-zoom-inner" onClick={(e) => e.stopPropagation()}>
      <button type="button" className="evidence-zoom-close desk-btn" onClick={onClose}>
        ✕ Đóng (Esc)
      </button>
      <EvidencePaper
        evidence={evidence}
        marks={marks}
        onToggle={onToggle}
        locked={locked}
        large
      />
    </div>
  </div>
);
