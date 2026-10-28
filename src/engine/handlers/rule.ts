import { CaseState, Token, EngineDeps, EngineEvent } from '../types';
import { evaluateRules } from '../rules';

export async function handleBusinessRuleTask(
  nodeId: string,
  state: CaseState,
  _token: Token,
  deps: EngineDeps,
  emit: (event: EngineEvent) => void
): Promise<void> {
  if (nodeId === 'T3') {
    // Read academic and financial data from DS1
    emit({ type: 'data.read', storeId: 'DS1', entityId: state.form.mssv });
    const record = deps.db.ds1.get(state.form.mssv);

    // Evaluate business rules R1 - R4 (deterministic, NO AI)
    const result = evaluateRules(record);

    for (const item of result.rules) {
      emit({
        type: 'rule.evaluated',
        ruleId: item.id,
        passed: item.passed,
        detail: item.detail,
      });
    }

    state.ruleResult = {
      pass: result.pass,
      violations: result.violations,
    };
  }
}
