import { describe, it, expect } from 'vitest';
import { PROCESS_DEF } from '../../engine/process.def';
import {
  VIEW_BOX,
  NODE_COORDS,
  computeEdgePath,
  getNodeDimensions,
} from './layout';

describe('BPMN Layout Tests (layout.ts)', () => {
  it('Mọi node trong process.def.ts đều có tọa độ xác định và nằm trong viewBox', () => {
    for (const node of PROCESS_DEF.nodes) {
      const coord = NODE_COORDS[node.id];
      expect(coord, `Node ${node.id} is missing coordinates in NODE_COORDS`).toBeDefined();

      const dims = getNodeDimensions(node.type);
      const halfW = dims.width / 2;
      const halfH = dims.height / 2;

      expect(coord.x - halfW, `Node ${node.id} left edge out of viewBox`).toBeGreaterThanOrEqual(0);
      expect(coord.x + halfW, `Node ${node.id} right edge out of viewBox`).toBeLessThanOrEqual(VIEW_BOX.width);
      expect(coord.y - halfH, `Node ${node.id} top edge out of viewBox`).toBeGreaterThanOrEqual(0);
      expect(coord.y + halfH, `Node ${node.id} bottom edge out of viewBox`).toBeLessThanOrEqual(VIEW_BOX.height);
    }
  });

  it('Mọi edge trong process.def.ts đều có đường vẽ SVG hợp lệ (bắt đầu bằng M)', () => {
    const nodeMap = new Map(PROCESS_DEF.nodes.map((n) => [n.id, n]));

    for (const edge of PROCESS_DEF.edges) {
      const fromNode = nodeMap.get(edge.from);
      const toNode = nodeMap.get(edge.to);
      const path = computeEdgePath(edge.from, edge.to, fromNode?.type, toNode?.type);

      expect(path, `Edge ${edge.id} (${edge.from} -> ${edge.to}) generated empty path`).toBeTruthy();
      expect(path.startsWith('M '), `Edge ${edge.id} path must start with 'M '`).toBe(true);
    }
  });

  it('Không có hai hộp bao node độc lập nào chồng lên nhau', () => {
    const nodes = PROCESS_DEF.nodes;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];

        // BT1 is a boundary event attached directly on T4's border
        if ((a.id === 'BT1' && b.id === 'T4') || (a.id === 'T4' && b.id === 'BT1')) {
          continue;
        }

        const coordA = NODE_COORDS[a.id];
        const coordB = NODE_COORDS[b.id];
        const dimsA = getNodeDimensions(a.type);
        const dimsB = getNodeDimensions(b.type);

        const aLeft = coordA.x - dimsA.width / 2;
        const aRight = coordA.x + dimsA.width / 2;
        const aTop = coordA.y - dimsA.height / 2;
        const aBottom = coordA.y + dimsA.height / 2;

        const bLeft = coordB.x - dimsB.width / 2;
        const bRight = coordB.x + dimsB.width / 2;
        const bTop = coordB.y - dimsB.height / 2;
        const bBottom = coordB.y + dimsB.height / 2;

        const overlap = aLeft < bRight && aRight > bLeft && aTop < bBottom && aBottom > bTop;
        expect(overlap, `Hộp bao ${a.id} và ${b.id} bị chồng đè lên nhau`).toBe(false);
      }
    }
  });

  it('Hai hộp flow node cùng hàng cách nhau >= 30 đơn vị', () => {
    // Các flow node (task, gateway, event) trên các hàng quy trình
    const flowNodes = PROCESS_DEF.nodes.filter(
      (n) => n.type !== 'dataObject' && n.type !== 'dataStore'
    );
    const rows = [95, 245, 340, 440, 580, 740, 890];

    for (const rowY of rows) {
      const rowNodes = flowNodes
        .filter((n) => Math.abs(NODE_COORDS[n.id].y - rowY) <= 15)
        .sort((a, b) => NODE_COORDS[a.id].x - NODE_COORDS[b.id].x);

      for (let i = 0; i < rowNodes.length - 1; i++) {
        const leftNode = rowNodes[i];
        const rightNode = rowNodes[i + 1];

        const leftCoord = NODE_COORDS[leftNode.id];
        const rightCoord = NODE_COORDS[rightNode.id];
        const leftDims = getNodeDimensions(leftNode.type);
        const rightDims = getNodeDimensions(rightNode.type);

        const leftRightEdge = leftCoord.x + leftDims.width / 2;
        const rightLeftEdge = rightCoord.x - rightDims.width / 2;
        const gap = rightLeftEdge - leftRightEdge;

        expect(
          gap,
          `Khoảng cách hàng y=${rowY} giữa ${leftNode.id} và ${rightNode.id} là ${gap} < 30`
        ).toBeGreaterThanOrEqual(30);
      }
    }
  });
});
