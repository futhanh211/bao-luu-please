import React from 'react';
import { StudentApplicationForm } from '../../../engine/types';
import { sfx } from '../../audio/sfx';

const REASONS: StudentApplicationForm['reason'][] = [
  'Ốm đau/tai nạn điều trị dài',
  'Nghĩa vụ quân sự',
  'Hoàn cảnh gia đình',
  'Lý do cá nhân khác',
];

interface Props {
  form: StudentApplicationForm;
  locked: boolean;
  onChange: (patch: Partial<StudentApplicationForm>) => void;
}

const inputClass = (invalid: boolean): string =>
  `student-input${invalid ? ' student-input--invalid' : ''}`;

export const ApplicationPaper: React.FC<Props> = ({ form, locked, onChange }) => {
  const handleTextChange = (patch: Partial<StudentApplicationForm>): void => {
    sfx.playKeyClack();
    onChange(patch);
  };

  return (
    <div style={{ fontFamily: 'var(--font-paper)', fontSize: 14, position: 'relative' }}>
      {/* Nếp gấp giấy A4 hành chính */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background:
            'linear-gradient(to bottom, transparent 38%, rgba(10, 10, 8, 0.025) 39%, rgba(255, 255, 255, 0.15) 39.5%, transparent 41%, transparent 72%, rgba(10, 10, 8, 0.025) 73%, rgba(255, 255, 255, 0.15) 73.5%, transparent 75%)',
        }}
      />

      {/* Dấu chìm Watermark trường học */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0.045,
          overflow: 'hidden',
        }}
      >
        <svg width="240" height="240" viewBox="0 0 200 200" style={{ transform: 'rotate(-10deg)' }}>
          <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="100" cy="100" r="82" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" />
          <circle cx="100" cy="100" r="58" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <text x="100" y="48" textAnchor="middle" fontSize="10" fontWeight="bold">TRƯỜNG ĐH KINH TẾ</text>
          <text x="100" y="162" textAnchor="middle" fontSize="8.5" fontWeight="bold">ĐẠI HỌC ĐÀ NẴNG</text>
          <polygon points="100,75 106,90 122,90 110,100 115,115 100,105 85,115 90,100 78,90 94,90" fill="currentColor" />
        </svg>
      </div>

      <div
        style={{
          textAlign: 'center',
          borderBottom: '2px solid var(--ink)',
          paddingBottom: 6,
          marginBottom: 10,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: 1, color: 'var(--ink-soft)' }}>
          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM · ĐỘC LẬP — TỰ DO — HẠNH PHÚC
        </div>
        <h2 style={{ fontSize: 19, textTransform: 'uppercase', marginTop: 5, lineHeight: 1.25 }}>
          Đơn xin nghỉ học tạm thời
        </h2>
        <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>
          Cổng thông tin sinh viên · Nộp trực tuyến (MF1)
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 12px', position: 'relative', zIndex: 1 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="student-label" htmlFor="f-fullName">Họ và tên *</label>
          <input
            id="f-fullName"
            className={inputClass(!form.fullName)}
            value={form.fullName}
            disabled={locked}
            onChange={(e) => handleTextChange({ fullName: e.target.value })}
          />
        </div>

        <div>
          <label className="student-label" htmlFor="f-mssv">MSSV *</label>
          <input
            id="f-mssv"
            className={inputClass(!form.mssv)}
            value={form.mssv}
            disabled={locked}
            onChange={(e) => handleTextChange({ mssv: e.target.value })}
          />
        </div>
        <div>
          <label className="student-label" htmlFor="f-class">Lớp</label>
          <input
            id="f-class"
            className="student-input"
            value={form.className}
            disabled={locked}
            onChange={(e) => handleTextChange({ className: e.target.value })}
          />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label className="student-label" htmlFor="f-faculty">Khoa</label>
          <input
            id="f-faculty"
            className="student-input"
            value={form.faculty}
            disabled={locked}
            onChange={(e) => handleTextChange({ faculty: e.target.value })}
          />
        </div>

        <div>
          <label className="student-label" htmlFor="f-phone">Số điện thoại</label>
          <input
            id="f-phone"
            className="student-input"
            value={form.phone}
            disabled={locked}
            onChange={(e) => handleTextChange({ phone: e.target.value })}
          />
        </div>
        <div>
          <label className="student-label" htmlFor="f-email">Email</label>
          <input
            id="f-email"
            className="student-input"
            value={form.email}
            disabled={locked}
            onChange={(e) => handleTextChange({ email: e.target.value })}
          />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label className="student-label" htmlFor="f-reason">Lý do nghỉ học *</label>
          <select
            id="f-reason"
            className="student-input"
            value={form.reason}
            disabled={locked}
            onChange={(e) => onChange({ reason: e.target.value as StudentApplicationForm['reason'] })}
          >
            {REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="student-label" htmlFor="f-semesters">Số học kỳ nghỉ *</label>
          <select
            id="f-semesters"
            className="student-input"
            value={form.semesterCount}
            disabled={locked}
            onChange={(e) => onChange({ semesterCount: Number(e.target.value) === 2 ? 2 : 1 })}
          >
            <option value={1}>1 học kỳ</option>
            <option value={2}>2 học kỳ</option>
          </select>
        </div>
        <div>
          <label className="student-label" htmlFor="f-start">Học kỳ bắt đầu</label>
          <input
            id="f-start"
            className="student-input"
            value={form.startSemester}
            disabled={locked}
            onChange={(e) => onChange({ startSemester: e.target.value })}
          />
        </div>
      </div>

      <label
        htmlFor="f-commitment"
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'flex-start',
          marginTop: 10,
          padding: '6px 8px',
          border: form.commitment ? '1px dashed var(--paper-line)' : '1px solid var(--stamp-red)',
          background: form.commitment ? 'var(--paper-dim)' : 'var(--wash-red)',
          fontSize: 12,
          lineHeight: 1.45,
          cursor: locked ? 'var(--cursor-default)' : 'var(--cursor-pointer)',
        }}
      >
        <input
          id="f-commitment"
          type="checkbox"
          checked={form.commitment}
          disabled={locked}
          onChange={(e) => onChange({ commitment: e.target.checked })}
          style={{ marginTop: 2 }}
        />
        <span>
          Tôi cam kết các thông tin và giấy tờ trên là đúng sự thật, chịu trách nhiệm trước Nhà trường
          nếu có sai phạm.
        </span>
      </label>
    </div>
  );
};
