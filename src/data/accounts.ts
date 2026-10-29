import { INITIAL_STUDENTS } from './students.db';
import { Role } from '../store/useApp';

export type UserType = 'student' | 'officer';

export interface StudentAccount {
  type: 'student';
  mssv: string;
  name: string;
  className: string;
  faculty: string;
  email: string;
  avatar: string;
}

export interface OfficerAccount {
  type: 'officer';
  username: string;
  name: string;
  title: string;
  department: string;
  targetRole: Role;
  avatar: string;
  allowedRoles: Role[];
}

export type UserAccount = StudentAccount | OfficerAccount;

/**
 * Danh sách tài khoản sinh viên mẫu dựa trên CSDL
 */
export const STUDENT_ACCOUNTS: StudentAccount[] = INITIAL_STUDENTS.map((s) => ({
  type: 'student',
  mssv: s.mssv,
  name: s.name,
  className: s.className,
  faculty: s.faculty,
  email: s.email,
  avatar: '🎓',
}));

/**
 * Danh sách tài khoản cán bộ / giáo viên duyệt đơn mẫu
 */
export const OFFICER_ACCOUNTS: OfficerAccount[] = [
  {
    type: 'officer',
    username: 'advisor_nam',
    name: 'TS. Lê Hoài Nam',
    title: 'Cố vấn học tập',
    department: 'Khoa Công nghệ thông tin kinh doanh',
    targetRole: 'advisor',
    avatar: '👨‍🏫',
    allowedRoles: ['advisor', 'system'],
  },
  {
    type: 'officer',
    username: 'ctsv_mai',
    name: 'ThS. Nguyễn Thị Mai',
    title: 'Chuyên viên thẩm tra hồ sơ',
    department: 'Phòng Công tác sinh viên',
    targetRole: 'ctsv',
    avatar: '👩‍💼',
    allowedRoles: ['ctsv', 'advisor', 'principal', 'system'],
  },
  {
    type: 'officer',
    username: 'bgh_khoi',
    name: 'PGS.TS. Trần Đình Khôi',
    title: 'Phó Hiệu trưởng',
    department: 'Ban Giám hiệu nhà trường',
    targetRole: 'principal',
    avatar: '🏛️',
    allowedRoles: ['principal', 'system'],
  },
];
