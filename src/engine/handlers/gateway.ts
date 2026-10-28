import { CaseState, Token, EngineEvent } from '../types';

export function evaluateXorGateway(
  gatewayId: string,
  state: CaseState
): string {
  if (gatewayId === 'G1') {
    const isValid = state.validity.complete && state.validity.evidenceOk;
    return isValid ? 'G2' : 'T2';
  }

  if (gatewayId === 'G4') {
    const isEligible =
      state.ruleResult.pass &&
      state.advisor.status === 'confirmed' &&
      state.ctsv.status === 'valid';
    return isEligible ? 'T8' : 'T7';
  }

  throw new Error(`Unknown XOR gateway: ${gatewayId}`);
}

export function splitAndGateway(
  token: Token,
  targets: string[],
  emit: (event: EngineEvent) => void
): Token[] {
  const newTokens: Token[] = targets.map((target, idx) => ({
    id: `${token.id}_branch_${idx + 1}`,
    at: target,
    caseId: token.caseId,
    branch: target,
  }));

  emit({
    type: 'token.split',
    fromTokenId: token.id,
    newTokens: newTokens.map((t) => t.id),
  });

  return newTokens;
}

export function joinAndGateway(
  arrivedTokens: Token[],
  expectedBranches: number,
  targetNodeId: string,
  caseId: string,
  emit: (event: EngineEvent) => void
): Token | null {
  if (arrivedTokens.length < expectedBranches) {
    return null; // Still waiting for other branches
  }

  const resultingTokenId = `token_merged_${Date.now()}`;
  emit({
    type: 'token.merged',
    mergedTokenIds: arrivedTokens.map((t) => t.id),
    resultingTokenId,
  });

  return {
    id: resultingTokenId,
    at: targetNodeId,
    caseId,
  };
}
