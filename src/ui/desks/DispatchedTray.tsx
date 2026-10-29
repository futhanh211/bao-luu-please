import React from 'react';

interface DispatchedTrayProps {
  deskRoleName: string;
  nextStepName: string;
}

/**
 * Khay công văn đã bàn giao (Outbox Tray) đặt trên mặt bàn làm việc.
 * Thay thế cho các hộp thoại rỗng màu trắng, đồng bộ 100% phong cách bàn gỗ Paper Please.
 */
export const DispatchedTray: React.FC<DispatchedTrayProps> = ({
  deskRoleName,
  nextStepName,
}) => {
  return (
    <div className="dispatched-outbox-tray">
      <div className="dispatched-outbox-header">
        <div className="dispatched-outbox-tag">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Khay bàn giao hồ sơ (Outbox Tray) · Ca hiện tại</span>
        </div>
        <div style={{ fontFamily: 'var(--font-paper)', fontSize: '11px', color: 'var(--paper-dim)' }}>
          HỆ THỐNG MỘT CỬA SỐ
        </div>
      </div>

      <div className="dispatched-outbox-body">
        <div className="dispatched-outbox-icon" title="Hồ sơ đã được đóng dấu và chuyển tiếp">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M22 12h-6l-2 3h-4l-2-3H2" />
            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
          </svg>
        </div>

        <div>
          <h4 className="dispatched-outbox-title">
            Khay tiếp nhận của {deskRoleName} hiện đã trống
          </h4>
          <p className="dispatched-outbox-desc">
            Cán bộ đã hoàn tất toàn bộ yêu cầu thẩm định tại bước này. Hồ sơ đã được chuyển tiếp tự động sang{' '}
            <strong style={{ color: 'var(--paper)', textDecoration: 'underline' }}>{nextStepName}</strong>{' '}
            theo đúng tiến trình BPMN 2.0.
          </p>
        </div>
      </div>
    </div>
  );
};
