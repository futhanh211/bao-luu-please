import React from 'react';
import { DEMO_STUDENT_PRESETS, DemoStudentPreset } from '../../../data/loginPresets';
import { sfx } from '../../audio/sfx';

interface Props {
  onSelectPreset: (preset: DemoStudentPreset) => void;
}

export const StudentPresetLogin: React.FC<Props> = ({ onSelectPreset }) => {
  const getBadgeStyle = (scenarioId: string) => {
    switch (scenarioId) {
      case 's1':
        return { bg: 'var(--wash-green)', color: 'var(--stamp-green)', border: '1px solid var(--stamp-green)', label: '✓ Thành công' };
      case 's2':
        return { bg: 'var(--wash-amber)', color: '#b45309', border: '1px solid var(--amber)', label: '⚠️ Trả đơn T1' };
      case 's3':
        return { bg: 'var(--wash-red)', color: 'var(--stamp-red)', border: '1px solid var(--stamp-red)', label: '✗ Từ chối R3' };
      case 's4':
        return { bg: 'rgba(21, 101, 192, 0.1)', color: '#1565c0', border: '1px solid #1565c0', label: '⏳ Nhắc nhở T6' };
      case 's5':
        return { bg: 'var(--wash-red)', color: 'var(--stamp-red)', border: '1px solid var(--stamp-red)', label: '🔍 CTSV từ chối' };
      default:
        return { bg: 'var(--paper-dim)', color: 'var(--ink)', border: '1px solid var(--paper-line)', label: 'Kịch bản' };
    }
  };

  const handleSelect = (preset: DemoStudentPreset) => {
    sfx.play('stamp');
    onSelectPreset(preset);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
          Kịch bản mẫu phục vụ thuyết trình các rẽ nhánh quy trình BPMN 2.0:
        </div>
        <span
          style={{
            fontSize: '9.5px',
            fontWeight: 'bold',
            padding: '2px 6px',
            borderRadius: '2px',
            backgroundColor: 'var(--wash-amber)',
            color: '#b45309',
            border: '1px solid var(--amber)',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}
        >
          Dữ liệu mẫu
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '310px', overflowY: 'auto', paddingRight: '4px' }}>
        {DEMO_STUDENT_PRESETS.map((preset) => {
          const badge = getBadgeStyle(preset.scenarioId);

          return (
            <div
              key={preset.mssv}
              onClick={() => handleSelect(preset)}
              style={{
                padding: '10px 12px',
                backgroundColor: 'rgba(0, 0, 0, 0.03)',
                border: '1.5px solid var(--paper-line)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'var(--cursor-pointer)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--amber)';
                e.currentTarget.style.backgroundColor = 'rgba(217, 119, 6, 0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--paper-line)';
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.03)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--ink)' }}>
                  {preset.scenarioCode} · {preset.name}
                </div>
                <span style={{ fontSize: '10.5px', fontWeight: 'bold', padding: '1px 6px', borderRadius: '2px', backgroundColor: badge.bg, color: badge.color, border: badge.border }}>
                  {badge.label}
                </span>
              </div>

              <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)' }}>
                {preset.mssv} · {preset.className} ({preset.faculty})
              </div>

              <div style={{ fontSize: '11px', color: 'var(--ink-soft)', lineHeight: 1.35, marginTop: '2px' }}>
                {preset.desc}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
