import React, { useState, useRef } from 'react';
import { EvidenceItem } from '../../../engine/types';
import { StudentEvidenceOptionKey } from '../../../data/customTestData';

const TYPE_LABELS: Record<string, string> = {
  medical_record: 'Giấy y tế',
  military_call: 'Nghĩa vụ quân sự',
  military_service: 'Nghĩa vụ quân sự',
  hardship_proof: 'Xác nhận hoàn cảnh',
  personal_reason: 'Giấy tờ cá nhân',
  attached_file: 'Tệp từ máy tính',
};

interface Props {
  evidence: EvidenceItem[];
  attachedIds: string[];
  locked: boolean;
  onAttach: (id: string) => void;
  onDetach: (id: string) => void;
  onOpen: (item: EvidenceItem) => void;
  onStartFillOption?: (key?: StudentEvidenceOptionKey) => void;
  onRemoveItem?: (id: string) => void;
  onEditItem?: (item: EvidenceItem) => void;
  onDirectFileUpload?: (file: File) => void;
}

export const EvidenceBag: React.FC<Props> = ({
  evidence,
  attachedIds,
  locked,
  onAttach,
  onDetach,
  onOpen,
  onStartFillOption,
  onRemoveItem,
  onEditItem,
  onDirectFileUpload,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const directFileInputRef = useRef<HTMLInputElement>(null);
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
        {/* Nút thêm minh chứng 1-chạm: Mở thẳng cửa sổ khai báo & AI quét tự động nhận diện */}
        {evidence.length === 0 && onStartFillOption && (
          <div className="plastic-add-area">
            <button
              type="button"
              className="plastic-add-button"
              onClick={() => onStartFillOption()}
              disabled={locked}
              title="Bấm để tải ảnh hoặc giấy tờ minh chứng"
            >
              <span className="plastic-add-plus">＋</span>
              <span className="plastic-add-title">THÊM MINH CHỨNG</span>
              <span className="plastic-add-sub">Tải ảnh / giấy tờ (Bệnh viện, Quân sự, UBND...)</span>
            </button>
          </div>
        )}

        {/* Danh sách các giấy tờ trong túi */}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4 }}>
                <button
                  type="button"
                  onClick={() => onOpen(item)}
                  className="plastic-card-title-btn"
                  title="Xem tờ minh chứng"
                >
                  {item.name}
                </button>
                {!locked && (
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {onEditItem && item.type !== 'attached_file' && (
                      <button
                        type="button"
                        onClick={() => onEditItem(item)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--stamp-blue)',
                          fontSize: 11,
                          cursor: 'pointer',
                          padding: '0 2px',
                        }}
                        title="Chỉnh sửa thông tin minh chứng này"
                      >
                        ✎
                      </button>
                    )}
                    {onRemoveItem && (
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        className="plastic-card-remove-btn"
                        title="Xóa giấy này để chọn lại"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}
              </div>

              {item.fileData && (
                <div style={{ fontSize: 11, color: 'var(--stamp-blue)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>📁</span>
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 170 }}>
                    {item.fileData.name} ({(item.fileData.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
              )}

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
                  {isAttached ? '✓ Đã đính kèm (Bỏ)' : '+ Đính kèm'}
                </button>
              </div>
            </div>
          );
        })}

        {/* Nút thêm/đổi giấy tờ khi đã có giấy tờ trong túi */}
        {!locked && evidence.length > 0 && onStartFillOption && (
          <button
            type="button"
            className="plastic-add-secondary-btn"
            onClick={() => onStartFillOption()}
            title="Đổi hoặc nạp minh chứng khác"
          >
            <span>＋</span> Tải / Đổi giấy tờ minh chứng khác
          </button>
        )}

        {/* Nút tải thêm tệp trực tiếp từ máy tính */}
        {!locked && onDirectFileUpload && (
          <div style={{ marginTop: 4 }}>
            <input
              ref={directFileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onDirectFileUpload(f);
              }}
            />
            <button
              type="button"
              className="plastic-add-secondary-btn"
              onClick={() => directFileInputRef.current?.click()}
              style={{ borderStyle: 'dashed' }}
              title="Tải thêm bản chụp hoặc tài liệu minh chứng từ máy tính"
            >
              <span>📁</span> Tải thêm tệp từ máy tính
            </button>
          </div>
        )}
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
