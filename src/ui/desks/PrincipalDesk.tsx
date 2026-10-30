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
  getAllSubmittedCases,
  updateCasePrincipalSign,
  SubmittedCase,
} from '../../data/caseRegistry';
import { DecisionDoc } from '../../engine/types';

const DEFAULT_SIGNER = 'PGS.TS. Trần Đình Khôi - Hiệu trưởng';

/**
 * Thanh danh sách hồ sơ trình Ban Giám hiệu ký số Quyết định
 */
const PrincipalCaseDocketList: React.FC<{
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
            📁 DANH SÁCH HỒ SƠ TRÌNH KÝ QUYẾT ĐỊNH ({cases.length} HỒ SƠ)
          </h3>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
          Bấm chọn từng hồ sơ để cắm Token USB và ký số Quyết định ban hành (T9)
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
    </Paper>
  );
};

export const PrincipalDesk: React.FC = () => {
  const view = useCaseView('principal');
  const completeUserTask = usePlaybackStore((s) => s.completeUserTask);
  const speed = useAppStore((s) => s.speed);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const sessionMode = useAppStore((s) => s.sessionMode);

  const [submittedCases, setSubmittedCases] = useState<SubmittedCase[]>(() =>
    getAllSubmittedCases()
  );
  const [selectedCaseId, setSelectedCaseId] = useState<string>(() => {
    const all = getAllSubmittedCases();
    // Ưu tiên chọn hồ sơ đã được CTSV duyệt và đang chờ BGH ký số
    const pendingBgh = all.find((c) => c.ctsvDecision === 'valid' && !c.principalSigned);
    if (pendingBgh) return pendingBgh.id;
    return all[0]?.id || '';
  });

  const signerName = view.scenario?.directorPlan.principalSigner ?? DEFAULT_SIGNER;

  const [signing, setSigning] = useState<SigningState>('idle');
  const resolved = useRef(false);

  useEffect(() => {
    const all = getAllSubmittedCases();
    setSubmittedCases(all);
    if (all.length > 0) {
      if (!selectedCaseId || !all.some((c) => c.id === selectedCaseId)) {
        const pendingBgh = all.find((c) => c.ctsvDecision === 'valid' && !c.principalSigned);
        const targetId = pendingBgh ? pendingBgh.id : all[0].id;
        setSelectedCaseId(targetId);
        const target = all.find((c) => c.id === targetId);
        if (target) useAppStore.getState().setCaseCode(target.caseCode);
      }
    }
  }, [view]);

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

  const handleSelectCase = (id: string) => {
    sfx.playPaper();
    setSelectedCaseId(id);
    setSigning('idle');
    resolved.current = false;
    const target = submittedCases.find((c) => c.id === id);
    if (target) {
      useAppStore.getState().setCaseCode(target.caseCode);
    }
  };

  if (submittedCases.length === 0) {
    return <DeskEmpty deskName="Bàn Ban Giám hiệu" reason="not-submitted" />;
  }

  const selectedCase =
    submittedCases.find((c) => c.id === selectedCaseId) || submittedCases[0];

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
      setSubmittedCases(getAllSubmittedCases());
    }
    sfx.playStamp();

    if (view.scenario?.form.mssv === selectedCase.studentMssv) {
      void completeUserTask('T9', { signerName });
    }
  };

  const isCaseSigned = Boolean(selectedCase.principalSigned);
  const isDeclined =
    selectedCase.advisorDecision === 'declined' ||
    selectedCase.ctsvDecision === 'invalid' ||
    selectedCase.status === 'rejected';

  // Nếu hồ sơ đã bị từ chối ở bước trước thì không trình ký
  if (isDeclined && !isCaseSigned) {
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
          onSelect={handleSelectCase}
        />
        <Paper className="portal-docket-paper" elevated width="100%" style={{ padding: 24, borderLeft: '5px solid var(--stamp-red)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 28 }}>🛑</div>
            <div>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-paper)', fontSize: 18, color: 'var(--stamp-red)' }}>
                Hồ sơ không đủ điều kiện trình ký (Đã từ chối)
              </h3>
              <p style={{ margin: '6px 0 0 0', fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                Hồ sơ <strong>{selectedCase.caseCode}</strong> của sinh viên {selectedCase.studentName} đã bị từ chối ở bước trước{' '}
                ({selectedCase.advisorDecision === 'declined' ? 'Cố vấn học tập không xác nhận' : 'Phòng CTSV thẩm định minh chứng không hợp lệ'}). Không khởi tạo dự thảo quyết định và không trình Ban Giám hiệu ký số.
              </p>
            </div>
          </div>
        </Paper>
      </div>
    );
  }

  // Khi hồ sơ đã được BGH ký số hoàn tất
  if (isCaseSigned) {
    if (sessionMode === 'portal') {
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
            onSelect={handleSelectCase}
          />
          <PrincipalPortalResult
            doc={doc}
            signerName={selectedCase.principalSignerName ?? signerName}
            caseCode={selectedCase.caseCode}
            day={selectedCase.day || view.day || 0}
          />
        </div>
      );
    }

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
          onSelect={handleSelectCase}
        />
        <div className="principal-grid">
          <DecisionDraft
            doc={doc}
            signing="signed"
            signerName={selectedCase.principalSignerName ?? signerName}
            mode="decision"
            autoStamp={false}
          />
          <div className="signing-done">
            <div className="signing-kicker">ĐÃ HOÀN TẤT T9</div>
            <h3 className="signing-title">Quyết định đã ký số</h3>
            <p className="signing-sub">
              Hệ thống đã chuyển quyết định sang DO3 và gửi thông báo cho sinh viên.
            </p>
            <div className="signing-done-name">
              {selectedCase.principalSignerName ?? signerName}
            </div>
          </div>
        </div>
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
