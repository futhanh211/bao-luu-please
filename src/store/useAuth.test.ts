import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './useAuth';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('khởi tạo mặc định chưa đăng nhập khi không có storage', () => {
    expect(useAuthStore.getState().currentUser).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('đăng nhập thành công với tài khoản sinh viên có sẵn', () => {
    const success = useAuthStore.getState().loginAsStudent('3121102001');
    expect(success).toBe(true);
    const user = useAuthStore.getState().currentUser;
    expect(user).not.toBeNull();
    expect(user?.type).toBe('student');
    if (user?.type === 'student') {
      expect(user.mssv).toBe('3121102001');
      expect(user.name).toBe('Nguyễn Minh Khoa');
    }
    expect(useAuthStore.getState().canAccessRole('student')).toBe(true);
    expect(useAuthStore.getState().canAccessRole('advisor')).toBe(false);
  });

  it('đăng nhập thành công với sinh viên khác trong CSDL (Phan Thanh Tùng)', () => {
    const success = useAuthStore.getState().loginAsStudent('3121102008');
    expect(success).toBe(true);
    const user = useAuthStore.getState().currentUser;
    expect(user).not.toBeNull();
    if (user?.type === 'student') {
      expect(user.mssv).toBe('3121102008');
      expect(user.name).toBe('Phan Thanh Tùng');
    }
  });

  it('đăng nhập thành công với sinh viên tùy chỉnh (custom student)', () => {
    const success = useAuthStore.getState().loginAsStudent('20269999', {
      name: 'Võ Minh Đạt',
      className: '48K11.2',
      faculty: 'Khoa Thương mại điện tử',
    });
    expect(success).toBe(true);
    const user = useAuthStore.getState().currentUser;
    expect(user).not.toBeNull();
    if (user?.type === 'student') {
      expect(user.mssv).toBe('20269999');
      expect(user.name).toBe('Võ Minh Đạt');
      expect(user.className).toBe('48K11.2');
      expect(user.faculty).toBe('Khoa Thương mại điện tử');
    }
  });

  it('đăng nhập thành công với tài khoản cán bộ', () => {
    const success = useAuthStore.getState().loginAsOfficer('advisor_nam');
    expect(success).toBe(true);
    const user = useAuthStore.getState().currentUser;
    expect(user).not.toBeNull();
    expect(user?.type).toBe('officer');
    if (user?.type === 'officer') {
      expect(user.name).toBe('TS. Lê Hoài Nam');
      expect(user.targetRole).toBe('advisor');
    }
    expect(useAuthStore.getState().canAccessRole('advisor')).toBe(true);
  });

  it('đăng xuất xóa sạch phiên', () => {
    useAuthStore.getState().loginAsOfficer('advisor_nam');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().currentUser).toBeNull();
  });
});
