import { describe, it, expect, beforeEach } from 'vitest';
import { usePlaybackStore } from './playback/store';
import { useAppStore } from './useApp';
import { useAuthStore } from './useAuth';
import {
  getAllSubmittedCases,
  getSubmittedCaseByMssv,
  updateCaseAdvisorDecision,
  getCtsvCases,
  updateCaseCtsvDecision,
  getPrincipalCases,
  updateCasePrincipalSign,
} from '../data/caseRegistry';
import { registerStudentAccount, memoryFallback } from '../data/userRegistry';

describe('End-to-End User Flow: Registration -> Submit -> Advisor -> CTSV -> Principal -> Re-login', () => {
  beforeEach(() => {
    for (const k of Object.keys(memoryFallback)) {
      delete memoryFallback[k];
    }
    useAppStore.setState({
      screen: 'login',
      role: 'student',
      scenarioId: null,
      caseCode: 'BL-2026-88',
      sessionMode: 'portal',
    });
  });

  it('preserves submitted case for student kkkk through all officer stages and re-login', async () => {
    // 1. Student registers account 'kkkk'
    const regRes = registerStudentAccount({
      mssv: 'kkkk',
      name: 'Sinh vien K',
      className: '48K12.1',
      faculty: 'Khoa Công nghệ thông tin kinh doanh',
      phone: '0905123456',
      email: 'kkkk@due.udn.vn',
      password: '123',
    });
    expect(regRes.success).toBe(true);

    // 2. Student logs in
    const loginOk = useAuthStore.getState().loginAsStudent('kkkk');
    expect(loginOk).toBe(true);

    usePlaybackStore.getState().initStudentSession(
      {
        mssv: 'kkkk',
        name: 'Sinh vien K',
        className: '48K12.1',
        faculty: 'Khoa Công nghệ thông tin kinh doanh',
      },
      undefined
    );

    expect(usePlaybackStore.getState().submitted).toBe(false);
    const assignedCode = useAppStore.getState().caseCode;
    expect(assignedCode).toBeTruthy();

    // 3. Student attaches evidence and submits
    usePlaybackStore.getState().setEvidenceList(
      [
        {
          id: 'ev_1',
          name: 'Giay xac nhan benh vien',
          type: 'medical_record',
          content: 'Xac nhan dieu tri',
        },
      ],
      true
    );

    await usePlaybackStore.getState().submitApplication();

    expect(usePlaybackStore.getState().submitted).toBe(true);

    // Verify case was saved in caseRegistry
    const savedCase = getSubmittedCaseByMssv('kkkk');
    expect(savedCase).not.toBeNull();
    expect(savedCase?.studentMssv).toBe('kkkk');
    expect(savedCase?.caseCode).toBe(assignedCode);

    // 4. Student logs out
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().currentUser).toBeNull();

    // 5. Advisor logs in
    const officerLoginOk = useAuthStore.getState().loginAsOfficer('advisor_nam');
    expect(officerLoginOk).toBe(true);

    // Check all cases from registry - student kkkk MUST be present in the docket list!
    const advisorDocket = getAllSubmittedCases();
    const studentInDocket = advisorDocket.find((c) => c.studentMssv === 'kkkk');
    expect(studentInDocket).toBeDefined();
    expect(studentInDocket?.advisorDecision).toBeUndefined(); // Pending advisor

    // Advisor confirms case
    updateCaseAdvisorDecision(studentInDocket!.id, 'confirmed');

    // 6. CTSV logs in (e.g. ctsv_mai or registered officer)
    const ctsvLoginOk = useAuthStore.getState().loginAsOfficer('ctsv_mai');
    expect(ctsvLoginOk).toBe(true);

    // CTSV MUST see the case because Advisor has confirmed it!
    const ctsvDocket = getCtsvCases();
    const caseInCtsv = ctsvDocket.find((c) => c.studentMssv === 'kkkk');
    expect(caseInCtsv).toBeDefined();
    expect(caseInCtsv?.advisorDecision).toBe('confirmed');
    expect(caseInCtsv?.ctsvDecision).toBeUndefined(); // Pending CTSV

    // CTSV stamps valid (trình BGH)
    updateCaseCtsvDecision(caseInCtsv!.id, 'valid');

    // 7. CTSV logs out
    useAuthStore.getState().logout();

    // 8. Principal logs in (bgh_khoi)
    const bghLoginOk = useAuthStore.getState().loginAsOfficer('bgh_khoi');
    expect(bghLoginOk).toBe(true);

    // Principal MUST see the case because Advisor confirmed AND CTSV validated!
    const principalDocket = getPrincipalCases();
    const caseInBgh = principalDocket.find((c) => c.studentMssv === 'kkkk');
    expect(caseInBgh).toBeDefined();
    expect(caseInBgh?.ctsvDecision).toBe('valid');
    expect(caseInBgh?.principalSigned).toBeFalsy();

    // Principal signs decision
    updateCasePrincipalSign(caseInBgh!.id, 'PGS.TS. Trần Đình Khôi - Hiệu trưởng');

    // 9. Principal logs out
    useAuthStore.getState().logout();

    // 10. Student kkkk logs back in!
    useAuthStore.getState().loginAsStudent('kkkk');
    usePlaybackStore.getState().initStudentSession(
      {
        mssv: 'kkkk',
        name: 'Sinh vien K',
        className: '48K12.1',
        faculty: 'Khoa Công nghệ thông tin kinh doanh',
      },
      undefined
    );

    // Student MUST be in submitted state (Tracker view), NOT blank form!
    expect(usePlaybackStore.getState().submitted).toBe(true);
    expect(useAppStore.getState().caseCode).toBe(assignedCode);

    const reloadedCase = getSubmittedCaseByMssv('kkkk');
    expect(reloadedCase?.advisorDecision).toBe('confirmed');
    expect(reloadedCase?.ctsvDecision).toBe('valid');
    expect(reloadedCase?.principalSigned).toBe(true);
    expect(reloadedCase?.status).toBe('completed');
  });
});
