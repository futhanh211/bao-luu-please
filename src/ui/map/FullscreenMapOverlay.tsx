import React, { useState, useEffect, useRef } from 'react';
import { BpmnMap } from './BpmnMap';
import { MapHeader } from './MapHeader';
import { usePlaybackStore } from '../../store/playback';
import { useAppStore } from '../../store/useApp';
import { CaptionCard } from '../shell/CaptionCard';
import { EventLog } from '../shell/EventLog';
import { NODE_COORDS } from './layout';

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const FULL_BOX: Box = { x: 0, y: 0, w: 2360, h: 1000 };

function computeFollowBox(nodeIds: string[]): Box {
  if (nodeIds.length === 0) return FULL_BOX;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const id of nodeIds) {
    const c = NODE_COORDS[id];
    if (c) {
      minX = Math.min(minX, c.x - 80);
      maxX = Math.max(maxX, c.x + 80);
      minY = Math.min(minY, c.y - 40);
      maxY = Math.max(maxY, c.y + 40);
    }
  }

  if (!isFinite(minX)) return FULL_BOX;

  const pad = 140;
  const rawW = maxX - minX + pad * 2;
  const rawH = maxY - minY + pad * 2;
  const aspect = 2.36;

  let targetW = Math.max(800, rawW);
  let targetH = targetW / aspect;

  if (targetH < rawH) {
    targetH = rawH;
    targetW = targetH * aspect;
  }

  targetW = Math.min(2360, Math.max(800, targetW));
  targetH = targetW / aspect;

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const x = Math.max(0, Math.min(2360 - targetW, cx - targetW / 2));
  const y = Math.max(0, Math.min(1000 - targetH, cy - targetH / 2));

  return { x, y, w: targetW, h: targetH };
}

export const FullscreenMapOverlay: React.FC = () => {
  const mapFullscreen = useAppStore((s) => s.mapFullscreen);
  const speed = useAppStore((s) => s.speed);
  const reducedMotion = useAppStore((s) => s.reducedMotion);

  const {
    mapState,
  } = usePlaybackStore();

  const [showEventLog, setShowEventLog] = useState(false);
  const [cameraMode, setCameraMode] = useState<'follow' | 'overview'>('follow');
  const [currentBox, setCurrentBox] = useState<Box>(FULL_BOX);
  const animRef = useRef<number | null>(null);
  const boxRef = useRef<Box>(FULL_BOX);
  boxRef.current = currentBox;

  // Key V toggles Camera Mode
  useEffect(() => {
    if (!mapFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        setCameraMode((m) => (m === 'follow' ? 'overview' : 'follow'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mapFullscreen]);

  // Target box calculation & smooth camera transition
  useEffect(() => {
    if (!mapFullscreen) return;

    let target: Box = FULL_BOX;
    if (cameraMode === 'follow' && !mapState.caseEnded) {
      const activeIds = Object.entries(mapState.nodeStates)
        .filter(([_, st]) => st === 'active' || st === 'waiting')
        .map(([id]) => id);
      if (activeIds.length === 0 && mapState.activeNodeId) {
        activeIds.push(mapState.activeNodeId);
      }
      target = computeFollowBox(activeIds);
    }

    if (reducedMotion) {
      setCurrentBox(target);
      return;
    }

    const duration = 600 / speed;
    const startBox = { ...boxRef.current };
    const startTime = performance.now();

    if (animRef.current) cancelAnimationFrame(animRef.current);

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(1, elapsed / duration);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);

      const nextBox: Box = {
        x: startBox.x + (target.x - startBox.x) * ease,
        y: startBox.y + (target.y - startBox.y) * ease,
        w: startBox.w + (target.w - startBox.w) * ease,
        h: startBox.h + (target.h - startBox.h) * ease,
      };

      setCurrentBox(nextBox);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [cameraMode, mapState.caseEnded, mapState.activeNodeId, mapState.nodeStates, mapFullscreen, speed, reducedMotion]);

  if (!mapFullscreen) return null;

  const viewBoxString = `${currentBox.x.toFixed(1)} ${currentBox.y.toFixed(1)} ${currentBox.w.toFixed(1)} ${currentBox.h.toFixed(1)}`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: '#171c19',
        display: 'flex',
        flexDirection: 'column',
        color: 'var(--paper)',
        overflow: 'hidden',
      }}
    >
      {/* Top Header & Controls */}
      <MapHeader
        cameraMode={cameraMode}
        setCameraMode={setCameraMode}
        showEventLog={showEventLog}
        setShowEventLog={setShowEventLog}
      />

      {/* SVG Canvas with Camera ViewBox */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <BpmnMap mapState={mapState} compact={false} viewBox={viewBoxString} />
        <CaptionCard floating />
        <EventLog isOpen={showEventLog} onClose={() => setShowEventLog(false)} />
      </div>
    </div>
  );
};
