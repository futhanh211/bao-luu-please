import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ReviewerBrief } from '../../engine/types';
import { collectAnomalies, scoreInspection } from '../../data/inspection';
import { useAppStore } from '../../store/useApp';
import { usePlaybackStore } from '../../store/playback';
import { AiBriefPanel } from './AiBriefPanel';
import { DeskEmpty } from './DeskEmpty';
import { StampChoice, StampControls } from './StampControls';
import { useCaseView } from './useCaseView';
import { Stamp } from '../kit/Stamp';
import { sfx } from '../audio/sfx';
import { ApplicationCard } from './ctsv/ApplicationCard';
import { LookupCard } from './ctsv/LookupCard';
import { EvidencePaper } from './ctsv/EvidencePaper';
import { EvidenceZoom } from './ctsv/EvidenceZoom';
import { CtsvResult, InspectionResult } from './ctsv/InspectionResult';
import { CtsvPortalResult } from './ctsv/CtsvPortalResult';

const CTSV_STAMPS: StampChoice[] = [
  { label: 'HỢP LỆ', color: 'green', outcome: 'valid' },
  { label: 'KHÔNG HỢP LỆ', color: 'red', outcome: 'invalid' },
];

const EMPTY_MARKS: string[] = [];

interface PendingStamp {
  choice: StampChoice;
  marks: string[];
}

export const CtsvDesk: React.FC = () => {
  const view = useCaseView('ctsv');
  const completeUserTask = usePlaybackStore((s) => s.completeUserTask);
  const askReviewerBrief = usePlaybackStore((s) => s.askReviewerBrief);
  const recordHumanDecision = usePlaybackStore((s) => s.recordHumanDecision);
  const setCtsvMarks = usePlaybackStore((s) => s.setCtsvMarks);
  const sealCtsvInspection = usePlaybackStore((s) => s.sealCtsvInspection);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const sessionMode = useAppStore((s) => s.sessionMode);
  const isCustomCase = usePlaybackStore((s) => s.isCustomCase);
  const isCustomFlow = isCustomCase || sessionMode === 'portal';

  const engine = view.engine;
  const caseId = engine?.state.caseId ?? view.scenario?.code ?? 'case';
  const inspection = usePlaybackStore((s) => s.ctsvInspections[caseId]);
  const marks = inspection?.marks ?? EMPTY_MARKS;
  const result = inspection?.result ?? null;

  const form = engine?.state.form ?? view.scenario?.form;
  const evidence = engine?.state.evidence ?? [];
  const anomalies = React.useMemo(() => collectAnomalies(evidence), [evidence]);

  const [brief, setBrief] = useState<ReviewerBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<PendingStamp | null>(null);
  const [zoomId, setZoomId] = useState<string | null>(null);
  const resolved = useRef(false);

  useEffect(() => {
    setBrief(null);
    setLoading(false);
    setPending(null);
    setZoomId(null);
    resolved.current = false;
  }, [engine]);

  useEffect(() => {
    if (!zoomId) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomId]);

  const toggleMark = useCallback(
    (key: string) => {
      sfx.playPencilCircle();
      const next = marks.includes(key) ? marks.filter((k) => k !== key) : [...marks, key];
      setCtsvMarks(caseId, next);
    },
    [caseId, marks, setCtsvMarks]
  );

  const handleAsk = useCallback(async () => {
    setLoading(true);
    const b = await askReviewerBrief('ctsv');
    setBrief(b);
    setLoading(false);
  }, [askReviewerBrief]);

  const handleLanded = useCallback(() => {
    if (!pending || resolved.current) return;
    resolved.current = true;
    const choice = pending.choice;
    const score = scoreInspection(pending.marks, anomalies);
    const nextResult: CtsvResult = {
      outcome: choice.outcome as 'valid' | 'invalid',
      score,
      anomalies,
      markedKeys: pending.marks,
    };
    sealCtsvInspection(caseId, nextResult);
    if (brief) {
      recordHumanDecision('T5', choice.outcome, brief.suggestedDecision);
    }
    void completeUserTask('T5', choice.outcome);
  }, [anomalies, brief, caseId, completeUserTask, pending, recordHumanDecision, sealCtsvInspection]);

  const header = (
    <div className="desk-head">
      <div>
        <h1 className="desk-title">Bàn Phòng Công tác sinh viên</h1>
        <p className="desk-sub">
          Lane L3 · Soi lệch minh chứng và quyết định thẩm tra (T5) · NGÀY {view.day}
        </p>
      </div>
      <div className="desk-toolbar">
        <span className="desk-hint">Soi từng trường · <kbd>T</kbd>/<kbd>Shift+T</kbd> tua ngày</span>
      </div>
    </div>
  );

  if (view.phase === 'done') {
    if (sessionMode === 'portal') {
      return (
        <CtsvPortalResult
          result={result}
          form={form}
          evidence={evidence}
          caseCode={caseId}
          day={view.day}
        />
      );
    }

    return (
      <div className="desk-page">
        {header}
        {result ? (
          <InspectionResult result={result} />
        ) : (
          <DeskEmpty deskName="Bàn Phòng CTSV" reason="done" />
        )}
      </div>
    );
  }

  if (view.phase !== 'waiting' || !form) {
    const reason = view.phase === 'waiting' ? 'upcoming' : view.phase;
    return <DeskEmpty deskName="Bàn Phòng CTSV" reason={reason} />;
  }

  const locked = Boolean(pending);
  const zoomEvidence = evidence.find((e) => e.id === zoomId) ?? null;

  return (
    <div className="desk-page ctsv-page">
      {header}

      <div className="ctsv-grid">
        <div className="ctsv-col">
          <ApplicationCard form={form} />
          <LookupCard record={view.studentRecord} />
        </div>

        <div className="ctsv-col ctsv-col-main">
          {evidence.length === 0 && (
            <p className="ctsv-muted">Hồ sơ không có minh chứng đính kèm.</p>
          )}
          {evidence.map((item) => (
            <EvidencePaper
              key={item.id}
              evidence={item}
              marks={marks}
              onToggle={toggleMark}
              onZoom={() => setZoomId(item.id)}
              locked={locked}
            />
          ))}
        </div>

        <aside className="ctsv-col ctsv-side">
          <div className="ctsv-counter">
            Đã khoanh: <strong>{marks.length}</strong> trường
            {brief && (
              <span>
                {isCustomFlow
                  ? ` · Đã gợi ý ${brief.points.length} điểm cần chú ý`
                  : ` · AI đã gợi ý ${brief.points.length} điểm`}
              </span>
            )}
          </div>

          <AiBriefPanel
            brief={brief}
            loading={loading}
            onAsk={() => void handleAsk()}
            label={isCustomFlow ? 'Gợi ý điểm bất thường' : 'AI gợi ý điểm bất thường'}
          />

          <StampControls
            choices={CTSV_STAMPS}
            disabled={locked}
            onPick={(choice) => {
              if (pending) return;
              setPending({ choice, marks: [...marks] });
            }}
            hint="Chọn kết quả thẩm tra hồ sơ minh chứng (T5)."
          />

          {reducedMotion && <div className="desk-hint">Đã bật giảm chuyển động.</div>}
        </aside>
      </div>

      {pending && (
        <div className="stamp-landing">
          <Stamp
            label={pending.choice.label}
            color={pending.choice.color}
            seed={`T5-${pending.choice.outcome}`}
            size="lg"
            autoPlay
            onLanded={handleLanded}
          />
        </div>
      )}

      {zoomEvidence && (
        <EvidenceZoom
          evidence={zoomEvidence}
          marks={marks}
          onToggle={toggleMark}
          onClose={() => setZoomId(null)}
          locked={locked}
        />
      )}
    </div>
  );
};
