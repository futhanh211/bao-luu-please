import React from 'react';
import { StudentApplicationForm, EvidenceItem } from '../../engine/types';
import { Paper } from '../kit/Paper';
import { Stamp } from '../kit/Stamp';

interface ArchivedCaseDocumentProps {
  form: StudentApplicationForm;
  evidence: EvidenceItem[];
  caseCode: string;
  day: number;
  roleName: string;
  stampLabel: string;
  stampColor: 'green' | 'red';
  signerTitle?: string;
  signerName?: string;
  decisionNotes?: string;
}

export const ArchivedCaseDocument: React.FC<ArchivedCaseDocumentProps> = ({
  form,
  evidence,
  caseCode,
  day,
  roleName,
  stampLabel,
  stampColor,
  signerTitle = 'CỐ VẤN HỌC TẬP',
  signerName,
  decisionNotes,
}) => {
  return (
    <Paper
      className="archived-case-paper"
      elevated
      watermark
      creased
      clip="top-right"
      width="100%"
      style={{
        padding: '36px 44px',
        margin: '12px 0 20px',
        backgroundColor: '#faf8f2',
        color: 'var(--ink, #1f2937)',
        border: '2px solid #d4c5a9',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        position: 'relative',
        fontFamily: 'var(--font-paper, "Courier Prime", monospace)',
      }}
    >
      {/* Quốc hiệu tiêu ngữ */}
      <div style={{ textAlign: 'center', marginBottom: '24px', borderBottom: '1px solid #d4c5a9', paddingBottom: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
        </div>
        <div style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px', marginTop: '3px' }}>
          Độc lập - Tự do - Hạnh phúc
        </div>
        <div style={{ fontSize: '11px', color: '#8c7b64', marginTop: '2px' }}>
          ----------o0o----------
        </div>
      </div>

      {/* Cơ quan & Mã số */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', fontSize: '12px' }}>
        <div>
          <div style={{ fontWeight: 'bold', color: '#524534' }}>ĐẠI HỌC ĐÀ NẴNG</div>
          <div style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '13px' }}>TRƯỜNG ĐẠI HỌC KINH TẾ</div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Khoa: {form.faculty}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div>Mã hồ sơ: <strong style={{ color: '#b45309' }}>{caseCode}</strong></div>
          <div style={{ color: '#6b7280', fontSize: '11px' }}>Ngày tiếp nhận: Ngày làm việc {day}</div>
          <div style={{ fontSize: '10px', color: '#22c55e', fontWeight: 'bold', marginTop: '2px' }}>● BẢN ĐIỆN TỬ ĐÃ NIÊM PHONG</div>
        </div>
      </div>

      {/* Tiêu đề văn bản */}
      <div style={{ textAlign: 'center', margin: '24px 0 28px' }}>
        <h2
          style={{
            fontSize: '19px',
            fontWeight: 'bold',
            letterSpacing: '0.8px',
            margin: '0 0 6px',
            color: '#111827',
          }}
        >
          ĐƠN XIN NGHỈ HỌC TẠM THỜI VÀ BẢO LƯU KẾT QUẢ HỌC TẬP
        </h2>
        <div style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
          (Hồ sơ số hóa theo quy trình To-Be — Hệ thống Một cửa điện tử)
        </div>
      </div>

      {/* Nội dung thông tin sinh viên */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '12px 24px',
          padding: '16px 20px',
          backgroundColor: 'rgba(0,0,0,0.02)',
          borderRadius: '4px',
          border: '1px dashed #d4c5a9',
          marginBottom: '22px',
          fontSize: '13.5px',
        }}
      >
        <div>
          <span style={{ color: '#6b7280' }}>Họ và tên sinh viên: </span>
          <strong style={{ fontSize: '14.5px', color: '#111827' }}>{form.fullName}</strong>
        </div>
        <div>
          <span style={{ color: '#6b7280' }}>Mã số sinh viên (MSSV): </span>
          <strong>{form.mssv}</strong>
        </div>
        <div>
          <span style={{ color: '#6b7280' }}>Lớp sinh hoạt: </span>
          <span>{form.className}</span>
        </div>
        <div>
          <span style={{ color: '#6b7280' }}>Khoa quản lý: </span>
          <span>{form.faculty}</span>
        </div>
        <div>
          <span style={{ color: '#6b7280' }}>Số điện thoại: </span>
          <span>{form.phone || 'Chưa cung cấp'}</span>
        </div>
        <div>
          <span style={{ color: '#6b7280' }}>Hòm thư điện tử: </span>
          <span>{form.email || `${form.mssv}@due.udn.vn`}</span>
        </div>
      </div>

      {/* Nguyện vọng bảo lưu */}
      <div style={{ marginBottom: '22px', fontSize: '13.5px', lineHeight: '1.6' }}>
        <div style={{ marginBottom: '8px' }}>
          <strong>1. Lý do xin nghỉ học tạm thời: </strong>
          <span style={{ color: '#b45309', fontWeight: 'bold' }}>{form.reason}</span>
        </div>
        <div style={{ marginBottom: '8px' }}>
          <strong>2. Thời hạn xin nghỉ: </strong>
          <span><strong>{form.semesterCount} học kỳ</strong>, bắt đầu kể từ <strong>{form.startSemester}</strong>.</span>
        </div>
        <div>
          <strong>3. Cam kết của sinh viên: </strong>
          <span>Đã cam kết chấp hành nghiêm chỉnh Quy chế đào tạo của Trường ĐH Kinh tế – ĐH Đà Nẵng và trở lại học tập đúng thời hạn.</span>
        </div>
      </div>

      {/* Danh mục tài liệu minh chứng */}
      <div style={{ marginBottom: '28px', fontSize: '13px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>
          4. Danh mục tài liệu minh chứng đính kèm:
        </div>
        {evidence.length === 0 ? (
          <div style={{ padding: '8px 12px', backgroundColor: 'rgba(239, 68, 68, 0.08)', color: '#dc2626', borderRadius: '4px', border: '1px dashed #ef4444' }}>
            ⚠️ Chưa có tài liệu minh chứng nào được đính kèm vào hồ sơ này.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {evidence.map((item, idx) => (
              <div
                key={item.id || idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '7px 12px',
                  backgroundColor: 'rgba(0,0,0,0.03)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '3px',
                }}
              >
                <span>📎 <strong>{item.name}</strong> ({item.type || 'Tài liệu hợp lệ'})</span>
                <span style={{ color: '#4b5563', fontSize: '12px' }}>{item.content}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Khối ký duyệt & Con dấu dập chéo Paper Please */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          borderTop: '2px solid #d4c5a9',
          paddingTop: '20px',
          marginTop: '16px',
          position: 'relative',
        }}
      >
        {/* Cột trái: Kết quả rà soát tự động */}
        <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
          <div style={{ fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', marginBottom: '6px' }}>
            KẾT QUẢ ĐỐI CHIẾU HỆ THỐNG (LANE L1)
          </div>
          <div style={{ color: '#15803d', fontWeight: 'bold', marginBottom: '4px' }}>
            ✓ Đối chiếu CSDL Đào tạo & Tài chính: Đạt quy chế
          </div>
          <div style={{ color: '#4b5563' }}>
            Hồ sơ đầy đủ trường quy định · Đã mã hóa bảo mật toàn vẹn.
          </div>
        </div>

        {/* Cột phải: Con dấu xác nhận của cán bộ xử lý */}
        <div style={{ textAlign: 'center', position: 'relative', minHeight: '140px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#374151', textTransform: 'uppercase' }}>
            {signerTitle}
          </div>
          <div style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic', marginBottom: '6px' }}>
            (Đã ký duyệt và niêm phong điện tử)
          </div>

          {signerName && (
            <div style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '4px', color: '#111827' }}>
              {signerName}
            </div>
          )}

          {decisionNotes && (
            <div style={{ fontSize: '11.5px', color: '#b45309', marginTop: '4px' }}>
              Ghi chú: {decisionNotes}
            </div>
          )}

          {/* Con dấu dập nghiêng nổi bật đúng chất Paper Please */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%) rotate(-5deg)',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          >
            <Stamp
              label={stampLabel}
              color={stampColor}
              seed={`archived-${caseCode}-${roleName}`}
              size="lg"
            />
          </div>
        </div>
      </div>

      {/* Footer bản quyền */}
      <div
        style={{
          marginTop: '28px',
          paddingTop: '10px',
          borderTop: '1px dashed #d4c5a9',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#9ca3af',
        }}
      >
        <span>Trường Đại học Kinh tế – ĐH Đà Nẵng · Hệ thống Một cửa điện tử To-Be</span>
        <span>Mã tra cứu số: {caseCode}</span>
      </div>
    </Paper>
  );
};
