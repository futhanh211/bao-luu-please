import React, { useEffect } from 'react';
import { EvidenceItem } from '../../../engine/types';
import { Paperclip } from '../../kit/Paperclip';
import { sfx } from '../../audio/sfx';

interface Props {
  item: EvidenceItem;
  onClose: () => void;
}

export const EvidenceModal: React.FC<Props> = ({ item, onClose }) => {
  useEffect(() => {
    sfx.playPaperSlide();
  }, []);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 900,
        backgroundColor: 'var(--overlay-scrim)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="paper-sheet paper-lifted"
        style={{
          width: 'min(560px, 92vw)',
          maxHeight: '86vh',
          overflowY: 'auto',
          padding: '26px 30px',
          transform: 'rotate(-0.6deg)',
          boxShadow: 'var(--shadow-paper-lg)',
          position: 'relative',
        }}
      >
        <Paperclip position="top-right" angle={12} />
        <div style={{ borderBottom: '2px solid var(--ink)', paddingBottom: 8, marginBottom: 14 }}>
          <div style={{ fontSize: 11, letterSpacing: 1, color: 'var(--ink-soft)' }}>
            HỆ THỐNG MỘT CỬA SỐ · TỜ MINH CHỨNG SỐ HÓA
          </div>
          <h3 style={{ fontFamily: 'var(--font-paper)', fontSize: 18, lineHeight: 1.3, marginTop: 6, color: 'var(--stamp-blue)' }}>
            {item.name}
          </h3>
        </div>

        <div style={{ fontFamily: 'var(--font-paper)', fontSize: 13.5, lineHeight: 1.6 }}>
          <p style={{ marginBottom: 10, color: 'var(--ink)' }}>{item.content}</p>

          {/* Xem trước tệp ảnh hoặc tệp số hóa tải lên từ máy */}
          {item.fileData && (
            <div style={{ margin: '14px 0', background: 'var(--paper-dim)', padding: 12, borderRadius: 4, border: '1px solid var(--paper-line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 'bold', fontSize: 12, color: 'var(--stamp-blue)' }}>
                  📎 TỆP MINH CHỨNG GỐC TỪ THIẾT BỊ NGƯỜI DÙNG:
                </span>
                <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
                  {(item.fileData.size / 1024).toFixed(1)} KB · {item.fileData.type || 'Tệp tin'}
                </span>
              </div>

              {item.fileData.svgRaw ? (
                <div style={{ textAlign: 'center', background: '#fff', padding: 8, borderRadius: 4, border: '1px solid var(--paper-line)' }}>
                  <div
                    className="sample-svg-preview"
                    style={{ width: '100%', maxHeight: 360, display: 'flex', justifyContent: 'center' }}
                    dangerouslySetInnerHTML={{ __html: item.fileData.svgRaw }}
                  />
                  <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 6 }}>
                    Minh chứng số hóa: <strong>{item.fileData.name}</strong>
                  </div>
                </div>
              ) : item.fileData.dataUrl && item.fileData.type.startsWith('image/') ? (
                <div style={{ textAlign: 'center', background: '#fff', padding: 8, borderRadius: 4, border: '1px solid var(--paper-line)' }}>
                  <img
                    src={item.fileData.dataUrl}
                    alt={item.fileData.name}
                    style={{ maxWidth: '100%', maxHeight: 360, objectFit: 'contain', display: 'block', margin: '0 auto' }}
                  />
                  <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 6 }}>
                    Ảnh minh chứng: <strong>{item.fileData.name}</strong>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: 12,
                    background: '#fff',
                    border: '1px dashed var(--stamp-blue)',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 28 }}>📄</span>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: 13 }}>{item.fileData.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
                        Đã xác nhận và đính kèm thành công từ máy tính
                      </div>
                    </div>
                  </div>
                  {item.fileData.dataUrl && (
                    <a
                      href={item.fileData.dataUrl}
                      download={item.fileData.name}
                      style={{
                        padding: '6px 14px',
                        background: 'var(--stamp-blue)',
                        color: '#fff',
                        borderRadius: 'var(--radius-sm)',
                        textDecoration: 'none',
                        fontSize: 12,
                        fontWeight: 'bold',
                      }}
                    >
                      ⬇ Tải về xem
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Chi tiết các trường thông tin trên giấy xác nhận */}
          {item.fields && item.fields.length > 0 && (
            <div style={{ margin: '14px 0', border: '1px solid var(--paper-line)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ background: 'var(--paper-dim)', padding: '6px 10px', fontWeight: 'bold', fontSize: 11.5, letterSpacing: 0.5, borderBottom: '1px solid var(--paper-line)' }}>
                CHI TIẾT THÔNG TIN TRÊN GIẤY XÁC NHẬN:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 14px', padding: '10px 12px', background: 'rgba(255,255,255,0.4)' }}>
                {item.fields.map((f) => (
                  <div key={f.id} style={{ borderBottom: '1px dotted var(--paper-line)', paddingBottom: 4 }}>
                    <div style={{ color: 'var(--ink-soft)', fontSize: 11 }}>{f.label}:</div>
                    <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{f.value || '—'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p style={{ color: 'var(--ink-soft)', fontSize: 11.5, marginTop: 8 }}>
            Phân loại hồ sơ: <strong>{item.type}</strong> · Mã định danh: <code>{item.id}</code>
          </p>

          {item.issueNotes && (
            <p
              style={{
                marginTop: 10,
                padding: '8px 10px',
                border: '1px dashed var(--amber)',
                background: 'var(--wash-amber)',
                fontSize: 12,
              }}
            >
              ⚠ Ghi chú thẩm tra hồ sơ: {item.issueNotes}
            </p>
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: 18,
            padding: '6px 16px',
            fontFamily: 'var(--font-paper)',
            fontSize: 13,
            background: 'var(--desk-900)',
            color: 'var(--paper)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          Đóng tờ giấy
        </button>
      </div>
    </div>
  );
};
