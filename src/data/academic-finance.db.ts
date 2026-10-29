import { AcademicFinanceRecord, AcademicFinanceDB } from '../engine/types';

export const INITIAL_ACADEMIC_FINANCE: AcademicFinanceRecord[] = [
  {
    mssv: '3121102001', // S1: Happy path
    semestersCompleted: 3,
    gpaNote: 'GPA tích lũy: 3.25 / 4.0 - Học lực Giỏi',
    discipline: 'none',
    tuitionDebt: 0,
    forcedWithdrawal: false,
  },
  {
    mssv: '3121102002', // S2: Thu Hà
    semestersCompleted: 2,
    gpaNote: 'GPA tích lũy: 2.80 / 4.0 - Học lực Khá',
    discipline: 'none',
    tuitionDebt: 0,
    forcedWithdrawal: false,
  },
  {
    mssv: '3121102003', // S3: Nợ học phí
    semestersCompleted: 3,
    gpaNote: 'GPA tích lũy: 2.65 / 4.0 - Học lực Khá',
    discipline: 'none',
    tuitionDebt: 7500000, // Nợ 7.5 triệu VNĐ
    forcedWithdrawal: false,
  },
  {
    mssv: '3121102004', // S4: Cố vấn ngâm hồ sơ
    semestersCompleted: 4,
    gpaNote: 'GPA tích lũy: 3.10 / 4.0 - Học lực Khá',
    discipline: 'none',
    tuitionDebt: 0,
    forcedWithdrawal: false,
  },
  {
    mssv: '3121102005', // S5: Minh chứng đáng ngờ
    semestersCompleted: 3,
    gpaNote: 'GPA tích lũy: 2.90 / 4.0 - Học lực Khá',
    discipline: 'none',
    tuitionDebt: 0,
    forcedWithdrawal: false,
  },
  {
    mssv: '3121102006', // SV6
    semestersCompleted: 2,
    gpaNote: 'GPA tích lũy: 3.40 / 4.0 - Học lực Giỏi',
    discipline: 'none',
    tuitionDebt: 0,
    forcedWithdrawal: false,
  },
  {
    mssv: '3121102007', // SV7: Chưa đủ 1 học kỳ
    semestersCompleted: 0,
    gpaNote: 'Chưa hoàn thành học kỳ đầu tiên',
    discipline: 'none',
    tuitionDebt: 0,
    forcedWithdrawal: false,
  },
  {
    mssv: '3121102008', // SV8: Đang bị kỷ luật cảnh cáo
    semestersCompleted: 5,
    gpaNote: 'GPA tích lũy: 2.10 / 4.0',
    discipline: 'warning',
    tuitionDebt: 0,
    forcedWithdrawal: false,
  },
];

export class InMemoryAcademicFinanceDB implements AcademicFinanceDB {
  private data: Map<string, AcademicFinanceRecord>;

  constructor(initialList: AcademicFinanceRecord[] = INITIAL_ACADEMIC_FINANCE) {
    this.data = new Map();
    initialList.forEach((r) => {
      const mssv = r.mssv.trim();
      this.data.set(mssv, { ...r, mssv });
    });
  }

  public get(mssv: string): AcademicFinanceRecord | undefined {
    const record = this.data.get(mssv.trim());
    return record ? { ...record } : undefined;
  }

  public upsert(record: AcademicFinanceRecord): void {
    const mssv = record.mssv.trim();
    this.data.set(mssv, { ...record, mssv });
  }

  public reset(initialList: AcademicFinanceRecord[] = INITIAL_ACADEMIC_FINANCE): void {
    this.data.clear();
    initialList.forEach((r) => {
      const mssv = r.mssv.trim();
      this.data.set(mssv, { ...r, mssv });
    });
  }
}

export const academicFinanceDB = new InMemoryAcademicFinanceDB();
