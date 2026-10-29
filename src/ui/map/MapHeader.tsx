import React from 'react';
import { PaperMapIcon } from './PaperMapIcon';
import { MapControls, MapControlsProps } from './MapControls';

export type MapHeaderProps = MapControlsProps;

export const MapHeader: React.FC<MapHeaderProps> = ({
  cameraMode,
  setCameraMode,
  showEventLog,
  setShowEventLog,
}) => {
  return (
    <header
      style={{
        height: 64,
        minHeight: 64,
        maxHeight: 64,
        backgroundColor: 'var(--desk-900)',
        borderBottom: '2px solid var(--desk-700)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 18px',
        zIndex: 20,
        gap: '12px',
        boxShadow: '0 3px 10px rgba(0, 0, 0, 0.45)',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        overflowX: 'auto',
        overflowY: 'hidden',
      }}
    >
      {/* KHỐI TRÁI: Nhận diện quy trình + Biểu tượng bản đồ giấy thủ công + Badge thiết kế To-Be */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <PaperMapIcon size={24} />

        <span
          style={{
            fontFamily: 'var(--font-paper)',
            fontWeight: 'bold',
            fontSize: '15px',
            color: 'var(--paper)',
            letterSpacing: '0.5px',
          }}
        >
          BẢN ĐỒ BPMN 2.0 TO-BE
        </span>

        <span
          style={{
            padding: '2px 7px',
            backgroundColor: 'rgba(217, 164, 65, 0.12)',
            border: '1px solid var(--amber)',
            color: 'var(--amber)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '11px',
            fontFamily: 'var(--font-paper)',
            fontWeight: 'bold',
            letterSpacing: '0.3px',
          }}
          title="Thiết kế quy trình To-Be: 8/11 tác vụ tự động hóa (72,7%), giảm 88% thời gian xử lý so với As-Is"
        >
          8/11 TỰ ĐỘNG (72,7%)
        </span>
      </div>

      {/* KHỐI PHẢI: Thanh công cụ điều khiển (Phân nhóm rõ ràng) */}
      <MapControls
        cameraMode={cameraMode}
        setCameraMode={setCameraMode}
        showEventLog={showEventLog}
        setShowEventLog={setShowEventLog}
      />
    </header>
  );
};
