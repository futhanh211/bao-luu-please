import React from 'react';
import { useAppStore } from '../../../store/useApp';
import { usePlaybackStore } from '../../../store/playback';
import { SigningAction, SigningState, SIGNING_STEP_LABELS } from './signingMachine';

interface SigningPanelProps {
  state: SigningState;
  signerName: string;
  onAction: (action: SigningAction) => void;
}

const STEPS: SigningState[] = ['idle', 'tokenInserted', 'pinEntered', 'signing', 'signed'];

/** Nghi thức ký số: cắm token → PIN tự điền → xác thực → vẽ chữ ký → dấu đỏ. */
export const SigningPanel: React.FC<SigningPanelProps> = ({ state, signerName, onAction }) => {
  const speed = useAppStore((s) => s.speed);
  const sessionMode = useAppStore((s) => s.sessionMode);
  const isCustomCase = usePlaybackStore((s) => s.isCustomCase);
  const isCustomFlow = isCustomCase || sessionMode === 'portal';
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const tokenMs = 600 / speed;

  const activeIndex = STEPS.indexOf(state);
  const pinVisible = activeIndex >= 2;

  return (
    <aside className="signing-panel">
      <div className="signing-kicker">NGHI THỨC KÝ SỐ · T9</div>
      <h3 className="signing-title">Ký số quyết định</h3>
      <p className="signing-sub">Người ký: {signerName}</p>

      <div
        className="usb-token"
        data-inserted={activeIndex >= 1 ? 'true' : 'false'}
        data-reduced={reducedMotion ? 'true' : 'false'}
        style={{ '--token-ms': `${tokenMs}ms` } as React.CSSProperties}
        aria-hidden="true"
      >
        <span className="usb-body">
          <span className="usb-led" />
          <span>PKI</span>
        </span>
        <span className="usb-plug" />
      </div>

      <ol className="signing-steps">
        {STEPS.slice(0, 4).map((step, i) => (
          <li key={step} data-state={i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'todo'}>
            <span className="signing-step-dot" />
            {SIGNING_STEP_LABELS[step]}
          </li>
        ))}
      </ol>

      {pinVisible && (
        <div className="pin-box">
          <div className="pin-label">Mã PIN (tự điền bởi token)</div>
          <div className="pin-dots">••••••</div>
        </div>
      )}

      {state === 'idle' && (
        <button type="button" className="desk-btn desk-btn-primary" onClick={() => onAction('insertToken')}>
          🔐 KÝ SỐ
        </button>
      )}
      {state === 'tokenInserted' && (
        <button type="button" className="desk-btn" disabled>
          Đang cắm USB token…
        </button>
      )}
      {state === 'pinEntered' && (
        <button type="button" className="desk-btn desk-btn-primary" onClick={() => onAction('confirm')}>
          XÁC THỰC
        </button>
      )}
      {state === 'signing' && (
        <button type="button" className="desk-btn" disabled>
          Đang ký số…
        </button>
      )}
      {state === 'signed' && (
        <button type="button" className="desk-btn desk-btn-done" disabled>
          ✓ Đã ký số
        </button>
      )}

      <p className="signing-note">
        {isCustomFlow
          ? 'Mô phỏng token & PIN. Dấu chỉ đóng sau khi nét chữ ký vẽ xong.'
          : 'Mô phỏng token & PIN. Dấu chỉ đóng sau khi nét chữ ký vẽ xong · dữ liệu giả lập.'}
      </p>
    </aside>
  );
};
