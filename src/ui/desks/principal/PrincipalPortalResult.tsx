import React, { useState } from 'react';
import { DecisionDoc } from '../../../engine/types';
import { DecisionDraft } from './DecisionDraft';
import { Paper } from '../../kit/Paper';
import { useAuthStore } from '../../../store/useAuth';
import { useAppStore } from '../../../store/useApp';
import { sfx } from '../../audio/sfx';

interface PrincipalPortalResultProps {
  doc: DecisionDoc;
  signerName: string;
  caseCode: string;
  day: number;
}

export const PrincipalPortalResult: React.FC<PrincipalPortalResultProps> = ({
  doc,
  signerName,
  caseCode,
  day,
}) => {
  const [showDocument, setShowDocument] = useState(true);
  const loginAsStudent = useAuthStore((s) => s.loginAsStudent);
  const logout = useAuthStore((s) => s.logout);
  const setScreen = useAppStore((s) => s.setScreen);

  const handlePrint = () => {
    sfx.play('paper');
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleSwitchToStudent = () => {
    sfx.play('stamp');
    loginAsStudent(doc.mssv || '3121102001', {
      name: doc.studentName,
      faculty: doc.faculty,
    });
  };

  const handleLogout = () => {
    sfx.play('paper');
    logout();
    setScreen('login');
  };

  return (
    <div className="desk-page principal-portal-page portal-result-container" style={{ maxWidth: '1080px' }}>
      {/* Tờ Biên bản ký số & ban hành quyết định (Paper 2.0 vintage) */}
      <Paper
        className="portal-docket-paper"
        elevated
        watermark
        creased
        clip="top-left"
        width="100%"
      >
        {/* Dòng tiêu ngữ hành chính Ban Giám hiệu */}
        <div className="portal-header-row">
          <div>
            <div className="portal-agency-title">
              ĐẠI HỌC ĐÀ NẴNG · TRƯỜNG ĐẠI HỌC KINH TẾ
            </div>
            <div className="portal-system-sub">
              HỆ THỐNG MỘT CỬA SỐ — BIÊN BẢN KÝ SỐ & BAN HÀNH QUYẾT ĐỊNH HIỆU TRƯỞNG
            </div>
          </div>
          <div className="portal-header-code">
            <div>HỒ SƠ: <strong>{caseCode}</strong></div>
            <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>NGÀY BAN HÀNH {day}</div>
          </div>
        </div>

        {/* Thông tin chứng thực chữ ký số PKI */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div className="portal-status-kicker gold">
              <span>🏛️ VĂN BẢN ĐÃ KÝ SỐ PKI & BAN HÀNH CHÍNH THỨC</span>
              <span>· TÁC VỤ T9 HOÀN TẤT</span>
            </div>

            <h2 className="portal-main-heading">
              Quyết định cho phép sinh viên nghỉ học tạm thời đã được ký số
            </h2>

            <p className="portal-main-desc">
              Phó Hiệu trưởng đã hoàn tất ký số điện tử bằng chứng thư số bảo mật PKI của Nhà trường.
              Hệ thống Một cửa số đã tự động cập nhật trạng thái học vụ của sinh viên và gửi văn bản quyết định
              chính thức đến tài khoản sinh viên.
            </p>
          </div>

          <div className="decision-number-plaque">
            <div className="decision-number-label">
              Số hiệu văn bản điện tử
            </div>
            <div className="decision-number-value">
              {doc.number}
            </div>
          </div>
        </div>

        {/* 3 Hạng mục đồng bộ tự động chuẩn To-Be */}
        <div className="portal-sync-grid">
          <div className="portal-sync-card">
            <div className="portal-sync-title">
              <span>✓</span>
              <span>CSDL Đào tạo & Quản lý sinh viên</span>
            </div>
            <div className="portal-sync-desc">
              Đã tự động cập nhật trạng thái học vụ của SV <strong>{doc.studentName}</strong> sang <em>"Nghỉ học tạm thời"</em>.
            </div>
          </div>

          <div className="portal-sync-card">
            <div className="portal-sync-title">
              <span>✓</span>
              <span>Cổng thông tin Một cửa số</span>
            </div>
            <div className="portal-sync-desc">
              Đã gửi thông báo kèm file văn bản Quyết định có chữ ký số tới tài khoản và Email của sinh viên.
            </div>
          </div>

          <div className="portal-sync-card">
            <div className="portal-sync-title">
              <span>✓</span>
              <span>Văn thư & Lưu trữ điện tử</span>
            </div>
            <div className="portal-sync-desc">
              Quyết định số {doc.number} đã được đăng bạ và lưu chiểu vào sổ công văn điện tử Nhà trường.
            </div>
          </div>
        </div>

        {/* Thanh công cụ tác vụ của Ban Giám hiệu */}
        <div className="portal-actions-row">
          <button
            type="button"
            className="portal-btn-primary"
            onClick={handleSwitchToStudent}
            title={`Đăng nhập tài khoản sinh viên ${doc.studentName || 'sinh viên'} để kiểm tra kết quả tiếp nhận`}
          >
            <span>🎓</span>
            <span>Đăng nhập Cổng Sinh viên để xem kết quả nhận được ➜</span>
          </button>

          <button
            type="button"
            className={`portal-btn-secondary ${showDocument ? 'active' : ''}`}
            onClick={() => setShowDocument(!showDocument)}
          >
            <span>📄</span>
            <span>{showDocument ? 'Ẩn văn bản Quyết định' : 'Xem toàn văn Quyết định ban hành'}</span>
          </button>

          <button
            type="button"
            className="portal-btn-secondary"
            onClick={handlePrint}
          >
            <span>🖨️</span>
            <span>In / Lưu file Quyết định</span>
          </button>

          <button
            type="button"
            className="portal-btn-logout"
            onClick={handleLogout}
          >
            <span>🚪</span>
            <span>Đăng xuất Ban Giám hiệu</span>
          </button>
        </div>
      </Paper>

      {/* Hiển thị toàn văn Quyết định chính thức có con dấu đỏ và chữ ký số */}
      {showDocument && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{
            fontFamily: 'var(--font-paper)',
            fontSize: '11.5px',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: 'var(--paper-dim)',
            textAlign: 'center',
          }}>
            — VĂN BẢN QUYẾT ĐỊNH ĐÃ ĐƯỢC CHỨNG THỰC ĐIỆN TỬ (CÓ CHỮ KÝ SỐ & DẤU ĐỎ) —
          </div>

          <DecisionDraft
            doc={doc}
            signing="signed"
            signerName={signerName}
            mode="decision"
            autoStamp={false}
          />
        </div>
      )}
    </div>
  );
};
