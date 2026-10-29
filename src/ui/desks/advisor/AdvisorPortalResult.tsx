import React, { useState } from 'react';
import { StudentApplicationForm, EvidenceItem } from '../../../engine/types';
import { Paper } from '../../kit/Paper';
import { Stamp } from '../../kit/Stamp';
import { AdvisorFile } from './AdvisorFile';
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
  const loginAsOfficer = useAuthStore((s) => s.loginAsOfficer);
  const logout = useAuthStore((s) => s.logout);
  const setScreen = useAppStore((s) => s.setScreen);

  const isConfirmed = advisorStatus !== 'declined';

  const handleSwitchToCtsv = () => {
    sfx.play('stamp');
    loginAsOfficer('ctsv_mai');
  };

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
              Ý kiến Cố vấn học tập đã được đóng dấu niêm phong
            </h2>

            <p className="portal-main-desc">
              Thầy/Cô đã hoàn tất bước xác nhận nguyện vọng bảo lưu của sinh viên{' '}
              <strong style={{ color: 'var(--ink)' }}>{form.fullName}</strong> (MSSV: {form.mssv}). Hồ sơ đã được
              chuyển tự động lên <strong>Phòng Công tác sinh viên (CTSV)</strong> để thẩm định minh chứng tiếp theo.
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
            <span className="portal-next-hop-badge">
              <span>➔</span>
              <span>Lane L3: Phòng CTSV thẩm định</span>
            </span>
          </div>
        </div>

        {/* Thanh công cụ tác vụ chuyên môn */}
        <div className="portal-actions-row">
          <button
            type="button"
            className="portal-btn-primary"
            onClick={handleSwitchToCtsv}
            title="Đăng nhập tài khoản ThS. Nguyễn Thị Mai (Phòng CTSV) để duyệt bước tiếp theo"
          >
            <span>👩‍💼</span>
            <span>Chuyển sang Cổng CTSV (ThS. Nguyễn Thị Mai) ➜</span>
          </button>

          <button
            type="button"
            className={`portal-btn-secondary ${showDocument ? 'active' : ''}`}
            onClick={() => setShowDocument(!showDocument)}
          >
            <span>📄</span>
            <span>{showDocument ? 'Ẩn hồ sơ đã đóng dấu' : 'Xem lại hồ sơ đã đóng dấu'}</span>
          </button>

          <button
            type="button"
            className="portal-btn-logout"
            onClick={handleLogout}
          >
            <span>🚪</span>
            <span>Đăng xuất tài khoản</span>
          </button>
        </div>
      </Paper>

      {/* Khay công văn đã bàn giao (thay thế khối trắng xấu xí) */}
      <DispatchedTray
        deskRoleName="Khoa / Cố vấn học tập"
        nextStepName="Phòng Công tác sinh viên (CTSV)"
      />

      {/* Chi tiết tài liệu khi người dùng bấm xem lại */}
      {showDocument && (
        <div style={{ marginTop: '4px', position: 'relative' }}>
          <AdvisorFile
            form={form}
            evidence={evidence}
            ruleResult={{ pass: true, violations: [] }}
            ruleEvaluated={true}
            validity={{ complete: true, missing: [], evidenceOk: true }}
          />
        </div>
      )}
    </div>
  );
};
