import { DecisionDoc, RuleResultState, ValidityState } from '../engine/types';

/**
 * Sinh thư trả về cho sinh viên bằng mẫu deterministic (M3).
 * Phần AI soạn văn (AI-4) sẽ thay dần ở M6; ở đây chỉ dùng dữ kiện
 * có thật trong payload của message.sent, không bịa quy chế.
 */

export interface LetterSection {
  heading: string;
  lines: string[];
}

export interface LetterDoc {
  id: string;
  flowId: string;
  title: string;
  recipientLine: string;
  intro: string;
  sections: LetterSection[];
  footer: string;
  attachments: string[];
  day: number;
  signed: boolean;
  signerName?: string;
  /** Nội dung do AI-4 soạn (MF2/MF3) — UI hiển thị nhãn tương ứng. */
  aiGenerated: boolean;
}

interface PayloadShape {
  id?: string;
  title?: string;
  content?: string;
  day?: number;
  attachments?: string[];
  recipient?: string;
  validity?: ValidityState;
  ruleResult?: RuleResultState;
  advisorStatus?: string;
  ctsvStatus?: string;
  decisionDoc?: DecisionDoc;
  aiGenerated?: boolean;
}

const DEFAULT_TITLES: Record<string, string> = {
  MF2: 'Hồ sơ chưa hợp lệ',
  MF3: 'Không đủ điều kiện bảo lưu',
  MF4: 'Quyết định nghỉ học tạm thời',
};

const ADVISOR_LABEL: Record<string, string> = {
  pending: 'Cố vấn học tập chưa xác nhận',
  declined: 'Cố vấn học tập không xác nhận',
};

const CTSV_LABEL: Record<string, string> = {
  pending: 'Phòng Công tác sinh viên chưa thẩm định',
  invalid: 'Phòng Công tác sinh viên kết luận minh chứng không hợp lệ',
};

function asPayload(payload: unknown): PayloadShape {
  if (!payload || typeof payload !== 'object') return {};
  return payload as PayloadShape;
}

export function composeLetter(flowId: string, payload: unknown): LetterDoc {
  const data = asPayload(payload);
  const doc = data.decisionDoc;

  const base: LetterDoc = {
    id: data.id || `${flowId}-${data.day ?? 0}`,
    flowId,
    title: data.title || DEFAULT_TITLES[flowId] || 'Thông báo từ Nhà trường',
    recipientLine: 'Kính gửi: Sinh viên',
    intro: data.content || '',
    sections: [],
    footer: 'Trân trọng,\nPhòng Công tác sinh viên — Trường ĐH Kinh tế, ĐH Đà Nẵng',
    attachments: data.attachments ? [...data.attachments] : [],
    day: data.day ?? 0,
    signed: false,
    aiGenerated: data.aiGenerated === true,
  };

  if (flowId === 'MF2') {
    const missing = data.validity?.missing ?? [];
    const missingLines = missing.map((m) => `• ${m}`);
    if (data.validity && data.validity.evidenceOk === false) {
      missingLines.push('• Chưa đính kèm minh chứng hợp lệ cho lý do nghỉ học đã khai');
    }
    base.title = DEFAULT_TITLES.MF2;
    base.intro =
      data.content ||
      'Hồ sơ xin nghỉ học tạm thời của bạn chưa đáp ứng yêu cầu tiếp nhận. Vui lòng bổ sung và nộp lại.';
    base.sections = [
      {
        heading: 'Nội dung còn thiếu / chưa hợp lệ',
        lines:
          missingLines.length > 0
            ? missingLines
            : ['• Chưa xác định được nội dung cần bổ sung'],
      },
      {
        heading: 'Hướng dẫn nộp lại',
        lines: [
          '1. Bổ sung đầy đủ giấy tờ nêu trên vào mục “Túi minh chứng”.',
          '2. Kiểm tra lại họ tên, MSSV, lý do nghỉ và số học kỳ xin nghỉ.',
          '3. Bấm “NỘP TRỰC TUYẾN” để gửi lại hồ sơ — hệ thống kiểm tra tức thời.',
        ],
      },
    ];
    base.footer = 'Hồ sơ được trả tự động bởi Hệ thống điều phối. Bạn không cần lên trường.';
    return base;
  }

  if (flowId === 'MF3') {
    const violations = data.ruleResult?.violations ?? [];
    const conditionLines = violations.map((v) => `• ${v}`);
    if (data.advisorStatus && data.advisorStatus !== 'confirmed') {
      conditionLines.push(`• ${ADVISOR_LABEL[data.advisorStatus] || 'Cố vấn học tập chưa xác nhận'}`);
    }
    if (data.ctsvStatus && data.ctsvStatus !== 'valid') {
      conditionLines.push(`• ${CTSV_LABEL[data.ctsvStatus] || 'Minh chứng chưa được thẩm định hợp lệ'}`);
    }

    base.title = DEFAULT_TITLES.MF3;
    base.intro =
      data.content ||
      'Sau khi đối chiếu quy chế và ý kiến thẩm định, hồ sơ của bạn chưa đủ điều kiện bảo lưu kết quả học tập.';
    base.sections = [
      {
        heading: 'Điều kiện chưa đạt',
        lines:
          conditionLines.length > 0
            ? conditionLines
            : ['• Hồ sơ chưa hội đủ điều kiện theo kết quả xét tổng thể'],
      },
      {
        heading: 'Hướng xử lý',
        lines: [
          'Bạn xử lý nội dung nêu trên (nếu thuộc phần mình có thể giải quyết) rồi nộp đơn mới.',
          'Cần giải thích thêm, vui lòng liên hệ Phòng Công tác sinh viên.',
        ],
      },
    ];
    base.footer = 'Quyết định xét điều kiện do bộ quy tắc và người thẩm định đưa ra; AI chỉ hỗ trợ soạn lời nhắn.';
    return base;
  }

  if (flowId === 'MF4') {
    base.title = DEFAULT_TITLES.MF4;
    base.intro =
      data.content ||
      'Nhà trường thông báo quyết định cho phép bạn nghỉ học tạm thời và bảo lưu kết quả học tập.';
    base.sections = [
      {
        heading: 'Thông tin sinh viên',
        lines: [
          `Họ và tên: ${doc?.studentName || '—'}`,
          `MSSV: ${doc?.mssv || '—'}`,
          `Khoa: ${doc?.faculty || '—'}`,
        ],
      },
      {
        heading: 'Thời hạn bảo lưu',
        lines: [
          `Số học kỳ: ${doc?.durationSemesters ?? '—'}`,
          `Bắt đầu: ${doc?.startSemester || '—'}`,
          `Số quyết định: ${doc?.number || '—'}`,
        ],
      },
      {
        heading: 'Căn cứ ban hành',
        lines: [doc?.basisText || 'Căn cứ Quy chế đào tạo hiện hành của Nhà trường.'],
      },
    ];
    base.signed = Boolean(doc?.signed);
    base.signerName = doc?.signerName;
    base.attachments = base.attachments.length > 0 ? base.attachments : doc?.number ? [doc.number] : [];
    base.footer = 'Quyết định có hiệu lực kể từ ngày ký số. Bản điện tử có giá trị như bản giấy.';
    return base;
  }

  base.sections = [
    {
      heading: 'Nội dung',
      lines: [data.content || 'Nhà trường gửi thông báo liên quan tới hồ sơ của bạn.'],
    },
  ];
  return base;
}
