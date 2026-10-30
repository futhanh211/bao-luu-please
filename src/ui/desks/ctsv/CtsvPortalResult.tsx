import React, { useState } from 'react';
import { StudentApplicationForm, EvidenceItem } from '../../../engine/types';
import { CtsvResult } from './InspectionResult';
import { EvidencePaper } from './EvidencePaper';
import { Paper } from '../../kit/Paper';
import { Stamp } from '../../kit/Stamp';
import { ArchivedCaseDocument } from '../ArchivedCaseDocument';
import { DispatchedTray } from '../DispatchedTray';
import { useAuthStore } from '../../../store/useAuth';
import { useAppStore } from '../../../store/useApp';
import { sfx } from '../../audio/sfx';

interface CtsvPortalResultProps {
  result: CtsvResult | null;
  form?: StudentApplicationForm;
  evidence: EvidenceItem[];
  caseCode: string;
  day: number;
}

export const CtsvPortalResult: React.FC<CtsvPortalResultProps> = ({
  result,
  form,
  evidence,
  caseCode,
  day,
}) => {
  const [showEvidence, setShowEvidence] = useState(false);
  const logout = useAuthStore((s) => s.logout);
  const setScreen = useAppStore((s) => s.setScreen);

  const isValid = result?.outcome === 'valid' || !result?.outcome.includes('invalid');

  const handleLogout = () => {
    sfx.play('paper');
    logout();
    setScreen('login');
  };

  return (
    <div className="desk-page ctsv-portal-page portal-result-container">
      {/* Tờ Biên bản thẩm định minh chứng chính thức (Paper 2.0 vintage) */}
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
              HỆ THỐNG MỘT CỬA SỐ — BIÊN BẢN THẨM ĐỊNH PHÁP LÝ HỒ SƠ & MINH CHỨNG
            </div>
          </div>
          <div className="portal-header-code">
            <div>MÃ HỒ SƠ: <strong>{caseCode}</strong></div>
            <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>NGÀY LÀM VIỆC {day}</div>
          </div>
        </div>

        {/* Nội dung kết quả & Con dấu dập chéo Paper Please */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div className={`portal-status-kicker ${isValid ? 'valid' : 'invalid'}`}>
              <span>{isValid ? '🛡️ ĐÃ HOÀN TẤT THẨM ĐỊNH MINH CHỨNG HỢP LỆ' : '✗ MINH CHỨNG KHÔNG HỢP LỆ'}</span>
              <span>· TÁC VỤ T5 HOÀN TẤT</span>
            </div>

            <h2 className="portal-main-heading">
              Hồ sơ đã được phê chuẩn tại Phòng Công tác sinh viên
            </h2>

            <p className="portal-main-desc">
              Chuyên viên đã kiểm tra tính pháp lý của toàn bộ minh chứng y tế/gia đình và đối chiếu CSDL Đào tạo.
              Hệ thống Một cửa số đã tự động khởi tạo <strong>Dự thảo Quyết định</strong> và trình lên{' '}
              <strong>Ban Giám hiệu nhà trường</strong> để ký số.
            </p>
          </div>

          <div style={{ transform: 'rotate(-2.5deg)', margin: '8px 12px 0 0' }}>
            <Stamp
              label={isValid ? 'HỢP LỆ' : 'KHÔNG HỢP LỆ'}
              color={isValid ? 'green' : 'red'}
              seed="T5-portal-done"
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
            <span className="portal-docket-label">Sinh viên thụ hưởng:</span>
            <span className="portal-docket-value">{form?.fullName || 'Sinh viên'} {form?.mssv ? `(${form.mssv})` : ''}</span>
          </div>

          <div className="portal-docket-cell">
            <span className="portal-docket-label">Số minh chứng đã kiểm tra:</span>
            <span className="portal-docket-value">{evidence.length} tài liệu hợp lệ</span>
          </div>

          <div className="portal-docket-cell">
            <span className="portal-docket-label">Bước tiếp theo trong BPMN:</span>
            <span className="portal-next-hop-badge">
              <span>➔</span>
              <span>Lane L4: Ban Giám hiệu ký số (T9)</span>
            </span>
          </div>
        </div>

        {/* Thanh công cụ tác vụ chuyên môn */}
        <div className="portal-actions-row">
          <button
            type="button"
            className={`portal-btn-secondary ${showEvidence ? 'active' : ''}`}
            onClick={() => {
              sfx.playPaper();
              setShowEvidence(!showEvidence);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: showEvidence ? '#f59e0b' : '#1e293b',
              color: showEvidence ? '#0f172a' : '#fbbf24',
              border: showEvidence ? '2px solid #b45309' : '2px solid #0f172a',
              borderRadius: '5px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            <span>{showEvidence ? '📂' : '🔍'}</span>
            <span style={{ color: showEvidence ? '#0f172a' : '#fbbf24' }}>
              {showEvidence ? 'Thu gọn hồ sơ & minh chứng' : 'Xem chi tiết hồ sơ & minh chứng đã duyệt'}
            </span>
          </button>

          <button
            type="button"
            className="portal-btn-logout"
            onClick={handleLogout}
            title="Đăng xuất khỏi Cổng Cán bộ / CTSV"
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

      {/* Hiển thị chi tiết hồ sơ đã đóng dấu & minh chứng */}
      {showEvidence && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {form && (
            <ArchivedCaseDocument
              form={form}
              evidence={evidence}
              caseCode={caseCode}
              day={day}
              roleName="ctsv"
              stampLabel={isValid ? 'HỢP LỆ' : 'KHÔNG HỢP LỆ'}
              stampColor={isValid ? 'green' : 'red'}
              signerTitle="PHÒNG CÔNG TÁC SINH VIÊN (CTSV)"
            />
          )}

          {evidence.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--paper)' }}>
                📁 TÀI LIỆU MINH CHỨNG KÈM THEO HỒ SƠ:
              </div>
              {evidence.map((item) => (
                <EvidencePaper
                  key={item.id}
                  evidence={item}
                  marks={[]}
                  onToggle={() => {}}
                  onZoom={() => {}}
                  locked={true}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Khay công văn đã bàn giao (chỉ hiện khi chưa mở xem hồ sơ) */}
      {!showEvidence && (
        <DispatchedTray
          deskRoleName="Phòng Công tác sinh viên (CTSV)"
          nextStepName="Ban Giám hiệu nhà trường"
        />
      )}
    </div>
  );
};
