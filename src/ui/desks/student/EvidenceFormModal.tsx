import React, { useState, useRef } from 'react';
import {
  StudentDetailedFormData,
  UploadedEvidenceFile,
  formatFileSize,
  toIsoDate,
  toVnDate,
} from '../../../data/studentFormData';
import { StudentEvidenceOptionKey } from '../../../data/customTestData';
import { Paperclip } from '../../kit/Paperclip';
import { sfx } from '../../audio/sfx';

interface Props {
  optionKey: StudentEvidenceOptionKey;
  initialData: StudentDetailedFormData;
  onSave: (updatedData: StudentDetailedFormData) => void;
  onClose: () => void;
}

export const EvidenceFormModal: React.FC<Props> = ({
  optionKey,
  initialData,
  onSave,
  onClose,
}) => {
  const [data, setData] = useState<StudentDetailedFormData>(() => ({ ...initialData }));
  const [uploadedFile, setUploadedFile] = useState<UploadedEvidenceFile | null>(
    () => initialData.uploadedFile || null
  );
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processSelectedFile = (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      setFileError('Dung lượng tệp tối đa 20MB. Vui lòng chọn tệp nhỏ hơn.');
      return;
    }
    setFileError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const fileData: UploadedEvidenceFile = {
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        lastModified: file.lastModified,
        dataUrl: result,
      };
      setUploadedFile(fileData);
      setData((prev) => ({ ...prev, uploadedFile: fileData }));
      sfx.playPaperSlide();
    };
    reader.onerror = () => {
      setFileError('Không thể đọc tệp từ thiết bị. Vui lòng thử lại.');
    };
    reader.readAsDataURL(file);
  };

  const updateMed = (patch: Partial<StudentDetailedFormData['medical']>) => {
    sfx.playKeyClack();
    setData((prev) => ({ ...prev, medical: { ...prev.medical, ...patch } }));
  };

  const updateMil = (patch: Partial<StudentDetailedFormData['military']>) => {
    sfx.playKeyClack();
    setData((prev) => ({ ...prev, military: { ...prev.military, ...patch } }));
  };

  const updateHard = (patch: Partial<StudentDetailedFormData['hardship']>) => {
    sfx.playKeyClack();
    setData((prev) => ({ ...prev, hardship: { ...prev.hardship, ...patch } }));
  };

  const updatePers = (patch: Partial<StudentDetailedFormData['personal']>) => {
    sfx.playKeyClack();
    setData((prev) => ({ ...prev, personal: { ...prev.personal, ...patch } }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFile) {
      setFileError('Vui lòng chọn hoặc tải lên tệp minh chứng từ máy tính của bạn trước khi nộp!');
      fileInputRef.current?.click();
      sfx.play('buzz');
      return;
    }
    sfx.playStamp();
    onSave({ ...data, uploadedFile });
  };

  const med = data.medical;
  const mil = data.military;
  const hard = data.hardship;
  const pers = data.personal;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 920,
        backgroundColor: 'var(--overlay-scrim)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="paper-sheet paper-lifted"
        style={{
          width: 'min(640px, 94vw)',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px 28px',
          boxShadow: 'var(--shadow-paper-lg)',
          position: 'relative',
          fontFamily: 'var(--font-paper)',
        }}
      >
        <Paperclip position="top-right" angle={8} />

        {/* Tiêu đề modal */}
        <div style={{ borderBottom: '2px solid var(--ink)', paddingBottom: 8, marginBottom: 14 }}>
          <div style={{ fontSize: 11, letterSpacing: 0.8, color: 'var(--ink-soft)' }}>
            HỆ THỐNG MỘT CỬA SỐ · KHAI BÁO THÔNG TIN MINH CHỨNG
          </div>
          <h3 style={{ fontSize: 18, marginTop: 4, color: 'var(--stamp-blue)', textTransform: 'uppercase' }}>
            {optionKey === 'medical' && '🏥 Giấy xác nhận của bệnh viện (Ốm đau/tai nạn điều trị dài)'}
            {optionKey === 'military' && '🪖 Giấy đi nghĩa vụ quân sự (Lệnh gọi công dân nhập ngũ)'}
            {optionKey === 'hardship' && '🏡 Giấy chứng minh hoàn cảnh gia đình (Xác nhận UBND Phường/Xã)'}
            {optionKey === 'personal' && '📝 Lý do cá nhân khác (Đơn trình bày / Thực tập ngoài trường)'}
          </h3>
          <p style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 2 }}>
            Họ tên sinh viên: <strong>{data.fullName}</strong> · MSSV: <strong>{data.mssv}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 1. Form điền: Giấy xác nhận của bệnh viện */}
          {optionKey === 'medical' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 14px' }}>
              <div>
                <label className="student-label" htmlFor="m-hospital">Bệnh viện cấp giấy *</label>
                <input
                  id="m-hospital"
                  className="student-input"
                  required
                  value={med.hospital}
                  placeholder="Nhập tên bệnh viện (VD: Bệnh viện Đa khoa Đà Nẵng)"
                  onChange={(e) => updateMed({ hospital: e.target.value })}
                />
              </div>
              <div>
                <label className="student-label" htmlFor="m-code">Mã bệnh án / Số lưu trữ *</label>
                <input
                  id="m-code"
                  className="student-input"
                  required
                  value={med.recordCode}
                  placeholder="Nhập số hồ sơ bệnh án"
                  onChange={(e) => updateMed({ recordCode: e.target.value })}
                />
              </div>

              <div>
                <label className="student-label" htmlFor="m-dept">Khoa điều trị *</label>
                <input
                  id="m-dept"
                  className="student-input"
                  required
                  value={med.department}
                  placeholder="Nhập khoa điều trị"
                  onChange={(e) => updateMed({ department: e.target.value })}
                />
              </div>
              <div>
                <label className="student-label" htmlFor="m-doc">Họ tên bác sĩ chỉ định *</label>
                <input
                  id="m-doc"
                  className="student-input"
                  required
                  value={med.doctorName}
                  placeholder="Nhập tên bác sĩ điều trị"
                  onChange={(e) => updateMed({ doctorName: e.target.value })}
                />
              </div>

              <div>
                <label className="student-label" htmlFor="m-adm">Ngày nhập viện *</label>
                <input
                  id="m-adm"
                  type="date"
                  className="student-input"
                  required
                  value={toIsoDate(med.admissionDate)}
                  onChange={(e) => updateMed({ admissionDate: toVnDate(e.target.value) })}
                />
              </div>
              <div>
                <label className="student-label" htmlFor="m-dis">Ngày cấp giấy xác nhận *</label>
                <input
                  id="m-dis"
                  type="date"
                  className="student-input"
                  required
                  value={toIsoDate(med.dischargeDate)}
                  onChange={(e) => updateMed({ dischargeDate: toVnDate(e.target.value) })}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label className="student-label" htmlFor="m-diag">Chẩn đoán bệnh & chỉ định điều trị *</label>
                <textarea
                  id="m-diag"
                  className="student-textarea"
                  rows={3}
                  required
                  value={med.diagnosis}
                  placeholder="Nhập chẩn đoán bệnh lý/tai nạn và thời gian bác sĩ yêu cầu nghỉ điều trị dài hạn..."
                  onChange={(e) => updateMed({ diagnosis: e.target.value })}
                />
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: 4 }}>
                <label
                  htmlFor="m-stamp"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}
                >
                  <input
                    id="m-stamp"
                    type="checkbox"
                    checked={med.isValidStamp}
                    onChange={(e) => updateMed({ isValidStamp: e.target.checked })}
                  />
                  <span style={{ color: med.isValidStamp ? 'var(--stamp-green)' : 'var(--stamp-red)', fontWeight: 600 }}>
                    Xác nhận hợp lệ: Giấy xác nhận đã có chữ ký và dấu mộc đỏ của Bệnh viện
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* 2. Form điền: Giấy đi nghĩa vụ quân sự */}
          {optionKey === 'military' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 14px' }}>
              <div>
                <label className="student-label" htmlFor="mil-unit">Cơ quan cấp lệnh (BCH Quân sự) *</label>
                <input
                  id="mil-unit"
                  className="student-input"
                  required
                  value={mil.militaryUnit}
                  placeholder="Nhập tên BCH Quân sự Quận/Huyện"
                  onChange={(e) => updateMil({ militaryUnit: e.target.value })}
                />
              </div>
              <div>
                <label className="student-label" htmlFor="mil-num">Số lệnh gọi nhập ngũ *</label>
                <input
                  id="mil-num"
                  className="student-input"
                  required
                  value={mil.orderNumber}
                  placeholder="Nhập số hiệu lệnh (VD: .../LG-BCH)"
                  onChange={(e) => updateMil({ orderNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="student-label" htmlFor="mil-sign">Ngày ký lệnh *</label>
                <input
                  id="mil-sign"
                  type="date"
                  className="student-input"
                  required
                  value={toIsoDate(mil.signDate)}
                  onChange={(e) => updateMil({ signDate: toVnDate(e.target.value) })}
                />
              </div>
              <div>
                <label className="student-label" htmlFor="mil-rep">Ngày tập trung nhập ngũ *</label>
                <input
                  id="mil-rep"
                  type="date"
                  className="student-input"
                  required
                  value={toIsoDate(mil.reportDate)}
                  onChange={(e) => updateMil({ reportDate: toVnDate(e.target.value) })}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label className="student-label" htmlFor="mil-loc">Địa điểm giao nhận quân *</label>
                <input
                  id="mil-loc"
                  className="student-input"
                  required
                  value={mil.location}
                  placeholder="Nhập địa chỉ tập trung làm thủ tục nhập ngũ"
                  onChange={(e) => updateMil({ location: e.target.value })}
                />
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: 4 }}>
                <label
                  htmlFor="mil-stamp"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}
                >
                  <input
                    id="mil-stamp"
                    type="checkbox"
                    checked={mil.isValidStamp}
                    onChange={(e) => updateMil({ isValidStamp: e.target.checked })}
                  />
                  <span style={{ color: mil.isValidStamp ? 'var(--stamp-green)' : 'var(--stamp-red)', fontWeight: 600 }}>
                    Xác nhận hợp lệ: Lệnh gọi nhập ngũ đã có chữ ký và dấu mộc đỏ của BCH Quân sự
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* 3. Form điền: Giấy chứng minh hoàn cảnh gia đình */}
          {optionKey === 'hardship' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 14px' }}>
              <div>
                <label className="student-label" htmlFor="h-auth">UBND Phường/Xã xác nhận *</label>
                <input
                  id="h-auth"
                  className="student-input"
                  required
                  value={hard.authority}
                  placeholder="Nhập tên UBND Phường/Xã nơi cư trú"
                  onChange={(e) => updateHard({ authority: e.target.value })}
                />
              </div>
              <div>
                <label className="student-label" htmlFor="h-cat">Diện hoàn cảnh *</label>
                <select
                  id="h-cat"
                  className="student-input"
                  value={hard.category}
                  onChange={(e) =>
                    updateHard({ category: e.target.value as StudentDetailedFormData['hardship']['category'] })
                  }
                >
                  <option value="Hộ nghèo">Hộ nghèo</option>
                  <option value="Hộ cận nghèo">Hộ cận nghèo</option>
                  <option value="Biến cố kinh tế đột xuất">Biến cố kinh tế đột xuất</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div>
                <label className="student-label" htmlFor="h-guardian">Họ tên phụ huynh / Chủ hộ *</label>
                <input
                  id="h-guardian"
                  className="student-input"
                  required
                  value={hard.guardianName}
                  placeholder="Nhập họ tên cha/mẹ hoặc người giám hộ"
                  onChange={(e) => updateHard({ guardianName: e.target.value })}
                />
              </div>
              <div>
                <label className="student-label" htmlFor="h-date">Ngày địa phương xác nhận *</label>
                <input
                  id="h-date"
                  type="date"
                  className="student-input"
                  required
                  value={toIsoDate(hard.confirmDate)}
                  onChange={(e) => updateHard({ confirmDate: toVnDate(e.target.value) })}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label className="student-label" htmlFor="h-desc">Trình bày chi tiết hoàn cảnh khó khăn *</label>
                <textarea
                  id="h-desc"
                  className="student-textarea"
                  rows={3}
                  required
                  value={hard.description}
                  placeholder="Nhập rõ lý do hoàn cảnh gia đình dẫn đến việc xin nghỉ học tạm thời..."
                  onChange={(e) => updateHard({ description: e.target.value })}
                />
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: 4 }}>
                <label
                  htmlFor="h-stamp"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}
                >
                  <input
                    id="h-stamp"
                    type="checkbox"
                    checked={hard.isValidStamp}
                    onChange={(e) => updateHard({ isValidStamp: e.target.checked })}
                  />
                  <span style={{ color: hard.isValidStamp ? 'var(--stamp-green)' : 'var(--stamp-red)', fontWeight: 600 }}>
                    Xác nhận hợp lệ: Đơn đã có lời phê xác nhận và dấu mộc đỏ của UBND Phường/Xã
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* 4. Form điền: Lý do cá nhân khác */}
          {optionKey === 'personal' && (
            <div>
              <div style={{ marginBottom: 12 }}>
                <label className="student-label">Loại hồ sơ cá nhân *</label>
                <div style={{ display: 'flex', gap: 14, marginTop: 4 }}>
                  <button
                    type="button"
                    className="student-radio-pill"
                    data-selected={pers.subType !== 'internship'}
                    onClick={() => updatePers({ subType: 'personal_letter' })}
                  >
                    <span>{pers.subType !== 'internship' ? '●' : '○'}</span>
                    <span>Đơn trình bày lý do cá nhân</span>
                  </button>
                  <button
                    type="button"
                    className="student-radio-pill"
                    data-selected={pers.subType === 'internship'}
                    onClick={() => updatePers({ subType: 'internship' })}
                  >
                    <span>{pers.subType === 'internship' ? '●' : '○'}</span>
                    <span>Xác nhận thực tập ngoài trường</span>
                  </button>
                </div>
              </div>

              {pers.subType !== 'internship' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 14px' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="student-label" htmlFor="p-content">Nội dung trình bày lý do cá nhân *</label>
                    <textarea
                      id="p-content"
                      className="student-textarea"
                      rows={3}
                      required
                      value={pers.personalReasonContent}
                      placeholder="Trình bày cụ thể lý do cá nhân xin nghỉ học tạm thời và kế hoạch học tập lại..."
                      onChange={(e) => updatePers({ personalReasonContent: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="student-label" htmlFor="p-pname">Họ tên phụ huynh đồng ý *</label>
                    <input
                      id="p-pname"
                      className="student-input"
                      required
                      value={pers.parentName}
                      placeholder="Nhập họ tên phụ huynh xác nhận"
                      onChange={(e) => updatePers({ parentName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="student-label" htmlFor="p-pphone">Số điện thoại phụ huynh *</label>
                    <input
                      id="p-pphone"
                      type="tel"
                      className="student-input"
                      required
                      value={pers.parentPhone}
                      placeholder="Nhập SĐT phụ huynh để đối chiếu"
                      onChange={(e) => updatePers({ parentPhone: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 14px' }}>
                  <div>
                    <label className="student-label" htmlFor="p-comp">Tên đơn vị / Công ty thực tập *</label>
                    <input
                      id="p-comp"
                      className="student-input"
                      required
                      value={pers.companyName}
                      placeholder="Nhập tên doanh nghiệp tiếp nhận"
                      onChange={(e) => updatePers({ companyName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="student-label" htmlFor="p-role">Vị trí & hình thức thực tập *</label>
                    <input
                      id="p-role"
                      className="student-input"
                      required
                      value={pers.internshipRole}
                      placeholder="VD: Thực tập sinh Toàn thời gian"
                      onChange={(e) => updatePers({ internshipRole: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="student-label" htmlFor="p-start">Ngày bắt đầu thực tập *</label>
                    <input
                      id="p-start"
                      type="date"
                      className="student-input"
                      required
                      value={toIsoDate(pers.startDate)}
                      onChange={(e) => updatePers({ startDate: toVnDate(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="student-label" htmlFor="p-end">Ngày kết thúc thực tập *</label>
                    <input
                      id="p-end"
                      type="date"
                      className="student-input"
                      required
                      value={toIsoDate(pers.endDate)}
                      onChange={(e) => updatePers({ endDate: toVnDate(e.target.value) })}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1', marginTop: 4 }}>
                    <label
                      htmlFor="p-stamp"
                      style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}
                    >
                      <input
                        id="p-stamp"
                        type="checkbox"
                        checked={pers.isValidStamp}
                        onChange={(e) => updatePers({ isValidStamp: e.target.checked })}
                      />
                      <span style={{ color: pers.isValidStamp ? 'var(--stamp-green)' : 'var(--stamp-red)', fontWeight: 600 }}>
                        Xác nhận đơn vị: Giấy tiếp nhận thực tập đã có chữ ký và dấu mộc đỏ của Công ty
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PHẦN 2: TẢI LÊN TỆP MINH CHỨNG TỪ MÁY TÍNH */}
          <div style={{ marginTop: 18, borderTop: '1px dashed var(--paper-line)', paddingTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontWeight: 'bold', fontSize: 13, textTransform: 'uppercase', color: 'var(--stamp-blue)' }}>
                📁 TẢI LÊN TỆP MINH CHỨNG TỪ MÁY TÍNH *
              </label>
              <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
                (Chọn ảnh chụp, bản scan hoặc file PDF từ thiết bị của bạn)
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) processSelectedFile(f);
              }}
            />

            {!uploadedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) processSelectedFile(f);
                }}
                style={{
                  border: dragOver ? '2px dashed var(--stamp-blue)' : '2px dashed var(--paper-line)',
                  background: dragOver ? 'var(--wash-blue)' : 'var(--paper-dim)',
                  padding: '20px 14px',
                  textAlign: 'center',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: 26, marginBottom: 4 }}>📂</div>
                <div style={{ fontWeight: 'bold', fontSize: 13, color: 'var(--ink)' }}>
                  Bấm vào đây để chọn tệp từ máy tính
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 3 }}>
                  Chấp nhận các định dạng Ảnh (.png, .jpg, .jpeg), file .PDF hoặc tài liệu Word (.docx)
                </div>
              </div>
            ) : (
              <div
                style={{
                  border: '1px solid var(--stamp-green)',
                  background: 'var(--wash-green)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  {uploadedFile.type.startsWith('image/') && uploadedFile.dataUrl ? (
                    <img
                      src={uploadedFile.dataUrl}
                      alt="Xem trước ảnh minh chứng"
                      style={{
                        width: 48,
                        height: 48,
                        objectFit: 'cover',
                        borderRadius: 3,
                        border: '1px solid var(--paper-line)',
                        background: '#fff',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: 32, flexShrink: 0 }}>📄</span>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 'bold',
                        fontSize: 13,
                        color: 'var(--ink)',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {uploadedFile.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--stamp-green)', marginTop: 2 }}>
                      ✔ Đã tải lên từ máy · Dung lượng: {formatFileSize(uploadedFile.size)}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setUploadedFile(null);
                    setData((prev) => ({ ...prev, uploadedFile: null }));
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  style={{
                    background: 'none',
                    border: '1px solid var(--stamp-red)',
                    color: 'var(--stamp-red)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 11,
                    fontFamily: 'var(--font-paper)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ✕ Chọn tệp khác
                </button>
              </div>
            )}

            {fileError && (
              <div style={{ color: 'var(--stamp-red)', fontSize: 11.5, marginTop: 4, fontWeight: 'bold' }}>
                ⚠ {fileError}
              </div>
            )}
          </div>

          {/* Nút hành động */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginTop: 20,
              paddingTop: 12,
              borderTop: '1px dashed var(--paper-line)',
            }}
          >
            <div style={{ flex: 1, fontSize: 11.5, color: 'var(--ink-soft)', lineHeight: 1.4 }}>
              💡 Hệ thống sẽ nộp đồng thời Giấy xác nhận và tệp minh chứng bạn vừa tải lên từ máy tính.
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '7px 16px',
                  fontFamily: 'var(--font-paper)',
                  fontSize: 13,
                  background: 'var(--paper-dim)',
                  color: 'var(--ink)',
                  border: '1px solid var(--paper-line)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                }}
              >
                ✕ Hủy bỏ
              </button>
              <button
                type="submit"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 22px',
                  fontFamily: 'var(--font-paper)',
                  fontSize: 13.5,
                  fontWeight: 'bold',
                  background: 'var(--stamp-green)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-hard)',
                  letterSpacing: 0.5,
                }}
              >
                ✉ NỘP CẢ GIẤY XÁC NHẬN & MINH CHỨNG
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
