import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ReviewerBrief } from '../../engine/types';
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

const ADVISOR_STAMPS: StampChoice[] = [
  { label: 'XÁC NHẬN', color: 'green', outcome: 'confirmed' },
  { label: 'KHÔNG XÁC NHẬN', color: 'red', outcome: 'declined' },
];

const soundedReminderIds = new Set<string>();

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

  const [brief, setBrief] = useState<ReviewerBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [stamp, setStamp] = useState<StampChoice | null>(null);
  const [ringing, setRinging] = useState(false);
  const resolved = useRef(false);

  const engine = view.engine;
  const form = engine?.state.form ?? view.scenario?.form;
  const evidence = engine?.state.evidence ?? view.scenario?.evidence ?? [];
  const validity = engine?.state.validity;
  const ruleResult = engine?.state.ruleResult;
  const ruleEvaluated = view.log.some((e) => e.type === 'rule.evaluated');
  const reminder = engine?.state.messages.filter((m) => m.recipient === 'advisor').slice(-1)[0];

  useEffect(() => {
    setBrief(null);
    setLoading(false);
    setStamp(null);
    resolved.current = false;
    soundedReminderIds.clear();
  }, [engine]);

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

  const handleAsk = useCallback(async () => {
    setLoading(true);
    const result = await askReviewerBrief('advisor');
    setBrief(result);
    setLoading(false);
  }, [askReviewerBrief]);

  const handleLanded = useCallback(() => {
    if (!stamp || resolved.current) return;
    resolved.current = true;
    if (brief) {
      recordHumanDecision('T4', stamp.outcome, brief.suggestedDecision);
    }
    void completeUserTask('T4', stamp.outcome);
  }, [brief, completeUserTask, recordHumanDecision, stamp]);

  if (view.phase === 'done' && form) {
    const advisorStatus =
      engine?.state.advisor.status ?? (stamp?.outcome as 'confirmed' | 'declined' | undefined) ?? 'confirmed';
    const safeAdvisorStatus: 'confirmed' | 'declined' =
      advisorStatus === 'declined' ? 'declined' : 'confirmed';

    if (sessionMode === 'portal') {
      return (
        <AdvisorPortalResult
          form={form}
          evidence={evidence}
          advisorStatus={safeAdvisorStatus}
          caseCode={engine?.state.caseId ?? 'BL-2026-88'}
          day={view.day}
        />
      );
    }

    return (
      <div className="desk-page advisor-page">
        <div className="desk-head">
          <div>
            <h1 className="desk-title">Bàn Cố vấn học tập</h1>
            <p className="desk-sub">
              Lane L2 · Thẩm tra nguyện vọng và xác nhận bảo lưu (T4) · NGÀY {view.day}
            </p>
          </div>
          <div className="desk-toolbar">
            <span className="desk-hint">Đã đóng dấu hoàn tất T4</span>
          </div>
        </div>

        <div className="advisor-tablet">
          <div className="tablet-screen" style={{ position: 'relative' }}>
            <AdvisorFile
              form={form}
              evidence={evidence}
              ruleResult={ruleResult ?? { pass: false, violations: [] }}
              ruleEvaluated={ruleEvaluated}
              validity={validity ?? { complete: false, missing: [], evidenceOk: false }}
            />
            <div style={{ position: 'absolute', right: 28, top: 20, zIndex: 10 }}>
              <Stamp
                label={advisorStatus === 'declined' ? 'KHÔNG XÁC NHẬN' : 'XÁC NHẬN'}
                color={advisorStatus === 'declined' ? 'red' : 'green'}
                seed="T4-done"
                size="lg"
              />
            </div>
          </div>

          <aside className="advisor-side">
            <div
              className="signing-done"
              style={{
                background: 'var(--desk-700)',
                border: `1px solid ${advisorStatus === 'declined' ? 'var(--stamp-red)' : 'var(--stamp-green)'}`,
                padding: 18,
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div
                className="signing-kicker"
                style={{
                  color: advisorStatus === 'declined' ? 'var(--stamp-red)' : 'var(--stamp-green)',
                  fontWeight: 'bold',
                  fontSize: 12,
                }}
              >
                ĐÃ HOÀN TẤT T4
              </div>
              <h3
                className="signing-title"
                style={{ fontFamily: 'var(--font-paper)', fontSize: 18, color: 'var(--paper)', margin: '6px 0' }}
              >
                {advisorStatus === 'declined' ? 'Cố vấn không xác nhận' : 'Cố vấn đã xác nhận'}
              </h3>
              <p className="signing-sub" style={{ fontSize: 13, color: 'var(--paper-dim)', lineHeight: 1.5 }}>
                Ý kiến cố vấn học tập đã được đóng dấu niêm phong. Quy trình đã chuyển sang cổng hội tụ G3 để phối hợp với CTSV và CSDL Đào tạo.
              </p>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  if (view.phase !== 'waiting' || !form) {
    const reason = view.phase === 'waiting' ? 'upcoming' : view.phase;
    return <DeskEmpty deskName="Bàn Cố vấn học tập" reason={reason} />;
  }

  const overdue = isSlaOverdue(view.waitedDays);

  return (
    <div className="desk-page advisor-page">
      <div className="desk-head">
        <div>
          <h1 className="desk-title">Bàn Cố vấn học tập</h1>
          <p className="desk-sub">
            Lane L2 · Thẩm tra nguyện vọng và xác nhận bảo lưu (T4 · SLA {SLA_DAY_LIMIT} ngày)
          </p>
        </div>
        <div className="desk-toolbar">
          <span className="desk-day">NGÀY {view.day}</span>
          <button
            type="button"
            className="desk-btn"
            disabled={view.phase !== 'waiting'}
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
            disabled={view.phase !== 'waiting'}
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
          <AdvisorFile
            form={form}
            evidence={evidence}
            ruleResult={ruleResult ?? { pass: false, violations: [] }}
            ruleEvaluated={ruleEvaluated}
            validity={validity ?? { complete: false, missing: [], evidenceOk: false }}
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
