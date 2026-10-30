import React, { useState } from 'react';
import { StudentApplicationForm, EvidenceItem } from '../../../engine/types';
import { Paper } from '../../kit/Paper';
import { Stamp } from '../../kit/Stamp';
import { ArchivedCaseDocument } from '../ArchivedCaseDocument';
import { DispatchedTray } from '../DispatchedTray';
import { useAuthStore } from '../../../store/useAuth';
import { useAppStore } from '../../../store/useApp';
import { sfx } from '../../audio/sfx';

interface AdvisorPortalResultProps {
  form: StudentApplicationForm;
  evidence: EvidenceItem[];
  advisorStatus: 'confirmed' | 'declined';
  caseCode: string;
  day: number;
}

export const AdvisorPortalResult: React.FC<AdvisorPortalResultProps> = ({
  form,
  evidence,
  advisorStatus,
  caseCode,
  day,
}) => {
  const [showDocument, setShowDocument] = useState(false);
  const logout = useAuthStore((s) => s.logout);
  const setScreen = useAppStore((s) => s.setScreen);

  const isConfirmed = advisorStatus !== 'declined';

  const handleLogout = () => {
    sfx.play('paper');
    logout();
    setScreen('login');
  };

  return (
    <div className="desk-page advisor-portal-page portal-result-container">
      {/* Tờ Biên bản bàn giao hồ sơ chính thức (Paper 2.0 vintage) */}
      <Paper
        className="portal-docket-paper"
        elevated
        watermark
        creased
        clip="top-left"
        width="100%"
      >
        {/* Dòng tiêu ngữ hành chính Một Cửa Số */}
        <div className="portal-header-row">
          <div>
            <div className="portal-agency-title">
              ĐẠI HỌC ĐÀ NẴNG · TRƯỜNG ĐẠI HỌC KINH TẾ
            </div>
            <div className="portal-system-sub">
              HỆ THỐNG MỘT CỬA SỐ — PHIẾU XÁC NHẬN Ý KIẾN CỐ VẤN HỌC TẬP
            </div>
          </div>
          <div className="portal-header-code">
            <div>MÃ LƯU TRỮ: <strong>{caseCode}</strong></div>
            <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>NGÀY LÀM VIỆC {day}</div>
          </div>
        </div>

        {/* Nội dung kết quả & Con dấu dập chéo Paper Please */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div className={`portal-status-kicker ${isConfirmed ? 'confirmed' : 'declined'}`}>
              <span>{isConfirmed ? '✓ ĐÃ PHÊ DUYỆT XÁC NHẬN NGUYỆN VỌNG' : '✗ KHÔNG XÁC NHẬN BẢO LƯU'}</span>
              <span>· TÁC VỤ T4 HOÀN TẤT</span>
            </div>

            <h2 className="portal-main-heading">
              {isConfirmed
                ? 'Ý kiến Cố vấn học tập đã được đóng dấu niêm phong'
                : 'Cố vấn học tập không xác nhận nguyện vọng bảo lưu'}
            </h2>

            <p className="portal-main-desc">
              {isConfirmed ? (
                <>
                  Thầy/Cô đã hoàn tất bước xác nhận nguyện vọng bảo lưu của sinh viên{' '}
                  <strong style={{ color: 'var(--ink)' }}>{form.fullName}</strong> (MSSV: {form.mssv}). Hồ sơ đã được
                  chuyển tự động lên <strong>Phòng Công tác sinh viên (CTSV)</strong> để thẩm định minh chứng tiếp theo.
                </>
              ) : (
                <>
                  Thầy/Cô đã từ chối xác nhận nguyện vọng bảo lưu của sinh viên{' '}
                  <strong style={{ color: 'var(--ink)' }}>{form.fullName}</strong> (MSSV: {form.mssv}). Hồ sơ đã dừng
                  xử lý và hệ thống Một cửa số đã thông báo từ chối tới Cổng Sinh viên.
                </>
              )}
            </p>
          </div>

          <div style={{ transform: 'rotate(-3deg)', margin: '8px 12px 0 0' }}>
            <Stamp
              label={isConfirmed ? 'XÁC NHẬN' : 'KHÔNG XÁC NHẬN'}
              color={isConfirmed ? 'green' : 'red'}
              seed="T4-portal-done"
              size="md"
            />
          </div>
        </div>

        {/* Bảng trích yếu thông tin hồ sơ (Routing Docket) */}
        <div className="portal-summary-docket">
          <div className="portal-docket-cell">
            <span className="portal-docket-label">Mã hồ sơ tiếp nhận:</span>
            <span className="portal-docket-mono">{caseCode}</span>
          </div>

          <div className="portal-docket-cell">
            <span className="portal-docket-label">Sinh viên đề nghị:</span>
            <span className="portal-docket-value">{form.fullName} ({form.mssv})</span>
          </div>

          <div className="portal-docket-cell">
            <span className="portal-docket-label">Lớp & Khoa quản lý:</span>
            <span className="portal-docket-value">{form.className} · {form.faculty}</span>
          </div>

          <div className="portal-docket-cell">
            <span className="portal-docket-label">Bước tiếp theo trong BPMN:</span>
            <span className="portal-next-hop-badge" style={{ backgroundColor: isConfirmed ? undefined : 'var(--wash-red)', color: isConfirmed ? undefined : 'var(--stamp-red)', borderColor: isConfirmed ? undefined : 'rgba(179,38,30,0.3)' }}>
              <span>{isConfirmed ? '➔' : '🛑'}</span>
              <span>{isConfirmed ? 'Lane L3: Phòng CTSV thẩm định' : 'Hệ thống: Từ chối hồ sơ (T7 / MF3)'}</span>
            </span>
          </div>
        </div>

        {/* Thanh công cụ tác vụ chuyên môn */}
        <div className="portal-actions-row">
          <button
            type="button"
            className={`portal-btn-secondary ${showDocument ? 'active' : ''}`}
            onClick={() => {
              sfx.playPaper();
              setShowDocument(!showDocument);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: showDocument ? '#f59e0b' : '#1e293b',
              color: showDocument ? '#0f172a' : '#fbbf24',
              border: showDocument ? '2px solid #b45309' : '2px solid #0f172a',
              borderRadius: '5px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            <span>{showDocument ? '📂' : '📄'}</span>
            <span style={{ color: showDocument ? '#0f172a' : '#fbbf24' }}>
              {showDocument ? 'Thu gọn hồ sơ lưu trữ' : 'Xem chi tiết hồ sơ gốc đã đóng dấu'}
            </span>
          </button>

          <button
            type="button"
            className="portal-btn-logout"
            onClick={handleLogout}
            title="Đăng xuất khỏi Cổng Cán bộ / Cố vấn học tập"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: '#334155',
              color: '#ffffff',
              border: '2px solid #1e293b',
              borderRadius: '5px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              transition: 'all 0.15s ease',
            }}
          >
            <span>🚪</span>
            <span style={{ color: '#ffffff' }}>Đăng xuất tài khoản</span>
          </button>
        </div>
      </Paper>

      {/* Chi tiết tài liệu hồ sơ gốc đã đóng dấu khi người dùng bấm xem */}
      {showDocument && (
        <ArchivedCaseDocument
          form={form}
          evidence={evidence}
          caseCode={caseCode}
          day={day}
          roleName="advisor"
          stampLabel={isConfirmed ? 'XÁC NHẬN' : 'KHÔNG XÁC NHẬN'}
          stampColor={isConfirmed ? 'green' : 'red'}
          signerTitle="CỐ VẤN HỌC TẬP / KHOA"
        />
      )}

      {/* Khay công văn đã bàn giao (chỉ hiện khi chưa mở xem hồ sơ để tránh rối mắt) */}
      {!showDocument && (
        <DispatchedTray
          deskRoleName="Khoa / Cố vấn học tập"
          nextStepName="Phòng Công tác sinh viên (CTSV)"
        />
      )}
    </div>
  );
};
