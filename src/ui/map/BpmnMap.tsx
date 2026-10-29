import React, { useEffect, useState } from 'react';
import {
  VIEW_BOX,
  POOLS,
  LANES,
  NODE_COORDS,
  computeEdgePath,
  GATEWAY_LABELS,
  BRANCH_LABELS,
  MESSAGE_FLOW_LABELS,
} from './layout';
import { PROCESS_DEF } from '../../engine/process.def';
import {
  TaskShape,
  GatewayShape,
  EventShape,
  DataObjectShape,
  DataStoreShape,
} from './shapes';
import { MapDisplayState } from './mapState';
import { tokenAnimManager, AnimatedTokenItem } from './tokenAnim';

interface BpmnMapProps {
  mapState: MapDisplayState;
  compact?: boolean;
  viewBox?: string;
  onNodeClick?: (nodeId: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const BpmnMap: React.FC<BpmnMapProps> = ({
  mapState,
  compact = false,
  viewBox,
  onNodeClick,
  className = '',
  style = {},
}) => {
  const [animatedTokens, setAnimatedTokens] = useState<AnimatedTokenItem[]>([]);

  useEffect(() => {
    const unsub = tokenAnimManager.subscribe((tokens) => {
      setAnimatedTokens([...tokens]);
    });
    return () => {
      unsub();
    };
  }, []);

  const nodeMap = new Map(PROCESS_DEF.nodes.map((n) => [n.id, n]));
  const currentViewBox = viewBox || `0 0 ${VIEW_BOX.width} ${VIEW_BOX.height}`;

  return (
    <div
      className={`bpmn-map-container ${className}`}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: '#1b201c',
        overflow: 'hidden',
        userSelect: 'none',
        ...style,
      }}
    >
      <svg
        viewBox={currentViewBox}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#8f9e93" />
          </marker>
          <marker id="arrow-traversed" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--amber)" />
          </marker>
          <marker id="message-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 1 2 L 8 5 L 1 8 z" fill="#1b201c" stroke="var(--amber)" strokeWidth="1.2" />
          </marker>
          <marker id="message-circle" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <circle cx="5" cy="5" r="3" fill="#1b201c" stroke="var(--amber)" strokeWidth="1.2" />
          </marker>
          <pattern id="bpmn-blueprint-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#2a332c" strokeWidth="0.6" strokeDasharray="2 3" />
          </pattern>
        </defs>

        {/* Blueprint grid overlay */}
        <rect x={0} y={0} width="100%" height="100%" fill="url(#bpmn-blueprint-grid)" opacity={0.3} pointerEvents="none" />

        {/* 1. Pools & Lanes Background */}
        {POOLS.map((pool) => (
          <g key={pool.id}>
            <rect x={0} y={pool.y} width={28} height={pool.height} fill="#141815" stroke="#3b453e" strokeWidth="1.5" />
            <rect x={28} y={pool.y} width={28} height={pool.height} fill="#181e19" stroke="#3b453e" strokeWidth="1" />
            <rect x={0} y={pool.y} width={pool.width} height={pool.height} fill="none" stroke="#3b453e" strokeWidth="2" />
            {!compact && (
              <text
                x={14}
                y={pool.y + pool.height / 2}
                textAnchor="middle"
                fill="#a0b0a4"
                fontSize="15"
                fontWeight="bold"
                fontFamily="var(--font-read)"
                transform={`rotate(-90, 14, ${pool.y + pool.height / 2})`}
                letterSpacing="2px"
              >
                {pool.name}
              </text>
            )}
          </g>
        ))}

        {LANES.map((lane) => (
          <g key={lane.id}>
            <rect x={lane.x} y={lane.y} width={lane.width} height={lane.height} fill={lane.colorVar} fillOpacity={0.12} stroke="#363f39" strokeWidth="1" />
            {!compact && (
              <g>
                <title>{lane.name}</title>
                <text
                  x={42}
                  y={lane.y + lane.height / 2}
                  textAnchor="middle"
                  fill="#c8d6cb"
                  fontSize="14"
                  fontWeight="bold"
                  fontFamily="var(--font-read)"
                  transform={`rotate(-90, 42, ${lane.y + lane.height / 2})`}
                >
                  {lane.shortName}
                </text>
              </g>
            )}
          </g>
        ))}

        {/* 2. Edges (Sequence Flows, Message Flows, Associations) */}
        {PROCESS_DEF.edges.map((edge) => {
          const fromNode = nodeMap.get(edge.from);
          const toNode = nodeMap.get(edge.to);
          const d = computeEdgePath(edge.from, edge.to, fromNode?.type, toNode?.type);
          if (!d) return null;

          const isTraversed = mapState.edgeStates[edge.id] === 'traversed';
          const isMessage = edge.type === 'message';
          const isAssoc = edge.type === 'association';

          const strokeColor = isTraversed ? 'var(--amber)' : isMessage ? 'var(--amber)' : isAssoc ? '#5e6b62' : '#859489';
          const strokeWidth = isTraversed ? 2.5 : isMessage ? 2 : 1.5;
          const strokeDash = isMessage ? '6 4' : isAssoc ? '2 3' : 'none';
          const markerEnd = isMessage ? 'url(#message-arrow)' : isAssoc ? 'none' : isTraversed ? 'url(#arrow-traversed)' : 'url(#arrow)';
          const markerStart = isMessage ? 'url(#message-circle)' : 'none';

          return (
            <g key={edge.id} id={`bpmn-edge-${edge.id}`}>
              <path
                id={`path-${edge.id}`}
                d={d}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDash}
                markerEnd={markerEnd}
                markerStart={markerStart}
                style={{ transition: 'stroke 0.3s ease' }}
              />
            </g>
          );
        })}

        {/* 3. Branch Labels ("Có" / "Không") */}
        {!compact &&
          Object.entries(BRANCH_LABELS).map(([edgeId, lbl]) => {
            const isTraversed = mapState.edgeStates[edgeId] === 'traversed';
            return (
              <text
                key={edgeId}
                x={lbl.x}
                y={lbl.y}
                fill={isTraversed ? 'var(--amber)' : '#c0ccc2'}
                fontSize="14"
                fontFamily="var(--font-read)"
                fontWeight="bold"
              >
                {lbl.text}
              </text>
            );
          })}

        {/* 4. Gateway Decision Labels (Strictly below G1 & G4 at y+40) */}
        {!compact &&
          Object.entries(GATEWAY_LABELS).map(([gwId, lbl]) => (
            <text
              key={gwId}
              x={lbl.x}
              y={lbl.y}
              textAnchor="middle"
              fill="#d9e5dc"
              fontSize="14"
              fontFamily="var(--font-read)"
              fontWeight="bold"
            >
              {lbl.text}
            </text>
          ))}

        {/* 5. Message Flow Labels (Exactly ONE pill per Message Flow) */}
        {!compact &&
          Object.entries(MESSAGE_FLOW_LABELS).map(([mfId, lbl]) => (
            <g key={mfId} id={`mf-label-${mfId}`}>
              <rect
                x={lbl.x}
                y={lbl.y - 15}
                width={lbl.width}
                height={24}
                rx={4}
                fill="#18201b"
                fillOpacity={0.88}
                stroke="#4d5c50"
                strokeWidth={1}
              />
              <text
                x={lbl.x + 8}
                y={lbl.y + 2}
                fill="var(--amber)"
                fontSize="14"
                fontFamily="var(--font-read)"
                fontWeight="bold"
              >
                {lbl.text}
              </text>
            </g>
          ))}

        {/* 6. Process Nodes */}
        {PROCESS_DEF.nodes.map((node) => {
          const coord = NODE_COORDS[node.id];
          if (!coord) return null;

          const nodeLayout = {
            id: node.id,
            name: node.name,
            type: node.type,
            lane: node.lane,
            pool: node.pool,
            x: coord.x,
            y: coord.y,
            width: 0,
            height: 0,
          };

          const status = mapState.nodeStates[node.id] || 'idle';
          const onClick = onNodeClick ? () => onNodeClick(node.id) : undefined;

          switch (node.type) {
            case 'serviceTask':
            case 'sendTask':
            case 'businessRuleTask':
            case 'userTask':
              return <TaskShape key={node.id} node={nodeLayout} status={status} compact={compact} onClick={onClick} />;
            case 'gatewayXor':
            case 'gatewayAnd':
              return <GatewayShape key={node.id} node={nodeLayout} status={status} compact={compact} onClick={onClick} />;
            case 'startPlain':
            case 'startMessage':
            case 'endNone':
            case 'boundaryTimer':
              return <EventShape key={node.id} node={nodeLayout} status={status} compact={compact} onClick={onClick} />;
            case 'dataObject': {
              const isVisible = mapState.visibleDataObjects[node.id as 'DO1' | 'DO2' | 'DO3'];
              return <DataObjectShape key={node.id} node={nodeLayout} status={status} visible={compact ? false : isVisible} />;
            }
            case 'dataStore': {
              const isFlashing = mapState.flashingStores[node.id as 'DS1' | 'DS2'];
              return <DataStoreShape key={node.id} node={nodeLayout} status={status} isStoreFlashing={isFlashing} />;
            }
            default:
              return null;
          }
        })}

        {/* 7. Animated Moving Tokens & Envelopes */}
        {animatedTokens.map((t) => (
          <g key={t.id} transform={`translate(${t.x}, ${t.y})`} opacity={t.opacity} pointerEvents="none">
            {t.isEnvelope ? (
              <g transform="translate(-10, -8)">
                <rect width="20" height="15" rx="2" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1" />
                <path d="M 0 0 L 10 7 L 20 0" fill="none" stroke="var(--ink)" strokeWidth="1" />
              </g>
            ) : (
              <>
                <circle r="9" fill={t.color || 'var(--amber)'} opacity="0.4" />
                <circle r="5" fill="#ffffff" filter="drop-shadow(0 0 5px rgba(255,255,255,0.9))" />
              </>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
};
