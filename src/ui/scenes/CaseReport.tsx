import React, { useMemo } from 'react';
import { usePlaybackStore } from '../../store/playback';
import { useAppStore } from '../../store/useApp';
import { ASIS_CONFIG } from '../../data/asis.config';
import { buildCaseReport } from '../../data/caseReport';
import { CountUp } from '../kit/CountUp';

type MetricKey =
  | 'machineRun'
  | 'humanRun'
  | 'messagesSent'
  | 'simDays'
  | 'dbReads'
  | 'dbWrites'
  | 'aiTouches'
  | 'disagreements';

const METRICS: Array<{ key: MetricKey; label: string }> = [
  { key: 'machineRun', label: 'MÁY ĐÃ CHẠY' },
  { key: 'humanRun', label: 'NGƯỜI' },
  { key: 'messagesSent', label: 'THÔNG ĐIỆP' },
  { key: 'simDays', label: 'NGÀY GIẢ LẬP' },
  { key: 'dbReads', label: 'LẦN ĐỌC CSDL' },
  { key: 'dbWrites', label: 'LẦN GHI CSDL' },
  { key: 'aiTouches', label: 'LẦN GỌI AI' },
  { key: 'disagreements', label: 'NGƯỜI ≠ AI' },
];

function percent(rate: number): string {
  return `${(Math.round(rate * 1000) / 10).toString().replace('.', ',')}%`;
}

export const CaseReport: React.FC = () => {
  const log = usePlaybackStore((s) => s.currentEventLog);
  const eventDays = usePlaybackStore((s) => s.eventDays);
  const scenario = usePlaybackStore((s) => s.scenario);
  const engine = usePlaybackStore((s) => s.engine);
  const day = usePlaybackStore((s) => s.mapState.counters.day);
  const setReportDismissed = usePlaybackStore((s) => s.setReportDismissed);
  const initScenario = usePlaybackStore((s) => s.initScenario);
  const resetPlayback = usePlaybackStore((s) => s.reset);

  const mapFullscreen = useAppStore((s) => s.mapFullscreen);
  const toggleMapFullscreen = useAppStore((s) => s.toggleMapFullscreen);
  const resetCase = useAppStore((s) => s.resetCase);
  const setRole = useAppStore((s) => s.setRole);
  const toggleAsIs = useAppStore((s) => s.toggleAsIs);

  const report = useMemo(
    () =>
      engine
        ? buildCaseReport(log, engine.state, {
            scenario,
            eventDays,
            day,
            asIs: ASIS_CONFIG,
          })
        : null,
    [engine, log, scenario, eventDays, day]
  );

  if (!report || report.endEventId === '') return null;

  const close = () => setReportDismissed(true);

  const replay = () => {
    initScenario(scenario?.id ?? 's1');
    setRole('student');
  };

  const chooseScenario = () => {
    resetPlayback();
    resetCase();
  };

  const xray = () => {
    if (!mapFullscreen) toggleMapFullscreen();
  };

  return (
    <div className="report-overlay" role="dialog" aria-modal="true" aria-label="Báo cáo cuối ca">
      <article className="report-card">
        <header className="report-head">
          <div className="report-head-main">
            <div className="report-eyebrow">PHÒNG MỘT CỬA SỐ · BÁO CÁO CUỐI CA</div>
            <h1 className="report-title">
              Hồ sơ {report.scenarioCode} · {report.outcome}
            </h1>
            <p className="report-sub">
              {report.studentName} · MSSV {report.mssv} · {report.faculty}
            </p>
          </div>

          <div className="report-outcome" data-kind={report.outcomeKind}>
            <span className="report-outcome-label">KẾT CỤC</span>
            <strong>{report.outcome}</strong>
            {report.decisionNumber && (
              <span className="report-decision">Quyết định {report.decisionNumber}</span>
            )}
          </div>

          <button
            type="button"
            className="report-close"
            onClick={close}
            title="Đóng báo cáo (Esc)"
            aria-label="Đóng báo cáo"
          >
            ✕
          </button>
        </header>

        <div className="report-body">
          <div className="report-left">
            <section className="report-metrics" aria-label="Chỉ số ca">
              {METRICS.map((metric) => (
                <div key={metric.key} className="report-metric">
                  <span className="report-metric-label">{metric.label}</span>
                  <CountUp className="report-metric-value" value={report[metric.key]} />
                </div>
              ))}
            </section>

            <section className="report-compare" aria-label="So sánh tự động hóa">
              <h2 className="report-section-title">Tự động hóa</h2>

              <div className="report-bar-row">
                <span className="report-bar-label">
                  Ca này · {report.machineRun} máy / {report.machineRun + report.humanRun} tác vụ
                </span>
                <span className="report-bar-track">
                  <span
                    className="report-bar-fill"
                    data-kind="run"
                    style={{ width: `${report.automationRate * 100}%` }}
                  />
                </span>
                <strong className="report-bar-value">{percent(report.automationRate)}</strong>
              </div>

              <div className="report-bar-row">
                <span className="report-bar-label">
                  Thiết kế · {report.design.machine}/{report.design.total} tác vụ
                </span>
                <span className="report-bar-track">
                  <span
                    className="report-bar-fill"
                    data-kind="design"
                    style={{ width: `${report.design.rate * 100}%` }}
                  />
                </span>
                <strong className="report-bar-value">{percent(report.design.rate)}</strong>
              </div>

              <div className="report-asis">
                {report.asIs ? (
                  <>
                    <span>
                      As-Is: <strong>{report.asIs.days} ngày</strong> ·{' '}
                      {report.asIs.stations.length} trạm giấy
                    </span>
                    <span>
                      To-Be: <strong>{report.simDays} ngày giả lập</strong>
                    </span>
                    <button
                      type="button"
                      onClick={toggleAsIs}
                      style={{
                        padding: '2px 8px',
                        fontSize: '11px',
                        fontFamily: 'var(--font-paper)',
                        backgroundColor: 'var(--desk-900)',
                        color: 'var(--amber)',
                        border: '1px solid var(--amber)',
                        borderRadius: '2px',
                        cursor: 'var(--cursor-pointer)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title="Xem lại mô phỏng bối cảnh As-Is (22 ngày)"
                    >
                      <span>📂</span>
                      <span>Xem As-Is</span>
                    </button>
                  </>
                ) : (
                  <span className="report-asis-empty">
                    Chưa nhập số liệu As-Is (src/data/asis.config.ts)
                  </span>
                )}
              </div>
            </section>

            <section className="report-rules" aria-label="Đối chiếu T3">
              <h2 className="report-section-title">
                Đối chiếu T3 · R1–R4
                {report.rulesFailed > 0 && (
                  <span className="report-rules-fail"> · {report.rulesFailed} không đạt</span>
                )}
              </h2>

              {report.rules.length === 0 && (
                <p className="report-note">T3 chưa chạy trong ca này (hồ sơ bị trả trước khi đối chiếu).</p>
              )}

              {report.rules.map((rule, index) => (
                <div
                  key={`${rule.id}_${index}`}
                  className="report-rule"
                  data-passed={rule.passed ? 'true' : 'false'}
                >
                  <span className="report-rule-id">{rule.id}</span>
                  <span className="report-rule-detail">{rule.detail}</span>
                  <span className="report-rule-mark">{rule.passed ? '✓' : '✗'}</span>
                </div>
              ))}

              {(report.remindersFired > 0 || report.disagreements > 0) && (
                <p className="report-note">
                  {report.remindersFired > 0 && `SLA đã nhắc ${report.remindersFired} lần. `}
                  {report.disagreements > 0 &&
                    `Người quyết khác AI ${report.disagreements} lần — đã ghi vào nhật ký.`}
                </p>
              )}
            </section>
          </div>

          <section className="report-steps" aria-label="Nhật ký thực thi">
            <h2 className="report-section-title">
              Nhật ký thực thi · {report.steps.length} tác vụ
            </h2>

            {report.steps.length === 0 && <p className="report-note">Chưa có tác vụ nào.</p>}

            <ol className="report-step-list">
              {report.steps.map((step, index) => (
                <li
                  key={`${step.nodeId}_${index}`}
                  className="report-step"
                  data-actor={step.actor === 'MÁY' ? 'machine' : 'human'}
                >
                  <span className="report-step-actor">{step.actor}</span>
                  <span className="report-step-body">
                    <span className="report-step-name">
                      <strong>{step.nodeId}</strong> · {step.name}
                    </span>
                    <span className="report-step-detail">
                      {step.detail} · Ngày {step.day}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <footer className="report-actions">
          <span className="report-sim-note">Dữ liệu sinh viên là giả lập · Không dùng hồ sơ thật.</span>
          <div className="report-action-group">
            <button type="button" className="report-btn" data-variant="primary" onClick={replay}>
              ↻ Chạy lại
            </button>
            <button type="button" className="report-btn" onClick={chooseScenario}>
              🗂 Chọn kịch bản khác
            </button>
            <button type="button" className="report-btn" onClick={xray}>
              🗺 Xem X-quang
            </button>
            <button type="button" className="report-btn" onClick={toggleAsIs}>
              📂 Xem As-Is
            </button>
            <button type="button" className="report-btn" data-variant="ghost" onClick={close}>
              Đóng (Esc)
            </button>
          </div>
        </footer>
      </article>
    </div>
  );
};
