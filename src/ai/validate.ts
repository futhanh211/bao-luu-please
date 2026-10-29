import { DocScanResult, ReviewerBrief } from '../engine/types';

type Raw = Record<string, unknown>;

function isRecord(value: unknown): value is Raw {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

const SEVERITIES = ['low', 'medium', 'high'] as const;

/** Bóc JSON khỏi câu trả lời (có thể bị bọc fence ```json). */
export function parseJsonObject(text: string): Raw | null {
  if (!text) return null;
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    const parsed: unknown = JSON.parse(cleaned.slice(start, end + 1));
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function validateDocScan(raw: Raw): DocScanResult | null {
  const evidenceType = asString(raw.evidenceType);
  const confidence = asNumber(raw.confidence);
  const typeMatchesReason = raw.typeMatchesReason;

  if (!evidenceType || confidence === null || confidence < 0 || confidence > 1) return null;
  if (typeof typeMatchesReason !== 'boolean') return null;

  const extracted: Record<string, string> = {};
  if (isRecord(raw.extracted)) {
    for (const [key, value] of Object.entries(raw.extracted)) {
      if (typeof value === 'string') extracted[key] = value;
    }
  }

  const anomalies: DocScanResult['anomalies'] = [];
  if (Array.isArray(raw.anomalies)) {
    for (const item of raw.anomalies) {
      if (!isRecord(item)) continue;
      const issue = asString(item.issue);
      const severity = item.severity;
      if (!issue) continue;
      if (typeof severity !== 'string') continue;
      if (!SEVERITIES.includes(severity as (typeof SEVERITIES)[number])) continue;
      anomalies.push({
        field: asString(item.field) ?? 'document',
        issue,
        severity: severity as (typeof SEVERITIES)[number],
      });
    }
  }

  return { evidenceType, typeMatchesReason, extracted, anomalies, confidence };
}

const DECISIONS: Record<'advisor' | 'ctsv', ReviewerBrief['suggestedDecision'][]> = {
  advisor: ['confirm', 'decline'],
  ctsv: ['valid', 'invalid'],
};

export function validateBrief(raw: Raw, role: 'advisor' | 'ctsv'): ReviewerBrief | null {
  const summary = asString(raw.summary);
  const rationale = asString(raw.rationale);
  const decision = raw.suggestedDecision;

  if (!summary || !rationale) return null;
  if (typeof decision !== 'string') return null;
  if (!DECISIONS[role].includes(decision as ReviewerBrief['suggestedDecision'])) return null;

  const points: string[] = [];
  if (Array.isArray(raw.points)) {
    for (const point of raw.points) {
      const text = asString(point);
      if (text && !points.includes(text)) points.push(text);
      if (points.length === 4) break;
    }
  }
  if (points.length === 0) return null;

  return {
    summary,
    points,
    suggestedDecision: decision as ReviewerBrief['suggestedDecision'],
    rationale,
  };
}

/** Văn bản AI-4: nhận `{ text }` hoặc chuỗi thô, cắt về 800 ký tự. */
export function validateDraft(raw: unknown): string | null {
  const candidate = typeof raw === 'string' ? raw : isRecord(raw) ? raw.text : null;
  const text = asString(candidate);
  if (!text) return null;
  return text.slice(0, 800);
}
