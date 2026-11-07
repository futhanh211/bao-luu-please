import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ReviewerBrief } from '../../engine/types';
import { CaseSummary } from '../../ai/provider';
import { useAppStore } from '../../store/useApp';
import { usePlaybackStore } from '../../store/playback';
import { Paper } from '../kit/Paper';
import { SlaClock } from '../kit/SlaClock';
import { Stamp } from '../kit/Stamp';
import { sfx } from '../audio/sfx';
import { AiBriefPanel } from './AiBriefPanel';
import { DeskEmpty } from './DeskEmpty';
import { StampChoice, StampControls } from './StampControls';
import { useCaseView } from './useCaseView';
import { SLA_DAY_LIMIT, isSlaOverdue } from './deskState';
import { AdvisorFile } from './advisor/AdvisorFile';
import { AdvisorPortalResult } from './advisor/AdvisorPortalResult';
import {
  getAdvisorCases,
  updateCaseAdvisorDecision,
  SubmittedCase,
} from '../../data/caseRegistry';

const ADVISOR_STAMPS: StampChoice[] = [
  { label: 'XÁC NHẬN', color: 'green', outcome: 'confirmed' },
  { label: 'KHÔNG XÁC NHẬN', color: 'red', outcome: 'declined' },
];

const soundedReminderIds = new Set<string>();

/**
 * Thanh danh sách hồ sơ Một cửa số nộp cho Cố vấn học tập (Hộp thư tiếp nhận ca)
 */
const AdvisorCaseDocketList: React.FC<{
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
            HỘP THƯ TIẾP NHẬN ĐƠN MỘT CỬA SỐ
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-paper)',
              fontSize: 17,
              margin: 0,
              color: 'var(--ink)',
            }}
          >
            📁 DANH SÁCH HỒ SƠ SINH VIÊN NỘP CHO CỐ VẤN ({cases.length} HỒ SƠ)
          </h3>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
          Bấm chọn từng hồ sơ để xem xét và đóng dấu phê duyệt
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
          const isConfirmed = c.advisorDecision === 'confirmed';
          const isDeclined = c.advisorDecision === 'declined';
          const isPending = !c.advisorDecision;

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
                  : isPending
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
                    backgroundColor: isConfirmed
                      ? 'var(--wash-green)'
                      : isDeclined
                      ? 'var(--wash-red)'
                      : 'var(--amber)',
                    color: isConfirmed
                      ? 'var(--stamp-green)'
                      : isDeclined
                      ? 'var(--stamp-red)'
                      : 'var(--desk-900)',
                  }}
                >
                  {isConfirmed
                    ? '✓ ĐÃ XÁC NHẬN'
                    : isDeclined
                    ? '✗ KHÔNG XÁC NHẬN'
                    : c.status === 'returned'
                    ? '⚠️ TRẢ ĐƠN (BỔ SUNG)'
                    : '⏳ CHỜ DUYỆT (T4)'}
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
                Lý do: {c.form.reason}
              </div>
            </button>
          );
        })}
      </div>
    </Paper>
  );
};

export const AdvisorDesk: React.FC = () => {
  const view = useCaseView('advisor');
  const completeUserTask = usePlaybackStore((s) => s.completeUserTask);
  const askReviewerBrief = usePlaybackStore((s) => s.askReviewerBrief);
  const recordHumanDecision = usePlaybackStore((s) => s.recordHumanDecision);
  const advanceDays = usePlaybackStore((s) => s.advanceDays);
  const speed = useAppStore((s) => s.speed);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const sessionMode = useAppStore((s) => s.sessionMode);
  const isCustomCase = usePlaybackStore((s) => s.isCustomCase);
  const isCustomFlow = isCustomCase || sessionMode === 'portal';

  const currentCaseCode = useAppStore((s) => s.caseCode);
  const [submittedCases, setSubmittedCases] = useState<SubmittedCase[]>(() =>
    getAdvisorCases()
  );
  const [selectedCaseId, setSelectedCaseId] = useState<string>(() => {
    const cases = getAdvisorCases();
    const activeCode = useAppStore.getState().caseCode;
    const matchActive = cases.find((c) => c.caseCode === activeCode || c.id === activeCode);
    if (matchActive) return matchActive.id;
    const pending = cases.find((c) => !c.advisorDecision);
    return pending ? pending.id : cases[0]?.id || '';
  });

  const [brief, setBrief] = useState<ReviewerBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [stamp, setStamp] = useState<StampChoice | null>(null);
  const [ringing, setRinging] = useState(false);
  const resolved = useRef(false);

  const engine = view.engine;
  const validity = engine?.state.validity;
  const ruleResult = engine?.state.ruleResult;
  const ruleEvaluated = view.log.some((e) => e.type === 'rule.evaluated');
  const reminder = engine?.state.messages.filter((m) => m.recipient === 'advisor').slice(-1)[0];

  useEffect(() => {
    const refresh = () => {
      const cases = getAdvisorCases();
      setSubmittedCases(cases);
      if (cases.length > 0) {
        setSelectedCaseId((prev) => {
          const activeCode = useAppStore.getState().caseCode;
          const matchActive = cases.find((c) => c.caseCode === activeCode || c.id === activeCode);
          if (matchActive) return matchActive.id;
          if (prev && cases.some((c) => c.id === prev)) return prev;
          const pending = cases.find((c) => !c.advisorDecision);
          const targetId = pending ? pending.id : cases[0].id;
          const target = cases.find((c) => c.id === targetId);
          if (target) useAppStore.getState().setCaseCode(target.caseCode);
          return targetId;
        });
      }
    };

    refresh();

    const handleStorageChange = () => refresh();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('app:storage_change', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('app:storage_change', handleStorageChange);
    };
  }, [view, currentCaseCode]);

  useEffect(() => {
    setBrief(null);
    setLoading(false);
    setStamp(null);
    resolved.current = false;
    soundedReminderIds.clear();
  }, [engine, selectedCaseId]);

  const bellMs = 600 / speed;

  useEffect(() => {
    if (!reminder) return undefined;
    if (!soundedReminderIds.has(reminder.id)) {
      soundedReminderIds.add(reminder.id);
      sfx.playPhoneRing();
    }
    if (reducedMotion) return undefined;
    setRinging(true);
    const timer = setTimeout(() => setRinging(false), bellMs);
    return () => clearTimeout(timer);
  }, [reminder?.id, reducedMotion, bellMs, reminder]);

  const handleSelectCase = (id: string) => {
    sfx.playPaper();
    setSelectedCaseId(id);
    setStamp(null);
    resolved.current = false;
    const target = submittedCases.find((c) => c.id === id);
    if (target) {
      useAppStore.getState().setCaseCode(target.caseCode);
    }
  };

  // Nếu không có bất kỳ hồ sơ nào trong sổ tiếp nhận
  if (submittedCases.length === 0) {
    return <DeskEmpty deskName="Bàn Cố vấn học tập" reason="not-submitted" />;
  }

  const selectedCase =
    submittedCases.find((c) => c.id === selectedCaseId) || submittedCases[0];

  const handleAsk = useCallback(async () => {
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

    const result = await askReviewerBrief('advisor', caseSummary);
    setBrief(result);
    setLoading(false);
  }, [askReviewerBrief, selectedCase, view.day]);

  const handleLanded = () => {
    if (!stamp || resolved.current) return;
    resolved.current = true;
    if (brief) {
      recordHumanDecision('T4', stamp.outcome, brief.suggestedDecision);
    }

    const updated = updateCaseAdvisorDecision(
      selectedCase.id,
      stamp.outcome as 'confirmed' | 'declined'
    );
    if (updated) {
      setSubmittedCases(getAdvisorCases());
    }

    // Nếu ca này là ca đang chạy trong BPMN engine thì hoàn tất task T4
    if (view.scenario?.form.mssv === selectedCase.studentMssv) {
      void completeUserTask('T4', stamp.outcome);
    }
    sfx.playStamp();
  };

  const isCaseProcessed =
    selectedCase.advisorDecision === 'confirmed' ||
    selectedCase.advisorDecision === 'declined';

  // Khi hồ sơ đã được Cố vấn đóng dấu xử lý xong
  if (isCaseProcessed) {
    const safeAdvisorStatus: 'confirmed' | 'declined' =
      selectedCase.advisorDecision === 'declined' ? 'declined' : 'confirmed';

    return (
      <div
        className="desk-page advisor-portal-page"
        style={{
          width: '100%',
          maxWidth: '980px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <AdvisorCaseDocketList
          cases={submittedCases}
          selectedId={selectedCase.id}
          onSelect={handleSelectCase}
        />

        <AdvisorPortalResult
          form={selectedCase.form}
          evidence={selectedCase.evidence}
          advisorStatus={safeAdvisorStatus}
          caseCode={selectedCase.caseCode}
          day={selectedCase.day || view.day || 0}
        />
      </div>
    );
  }

  // Khi hồ sơ đang chờ Cố vấn xem xét và dập dấu (Pending T4)
  const overdue = isSlaOverdue(view.waitedDays);

  return (
    <div
      className="desk-page advisor-page"
      style={{
        width: '100%',
        maxWidth: '980px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <AdvisorCaseDocketList
        cases={submittedCases}
        selectedId={selectedCase.id}
        onSelect={handleSelectCase}
      />

      <div className="desk-head">
        <div>
          <h1 className="desk-title">Bàn Cố vấn học tập</h1>
          <p className="desk-sub">
            Lane L2 · Đang thẩm tra hồ sơ:{' '}
            <strong style={{ color: 'var(--amber)' }}>
              {selectedCase.caseCode} — {selectedCase.studentName} ({selectedCase.studentMssv})
            </strong>{' '}
            · SLA {SLA_DAY_LIMIT} ngày
          </p>
        </div>
        <div className="desk-toolbar">
          <span className="desk-day">NGÀY {view.day}</span>
          <button
            type="button"
            className="desk-btn"
            onClick={() => {
              sfx.playClockTick();
              void advanceDays(1);
            }}
          >
            +1 ngày <kbd>T</kbd>
          </button>
          <button
            type="button"
            className="desk-btn"
            onClick={() => {
              sfx.playCalendarTear();
              void advanceDays(3);
            }}
          >
            +3 ngày (SLA) <kbd>Shift+T</kbd>
          </button>
        </div>
      </div>

      {reminder && (
        <div className="sla-banner" role="alert">
          <span
            className="sla-bell"
            data-ring={ringing ? 'true' : 'false'}
            style={{ '--bell-ms': `${bellMs}ms` } as React.CSSProperties}
            aria-hidden="true"
          >
            🔔
          </span>
          <div>
            <strong>Nhắc việc từ hệ thống — hồ sơ đã chờ {view.waitedDays} ngày làm việc.</strong>
            <div className="sla-banner-detail">{reminder.content}</div>
          </div>
        </div>
      )}

      <div className="advisor-tablet">
        <div className="tablet-screen">
          {selectedCase.aiAudit && (
            <Paper
              className="portal-docket-paper"
              elevated
              width="100%"
              style={{
                padding: '14px 18px',
                marginBottom: '14px',
                borderLeft: `5px solid ${selectedCase.aiAudit.status === 'passed' ? 'var(--stamp-green)' : 'var(--stamp-red)'}`,
                backgroundColor: 'var(--paper)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                <span style={{ fontWeight: 'bold', fontSize: 13, color: selectedCase.aiAudit.status === 'passed' ? 'var(--stamp-green)' : 'var(--stamp-red)', textTransform: 'uppercase' }}>
                  🤖 BÁO CÁO THẨM ĐỊNH AI TỰ ĐỘNG (KIỂM ĐỊNH TRƯỚC KHI TRÌNH CỐ VẤN) — {selectedCase.aiAudit.score}/100 ĐIỂM
                </span>
                <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
                  Thời gian thẩm tra: {selectedCase.aiAudit.auditDate}
                </span>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.5, marginBottom: 8 }}>
                {selectedCase.aiAudit.summary}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, fontSize: 11.5 }}>
                <div style={{ padding: '6px 10px', background: 'var(--paper-dim)', border: '1px solid var(--paper-line)', borderRadius: 4 }}>
                  {selectedCase.aiAudit.studentCheck.pass ? '✅' : '❌'} <strong>Người học:</strong> {selectedCase.aiAudit.studentCheck.pass ? 'Hợp lệ chính quy' : 'Thiếu dữ liệu'}
                </div>
                <div style={{ padding: '6px 10px', background: 'var(--paper-dim)', border: '1px solid var(--paper-line)', borderRadius: 4 }}>
                  {selectedCase.aiAudit.ruleCheck.pass ? '✅' : '❌'} <strong>Quy chế R1-R4:</strong> {selectedCase.aiAudit.ruleCheck.pass ? 'Đạt chuẩn 4/4 tiêu chí' : 'Vi phạm quy chế'}
                </div>
                <div style={{ padding: '6px 10px', background: 'var(--paper-dim)', border: '1px solid var(--paper-line)', borderRadius: 4 }}>
                  {selectedCase.aiAudit.evidenceCheck.pass ? '✅' : '⚠️'} <strong>Minh chứng:</strong> {selectedCase.aiAudit.evidenceCheck.pass ? 'Chuẩn xác & Đủ mộc đỏ' : 'Có bất thường'}
                </div>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--amber)', fontStyle: 'italic', paddingTop: 6, borderTop: '1px dashed var(--paper-line)' }}>
                👉 <strong>Khuyến nghị cho Thầy/Cô Cố vấn:</strong> {selectedCase.aiAudit.advisorRationale}
              </div>
            </Paper>
          )}

          <AdvisorFile
            form={selectedCase.form}
            evidence={selectedCase.evidence}
            ruleResult={ruleResult ?? { pass: true, violations: [] }}
            ruleEvaluated={ruleEvaluated}
            validity={validity ?? { complete: true, missing: [], evidenceOk: true }}
          />
        </div>

        <aside className="advisor-side">
          <SlaClock days={view.waitedDays} maxDays={SLA_DAY_LIMIT} />
          {overdue && !reminder && (
            <div className="sla-warning">Đã chạm hạn SLA. Hệ thống sẽ gửi nhắc việc khi tua ngày.</div>
          )}

          <AiBriefPanel
            brief={brief}
            loading={loading}
            onAsk={() => void handleAsk()}
            label="AI tóm tắt hồ sơ cho Cố vấn"
          />

          <StampControls
            choices={ADVISOR_STAMPS}
            disabled={Boolean(stamp)}
            onPick={(choice) => {
              if (stamp) return;
              setStamp(choice);
            }}
            hint="Chọn kết quả thẩm tra để hoàn tất xử lý (T4)."
          />
        </aside>

        {stamp && (
          <div className="stamp-landing">
            <Stamp
              label={stamp.label}
              color={stamp.color}
              seed={`T4-${stamp.outcome}`}
              size="lg"
              autoPlay
              onLanded={handleLanded}
            />
          </div>
        )}
      </div>

      <Paper className="desk-legal-note" style={{ width: '100%', padding: '10px 18px' }}>
        <span className="advisor-muted">
          {isCustomFlow
            ? 'Quyết định phê duyệt thuộc về con dấu của người xử lý.'
            : 'AI chỉ tóm tắt và đề xuất. Quyết định thuộc về con dấu của người xử lý · Dữ liệu giả lập.'}
        </span>
      </Paper>
    </div>
  );
};
