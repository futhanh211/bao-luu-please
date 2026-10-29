import { EngineEvent } from '../../engine/types';
import { PROCESS_DEF } from '../../engine/process.def';
import { tokenAnimManager } from '../../ui/map/tokenAnim';
import { computeEdgePath, NODE_COORDS } from '../../ui/map/layout';

/** Không có DOM (Vitest headless) → bỏ animation, event vẫn chạy đúng thứ tự. */
export const IS_HEADLESS = typeof window === 'undefined';

export function mark(name: string): void {
  if (import.meta.env.DEV && !IS_HEADLESS && typeof performance !== 'undefined') {
    performance.mark(name);
  }
}

export function measure(name: string, start: string, end: string): void {
  if (import.meta.env.DEV && !IS_HEADLESS && typeof performance !== 'undefined') {
    try {
      performance.measure(name, start, end);
    } catch {
      // Mark có thể chưa tồn tại nếu luồng bị huỷ giữa chừng.
    }
  }
}

/** Trả về thời gian chờ (ms) sau khi event đã được áp vào state. */
export async function handleEventAnimation(event: EngineEvent, speed: number): Promise<number> {
  if (IS_HEADLESS) return 0;

  const scaled = (ms: number) => Math.max(80, ms / speed);

  switch (event.type) {
    case 'edge.traversed': {
      const edge = PROCESS_DEF.edges.find((e) => e.id === event.edgeId);
      if (edge) {
        const nodeMap = new Map(PROCESS_DEF.nodes.map((n) => [n.id, n]));
        const fromNode = nodeMap.get(edge.from);
        const toNode = nodeMap.get(edge.to);
        const path = computeEdgePath(edge.from, edge.to, fromNode?.type, toNode?.type);
        const isMsg = edge.type === 'message';
        const duration = isMsg ? 800 : 700;

        return new Promise<number>((resolve) => {
          tokenAnimManager.animatePath(
            event.tokenId,
            path,
            duration,
            speed,
            isMsg,
            isMsg ? 'var(--amber)' : '#ffffff',
            () => resolve(scaled(100))
          );
        });
      }
      return scaled(200);
    }

    case 'token.split': {
      const origin = NODE_COORDS['G2'] || { x: 760, y: 340 };
      const targets = [
        NODE_COORDS['T3'] || { x: 930, y: 340 },
        NODE_COORDS['T4'] || { x: 930, y: 580 },
        NODE_COORDS['T5'] || { x: 930, y: 740 },
      ];
      return new Promise<number>((resolve) => {
        tokenAnimManager.animateSplit(origin, targets, 350, speed, () => resolve(scaled(80)));
      });
    }

    case 'node.entered': {
      const node = PROCESS_DEF.nodes.find((n) => n.id === event.nodeId);
      if (!node) return scaled(300);
      switch (node.type) {
        case 'serviceTask':
          return scaled(900);
        case 'sendTask':
          return scaled(700);
        case 'businessRuleTask':
          return scaled(1400);
        case 'gatewayXor':
        case 'gatewayAnd':
          return scaled(500);
        default:
          return scaled(400);
      }
    }

    default:
      return 0;
  }
}
