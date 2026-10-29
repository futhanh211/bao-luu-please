import React from 'react';
import { useAppStore } from '../../store/useApp';

interface ShortcutItem {
  key: string;
  label: string;
  description: string;
}

const SHORTCUTS: ShortcutItem[] = [
  { key: '1 – 5', label: 'Chuyển vai trò', description: 'Chuyển nhanh giữa 5 bàn: 1: SV, 2: Hệ thống, 3: Cố vấn, 4: CTSV, 5: BGH' },
  { key: 'Space', label: 'Bước tiếp / Tạm dừng', description: 'Tạm dừng/Tiếp tục (Play/Director mode) hoặc Bước tiếp 1 bước (Step mode)' },
  { key: 'D', label: 'Chế độ Đạo diễn', description: 'Kích hoạt Director mode — tự động chạy toàn bộ ca và thuyết minh caption' },
  { key: 'S', label: 'Chế độ từng bước', description: 'Kích hoạt Step mode — dừng lại ở từng node BPMN để giải thích logic' },
  { key: 'B', label: 'Bản đồ BPMN', description: 'Bật / tắt bản đồ BPMN toàn màn hình (chế độ X-quang quy trình)' },
  { key: 'T / Shift+T', label: 'Tua ngày ảo', description: 'Tua +1 ngày làm việc (giữ Shift để tua +3 ngày kích hoạt Boundary Timer SLA)' },
  { key: '+ / -', label: 'Đổi tốc độ', description: 'Luân chuyển tốc độ mô phỏng: 0.5× (chậm) → 1× (chuẩn) → 2× (nhanh)' },
  { key: 'P', label: 'Ghim Caption', description: 'Ghim thẻ chú thích BPMN ở góc dưới để sinh viên/thầy giáo kịp đọc' },
  { key: 'M', label: 'Âm thanh', description: 'Bật / tắt âm thanh tổng hợp WebAudio (mặc định tắt an toàn)' },
  { key: 'R', label: 'Reset ca', description: 'Đặt lại trạng thái kịch bản về ban đầu' },
  { key: 'F', label: 'Toàn màn hình', description: 'Bật / tắt chế độ toàn màn hình trình chiếu (HTML5 Fullscreen)' },
  { key: '?', label: 'Trợ giúp', description: 'Mở / đóng bảng hướng dẫn và phím tắt này' },
  { key: 'Esc', label: 'Đóng cửa sổ', description: 'Đóng Trợ giúp, Cài đặt, Báo cáo cuối ca hoặc Bản đồ toàn màn hình' },
];

export const Help: React.FC = () => {
  const helpOpen = useAppStore((s) => s.helpOpen);
  const setHelpOpen = useAppStore((s) => s.setHelpOpen);

  if (!helpOpen) return null;

  const close = () => setHelpOpen(false);

  return (
    <div
      className="help-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <section
        className="help-card"
        role="dialog"
        aria-modal="true"
        aria-label="Trợ giúp và phím tắt"
        style={{
          backgroundColor: 'var(--paper)',
          color: 'var(--ink)',
          width: '100%',
          maxWidth: '880px',
          maxHeight: '90vh',
          borderRadius: 'var(--radius-sm)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
          border: '2px solid var(--paper-line)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'var(--font-paper)',
        }}
      >
        {/* Header */}
        <header
          style={{
            padding: '18px 24px',
            backgroundColor: 'var(--desk-900)',
            color: 'var(--paper)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid var(--amber)',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-paper)',
                fontSize: '11px',
                color: 'var(--amber)',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              HỆ THỐNG MÔ PHỎNG QUY TRÌNH TO-BE · ĐH KINH TẾ – ĐHĐN
            </div>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 800,
                letterSpacing: '1px',
                margin: 0,
                color: '#ffffff',
              }}
            >
              📋 HƯỚNG DẪN THUYẾT TRÌNH & BẢNG PHÍM TẮT
            </h1>
          </div>
          <button
            type="button"
            onClick={close}
            style={{
              background: 'transparent',
              border: '1px solid var(--desk-500)',
              color: 'var(--paper)',
              fontSize: '18px',
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'var(--cursor-pointer)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Đóng (Esc)"
            aria-label="Đóng trợ giúp"
          >
            ✕
          </button>
        </header>

        {/* Content */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            lineHeight: 1.5,
          }}
        >
          {/* Section 1: Presentation Modes */}
          <section>
            <h2
              style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: 'var(--desk-900)',
                borderBottom: '2px solid var(--paper-line)',
                paddingBottom: '6px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>🎬</span> 3 CHẾ ĐỘ VẬN HÀNH QUY TRÌNH
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '12px',
              }}
            >
              <div
                style={{
                  backgroundColor: 'var(--paper-dim)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--paper-line)',
                }}
              >
                <div style={{ fontWeight: 'bold', color: 'var(--ink)', marginBottom: '4px' }}>
                  🎬 Director (Đạo diễn — Phím D)
                </div>
                <div style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>
                  Hệ thống tự động thực hiện và thuyết minh mọi bước trong 90–120s. Thích hợp nhất khi thuyết trình không cần chạm chuột.
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--paper-dim)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--paper-line)',
                }}
              >
                <div style={{ fontWeight: 'bold', color: 'var(--ink)', marginBottom: '4px' }}>
                  ▶ Play (Tự động + Người đóng dấu)
                </div>
                <div style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>
                  Máy tự động xử lý các Service/Send/Rule task. Dừng lại tại bàn Cố vấn (T4), CTSV (T5), BGH (T9) để bạn trực tiếp thao tác.
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--paper-dim)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--paper-line)',
                }}
              >
                <div style={{ fontWeight: 'bold', color: 'var(--ink)', marginBottom: '4px' }}>
                  ⏭ Step (Từng bước — Phím S / Space)
                </div>
                <div style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>
                  Dừng lại ở mỗi node BPMN. Thích hợp khi trả lời câu hỏi phản biện của thầy cô về logic rẽ nhánh XOR/AND.
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Shortcuts Table */}
          <section>
            <h2
              style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: 'var(--desk-900)',
                borderBottom: '2px solid var(--paper-line)',
                paddingBottom: '6px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>⌨️</span> BẢNG PHÍM TẮT THAO TÁC NHANH
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                gap: '8px 16px',
              }}
            >
              {SHORTCUTS.map((s) => (
                <div
                  key={s.key}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(0, 0, 0, 0.03)',
                  }}
                >
                  <kbd
                    style={{
                      fontFamily: 'var(--font-hud)',
                      fontSize: '15px',
                      backgroundColor: 'var(--desk-900)',
                      color: 'var(--amber)',
                      padding: '2px 8px',
                      borderRadius: '3px',
                      border: '1px solid var(--desk-700)',
                      minWidth: '58px',
                      textAlign: 'center',
                      boxShadow: '0 2px 0 rgba(0,0,0,0.3)',
                      flexShrink: 0,
                    }}
                  >
                    {s.key}
                  </kbd>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--ink)' }}>
                      {s.label}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
                      {s.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Scenario quick guide */}
          <section>
            <h2
              style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: 'var(--desk-900)',
                borderBottom: '2px solid var(--paper-line)',
                paddingBottom: '6px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>💡</span> GỢI Ý CÁC KỊCH BẢN TRÌNH CHIẾU
            </h2>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--ink)' }}>
              <li style={{ marginBottom: '6px' }}>
                <strong>S1 (Happy Path — Minh Khoa):</strong> Chạy Director mode (90–120s) minh họa luồng song song G2 và ký số tự động.
              </li>
              <li style={{ marginBottom: '6px' }}>
                <strong>S4 (Timer SLA — Hoàng Nam):</strong> Bấm <kbd>Shift+T</kbd> để tua 3 ngày; Boundary Timer non-interrupting nhắc việc mà không làm hủy User Task.
              </li>
              <li style={{ marginBottom: '6px' }}>
                <strong>S5 (Minh chứng giả — Đức Thịnh):</strong> AI-3 phát hiện ngày bất thường; cán bộ CTSV soi và đóng dấu KHÔNG HỢP LỆ (minh họa "AI đề xuất, Người quyết định").
              </li>
              <li>
                <strong>So sánh As-Is:</strong> Bấm nút "Xem bản As-Is" ở màn tiêu đề hoặc báo cáo để làm nổi bật sự vượt trội từ 22 ngày giấy xuống 3 ngày To-Be số hóa.
              </li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <footer
          style={{
            padding: '14px 24px',
            backgroundColor: 'var(--paper-dim)',
            borderTop: '1px solid var(--paper-line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
            Nhấn <kbd style={{ padding: '1px 5px', background: '#e0d8c0', borderRadius: '2px' }}>Esc</kbd> hoặc phím <kbd style={{ padding: '1px 5px', background: '#e0d8c0', borderRadius: '2px' }}>?</kbd> để đóng bảng này.
          </span>
          <button
            type="button"
            onClick={close}
            style={{
              padding: '6px 18px',
              fontFamily: 'var(--font-paper)',
              fontSize: '13px',
              fontWeight: 'bold',
              backgroundColor: 'var(--desk-900)',
              color: 'var(--paper)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'var(--cursor-pointer)',
            }}
          >
            ĐÃ HIỂU (ESC)
          </button>
        </footer>
      </section>
    </div>
  );
};
