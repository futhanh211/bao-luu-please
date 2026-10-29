import React from 'react';
import { Paper } from '../kit/Paper';
import { usePlaybackStore } from '../../store/playback';
import { useAuthStore } from '../../store/useAuth';
import { useAppStore } from '../../store/useApp';
import { sfx } from '../audio/sfx';

export type EmptyReason = 'not-submitted' | 'upcoming' | 'done' | 'ended';

const REASON_TEXT: Record<EmptyReason, { title: string; detail: string }> = {
  'not-submitted': {
    title: 'Chưa có hồ sơ được gửi tới',
    detail: 'Sinh viên chưa nộp đơn. Bàn này sẽ nhận hồ sơ ngay khi sinh viên nộp đơn trực tuyến và hệ thống kiểm tra hợp lệ.',
  },
  upcoming: {
    title: 'Chưa tới lượt bàn này',
    detail: 'Hồ sơ đang được xử lý ở bước trước. Hãy theo dõi bản đồ hoặc chờ hệ thống chuyển việc.',
  },
  done: {
    title: 'Đã xử lý xong',
    detail: 'Hồ sơ đã được đóng dấu tại bàn này và chuyển sang bước tiếp theo.',
  },
  ended: {
    title: 'Ca đã kết thúc',
    detail: 'Không còn hồ sơ chờ xử lý ở bàn này.',
  },
};

export const DeskEmpty: React.FC<{ reason: EmptyReason; deskName: string }> = ({
  reason,
  deskName,
}) => {
  const text = REASON_TEXT[reason];
  const submitApplication = usePlaybackStore((s) => s.submitApplication);
  const setScreen = useAppStore((s) => s.setScreen);
  const logout = useAuthStore((s) => s.logout);

  const handleQuickSubmit = async () => {
    sfx.play('stamp');
    await submitApplication({ useScenarioDefaults: true });
  };

  return (
    <Paper minHeight={420} width="min(860px, 92vw)" rotation={-0.4}>
      <div style={{ borderBottom: '2px solid var(--ink)', paddingBottom: 12, marginBottom: 22 }}>
        <h2 style={{ fontFamily: 'var(--font-paper)', fontSize: 24, textTransform: 'uppercase' }}>
          {deskName}
        </h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: 15 }}>
          Bàn này chưa có hồ sơ đang chờ duyệt.
        </p>
      </div>
      <div
        style={{
          border: '1px dashed var(--paper-line)',
          background: 'var(--paper-dim)',
          padding: '28px 26px',
          textAlign: 'center',
          fontFamily: 'var(--font-paper)',
        }}
      >
        <div style={{ fontSize: 34, marginBottom: 8 }}>🗂️</div>
        <div style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>{text.title}</div>
        <div style={{ fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.6, maxWidth: 540, margin: '0 auto' }}>
          {text.detail}
        </div>

        {reason === 'not-submitted' && (
          <div
            style={{
              marginTop: 22,
              paddingTop: 18,
              borderTop: '1px dashed var(--paper-line)',
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={handleQuickSubmit}
              style={{
                padding: '10px 20px',
                backgroundColor: 'var(--desk-900)',
                color: 'var(--amber)',
                border: '2px solid var(--amber)',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 'bold',
                fontSize: 14,
                cursor: 'var(--cursor-pointer)',
                fontFamily: 'var(--font-paper)',
              }}
              title="Mô phỏng sinh viên nộp đơn kịch bản S1 để chuyển ngay tới bàn này duyệt"
            >
              ⚡ TỰ ĐỘNG NỘP HỒ SƠ MẪU (S1) ĐỂ DUYỆT NGAY
            </button>

            <button
              type="button"
              onClick={() => {
                sfx.play('paper');
                logout();
                setScreen('login');
              }}
              style={{
                padding: '10px 18px',
                backgroundColor: '#fffdf8',
                color: 'var(--ink)',
                border: '1px solid var(--ink)',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 'bold',
                fontSize: 14,
                cursor: 'var(--cursor-pointer)',
                fontFamily: 'var(--font-paper)',
              }}
              title="Đăng xuất để vào Cổng Sinh viên tự điền và nộp đơn"
            >
              🎓 VÀO CỔNG SINH VIÊN TỰ NỘP ĐƠN
            </button>
          </div>
        )}
      </div>
    </Paper>
  );
};
