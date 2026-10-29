import { describe, it, expect } from 'vitest';
import { DEMO_STUDENT_PRESETS, OFFICER_CARD_SPECS } from '../../../data/loginPresets';
import { SCENARIOS } from '../../../data/scenarios';
import { OFFICER_ACCOUNTS } from '../../../data/accounts';
import { useAuthStore } from '../../../store/useAuth';

describe('LoginPortal Data & Presets Verification', () => {
  it('toàn bộ 5 sinh viên preset đều liên kết chính xác với 5 kịch bản BPMN', () => {
    expect(DEMO_STUDENT_PRESETS.length).toBe(5);

    DEMO_STUDENT_PRESETS.forEach((preset) => {
      const scenario = SCENARIOS.find((s) => s.id === preset.scenarioId);
      expect(scenario).toBeDefined();
      expect(scenario?.mssv).toBe(preset.mssv);
      expect(scenario?.studentName).toBe(preset.name);
      const ok = useAuthStore.getState().loginAsStudent(preset.mssv);
      expect(ok).toBe(true);
      useAuthStore.getState().logout();
    });
  });

  it('toàn bộ 3 cán bộ preset đều khớp với danh mục tài khoản công vụ và phân quyền BPMN', () => {
    expect(OFFICER_CARD_SPECS.length).toBe(3);

    OFFICER_CARD_SPECS.forEach((officer) => {
      const acc = OFFICER_ACCOUNTS.find((o) => o.username === officer.username);
      expect(acc).toBeDefined();
      expect(acc?.targetRole).toBe(officer.targetRole);
      const ok = useAuthStore.getState().loginAsOfficer(officer.username);
      expect(ok).toBe(true);
      useAuthStore.getState().logout();
    });
  });

  it('phân chia vai trò đúng 3 cấp độ thẩm quyền Lane L2, L3, L4', () => {
    const roles = OFFICER_CARD_SPECS.map((o) => o.targetRole);
    expect(roles).toContain('advisor');
    expect(roles).toContain('ctsv');
    expect(roles).toContain('principal');
  });
});
