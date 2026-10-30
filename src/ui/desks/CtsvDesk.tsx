import React, { useEffect, useRef, useState } from 'react';
import { ReviewerBrief } from '../../engine/types';
import { CaseSummary } from '../../ai/provider';
import { collectAnomalies, scoreInspection } from '../../data/inspection';
import { useAppStore } from '../../store/useApp';
import { usePlaybackStore } from '../../store/playback';
import { AiBriefPanel } from './AiBriefPanel';
import { DeskEmpty } from './DeskEmpty';
import { StampChoice, StampControls } from './StampControls';
import { useCaseView } from './useCaseView';
import { Stamp } from '../kit/Stamp';
import { Paper } from '../kit/Paper';
import { sfx } from '../audio/sfx';
import { ApplicationCard } from './ctsv/ApplicationCard';
import { LookupCard } from './ctsv/LookupCard';
import { EvidencePaper } from './ctsv/EvidencePaper';
import { EvidenceZoom } from './ctsv/EvidenceZoom';
import { CtsvResult, InspectionResult } from './ctsv/InspectionResult';
import { CtsvPortalResult } from './ctsv/CtsvPortalResult';
import {
  getAllSubmittedCases,
  updateCaseCtsvDecision,
  SubmittedCase,
} from '../../data/caseRegistry';

const CTSV_STAMPS: StampChoice[] = [
  { label: 'HỢP LỆ', color: 'green', outcome: 'valid' },
  { label: 'KHÔNG HỢP LỆ', color: 'red', outcome: 'invalid' },
];

const EMPTY_MARKS: string[] = [];

interface PendingStamp {
  choice: StampChoice;
  marks: string[];
}

/**
 * Thanh danh sách hồ sơ chuyển tới Phòng Công tác sinh viên (CTSV)
 */
const CtsvCaseDocketList: React.FC<{
  cases: SubmittedCase[];
  selectedId: string;
  onSelect: (id: string) => void;
}> = ({ cases, selectedId, onSelect }) => {
  return (
    <Paper
      className="portal-docket-paper"
      elevated
      width="100%"
      style={{
        padding: '16px 20px',
        marginBottom: '16px',
        borderLeft: '5px solid var(--amber)',
        background: 'var(--paper)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 'bold',
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: 'var(--amber)',
              marginBottom: 2,
            }}
          >
            HỘP THƯ TIẾP NHẬN BÀN THẨM ĐỊNH MINH CHỨNG
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-paper)',
              fontSize: 17,
              margin: 0,
              color: 'var(--ink)',
            }}
          >
            📁 DANH SÁCH HỒ SƠ CHUYỂN TỚI PHÒNG CTSV ({cases.length} HỒ SƠ)
          </h3>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
          Bấm chọn từng hồ sơ để soi lệch và đóng dấu thẩm định (T5)
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: 10,
        }}
      >
        {cases.map((c) => {
          const isSelected = c.id === selectedId;
          const isCtsvValid = c.ctsvDecision === 'valid';
          const isCtsvInvalid = c.ctsvDecision === 'invalid';
          const isPendingCtsv = !c.ctsvDecision && c.advisorDecision === 'confirmed';
          const isAdvisorDeclined = c.advisorDecision === 'declined';

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                textAlign: 'left',
                padding: '11px 14px',
                backgroundColor: isSelected ? 'var(--desk-900)' : 'var(--paper-dim)',
                color: isSelected ? 'var(--paper)' : 'var(--ink)',
                border: isSelected
                  ? '2px solid var(--amber)'
                  : isPendingCtsv
                  ? '1.5px solid rgba(245, 158, 11, 0.5)'
                  : '1px solid var(--paper-line)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'var(--cursor-pointer)',
                transition: 'all 120ms ease',
                boxShadow: isSelected ? '0 3px 8px rgba(0,0,0,0.25)' : 'none',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  width: '100%',
                  alignItems: 'center',
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-paper)',
                    fontWeight: 'bold',
                    fontSize: 13,
                    color: isSelected ? 'var(--amber)' : 'var(--ink)',
                  }}
                >
                  📄 {c.caseCode}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 'bold',
                    padding: '2px 6px',
                    borderRadius: 3,
                    backgroundColor: isCtsvValid
                      ? 'var(--wash-green)'
                      : isCtsvInvalid || isAdvisorDeclined
                      ? 'var(--wash-red)'
                      : isPendingCtsv
                      ? 'var(--amber)'
                      : 'rgba(0,0,0,0.06)',
                    color: isCtsvValid
                      ? 'var(--stamp-green)'
                      : isCtsvInvalid || isAdvisorDeclined
                      ? 'var(--stamp-red)'
                      : isPendingCtsv
                      ? 'var(--desk-900)'
                      : 'var(--ink-soft)',
                  }}
                >
                  {isCtsvValid
                    ? '✓ HỢP LỆ (TRÌNH BGH)'
                    : isCtsvInvalid
                    ? '✗ KHÔNG HỢP LỆ'
                    : isAdvisorDeclined
                    ? '✗ CỐ VẤN TỪ CHỐI'
                    : isPendingCtsv
                    ? '⏳ CHỜ THẨM ĐỊNH (T5)'
                    : '⏳ CHỜ CỐ VẤN (T4)'}
                </span>
              </div>

              <div
                style={{
                  fontFamily: 'var(--font-paper)',
                  fontSize: 14.5,
                  fontWeight: 'bold',
                  color: isSelected ? '#fff' : 'var(--ink)',
                }}
              >
                {c.studentName}{' '}
                <span style={{ fontSize: 12, fontWeight: 'normal', opacity: 0.85 }}>
                  ({c.studentMssv})
                </span>
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: isSelected ? 'var(--paper-dim)' : 'var(--ink-soft)',
                  marginTop: 2,
                }}
              >
                {c.studentClass} · {c.studentFaculty}
              </div>

              <div
                style={{
                  fontSize: 11.5,
                  color: isSelected ? 'var(--amber)' : '#b45309',
                  marginTop: 4,
                  fontStyle: 'italic',
                }}
              >
                {c.evidence.length > 0
                  ? `Minh chứng: ${c.evidence[0].name}`
                  : 'Chưa có file minh chứng'}
              </div>
            </button>
          );
        })}
      </div>
    </Paper>
  );
};

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

  const [submittedCases, setSubmittedCases] = useState<SubmittedCase[]>(() =>
    getAllSubmittedCases()
  );
  const [selectedCaseId, setSelectedCaseId] = useState<string>(() => {
    const all = getAllSubmittedCases();
    // Ưu tiên chọn hồ sơ Cố vấn đã duyệt và đang chờ CTSV thẩm định
    const pendingCtsv = all.find((c) => c.advisorDecision === 'confirmed' && !c.ctsvDecision);
    if (pendingCtsv) return pendingCtsv.id;
    return all[0]?.id || '';
  });

  const [brief, setBrief] = useState<ReviewerBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<PendingStamp | null>(null);
  const [zoomId, setZoomId] = useState<string | null>(null);
  const resolved = useRef(false);

  useEffect(() => {
    const all = getAllSubmittedCases();
    setSubmittedCases(all);
    if (all.length > 0) {
      if (!selectedCaseId || !all.some((c) => c.id === selectedCaseId)) {
        const pendingCtsv = all.find((c) => c.advisorDecision === 'confirmed' && !c.ctsvDecision);
        const targetId = pendingCtsv ? pendingCtsv.id : all[0].id;
        setSelectedCaseId(targetId);
        const target = all.find((c) => c.id === targetId);
        if (target) useAppStore.getState().setCaseCode(target.caseCode);
      }
    }
  }, [view]);

  useEffect(() => {
    setBrief(null);
    setLoading(false);
    setPending(null);
    setZoomId(null);
    resolved.current = false;
  }, [selectedCaseId]);

  useEffect(() => {
    if (!zoomId) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomId]);

  const handleSelectCase = (id: string) => {
    sfx.playPaper();
    setSelectedCaseId(id);
    setPending(null);
    setZoomId(null);
    resolved.current = false;
    const target = submittedCases.find((c) => c.id === id);
    if (target) {
      useAppStore.getState().setCaseCode(target.caseCode);
    }
  };

  if (submittedCases.length === 0) {
    return <DeskEmpty deskName="Bàn Phòng CTSV" reason="not-submitted" />;
  }

  const selectedCase =
    submittedCases.find((c) => c.id === selectedCaseId) || submittedCases[0];

  const currentForm = selectedCase.form;
  const currentEvidence = selectedCase.evidence;
  const anomalies = collectAnomalies(currentEvidence);

  const inspection = usePlaybackStore((s) => s.ctsvInspections[selectedCase.caseCode]);
  const marks = selectedCase.ctsvMarks ?? inspection?.marks ?? EMPTY_MARKS;
  const result: CtsvResult | null = selectedCase.ctsvDecision
    ? {
        outcome: selectedCase.ctsvDecision,
        score: scoreInspection(marks, anomalies),
        anomalies,
        markedKeys: marks,
      }
    : inspection?.result ?? null;

  const toggleMark = (key: string) => {
    sfx.playPencilCircle();
    const next = marks.includes(key) ? marks.filter((k) => k !== key) : [...marks, key];
    setCtsvMarks(selectedCase.caseCode, next);
  };

  const handleAsk = async () => {
    if (!selectedCase) return;
    setLoading(true);

    const caseSummary: CaseSummary = {
      form: selectedCase.form,
      validity: {
        complete: Boolean(selectedCase.form.fullName && selectedCase.form.mssv),
        missing: [],
        evidenceOk: selectedCase.evidence.length > 0,
      },
      ruleResult: { pass: true, violations: [] },
      advisorStatus: selectedCase.advisorDecision || 'pending',
      ctsvStatus: selectedCase.ctsvDecision || 'pending',
      day: selectedCase.day || view.day || 0,
      evidence: selectedCase.evidence,
    };

    const b = await askReviewerBrief('ctsv', caseSummary);
    setBrief(b);
    setLoading(false);
  };

  const handleLanded = () => {
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

    sealCtsvInspection(selectedCase.caseCode, nextResult);
    const updated = updateCaseCtsvDecision(
      selectedCase.id,
      choice.outcome as 'valid' | 'invalid',
      pending.marks
    );
    if (updated) {
      setSubmittedCases(getAllSubmittedCases());
    }
    sfx.playStamp();

    if (brief) {
      recordHumanDecision('T5', choice.outcome, brief.suggestedDecision);
    }

    if (view.scenario?.form.mssv === selectedCase.studentMssv) {
      void completeUserTask('T5', choice.outcome);
    }
  };

  const isCaseProcessed = Boolean(selectedCase.ctsvDecision);

  // Nếu hồ sơ đã bị Cố vấn từ chối thì dừng luồng thẩm định CTSV
  if (selectedCase.advisorDecision === 'declined' && !selectedCase.ctsvDecision) {
    return (
      <div
        className="desk-page ctsv-portal-page"
        style={{
          width: '100%',
          maxWidth: '980px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <CtsvCaseDocketList
          cases={submittedCases}
          selectedId={selectedCase.id}
          onSelect={handleSelectCase}
        />
        <Paper className="portal-docket-paper" elevated width="100%" style={{ padding: 24, borderLeft: '5px solid var(--stamp-red)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 28 }}>🛑</div>
            <div>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-paper)', fontSize: 18, color: 'var(--stamp-red)' }}>
                Hồ sơ đã dừng xử lý (Cố vấn học tập không xác nhận)
              </h3>
              <p style={{ margin: '6px 0 0 0', fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                Cố vấn học tập đã đóng dấu <strong>KHÔNG XÁC NHẬN</strong> cho hồ sơ <strong>{selectedCase.caseCode}</strong> của sinh viên {selectedCase.studentName}. Theo quy trình Một cửa số, hồ sơ đã bị từ chối và thông báo về Cổng Sinh viên, Bộ phận CTSV không cần thực hiện thẩm định minh chứng.
              </p>
            </div>
          </div>
        </Paper>
      </div>
    );
  }

  // Khi hồ sơ đã được CTSV thẩm định xong
  if (isCaseProcessed) {
    if (sessionMode === 'portal') {
      return (
        <div
          className="desk-page ctsv-portal-page"
          style={{
            width: '100%',
            maxWidth: '980px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <CtsvCaseDocketList
            cases={submittedCases}
            selectedId={selectedCase.id}
            onSelect={handleSelectCase}
          />
          <CtsvPortalResult
            result={result}
            form={currentForm}
            evidence={currentEvidence}
            caseCode={selectedCase.caseCode}
            day={selectedCase.day || view.day || 0}
          />
        </div>
      );
    }

    return (
      <div
        className="desk-page"
        style={{
          width: '100%',
          maxWidth: '980px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <CtsvCaseDocketList
          cases={submittedCases}
          selectedId={selectedCase.id}
          onSelect={handleSelectCase}
        />
        {result ? (
          <InspectionResult result={result} />
        ) : (
          <DeskEmpty deskName="Bàn Phòng CTSV" reason="done" />
        )}
      </div>
    );
  }

  // Khi hồ sơ đang chờ CTSV thẩm định (Pending T5)
  const locked = Boolean(pending);
  const zoomEvidence = currentEvidence.find((e) => e.id === zoomId) ?? null;

  return (
    <div
      className="desk-page ctsv-page"
      style={{
        width: '100%',
        maxWidth: '980px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <CtsvCaseDocketList
        cases={submittedCases}
        selectedId={selectedCase.id}
        onSelect={handleSelectCase}
      />

      <div className="desk-head">
        <div>
          <h1 className="desk-title">Bàn Phòng Công tác sinh viên</h1>
          <p className="desk-sub">
            Lane L3 · Đang thẩm định hồ sơ:{' '}
            <strong style={{ color: 'var(--amber)' }}>
              {selectedCase.caseCode} — {selectedCase.studentName} ({selectedCase.studentMssv})
            </strong>{' '}
            · Tác vụ T5 · NGÀY {view.day}
          </p>
        </div>
        <div className="desk-toolbar">
          <span className="desk-hint">Soi từng trường · <kbd>T</kbd>/<kbd>Shift+T</kbd> tua ngày</span>
        </div>
      </div>

      <div className="ctsv-grid">
        <div className="ctsv-col">
          <ApplicationCard form={currentForm} />
          <LookupCard record={view.studentRecord} />
        </div>

        <div className="ctsv-col ctsv-col-main">
          {currentEvidence.length === 0 && (
            <p className="ctsv-muted">Hồ sơ không có minh chứng đính kèm.</p>
          )}
          {currentEvidence.map((item) => (
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
