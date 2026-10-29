import React from 'react';
import { DecisionDoc } from '../../../engine/types';
import { useAppStore } from '../../../store/useApp';
import { usePlaybackStore } from '../../../store/playback';
import { MOTION } from '../../motion';
import { Paper } from '../../kit/Paper';
import { Stamp } from '../../kit/Stamp';
import { SigningState } from './signingMachine';
import { SignatureSvg } from './SignatureSvg';
import { AiBadge } from '../../kit/AiBadge';

interface DecisionDraftProps {
  doc: DecisionDoc;
  signing: SigningState;
  signerName: string;
  mode: 'draft' | 'decision';
  autoStamp: boolean;
  onStampLanded?: () => void;
}

const AutoField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="decision-row auto-field">
    <span className="decision-label">{label}</span>
    <span className="decision-value">{value}</span>
    <span className="auto-tag">Tự động điền bởi T8</span>
  </div>
);

/** Dự thảo quyết định: trường máy điền tô vàng; ký xong thì thành quyết định. */
export const DecisionDraft: React.FC<DecisionDraftProps> = ({
  doc,
  signing,
  signerName,
  mode,
  autoStamp,
  onStampLanded,
}) => {
  const speed = useAppStore((s) => s.speed);
  const sessionMode = useAppStore((s) => s.sessionMode);
  const isCustomCase = usePlaybackStore((s) => s.isCustomCase);
  const isCustomFlow = isCustomCase || sessionMode === 'portal';
  const signed = mode === 'decision' || signing === 'signed';

  return (
    <Paper className="decision-paper" rotation={-0.5} watermark={true} creased={true} elevated={true}>
      <div className="decision-head">
        <div className="decision-kicker">TRƯỜNG ĐẠI HỌC KINH TẾ – ĐẠI HỌC ĐÀ NẴNG</div>
        <h2 className="decision-title">
          {signed ? 'QUYẾT ĐỊNH' : 'DỰ THẢO QUYẾT ĐỊNH'}
        </h2>
        <div className="decision-number">
          Số: {doc.number} · {doc.decisionDate}
        </div>
      </div>

      <div className="decision-body">
        <AutoField label="Họ và tên" value={doc.studentName} />
        <AutoField label="MSSV" value={doc.mssv} />
        <AutoField label="Khoa" value={doc.faculty} />
        <AutoField label="Thời hạn bảo lưu" value={`${doc.durationSemesters} học kỳ`} />
        <AutoField label="Bắt đầu từ" value={doc.startSemester} />
        <AutoField label="Ngày lập" value={doc.decisionDate} />
      </div>

      <div className="decision-basis">
        {mode === 'draft' && !isCustomFlow ? (
          <div className="decision-ai-label">
            <span className="decision-label" style={{ marginBottom: 0 }}>Căn cứ · AI soạn (AI-4)</span>
            <AiBadge compact />
          </div>
        ) : (
          <div style={{ marginBottom: 4 }}>
            <span className="decision-label" style={{ marginBottom: 0 }}>Căn cứ ban hành:</span>
          </div>
        )}
        <p>{doc.basisText}</p>
      </div>

      <div className="decision-sign-area">
        <div className="decision-sign-label">
          {signed ? 'Đã ký số bởi' : 'Chờ ký số'}
          <SignatureSvg
            active={signing === 'signing'}
            complete={signed}
            durationMs={MOTION.signatureDrawMs / speed}
            signerName={signed ? doc.signerName ?? signerName : undefined}
          />
        </div>
      </div>

      {signed && (
        <div className="decision-stamp">
          {autoStamp && signing === 'signed' ? (
            <Stamp
              label="ĐÃ KÝ SỐ"
              color="red"
              seed="T9-signed"
              size="lg"
              autoPlay
              onLanded={onStampLanded}
            />
          ) : (
            <Stamp label="ĐÃ KÝ SỐ" color="red" seed="T9-signed" size="lg" />
          )}
        </div>
      )}

      {signed && (
        <div
          style={{
            position: 'absolute',
            left: 28,
            bottom: 60,
            width: 76,
            height: 76,
            borderRadius: '50%',
            border: '2px solid var(--seal-gold)',
            boxShadow: '0 0 10px rgba(201, 158, 50, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--seal-gold)',
            fontFamily: 'var(--font-paper)',
            fontSize: 7.5,
            fontWeight: 'bold',
            letterSpacing: 0.8,
            transform: 'rotate(-12deg)',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontSize: 13, lineHeight: 1 }}>★</div>
          <div>BẢO MẬT PKI</div>
          <div style={{ fontSize: 6.5, opacity: 0.85 }}>SHA-256 CERT</div>
        </div>
      )}

      <div className="decision-footnote">
        {mode === 'draft'
          ? 'Dự thảo được điền tự động từ DO2 và ký số tại T9 · Dữ liệu mô phỏng.'
          : 'Văn bản quyết định chính thức đã được ký số và có hiệu lực thi hành.'}
      </div>
    </Paper>
  );
};
