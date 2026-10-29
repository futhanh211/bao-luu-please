// BPMN Map Layout Coordinates & SVG Path Generator
// ViewBox: 0 0 2360 1000

export interface Point {
  x: number;
  y: number;
}

export interface NodeLayout {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  name: string;
  lane: string;
  pool: string;
}

export interface PoolLayout {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LaneLayout {
  id: string;
  poolId: string;
  name: string;
  shortName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  colorVar: string;
}

export const VIEW_BOX = {
  width: 2360,
  height: 1000,
};

export const POOLS: PoolLayout[] = [
  {
    id: 'pool_student',
    name: 'SINH VIÊN',
    x: 0,
    y: 0,
    width: 2360,
    height: 180,
  },
  {
    id: 'pool_school',
    name: 'TRƯỜNG ĐH KINH TẾ – ĐH ĐÀ NẴNG',
    x: 0,
    y: 200,
    width: 2360,
    height: 780,
  },
];

// Lane content area starts at x=56 (label column: 0-28 pool, 28-56 lane)
export const LANES: LaneLayout[] = [
  {
    id: 'lane_student',
    poolId: 'pool_student',
    name: 'Sinh viên',
    shortName: 'Sinh viên',
    x: 56,
    y: 0,
    width: 2304,
    height: 180,
    colorVar: 'var(--pool-sv)',
  },
  {
    id: 'L1',
    poolId: 'pool_school',
    name: 'L1 · Hệ thống điều phối',
    shortName: 'L1 Hệ thống',
    x: 56,
    y: 200,
    width: 2304,
    height: 300,
    colorVar: 'var(--lane-l1-sys)',
  },
  {
    id: 'L2',
    poolId: 'pool_school',
    name: 'L2 · Cố vấn học tập / Khoa',
    shortName: 'L2 Cố vấn',
    x: 56,
    y: 500,
    width: 2304,
    height: 160,
    colorVar: 'var(--lane-l2-adv)',
  },
  {
    id: 'L3',
    poolId: 'pool_school',
    name: 'L3 · Phòng Công tác sinh viên',
    shortName: 'L3 CTSV',
    x: 56,
    y: 660,
    width: 2304,
    height: 160,
    colorVar: 'var(--lane-l3-ctsv)',
  },
  {
    id: 'L4',
    poolId: 'pool_school',
    name: 'L4 · Ban Giám hiệu',
    shortName: 'L4 BGH',
    x: 56,
    y: 820,
    width: 2304,
    height: 160,
    colorVar: 'var(--lane-l4-bgh)',
  },
];

// Node dimensions: Task updated to 160x80
export const NODE_DIMS = {
  task: { width: 160, height: 80, rx: 6 },
  gateway: { width: 48, height: 48 },
  event: { width: 36, height: 36, r: 18 },
  dataObject: { width: 32, height: 40 },
  dataStore: { width: 48, height: 44 },
  boundaryTimer: { width: 36, height: 36, r: 18 },
};

// Node Center Coordinates (x, y)
// Updated according to M2.1 spec: T11(2120,340), SV_R3(2120,95), E_END_OK(2280,340), BT1(975,540)
export const NODE_COORDS: Record<string, { x: number; y: number }> = {
  // Pool SV
  SV_START: { x: 150, y: 95 },
  SV_T1: { x: 330, y: 95 },
  SV_R1: { x: 760, y: 95 },
  SV_R2: { x: 1590, y: 95 },
  SV_R3: { x: 2120, y: 95 },

  // L1 hàng chính y=340
  E_START: { x: 330, y: 340 },
  T1: { x: 470, y: 340 },
  G1: { x: 610, y: 340 },
  G2: { x: 760, y: 340 },
  T3: { x: 930, y: 340 },
  G3: { x: 1300, y: 340 },
  G4: { x: 1440, y: 340 },
  T8: { x: 1590, y: 340 },
  T10: { x: 1910, y: 340 },
  T11: { x: 2120, y: 340 },
  E_END_OK: { x: 2280, y: 340 },

  // L1 hàng trên y=245 (nhánh từ chối / trả hồ sơ)
  T2: { x: 760, y: 245 },
  E_END_RETURNED: { x: 900, y: 245 },
  T7: { x: 1590, y: 245 },
  E_END_REJECTED: { x: 1730, y: 245 },

  // L1 hàng dưới y=440
  T6: { x: 1110, y: 440 },
  E_END_REMIND: { x: 1250, y: 440 },
  DS1: { x: 840, y: 440 },
  DS2: { x: 1830, y: 440 },
  DO1: { x: 470, y: 430 },
  DO2: { x: 1590, y: 430 },

  // L2
  T4: { x: 930, y: 580 },
  BT1: { x: 975, y: 540 }, // Mép trên T4 (580 - 40 = 540, 930 + 45 = 975)

  // L3
  T5: { x: 930, y: 740 },

  // L4
  T9: { x: 1750, y: 890 },
  DO3: { x: 1640, y: 890 },
};

// Custom Waypoints override for edges (Key: "FROM->TO")
export const EDGE_WAYPOINTS: Record<string, Point[]> = {
  'G1->T2': [{ x: 610, y: 245 }],
  'G2->T4': [{ x: 760, y: 580 }],
  'G2->T5': [{ x: 760, y: 740 }],
  'T4->G3': [{ x: 1300, y: 580 }],
  'T5->G3': [{ x: 1300, y: 740 }],
  'BT1->T6': [{ x: 975, y: 440 }],
  'G4->T7': [{ x: 1440, y: 245 }],
  'T8->T9': [{ x: 1750, y: 340 }],
  'T9->T10': [{ x: 1910, y: 890 }],
};

// Gateway labels placed strictly BELOW diamond at y+40
export const GATEWAY_LABELS: Record<string, { text: string; x: number; y: number }> = {
  G1: { text: 'Hồ sơ hợp lệ?', x: 610, y: 380 },
  G4: { text: 'Đủ điều kiện bảo lưu?', x: 1440, y: 380 },
};

// Branch decision labels placed clearly near edge origin without collision
export const BRANCH_LABELS: Record<string, { text: string; x: number; y: number }> = {
  e_g1_t2: { text: 'Không', x: 620, y: 290 },
  e_g1_g2: { text: 'Có', x: 652, y: 330 },
  e_g4_t7: { text: 'Không', x: 1450, y: 290 },
  e_g4_t8: { text: 'Có', x: 1482, y: 330 },
};

// Exactly ONE label per Message Flow, 8px right of vertical line at midpoint
export const MESSAGE_FLOW_LABELS: Record<string, { text: string; x: number; y: number; width: number }> = {
  MF1: { text: 'Đơn + minh chứng (trực tuyến)', x: 338, y: 215, width: 236 },
  MF2: { text: 'Thông báo hồ sơ chưa hợp lệ', x: 768, y: 160, width: 228 },
  MF3: { text: 'Thông báo từ chối bảo lưu', x: 1598, y: 160, width: 200 },
  MF4: { text: 'Quyết định đã ký số', x: 2128, y: 215, width: 168 },
};

export function getNodeDimensions(type: string): { width: number; height: number; rx?: number } {
  switch (type) {
    case 'serviceTask':
    case 'sendTask':
    case 'businessRuleTask':
    case 'userTask':
      return NODE_DIMS.task;
    case 'gatewayXor':
    case 'gatewayAnd':
      return NODE_DIMS.gateway;
    case 'startPlain':
    case 'startMessage':
    case 'endNone':
      return NODE_DIMS.event;
    case 'boundaryTimer':
      return NODE_DIMS.boundaryTimer;
    case 'dataObject':
      return NODE_DIMS.dataObject;
    case 'dataStore':
      return NODE_DIMS.dataStore;
    default:
      return { width: 40, height: 40 };
  }
}

export function getNodePort(nodeId: string, side: 'top' | 'bottom' | 'left' | 'right', nodeType?: string): Point {
  const coord = NODE_COORDS[nodeId];
  if (!coord) return { x: 0, y: 0 };
  const dims = getNodeDimensions(nodeType || 'serviceTask');
  const halfW = dims.width / 2;
  const halfH = dims.height / 2;

  switch (side) {
    case 'left':
      return { x: coord.x - halfW, y: coord.y };
    case 'right':
      return { x: coord.x + halfW, y: coord.y };
    case 'top':
      return { x: coord.x, y: coord.y - halfH };
    case 'bottom':
      return { x: coord.x, y: coord.y + halfH };
  }
}

export function computeEdgePath(fromId: string, toId: string, fromType?: string, toType?: string): string {
  const fromCoord = NODE_COORDS[fromId];
  const toCoord = NODE_COORDS[toId];
  if (!fromCoord || !toCoord) return '';

  const key = `${fromId}->${toId}`;
  const waypoints = EDGE_WAYPOINTS[key];

  let startPort: Point;
  let endPort: Point;

  // Decide connection ports based on geometry & waypoints
  if (waypoints && waypoints.length > 0) {
    const firstWp = waypoints[0];
    const lastWp = waypoints[waypoints.length - 1];

    // Start port
    if (Math.abs(firstWp.x - fromCoord.x) < 2) {
      startPort = getNodePort(fromId, firstWp.y > fromCoord.y ? 'bottom' : 'top', fromType);
    } else {
      startPort = getNodePort(fromId, firstWp.x > fromCoord.x ? 'right' : 'left', fromType);
    }

    // End port
    if (Math.abs(lastWp.x - toCoord.x) < 2) {
      endPort = getNodePort(toId, lastWp.y > toCoord.y ? 'bottom' : 'top', toType);
    } else {
      endPort = getNodePort(toId, lastWp.x > toCoord.x ? 'right' : 'left', toType);
    }

    const points = [startPort, ...waypoints, endPort];
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }

  // Vertical straight connection (e.g. Message Flows MF1, MF2, MF3, MF4 or Associations)
  if (Math.abs(fromCoord.x - toCoord.x) < 5) {
    const fromBottom = fromCoord.y < toCoord.y;
    startPort = getNodePort(fromId, fromBottom ? 'bottom' : 'top', fromType);
    endPort = getNodePort(toId, fromBottom ? 'top' : 'bottom', toType);
    return `M ${startPort.x} ${startPort.y} L ${endPort.x} ${endPort.y}`;
  }

  // Horizontal connection
  startPort = getNodePort(fromId, fromCoord.x < toCoord.x ? 'right' : 'left', fromType);
  endPort = getNodePort(toId, fromCoord.x < toCoord.x ? 'left' : 'right', toType);

  if (Math.abs(startPort.y - endPort.y) < 5) {
    // Pure straight horizontal line
    return `M ${startPort.x} ${startPort.y} L ${endPort.x} ${endPort.y}`;
  }

  // Orthogonal step
  const midX = (startPort.x + endPort.x) / 2;
  return `M ${startPort.x} ${startPort.y} L ${midX} ${startPort.y} L ${midX} ${endPort.y} L ${endPort.x} ${endPort.y}`;
}
