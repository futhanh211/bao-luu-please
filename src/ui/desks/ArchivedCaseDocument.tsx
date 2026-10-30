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
        color: '#111827',
        border: '2px solid #c4b59d',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        position: 'relative',
        fontFamily: 'var(--font-paper, "Courier Prime", monospace)',
      }}
    >
      {/* Quốc hiệu tiêu ngữ */}
      <div style={{ textAlign: 'center', marginBottom: '24px', borderBottom: '1.5px solid #c4b59d', paddingBottom: '16px' }}>
        <div style={{ fontSize: '13.5px', fontWeight: 'bold', letterSpacing: '0.5px', color: '#111827' }}>
          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
        </div>
        <div style={{ fontSize: '12.5px', fontWeight: 'bold', letterSpacing: '1px', marginTop: '3px', color: '#111827' }}>
          Độc lập - Tự do - Hạnh phúc
        </div>
        <div style={{ fontSize: '11px', color: '#524534', marginTop: '2px', fontWeight: 'bold' }}>
          ----------o0o----------
        </div>
      </div>

      {/* Cơ quan & Mã số */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', fontSize: '12.5px' }}>
        <div>
          <div style={{ fontWeight: 'bold', color: '#374151' }}>ĐẠI HỌC ĐÀ NẴNG</div>
          <div style={{ fontWeight: 'bold', color: '#111827', fontSize: '13.5px' }}>TRƯỜNG ĐẠI HỌC KINH TẾ</div>
          <div style={{ fontSize: '12px', color: '#374151', marginTop: '2px', fontWeight: 500 }}>Khoa: {form.faculty}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div>Mã hồ sơ: <strong style={{ color: '#b45309', fontSize: '13px' }}>{caseCode}</strong></div>
          <div style={{ color: '#374151', fontSize: '12px', fontWeight: 500 }}>Ngày tiếp nhận: Ngày làm việc {day}</div>
          <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 'bold', marginTop: '2px' }}>● BẢN ĐIỆN TỬ ĐÃ NIÊM PHONG</div>
        </div>
      </div>

      {/* Tiêu đề văn bản */}
      <div style={{ textAlign: 'center', margin: '24px 0 28px' }}>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 'bold',
            letterSpacing: '0.8px',
            margin: '0 0 6px',
            color: '#000000',
          }}
        >
          ĐƠN XIN NGHỈ HỌC TẠM THỜI VÀ BẢO LƯU KẾT QUẢ HỌC TẬP
        </h2>
        <div style={{ fontSize: '12.5px', color: '#4b5563', fontStyle: 'italic', fontWeight: 500 }}>
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
          backgroundColor: '#f4efe4',
          borderRadius: '4px',
          border: '1.5px dashed #c4b59d',
          marginBottom: '22px',
          fontSize: '13.5px',
          color: '#111827',
        }}
      >
        <div>
          <span style={{ color: '#374151', fontWeight: 600 }}>Họ và tên sinh viên: </span>
          <strong style={{ fontSize: '15px', color: '#000000' }}>{form.fullName}</strong>
        </div>
        <div>
          <span style={{ color: '#374151', fontWeight: 600 }}>Mã số sinh viên (MSSV): </span>
          <strong style={{ color: '#000000' }}>{form.mssv}</strong>
        </div>
        <div>
          <span style={{ color: '#374151', fontWeight: 600 }}>Lớp sinh hoạt: </span>
          <strong style={{ color: '#111827' }}>{form.className}</strong>
        </div>
        <div>
          <span style={{ color: '#374151', fontWeight: 600 }}>Khoa quản lý: </span>
          <strong style={{ color: '#111827' }}>{form.faculty}</strong>
        </div>
        <div>
          <span style={{ color: '#374151', fontWeight: 600 }}>Số điện thoại: </span>
          <strong style={{ color: '#111827' }}>{form.phone || 'Chưa cung cấp'}</strong>
        </div>
        <div>
          <span style={{ color: '#374151', fontWeight: 600 }}>Hòm thư điện tử: </span>
          <strong style={{ color: '#111827' }}>{form.email || `${form.mssv}@due.udn.vn`}</strong>
        </div>
      </div>

      {/* Nguyện vọng bảo lưu */}
      <div style={{ marginBottom: '22px', fontSize: '14px', lineHeight: '1.6', color: '#111827' }}>
        <div style={{ marginBottom: '8px' }}>
          <strong style={{ color: '#111827' }}>1. Lý do xin nghỉ học tạm thời: </strong>
          <span style={{ color: '#b45309', fontWeight: 'bold' }}>{form.reason}</span>
        </div>
        <div style={{ marginBottom: '8px' }}>
          <strong style={{ color: '#111827' }}>2. Thời hạn xin nghỉ: </strong>
          <span><strong style={{ color: '#000000' }}>{form.semesterCount} học kỳ</strong>, bắt đầu kể từ <strong style={{ color: '#000000' }}>{form.startSemester}</strong>.</span>
        </div>
        <div>
          <strong style={{ color: '#111827' }}>3. Cam kết của sinh viên: </strong>
          <span style={{ color: '#374151' }}>Đã cam kết chấp hành nghiêm chỉnh Quy chế đào tạo của Trường ĐH Kinh tế – ĐH Đà Nẵng và trở lại học tập đúng thời hạn.</span>
        </div>
      </div>

      {/* Danh mục tài liệu minh chứng */}
      <div style={{ marginBottom: '28px', fontSize: '13.5px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#111827' }}>
          4. Danh mục tài liệu minh chứng đính kèm:
        </div>
        {evidence.length === 0 ? (
          <div
            style={{
              padding: '11px 16px',
              backgroundColor: '#f7f3ea',
              color: '#4a3f35',
              borderRadius: '4px',
              border: '1.5px dashed #a89880',
              fontSize: '13.5px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span style={{ fontSize: '16px' }}>📁</span>
            <span>
              <strong>Ghi chú tiếp nhận:</strong> Không có tài liệu minh chứng đính kèm tại thời điểm sinh viên nộp đơn.
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {evidence.map((item, idx) => (
              <div
                key={item.id || idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 14px',
                  backgroundColor: '#f4efe4',
                  border: '1px solid #c4b59d',
                  borderRadius: '3px',
                  color: '#111827',
                }}
              >
                <span>📎 <strong style={{ color: '#000000' }}>{item.name}</strong> ({item.type || 'Tài liệu hợp lệ'})</span>
                <span style={{ color: '#374151', fontSize: '12.5px', fontWeight: 500 }}>{item.content}</span>
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
          borderTop: '2px solid #c4b59d',
          paddingTop: '20px',
          marginTop: '16px',
          position: 'relative',
        }}
      >
        {/* Cột trái: Kết quả rà soát tự động */}
        <div style={{ fontSize: '12.5px', lineHeight: '1.6' }}>
          <div style={{ fontWeight: 'bold', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
            KẾT QUẢ ĐỐI CHIẾU HỆ THỐNG (LANE L1)
          </div>
          <div style={{ color: '#15803d', fontWeight: 'bold', marginBottom: '4px' }}>
            ✓ Đối chiếu CSDL Đào tạo & Tài chính: Đạt quy chế
          </div>
          <div style={{ color: '#4b5563', fontWeight: 500 }}>
            Hồ sơ đầy đủ trường quy định · Đã mã hóa bảo mật toàn vẹn.
          </div>
        </div>

        {/* Cột phải: Con dấu xác nhận của cán bộ xử lý */}
        <div style={{ textAlign: 'center', position: 'relative', minHeight: '140px' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#111827', textTransform: 'uppercase' }}>
            {signerTitle}
          </div>
          <div style={{ fontSize: '11.5px', color: '#4b5563', fontStyle: 'italic', marginBottom: '6px' }}>
            (Đã ký duyệt và niêm phong điện tử)
          </div>

          {signerName && (
            <div style={{ fontSize: '13.5px', fontWeight: 'bold', marginTop: '4px', color: '#000000' }}>
              {signerName}
            </div>
          )}

          {decisionNotes && (
            <div style={{ fontSize: '12px', color: '#b45309', marginTop: '4px', fontWeight: 500 }}>
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
          paddingTop: '12px',
          borderTop: '1px dashed #c4b59d',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11.5px',
          color: '#6b7280',
          fontWeight: 500,
        }}
      >
        <span>Trường Đại học Kinh tế – ĐH Đà Nẵng · Hệ thống Một cửa điện tử To-Be</span>
        <span>Mã tra cứu số: <strong style={{ color: '#111827' }}>{caseCode}</strong></span>
      </div>
    </Paper>
  );
};
