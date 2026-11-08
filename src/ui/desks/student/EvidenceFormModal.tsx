import React, { useState, useRef, useEffect } from 'react';
import {
  StudentDetailedFormData,
  UploadedEvidenceFile,
  formatFileSize,
  toIsoDate,
  toVnDate,
} from '../../../data/studentFormData';
import { StudentEvidenceOptionKey } from '../../../data/customTestData';
import { Paperclip } from '../../kit/Paperclip';
import { DocumentScanOverlay } from '../../kit/DocumentScanOverlay';
import { getActiveAI } from '../../../store/playback/session';
import { defaultMockAI } from '../../../ai/mock';
import { AIService } from '../../../ai/service';
import { sfx } from '../../audio/sfx';
import { detectEvidenceCategory } from '../../../ai/mockTemplates';
import { analyzeImageVisualFeatures } from '../../../ai/imageScanner';
import {
  isLiveAvailable,
  createLiveAIFromEnv,
} from '../../../ai/live';

const CATEGORY_TABS: { key: StudentEvidenceOptionKey; icon: string; label: string }[] = [
  { key: 'medical', icon: '🏥', label: 'Bệnh viện / Y tế' },
  { key: 'military', icon: '🪖', label: 'Nghĩa vụ quân sự' },
  { key: 'hardship', icon: '🏡', label: 'Hoàn cảnh gia đình' },
  { key: 'personal', icon: '📝', label: 'Lý do cá nhân' },
];

interface Props {
  optionKey?: StudentEvidenceOptionKey;
  initialData: StudentDetailedFormData;
  onSave: (updatedData: StudentDetailedFormData, category?: StudentEvidenceOptionKey) => void;
  onClose: () => void;
}

export const EvidenceFormModal: React.FC<Props> = ({
  optionKey,
  initialData,
  onSave,
  onClose,
}) => {
  const [data, setData] = useState<StudentDetailedFormData>(() => ({ ...initialData }));
  const [category, setCategory] = useState<StudentEvidenceOptionKey>(() => {
    if (optionKey) return optionKey;
    if (initialData.reason === 'Nghĩa vụ quân sự') return 'military';
    if (initialData.reason === 'Hoàn cảnh gia đình') return 'hardship';
    if (initialData.reason === 'Lý do cá nhân khác') return 'personal';
    return 'medical';
  });

  useEffect(() => {
    if (optionKey) {
      setCategory(optionKey);
    }
  }, [optionKey]);

  const [uploadedFile, setUploadedFile] = useState<UploadedEvidenceFile | null>(
    () => initialData.uploadedFile || null
  );
  const [imgLoadError, setImgLoadError] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState<string[]>([]);
  const [scanSummary, setScanSummary] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'warning'>('idle');

  // Trạng thái AI Vision (tự động nhận diện)
  const [isLiveMode] = useState<boolean>(() => isLiveAvailable());

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAutoFilled = (key: string): boolean => autoFilledFields.includes(key);

  const processSelectedFile = (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      setFileError('Dung lượng tệp tối đa 20MB. Vui lòng chọn tệp nhỏ hơn.');
      return;
    }
    setFileError(null);
    setImgLoadError(false);
    setScanSummary(null);
    setScanStatus('idle');
    setAutoFilledFields([]);

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

      const finalizeUpload = (fData: UploadedEvidenceFile) => {
        setUploadedFile(fData);
        setData((prev) => ({ ...prev, uploadedFile: fData }));
        // Tự động nhận diện loại tài liệu từ tệp tải lên
        const detected = detectEvidenceCategory(fData, category);
        const targetCategory = detected || category;
        if (detected && detected !== category) {
          setCategory(detected);
        }
        sfx.playPaperSlide();
        // Tự động kích hoạt AI quét & điền trường ngay khi tệp được tải lên
        void executeAiScan(fData, targetCategory);
      };

      if (file.type.includes('svg') || file.name.endsWith('.svg')) {
        const textReader = new FileReader();
        textReader.onload = () => {
          fileData.svgRaw = textReader.result as string;
          finalizeUpload(fileData);
        };
        textReader.readAsText(file);
      } else {
        finalizeUpload(fileData);
      }
    };
    reader.onerror = () => {
      setFileError('Không thể đọc tệp từ thiết bị. Vui lòng thử lại.');
    };
    reader.readAsDataURL(file);
  };

  const executeAiScan = async (
    fileToScan: UploadedEvidenceFile,
    targetCategory?: StudentEvidenceOptionKey
  ) => {
    if (isScanning) return;
    setIsScanning(true);
    setFileError(null);
    setScanSummary(null);
    setAutoFilledFields([]);
    setScanStatus('idle');

    try {
      // 0. Phân tích thị giác (Computer Vision / Canvas) phát hiện ảnh mạng xã hội, ảnh nền tối / infographic
      const visualAnalysis = await analyzeImageVisualFeatures(fileToScan);
      if (!visualAnalysis.isValidDocumentPaper) {
        setScanStatus('warning');
        setAutoFilledFields([]);
        const rejectMsg =
          visualAnalysis.rejectReason ||
          'Không tìm thấy thông tin hợp lệ trên tài liệu để tự động điền các trường. Hình ảnh không phải là văn bản hành chính in trên giấy trắng có con dấu mộc đỏ.';
        setFileError(`TÀI LIỆU BỊ LOẠI BỎ: ${rejectMsg}`);
        setScanSummary(rejectMsg);
        sfx.playBuzz();
        return;
      }

      const liveAvailable = isLiveAvailable();
      let effectiveCategory = targetCategory || category;

      // Nếu ở chế độ Mock, kiểm tra phân loại tài liệu
      if (!liveAvailable) {
        const detectedCat = detectEvidenceCategory(fileToScan, effectiveCategory);
        if (!detectedCat) {
          setScanStatus('warning');
          setAutoFilledFields([]);
          const rejectMsg = `Tệp "${fileToScan.name}" không phát hiện thông tin chứng thực của cơ quan có thẩm quyền để tự động điền các trường. Vui lòng kiểm tra lại chất lượng tài liệu hoặc tự nhập thông tin.`;
          setFileError(`TÀI LIỆU BỊ LOẠI BỎ: ${rejectMsg}`);
          setScanSummary(rejectMsg);
          sfx.playBuzz();
          return;
        }
        effectiveCategory = detectedCat;
      }

      const activeAi = getActiveAI();
      const ai =
        activeAi ??
        new AIService(
          defaultMockAI,
          createLiveAIFromEnv(),
          liveAvailable ? 'live' : 'mock'
        );
      if (liveAvailable) {
        ai.setLiveProvider(createLiveAIFromEnv());
        ai.setMode('live');
        ai.resetSource();
      }
      const result = await ai.scanDocument(fileToScan, effectiveCategory);

      // "nếu mà không thấy thông tin để điền sẽ báo lỗi"
      const isSuccess = Boolean(
        result &&
        result.confidence >= 0.6 &&
        result.extractedCount > 0 &&
        result.fields &&
        result.fields.length > 0
      );
      setScanSummary(result.summary);

      if (isSuccess) {
        // Cập nhật tab sang loại giấy tờ vừa trích xuất
        const finalCategory = result.documentType || effectiveCategory;
        if (finalCategory !== category) {
          setCategory(finalCategory);
        }
        setScanStatus('success');
        setFileError(null);
        sfx.playOcrSuccess();

        const filledKeys: string[] = [];
        if (finalCategory === 'medical' && result.data.medical) {
          const m = result.data.medical;
          setData((prev) => ({
            ...prev,
            medical: {
              ...prev.medical,
              ...(m.hospital ? { hospital: m.hospital } : {}),
              ...(m.recordCode ? { recordCode: m.recordCode } : {}),
              ...(m.department ? { department: m.department } : {}),
              ...(m.doctorName ? { doctorName: m.doctorName } : {}),
              ...(m.admissionDate ? { admissionDate: m.admissionDate } : {}),
              ...(m.dischargeDate ? { dischargeDate: m.dischargeDate } : {}),
              ...(m.diagnosis ? { diagnosis: m.diagnosis } : {}),
              ...(m.isValidStamp !== undefined ? { isValidStamp: m.isValidStamp } : {}),
            },
          }));
          filledKeys.push(...result.fields.map((f) => f.key));
        } else if (finalCategory === 'military' && result.data.military) {
          const mil = result.data.military;
          setData((prev) => ({
            ...prev,
            military: {
              ...prev.military,
              ...(mil.militaryUnit ? { militaryUnit: mil.militaryUnit } : {}),
              ...(mil.orderNumber ? { orderNumber: mil.orderNumber } : {}),
              ...(mil.signDate ? { signDate: mil.signDate } : {}),
              ...(mil.reportDate ? { reportDate: mil.reportDate } : {}),
              ...(mil.location ? { location: mil.location } : {}),
              ...(mil.isValidStamp !== undefined ? { isValidStamp: mil.isValidStamp } : {}),
            },
          }));
          filledKeys.push(...result.fields.map((f) => f.key));
        } else if (finalCategory === 'hardship' && result.data.hardship) {
          const h = result.data.hardship;
          setData((prev) => ({
            ...prev,
            hardship: {
              ...prev.hardship,
              ...(h.authority ? { authority: h.authority } : {}),
              ...(h.category ? { category: h.category } : {}),
              ...(h.guardianName ? { guardianName: h.guardianName } : {}),
              ...(h.confirmDate ? { confirmDate: h.confirmDate } : {}),
              ...(h.description ? { description: h.description } : {}),
              ...(h.isValidStamp !== undefined ? { isValidStamp: h.isValidStamp } : {}),
            },
          }));
          filledKeys.push(...result.fields.map((f) => f.key));
        } else if (finalCategory === 'personal' && result.data.personal) {
          const p = result.data.personal;
          setData((prev) => ({
            ...prev,
            personal: {
              ...prev.personal,
              ...(p.subType ? { subType: p.subType } : {}),
              ...(p.personalReasonContent ? { personalReasonContent: p.personalReasonContent } : {}),
              ...(p.parentName ? { parentName: p.parentName } : {}),
              ...(p.parentPhone ? { parentPhone: p.parentPhone } : {}),
              ...(p.companyName ? { companyName: p.companyName } : {}),
              ...(p.internshipRole ? { internshipRole: p.internshipRole } : {}),
              ...(p.startDate ? { startDate: p.startDate } : {}),
              ...(p.endDate ? { endDate: p.endDate } : {}),
              ...(p.isValidStamp !== undefined ? { isValidStamp: p.isValidStamp } : {}),
            },
          }));
          filledKeys.push(...result.fields.map((f) => f.key));
        }
        setAutoFilledFields(filledKeys);
      } else {
        // Tệp cảnh báo / rác / không hợp lệ hoặc không tìm thấy thông tin để điền: Báo lỗi rõ ràng
        setScanStatus('warning');
        setAutoFilledFields([]);
        const errorMsg =
          result.summary ||
          'Không tìm thấy thông tin hợp lệ trên tài liệu để tự động điền các trường. Vui lòng kiểm tra lại hình ảnh hoặc tự nhập thông tin.';
        setFileError(`TÀI LIỆU BỊ LOẠI BỎ: ${errorMsg}`);
        sfx.playBuzz();
      }
    } catch {
      setScanStatus('warning');
      setAutoFilledFields([]);
      setFileError('Không thể hoàn tất quét OCR tài liệu để tự động điền ô. Vui lòng thử lại hoặc điền tay.');
      sfx.playBuzz();
    } finally {
      setIsScanning(false);
    }
  };

  const handleTriggerAiScan = () => {
    if (uploadedFile) {
      void executeAiScan(uploadedFile, category);
    }
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
    if (scanStatus === 'warning') {
      setFileError('Tài liệu minh chứng không hợp lệ và đã bị hệ thống từ chối. Vui lòng tải giấy tờ có xác nhận hợp lệ trước khi nộp!');
      sfx.play('buzz');
      return;
    }
    sfx.playStamp();
    onSave({ ...data, uploadedFile }, category);
  };

  const inputClass = (key: string): string =>
    `student-input${isAutoFilled(key) ? ' student-input--autofilled' : ''}`;

  const renderLabel = (text: string, id: string, autoFillKey: string, required = true) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
      <label className="student-label" htmlFor={id} style={{ marginBottom: 0 }}>
        {text} {required ? '*' : ''}
      </label>
      {isAutoFilled(autoFillKey) && (
        <span className="ai-autofill-badge" title="Thông tin do AI trích xuất tự động từ văn bản">
          ✓ AI điền
        </span>
      )}
    </div>
  );

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
          width: 'min(660px, 95vw)',
          maxHeight: '92vh',
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
            {category === 'medical' && '🏥 Giấy xác nhận của bệnh viện (Ốm đau/tai nạn điều trị dài)'}
            {category === 'military' && '🪖 Giấy đi nghĩa vụ quân sự (Lệnh gọi công dân nhập ngũ)'}
            {category === 'hardship' && '🏡 Giấy chứng minh hoàn cảnh gia đình (Xác nhận UBND Phường/Xã)'}
            {category === 'personal' && '📝 Lý do cá nhân khác (Đơn trình bày / Thực tập ngoài trường)'}
          </h3>
          <p style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 2 }}>
            Họ tên sinh viên: <strong>{data.fullName}</strong> · MSSV: <strong>{data.mssv}</strong>
          </p>

          {/* Thanh chuyển / nhận diện loại minh chứng */}
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 'bold', color: 'var(--ink-soft)', textTransform: 'uppercase' }}>
                Loại minh chứng:
              </span>
              <span style={{ fontSize: 11, color: 'var(--stamp-green)', fontWeight: 600 }}>
                ✨ Tự động nhận diện khi tải ảnh / quét OCR
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {CATEGORY_TABS.map((tab) => {
                const active = category === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setCategory(tab.key);
                      sfx.playKeyClack();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      padding: '5px 6px',
                      fontSize: 11.5,
                      fontFamily: 'var(--font-paper)',
                      fontWeight: active ? 'bold' : 'normal',
                      border: active ? '2px solid var(--stamp-blue)' : '1px solid var(--paper-line)',
                      background: active ? 'var(--wash-blue)' : 'var(--paper-dim)',
                      color: active ? 'var(--stamp-blue)' : 'var(--ink)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* KHỐI 1: TẢI MINH CHỨNG & AI QUÉT THÔNG MINH (OCR AUTO-FILL) */}
          <div
            style={{
              background: 'var(--paper-dim)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--paper-line)',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
                marginBottom: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14 }}>📁</span>
                <span style={{ fontWeight: 'bold', fontSize: 12.5, textTransform: 'uppercase', color: 'var(--stamp-blue)' }}>
                  Tệp minh chứng & AI Quét (OCR)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: 11.5,
                    padding: '4px 10px',
                    borderRadius: 14,
                    background: '#e0f2fe',
                    color: '#0369a1',
                    border: '1.5px solid #0284c7',
                    fontWeight: 'bold',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                  title="Hệ thống tự động sử dụng trí tuệ nhân tạo (AI Vision OCR) để nhận diện văn bản trên ảnh"
                >
                  <span>✨ AI Vision OCR</span>
                  <span style={{ fontSize: 10, background: '#0284c7', color: '#fff', padding: '1px 6px', borderRadius: 8 }}>
                    Tự động
                  </span>
                </span>
              </div>
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
                  background: dragOver ? 'var(--wash-blue)' : '#fbfaf5',
                  padding: '16px 14px',
                  textAlign: 'center',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: 26, marginBottom: 4 }}>📂</div>
                <div style={{ fontWeight: 'bold', fontSize: 13, color: 'var(--ink)' }}>
                  Bấm vào đây để chọn tệp ảnh hoặc PDF từ máy tính
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 4 }}>
                  Hỗ trợ định dạng hình ảnh (PNG, JPG, SVG) hoặc tệp tài liệu PDF
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Khung ngắm xem trước tài liệu có tích hợp máy quét laser OCR */}
                <DocumentScanOverlay
                  isScanning={isScanning}
                  documentType={category}
                  fileName={uploadedFile.name}
                  className="paper-lifted"
                >
                  {uploadedFile.svgRaw ? (
                    <div
                      className="sample-svg-preview"
                      style={{
                        width: '100%',
                        height: 220,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#fcfbf7',
                        overflow: 'hidden',
                        padding: 6,
                      }}
                      dangerouslySetInnerHTML={{ __html: uploadedFile.svgRaw }}
                    />
                  ) : !imgLoadError && uploadedFile.type.startsWith('image/') && uploadedFile.dataUrl ? (
                    <img
                      src={uploadedFile.dataUrl}
                      alt="Xem trước ảnh minh chứng"
                      onError={() => setImgLoadError(true)}
                      style={{
                        width: '100%',
                        maxHeight: 220,
                        minHeight: 160,
                        objectFit: 'contain',
                        background: '#fdfcf7',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        padding: '28px 16px',
                        textAlign: 'center',
                        background: '#fdfcf7',
                        color: 'var(--ink)',
                        width: '100%',
                      }}
                    >
                      <span style={{ fontSize: 36 }}>📄</span>
                      <div style={{ fontWeight: 'bold', fontSize: 13, marginTop: 4 }}>
                        {uploadedFile.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
                        Dung lượng: {formatFileSize(uploadedFile.size)} · Đã sẵn sàng quét
                      </div>
                    </div>
                  )}
                </DocumentScanOverlay>

                {/* Thanh điều khiển AI Quét & Đổi tệp */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 8,
                    background: '#fff',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--paper-line)',
                  }}
                >
                  <div style={{ fontSize: 11.5, color: 'var(--ink)', minWidth: 0, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                    Tệp: <strong>{uploadedFile.name}</strong> ({formatFileSize(uploadedFile.size)})
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      type="button"
                      className="ai-ocr-scan-btn"
                      onClick={handleTriggerAiScan}
                      disabled={isScanning}
                      title="AI nhận diện chữ viết và tự động điền các trường của đơn"
                    >
                      {isScanning
                        ? (isLiveMode ? '⏳ GEMINI VISION ĐANG ĐỌC ẢNH...' : '⏳ ĐANG QUÉT OCR...')
                        : (isLiveMode ? '📷 QUÉT BẰNG GEMINI VISION' : '📷 AI QUÉT & TỰ ĐỘNG ĐIỀN')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFile(null);
                        setImgLoadError(false);
                        setData((prev) => ({ ...prev, uploadedFile: null }));
                        setScanSummary(null);
                        setScanStatus('idle');
                        setAutoFilledFields([]);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      style={{
                        background: 'none',
                        border: '1px solid var(--stamp-red)',
                        color: 'var(--stamp-red)',
                        padding: '4px 8px',
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
                </div>
              </div>
            )}

            {fileError && (
              <div
                role="alert"
                style={{
                  color: 'var(--stamp-red)',
                  backgroundColor: '#fef2f2',
                  border: '1.5px solid #f87171',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px',
                  fontSize: 12,
                  marginTop: 8,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  lineHeight: 1.4,
                }}
              >
                <span style={{ fontSize: 16 }}>⚠️</span>
                <span>{fileError}</span>
              </div>
            )}
          </div>

          {/* Banner thông báo kết quả AI Scan */}
          {scanSummary && scanStatus === 'success' && (
            <div className="ai-ocr-banner ai-ocr-banner--success" role="status">
              <span style={{ fontSize: 16, color: 'var(--stamp-green)' }}>✔</span>
              <div>
                <strong style={{ color: 'var(--stamp-green)' }}>
                  {isLiveMode ? 'Trích xuất OCR bằng Gemini Vision thành công:' : 'Trích xuất OCR thành công:'}
                </strong>{' '}
                {scanSummary}.
                <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>
                  Các trường có nhãn <strong>[✓ AI điền]</strong> bên dưới đã được điền tự động. Bạn có thể kiểm tra và chỉnh sửa trước khi lưu.
                </div>
              </div>
            </div>
          )}

          {scanSummary && scanStatus === 'warning' && (
            <div className="ai-ocr-banner ai-ocr-banner--warning" role="alert">
              <span style={{ fontSize: 16, color: 'var(--stamp-red)' }}>⚠</span>
              <div>
                <strong style={{ color: 'var(--stamp-red)' }}>Không thể trích xuất thông tin minh chứng:</strong> {scanSummary}
                <div style={{ fontSize: 11, color: 'var(--ink)', marginTop: 2 }}>
                  Tệp tải lên không khớp với mẫu minh chứng yêu cầu. Dữ liệu bên dưới <strong>chưa được tự động điền</strong>. Bạn có thể chọn tệp khác hoặc tự nhập tay các trường thông tin bên dưới.
                </div>
              </div>
            </div>
          )}

          {/* KHỐI 2: CHI TIẾT THÔNG TIN MINH CHỨNG */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontWeight: 'bold', fontSize: 12.5, textTransform: 'uppercase', color: 'var(--ink)' }}>
              CHI TIẾT THÔNG TIN MINH CHỨNG:
            </span>
            {autoFilledFields.length > 0 && (
              <span style={{ fontSize: 11, color: 'var(--stamp-green)', fontWeight: 600 }}>
                ✔ Đã điền tự động {autoFilledFields.length} trường
              </span>
            )}
          </div>

          {/* 1. Form điền: Giấy xác nhận của bệnh viện */}
          {category === 'medical' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 14px' }}>
              <div>
                {renderLabel('Bệnh viện cấp giấy', 'm-hospital', 'hospital')}
                <input
                  id="m-hospital"
                  className={inputClass('hospital')}
                  required
                  value={med.hospital}
                  placeholder="Nhập tên bệnh viện (VD: Bệnh viện Đa khoa Đà Nẵng)"
                  onChange={(e) => updateMed({ hospital: e.target.value })}
                />
              </div>
              <div>
                {renderLabel('Mã bệnh án / Số lưu trữ', 'm-code', 'recordCode')}
                <input
                  id="m-code"
                  className={inputClass('recordCode')}
                  required
                  value={med.recordCode}
                  placeholder="Nhập số hồ sơ bệnh án"
                  onChange={(e) => updateMed({ recordCode: e.target.value })}
                />
              </div>

              <div>
                {renderLabel('Khoa điều trị', 'm-dept', 'department')}
                <input
                  id="m-dept"
                  className={inputClass('department')}
                  required
                  value={med.department}
                  placeholder="Nhập khoa điều trị"
                  onChange={(e) => updateMed({ department: e.target.value })}
                />
              </div>
              <div>
                {renderLabel('Họ tên bác sĩ chỉ định', 'm-doc', 'doctorName')}
                <input
                  id="m-doc"
                  className={inputClass('doctorName')}
                  required
                  value={med.doctorName}
                  placeholder="Nhập tên bác sĩ điều trị"
                  onChange={(e) => updateMed({ doctorName: e.target.value })}
                />
              </div>

              <div>
                {renderLabel('Ngày nhập viện', 'm-adm', 'admissionDate')}
                <input
                  id="m-adm"
                  type="date"
                  className={inputClass('admissionDate')}
                  required
                  value={toIsoDate(med.admissionDate)}
                  onChange={(e) => updateMed({ admissionDate: toVnDate(e.target.value) })}
                />
              </div>
              <div>
                {renderLabel('Ngày cấp giấy xác nhận', 'm-dis', 'dischargeDate')}
                <input
                  id="m-dis"
                  type="date"
                  className={inputClass('dischargeDate')}
                  required
                  value={toIsoDate(med.dischargeDate)}
                  onChange={(e) => updateMed({ dischargeDate: toVnDate(e.target.value) })}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                {renderLabel('Chẩn đoán bệnh & chỉ định điều trị', 'm-diag', 'diagnosis')}
                <textarea
                  id="m-diag"
                  className={`student-textarea${isAutoFilled('diagnosis') ? ' student-input--autofilled' : ''}`}
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
                  {isAutoFilled('isValidStamp') && (
                    <span className="ai-autofill-badge" style={{ marginLeft: 4 }}>
                      ✓ AI xác thực
                    </span>
                  )}
                </label>
              </div>
            </div>
          )}

          {/* 2. Form điền: Giấy đi nghĩa vụ quân sự */}
          {category === 'military' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 14px' }}>
              <div>
                {renderLabel('Cơ quan cấp lệnh (BCH Quân sự)', 'mil-unit', 'militaryUnit')}
                <input
                  id="mil-unit"
                  className={inputClass('militaryUnit')}
                  required
                  value={mil.militaryUnit}
                  placeholder="Nhập tên BCH Quân sự Quận/Huyện"
                  onChange={(e) => updateMil({ militaryUnit: e.target.value })}
                />
              </div>
              <div>
                {renderLabel('Số lệnh gọi nhập ngũ', 'mil-num', 'orderNumber')}
                <input
                  id="mil-num"
                  className={inputClass('orderNumber')}
                  required
                  value={mil.orderNumber}
                  placeholder="Nhập số hiệu lệnh (VD: .../LG-BCH)"
                  onChange={(e) => updateMil({ orderNumber: e.target.value })}
                />
              </div>

              <div>
                {renderLabel('Ngày ký lệnh', 'mil-sign', 'signDate')}
                <input
                  id="mil-sign"
                  type="date"
                  className={inputClass('signDate')}
                  required
                  value={toIsoDate(mil.signDate)}
                  onChange={(e) => updateMil({ signDate: toVnDate(e.target.value) })}
                />
              </div>
              <div>
                {renderLabel('Ngày tập trung nhập ngũ', 'mil-rep', 'reportDate')}
                <input
                  id="mil-rep"
                  type="date"
                  className={inputClass('reportDate')}
                  required
                  value={toIsoDate(mil.reportDate)}
                  onChange={(e) => updateMil({ reportDate: toVnDate(e.target.value) })}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                {renderLabel('Địa điểm giao nhận quân', 'mil-loc', 'location')}
                <input
                  id="mil-loc"
                  className={inputClass('location')}
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
                  {isAutoFilled('isValidStamp') && (
                    <span className="ai-autofill-badge" style={{ marginLeft: 4 }}>
                      ✓ AI xác thực
                    </span>
                  )}
                </label>
              </div>
            </div>
          )}

          {/* 3. Form điền: Giấy chứng minh hoàn cảnh gia đình */}
          {category === 'hardship' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 14px' }}>
              <div>
                {renderLabel('UBND Phường/Xã xác nhận', 'h-auth', 'authority')}
                <input
                  id="h-auth"
                  className={inputClass('authority')}
                  required
                  value={hard.authority}
                  placeholder="Nhập tên UBND Phường/Xã nơi cư trú"
                  onChange={(e) => updateHard({ authority: e.target.value })}
                />
              </div>
              <div>
                {renderLabel('Diện hoàn cảnh', 'h-cat', 'category')}
                <select
                  id="h-cat"
                  className={inputClass('category')}
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
                {renderLabel('Họ tên phụ huynh / Chủ hộ', 'h-guardian', 'guardianName')}
                <input
                  id="h-guardian"
                  className={inputClass('guardianName')}
                  required
                  value={hard.guardianName}
                  placeholder="Nhập họ tên cha/mẹ hoặc người giám hộ"
                  onChange={(e) => updateHard({ guardianName: e.target.value })}
                />
              </div>
              <div>
                {renderLabel('Ngày địa phương xác nhận', 'h-date', 'confirmDate')}
                <input
                  id="h-date"
                  type="date"
                  className={inputClass('confirmDate')}
                  required
                  value={toIsoDate(hard.confirmDate)}
                  onChange={(e) => updateHard({ confirmDate: toVnDate(e.target.value) })}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                {renderLabel('Trình bày chi tiết hoàn cảnh khó khăn', 'h-desc', 'description')}
                <textarea
                  id="h-desc"
                  className={`student-textarea${isAutoFilled('description') ? ' student-input--autofilled' : ''}`}
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
                  {isAutoFilled('isValidStamp') && (
                    <span className="ai-autofill-badge" style={{ marginLeft: 4 }}>
                      ✓ AI xác thực
                    </span>
                  )}
                </label>
              </div>
            </div>
          )}

          {/* 4. Form điền: Lý do cá nhân khác */}
          {category === 'personal' && (
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
                    {renderLabel('Nội dung trình bày lý do cá nhân', 'p-content', 'personalReasonContent')}
                    <textarea
                      id="p-content"
                      className={`student-textarea${isAutoFilled('personalReasonContent') ? ' student-input--autofilled' : ''}`}
                      rows={3}
                      required
                      value={pers.personalReasonContent}
                      placeholder="Trình bày cụ thể lý do cá nhân xin nghỉ học tạm thời và kế hoạch học tập lại..."
                      onChange={(e) => updatePers({ personalReasonContent: e.target.value })}
                    />
                  </div>
                  <div>
                    {renderLabel('Họ tên phụ huynh đồng ý', 'p-pname', 'parentName')}
                    <input
                      id="p-pname"
                      className={inputClass('parentName')}
                      required
                      value={pers.parentName}
                      placeholder="Nhập họ tên phụ huynh xác nhận"
                      onChange={(e) => updatePers({ parentName: e.target.value })}
                    />
                  </div>
                  <div>
                    {renderLabel('Số điện thoại phụ huynh', 'p-pphone', 'parentPhone')}
                    <input
                      id="p-pphone"
                      type="tel"
                      className={inputClass('parentPhone')}
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
                    {renderLabel('Tên đơn vị / Công ty thực tập', 'p-comp', 'companyName')}
                    <input
                      id="p-comp"
                      className={inputClass('companyName')}
                      required
                      value={pers.companyName}
                      placeholder="Nhập tên doanh nghiệp tiếp nhận"
                      onChange={(e) => updatePers({ companyName: e.target.value })}
                    />
                  </div>
                  <div>
                    {renderLabel('Vị trí & hình thức thực tập', 'p-role', 'internshipRole')}
                    <input
                      id="p-role"
                      className={inputClass('internshipRole')}
                      required
                      value={pers.internshipRole}
                      placeholder="VD: Thực tập sinh Toàn thời gian"
                      onChange={(e) => updatePers({ internshipRole: e.target.value })}
                    />
                  </div>
                  <div>
                    {renderLabel('Ngày bắt đầu thực tập', 'p-start', 'startDate')}
                    <input
                      id="p-start"
                      type="date"
                      className={inputClass('startDate')}
                      required
                      value={toIsoDate(pers.startDate)}
                      onChange={(e) => updatePers({ startDate: toVnDate(e.target.value) })}
                    />
                  </div>
                  <div>
                    {renderLabel('Ngày kết thúc thực tập', 'p-end', 'endDate')}
                    <input
                      id="p-end"
                      type="date"
                      className={inputClass('endDate')}
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
                      {isAutoFilled('isValidStamp') && (
                        <span className="ai-autofill-badge" style={{ marginLeft: 4 }}>
                          ✓ AI xác thực
                        </span>
                      )}
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

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
              💡 <strong>Lưu ý tiếp nhận:</strong> Cổng Một Cửa (AI Pre-check) sẽ kiểm tra con dấu mộc đỏ hợp lệ khi nộp đơn. Hồ sơ có con dấu hợp lệ mới được chuyển tiếp đến <strong>Cố vấn học tập (L2)</strong>; hồ sơ thiếu hoặc không có con dấu hợp lệ sẽ bị tự động trả về để bổ sung.
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
