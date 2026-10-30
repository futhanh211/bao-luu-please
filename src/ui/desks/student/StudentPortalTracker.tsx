import React from 'react';
import { EngineEvent, DecisionDoc } from '../../../engine/types';
import { useAuthStore } from '../../../store/useAuth';
import { useAppStore } from '../../../store/useApp';
import { DecisionDraft } from '../principal/DecisionDraft';
import { composeLetter, LetterDoc } from '../../../data/letters';
import { Paper } from '../../kit/Paper';
import { Stamp } from '../../kit/Stamp';
import { sfx } from '../../audio/sfx';
import { getSubmittedCaseByMssv, getSubmittedCaseById } from '../../../data/caseRegistry';

interface StudentPortalTrackerProps {
  caseCode: string;
  studentName: string;
  mssv: string;
  faculty: string;
  log: EngineEvent[];
  day: number;
  decisionDoc?: DecisionDoc | null;
}

export const StudentPortalTracker: React.FC<StudentPortalTrackerProps> = ({
  caseCode,
  studentName,
  mssv,
  faculty,
  log,
  day,
  decisionDoc,
}) => {
  const logout = useAuthStore((s) => s.logout);
  const setScreen = useAppStore((s) => s.setScreen);

  const regCase = getSubmittedCaseByMssv(mssv) || getSubmittedCaseById(caseCode);
  const activeDoc = decisionDoc || regCase?.decisionDoc;

  // Phân tích trạng thái kết thúc ca
  const endEvent = [...log].reverse().find((e) => e.type === 'case.ended') as
    | { type: 'case.ended'; endEventId: string; outcome: string }
    | undefined;

  const t4Done =
    log.some((e) => e.type === 'task.completed' && e.taskId === 'T4') ||
    Boolean(regCase?.advisorDecision);
  const t5Done =
    log.some((e) => e.type === 'task.completed' && e.taskId === 'T5') ||
    Boolean(regCase?.ctsvDecision);
  const t9Done =
    log.some((e) => e.type === 'task.completed' && e.taskId === 'T9') ||
    Boolean(regCase?.principalSigned);

  const isApproved = t9Done || endEvent?.endEventId === 'E_END_OK';
  const isRejected =
    regCase?.ctsvDecision === 'invalid' || endEvent?.endEventId === 'E_END_REJECTED';
  const isReturned =
    regCase?.advisorDecision === 'declined' || endEvent?.endEventId === 'E_END_RETURNED';
  const isFinished = isApproved || isRejected || isReturned;

  // Lấy thư thông báo nếu có (MF2 hoặc MF3)
  const lastMsg = [...log].reverse().find(
    (e) => e.type === 'message.sent' && ['MF2', 'MF3', 'MF4'].includes(e.flowId)
  );
  const letter: LetterDoc | null =
    lastMsg && lastMsg.type === 'message.sent'
      ? composeLetter(lastMsg.flowId, lastMsg.payload)
      : null;

  const handleLogout = () => {
    sfx.play('paper');
    logout();
    setScreen('login');
  };

  // 5 mốc tiến độ chuẩn BPMN
  const steps = [
    {
      title: 'Nộp đơn trực tuyến',
      actor: 'Sinh viên',
      status: 'done' as const,
      tag: `Ngày ${day}`,
    },
    {
      title: 'Xác nhận nguyện vọng',
      actor: 'Cố vấn học tập',
      status: t4Done
        ? ('done' as const)
        : isReturned
        ? ('fail' as const)
        : ('waiting' as const),
      tag: t4Done ? 'Đã duyệt' : isReturned ? 'Trả đơn' : 'Đang duyệt',
    },
    {
      title: 'Thẩm định hồ sơ',
      actor: 'Phòng CTSV',
      status: t5Done
        ? ('done' as const)
        : isRejected && !t5Done
        ? ('fail' as const)
        : t4Done
        ? ('waiting' as const)
        : ('pending' as const),
      tag: t5Done ? 'Hợp lệ' : isRejected && !t5Done ? 'Từ chối' : t4Done ? 'Đang thẩm định' : 'Chờ',
    },
    {
      title: 'Ký số Quyết định',
      actor: 'Ban Giám hiệu',
      status: t9Done
        ? ('done' as const)
        : isRejected
        ? ('fail' as const)
        : t5Done
        ? ('waiting' as const)
        : ('pending' as const),
      tag: t9Done ? 'Đã ký số' : isRejected ? 'Đã dừng' : t5Done ? 'Trình ký' : 'Chờ',
    },
    {
      title: 'Kết quả Một cửa',
      actor: 'Hệ thống Một cửa số',
      status: isApproved
        ? ('done' as const)
        : isRejected
        ? ('fail' as const)
        : isReturned
        ? ('return' as const)
        : ('pending' as const),
      tag: isApproved ? 'Thành công' : isRejected ? 'Từ chối' : isReturned ? 'Trả hồ sơ' : 'Chờ hoàn tất',
    },
  ];

  const headerBorder = isApproved ? 'var(--stamp-green)' : isRejected ? 'var(--stamp-red)' : 'var(--amber)';
  const headerBg = isApproved ? 'rgba(46, 125, 50, 0.08)' : isRejected ? 'rgba(179, 38, 30, 0.08)' : 'rgba(217, 119, 6, 0.08)';

  return (
    <div className="desk-page student-portal-tracker" style={{ width: '100%', maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Header Banner trạng thái retro */}
      <Paper className="portal-docket-paper" elevated width="100%" style={{ borderLeft: `5px solid ${headerBorder}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 'bold', letterSpacing: 0.8, color: headerBorder, textTransform: 'uppercase', marginBottom: 4 }}>
              {isApproved && '🎉 THỦ TỤC NGHỈ HỌC TẠM THỜI ĐÃ HOÀN TẤT'}
              {isRejected && '❌ HỒ SƠ KHÔNG ĐƯỢC PHÊ DUYỆT (TỪ CHỐI)'}
              {isReturned && '⚠️ HỒ SƠ CẦN BỔ SUNG MINH CHỨNG (TRẢ ĐƠN)'}
              {!isFinished && '📨 HỒ SƠ ĐANG ĐƯỢC XỬ LÝ TRỰC TUYẾN'}
              <span> · NGÀY {day}</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-paper)', fontSize: 20, color: 'var(--ink)', margin: '0 0 6px 0' }}>
              {isApproved && 'Quyết định bảo lưu kết quả học tập đã được ban hành'}
              {isRejected && 'Nhà trường thông báo từ chối giải quyết hồ sơ bảo lưu'}
              {isReturned && 'Hồ sơ chưa hợp lệ — Vui lòng bổ sung giấy tờ'}
              {!isFinished && 'Hồ sơ xin bảo lưu của bạn đang được các phòng ban thụ lý'}
            </h2>
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.5, maxWidth: 650 }}>
              {isApproved && `Quyết định số ${decisionDoc?.number || 'BL-2001/QĐ-ĐHKT'} đã được Ban Giám hiệu ký số chính thức. Bạn có thể xem toàn văn văn bản ngay bên dưới.`}
              {isRejected && 'Hồ sơ không đáp ứng điều kiện theo Quy chế đào tạo (nợ học phí hoặc minh chứng y tế không hợp lệ). Xem chi tiết lý do bên dưới.'}
              {isReturned && 'Hồ sơ thiếu minh chứng bắt buộc theo quy định tiếp nhận của Nhà trường. Vui lòng kiểm tra hướng dẫn nộp bổ sung.'}
              {!isFinished && `Hồ sơ ${caseCode} của sinh viên ${studentName} (${mssv} · ${faculty}) đang trong luồng xử lý.`}
            </p>
          </div>

          <div style={{ padding: '8px 14px', border: `1.5px solid ${headerBorder}`, backgroundColor: headerBg, borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <div style={{ fontSize: 10.5, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>Mã hồ sơ tiếp nhận</div>
            <div style={{ fontSize: 15, fontWeight: 'bold', color: 'var(--ink)', fontFamily: 'var(--font-paper)' }}>{caseCode}</div>
          </div>
        </div>

        {/* Nút tác vụ */}
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap', paddingTop: 10, borderTop: '1px dashed var(--paper-line)' }}>
          <button
            type="button"
            onClick={handleLogout}
            style={{ padding: '6px 14px', fontFamily: 'var(--font-paper)', fontSize: 13, backgroundColor: 'transparent', color: 'var(--ink-soft)', border: '1px solid var(--paper-line)', borderRadius: 'var(--radius-sm)', cursor: 'var(--cursor-pointer)' }}
          >
            🚪 Đăng xuất Cổng Sinh viên
          </button>
        </div>
      </Paper>

      {/* 2. Compact 5-Step Stepper Bar (gọn gàng, thanh lịch, retro) */}
      <Paper className="portal-docket-paper" elevated width="100%" style={{ padding: '12px 18px' }}>
        <div style={{ fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--ink-soft)', marginBottom: 8 }}>
          Tiến độ giải quyết Một cửa số (5 bước)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {steps.map((st, idx) => {
            const isDone = st.status === 'done';
            const isWait = st.status === 'waiting';
            const isFail = st.status === 'fail';
            const isRet = st.status === 'return';

            const circleBg = isDone ? 'var(--stamp-green)' : isFail ? 'var(--stamp-red)' : isWait || isRet ? 'var(--amber)' : 'var(--paper-dim)';
            const circleColor = isDone || isFail ? '#fff' : isWait || isRet ? 'var(--desk-900)' : 'var(--ink-soft)';
            const circleIcon = isDone ? '✓' : isFail ? '✗' : isWait ? '⏳' : isRet ? '⚠️' : idx + 1;

            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: circleBg, color: circleColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>
                  {circleIcon}
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 'bold', color: 'var(--ink)', lineHeight: 1.2 }}>{st.title}</div>
                <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 2 }}>{st.actor}</div>
                <span style={{ marginTop: 3, fontSize: 9.5, fontWeight: 'bold', padding: '1px 5px', borderRadius: 2, backgroundColor: isDone ? 'var(--wash-green)' : isFail ? 'var(--wash-red)' : isWait ? 'var(--wash-amber)' : 'rgba(0,0,0,0.05)', color: isDone ? 'var(--stamp-green)' : isFail ? 'var(--stamp-red)' : isWait ? '#b45309' : 'var(--ink-soft)' }}>
                  {st.tag}
                </span>
              </div>
            );
          })}
        </div>
      </Paper>

      {/* 3. Hiển thị văn bản kết quả ngay trung tâm */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {isApproved && activeDoc && (
          <DecisionDraft
            doc={activeDoc}
            signing="signed"
            signerName={activeDoc.signerName ?? 'PGS.TS. Trần Đình Khôi'}
            mode="decision"
            autoStamp={false}
          />
        )}

        {(isRejected || isReturned) && (
          <Paper className="decision-paper" rotation={-0.3} watermark creased elevated style={{ width: '100%', maxWidth: 720, padding: '32px 36px' }}>
            <div style={{ textAlign: 'center', borderBottom: '2px solid var(--ink)', paddingBottom: 10, marginBottom: 14 }}>
              <div style={{ fontSize: 11, letterSpacing: 1, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>
                TRƯỜNG ĐẠI HỌC KINH TẾ – ĐẠI HỌC ĐÀ NẴNG
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>
                HỆ THỐNG MỘT CỬA SỐ · BỘ PHẬN TIẾP NHẬN & TRẢ KẾT QUẢ
              </div>
              <h2 style={{ fontFamily: 'var(--font-paper)', fontSize: 20, textTransform: 'uppercase', color: isRejected ? 'var(--stamp-red)' : 'var(--amber)', margin: '10px 0 4px 0' }}>
                {isRejected ? 'THÔNG BÁO TỪ CHỐI GIẢI QUYẾT HỒ SƠ' : 'PHIẾU HƯỚNG DẪN BỔ SUNG HỒ SƠ'}
              </h2>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                Mã hồ sơ: {caseCode} · Ngày thông báo: Ngày làm việc {day}
              </div>
            </div>

            <div style={{ fontFamily: 'var(--font-paper)', fontSize: 14, lineHeight: 1.6, color: 'var(--ink)' }}>
              <p>
                <strong>Kính gửi:</strong> Sinh viên <strong>{studentName}</strong> (MSSV: <strong>{mssv}</strong> · Khoa: {faculty})
              </p>
              <p>
                {letter?.intro || (isRejected
                  ? 'Hội đồng xét duyệt và Phòng Công tác sinh viên đã thẩm định hồ sơ xin nghỉ học tạm thời của bạn nhưng không đủ điều kiện phê duyệt theo Quy định hiện hành.'
                  : 'Hồ sơ xin nghỉ học tạm thời của bạn chưa đáp ứng yêu cầu tiếp nhận. Vui lòng bổ sung minh chứng và nộp lại.')}
              </p>

              {letter && letter.sections.length > 0 && (
                <div style={{ margin: '14px 0', padding: '12px 16px', backgroundColor: 'var(--paper-dim)', border: '1px dashed var(--paper-line)', borderRadius: 'var(--radius-sm)' }}>
                  {letter.sections.map((sec, sIdx) => (
                    <div key={sIdx} style={{ marginBottom: 8 }}>
                      <div style={{ fontWeight: 'bold', fontSize: 13, color: isRejected ? 'var(--stamp-red)' : 'var(--ink)' }}>
                        {sec.heading}:
                      </div>
                      {sec.lines.map((ln, lIdx) => (
                        <div key={lIdx} style={{ fontSize: 13, marginLeft: 10, marginTop: 2 }}>{ln}</div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <Stamp label={isRejected ? 'TỪ CHỐI' : 'TRẢ HỒ SƠ'} color={isRejected ? 'red' : 'blue'} size="lg" />
                </div>
                <div style={{ textAlign: 'center', fontFamily: 'var(--font-paper)', minWidth: 200 }}>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Đà Nẵng, ngày giải quyết thứ {day}</div>
                  <div style={{ fontWeight: 'bold', fontSize: 13, marginTop: 4 }}>BỘ PHẬN MỘT CỬA CTSV</div>
                  <div style={{ height: 40 }} />
                  <div style={{ fontWeight: 'bold', fontSize: 13 }}>ThS. Nguyễn Thị Mai</div>
                </div>
              </div>
            </div>
          </Paper>
        )}

        {!isFinished && (
          <Paper className="decision-paper" elevated style={{ width: '100%', maxWidth: 640, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
            <h3 style={{ fontFamily: 'var(--font-paper)', fontSize: 17, margin: '0 0 6px 0' }}>Hồ sơ đang trong luồng thẩm tra</h3>
            <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', margin: 0, lineHeight: 1.5 }}>
              Đơn xin bảo lưu của bạn đã được chuyển tới Cố vấn học tập và Phòng Công tác sinh viên để tiếp nhận và thẩm tra theo quy trình Một cửa số. Bạn có thể theo dõi tiến độ xử lý trực tiếp tại bảng tiến độ phía trên.
            </p>
          </Paper>
        )}
      </div>
    </div>
  );
};
