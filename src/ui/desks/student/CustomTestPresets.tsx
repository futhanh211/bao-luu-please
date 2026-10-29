import React from 'react';
import { CUSTOM_PRESETS, CustomPreset } from '../../../data/customTestData';

interface Props {
  selectedPresetId: string;
  submitted: boolean;
  onSelectPreset: (preset: CustomPreset) => void;
}

export const CustomTestPresets: React.FC<Props> = ({
  selectedPresetId,
  submitted,
  onSelectPreset,
}) => {
  const currentPreset = CUSTOM_PRESETS.find((p) => p.id === selectedPresetId);

  const activeCalloutColor = currentPreset
    ? currentPreset.tagColor === 'green'
      ? 'var(--stamp-green)'
      : currentPreset.tagColor === 'red'
        ? 'var(--stamp-red)'
        : '#b87707'
    : 'var(--amber)';

  return (
    <div>
      <div className="custom-test-presets-title">
        Kịch bản mẫu nhanh (bấm 1 chạm để nạp tức thì):
      </div>

      <div className="custom-test-presets-row">
        {CUSTOM_PRESETS.map((p) => {
          const active = selectedPresetId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              disabled={submitted}
              data-active={active}
              data-color={p.tagColor}
              className="custom-test-preset-btn"
              onClick={() => onSelectPreset(p)}
              title={p.description}
            >
              {p.shortLabel}
            </button>
          );
        })}
      </div>

      {/* Callout mô tả kịch bản */}
      <div className="custom-test-callout" style={{ borderLeftColor: activeCalloutColor }}>
        {currentPreset ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
              <strong style={{ color: 'var(--ink)' }}>{currentPreset.label}</strong>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 2,
                  backgroundColor:
                    currentPreset.tagColor === 'green'
                      ? 'var(--wash-green)'
                      : currentPreset.tagColor === 'red'
                        ? 'var(--wash-red)'
                        : 'var(--wash-amber)',
                  color:
                    currentPreset.tagColor === 'green'
                      ? 'var(--stamp-green)'
                      : currentPreset.tagColor === 'red'
                        ? 'var(--stamp-red)'
                        : '#7a4b00',
                }}
              >
                Kết quả dự kiến: {currentPreset.expectedOutcome}
              </span>
            </div>
            <div style={{ color: 'var(--ink-soft)' }}>{currentPreset.description}</div>
          </>
        ) : (
          <div style={{ color: 'var(--ink-soft)' }}>
            <strong style={{ color: 'var(--ink)' }}>🛠 Dữ liệu tùy biến:</strong> Bạn đang chỉnh tay các thông số. Hãy bấm nút <em>"ÁP DỤNG & ĐỒNG BỘ VÀO CSDL"</em> ở dưới để cập nhật.
          </div>
        )}
      </div>
    </div>
  );
};
