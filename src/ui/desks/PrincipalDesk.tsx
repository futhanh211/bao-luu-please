import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../store/useApp';
import { usePlaybackStore } from '../../store/playback';
import { MOTION } from '../motion';
import { sfx } from '../audio/sfx';
import { DeskEmpty } from './DeskEmpty';
import { useCaseView } from './useCaseView';
import { DecisionDraft } from './principal/DecisionDraft';
import { SigningPanel } from './principal/SigningPanel';
import { SigningAction, SigningState, nextSigningState } from './principal/signingMachine';
import { PrincipalPortalResult } from './principal/PrincipalPortalResult';

const DEFAULT_SIGNER = 'PGS.TS. Đoàn Ngọc Phi Anh - Phó Hiệu trưởng';

export const PrincipalDesk: React.FC = () => {
  const view = useCaseView('principal');
  const completeUserTask = usePlaybackStore((s) => s.completeUserTask);
  const speed = useAppStore((s) => s.speed);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const sessionMode = useAppStore((s) => s.sessionMode);

  const engine = view.engine;
  const doc = engine?.state.decisionDoc;
  const signerName = view.scenario?.directorPlan.principalSigner ?? DEFAULT_SIGNER;

  const [signing, setSigning] = useState<SigningState>('idle');
  const resolved = useRef(false);

  useEffect(() => {
    setSigning('idle');
    resolved.current = false;
  }, [engine]);

  useEffect(() => {
    if (signing !== 'tokenInserted') return undefined;
    const delay = reducedMotion ? 0 : 600 / speed;
    const timer = setTimeout(() => {
      setSigning((s) => nextSigningState(s, 'enterPin'));
    }, delay);
    return () => clearTimeout(timer);
  }, [signing, speed, reducedMotion]);

  useEffect(() => {
    if (signing !== 'signing') return undefined;
    sfx.playFountainPen();
    const delay = reducedMotion ? 0 : MOTION.signatureDrawMs / speed;
    const timer = setTimeout(() => {
      setSigning((s) => nextSigningState(s, 'finish'));
    }, delay);
    return () => clearTimeout(timer);
  }, [signing, speed, reducedMotion]);

  const handleAction = useCallback((action: SigningAction) => {
    if (action === 'insertToken') sfx.playDongleInsert();
    if (action === 'confirm') sfx.playCrt();
    setSigning((s) => nextSigningState(s, action));
  }, []);

  const handleStampLanded = useCallback(() => {
    if (resolved.current) return;
    resolved.current = true;
    void completeUserTask('T9', { signerName });
  }, [completeUserTask, signerName]);

  const header = (
    <div className="desk-head">
      <div>
        <h1 className="desk-title">Bàn Ban Giám hiệu</h1>
        <p className="desk-sub">
          Lane L4 · Kiểm tra dự thảo máy điền và ký số (T9) · NGÀY {view.day}
        </p>
      </div>
      <div className="desk-toolbar">
        <span className="desk-hint">Các trường nền vàng do T8 điền tự động</span>
      </div>
    </div>
  );

  if (view.phase === 'done' && doc) {
    if (sessionMode === 'portal') {
      return (
        <PrincipalPortalResult
          doc={doc}
          signerName={signerName}
          caseCode={engine?.state.caseId ?? 'BL-2026-88'}
          day={view.day}
        />
      );
    }

    return (
      <div className="desk-page principal-page">
        {header}
        <div className="principal-grid">
          <DecisionDraft
            doc={doc}
            signing="signed"
            signerName={signerName}
            mode="decision"
            autoStamp={false}
          />
          <div className="signing-done">
            <div className="signing-kicker">ĐÃ HOÀN TẤT T9</div>
            <h3 className="signing-title">Quyết định đã ký số</h3>
            <p className="signing-sub">
              Hệ thống đã chuyển quyết định sang DO3 và gửi thông báo cho sinh viên.
            </p>
            <div className="signing-done-name">{doc.signerName ?? signerName}</div>
          </div>
        </div>
      </div>
    );
  }

  if (view.phase !== 'waiting' || !doc) {
    const reason = view.phase === 'waiting' ? 'upcoming' : view.phase;
    return <DeskEmpty deskName="Bàn Ban Giám hiệu" reason={reason} />;
  }

  return (
    <div className="desk-page principal-page">
      {header}
      <div className="principal-grid">
        <DecisionDraft
          doc={doc}
          signing={signing}
          signerName={signerName}
          mode="draft"
          autoStamp
          onStampLanded={handleStampLanded}
        />
        <SigningPanel state={signing} signerName={signerName} onAction={handleAction} />
      </div>
    </div>
  );
};
