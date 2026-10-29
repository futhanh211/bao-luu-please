import { describe, it, expect } from 'vitest';
import { PROCESS_DEF } from './process.def';

describe('Process Definition Guard Tests (01-PROCESS-SPEC.md)', () => {
  const nodeMap = new Map(PROCESS_DEF.nodes.map((n) => [n.id, n]));
  const edgeMap = new Map(PROCESS_DEF.edges.map((e) => [e.id, e]));

  it('(a) Mọi ID trong docs/01 mục 2 đều tồn tại đầy đủ', () => {
    const requiredNodeIds = [
      'SV_START',
      'SV_T1',
      'SV_R1',
      'SV_R2',
      'SV_R3',
      'E_START',
      'T1',
      'T2',
      'T3',
      'T4',
      'T5',
      'T6',
      'T7',
      'T8',
      'T9',
      'T10',
      'T11',
      'G1',
      'G2',
      'G3',
      'G4',
      'BT1',
      'E_END_RETURNED',
      'E_END_REJECTED',
      'E_END_REMIND',
      'E_END_OK',
      'DS1',
      'DS2',
      'DO1',
      'DO2',
      'DO3',
    ];

    for (const id of requiredNodeIds) {
      expect(nodeMap.has(id), `Missing node: ${id}`).toBe(true);
    }

    const requiredFlowIds = ['MF1', 'MF2', 'MF3', 'MF4'];
    for (const id of requiredFlowIds) {
      expect(edgeMap.has(id), `Missing message flow: ${id}`).toBe(true);
    }
  });

  it('(b) Mọi edge trỏ tới node tồn tại trong process definition', () => {
    for (const edge of PROCESS_DEF.edges) {
      expect(nodeMap.has(edge.from), `Edge ${edge.id} from invalid node: ${edge.from}`).toBe(true);
      expect(nodeMap.has(edge.to), `Edge ${edge.id} to invalid node: ${edge.to}`).toBe(true);
    }
  });

  it('(c) T1–T11 có đúng loại tác vụ', () => {
    const serviceTasks = ['T1', 'T6', 'T8', 'T10'];
    const sendTasks = ['T2', 'T7', 'T11'];
    const businessRuleTasks = ['T3'];
    const userTasks = ['T4', 'T5', 'T9'];

    for (const id of serviceTasks) {
      expect(nodeMap.get(id)?.type, `${id} must be serviceTask`).toBe('serviceTask');
    }
    for (const id of sendTasks) {
      expect(nodeMap.get(id)?.type, `${id} must be sendTask`).toBe('sendTask');
    }
    for (const id of businessRuleTasks) {
      expect(nodeMap.get(id)?.type, `${id} must be businessRuleTask`).toBe('businessRuleTask');
    }
    for (const id of userTasks) {
      expect(nodeMap.get(id)?.type, `${id} must be userTask`).toBe('userTask');
    }
  });

  it('(d) G1, G4 là XOR; G2, G3 là AND', () => {
    expect(nodeMap.get('G1')?.type).toBe('gatewayXor');
    expect(nodeMap.get('G4')?.type).toBe('gatewayXor');
    expect(nodeMap.get('G2')?.type).toBe('gatewayAnd');
    expect(nodeMap.get('G3')?.type).toBe('gatewayAnd');
  });

  it('(e) BT1 gắn T4, non-interrupting', () => {
    const bt1 = nodeMap.get('BT1');
    expect(bt1).toBeDefined();
    expect(bt1?.type).toBe('boundaryTimer');
    expect(bt1?.config?.attachedTo).toBe('T4');
    expect(bt1?.config?.interrupting).toBe(false);
  });
});
