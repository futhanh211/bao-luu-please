import React, { useState, useRef } from 'react';
import { EvidenceItem } from '../../../engine/types';
import {
  STUDENT_EVIDENCE_OPTIONS,
  StudentEvidenceOptionKey,
} from '../../../data/customTestData';

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
  onStartFillOption?: (key: StudentEvidenceOptionKey) => void;
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
  const [isPickerOpen, setIsPickerOpen] = useState(false);
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
        {/* Nút dấu cộng (+) lớn khi túi chưa có minh chứng và picker chưa mở */}
        {evidence.length === 0 && !isPickerOpen && (
          <div className="plastic-add-area">
            <button
              type="button"
              className="plastic-add-button"
              onClick={() => setIsPickerOpen(true)}
              disabled={locked}
              title="Bấm dấu cộng để chọn minh chứng"
            >
              <span className="plastic-add-plus">＋</span>
              <span className="plastic-add-title">THÊM MINH CHỨNG</span>
              <span className="plastic-add-sub">Bấm dấu cộng để chọn giấy tờ</span>
            </button>
          </div>
        )}

        {/* Bảng các ô tùy chọn khi bấm dấu cộng (+) */}
        {isPickerOpen && (
          <div className="plastic-picker-container">
            <div className="plastic-picker-header">
              <span className="plastic-picker-title">CHỌN LOẠI GIẤY TỜ:</span>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="plastic-picker-close-btn"
                title="Đóng bảng chọn"
              >
                ✕
              </button>
            </div>
            <div className="plastic-picker-list">
              {STUDENT_EVIDENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setIsPickerOpen(false);
                    onStartFillOption?.(opt.key);
                  }}
                  className="plastic-picker-opt-btn"
                >
                  <div className="plastic-picker-opt-title">
                    <span className="plastic-picker-opt-icon">{opt.icon}</span>
                    <span>{opt.title}</span>
                  </div>
                  <div className="plastic-picker-opt-sub">{opt.description}</div>
                </button>
              ))}
            </div>
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
        {!locked && evidence.length > 0 && !isPickerOpen && onStartFillOption && (
          <button
            type="button"
            className="plastic-add-secondary-btn"
            onClick={() => setIsPickerOpen(true)}
            title="Đổi hoặc thêm minh chứng khác"
          >
            <span>＋</span> Đổi / Chọn giấy tờ khác
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
