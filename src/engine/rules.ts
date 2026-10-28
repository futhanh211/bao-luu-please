import { AcademicFinanceRecord } from './types';

export interface RuleEvaluationItem {
  id: 'R1' | 'R2' | 'R3' | 'R4';
  label: string;
  passed: boolean;
  detail: string;
}

export interface RuleEvaluationResult {
  rules: RuleEvaluationItem[];
  pass: boolean;
  violations: string[];
}

export function evaluateRules(record?: AcademicFinanceRecord): RuleEvaluationResult {
  if (!record) {
    return {
      rules: [
        { id: 'R1', label: 'Đã học tối thiểu 1 học kỳ', passed: false, detail: 'Không tìm thấy dữ liệu học tập' },
        { id: 'R2', label: 'Không trong thời gian bị kỷ luật', passed: false, detail: 'Không tìm thấy dữ liệu kỷ luật' },
        { id: 'R3', label: 'Công nợ học phí = 0', passed: false, detail: 'Không tìm thấy dữ liệu tài chính' },
        { id: 'R4', label: 'Không thuộc diện buộc thôi học', passed: false, detail: 'Không tìm thấy dữ liệu đào tạo' },
      ],
      pass: false,
      violations: ['Không tìm thấy thông tin đào tạo và tài chính trong CSDL DS1'],
    };
  }

  const r1: RuleEvaluationItem = {
    id: 'R1',
    label: 'Đã học tối thiểu 1 học kỳ',
    passed: record.semestersCompleted >= 1,
    detail: `Số học kỳ đã hoàn thành: ${record.semestersCompleted} (yêu cầu >= 1)`,
  };

  const r2: RuleEvaluationItem = {
    id: 'R2',
    label: 'Không trong thời gian bị kỷ luật',
    passed: record.discipline === 'none',
    detail:
      record.discipline === 'none'
        ? 'Tình trạng kỷ luật: Bình thường'
        : `Đang bị kỷ luật: ${record.discipline === 'warning' ? 'Cảnh cáo' : 'Đình chỉ'}`,
  };

  const r3: RuleEvaluationItem = {
    id: 'R3',
    label: 'Công nợ học phí = 0',
    passed: record.tuitionDebt === 0,
    detail:
      record.tuitionDebt === 0
        ? 'Đã hoàn thành toàn bộ học phí'
        : `Còn nợ học phí: ${record.tuitionDebt.toLocaleString('vi-VN')} VNĐ`,
  };

  const r4: RuleEvaluationItem = {
    id: 'R4',
    label: 'Không thuộc diện buộc thôi học theo kết quả học tập',
    passed: !record.forcedWithdrawal,
    detail: record.forcedWithdrawal
      ? 'Cảnh báo: Sinh viên thuộc diện bị buộc thôi học'
      : 'Không thuộc diện buộc thôi học',
  };

  const rules = [r1, r2, r3, r4];
  const violations = rules.filter((r) => !r.passed).map((r) => `${r.label} (${r.detail})`);
  const pass = rules.every((r) => r.passed);

  return {
    rules,
    pass,
    violations,
  };
}
