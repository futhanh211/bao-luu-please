import React from 'react';
import { sfx } from '../audio/sfx';

export interface StampChoice {
  label: string;
  color: 'green' | 'red';
  outcome: string;
}

interface StampControlsProps {
  choices: StampChoice[];
  disabled: boolean;
  onPick: (choice: StampChoice) => void;
  hint?: string;
}

/**
 * Bảng điều khiển quyết định thẩm tra của cán bộ.
 * Nút bấm hành chính trang trọng, rõ ràng, loại bỏ hoàn toàn object con dấu mộc.
 */
export const StampControls: React.FC<StampControlsProps> = ({
  choices,
  disabled,
  onPick,
  hint,
}) => {
  return (
    <div className="decision-stand-tray">
      <div className="decision-stand-header">
        <span className="decision-stand-title">QUYẾT ĐỊNH CỦA CÁN BỘ</span>
        <span className="decision-stand-sub">Chọn kết quả xử lý ca</span>
      </div>

      <div className="decision-stand-grid">
        {choices.map((choice) => (
          <button
            key={choice.outcome}
            type="button"
            className={`decision-btn decision-btn-${choice.color}`}
            disabled={disabled}
            onClick={() => onPick(choice)}
            onMouseEnter={() => {
              if (!disabled) sfx.play('paper_slide');
            }}
            aria-label={`Quyết định ${choice.label}`}
          >
            <span className="decision-btn-icon">
              {choice.color === 'green' ? '✓' : '✕'}
            </span>
            <span className="decision-btn-label">{choice.label}</span>
          </button>
        ))}
      </div>

      {hint && <div className="decision-stand-hint">{hint}</div>}
    </div>
  );
};
