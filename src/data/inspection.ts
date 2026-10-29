import { EvidenceItem, EvidenceFieldAnomaly } from '../engine/types';

/** Một điểm bất thường gắn với đúng một trường trên tờ minh chứng. */
export interface InspectionAnomaly extends EvidenceFieldAnomaly {
  key: string;
  evidenceId: string;
  evidenceName: string;
  fieldId: string;
  label: string;
  value: string;
}

export interface InspectionScore {
  caught: number;
  total: number;
  falseMarks: number;
}

/** Kết quả chốt màn soi lệch của CTSV (dùng chung store + UI). */
export interface CtsvResult {
  outcome: 'valid' | 'invalid';
  score: InspectionScore;
  anomalies: InspectionAnomaly[];
  markedKeys: string[];
}

export function fieldMarkKey(evidenceId: string, fieldId: string): string {
  return `${evidenceId}:${fieldId}`;
}

/** Gom toàn bộ anomaly khai báo trong dữ liệu minh chứng (thuần, deterministic). */
export function collectAnomalies(evidence: EvidenceItem[]): InspectionAnomaly[] {
  const result: InspectionAnomaly[] = [];
  for (const item of evidence) {
    for (const field of item.fields ?? []) {
      if (!field.anomaly) continue;
      result.push({
        ...field.anomaly,
        key: fieldMarkKey(item.id, field.id),
        evidenceId: item.id,
        evidenceName: item.name,
        fieldId: field.id,
        label: field.label,
        value: field.value,
      });
    }
  }
  return result;
}

/**
 * Chấm màn soi lệch: người thao tác đánh dấu các trường, điểm chỉ để phản hồi trực quan.
 * Kết quả ca vẫn do con dấu của CTSV quyết định.
 */
export function scoreInspection(
  markedKeys: string[],
  anomalies: InspectionAnomaly[]
): InspectionScore {
  const anomalyKeys = new Set(anomalies.map((a) => a.key));
  const marked = new Set(markedKeys);
  let caught = 0;
  for (const key of marked) {
    if (anomalyKeys.has(key)) caught += 1;
  }
  return {
    caught,
    total: anomalies.length,
    falseMarks: marked.size - caught,
  };
}

/** Lấy đúng điểm bất thường của một tờ minh chứng cụ thể. */
export function anomaliesOfEvidence(
  evidence: EvidenceItem[],
  evidenceId: string
): InspectionAnomaly[] {
  return collectAnomalies(evidence.filter((e) => e.id === evidenceId));
}
