import {
  StudentApplicationForm,
  ValidityState,
  RuleResultState,
  DocScanInput,
  DocScanResult,
  ReviewerBrief,
} from '../engine/types';

export interface CaseSummary {
  form: StudentApplicationForm;
  validity?: ValidityState;
  ruleResult?: RuleResultState;
  advisorStatus?: string;
  ctsvStatus?: string;
  day?: number;
}

export interface AIScriptConfig {
  docScanResult?: DocScanResult;
  advisorBrief?: ReviewerBrief;
  ctsvBrief?: ReviewerBrief;
  returnMessage?: string;
  rejectMessage?: string;
  decisionBasis?: string;
}

export interface AIProvider {
  mode: 'mock' | 'live';
  analyzeDocuments(input: DocScanInput): Promise<DocScanResult>;
  chat(history: unknown[], ctx: unknown): Promise<string>;
  reviewerBrief(role: 'advisor' | 'ctsv', ctx: unknown): Promise<ReviewerBrief>;
  draftText(kind: 'return' | 'reject' | 'decisionBasis', ctx: unknown): Promise<string>;
}
