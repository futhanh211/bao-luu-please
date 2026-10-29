import { describe, it, expect } from 'vitest';
import { SCENARIOS } from './scenarios';
import {
  collectAnomalies,
  fieldMarkKey,
  scoreInspection,
} from './inspection';

const scenario = (id: string) => {
  const found = SCENARIOS.find((s) => s.id === id);
  if (!found) throw new Error(`Missing scenario ${id}`);
  return found;
};

describe('inspection · soi lệch minh chứng', () => {
  it('S5 có đúng 3 điểm bất thường, đúng 3 trường khác nhau', () => {
    const anomalies = collectAnomalies(scenario('s5').evidence);
    expect(anomalies).toHaveLength(3);
    expect(anomalies.map((a) => a.fieldId).sort()).toEqual([
      'dischargeDate',
      'hospitalStamp',
      'patientName',
    ]);
    expect(anomalies.every((a) => a.key.startsWith('ev_05:'))).toBe(true);
  });

  it('S1/S3/S4 không có anomaly nhưng vẫn có trường để đọc', () => {
    for (const id of ['s1', 's3', 's4']) {
      const evidence = scenario(id).evidence;
      expect(collectAnomalies(evidence)).toHaveLength(0);
      expect(evidence[0].fields?.length).toBeGreaterThan(0);
    }
  });

  it('chấm đúng 2/3 và 1 đánh dấu nhầm', () => {
    const anomalies = collectAnomalies(scenario('s5').evidence);
    const marks = [
      anomalies[0].key,
      anomalies[1].key,
      fieldMarkKey('ev_05', 'admissionDate'),
    ];
    expect(scoreInspection(marks, anomalies)).toEqual({
      caught: 2,
      total: 3,
      falseMarks: 1,
    });
  });

  it('không đánh dấu gì thì 0/3, không có đánh dấu nhầm', () => {
    const anomalies = collectAnomalies(scenario('s5').evidence);
    expect(scoreInspection([], anomalies)).toEqual({
      caught: 0,
      total: 3,
      falseMarks: 0,
    });
  });
});
