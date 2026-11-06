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
import { CtsvResult } from './ctsv/InspectionResult';
import { CtsvPortalResult } from './ctsv/CtsvPortalResult';
import {
  getCtsvCases,
  updateCaseCtsvDecision,
  SubmittedCase,
  subscribeCases,
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
  filter: 'pending' | 'resolved' | 'all';
  onFilterChange: (filter: 'pending' | 'resolved' | 'all') => void;
  onSelect: (id: string) => void;
}> = ({ cases, selectedId, filter, onFilterChange, onSelect }) => {
  const pendingCases = cases.filter((c) => !c.ctsvDecision);
  const resolvedCases = cases.filter((c) => Boolean(c.ctsvDecision));

  const displayedCases =
    filter === 'pending'
      ? pendingCases
      : filter === 'resolved'
      ? resolvedCases
      : [...pendingCases, ...resolvedCases];

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
          gap: 12,
          marginBottom: 14,
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
            📁 HỒ SƠ CHUYỂN TỚI PHÒNG CTSV ({cases.length} HỒ SƠ)
          </h3>
        </div>

        {/* Thanh Tab chuyển bộ lọc: Chờ thẩm định vs Đã thẩm định */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => onFilterChange('pending')}
            style={{
              padding: '5px 12px',
              fontSize: 12.5,
              fontWeight: 'bold',
              fontFamily: 'var(--font-paper)',
              cursor: 'pointer',
              borderRadius: 'var(--radius-sm)',
              border: filter === 'pending' ? '1.5px solid var(--amber)' : '1px solid var(--paper-line)',
              backgroundColor: filter === 'pending' ? 'var(--desk-900)' : 'var(--paper-dim)',
              color: filter === 'pending' ? 'var(--amber)' : 'var(--ink)',
              transition: 'all 120ms ease',
            }}
          >
            ⏳ Chờ thẩm định ({pendingCases.length})
          </button>

          <button
            type="button"
            onClick={() => onFilterChange('resolved')}
            style={{
              padding: '5px 12px',
              fontSize: 12.5,
              fontWeight: 'bold',
              fontFamily: 'var(--font-paper)',
              cursor: 'pointer',
              borderRadius: 'var(--radius-sm)',
              border: filter === 'resolved' ? '1.5px solid var(--amber)' : '1px solid var(--paper-line)',
              backgroundColor: filter === 'resolved' ? 'var(--desk-900)' : 'var(--paper-dim)',
              color: filter === 'resolved' ? 'var(--amber)' : 'var(--ink)',
              transition: 'all 120ms ease',
            }}
          >
            ✓ Đã thẩm định ({resolvedCases.length})
          </button>

          <button
            type="button"
            onClick={() => onFilterChange('all')}
            style={{
              padding: '5px 12px',
              fontSize: 12.5,
              fontWeight: 'bold',
              fontFamily: 'var(--font-paper)',
              cursor: 'pointer',
              borderRadius: 'var(--radius-sm)',
              border: filter === 'all' ? '1.5px solid var(--amber)' : '1px solid var(--paper-line)',
              backgroundColor: filter === 'all' ? 'var(--desk-900)' : 'var(--paper-dim)',
              color: filter === 'all' ? 'var(--amber)' : 'var(--ink)',
              transition: 'all 120ms ease',
            }}
          >
            📁 Tất cả ({cases.length})
          </button>
        </div>
      </div>

      {displayedCases.length === 0 ? (
        <div
          style={{
            padding: '24px 16px',
            textAlign: 'center',
            color: 'var(--ink-soft)',
            fontStyle: 'italic',
            fontSize: 13.5,
            border: '1px dashed var(--paper-line)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          {filter === 'pending'
            ? '✓ Không có hồ sơ nào đang chờ thẩm định. Mọi hồ sơ đã được xử lý xong!'
            : 'Chưa có hồ sơ nào trong mục này.'}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: 10,
          }}
        >
          {displayedCases.map((c) => {
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
      )}
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
    getCtsvCases()
  );
  const [filter, setFilter] = useState<'pending' | 'resolved' | 'all'>('pending');
  const [selectedCaseId, setSelectedCaseId] = useState<string>(() => {
    const cases = getCtsvCases();
    const appScenarioId = (useAppStore.getState().scenarioId || '').toUpperCase();
    const targetScenarioCode = appScenarioId ? `BL-2026-${appScenarioId}` : '';
    const pendingCtsv = cases.find((c) => !c.ctsvDecision);
    if (targetScenarioCode) {
      const match = cases.find((c) => c.id === targetScenarioCode || c.caseCode === targetScenarioCode);
      if (match) return match.id;
    }
    return pendingCtsv ? pendingCtsv.id : cases[0]?.id || '';
  });

  const [brief, setBrief] = useState<ReviewerBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<PendingStamp | null>(null);
  const [zoomId, setZoomId] = useState<string | null>(null);
  const resolved = useRef(false);

  const scenarioId = view.scenario?.id;
  const logLength = view.log.length;

  useEffect(() => {
    const unsub = subscribeCases(() => {
      setSubmittedCases(getCtsvCases());
    });
    return unsub;
  }, []);

  useEffect(() => {
    const cases = getCtsvCases();
    setSubmittedCases(cases);
    if (cases.length > 0) {
      const appScenarioId = (scenarioId || '').toUpperCase();
      const targetScenarioCode = appScenarioId ? `BL-2026-${appScenarioId}` : '';
      const scenarioCase = cases.find(
        (c) =>
          (targetScenarioCode && (c.id === targetScenarioCode || c.caseCode === targetScenarioCode)) ||
          (view.scenario?.form.mssv && c.studentMssv === view.scenario.form.mssv)
      );

      setSelectedCaseId((prev) => {
        if (scenarioCase) return scenarioCase.id;
        if (prev && cases.some((c) => c.id === prev)) return prev;
        const pendingCtsv = cases.find((c) => !c.ctsvDecision);
        return pendingCtsv ? pendingCtsv.id : cases[0].id;
      });
    }
  }, [scenarioId, logLength]);

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

  const pendingCases = submittedCases.filter((c) => !c.ctsvDecision);
  const resolvedCases = submittedCases.filter((c) => Boolean(c.ctsvDecision));

  // Xác định hồ sơ đang chọn hiển thị trên bàn làm việc
  let activeCase: SubmittedCase | null = null;
  if (filter === 'pending') {
    if (pendingCases.length > 0) {
      const appScenarioId = (scenarioId || '').toUpperCase();
      const targetScenarioCode = appScenarioId ? `BL-2026-${appScenarioId}` : '';
      activeCase =
        pendingCases.find((c) => c.id === selectedCaseId) ||
        (targetScenarioCode ? pendingCases.find((c) => c.id === targetScenarioCode || c.caseCode === targetScenarioCode) : null) ||
        pendingCases[0];
    }
  } else if (filter === 'resolved') {
    if (resolvedCases.length > 0) {
      const appScenarioId = (scenarioId || '').toUpperCase();
      const targetScenarioCode = appScenarioId ? `BL-2026-${appScenarioId}` : '';
      activeCase =
        resolvedCases.find((c) => c.id === selectedCaseId) ||
        (targetScenarioCode ? resolvedCases.find((c) => c.id === targetScenarioCode || c.caseCode === targetScenarioCode) : null) ||
        resolvedCases[0];
    }
  } else {
    activeCase =
      submittedCases.find((c) => c.id === selectedCaseId) || submittedCases[0] || null;
  }

  const handleSelectCase = (id: string) => {
    sfx.playPaper();
    setSelectedCaseId(id);
    setPending(null);
    setZoomId(null);
    resolved.current = false;
    const target = submittedCases.find((c) => c.id === id);
    if (target) {
      useAppStore.getState().setCaseCode(target.caseCode);
      if (filter === 'pending' && target.ctsvDecision) {
        setFilter('resolved');
      } else if (filter === 'resolved' && !target.ctsvDecision) {
        setFilter('pending');
      }
    }
  };

  const handleFilterChange = (newFilter: 'pending' | 'resolved' | 'all') => {
    sfx.playPaper();
    setFilter(newFilter);
    if (newFilter === 'pending') {
      const pending = submittedCases.filter((c) => !c.ctsvDecision);
      if (pending.length > 0 && !pending.some((c) => c.id === selectedCaseId)) {
        setSelectedCaseId(pending[0].id);
        useAppStore.getState().setCaseCode(pending[0].caseCode);
      }
    } else if (newFilter === 'resolved') {
      const resolved = submittedCases.filter((c) => Boolean(c.ctsvDecision));
      if (resolved.length > 0 && !resolved.some((c) => c.id === selectedCaseId)) {
        setSelectedCaseId(resolved[0].id);
        useAppStore.getState().setCaseCode(resolved[0].caseCode);
      }
    }
  };

  if (submittedCases.length === 0) {
    return <DeskEmpty deskName="Bàn Phòng CTSV" reason="upcoming" />;
  }

  const selectedCase = activeCase || submittedCases[0];

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
      setSubmittedCases(getCtsvCases());
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
          filter={filter}
          onFilterChange={handleFilterChange}
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
  if (isCaseProcessed && filter !== 'pending') {
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
          filter={filter}
          onFilterChange={handleFilterChange}
          onSelect={handleSelectCase}
        />
        <CtsvPortalResult
          result={result}
          form={currentForm}
          evidence={currentEvidence}
          caseCode={selectedCase.caseCode}
          day={selectedCase.day || view.day || 0}
          remainingPendingCount={pendingCases.length}
          onContinueNext={
            pendingCases.length > 0
              ? () => {
                  handleFilterChange('pending');
                  handleSelectCase(pendingCases[0].id);
                }
              : undefined
          }
        />
      </div>
    );
  }

  // Trường hợp tab Chờ thẩm định nhưng không còn hồ sơ nào chờ
  if (filter === 'pending' && pendingCases.length === 0) {
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
          selectedId=""
          filter={filter}
          onFilterChange={handleFilterChange}
          onSelect={handleSelectCase}
        />

        <Paper
          className="portal-docket-paper"
          elevated
          width="100%"
          style={{
            padding: '36px 24px',
            textAlign: 'center',
            background: 'var(--paper)',
            borderLeft: '5px solid var(--stamp-green)',
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 8 }}>✓</div>
          <h3 style={{ fontFamily: 'var(--font-paper)', fontSize: 18, color: 'var(--ink)', margin: '0 0 8px' }}>
            ĐÃ HOÀN TẤT TOÀN BỘ HỒ SƠ CHỜ THẨM ĐỊNH
          </h3>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14, maxWidth: 500, margin: '0 auto 18px', lineHeight: 1.5 }}>
            Hiện không có hồ sơ nào đang chờ Phòng CTSV thẩm tra minh chứng. Mọi hồ sơ hợp lệ đã được chuyển trình Ban Giám hiệu ký số.
          </p>
          {resolvedCases.length > 0 && (
            <button
              type="button"
              onClick={() => handleFilterChange('resolved')}
              style={{
                padding: '8px 18px',
                backgroundColor: 'var(--desk-900)',
                color: 'var(--amber)',
                border: '1.5px solid var(--amber)',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-paper)',
                fontWeight: 'bold',
                fontSize: 14,
                cursor: 'var(--cursor-pointer)',
              }}
            >
              📁 Xem danh sách hồ sơ đã thẩm định ({resolvedCases.length})
            </button>
          )}
        </Paper>
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
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <CtsvCaseDocketList
        cases={submittedCases}
        selectedId={selectedCase.id}
        filter={filter}
        onFilterChange={handleFilterChange}
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
