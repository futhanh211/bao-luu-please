import { create } from 'zustand';
import {
  UserAccount,
  StudentAccount,
  OfficerAccount,
  STUDENT_ACCOUNTS,
  OFFICER_ACCOUNTS,
} from '../data/accounts';
import { Role, useAppStore } from './useApp';

interface AuthState {
  currentUser: UserAccount | null;
  isAuthenticated: boolean;
  loginAsStudent: (mssv: string, customInfo?: Partial<StudentAccount>) => boolean;
  loginAsOfficer: (username: string) => boolean;
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

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: initialUser,
  isAuthenticated: initialUser !== null,

  loginAsStudent: (mssv: string, customInfo?: Partial<StudentAccount>) => {
    const trimmed = mssv.trim();
    const existing = STUDENT_ACCOUNTS.find((s) => s.mssv === trimmed);
    const studentUser: StudentAccount = {
      type: 'student',
      mssv: trimmed || '3121102001',
      name: customInfo?.name?.trim() || existing?.name || `Sinh viên ${trimmed || '3121102001'}`,
      className: customInfo?.className?.trim() || existing?.className || '47K12.1',
      faculty: customInfo?.faculty?.trim() || existing?.faculty || 'Khoa Công nghệ thông tin kinh doanh',
      email: customInfo?.email?.trim() || existing?.email || `${trimmed || '3121102001'}@due.udn.vn`,
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
