import { describe, expect, it } from 'vitest';
import { createEngine, EngineInstance } from '../../../engine/engine';
import { PROCESS_DEF } from '../../../engine/process.def';
import { Clock } from '../../../engine/clock';
import { InMemoryStudentsDB } from '../../../data/students.db';
import { InMemoryAcademicFinanceDB } from '../../../data/academic-finance.db';
import { MockAIProvider } from '../../../ai/mock';
import { SCENARIOS, ScenarioConfig } from '../../../data/scenarios';
import { EngineEvent } from '../../../engine/types';
import { buildControlLines, ControlLine } from './controlLog';

interface Harness {
  engine: EngineInstance;
  events: EngineEvent[];
}

function scenario(id: string): ScenarioConfig {
  const found = SCENARIOS.find((s) => s.id === id);
  if (!found) throw new Error(`Không có kịch bản ${id}`);
  return found;
}

function createHarness(id: string): Harness {
  const sc = scenario(id);
  const events: EngineEvent[] = [];
  const engine = createEngine(PROCESS_DEF, sc, {
    clock: new Clock(0),
    db: { ds1: new InMemoryAcademicFinanceDB(), ds2: new InMemoryStudentsDB() },
    ai: new MockAIProvider(sc.aiScript, 0),
  });
  engine.subscribe((event) => events.push(event));
  return { engine, events };
}

function texts(lines: ControlLine[]): string[] {
  return lines.map((l) => `${l.tag} ${l.kind} ${l.text}`);
}

function hasLine(lines: ControlLine[], ...needles: string[]): boolean {
  return lines.some((l) => needles.every((n) => `${l.tag} ${l.kind} ${l.text}`.includes(n)));
}

async function runS1(): Promise<ControlLine[]> {
  const { engine, events } = createHarness('s1');
  await engine.start();
  await engine.runUntilBlocked();
  await engine.completeUserTask('T4', 'confirmed');
  await engine.completeUserTask('T5', 'valid');
  await engine.runUntilBlocked();
  await engine.completeUserTask('T9', { signerName: 'PGS.TS. Đoàn Ngọc Phi Anh' });
  await engine.runUntilBlocked();
  return buildControlLines(events, { evidenceCount: 1 });
}

async function runS3(): Promise<ControlLine[]> {
  const { engine, events } = createHarness('s3');
  await engine.start();
  await engine.runUntilBlocked();
  await engine.completeUserTask('T4', 'confirmed');
  await engine.completeUserTask('T5', 'valid');
  await engine.runUntilBlocked();
  return buildControlLines(events, { evidenceCount: 1 });
}

async function runS4(): Promise<ControlLine[]> {
  const { engine, events } = createHarness('s4');
  await engine.start();
  await engine.runUntilBlocked();
  await engine.advanceDays(3);
  await engine.runUntilBlocked();
  await engine.completeUserTask('T4', 'confirmed');
  await engine.completeUserTask('T5', 'valid');
  await engine.runUntilBlocked();
  await engine.completeUserTask('T9', { signerName: 'PGS.TS. Đoàn Ngọc Phi Anh' });
  await engine.runUntilBlocked();
  return buildControlLines(events, { evidenceCount: 1 });
}

describe('controlLog · EngineEvent → dòng CRT tiếng Việt', () => {
  it('S1: service/send/rule/AND/XOR/message/end đều có dòng đúng định dạng', async () => {
    const lines = await runS1();

    expect(hasLine(lines, 'T1', 'SERVICE', 'Kiểm tra tự động tính đầy đủ hồ sơ', 'OK')).toBe(true);
    expect(hasLine(lines, 'G2', 'AND', 'tách 3 nhánh: T3 | T4 | T5')).toBe(true);
    expect(hasLine(lines, 'G3', 'AND', 'hội tụ 3 nhánh')).toBe(true);
    expect(hasLine(lines, 'T4', 'USER', 'Cố vấn: XÁC NHẬN')).toBe(true);
    expect(hasLine(lines, 'T5', 'USER', 'CTSV: HỢP LỆ')).toBe(true);
    expect(hasLine(lines, 'T9', 'USER', 'BGH: ĐÃ KÝ SỐ')).toBe(true);
    expect(hasLine(lines, 'T11', 'SEND', 'Quyết định đã ký số (MF4)')).toBe(true);
    expect(hasLine(lines, 'END', 'STOP', 'Bảo lưu thành công')).toBe(true);
    expect(hasLine(lines, 'T1', 'DATA', 'DS2 ← đọc hồ sơ')).toBe(true);
    expect(hasLine(lines, 'T3', 'DATA', 'DS1 ← đọc hồ sơ')).toBe(true);

    const rules = lines.filter((l) => l.kind === 'RULE' && l.tag === 'T3' && l.text.startsWith('R'));
    expect(rules).toHaveLength(4);
    expect(rules.every((l) => l.tone === 'ok')).toBe(true);

    const ai = lines.find((l) => l.kind === 'AI' && l.text.includes('DocScan'));
    expect(ai?.text).toContain('confidence 0.98');
  });

  it('S3: R3 ✗ đỏ kèm số nợ, G4 → KHÔNG, kết cục Từ chối', async () => {
    const lines = await runS3();

    const r3 = lines.find((l) => l.kind === 'RULE' && l.text.startsWith('R3'));
    expect(r3).toBeDefined();
    expect(r3?.tone).toBe('fail');
    expect(r3?.text).toContain('✗');
    expect(r3?.text).toContain('7.500.000');

    expect(hasLine(lines, 'G4', 'XOR', 'Đủ điều kiện bảo lưu? → KHÔNG')).toBe(true);
    expect(hasLine(lines, 'T7', 'SEND', 'Thông báo không đủ điều kiện (MF3)')).toBe(true);
    expect(hasLine(lines, 'END', 'STOP', 'Từ chối')).toBe(true);
  });

  it('S4: timer BT1 bắn, nhánh nhắc kết thúc riêng, ca chính vẫn về Bảo lưu thành công', async () => {
    const lines = await runS4();

    expect(hasLine(lines, 'BT1', 'TIMER', 'đủ 3 ngày làm việc → kích hoạt T6')).toBe(true);
    expect(hasLine(lines, 'T6', 'SEND', 'nhắc việc quá hạn SLA')).toBe(true);

    const endLines = texts(lines).filter((t) => t.startsWith('END STOP'));
    expect(endLines.some((t) => t.includes('Hoàn tất nhắc việc (nhánh phụ)'))).toBe(true);
    expect(endLines[endLines.length - 1]).toContain('Bảo lưu thành công');
  });
});
