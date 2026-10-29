/**
 * Tri thức cho Trợ lý AI sinh viên (AI-2) — bám theo docs/01-PROCESS-SPEC.md.
 * Chỉ chứa thông tin có trong spec; không thêm quy chế ngoài phạm vi.
 */

export const KB_FALLBACK =
  'Mình chưa có thông tin này, bạn liên hệ Phòng Công tác sinh viên nhé.';

export const KB_CONTACT = 'Phòng Công tác sinh viên — Trường ĐH Kinh tế, ĐH Đà Nẵng';

export type KnowledgeId =
  | 'greeting'
  | 'submit'
  | 'documents'
  | 'evidenceByReason'
  | 'duration'
  | 'progress'
  | 'rejection'
  | 'fees'
  | 'eligibility'
  | 'contact'
  | 'thanks';

export interface KnowledgeEntry {
  id: KnowledgeId;
  label: string;
  keywords: string[];
  answer: string;
}

export interface StudentChatContext {
  submitted?: boolean;
  mssv?: string;
  day?: number;
  waitingTask?: 'T4' | 'T5' | 'T9' | null;
  lastMessageFlow?: 'MF2' | 'MF3' | 'MF4' | null;
  missing?: string[];
  violations?: string[];
  endEventId?: string | null;
}

export const KNOWLEDGE_ENTRIES: KnowledgeEntry[] = [
  {
    id: 'submit',
    label: 'Cách nộp đơn',
    keywords: ['cach nop', 'nop don', 'gui don', 'thu tuc', 'lam sao', 'bat dau', 'nop truc tuyen'],
    answer:
      'Bạn điền tờ “Đơn xin nghỉ học tạm thời” ở giữa bàn, đính kèm minh chứng ở cột trái rồi bấm “NỘP TRỰC TUYẾN”. Hệ thống tiếp nhận 24/7 và kiểm tra hồ sơ ngay, không cần lên trường nộp giấy.',
  },
  {
    id: 'documents',
    label: 'Cần giấy tờ gì',
    keywords: ['giay to', 'minh chung', 'can gi', 'ho so gom', 'chuan bi', 'dinh kem', 'giay ra vien'],
    answer:
      'Hồ sơ gồm: đơn xin nghỉ học tạm thời (họ tên, MSSV, lớp, khoa, SĐT, email, lý do, số học kỳ nghỉ, học kỳ bắt đầu, cam kết) và minh chứng đúng với lý do — ví dụ giấy ra viện/bệnh án nếu ốm đau, giấy gọi nhập ngũ nếu nghĩa vụ quân sự, xác nhận hoàn cảnh nếu lý do gia đình.',
  },
  {
    id: 'evidenceByReason',
    label: 'Minh chứng theo từng lý do',
    keywords: ['theo ly do', 'giay to nao', 'can giay nao', 'minh chung nao', 'ly do nao'],
    answer:
      'Tùy lý do: ốm đau/tai nạn → giấy ra viện/bệnh án; nghĩa vụ quân sự → giấy gọi nhập ngũ; hoàn cảnh gia đình → xác nhận của UBND/địa phương; lý do cá nhân khác → giấy tờ chứng minh phù hợp. Giấy phải khớp lý do đã khai.',
  },
  {
    id: 'duration',
    label: 'Mất bao lâu',
    keywords: ['bao lau', 'sla', 'may ngay', 'thoi gian xu ly', 'khi nao', 'bao gio'],
    answer:
      'Các bước kiểm tra tự động chạy gần như tức thời. Khâu Cố vấn học tập có SLA 3 ngày làm việc; quá hạn hệ thống tự động nhắc việc. Thời gian còn lại phụ thuộc việc thẩm định minh chứng và ký số quyết định.',
  },
  {
    id: 'progress',
    label: 'Tiến độ hồ sơ của tôi',
    keywords: ['tien do', 'toi dau', 'trang thai ho so', 'xu ly den', 'duyet chua', 'ket qua cua toi'],
    answer: 'Bạn mở tab “Tiến độ” để xem dòng thời gian của hồ sơ.',
  },
  {
    id: 'rejection',
    label: 'Vì sao bị từ chối',
    keywords: ['tu choi', 'vi sao bi', 'ly do gi', 'khong duoc duyet', 'khong hop le', 'rot', 'bi tra'],
    answer:
      'Lý do chi tiết nằm trong thư phản hồi ở tab “Hộp thư”. Hệ thống chỉ nêu đúng nội dung còn thiếu hoặc điều kiện chưa đạt, không tự thêm quy định khác.',
  },
  {
    id: 'fees',
    label: 'Học phí và công nợ',
    keywords: ['hoc phi', 'cong no', 'no hoc phi', 'dien nuoc', 'thanh toan'],
    answer:
      'Điều kiện R3: công nợ học phí phải bằng 0. Nếu còn nợ, hồ sơ chưa đủ điều kiện bảo lưu; bạn thanh toán rồi nộp lại.',
  },
  {
    id: 'eligibility',
    label: 'Điều kiện bảo lưu',
    keywords: ['dieu kien', 'du dieu kien', 'co duoc bao luu', 'R1', 'R2', 'R3', 'R4'],
    answer:
      'Điều kiện gồm: R1 đã học xong học kỳ đầu và không đang bị kỷ luật; R2 không thuộc diện bị buộc thôi học; R3 công nợ học phí bằng 0; R4 hồ sơ có đơn và minh chứng đầy đủ, đúng lý do. Ngoài ra Cố vấn học tập phải xác nhận và Phòng Công tác sinh viên thẩm định minh chứng.',
  },
  {
    id: 'contact',
    label: 'Liên hệ ai',
    keywords: ['lien he', 'hoi ai', 'phong nao', 'so dien thoai', 'dia chi'],
    answer: `${KB_CONTACT}. Bạn có thể hỏi trực tiếp tại bàn Công tác sinh viên trong ca làm việc.`,
  },
  {
    id: 'greeting',
    label: 'Chào hỏi',
    keywords: ['chao', 'hello', 'xin chao', 'alo'],
    answer:
      'Xin chào! Mình là Trợ lý Cổng thông tin sinh viên. Bạn có thể hỏi về cách nộp đơn, giấy tờ cần chuẩn bị, thời gian xử lý hoặc tiến độ hồ sơ.',
  },
  {
    id: 'thanks',
    label: 'Cảm ơn',
    keywords: ['cam on', 'thank', 'tks', 'camon'],
    answer: 'Không có gì! Chúc bạn sớm hoàn tất thủ tục bảo lưu. Cần gì cứ hỏi mình nhé.',
  },
];

export const QUICK_QUESTIONS: { id: KnowledgeId; text: string }[] = [
  { id: 'submit', text: 'Cách nộp đơn?' },
  { id: 'documents', text: 'Cần giấy tờ gì?' },
  { id: 'duration', text: 'Mất bao lâu?' },
  { id: 'progress', text: 'Tiến độ hồ sơ của tôi?' },
  { id: 'eligibility', text: 'Điều kiện bảo lưu?' },
  { id: 'contact', text: 'Liên hệ ai?' },
];

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Khớp intent bằng từ khóa; câu hỏi cụ thể được ưu tiên trước câu chào hỏi. */
export function matchIntent(question: string): KnowledgeEntry | null {
  const text = normalizeText(question);
  if (!text) return null;

  const order: KnowledgeId[] = [
    'rejection',
    'progress',
    'evidenceByReason',
    'documents',
    'duration',
    'fees',
    'eligibility',
    'contact',
    'submit',
    'thanks',
    'greeting',
  ];

  for (const id of order) {
    const entry = KNOWLEDGE_ENTRIES.find((e) => e.id === id);
    if (!entry) continue;
    if (entry.keywords.some((keyword) => text.includes(keyword))) {
      return entry;
    }
  }
  return null;
}

function answerProgress(ctx: StudentChatContext): string {
  if (!ctx.submitted) {
    return 'Bạn chưa nộp đơn trong ca này. Điền đơn ở giữa bàn, đính kèm minh chứng (nếu có) rồi bấm “NỘP TRỰC TUYẾN” nhé.';
  }
  if (ctx.lastMessageFlow === 'MF4' || ctx.endEventId === 'E_END_OK') {
    return 'Hồ sơ đã có quyết định nghỉ học tạm thời. Bạn mở tab “Hộp thư” để xem quyết định đã ký số.';
  }
  if (ctx.lastMessageFlow === 'MF2') {
    return 'Hệ thống đã trả hồ sơ vì còn thiếu hoặc chưa hợp lệ. Bạn xem thư trong “Hộp thư”, bổ sung rồi nộp lại.';
  }
  if (ctx.lastMessageFlow === 'MF3' || ctx.endEventId === 'E_END_REJECTED') {
    return 'Hồ sơ chưa đủ điều kiện bảo lưu. Lý do cụ thể có trong thư ở tab “Hộp thư”.';
  }
  switch (ctx.waitingTask) {
    case 'T4':
      return 'Hồ sơ đã hợp lệ và đang chờ Cố vấn học tập xác nhận (SLA 3 ngày làm việc). Bạn theo dõi ở tab “Tiến độ”.';
    case 'T5':
      return 'Hồ sơ đang được Phòng Công tác sinh viên thẩm định minh chứng. Bạn theo dõi ở tab “Tiến độ”.';
    case 'T9':
      return 'Dự thảo quyết định đang chờ Ban Giám hiệu ký số. Bạn theo dõi ở tab “Tiến độ”.';
    default:
      return 'Hệ thống đang xử lý hồ sơ của bạn. Bạn xem chi tiết ở tab “Tiến độ”.';
  }
}

function answerRejection(ctx: StudentChatContext): string {
  if (ctx.lastMessageFlow === 'MF2' && ctx.missing && ctx.missing.length > 0) {
    return `Hồ sơ bị trả vì còn thiếu/chưa hợp lệ: ${ctx.missing.join('; ')}. Bạn bổ sung rồi nộp lại.`;
  }
  if (ctx.lastMessageFlow === 'MF3' && ctx.violations && ctx.violations.length > 0) {
    return `Hồ sơ chưa đủ điều kiện: ${ctx.violations.join('; ')}. Chi tiết có trong thư ở tab “Hộp thư”.`;
  }
  return 'Hiện chưa có thông báo từ chối nào cho hồ sơ này. Nếu vừa nhận thư, bạn mở tab “Hộp thư” để xem lý do chi tiết.';
}

/** Câu trả lời về công nợ: ưu tiên trích đúng vi phạm R3 của ca hiện tại. */
function answerFees(ctx: StudentChatContext): string {
  const debt = (ctx.violations ?? []).find((v) => v.toLowerCase().includes('học phí'));
  if (debt) {
    return `${debt}. Điều kiện R3 yêu cầu công nợ học phí bằng 0, nên hồ sơ chưa đủ điều kiện bảo lưu. Bạn thanh toán rồi nộp lại nhé.`;
  }
  return 'Điều kiện R3: công nợ học phí phải bằng 0. Hồ sơ của bạn hiện không ghi nhận công nợ; nếu vừa thanh toán, bạn nộp lại để hệ thống đối chiếu DS1.';
}

/** Trả lời AI-2 (mock, deterministic). Không bịa quy chế ngoài tri thức. */
export function answerStudentQuestion(question: string, ctx: StudentChatContext = {}): string {
  const entry = matchIntent(question);
  if (!entry) return KB_FALLBACK;
  if (entry.id === 'progress') return answerProgress(ctx);
  if (entry.id === 'rejection') return answerRejection(ctx);
  if (entry.id === 'fees') return answerFees(ctx);
  return entry.answer;
}
