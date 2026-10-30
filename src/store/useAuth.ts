import { create } from 'zustand';
import {
  UserAccount,
  StudentAccount,
  OfficerAccount,
  STUDENT_ACCOUNTS,
  OFFICER_ACCOUNTS,
} from '../data/accounts';
import {
  findRegisteredStudent,
  findRegisteredOfficer,
  syncStudentToDatabases,
  syncAllRegisteredUsersToDatabases,
} from '../data/userRegistry';
import { Role, useAppStore } from './useApp';

interface AuthState {
  currentUser: UserAccount | null;
  isAuthenticated: boolean;
  loginAsStudent: (mssv: string, customInfo?: Partial<StudentAccount>) => boolean;
  loginAsOfficer: (username: string) => boolean;
  verifyStudentLogin: (
    mssv: string,
    password?: string
  ) => { success: boolean; message: string; user?: StudentAccount };
  verifyOfficerLogin: (
    username: string,
    password?: string
  ) => { success: boolean; message: string; user?: OfficerAccount };
  logout: () => void;
  canAccessRole: (role: Role) => boolean;
}

const STORAGE_KEY = 'bao_luu_auth_session';

function loadInitialUser(): UserAccount | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserAccount;
  } catch {
    return null;
  }
}

function saveUser(user: UserAccount | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

const initialUser = loadInitialUser();
if (typeof window !== 'undefined') {
  syncAllRegisteredUsersToDatabases();
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: initialUser,
  isAuthenticated: initialUser !== null,

  verifyStudentLogin: (mssv: string, password?: string) => {
    const trimmed = mssv.trim();
    if (!trimmed) {
      return { success: false, message: 'Vui lòng nhập Mã số sinh viên (MSSV).' };
    }

    // Kiểm tra nếu người dùng nhầm lẫn nhập tài khoản Cán bộ / Giảng viên vào Cổng Sinh viên
    const isOfficer =
      findRegisteredOfficer(trimmed) ||
      OFFICER_ACCOUNTS.find((o) => o.username.toLowerCase() === trimmed.toLowerCase());
    if (isOfficer) {
      return {
        success: false,
        message: 'Đây là tài khoản Cán bộ / Giảng viên. Vui lòng chuyển sang tab "CỔNG CÁN BỘ / GV" để đăng nhập!',
      };
    }

    // 1. Kiểm tra trong danh sách sinh viên đã đăng ký
    const regStudent = findRegisteredStudent(trimmed);
    if (regStudent) {
      if (regStudent.password) {
        if (!password || password.trim() === '') {
          return { success: false, message: 'Vui lòng nhập mật khẩu tài khoản sinh viên!' };
        }
        if (password.trim() !== regStudent.password) {
          return { success: false, message: 'Mật khẩu không chính xác. Vui lòng thử lại!' };
        }
      }

      const studentUser: StudentAccount = {
        type: 'student',
        mssv: regStudent.mssv,
        name: regStudent.name,
        className: regStudent.className,
        faculty: regStudent.faculty,
        email: regStudent.email,
        avatar: regStudent.avatar || '🎓',
      };

      saveUser(studentUser);
      syncStudentToDatabases(regStudent);
      set({ currentUser: studentUser, isAuthenticated: true });
      useAppStore.getState().setSessionMode('portal');
      useAppStore.getState().setRole('student');
      return { success: true, message: 'Đăng nhập thành công!', user: studentUser };
    }

    // 2. Kiểm tra trong danh sách CSDL mẫu có sẵn
    const existing = STUDENT_ACCOUNTS.find((s) => s.mssv === trimmed);
    if (existing) {
      saveUser(existing);
      set({ currentUser: existing, isAuthenticated: true });
      useAppStore.getState().setSessionMode('portal');
      useAppStore.getState().setRole('student');
      return { success: true, message: 'Đăng nhập thành công!', user: existing };
    }

    // Nếu không tìm thấy
    return {
      success: false,
      message: `Mã số sinh viên "${trimmed}" chưa được đăng ký trong hệ thống. Vui lòng bấm "Đăng ký tài khoản ngay" để tạo mới!`,
    };
  },

  verifyOfficerLogin: (username: string, password?: string) => {
    const trimmed = username.trim().toLowerCase();
    if (!trimmed) {
      return { success: false, message: 'Vui lòng nhập Tên đăng nhập cán bộ / giảng viên.' };
    }

    // Kiểm tra nếu người dùng nhầm lẫn nhập tài khoản Sinh viên vào Cổng Cán bộ / GV
    const isStudent =
      findRegisteredStudent(trimmed) ||
      STUDENT_ACCOUNTS.find((s) => s.mssv === trimmed);
    if (isStudent) {
      return {
        success: false,
        message: 'Đây là tài khoản Sinh viên. Vui lòng chuyển sang tab "CỔNG SINH VIÊN" để đăng nhập!',
      };
    }

    // 1. Kiểm tra tài khoản cán bộ đã đăng ký
    const regOfficer = findRegisteredOfficer(trimmed);
    if (regOfficer) {
      if (regOfficer.password) {
        if (!password || password.trim() === '') {
          return { success: false, message: 'Vui lòng nhập mật khẩu tài khoản cán bộ!' };
        }
        if (password.trim() !== regOfficer.password) {
          return { success: false, message: 'Mật khẩu cán bộ không chính xác. Vui lòng thử lại!' };
        }
      }

      const officerUser: OfficerAccount = {
        type: 'officer',
        username: regOfficer.username,
        name: regOfficer.name,
        title: regOfficer.title,
        department: regOfficer.department,
        targetRole: regOfficer.targetRole,
        avatar: regOfficer.avatar,
        allowedRoles: regOfficer.allowedRoles,
      };

      saveUser(officerUser);
      set({ currentUser: officerUser, isAuthenticated: true });
      useAppStore.getState().setSessionMode('portal');
      useAppStore.getState().setRole(officerUser.targetRole);
      return { success: true, message: 'Đăng nhập thành công!', user: officerUser };
    }

    // 2. Kiểm tra tài khoản cán bộ có sẵn
    const existing = OFFICER_ACCOUNTS.find((o) => o.username.toLowerCase() === trimmed);
    if (existing) {
      saveUser(existing);
      set({ currentUser: existing, isAuthenticated: true });
      useAppStore.getState().setSessionMode('portal');
      useAppStore.getState().setRole(existing.targetRole);
      return { success: true, message: 'Đăng nhập thành công!', user: existing };
    }

    return {
      success: false,
      message: `Tài khoản Cán bộ / Giảng viên "${trimmed}" chưa được đăng ký trong hệ thống. Vui lòng bấm "Đăng ký tài khoản ngay" để tạo mới!`,
    };
  },

  loginAsStudent: (mssv: string, customInfo?: Partial<StudentAccount>) => {
    const trimmed = mssv.trim();
    // Ưu tiên tài khoản đã đăng ký nếu có
    const regStudent = findRegisteredStudent(trimmed);
    const existing = STUDENT_ACCOUNTS.find((s) => s.mssv === trimmed);

    const studentUser: StudentAccount = {
      type: 'student',
      mssv: trimmed || '3121102001',
      name:
        customInfo?.name?.trim() ||
        regStudent?.name ||
        existing?.name ||
        `Sinh viên ${trimmed || '3121102001'}`,
      className:
        customInfo?.className?.trim() || regStudent?.className || existing?.className || '47K12.1',
      faculty:
        customInfo?.faculty?.trim() ||
        regStudent?.faculty ||
        existing?.faculty ||
        'Khoa Công nghệ thông tin kinh doanh',
      email:
        customInfo?.email?.trim() ||
        regStudent?.email ||
        existing?.email ||
        `${trimmed || '3121102001'}@due.udn.vn`,
      avatar: '🎓',
    };
    saveUser(studentUser);
    set({ currentUser: studentUser, isAuthenticated: true });
    useAppStore.getState().setSessionMode('portal');
    useAppStore.getState().setRole('student');
    return true;
  },

  loginAsOfficer: (username: string) => {
    const trimmed = username.trim().toLowerCase();
    const regOfficer = findRegisteredOfficer(trimmed);
    if (regOfficer) {
      const officerUser: OfficerAccount = {
        type: 'officer',
        username: regOfficer.username,
        name: regOfficer.name,
        title: regOfficer.title,
        department: regOfficer.department,
        targetRole: regOfficer.targetRole,
        avatar: regOfficer.avatar,
        allowedRoles: regOfficer.allowedRoles,
      };
      saveUser(officerUser);
      set({ currentUser: officerUser, isAuthenticated: true });
      useAppStore.getState().setSessionMode('portal');
      useAppStore.getState().setRole(officerUser.targetRole);
      return true;
    }

    const account = OFFICER_ACCOUNTS.find((o) => o.username.toLowerCase() === trimmed);
    if (account) {
      saveUser(account);
      set({ currentUser: account, isAuthenticated: true });
      useAppStore.getState().setSessionMode('portal');
      useAppStore.getState().setRole(account.targetRole);
      return true;
    }
    return false;
  },

  logout: () => {
    saveUser(null);
    set({ currentUser: null, isAuthenticated: false });
    useAppStore.getState().setRole('student');
  },

  canAccessRole: (role: Role) => {
    const user = get().currentUser;
    // Nếu chưa đăng nhập (hoặc chế độ tự do), mở toàn quyền để demo
    if (!user) return true;
    if (user.type === 'student') {
      // Sinh viên chỉ truy cập bàn Sinh viên
      return role === 'student';
    }
    if (user.type === 'officer') {
      return (user as OfficerAccount).allowedRoles.includes(role);
    }
    return true;
  },
}));

if (initialUser) {
  useAppStore.getState().setSessionMode('portal');
  if (initialUser.type === 'officer') {
    useAppStore.getState().setRole(initialUser.targetRole);
  }
}
