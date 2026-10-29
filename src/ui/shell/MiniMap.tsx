import React from 'react';
import { BpmnMap } from '../map/BpmnMap';
import { usePlaybackStore } from '../../store/playback';
import { useAppStore } from '../../store/useApp';

export const MiniMap: React.FC = () => {
  const mapState = usePlaybackStore((s) => s.mapState);
  const toggleFullscreen = useAppStore((s) => s.toggleMapFullscreen);
  const miniMapVisible = useAppStore((s) => s.miniMapVisible);

  if (!miniMapVisible) return null;

  return (
    <div
      onClick={toggleFullscreen}
      className="hud-minimap"
      title="Bấm hoặc gõ 'B' để mở bản đồ BPMN toàn màn hình (Phím 'N' ẩn/hiện)"
    >
      <div
        style={{
          height: 24,
          backgroundColor: 'var(--desk-900)',
          borderBottom: '1px solid var(--desk-700)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px',
          color: 'var(--paper-dim)',
          fontFamily: 'var(--font-hud)',
          fontSize: '13px',
        }}
      >
        <span>BẢN ĐỒ BPMN (X-RAY)</span>
        <span style={{ color: 'var(--amber)' }}>[B ⛶ / N ẨN]</span>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <BpmnMap mapState={mapState} compact={true} />
      </div>
    </div>
  );
};
