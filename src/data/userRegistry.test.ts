import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerStudentAccount,
  registerOfficerAccount,
  getRegisteredStudents,
  getRegisteredOfficers,
  saveRegisteredAccounts,
} from './userRegistry';
import { studentsDB } from './students.db';
import { academicFinanceDB } from './academic-finance.db';
import { useAuthStore } from '../store/useAuth';

describe('userRegistry & persistence', () => {
  beforeEach(() => {
    saveRegisteredAccounts([]);
    useAuthStore.getState().logout();
  });

  it('đăng ký thành công sinh viên mới và lưu vào localStorage', () => {
    const res = registerStudentAccount({
      mssv: '3122109999',
      name: 'Nguyễn Văn Kiểm Thử',
      className: '48K12.2',
      faculty: 'Khoa Công nghệ thông tin kinh doanh',
      email: 'kiemthu@due.udn.vn',
      phone: '0905999888',
      password: 'mypassword123',
    });

    expect(res.success).toBe(true);
    expect(res.account).toBeDefined();
    expect(res.account?.mssv).toBe('3122109999');

    // Kiểm tra đã lưu trong localStorage
    const saved = getRegisteredStudents();
    expect(saved.length).toBe(1);
    expect(saved[0].name).toBe('Nguyễn Văn Kiểm Thử');

    // Kiểm tra đồng bộ vào CSDL học vụ
    const inDb = studentsDB.get('3122109999');
    expect(inDb).toBeDefined();
    expect(inDb?.name).toBe('Nguyễn Văn Kiểm Thử');

    const inFinDb = academicFinanceDB.get('3122109999');
    expect(inFinDb).toBeDefined();
    expect(inFinDb?.tuitionDebt).toBe(0);
  });

  it('từ chối khi đăng ký trùng MSSV đã tồn tại', () => {
    registerStudentAccount({
      mssv: '3122108888',
      name: 'Sinh viên 1',
      className: '48K12.1',
      faculty: 'Khoa CNTT Kinh doanh',
    });

    const duplicate = registerStudentAccount({
      mssv: '3122108888',
      name: 'Sinh viên 2',
      className: '48K12.1',
      faculty: 'Khoa CNTT Kinh doanh',
    });

    expect(duplicate.success).toBe(false);
    expect(duplicate.message).toContain('đã được đăng ký trước đó');
  });

  it('đăng nhập thành công với tài khoản vừa đăng ký', () => {
    registerStudentAccount({
      mssv: '3122107777',
      name: 'Lê Hoàng Nam',
      className: '48K15.1',
      faculty: 'Khoa Thương mại điện tử',
      password: 'securePassword!',
    });

    // Thử mật khẩu sai
    const failLogin = useAuthStore.getState().verifyStudentLogin('3122107777', 'wrongpassword');
    expect(failLogin.success).toBe(false);
    expect(failLogin.message).toContain('Mật khẩu không chính xác');

    // Thử mật khẩu đúng
    const successLogin = useAuthStore.getState().verifyStudentLogin('3122107777', 'securePassword!');
    expect(successLogin.success).toBe(true);
    expect(useAuthStore.getState().currentUser?.name).toBe('Lê Hoàng Nam');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('đăng ký và đăng nhập cán bộ mới thành công', () => {
    const res = registerOfficerAccount({
      username: 'advisor_thanh',
      name: 'TS. Phan Tiến Thành',
      targetRole: 'advisor',
      title: 'Cố vấn học tập',
      department: 'Khoa Thương mại điện tử',
      password: 'officerPass',
    });

    expect(res.success).toBe(true);

    const officers = getRegisteredOfficers();
    expect(officers.length).toBe(1);
    expect(officers[0].username).toBe('advisor_thanh');

    // Đăng nhập cán bộ vừa đăng ký
    const loginRes = useAuthStore.getState().verifyOfficerLogin('advisor_thanh', 'officerPass');
    expect(loginRes.success).toBe(true);
    expect(useAuthStore.getState().currentUser?.name).toBe('TS. Phan Tiến Thành');
  });

  it('chặn sinh viên đăng nhập vào cổng cán bộ và ngược lại', () => {
    // Đăng ký 1 sinh viên và 1 cán bộ
    registerStudentAccount({
      mssv: '3122105555',
      name: 'Trần Văn Sinh Viên',
      className: '48K01',
      faculty: 'Khoa Quản trị kinh doanh',
      password: 'svpassword',
    });

    registerOfficerAccount({
      username: 'advisor_linh',
      name: 'ThS. Đỗ Thùy Linh',
      targetRole: 'advisor',
      password: 'gvpassword',
    });

    // 1. Thử dùng tài khoản sinh viên đăng nhập vào cổng Cán bộ -> BỊ CHẶN
    const svAtOfficerGate = useAuthStore.getState().verifyOfficerLogin('3122105555', 'svpassword');
    expect(svAtOfficerGate.success).toBe(false);
    expect(svAtOfficerGate.message).toContain('Đây là tài khoản Sinh viên');

    // 2. Thử dùng tài khoản cán bộ đăng nhập vào cổng Sinh viên -> BỊ CHẶN
    const gvAtStudentGate = useAuthStore.getState().verifyStudentLogin('advisor_linh', 'gvpassword');
    expect(gvAtStudentGate.success).toBe(false);
    expect(gvAtStudentGate.message).toContain('Đây là tài khoản Cán bộ / Giảng viên');
  });
});
