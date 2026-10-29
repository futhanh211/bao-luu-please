import React, { useState } from 'react';
import { EvidenceItem } from '../../../engine/types';

const TYPE_LABELS: Record<string, string> = {
  medical_record: 'Giấy y tế',
  military_service: 'Nghĩa vụ quân sự',
  hardship_proof: 'Xác nhận hoàn cảnh',
  personal_reason: 'Giấy tờ cá nhân',
};

interface Props {
  evidence: EvidenceItem[];
  attachedIds: string[];
  locked: boolean;
  onAttach: (id: string) => void;
  onDetach: (id: string) => void;
  onOpen: (item: EvidenceItem) => void;
}

export const EvidenceBag: React.FC<Props> = ({
  evidence,
  attachedIds,
  locked,
  onAttach,
  onDetach,
  onOpen,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const attached = evidence.filter((e) => attachedIds.includes(e.id));

  return (
    <div className="plastic-bag-inner">
      {/* Nắp túi & Khuy cúc bấm nhựa My Clear Bag */}
      <div className="plastic-bag-header">
        <div className="plastic-snap-button" aria-hidden="true" title="Khuy bấm túi nhựa" />
        <div className="plastic-bag-flap" aria-hidden="true" />
        <div className="plastic-bag-label">
          <h3 className="plastic-bag-title">
            <span>📁</span> TÚI MINH CHỨNG
          </h3>
          <p className="plastic-bag-sub">
            Bấm xem · Đính kèm hoặc kéo vào khay
          </p>
        </div>
      </div>

      {/* Danh sách giấy tờ bên trong túi nhựa */}
      <div className="plastic-bag-body student-scroll">
        {evidence.length === 0 && (
          <div className="plastic-bag-empty">
            Túi trống — kịch bản này không có minh chứng.
          </div>
        )}

        {evidence.map((item) => {
          const isAttached = attachedIds.includes(item.id);
          return (
            <div
              key={item.id}
              className="plastic-bag-card"
              data-attached={isAttached}
              data-locked={locked}
              draggable={!locked && !isAttached}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', item.id);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              style={{
                borderLeft: `3px solid ${item.issueNotes ? 'var(--amber)' : 'var(--stamp-green)'}`,
                cursor: locked ? 'var(--cursor-default)' : 'var(--cursor-grab)',
              }}
            >
              <button
                type="button"
                onClick={() => onOpen(item)}
                className="plastic-card-title-btn"
                title="Xem tờ minh chứng"
              >
                {item.name}
              </button>
              <div className="plastic-card-footer">
                <span className="plastic-card-tag">
                  {TYPE_LABELS[item.type] || item.type}
                </span>
                <button
                  type="button"
                  onClick={() => (isAttached ? onDetach(item.id) : onAttach(item.id))}
                  disabled={locked}
                  className={`plastic-card-action-btn ${isAttached ? 'is-attached' : ''}`}
                >
                  {isAttached ? 'Bỏ' : '+ Đính kèm'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Khay đính kèm kiểu ngăn đáy dập nhiệt */}
      <div
        className="plastic-bag-tray"
        data-over={dragOver}
        onDragOver={(e) => {
          if (locked) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (locked) return;
          const id = e.dataTransfer.getData('text/plain');
          if (id) onAttach(id);
        }}
      >
        <div className="plastic-tray-label">
          Khay đính kèm ({attached.length})
        </div>
        {attached.length === 0 ? (
          <span className="plastic-tray-hint">Kéo giấy vào đây hoặc bấm “+ Đính kèm”.</span>
        ) : (
          <div className="plastic-tray-list">
            {attached.map((item) => (
              <div key={item.id} className="plastic-tray-item">
                <span className="plastic-tray-name">📎 {item.name}</span>
                <button
                  type="button"
                  onClick={() => onDetach(item.id)}
                  disabled={locked}
                  title="Bỏ khỏi khay"
                  className="plastic-tray-del-btn"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
