import { describe, expect, it } from 'vitest';
import {
  KNOWLEDGE_ENTRIES,
  KB_FALLBACK,
  QUICK_QUESTIONS,
  KnowledgeId,
  answerStudentQuestion,
  matchIntent,
} from './knowledge-base';

const SAMPLES: { question: string; expected: KnowledgeId }[] = [
  { question: 'Xin chào', expected: 'greeting' },
  { question: 'Cách nộp đơn?', expected: 'submit' },
  { question: 'Cần giấy tờ gì?', expected: 'documents' },
  { question: 'Minh chứng theo lý do ốm đau cần gì?', expected: 'evidenceByReason' },
  { question: 'Mất bao lâu?', expected: 'duration' },
  { question: 'Tiến độ hồ sơ của tôi?', expected: 'progress' },
  { question: 'Vì sao bị từ chối?', expected: 'rejection' },
  { question: 'Còn nợ học phí thì sao?', expected: 'fees' },
  { question: 'Điều kiện bảo lưu là gì?', expected: 'eligibility' },
  { question: 'Liên hệ ai?', expected: 'contact' },
  { question: 'Cảm ơn nhé', expected: 'thanks' },
];

describe('knowledge-base · 11 intent của AI-2', () => {
  it('mỗi intent có ít nhất một câu mẫu khớp đúng', () => {
    expect(SAMPLES).toHaveLength(11);
    for (const sample of SAMPLES) {
      expect(matchIntent(sample.question)?.id).toBe(sample.expected);
    }
  });

  it('câu không dấu vẫn khớp intent', () => {
    expect(matchIntent('tien do ho so')?.id).toBe('progress');
    expect(matchIntent('hoc phi')?.id).toBe('fees');
  });

  it('câu vô nghĩa trả về câu dự phòng', () => {
    expect(matchIntent('xyzabc')).toBeNull();
    expect(answerStudentQuestion('xyzabc')).toBe(KB_FALLBACK);
  });

  it('6 câu hỏi nhanh đều trỏ tới intent có thật', () => {
    expect(QUICK_QUESTIONS).toHaveLength(6);
    for (const quick of QUICK_QUESTIONS) {
      expect(KNOWLEDGE_ENTRIES.some((entry) => entry.id === quick.id)).toBe(true);
    }
  });
});

describe('knowledge-base · trả lời theo ngữ cảnh ca', () => {
  it('chưa nộp đơn thì nhắc nộp', () => {
    const answer = answerStudentQuestion('Tiến độ hồ sơ của tôi?', { submitted: false });
    expect(answer).toContain('chưa nộp');
    expect(answer).toContain('NỘP TRỰC TUYẾN');
  });

  it('đang chờ T4 thì nêu Cố vấn và SLA', () => {
    const answer = answerStudentQuestion('Tiến độ hồ sơ của tôi?', {
      submitted: true,
      waitingTask: 'T4',
    });
    expect(answer).toContain('Cố vấn');
    expect(answer).toContain('SLA');
  });

  it('MF2 thì liệt kê nội dung còn thiếu', () => {
    const answer = answerStudentQuestion('Vì sao bị từ chối?', {
      lastMessageFlow: 'MF2',
      missing: ['Số điện thoại', 'Minh chứng y tế'],
    });
    expect(answer).toContain('Số điện thoại');
    expect(answer).toContain('Minh chứng y tế');
  });

  it('MF3 thì liệt kê điều kiện chưa đạt', () => {
    const answer = answerStudentQuestion('Vì sao bị từ chối?', {
      lastMessageFlow: 'MF3',
      violations: ['Công nợ học phí: 7.500.000 VNĐ'],
    });
    expect(answer).toContain('7.500.000');
  });

  it('câu hỏi học phí trích đúng công nợ của ca', () => {
    const answer = answerStudentQuestion('Còn nợ học phí thì sao?', {
      violations: ['Công nợ học phí: 7.500.000 VNĐ'],
    });
    expect(answer).toContain('7.500.000');
    expect(answer).toContain('R3');
  });
});
