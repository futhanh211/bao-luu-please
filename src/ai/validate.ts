import { DocScanResult, ReviewerBrief } from '../engine/types';
import {
  OcrScanResult,
  ExtractedOcrField,
  MedicalEvidenceDetails,
  MilitaryEvidenceDetails,
  HardshipEvidenceDetails,
  PersonalEvidenceDetails,
  StudentEvidenceOptionKey,
} from './ocrTypes';

type Raw = Record<string, unknown>;

function isRecord(value: unknown): value is Raw {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

const SEVERITIES = ['low', 'medium', 'high'] as const;

/** Bóc JSON khỏi câu trả lời (có thể bị bọc fence ```json). */
export function parseJsonObject(text: string): Raw | null {
  if (!text) return null;
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    const parsed: unknown = JSON.parse(cleaned.slice(start, end + 1));
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function validateDocScan(raw: Raw): DocScanResult | null {
  const evidenceType = asString(raw.evidenceType);
  const confidence = asNumber(raw.confidence);
  const typeMatchesReason = raw.typeMatchesReason;

  if (!evidenceType || confidence === null || confidence < 0 || confidence > 1) return null;
  if (typeof typeMatchesReason !== 'boolean') return null;

  const extracted: Record<string, string> = {};
  if (isRecord(raw.extracted)) {
    for (const [key, value] of Object.entries(raw.extracted)) {
      if (typeof value === 'string') extracted[key] = value;
    }
  }

  const anomalies: DocScanResult['anomalies'] = [];
  if (Array.isArray(raw.anomalies)) {
    for (const item of raw.anomalies) {
      if (!isRecord(item)) continue;
      const issue = asString(item.issue);
      const severity = item.severity;
      if (!issue) continue;
      if (typeof severity !== 'string') continue;
      if (!SEVERITIES.includes(severity as (typeof SEVERITIES)[number])) continue;
      anomalies.push({
        field: asString(item.field) ?? 'document',
        issue,
        severity: severity as (typeof SEVERITIES)[number],
      });
    }
  }

  return { evidenceType, typeMatchesReason, extracted, anomalies, confidence };
}

const DECISIONS: Record<'advisor' | 'ctsv', ReviewerBrief['suggestedDecision'][]> = {
  advisor: ['confirm', 'decline'],
  ctsv: ['valid', 'invalid'],
};

export function validateBrief(raw: Raw, role: 'advisor' | 'ctsv'): ReviewerBrief | null {
  const summary = asString(raw.summary);
  const rationale = asString(raw.rationale);
  const decision = raw.suggestedDecision;

  if (!summary || !rationale) return null;
  if (typeof decision !== 'string') return null;
  if (!DECISIONS[role].includes(decision as ReviewerBrief['suggestedDecision'])) return null;

  const points: string[] = [];
  if (Array.isArray(raw.points)) {
    for (const point of raw.points) {
      const text = asString(point);
      if (text && !points.includes(text)) points.push(text);
      if (points.length === 4) break;
    }
  }
  if (points.length === 0) return null;

  return {
    summary,
    points,
    suggestedDecision: decision as ReviewerBrief['suggestedDecision'],
    rationale,
  };
}

/** Văn bản AI-4: nhận `{ text }` hoặc chuỗi thô, cắt về 800 ký tự. */
export function validateDraft(raw: unknown): string | null {
  const candidate = typeof raw === 'string' ? raw : isRecord(raw) ? raw.text : null;
  const text = asString(candidate);
  if (!text) return null;
  return text.slice(0, 800);
}

export function validateOcrResult(
  raw: Raw,
  expectedType: StudentEvidenceOptionKey
): OcrScanResult | null {
  const docTypeCandidate = asString(raw.documentType);
  const isValidDoc = raw.isValidDocument !== false;

  // Nếu Gemini Vision phát hiện đây không phải văn bản hành chính hợp lệ (sơ đồ, drawio, infographic, ảnh rác...)
  if (!isValidDoc || docTypeCandidate === 'unknown') {
    return {
      documentType: expectedType,
      confidence: 0.1,
      summary:
        asString(raw.summary) ||
        'Tài liệu bị từ chối: Hình ảnh không phải văn bản hành chính hợp lệ có giá trị pháp lý.',
      extractedCount: 0,
      data: {
        [expectedType]: {
          isValidStamp: false,
        },
      },
      fields: [],
    };
  }

  const documentType: StudentEvidenceOptionKey =
    docTypeCandidate === 'medical' ||
    docTypeCandidate === 'military' ||
    docTypeCandidate === 'hardship' ||
    docTypeCandidate === 'personal'
      ? docTypeCandidate
      : expectedType;

  const confidence = asNumber(raw.confidence) ?? 0.85;
  const summary = asString(raw.summary) || 'Đã trích xuất thông tin từ tài liệu';

  const rawData = isRecord(raw.data) ? raw.data : {};
  const fields: ExtractedOcrField[] = [];
  const data: OcrScanResult['data'] = {};

  if (documentType === 'medical' && isRecord(rawData.medical)) {
    const med = rawData.medical;
    const medicalData: Partial<MedicalEvidenceDetails> = {};
    const fieldMapping: Record<keyof Omit<MedicalEvidenceDetails, 'isValidStamp'>, string> = {
      hospital: 'Bệnh viện',
      recordCode: 'Mã bệnh án',
      department: 'Khoa điều trị',
      doctorName: 'Bác sĩ điều trị',
      admissionDate: 'Ngày vào viện',
      dischargeDate: 'Ngày ra viện/cấp giấy',
      diagnosis: 'Chẩn đoán điều trị',
    };

    for (const [key, label] of Object.entries(fieldMapping)) {
      const val = asString(med[key]);
      if (val) {
        medicalData[key as keyof Omit<MedicalEvidenceDetails, 'isValidStamp'>] = val;
        fields.push({ key, label, value: val, confidence });
      }
    }
    const stampVal = med.isValidStamp === true;
    medicalData.isValidStamp = stampVal;
    fields.push({ key: 'isValidStamp', label: 'Dấu mộc đỏ', value: stampVal, confidence });
    data.medical = medicalData;
  } else if (documentType === 'military' && isRecord(rawData.military)) {
    const mil = rawData.military;
    const militaryData: Partial<MilitaryEvidenceDetails> = {};
    const fieldMapping: Record<keyof Omit<MilitaryEvidenceDetails, 'isValidStamp'>, string> = {
      militaryUnit: 'Cơ quan cấp lệnh',
      orderNumber: 'Số lệnh gọi',
      signDate: 'Ngày ký lệnh',
      reportDate: 'Ngày tập trung',
      location: 'Địa điểm giao nhận quân',
    };

    for (const [key, label] of Object.entries(fieldMapping)) {
      const val = asString(mil[key]);
      if (val) {
        militaryData[key as keyof Omit<MilitaryEvidenceDetails, 'isValidStamp'>] = val;
        fields.push({ key, label, value: val, confidence });
      }
    }
    const stampVal = mil.isValidStamp === true;
    militaryData.isValidStamp = stampVal;
    fields.push({ key: 'isValidStamp', label: 'Dấu mộc đỏ', value: stampVal, confidence });
    data.military = militaryData;
  } else if (documentType === 'hardship' && isRecord(rawData.hardship)) {
    const hard = rawData.hardship;
    const hardshipData: Partial<HardshipEvidenceDetails> = {};
    const fieldMapping: Record<keyof Omit<HardshipEvidenceDetails, 'isValidStamp'>, string> = {
      authority: 'Cơ quan xác nhận',
      category: 'Diện hoàn cảnh',
      guardianName: 'Họ tên chủ hộ',
      confirmDate: 'Ngày xác nhận',
      description: 'Nội dung hoàn cảnh',
    };

    for (const [key, label] of Object.entries(fieldMapping)) {
      const val = asString(hard[key]);
      if (val) {
        if (key === 'category') {
          const cat = val as HardshipEvidenceDetails['category'];
          hardshipData.category = cat;
        } else {
          hardshipData[key as 'authority' | 'guardianName' | 'confirmDate' | 'description'] = val;
        }
        fields.push({ key, label, value: val, confidence });
      }
    }
    const stampVal = hard.isValidStamp === true;
    hardshipData.isValidStamp = stampVal;
    fields.push({ key: 'isValidStamp', label: 'Dấu mộc đỏ', value: stampVal, confidence });
    data.hardship = hardshipData;
  } else if (documentType === 'personal' && isRecord(rawData.personal)) {
    const pers = rawData.personal;
    const personalData: Partial<PersonalEvidenceDetails> = {};
    const fieldMapping: Record<keyof Omit<PersonalEvidenceDetails, 'isValidStamp'>, string> = {
      subType: 'Loại hồ sơ cá nhân',
      personalReasonContent: 'Nội dung trình bày',
      parentName: 'Họ tên phụ huynh',
      parentPhone: 'Số điện thoại phụ huynh',
      companyName: 'Đơn vị thực tập',
      internshipRole: 'Vị trí thực tập',
      startDate: 'Ngày bắt đầu',
      endDate: 'Ngày kết thúc',
    };

    for (const [key, label] of Object.entries(fieldMapping)) {
      const val = asString(pers[key]);
      if (val) {
        if (key === 'subType') {
          personalData.subType = val as PersonalEvidenceDetails['subType'];
        } else {
          personalData[key as keyof Omit<PersonalEvidenceDetails, 'isValidStamp' | 'subType'>] = val;
        }
        fields.push({ key, label, value: val, confidence });
      }
    }
    const stampVal = pers.isValidStamp === true;
    personalData.isValidStamp = stampVal;
    fields.push({ key: 'isValidStamp', label: 'Dấu mộc / Chữ ký', value: stampVal, confidence });
    data.personal = personalData;
  }

  if (fields.length === 0) return null;

  return {
    documentType,
    confidence,
    summary,
    extractedCount: fields.length,
    data,
    fields,
  };
}
