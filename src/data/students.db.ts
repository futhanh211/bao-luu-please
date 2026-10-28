import { StudentRecord, StudentsDB } from '../engine/types';

export const INITIAL_STUDENTS: StudentRecord[] = [
  {
    mssv: '3121102001',
    name: 'Nguyễn Minh Khoa',
    className: '47K12.1',
    faculty: 'Khoa Công nghệ thông tin kinh doanh',
    phone: '0905123456',
    email: 'khoa.nm@due.edu.vn',
    status: 'Đang học',
  },
  {
    mssv: '3121102002',
    name: 'Trần Thu Hà',
    className: '47K01.2',
    faculty: 'Khoa Quản trị kinh doanh',
    phone: '0905234567',
    email: 'ha.tt@due.edu.vn',
    status: 'Đang học',
  },
  {
    mssv: '3121102003',
    name: 'Lê Quốc Bảo',
    className: '47K08.1',
    faculty: 'Khoa Tài chính - Ngân hàng',
    phone: '0905345678',
    email: 'bao.lq@due.edu.vn',
    status: 'Đang học',
  },
  {
    mssv: '3121102004',
    name: 'Phạm Ngọc Anh',
    className: '47K02.1',
    faculty: 'Khoa Kế toán',
    phone: '0905456789',
    email: 'anh.pn@due.edu.vn',
    status: 'Đang học',
  },
  {
    mssv: '3121102005',
    name: 'Hoàng Đức Thịnh',
    className: '47K15.2',
    faculty: 'Khoa Thương mại điện tử',
    phone: '0905567890',
    email: 'thinh.hd@due.edu.vn',
    status: 'Đang học',
  },
  {
    mssv: '3121102006',
    name: 'Đỗ Mai Lan',
    className: '47K03.1',
    faculty: 'Khoa Marketing',
    phone: '0905678901',
    email: 'lan.dm@due.edu.vn',
    status: 'Đang học',
  },
  {
    mssv: '3121102007',
    name: 'Vũ Hải Đăng',
    className: '48K12.2',
    faculty: 'Khoa Công nghệ thông tin kinh doanh',
    phone: '0905789012',
    email: 'dang.vh@due.edu.vn',
    status: 'Đang học',
  },
  {
    mssv: '3121102008',
    name: 'Phan Thanh Tùng',
    className: '46K21.1',
    faculty: 'Khoa Kinh tế',
    phone: '0905890123',
    email: 'tung.pt@due.edu.vn',
    status: 'Đang học',
  },
];

export class InMemoryStudentsDB implements StudentsDB {
  private data: Map<string, StudentRecord>;

  constructor(initialList: StudentRecord[] = INITIAL_STUDENTS) {
    this.data = new Map();
    initialList.forEach((s) => this.data.set(s.mssv, { ...s }));
  }

  public get(mssv: string): StudentRecord | undefined {
    const record = this.data.get(mssv);
    return record ? { ...record } : undefined;
  }

  public updateStudentStatus(mssv: string, status: 'Đang học' | 'Bảo lưu'): void {
    const record = this.data.get(mssv);
    if (record) {
      record.status = status;
    }
  }

  public reset(initialList: StudentRecord[] = INITIAL_STUDENTS): void {
    this.data.clear();
    initialList.forEach((s) => this.data.set(s.mssv, { ...s }));
  }
}

export const studentsDB = new InMemoryStudentsDB();
