import { EvidenceItem, StudentApplicationForm } from '../engine/types';
import { getStorageItem, setStorageItem } from './userRegistry';

export interface MedicalEvidenceDetails {
  hospital: string; // BỆNH VIỆN CẤP GIẤY *
  recordCode: string; // MÃ BỆNH ÁN / SỐ LƯU TRỮ *
  department: string; // KHOA ĐIỀU TRỊ *
  doctorName: string; // HỌ TÊN BÁC SĨ CHỈ ĐỊNH *
  admissionDate: string; // NGÀY NHẬP VIỆN * (DD/MM/YYYY)
  dischargeDate: string; // NGÀY CẤP GIẤY XÁC NHẬN * (DD/MM/YYYY)
  diagnosis: string; // CHẨN ĐOÁN BỆNH & CHỈ ĐỊNH ĐIỀU TRỊ *
  isValidStamp: boolean; // XÁC NHẬN HỢP LỆ * (Có chữ ký và dấu mộc đỏ)
}

export interface MilitaryEvidenceDetails {
  militaryUnit: string; // CƠ QUAN CẤP LỆNH (BCH QUÂN SỰ) *
  orderNumber: string; // SỐ LỆNH GỌI NHẬP NGŨ *
  signDate: string; // NGÀY KÝ LỆNH * (DD/MM/YYYY)
  reportDate: string; // NGÀY TẬP TRUNG NHẬP NGŨ * (DD/MM/YYYY)
  location: string; // ĐỊA ĐIỂM GIAO NHẬN QUÂN *
  isValidStamp: boolean; // XÁC NHẬN HỢP LỆ * (Có chữ ký và dấu mộc đỏ)
}

export interface HardshipEvidenceDetails {
  authority: string; // UBND PHƯỜNG/XÃ XÁC NHẬN *
  category: 'Hộ nghèo' | 'Hộ cận nghèo' | 'Biến cố kinh tế đột xuất' | 'Khác'; // DIỆN HOÀN CẢNH *
  guardianName: string; // HỌ TÊN PHỤ HUYNH / CHỦ HỘ *
  confirmDate: string; // NGÀY ĐỊA PHƯƠNG XÁC NHẬN * (DD/MM/YYYY)
  description: string; // TRÌNH BÀY CHI TIẾT HOÀN CẢNH KHÓ KHĂN *
  isValidStamp: boolean; // XÁC NHẬN HỢP LỆ * (Có lời phê xác nhận và dấu mộc đỏ)
}

export interface PersonalEvidenceDetails {
  subType: 'personal_letter' | 'internship'; // LOẠI HỒ SƠ CÁ NHÂN *
  // Nhánh A: Đơn trình bày lý do cá nhân
  personalReasonContent: string; // NỘI DUNG TRÌNH BÀY LÝ DO CÁ NHÂN *
  parentName: string; // HỌ TÊN PHỤ HUYNH ĐỒNG Ý *
  parentPhone: string; // SỐ ĐIỆN THOẠI PHỤ HUYNH *
  // Nhánh B: Xác nhận thực tập ngoài trường
  companyName: string; // TÊN ĐƠN VỊ / CÔNG TY THỰC TẬP *
  internshipRole: string; // VỊ TRÍ & HÌNH THỨC THỰC TẬP *
  startDate: string; // NGÀY BẮT ĐẦU THỰC TẬP * (DD/MM/YYYY)
  endDate: string; // NGÀY KẾT THÚC THỰC TẬP * (DD/MM/YYYY)
  isValidStamp: boolean; // XÁC NHẬN ĐƠN VỊ * (Có chữ ký và dấu mộc đỏ của Công ty)
}

export interface UploadedEvidenceFile {
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
  svgRaw?: string;
  lastModified?: number;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface StudentDetailedFormData {
  // PHẦN 1: THÔNG TIN CHUNG (Cố định ở đầu đơn)
  fullName: string;
  mssv: string;
  className: string;
  faculty: string;
  phone: string;
  email: string;
  reason: StudentApplicationForm['reason'];
  semesterCount: 1 | 2;
  startSemester: string;

  // PHẦN 2: CHI TIẾT THEO TỪNG ĐỀ BÀI / LOẠI GIẤY TỜ
  medical: MedicalEvidenceDetails;
  military: MilitaryEvidenceDetails;
  hardship: HardshipEvidenceDetails;
  personal: PersonalEvidenceDetails;

  // TỆP MINH CHỨNG TẢI LÊN TỪ MÁY TÍNH
  uploadedFile?: UploadedEvidenceFile | null;

  // PHẦN 3: CAM KẾT
  commitment: boolean;
}

export const FACULTIES_LIST = [
  'Khoa Thống kê - Tin học',
  'Khoa Công nghệ thông tin kinh doanh',
  'Khoa Kinh tế',
  'Khoa Quản trị kinh doanh',
  'Khoa Thương mại điện tử',
  'Khoa Tài chính - Ngân hàng',
  'Khoa Kế toán',
  'Khoa Marketing',
  'Khoa Du lịch',
  'Khoa Luật',
  'Khoa Kinh doanh quốc tế',
];

export function toIsoDate(d?: string): string {
  if (!d) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const match = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return '';
}

export function toVnDate(d?: string): string {
  if (!d) return '';
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(d)) return d;
  const match = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }
  return d;
}

export function getDefaultMedicalDetails(): MedicalEvidenceDetails {
  return {
    hospital: '',
    recordCode: '',
    department: '',
    doctorName: '',
    admissionDate: '',
    dischargeDate: '',
    diagnosis: '',
    isValidStamp: false,
  };
}

export function getDefaultMilitaryDetails(): MilitaryEvidenceDetails {
  return {
    militaryUnit: '',
    orderNumber: '',
    signDate: '',
    reportDate: '',
    location: '',
    isValidStamp: false,
  };
}

export function getDefaultHardshipDetails(): HardshipEvidenceDetails {
  return {
    authority: '',
    category: 'Biến cố kinh tế đột xuất',
    guardianName: '',
    confirmDate: '',
    description: '',
    isValidStamp: false,
  };
}

export function getDefaultPersonalDetails(): PersonalEvidenceDetails {
  return {
    subType: 'personal_letter',
    personalReasonContent: '',
    parentName: '',
    parentPhone: '',
    companyName: '',
    internshipRole: '',
    startDate: '',
    endDate: '',
    isValidStamp: false,
  };
}

export function createDefaultStudentFormData(student: {
  mssv: string;
  name?: string;
  className?: string;
  faculty?: string;
  email?: string;
  phone?: string;
}): StudentDetailedFormData {
  return {
    fullName: student.name || 'Sinh viên',
    mssv: student.mssv,
    className: student.className || '51K36',
    faculty: student.faculty || 'Khoa Thống kê - Tin học',
    phone: student.phone || '0905123456',
    email: student.email || `${student.mssv}@due.udn.vn`,
    reason: 'Ốm đau/tai nạn điều trị dài',
    semesterCount: 1,
    startSemester: 'Học kỳ 1 năm học 2026–2027',
    medical: getDefaultMedicalDetails(),
    military: getDefaultMilitaryDetails(),
    hardship: getDefaultHardshipDetails(),
    personal: getDefaultPersonalDetails(),
    uploadedFile: null,
    commitment: true,
  };
}

const STORAGE_PREFIX = 'bao_luu_student_form_v5_';

export function getStudentFormData(
  mssv: string,
  profile?: {
    name?: string;
    className?: string;
    faculty?: string;
    email?: string;
    phone?: string;
  }
): StudentDetailedFormData {
  const trimmedMssv = (mssv || '').trim();
  if (!trimmedMssv) {
    return createDefaultStudentFormData({ mssv: '251121536115' });
  }

  const key = STORAGE_PREFIX + trimmedMssv;
  const raw = getStorageItem(key);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as StudentDetailedFormData;
      // Tự động điền các trường sinh viên từ tài khoản nếu có
      if (profile?.name) parsed.fullName = profile.name;
      if (profile?.className) parsed.className = profile.className;
      if (profile?.faculty) parsed.faculty = profile.faculty;
      if (profile?.email) parsed.email = profile.email;
      if (profile?.phone) parsed.phone = profile.phone;
      parsed.mssv = trimmedMssv;
      return parsed;
    } catch {
      // Bỏ qua lỗi parse, tạo mới
    }
  }

  const initial = createDefaultStudentFormData({
    mssv: trimmedMssv,
    name: profile?.name,
    className: profile?.className,
    faculty: profile?.faculty,
    email: profile?.email,
    phone: profile?.phone,
  });
  saveStudentFormData(trimmedMssv, initial);
  return initial;
}

export function saveStudentFormData(mssv: string, data: StudentDetailedFormData): void {
  const trimmedMssv = (mssv || '').trim();
  if (!trimmedMssv) return;
  const key = STORAGE_PREFIX + trimmedMssv;
  setStorageItem(key, JSON.stringify(data));
}

/**
 * Tạo EvidenceItem số hóa tương ứng dựa trên dữ liệu chi tiết của form do sinh viên nhập
 */
export function buildEvidenceItemFromFormData(
  formData: StudentDetailedFormData,
  reasonOverride?: StudentApplicationForm['reason']
): EvidenceItem {
  const reason = reasonOverride || formData.reason;
  const studentName = formData.fullName || 'Sinh viên';
  let item: EvidenceItem;

  switch (reason) {
    case 'Ốm đau/tai nạn điều trị dài': {
      const med = formData.medical;
      const hasHospital = Boolean(med.hospital && med.hospital.trim().length > 0);
      const hasStamp = med.isValidStamp === true;

      item = {
        id: 'ev_custom_med',
        type: 'medical_record',
        name: hasHospital
          ? `Giấy xác nhận của bệnh viện (${med.hospital})`
          : 'Giấy xác nhận bệnh viện (Thiếu tên cơ sở y tế)',
        content: `Chẩn đoán: ${med.diagnosis || 'Chưa có chẩn đoán'}. Khoa: ${med.department || 'Chưa ghi'}. Bác sĩ chỉ định: ${med.doctorName || 'Chưa ghi'}.`,
        fields: [
          { id: 'hospital', label: 'Bệnh viện cấp giấy', value: med.hospital || '' },
          { id: 'recordCode', label: 'Mã bệnh án / Số lưu trữ', value: med.recordCode || '' },
          { id: 'department', label: 'Khoa điều trị', value: med.department || '' },
          { id: 'patientName', label: 'Họ tên bệnh nhân', value: studentName },
          { id: 'doctorName', label: 'Bác sĩ điều trị', value: med.doctorName || '' },
          { id: 'admissionDate', label: 'Ngày nhập viện', value: med.admissionDate || '' },
          { id: 'dischargeDate', label: 'Ngày cấp giấy xác nhận', value: med.dischargeDate || '' },
          { id: 'diagnosis', label: 'Chẩn đoán điều trị', value: med.diagnosis || '' },
          {
            id: 'hospitalStamp',
            label: 'Dấu bệnh viện',
            value: hasStamp ? 'Có chữ ký và dấu mộc đỏ Bệnh viện' : 'Chưa có dấu mộc đỏ',
          },
        ],
        issueNotes: hasStamp
          ? undefined
          : 'Giấy xác nhận chưa có chữ ký và dấu mộc đỏ của Bệnh viện theo quy định',
      };
      break;
    }

    case 'Nghĩa vụ quân sự': {
      const mil = formData.military;
      const hasUnit = Boolean(mil.militaryUnit && mil.militaryUnit.trim().length > 0);
      const hasStamp = mil.isValidStamp === true;

      item = {
        id: 'ev_custom_mil',
        type: 'military_call',
        name: hasUnit
          ? `Giấy đi nghĩa vụ quân sự (${mil.militaryUnit})`
          : 'Lệnh gọi nhập ngũ (Thiếu đơn vị ban hành)',
        content: `Lệnh gọi nhập ngũ số ${mil.orderNumber || 'Chưa ghi'}. Ngày tập trung: ${mil.reportDate || 'Chưa ghi'} tại ${mil.location || 'Chưa ghi'}.`,
        fields: [
          { id: 'unit', label: 'Cơ quan cấp lệnh (BCH Quân sự)', value: mil.militaryUnit || '' },
          { id: 'orderNumber', label: 'Số lệnh gọi nhập ngũ', value: mil.orderNumber || '' },
          { id: 'citizenName', label: 'Công dân', value: studentName },
          { id: 'signDate', label: 'Ngày ký lệnh', value: mil.signDate || '' },
          { id: 'reportDate', label: 'Ngày tập trung nhập ngũ', value: mil.reportDate || '' },
          { id: 'location', label: 'Địa điểm giao nhận quân', value: mil.location || '' },
          {
            id: 'stamp',
            label: 'Dấu đơn vị',
            value: hasStamp ? 'Có chữ ký và dấu mộc đỏ BCH Quân sự' : 'Chưa có dấu mộc đỏ',
          },
        ],
        issueNotes: hasStamp
          ? undefined
          : 'Lệnh gọi nhập ngũ chưa có chữ ký và dấu mộc đỏ của BCH Quân sự theo quy định',
      };
      break;
    }

    case 'Hoàn cảnh gia đình': {
      const hard = formData.hardship;
      const hasAuth = Boolean(hard.authority && hard.authority.trim().length > 0);
      const hasStamp = hard.isValidStamp === true;

      item = {
        id: 'ev_custom_hard',
        type: 'hardship_proof',
        name: hasAuth
          ? `Giấy chứng minh hoàn cảnh gia đình (${hard.authority})`
          : 'Giấy chứng minh hoàn cảnh gia đình (Thiếu cơ quan xác nhận)',
        content: `Xác nhận diện: ${hard.category}. Chi tiết hoàn cảnh: ${hard.description || 'Chưa ghi'}.`,
        fields: [
          { id: 'authority', label: 'UBND Phường/Xã xác nhận', value: hard.authority || '' },
          { id: 'category', label: 'Diện hoàn cảnh', value: hard.category },
          { id: 'guardianName', label: 'Họ tên phụ huynh / Chủ hộ', value: hard.guardianName || '' },
          { id: 'citizenName', label: 'Họ tên sinh viên', value: studentName },
          { id: 'confirmDate', label: 'Ngày địa phương xác nhận', value: hard.confirmDate || '' },
          { id: 'reason', label: 'Lý do hoàn cảnh khó khăn', value: hard.description || '' },
          {
            id: 'stamp',
            label: 'Dấu xác nhận',
            value: hasStamp ? 'Có lời phê xác nhận và dấu mộc đỏ UBND' : 'Chưa có dấu mộc đỏ',
          },
        ],
        issueNotes: hasStamp
          ? undefined
          : 'Đơn chưa có lời phê xác nhận và dấu mộc đỏ của UBND Phường/Xã theo quy định',
      };
      break;
    }

    case 'Lý do cá nhân khác': {
      const pers = formData.personal;
      const isInternship = pers.subType === 'internship';
      const hasStamp = pers.isValidStamp === true;

      item = {
        id: 'ev_custom_pers',
        type: 'personal_reason',
        name: isInternship
          ? `Giấy tiếp nhận thực tập (${pers.companyName || 'Thiếu tên đơn vị'})`
          : 'Đơn trình bày lý do cá nhân (Có xác nhận phụ huynh)',
        content: isInternship
          ? `Thực tập tại ${pers.companyName || 'Chưa ghi'}, vị trí: ${pers.internshipRole || 'Chưa ghi'}. Thời gian: ${pers.startDate || 'Chưa ghi'} đến ${pers.endDate || 'Chưa ghi'}.`
          : `Lý do cá nhân: ${pers.personalReasonContent || 'Chưa ghi'}. Phụ huynh xác nhận: ${pers.parentName || 'Chưa ghi'} (${pers.parentPhone || 'Chưa ghi'}).`,
        fields: isInternship
          ? [
              { id: 'company', label: 'Đơn vị / Công ty thực tập', value: pers.companyName || '' },
              { id: 'role', label: 'Vị trí & hình thức thực tập', value: pers.internshipRole || '' },
              { id: 'studentName', label: 'Họ tên sinh viên', value: studentName },
              { id: 'startDate', label: 'Ngày bắt đầu thực tập', value: pers.startDate || '' },
              { id: 'endDate', label: 'Ngày kết thúc thực tập', value: pers.endDate || '' },
              {
                id: 'stamp',
                label: 'Dấu đơn vị',
                value: hasStamp ? 'Có chữ ký và dấu mộc đỏ của Công ty' : 'Chưa có dấu mộc đỏ',
              },
            ]
          : [
              { id: 'subType', label: 'Loại hồ sơ cá nhân', value: 'Đơn trình bày lý do cá nhân' },
              { id: 'studentName', label: 'Họ tên sinh viên', value: studentName },
              { id: 'content', label: 'Nội dung lý do', value: pers.personalReasonContent || '' },
              { id: 'parentName', label: 'Họ tên phụ huynh đồng ý', value: pers.parentName || '' },
              { id: 'parentPhone', label: 'SĐT phụ huynh', value: pers.parentPhone || '' },
              {
                id: 'stamp',
                label: 'Xác nhận gia đình',
                value: hasStamp ? 'Đã có cam kết và chữ ký của phụ huynh' : 'Chưa có chữ ký xác nhận',
              },
            ],
        issueNotes:
          isInternship && !hasStamp
            ? 'Giấy tiếp nhận thực tập chưa có chữ ký và dấu mộc đỏ của Công ty theo quy định'
            : undefined,
      };
      break;
    }
  }

  // Đính kèm metadata tệp tải lên từ máy tính nếu có
  if (formData.uploadedFile) {
    item.fileData = formData.uploadedFile;
    item.fields = [
      ...(item.fields || []),
      {
        id: 'attachedFile',
        label: 'Tệp minh chứng đính kèm từ máy',
        value: `${formData.uploadedFile.name} (${formatFileSize(formData.uploadedFile.size)})`,
      },
    ];
  }

  return item;
}

/**
 * Trả về cả Giấy xác nhận và Tệp minh chứng do người dùng đăng lên từ máy tính
 */
export function buildEvidenceItemsFromFormData(
  formData: StudentDetailedFormData,
  reasonOverride?: StudentApplicationForm['reason']
): EvidenceItem[] {
  const confirmationItem = buildEvidenceItemFromFormData(formData, reasonOverride);

  if (!formData.uploadedFile) {
    return [confirmationItem];
  }

  const fileItem: EvidenceItem = {
    id: `ev_file_${confirmationItem.id}`,
    type: 'attached_file',
    name: `Minh chứng gốc: ${formData.uploadedFile.name}`,
    content: `Tệp minh chứng số hóa do sinh viên đăng tải từ máy tính: ${formData.uploadedFile.name} (${formatFileSize(formData.uploadedFile.size)}). Khớp với giấy xác nhận: ${confirmationItem.name}.`,
    fileData: formData.uploadedFile,
    fields: [
      { id: 'fileName', label: 'Tên tệp', value: formData.uploadedFile.name },
      { id: 'fileSize', label: 'Dung lượng tệp', value: formatFileSize(formData.uploadedFile.size) },
      { id: 'fileType', label: 'Định dạng tệp', value: formData.uploadedFile.type || 'Tệp số hóa' },
      { id: 'source', label: 'Nguồn tải lên', value: 'Tải lên từ thiết bị máy tính' },
      { id: 'linkedDoc', label: 'Giấy xác nhận liên kết', value: confirmationItem.name },
    ],
  };

  return [confirmationItem, fileItem];
}
