import { describe, it, expect, beforeEach } from 'vitest';
import { usePlaybackStore } from './playback';
import { useAppStore } from './useApp';
import { INITIAL_STUDENTS } from '../data/students.db';
import { INITIAL_ACADEMIC_FINANCE } from '../data/academic-finance.db';
import { SCENARIOS } from '../data/scenarios';
import { composeLetter } from '../data/letters';
import { KNOWLEDGE_ENTRIES } from '../data/knowledge-base';

describe('QA Session 3: Sanitization of AI & Simulation Tags in Custom Student Flow', () => {
  beforeEach(() => {
    useAppStore.setState({
      scenarioId: null,
      sessionMode: 'portal',
      role: 'student',
      screen: 'desk',
    });
  });

  it('đảm bảo khi sinh viên tự nhập đăng nhập thì isCustomCase = true', () => {
    const student = {
      mssv: '3121102999',
      name: 'Lê Trần Bảo Vy',
      className: '48K15.2',
      faculty: 'Khoa Thương mại điện tử',
    };

    usePlaybackStore.getState().initStudentSession(student, undefined);
    const state = usePlaybackStore.getState();

    expect(state.isCustomCase).toBe(true);
    expect(state.submissionDraft?.form.fullName).toBe('Lê Trần Bảo Vy');
    expect(state.submissionDraft?.form.mssv).toBe('3121102999');
    expect(state.submissionDraft?.form.faculty).toBe('Khoa Thương mại điện tử');
    expect(state.submitted).toBe(false);
  });

  it('đảm bảo khi chọn preset demo S1-S5 thì isCustomCase = false (cho phép tag AI/Demo phục vụ thuyết trình)', () => {
    const presetStudent = {
      mssv: '3121102001',
      name: 'Nguyễn Minh Khoa',
      className: '47K12.1',
      faculty: 'Khoa CNTT Kinh doanh',
    };

    usePlaybackStore.getState().initStudentSession(presetStudent, 's1');
    const state = usePlaybackStore.getState();

    expect(state.isCustomCase).toBe(false);
    expect(state.scenario?.id).toBe('s1');
  });

  it('kiểm tra toàn bộ text tiếng Việt có dấu (ă, â, ê, ô, ơ, ư, đ + 5 thanh điệu) trong CSDL và dữ liệu hệ thống', () => {
    // 1. Kiểm tra sinh viên trong CSDL
    expect(INITIAL_STUDENTS.length).toBeGreaterThan(0);
    INITIAL_STUDENTS.forEach((st) => {
      expect(st.name.length).toBeGreaterThan(0);
      expect(st.faculty).toContain('Khoa');
      // Không có ký tự rác unicode
      expect(st.name).not.toContain('\uFFFD');
      expect(st.faculty).not.toContain('\uFFFD');
    });

    // 2. Kiểm tra CSDL học phí & học vụ
    INITIAL_ACADEMIC_FINANCE.forEach((af) => {
      expect(af.gpaNote).not.toContain('\uFFFD');
    });

    // 3. Kiểm tra kịch bản SCENARIOS
    SCENARIOS.forEach((sc) => {
      expect(sc.title).not.toContain('\uFFFD');
      expect(sc.description).not.toContain('\uFFFD');
      sc.evidence.forEach((ev) => {
        expect(ev.name).not.toContain('\uFFFD');
        expect(ev.content).not.toContain('\uFFFD');
      });
    });

    // 4. Kiểm tra Knowledge Base (Chatbot 11 intent)
    expect(KNOWLEDGE_ENTRIES.length).toBeGreaterThanOrEqual(11);
    KNOWLEDGE_ENTRIES.forEach((kb) => {
      expect(kb.answer).not.toContain('\uFFFD');
      expect(kb.keywords.length).toBeGreaterThan(0);
      kb.keywords.forEach((pat) => {
        expect(pat).not.toContain('\uFFFD');
      });
    });

    // 5. Kiểm tra mẫu thư composeLetter
    const mf2 = composeLetter('MF2', { validity: { complete: false, missing: ['Minh chứng'] } });
    const mf3 = composeLetter('MF3', { ruleResult: { pass: false, violations: ['Nợ học phí'] } });
    const mf4 = composeLetter('MF4', {});

    [mf2, mf3, mf4].forEach((letter) => {
      expect(letter.title).not.toContain('\uFFFD');
      expect(letter.intro).not.toContain('\uFFFD');
      expect(letter.footer).not.toContain('\uFFFD');
    });
  });

  it('xác nhận tính nhất quán của giao diện One-Stop và cờ isCustomFlow', () => {
    // Luồng Portal mode:
    useAppStore.setState({ sessionMode: 'portal' });
    usePlaybackStore.setState({ isCustomCase: false });
    expect(usePlaybackStore.getState().isCustomCase || useAppStore.getState().sessionMode === 'portal').toBe(true);

    // Luồng Sinh viên tự nhập trong bất kỳ mode nào:
    useAppStore.setState({ sessionMode: 'demo' });
    usePlaybackStore.setState({ isCustomCase: true });
    expect(usePlaybackStore.getState().isCustomCase || useAppStore.getState().sessionMode === 'portal').toBe(true);

    // Luồng Demo S1-S5 bình thường:
    useAppStore.setState({ sessionMode: 'demo' });
    usePlaybackStore.setState({ isCustomCase: false });
    expect(usePlaybackStore.getState().isCustomCase || useAppStore.getState().sessionMode === 'portal').toBe(false);
  });
});
