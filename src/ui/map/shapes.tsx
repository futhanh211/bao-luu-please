import React from 'react';
import { NodeLayout, NODE_DIMS } from './layout';

export type NodeStatus = 'idle' | 'active' | 'waiting' | 'done' | 'skipped';

interface ShapeProps {
  node: NodeLayout;
  status: NodeStatus;
  compact?: boolean;
  onClick?: () => void;
  isStoreFlashing?: boolean;
  visible?: boolean;
}

export function wrapTaskTitle(text: string): { lines: string[]; fontSize: number; lineSpacing: number } {
  const words = text.split(' ');
  const tryWrap = (maxChars: number): string[] => {
    const res: string[] = [];
    let cur = '';
    for (const w of words) {
      if (!cur) {
        cur = w;
      } else if ((cur + ' ' + w).length <= maxChars) {
        cur += ' ' + w;
      } else {
        res.push(cur);
        cur = w;
      }
    }
    if (cur) res.push(cur);
    return res;
  };

  // Try 15px first (approx 17 chars / line)
  let lines = tryWrap(17);
  let fontSize = 15;
  let lineSpacing = 16;

  // Fallback to 13px if > 3 lines or line too wide
  if (lines.length > 3 || lines.some((l) => l.length > 18)) {
    lines = tryWrap(20);
    fontSize = 13;
    lineSpacing = 14;
  }

  if (lines.length > 3) {
    lines = [lines[0], lines[1], lines.slice(2).join(' ')];
  }

  return { lines, fontSize, lineSpacing };
}

export const TaskShape: React.FC<ShapeProps> = ({ node, status, compact, onClick }) => {
  const { width, height, rx } = NODE_DIMS.task;
  const x = node.x - width / 2;
  const y = node.y - height / 2;

  const renderIcon = () => {
    const trans = `translate(${x + 6}, ${y + 6}) scale(0.75)`;
    switch (node.type) {
      case 'serviceTask':
        return (
          <path
            d="M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 13a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5V19a2 2 0 11-4 0v-.2a1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H4a2 2 0 110-4h.2a1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3h.1a1.6 1.6 0 001-1.5V4a2 2 0 114 0v.2a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8v.1a1.6 1.6 0 001.5 1h.2a2 2 0 110 4h-.2a1.6 1.6 0 00-1.5 1z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            transform={trans}
          />
        );
      case 'sendTask':
        return (
          <path
            d="M3 5h18a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V6a1 1 0 011-1zm0 2l9 6 9-6"
            fill="currentColor"
            stroke="none"
            transform={`translate(${x + 6}, ${y + 7}) scale(0.75)`}
          />
        );
      case 'businessRuleTask':
        return (
          <path
            d="M3 4h18v16H3V4zm0 5h18M3 14h18M9 4v16M15 4v16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            transform={trans}
          />
        );
      case 'userTask':
        return (
          <path
            d="M16 19v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M10 9a4 4 0 100-8 4 4 0 000 8z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            transform={`translate(${x + 7}, ${y + 6}) scale(0.75)`}
          />
        );
      default:
        return null;
    }
  };

  const getColors = () => {
    switch (status) {
      case 'active':
        return { fill: '#344738', stroke: 'var(--amber)', strokeWidth: 3, text: '#ffffff' };
      case 'waiting':
        return { fill: '#4a3d24', stroke: 'var(--amber)', strokeWidth: 2.5, text: '#ffffff' };
      case 'done':
        return { fill: '#243a2c', stroke: 'var(--stamp-green)', strokeWidth: 2, text: '#d9e8dc' };
      case 'skipped':
        return { fill: '#1d211e', stroke: '#444c45', strokeWidth: 1, text: '#647066' };
      default:
        // Idle contrast heightened for clear visibility on dark background & mini-map
        return { fill: '#252d27', stroke: '#758679', strokeWidth: compact ? 2 : 1.8, text: '#d6e2d8' };
    }
  };

  const colors = getColors();
  const { lines, fontSize, lineSpacing } = wrapTaskTitle(node.name);
  const yCenter = y + 46;

  return (
    <g
      id={`bpmn-node-${node.id}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'var(--cursor-pointer)' : 'var(--cursor-default)', transition: 'all 0.25s ease' }}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={rx}
        ry={rx}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth={colors.strokeWidth}
        filter={status === 'active' ? 'drop-shadow(0 0 6px rgba(217,164,65,0.7))' : undefined}
      />

      {renderIcon()}

      {!compact && (
        <text
          x={node.x}
          textAnchor="middle"
          fill={colors.text}
          fontSize={fontSize}
          fontFamily="var(--font-read)"
          fontWeight={status === 'active' ? 'bold' : 'normal'}
        >
          {lines.map((line, idx) => {
            const lineOffset =
              lines.length === 1
                ? 4
                : lines.length === 2
                ? (idx - 0.5) * lineSpacing + 4
                : (idx - 1) * lineSpacing + 4;
            return (
              <tspan key={idx} x={node.x} y={yCenter + lineOffset}>
                {line}
              </tspan>
            );
          })}
        </text>
      )}

      {status === 'waiting' && !compact && (
        <g transform={`translate(${node.x - 38}, ${y + height - 8})`}>
          <rect width="76" height="16" rx="3" fill="var(--amber)" />
          <text x="38" y="12" textAnchor="middle" fill="#000" fontSize="10" fontWeight="bold">
            CHỜ NGƯỜI
          </text>
        </g>
      )}

      {status === 'done' && (
        <g transform={`translate(${x + width - 16}, ${y + 6})`}>
          <circle cx="5" cy="5" r="7" fill="var(--stamp-green)" />
          <path d="M2.5 5.5l2 2 3.5-4" stroke="#fff" strokeWidth="1.5" fill="none" />
        </g>
      )}

      {status === 'skipped' && (
        <line x1={x + 4} y1={y + 4} x2={x + width - 4} y2={y + height - 4} stroke="#ff5555" strokeWidth="1.5" opacity="0.6" />
      )}
    </g>
  );
};

export const GatewayShape: React.FC<ShapeProps> = ({ node, status, compact, onClick }) => {
  const { width } = NODE_DIMS.gateway;
  const half = width / 2;
  const { x, y } = node;

  const strokeColor =
    status === 'active'
      ? 'var(--amber)'
      : status === 'done'
      ? 'var(--stamp-green)'
      : '#8c9c90';

  return (
    <g id={`bpmn-node-${node.id}`} onClick={onClick} style={{ cursor: onClick ? 'var(--cursor-pointer)' : 'var(--cursor-default)' }}>
      <path
        d={`M ${x} ${y - half} L ${x + half} ${y} L ${x} ${y + half} L ${x - half} ${y} Z`}
        fill="#262b27"
        stroke={strokeColor}
        strokeWidth={status === 'active' ? 3 : compact ? 2 : 1.8}
        filter={status === 'active' ? 'drop-shadow(0 0 6px rgba(217,164,65,0.7))' : undefined}
      />
      {node.type === 'gatewayXor' ? (
        <path d={`M ${x - 8} ${y - 8} L ${x + 8} ${y + 8} M ${x + 8} ${y - 8} L ${x - 8} ${y + 8}`} stroke={strokeColor} strokeWidth="2.5" />
      ) : (
        <path d={`M ${x} ${y - 10} L ${x} ${y + 10} M ${x - 10} ${y} L ${x + 10} ${y}`} stroke={strokeColor} strokeWidth="2.5" />
      )}
    </g>
  );
};

export const EventShape: React.FC<ShapeProps> = ({ node, status, compact, onClick }) => {
  const { r } = NODE_DIMS.event;
  const { x, y } = node;

  const isEnd = node.type === 'endNone';
  const isMessage = node.type === 'startMessage' || node.id.startsWith('SV_R');
  const strokeColor =
    status === 'active'
      ? 'var(--amber)'
      : status === 'done'
      ? 'var(--stamp-green)'
      : '#9aa99e';

  return (
    <g id={`bpmn-node-${node.id}`} onClick={onClick} style={{ cursor: onClick ? 'var(--cursor-pointer)' : 'var(--cursor-default)' }}>
      <circle
        cx={x}
        cy={y}
        r={r}
        fill="#242925"
        stroke={strokeColor}
        strokeWidth={isEnd ? 4 : compact ? 2 : 1.8}
        filter={status === 'active' ? 'drop-shadow(0 0 6px rgba(217,164,65,0.7))' : undefined}
      />

      {node.id.startsWith('SV_R') && (
        <circle cx={x} cy={y} r={r - 3} fill="none" stroke={strokeColor} strokeWidth="1.2" />
      )}

      {node.type === 'boundaryTimer' && (
        <>
          <circle cx={x} cy={y} r={r - 3} fill="none" stroke={strokeColor} strokeWidth="1.2" strokeDasharray="3 2" />
          <path d={`M ${x} ${y - 6} L ${x} ${y} L ${x + 5} ${y}`} stroke={strokeColor} strokeWidth="1.5" fill="none" />
        </>
      )}

      {isMessage && (
        <path
          d={`M ${x - 7} ${y - 5} h 14 v 10 h -14 z M ${x - 7} ${y - 5} l 7 5 l 7 -5`}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.2"
        />
      )}
    </g>
  );
};

export const DataObjectShape: React.FC<ShapeProps> = ({ node, visible = true }: ShapeProps & { visible?: boolean }) => {
  if (!visible) return null;
  const { width, height } = NODE_DIMS.dataObject;
  const x = node.x - width / 2;
  const y = node.y - height / 2;
  const fold = 8;

  return (
    <g id={`bpmn-node-${node.id}`}>
      <path
        d={`M ${x} ${y} L ${x + width - fold} ${y} L ${x + width} ${y + fold} L ${x + width} ${y + height} L ${x} ${y + height} Z`}
        fill="var(--paper)"
        stroke="#8f8872"
        strokeWidth="1.5"
      />
      <path d={`M ${x + width - fold} ${y} L ${x + width - fold} ${y + fold} L ${x + width} ${y + fold}`} fill="none" stroke="#8f8872" strokeWidth="1.2" />
      <text x={node.x} y={y + height + 16} textAnchor="middle" fill="#d8d0b6" fontSize="12" fontFamily="var(--font-paper)">
        {node.name}
      </text>
    </g>
  );
};

export const DataStoreShape: React.FC<ShapeProps> = ({ node, isStoreFlashing }) => {
  const { width, height } = NODE_DIMS.dataStore;
  const x = node.x - width / 2;
  const y = node.y - height / 2;
  const hCyl = 8;

  return (
    <g id={`bpmn-node-${node.id}`}>
      <path
        d={`M ${x} ${y + hCyl} v ${height - hCyl * 2} a ${width / 2} ${hCyl} 0 0 0 ${width} 0 v -${height - hCyl * 2} a ${width / 2} ${hCyl} 0 0 0 -${width} 0`}
        fill={isStoreFlashing ? '#3d6148' : '#2b332d'}
        stroke={isStoreFlashing ? 'var(--amber)' : '#748277'}
        strokeWidth={isStoreFlashing ? 2.5 : 1.5}
        filter={isStoreFlashing ? 'drop-shadow(0 0 8px rgba(217,164,65,0.8))' : undefined}
      />
      <ellipse cx={node.x} cy={y + hCyl} rx={width / 2} ry={hCyl} fill="#353f38" stroke={isStoreFlashing ? 'var(--amber)' : '#748277'} strokeWidth="1.2" />
      <text x={node.x} y={y + height + 16} textAnchor="middle" fill="#d8d0b6" fontSize="12" fontFamily="var(--font-paper)">
        {node.name}
      </text>
    </g>
  );
};
