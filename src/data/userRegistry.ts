import { Role } from '../store/useApp';
import { studentsDB } from './students.db';
import { academicFinanceDB } from './academic-finance.db';

export interface RegisteredStudent {
  type: 'student';
  mssv: string;
  name: string;
  className: string;
  faculty: string;
  email: string;
  phone?: string;
  password?: string;
  avatar: string;
  createdAt: string;
}

export interface RegisteredOfficer {
  type: 'officer';
  username: string;
  name: string;
  title: string;
  department: string;
  targetRole: Role;
  allowedRoles: Role[];
  avatar: string;
  password?: string;
  createdAt: string;
}

export type RegisteredAccount = RegisteredStudent | RegisteredOfficer;

const REGISTERED_ACCOUNTS_KEY = 'bao_luu_registered_accounts_v1';

// Bộ nhớ đệm fallback khi chạy môi trường kiểm thử Node.js hoặc khi localStorage bị đầy quota
export const memoryFallback: Record<string, string> = {};

export function getStorageItem(key: string): string | null {
  if (memoryFallback[key] !== undefined) {
    return memoryFallback[key];
  }
  if (typeof localStorage !== 'undefined') {
    try {
      const val = localStorage.getItem(key);
      if (val !== null) {
        memoryFallback[key] = val;
        return val;
      }
    } catch {
      // Fallback
    }
  }
  return null;
}

export function setStorageItem(key: string, value: string): void {
  memoryFallback[key] = value;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      console.warn(
        `[Storage] localStorage.setItem cho "${key}" không thành công (có thể do quota), lưu vào bộ nhớ RAM fallback:`,
        err
      );
    }
  }
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(new CustomEvent('app:storage_change', { detail: { key } }));
    } catch {
      // Ignore
    }
  }
}

export function getRegisteredAccounts(): RegisteredAccount[] {
  try {
    const raw = getStorageItem(REGISTERED_ACCOUNTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RegisteredAccount[];
  } catch (err) {
    console.error('Lỗi đọc tài khoản đã đăng ký từ localStorage:', err);
    return [];
  }
}

export function saveRegisteredAccounts(accounts: RegisteredAccount[]): void {
  try {
    setStorageItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('Lỗi lưu tài khoản vào localStorage:', err);
  }
}

export function getRegisteredStudents(): RegisteredStudent[] {
  return getRegisteredAccounts().filter((acc): acc is RegisteredStudent => acc.type === 'student');
}

export function getRegisteredOfficers(): RegisteredOfficer[] {
  return getRegisteredAccounts().filter((acc): acc is RegisteredOfficer => acc.type === 'officer');
}

export function findRegisteredStudent(mssv: string): RegisteredStudent | undefined {
  const trimmed = mssv.trim();
  return getRegisteredStudents().find((s) => s.mssv === trimmed);
}

export function findRegisteredOfficer(username: string): RegisteredOfficer | undefined {
  const trimmed = username.trim().toLowerCase();
  return getRegisteredOfficers().find((o) => o.username.toLowerCase() === trimmed);
}

/**
 * Đồng bộ sinh viên đã đăng ký vào CSDL học vụ để hệ thống BPMN (T2) tra cứu hợp lệ
 */
export function syncStudentToDatabases(student: RegisteredStudent): void {
  // Đồng bộ vào DB sinh viên
  studentsDB.upsert({
    mssv: student.mssv,
    name: student.name,
    className: student.className,
    faculty: student.faculty,
    phone: student.phone || '0905123456',
    email: student.email,
    status: 'Đang học',
  });

  // Đồng bộ vào DB học vụ & tài chính (đủ điều kiện chuẩn: >= 1 học kỳ, không nợ học phí, không kỷ luật)
  if (!academicFinanceDB.get(student.mssv)) {
    academicFinanceDB.upsert({
      mssv: student.mssv,
      semestersCompleted: 3,
      gpaNote: 'GPA tích lũy: 3.25 / 4.0 - Đủ điều kiện học vụ',
      discipline: 'none',
      tuitionDebt: 0,
      forcedWithdrawal: false,
    });
  }
}

export function syncAllRegisteredUsersToDatabases(): void {
  const students = getRegisteredStudents();
  students.forEach((s) => {
    syncStudentToDatabases(s);
  });
}

/**
 * Đăng ký tài khoản Sinh viên mới
 */
export function registerStudentAccount(data: {
  mssv: string;
  name: string;
  className: string;
  faculty: string;
  email?: string;
  phone?: string;
  password?: string;
}): { success: boolean; message: string; account?: RegisteredStudent } {
  const mssv = data.mssv.trim();
  const name = data.name.trim();
  const className = data.className.trim() || '48K12.1';
  const faculty = data.faculty.trim() || 'Khoa Công nghệ thông tin kinh doanh';
  const email = data.email?.trim() || `${mssv}@due.udn.vn`;
  const phone = data.phone?.trim() || '0905123456';
  const password = data.password?.trim() || '';

  if (!mssv) {
    return { success: false, message: 'Vui lòng nhập Mã số sinh viên (MSSV).' };
  }
  if (!name) {
    return { success: false, message: 'Vui lòng nhập Họ và tên sinh viên.' };
  }

  // Kiểm tra trùng lặp trong danh sách đã đăng ký
  const existingRegistered = findRegisteredStudent(mssv);
  if (existingRegistered) {
    return {
      success: false,
      message: `Mã số sinh viên ${mssv} đã được đăng ký trước đó. Bạn có thể đăng nhập ngay bằng mã này!`,
    };
  }

  const newStudent: RegisteredStudent = {
    type: 'student',
    mssv,
    name,
    className,
    faculty,
    email,
    phone,
    password,
    avatar: '🎓',
    createdAt: new Date().toISOString(),
  };

  const currentAccounts = getRegisteredAccounts();
  const updated = [newStudent, ...currentAccounts];
  saveRegisteredAccounts(updated);

  // Đồng bộ CSDL học vụ tức thì
  syncStudentToDatabases(newStudent);

  return {
    success: true,
    message: `Đăng ký thành công tài khoản sinh viên ${name} (${mssv})!`,
    account: newStudent,
  };
}

/**
 * Đăng ký tài khoản Cán bộ / Giảng viên duyệt đơn mới
 */
export function registerOfficerAccount(data: {
  username: string;
  name: string;
  title?: string;
  department?: string;
  targetRole: Role;
  password?: string;
}): { success: boolean; message: string; account?: RegisteredOfficer } {
  const username = data.username.trim().toLowerCase();
  const name = data.name.trim();
  const targetRole = data.targetRole;
  const password = data.password?.trim() || '';

  if (!username) {
    return { success: false, message: 'Vui lòng nhập Tên đăng nhập cán bộ.' };
  }
  if (!name) {
    return { success: false, message: 'Vui lòng nhập Họ và tên cán bộ.' };
  }

  const existingOfficer = findRegisteredOfficer(username);
  if (existingOfficer) {
    return {
      success: false,
      message: `Tên đăng nhập "${username}" đã tồn tại. Vui lòng chọn tên đăng nhập khác!`,
    };
  }

  const defaultTitles: Record<Role, { title: string; department: string; avatar: string }> = {
    advisor: {
      title: 'Cố vấn học tập',
      department: 'Khoa Công nghệ thông tin kinh doanh',
      avatar: '👨‍🏫',
    },
    ctsv: {
      title: 'Chuyên viên thẩm tra hồ sơ',
      department: 'Phòng Công tác sinh viên',
      avatar: '👩‍💼',
    },
    principal: {
      title: 'Phó Hiệu trưởng',
      department: 'Ban Giám hiệu nhà trường',
      avatar: '🏛️',
    },
    student: {
      title: 'Sinh viên',
      department: 'Sinh viên',
      avatar: '🎓',
    },
    system: {
      title: 'Quản trị hệ thống',
      department: 'Hệ thống Một cửa số',
      avatar: '⚙️',
    },
  };

  const title = data.title?.trim() || defaultTitles[targetRole].title;
  const department = data.department?.trim() || defaultTitles[targetRole].department;
  const avatar = defaultTitles[targetRole].avatar;

  const allowedRoles: Role[] =
    targetRole === 'ctsv'
      ? ['ctsv', 'advisor', 'principal', 'system']
      : [targetRole, 'system'];

  const newOfficer: RegisteredOfficer = {
    type: 'officer',
    username,
    name,
    title,
    department,
    targetRole,
    allowedRoles,
    avatar,
    password,
    createdAt: new Date().toISOString(),
  };

  const currentAccounts = getRegisteredAccounts();
  const updated = [newOfficer, ...currentAccounts];
  saveRegisteredAccounts(updated);

  return {
    success: true,
    message: `Đăng ký thành công tài khoản cán bộ ${name} (${username})!`,
    account: newOfficer,
  };
}

// Khởi chạy đồng bộ ngay khi load module
if (typeof window !== 'undefined') {
  try {
    syncAllRegisteredUsersToDatabases();
  } catch (err) {
    console.warn('Lỗi đồng bộ CSDL ban đầu:', err);
  }
}

/**
 * Đặt lại danh sách tài khoản đã đăng ký về rỗng (hoặc mặc định)
 */
export function resetUsersToDefault(): void {
  saveRegisteredAccounts([]);
  syncAllRegisteredUsersToDatabases();
}

/**
 * Xuất danh sách tài khoản đã đăng ký ra JSON
 */
export function exportAllUsersJson(): string {
  return JSON.stringify(getRegisteredAccounts(), null, 2);
}

/**
 * Nhập danh sách tài khoản từ JSON
 */
export function importUsersJson(jsonStr: string): { success: boolean; count: number; message: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) {
      return { success: false, count: 0, message: 'Dữ liệu JSON không phải mảng tài khoản hợp lệ.' };
    }
    saveRegisteredAccounts(parsed as RegisteredAccount[]);
    syncAllRegisteredUsersToDatabases();
    return { success: true, count: parsed.length, message: `Đã nhập ${parsed.length} tài khoản thành công.` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, count: 0, message: `Lỗi đọc JSON: ${msg}` };
  }
}
