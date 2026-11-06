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
import { Paper } from '../kit/Paper';
import {
  getPrincipalCases,
  updateCasePrincipalSign,
  SubmittedCase,
  subscribeCases,
} from '../../data/caseRegistry';
import { DecisionDoc } from '../../engine/types';

const DEFAULT_SIGNER = 'PGS.TS. Trần Đình Khôi - Hiệu trưởng';

/**
 * Thanh danh sách hồ sơ trình Ban Giám hiệu ký số Quyết định
 */
const PrincipalCaseDocketList: React.FC<{
  cases: SubmittedCase[];
  selectedId: string;
  filter: 'pending' | 'resolved' | 'all';
  onFilterChange: (filter: 'pending' | 'resolved' | 'all') => void;
  onSelect: (id: string) => void;
}> = ({ cases, selectedId, filter, onFilterChange, onSelect }) => {
  const pendingCases = cases.filter((c) => !c.principalSigned);
  const resolvedCases = cases.filter((c) => Boolean(c.principalSigned));

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
            HỘP THƯ TRÌNH KÝ SỐ BAN GIÁM HIỆU
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-paper)',
              fontSize: 17,
              margin: 0,
              color: 'var(--ink)',
            }}
          >
            📁 HỒ SƠ TRÌNH KÝ QUYẾT ĐỊNH ({cases.length} HỒ SƠ)
          </h3>
        </div>

        {/* Thanh Tab chuyển bộ lọc: Chờ ký số vs Đã ban hành */}
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
            ⏳ Chờ ký số ({pendingCases.length})
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
            ✓ Đã ban hành ({resolvedCases.length})
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
            ? '✓ Không có hồ sơ nào đang chờ ký số. Mọi Quyết định đã được ban hành!'
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
            const isSigned = Boolean(c.principalSigned);
            const isDeclined =
              c.advisorDecision === 'declined' ||
              c.ctsvDecision === 'invalid' ||
              c.status === 'rejected';
            const isReadyToSign = !isSigned && !isDeclined && c.ctsvDecision === 'valid';

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
                  : isReadyToSign
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
                    backgroundColor: isSigned
                      ? 'var(--wash-green)'
                      : isDeclined
                      ? 'var(--wash-red)'
                      : isReadyToSign
                      ? 'var(--amber)'
                      : 'rgba(0,0,0,0.06)',
                    color: isSigned
                      ? 'var(--stamp-green)'
                      : isDeclined
                      ? 'var(--stamp-red)'
                      : isReadyToSign
                      ? 'var(--desk-900)'
                      : 'var(--ink-soft)',
                  }}
                >
                  {isSigned
                    ? '✓ ĐÃ KÝ SỐ BAN HÀNH'
                    : isDeclined
                    ? '✗ ĐÃ TỪ CHỐI'
                    : isReadyToSign
                    ? '⏳ CHỜ BGH KÝ SỐ (T9)'
                    : '⏳ CHỜ CTSV THẨM ĐỊNH'}
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
                Số QĐ dự kiến: {c.decisionDoc?.number || `BL-${c.caseCode.replace(/[^0-9]/g, '')}/QĐ`}
              </div>
            </button>
          );
        })}
      </div>
      )}
    </Paper>
  );
};

export const PrincipalDesk: React.FC = () => {
  const view = useCaseView('principal');
  const completeUserTask = usePlaybackStore((s) => s.completeUserTask);
  const speed = useAppStore((s) => s.speed);
  const reducedMotion = useAppStore((s) => s.reducedMotion);

  const [submittedCases, setSubmittedCases] = useState<SubmittedCase[]>(() =>
    getPrincipalCases()
  );
  const [filter, setFilter] = useState<'pending' | 'resolved' | 'all'>('pending');
  const [selectedCaseId, setSelectedCaseId] = useState<string>(() => {
    const cases = getPrincipalCases();
    const appScenarioId = (useAppStore.getState().scenarioId || '').toUpperCase();
    const targetScenarioCode = appScenarioId ? `BL-2026-${appScenarioId}` : '';
    const pendingBgh = cases.find((c) => !c.principalSigned);
    if (targetScenarioCode) {
      const match = cases.find((c) => c.id === targetScenarioCode || c.caseCode === targetScenarioCode);
      if (match) return match.id;
    }
    return pendingBgh ? pendingBgh.id : cases[0]?.id || '';
  });

  const signerName = view.scenario?.directorPlan.principalSigner ?? DEFAULT_SIGNER;

  const [signing, setSigning] = useState<SigningState>('idle');
  const resolved = useRef(false);

  const scenarioId = view.scenario?.id;
  const logLength = view.log.length;

  useEffect(() => {
    const unsub = subscribeCases(() => {
      setSubmittedCases(getPrincipalCases());
    });
    return unsub;
  }, []);

  useEffect(() => {
    const cases = getPrincipalCases();
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
        const pendingBgh = cases.find((c) => !c.principalSigned);
        return pendingBgh ? pendingBgh.id : cases[0].id;
      });
    } else {
      setSelectedCaseId('');
    }
  }, [scenarioId, logLength]);

  useEffect(() => {
    setSigning('idle');
    resolved.current = false;
  }, [selectedCaseId]);

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

  const pendingCases = submittedCases.filter((c) => !c.principalSigned);
  const resolvedCases = submittedCases.filter((c) => Boolean(c.principalSigned));

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
    setSigning('idle');
    resolved.current = false;
    const target = submittedCases.find((c) => c.id === id);
    if (target) {
      useAppStore.getState().setCaseCode(target.caseCode);
      if (filter === 'pending' && target.principalSigned) {
        setFilter('resolved');
      } else if (filter === 'resolved' && !target.principalSigned) {
        setFilter('pending');
      }
    }
  };

  const handleFilterChange = (newFilter: 'pending' | 'resolved' | 'all') => {
    sfx.playPaper();
    setFilter(newFilter);
    if (newFilter === 'pending') {
      const pending = submittedCases.filter((c) => !c.principalSigned);
      if (pending.length > 0 && !pending.some((c) => c.id === selectedCaseId)) {
        setSelectedCaseId(pending[0].id);
        useAppStore.getState().setCaseCode(pending[0].caseCode);
      }
    } else if (newFilter === 'resolved') {
      const resolved = submittedCases.filter((c) => Boolean(c.principalSigned));
      if (resolved.length > 0 && !resolved.some((c) => c.id === selectedCaseId)) {
        setSelectedCaseId(resolved[0].id);
        useAppStore.getState().setCaseCode(resolved[0].caseCode);
      }
    }
  };

  if (submittedCases.length === 0) {
    return <DeskEmpty deskName="Bàn Ban Giám hiệu" reason="upcoming" />;
  }

  const selectedCase = activeCase || submittedCases[0];

  // Chuẩn bị DecisionDoc cho hồ sơ
  const doc: DecisionDoc = selectedCase.decisionDoc ?? {
    number: `BL-${selectedCase.caseCode.replace(/[^0-9]/g, '') || '2001'}/QĐ-ĐHKT`,
    decisionDate: '01/09/2026',
    durationSemesters: selectedCase.form.semesterCount,
    startSemester: selectedCase.form.startSemester,
    studentName: selectedCase.form.fullName,
    mssv: selectedCase.form.mssv,
    faculty: selectedCase.form.faculty,
    basisText: `Xét Đơn xin nghỉ học tạm thời của sinh viên ${selectedCase.form.fullName} và đề nghị của Trưởng phòng Công tác sinh viên.`,
    signed: false,
    signerName,
  };

  const handleStampLanded = () => {
    if (resolved.current) return;
    resolved.current = true;

    const updated = updateCasePrincipalSign(selectedCase.id, signerName);
    if (updated) {
      setSubmittedCases(getPrincipalCases());
    }
    sfx.playStamp();

    if (view.scenario?.form.mssv === selectedCase.studentMssv) {
      void completeUserTask('T9', { signerName });
    }
  };

  const isCaseSigned = Boolean(selectedCase.principalSigned);
  const isEligibleForBgh =
    selectedCase.advisorDecision === 'confirmed' &&
    selectedCase.ctsvDecision === 'valid';

  // Khóa cứng: Nếu hồ sơ không đủ điều kiện (hoặc bị từ chối ở bước trước) thì tuyệt đối không cho ký
  if (!isEligibleForBgh) {
    return (
      <div
        className="desk-page principal-portal-page"
        style={{
          width: '100%',
          maxWidth: '980px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <PrincipalCaseDocketList
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
                Hồ sơ không đủ điều kiện trình ký (Đã từ chối hoặc chưa thẩm định)
              </h3>
              <p style={{ margin: '6px 0 0 0', fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                Hồ sơ <strong>{selectedCase.caseCode}</strong> của sinh viên {selectedCase.studentName} chưa hoàn tất hoặc đã bị từ chối ở bước trước{' '}
                ({selectedCase.advisorDecision !== 'confirmed' ? 'Cố vấn học tập không xác nhận' : 'Phòng CTSV chưa thẩm định hợp lệ'}). Ban Giám hiệu không thể phê duyệt hay ký số văn bản này.
              </p>
            </div>
          </div>
        </Paper>
      </div>
    );
  }

  // Khi hồ sơ đã được BGH ký số hoàn tất
  if (isCaseSigned && filter !== 'pending') {
    return (
      <div
        className="desk-page principal-portal-page"
        style={{
          width: '100%',
          maxWidth: '980px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <PrincipalCaseDocketList
          cases={submittedCases}
          selectedId={selectedCase.id}
          filter={filter}
          onFilterChange={handleFilterChange}
          onSelect={handleSelectCase}
        />
        <PrincipalPortalResult
          doc={doc}
          signerName={selectedCase.principalSignerName ?? signerName}
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

  // Trường hợp tab Chờ ký số nhưng không còn hồ sơ nào chờ
  if (filter === 'pending' && pendingCases.length === 0) {
    return (
      <div
        className="desk-page principal-portal-page"
        style={{
          width: '100%',
          maxWidth: '980px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <PrincipalCaseDocketList
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
            ĐÃ BAN HÀNH TOÀN BỘ QUYẾT ĐỊNH
          </h3>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14, maxWidth: 500, margin: '0 auto 18px', lineHeight: 1.5 }}>
            Hiện không có hồ sơ nào đang chờ Ban Giám hiệu ký số Quyết định. Mọi văn bản đã được chứng thực PKI và ban hành về Cổng Sinh viên.
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
              📁 Xem danh sách Quyết định đã ban hành ({resolvedCases.length})
            </button>
          )}
        </Paper>
      </div>
    );
  }

  // Khi hồ sơ đang chờ BGH ký số
  return (
    <div
      className="desk-page principal-page"
      style={{
        width: '100%',
        maxWidth: '980px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <PrincipalCaseDocketList
        cases={submittedCases}
        selectedId={selectedCase.id}
        filter={filter}
        onFilterChange={handleFilterChange}
        onSelect={handleSelectCase}
      />

      <div className="desk-head">
        <div>
          <h1 className="desk-title">Bàn Ban Giám hiệu</h1>
          <p className="desk-sub">
            Lane L4 · Kiểm tra dự thảo và ký số Quyết định:{' '}
            <strong style={{ color: 'var(--amber)' }}>
              {selectedCase.caseCode} — {selectedCase.studentName} ({selectedCase.studentMssv})
            </strong>{' '}
            · NGÀY {view.day}
          </p>
        </div>
        <div className="desk-toolbar">
          <span className="desk-hint">Cắm USB Token ký số điện tử để phê duyệt</span>
        </div>
      </div>

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
