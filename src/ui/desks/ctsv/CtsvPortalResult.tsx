import React, { useState } from 'react';
import { StudentApplicationForm, EvidenceItem } from '../../../engine/types';
import { CtsvResult } from './InspectionResult';
import { EvidencePaper } from './EvidencePaper';
import { Paper } from '../../kit/Paper';
import { Stamp } from '../../kit/Stamp';
import { ArchivedCaseDocument } from '../ArchivedCaseDocument';
import { DispatchedTray } from '../DispatchedTray';
import { InspectIcon, CollapseIcon, LogoutIcon } from '../../kit/PortalIcons';
import { useAuthStore } from '../../../store/useAuth';
import { useAppStore } from '../../../store/useApp';
import { sfx } from '../../audio/sfx';

interface CtsvPortalResultProps {
  result: CtsvResult | null;
  form?: StudentApplicationForm;
  evidence: EvidenceItem[];
  caseCode: string;
  day: number;
  remainingPendingCount?: number;
  onContinueNext?: () => void;
}

export const CtsvPortalResult: React.FC<CtsvPortalResultProps> = ({
  result,
  form,
  evidence,
  caseCode,
  day,
  remainingPendingCount,
  onContinueNext,
}) => {
  const [showEvidence, setShowEvidence] = useState(false);
  const logout = useAuthStore((s) => s.logout);
  const setScreen = useAppStore((s) => s.setScreen);

  const isValid = result?.outcome === 'valid';

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
              <span>{isValid ? '✓ ĐÃ HOÀN TẤT THẨM ĐỊNH MINH CHỨNG HỢP LỆ' : '✗ MINH CHỨNG KHÔNG HỢP LỆ'}</span>
              <span>· TÁC VỤ T5 HOÀN TẤT</span>
            </div>

            <h2 className="portal-main-heading">
              {isValid
                ? 'Hồ sơ đã được phê chuẩn tại Phòng Công tác sinh viên'
                : 'Chuyên viên CTSV kết luận minh chứng không hợp lệ'}
            </h2>

            <p className="portal-main-desc">
              {isValid ? (
                <>
                  Chuyên viên đã kiểm tra tính pháp lý của toàn bộ minh chứng y tế/gia đình và đối chiếu CSDL Đào tạo.
                  Hệ thống Một cửa số đã tự động khởi tạo <strong>Dự thảo Quyết định</strong> và trình lên{' '}
                  <strong>Ban Giám hiệu nhà trường</strong> để ký số.
                </>
              ) : (
                <>
                  Chuyên viên đã kiểm tra tính pháp lý của minh chứng và kết luận tài liệu không đáp ứng quy định tiếp nhận.
                  Hệ thống Một cửa số đã gửi thông báo từ chối hồ sơ (MF3) tới Cổng Sinh viên; quy trình kết thúc tại bước này.
                </>
              )}
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
            <span className="portal-docket-value">{evidence.length} tài liệu</span>
          </div>

          <div className="portal-docket-cell">
            <span className="portal-docket-label">Bước tiếp theo trong BPMN:</span>
            <span
              className="portal-next-hop-badge"
              style={{
                backgroundColor: isValid ? undefined : 'var(--wash-red)',
                color: isValid ? undefined : 'var(--stamp-red)',
                borderColor: isValid ? undefined : 'rgba(179,38,30,0.3)',
              }}
            >
              <span>{isValid ? '➔' : '🛑'}</span>
              <span>{isValid ? 'Lane L4: Ban Giám hiệu ký số (T9)' : 'Hệ thống: Từ chối hồ sơ (T7 / MF3)'}</span>
            </span>
          </div>
        </div>

        {/* Thanh công cụ tác vụ chuyên môn */}
        <div className="portal-actions-row">
          {onContinueNext && remainingPendingCount !== undefined && remainingPendingCount > 0 && (
            <button
              type="button"
              className="portal-btn-primary"
              onClick={onContinueNext}
              style={{
                backgroundColor: 'var(--amber)',
                color: 'var(--desk-900)',
                border: '1.5px solid var(--amber)',
                fontWeight: 'bold',
              }}
            >
              <span>➔ Thẩm định hồ sơ tiếp theo (còn {remainingPendingCount} hồ sơ chờ)</span>
            </button>
          )}

          <button
            type="button"
            className={`portal-btn-primary ${showEvidence ? 'active' : ''}`}
            onClick={() => {
              sfx.playPaper();
              setShowEvidence(!showEvidence);
            }}
          >
            {showEvidence ? <CollapseIcon size={16} /> : <InspectIcon size={16} />}
            <span>
              {showEvidence ? 'Thu gọn hồ sơ & minh chứng' : 'Xem chi tiết hồ sơ & minh chứng đã duyệt'}
            </span>
          </button>

          <button
            type="button"
            className="portal-btn-logout"
            onClick={handleLogout}
            title="Đăng xuất khỏi Cổng Cán bộ / CTSV"
          >
            <LogoutIcon size={16} />
            <span>Đăng xuất tài khoản</span>
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
