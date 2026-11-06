import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useApp';
import { usePlaybackStore } from '../../store/playback';
import { EvidenceItem, StudentApplicationForm } from '../../engine/types';
import { composeLetter, LetterDoc } from '../../data/letters';
import {
  StudentEvidenceOptionKey,
  STUDENT_EVIDENCE_OPTIONS,
} from '../../data/customTestData';
import {
  StudentDetailedFormData,
  getStudentFormData,
  saveStudentFormData,
  buildEvidenceItemFromFormData,
  buildEvidenceItemsFromFormData,
} from '../../data/studentFormData';
import { StudentChatContext } from '../../data/knowledge-base';
import { MOTION } from '../motion';
import { Envelope } from '../kit/Envelope';
import { Paperclip } from '../kit/Paperclip';
import { sfx } from '../audio/sfx';
import { ApplicationPaper } from './student/ApplicationPaper';
import { EvidenceBag } from './student/EvidenceBag';
import { EvidenceModal } from './student/EvidenceModal';
import { EvidenceFormModal } from './student/EvidenceFormModal';
import { LetterModal } from './student/LetterModal';
import { buildStudentTimeline } from './studentProgress';
import { DeskTab, StudentRightPanel } from './student/StudentRightPanel';
import { StudentPortalTracker } from './student/StudentPortalTracker';

export const StudentDesk: React.FC = () => {
  const caseCode = useAppStore((s) => s.caseCode);
  const speed = useAppStore((s) => s.speed);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const aiBusy = useAppStore((s) => s.aiBusy);
  const sessionMode = useAppStore((s) => s.sessionMode);

  const scenario = usePlaybackStore((s) => s.scenario);
  const submissionDraft = usePlaybackStore((s) => s.submissionDraft);
  const submitted = usePlaybackStore((s) => s.submitted);
  const updateDraftForm = usePlaybackStore((s) => s.updateDraftForm);
  const attachEvidence = usePlaybackStore((s) => s.attachEvidence);
  const detachEvidence = usePlaybackStore((s) => s.detachEvidence);
  const submitApplication = usePlaybackStore((s) => s.submitApplication);
  const currentEventLog = usePlaybackStore((s) => s.currentEventLog);
  const eventDays = usePlaybackStore((s) => s.eventDays);
  const waitingTaskId = usePlaybackStore((s) => s.waitingTaskId);
  const engine = usePlaybackStore((s) => s.engine);
  const day = usePlaybackStore((s) => s.mapState.counters.day);
  const setEvidenceList = usePlaybackStore((s) => s.setEvidenceList);
  const removeEvidenceItem = usePlaybackStore((s) => s.removeEvidenceItem);
  const studentRecord = usePlaybackStore((s) => s.studentRecord);
  const initScenario = usePlaybackStore((s) => s.initScenario);
  const prepareStudentResubmission = usePlaybackStore((s) => s.prepareStudentResubmission);

  const [tab, setTab] = useState<DeskTab>('inbox');
  const [readIds, setReadIds] = useState<string[]>([]);
  const [openEvidence, setOpenEvidence] = useState<EvidenceItem | null>(null);
  const [fillOptionKey, setFillOptionKey] = useState<StudentEvidenceOptionKey | null>(null);
  const [openLetter, setOpenLetter] = useState<LetterDoc | null>(null);
  const [flying, setFlying] = useState(false);

  const studentMssv = submissionDraft?.form.mssv || studentRecord?.mssv || '251121536115';

  const [detailedFormData, setDetailedFormData] = useState<StudentDetailedFormData>(() =>
    getStudentFormData(studentMssv, {
      name: submissionDraft?.form.fullName || studentRecord?.name,
      className: submissionDraft?.form.className || studentRecord?.className,
      faculty: submissionDraft?.form.faculty || studentRecord?.faculty,
      email: submissionDraft?.form.email || studentRecord?.email,
      phone: submissionDraft?.form.phone || studentRecord?.phone,
    })
  );

  useEffect(() => {
    if (!studentMssv) return;
    const loaded = getStudentFormData(studentMssv, {
      name: submissionDraft?.form.fullName || studentRecord?.name,
      className: submissionDraft?.form.className || studentRecord?.className,
      faculty: submissionDraft?.form.faculty || studentRecord?.faculty,
      email: submissionDraft?.form.email || studentRecord?.email,
      phone: submissionDraft?.form.phone || studentRecord?.phone,
    });
    setDetailedFormData(loaded);
  }, [studentMssv, studentRecord?.name, studentRecord?.className, studentRecord?.faculty]);

  // Tự động nạp kịch bản nếu scenario hoặc draft chưa sẵn sàng khi vào bàn
  useEffect(() => {
    if (!scenario || !submissionDraft) {
      const targetScenario = useAppStore.getState().scenarioId || 's1';
      initScenario(targetScenario);
    }
  }, [scenario, submissionDraft, initScenario]);

  const handleStartFillOption = (key: StudentEvidenceOptionKey) => {
    setFillOptionKey(key);
  };

  const handleSaveEvidenceForm = (updatedData: StudentDetailedFormData) => {
    setDetailedFormData(updatedData);
    saveStudentFormData(studentMssv, updatedData);

    const option = STUDENT_EVIDENCE_OPTIONS.find((o) => o.key === fillOptionKey);
    const matchingReason = option ? option.matchingReason : updatedData.reason;

    updateDraftForm({ reason: matchingReason });

    // Nộp cả Giấy xác nhận và Minh chứng do người dùng tải lên từ máy tính
    const items = buildEvidenceItemsFromFormData(updatedData, matchingReason);
    setEvidenceList(items, true);

    setFillOptionKey(null);
    sfx.playStamp();
    sfx.playPaperclip();
  };

  const handleDirectFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const fileItem: EvidenceItem = {
        id: `ev_file_direct_${Date.now()}`,
        type: 'attached_file',
        name: `Minh chứng gốc từ máy: ${file.name}`,
        content: `Tệp minh chứng do sinh viên tải lên trực tiếp từ máy tính: ${file.name} (${(file.size / 1024).toFixed(1)} KB).`,
        fileData: {
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          lastModified: file.lastModified,
          dataUrl: result,
        },
        fields: [
          { id: 'fileName', label: 'Tên tệp gốc', value: file.name },
          { id: 'fileSize', label: 'Dung lượng', value: `${(file.size / 1024).toFixed(1)} KB` },
          { id: 'fileType', label: 'Định dạng', value: file.type || 'Tệp tin' },
          { id: 'source', label: 'Nguồn tải lên', value: 'Máy tính người dùng' },
        ],
      };

      const current = scenario?.evidence || [];
      const updated = [...current, fileItem];
      setEvidenceList(updated, true);
      sfx.playStamp();
      sfx.playPaperclip();
    };
    reader.readAsDataURL(file);
  };

  const handleEditEvidence = (item: EvidenceItem) => {
    let key: StudentEvidenceOptionKey = 'medical';
    if (item.type === 'military_call' || item.type === 'military_service') {
      key = 'military';
    } else if (item.type === 'hardship_proof') {
      key = 'hardship';
    } else if (item.type === 'personal_reason') {
      key = 'personal';
    } else {
      const reason = submissionDraft?.form.reason;
      if (reason === 'Nghĩa vụ quân sự') key = 'military';
      else if (reason === 'Hoàn cảnh gia đình') key = 'hardship';
      else if (reason === 'Lý do cá nhân khác') key = 'personal';
      else key = 'medical';
    }
    setFillOptionKey(key);
  };

  const handleFormChange = (patch: Partial<StudentApplicationForm>) => {
    updateDraftForm(patch);

    const updatedDetailed: StudentDetailedFormData = {
      ...detailedFormData,
      ...patch,
    };
    setDetailedFormData(updatedDetailed);
    saveStudentFormData(studentMssv, updatedDetailed);

    if (patch.reason && scenario && scenario.evidence && scenario.evidence.length > 0) {
      const updatedItem = buildEvidenceItemFromFormData(updatedDetailed, patch.reason);
      setEvidenceList([updatedItem], submissionDraft?.attachedEvidenceIds.includes(updatedItem.id) ?? false);
    }
  };

  const handleRemoveEvidence = (id: string) => {
    removeEvidenceItem(id);
    sfx.playPaperSlide();
  };

  const letters = useMemo<LetterDoc[]>(
    () =>
      currentEventLog.flatMap((e) =>
        e.type === 'message.sent' && ['MF2', 'MF3', 'MF4'].includes(e.flowId)
          ? [composeLetter(e.flowId, e.payload)]
          : []
      ),
    [currentEventLog]
  );

  const timeline = useMemo(
    () => buildStudentTimeline(currentEventLog, eventDays),
    [currentEventLog, eventDays]
  );

  const unreadCount = letters.filter((l) => !readIds.includes(l.id)).length;

  if (!scenario || !submissionDraft) {
    return (
      <div className="paper-sheet" style={{ padding: 32, fontFamily: 'var(--font-paper)' }}>
        Đang mở hồ sơ…
      </div>
    );
  }

  const lastLetter = letters[letters.length - 1];
  const endedEvent = [...currentEventLog].reverse().find((e) => e.type === 'case.ended');
  const chatContext: StudentChatContext = {
    submitted,
    mssv: submissionDraft.form.mssv,
    day,
    waitingTask:
      waitingTaskId === 'T4' || waitingTaskId === 'T5' || waitingTaskId === 'T9'
        ? waitingTaskId
        : null,
    lastMessageFlow:
      lastLetter && (lastLetter.flowId === 'MF2' || lastLetter.flowId === 'MF3' || lastLetter.flowId === 'MF4')
        ? lastLetter.flowId
        : null,
    missing: engine?.state.validity.missing,
    violations: engine?.state.ruleResult.violations,
    endEventId: endedEvent && endedEvent.type === 'case.ended' ? endedEvent.endEventId : null,
  };

  if (sessionMode === 'portal' && submitted && !flying) {
    return (
      <StudentPortalTracker
        caseCode={caseCode}
        studentName={submissionDraft.form.fullName}
        mssv={submissionDraft.form.mssv}
        faculty={submissionDraft.form.faculty}
        log={currentEventLog}
        day={day}
        decisionDoc={engine?.state.decisionDoc}
        onResubmit={prepareStudentResubmission}
      />
    );
  }

  const handleSubmit = (): void => {
    if (submitted || flying) return;
    if (reducedMotion) {
      void submitApplication();
      return;
    }
    setFlying(true);
  };

  // Nhường 2 khung hình cho animation phong bì vẽ xong rồi mới chạy engine,
  // tránh engine + hàng trăm event đồng bộ cùng lúc với animation.
  const submitAfterPaint = (): void => {
    const run = (): void => {
      void submitApplication();
    };
    if (typeof requestAnimationFrame === 'undefined') {
      setTimeout(run, 0);
      return;
    }
    requestAnimationFrame(() => requestAnimationFrame(run));
  };

  const targetX = typeof window !== 'undefined' ? window.innerWidth - 210 : 0;
  const targetY = typeof window !== 'undefined' ? window.innerHeight - 150 : 0;
  const startX = typeof window !== 'undefined' ? window.innerWidth / 2 - 130 : 0;
  const startY = typeof window !== 'undefined' ? window.innerHeight / 2 - 60 : 0;

  return (
    <>
      <div className="student-grid">
        {/* Cột trái · Túi hồ sơ minh chứng nhựa trong suốt */}
        <div className="student-col plastic-evidence-bag">
          <EvidenceBag
            evidence={scenario.evidence}
            attachedIds={submissionDraft.attachedEvidenceIds}
            locked={submitted}
            onAttach={(id) => {
              sfx.playPaperclip();
              attachEvidence(id);
            }}
            onDetach={(id) => {
              sfx.playPaperSlide();
              detachEvidence(id);
            }}
            onOpen={(item) => {
              sfx.playPaper();
              setOpenEvidence(item);
            }}
            onStartFillOption={handleStartFillOption}
            onEditItem={handleEditEvidence}
            onRemoveItem={handleRemoveEvidence}
            onDirectFileUpload={handleDirectFileUpload}
          />
        </div>

        {/* Cột giữa · Đơn đánh máy + nộp */}
        <div
          className="student-col paper-sheet paper-lifted"
          style={{ padding: '12px 18px 10px', position: 'relative' }}
        >
          {/* Kẹp tài liệu kim loại khi đã đính kèm minh chứng */}
          {submissionDraft.attachedEvidenceIds.length > 0 && (
            <Paperclip position="top-left" angle={-10} />
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              fontFamily: 'var(--font-paper)',
              fontSize: 11,
              color: 'var(--ink-soft)',
              borderBottom: '1px solid var(--paper-line)',
              paddingBottom: 4,
              marginBottom: 6,
            }}
          >
            <span>
              {scenario.id === 's6'
                ? 'HỒ SƠ BẢO LƯU TRỰC TUYẾN'
                : `HỒ SƠ ${scenario.code} · ${scenario.title}`}
            </span>
            <span>MÃ CA {caseCode}</span>
          </div>

          <div className="student-scroll" style={{ flex: 1, paddingRight: 2 }}>
            <ApplicationPaper
              form={submissionDraft.form}
              locked={submitted}
              onChange={handleFormChange}
            />
          </div>

          <div style={{ marginTop: 8, borderTop: '1px dashed var(--paper-line)', paddingTop: 6 }}>
            {submitted ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  padding: '6px 9px',
                  border: '1px solid var(--stamp-green)',
                  background: 'var(--wash-green)',
                  fontFamily: 'var(--font-paper)',
                  fontSize: 12,
                }}
              >
                <span>
                  {aiBusy === 'AI-1' ? (
                    <span className="ai-activity">⏳ Hệ thống đang tiếp nhận hồ sơ…</span>
                  ) : (
                    <>
                      ✔ Đã nộp · Mã ca <strong>{caseCode}</strong>
                    </>
                  )}
                </span>
                <button
                  onClick={() => setTab('progress')}
                  style={{
                    fontFamily: 'var(--font-paper)',
                    fontSize: 11,
                    textDecoration: 'underline',
                    color: 'var(--stamp-blue)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Xem tiến độ
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={handleSubmit}
                  disabled={flying}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--stamp-green)',
                    color: 'var(--text-on-stamp)',
                    fontFamily: 'var(--font-paper)',
                    fontWeight: 'bold',
                    fontSize: 15,
                    letterSpacing: 0.6,
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-hard)',
                    opacity: flying ? 0.6 : 1,
                    cursor: flying ? 'wait' : 'pointer',
                  }}
                >
                  {flying ? '✉ ĐANG GỬI HỒ SƠ…' : '✉ NỘP TRỰC TUYẾN'}
                </button>
                <div style={{ fontSize: 11, marginTop: 6, textAlign: 'center', fontFamily: 'var(--font-paper)' }}>
                  {submissionDraft.attachedEvidenceIds.length > 0 ? (
                    <span style={{ color: 'var(--stamp-green)', fontWeight: 'bold' }}>
                      📎 Đã nộp & đính kèm {submissionDraft.attachedEvidenceIds.length} tài liệu minh chứng (Giấy xác nhận & Tệp gốc từ máy)
                    </span>
                  ) : (
                    <span style={{ color: 'var(--stamp-red)', fontWeight: 'bold' }}>
                      ⚠ Chưa nộp minh chứng (hãy bấm dấu ＋ ở Túi minh chứng bên trái để chọn mục và nộp file từ máy)
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 2, textAlign: 'center' }}>
                  Ô viền đỏ = trường bắt buộc còn trống. Cứ nộp — T1 sẽ kiểm tra và trả kết quả tức thì.
                </div>
              </>
            )}
          </div>
        </div>

        {/* Cột phải · Hộp thư / Tiến độ / Trợ lý AI */}
        <StudentRightPanel
          tab={tab}
          onTabChange={setTab}
          unreadCount={unreadCount}
          letters={letters}
          readIds={readIds}
          onOpenLetter={(letter) => {
            setOpenLetter(letter);
            setReadIds((prev) => (prev.includes(letter.id) ? prev : [...prev, letter.id]));
          }}
          timeline={timeline}
          waitingTaskId={waitingTaskId}
          chatContext={chatContext}
        />
      </div>

      {/* Phong bì bay tới mini-map rồi mới gọi engine.start() */}
      {flying && (
        <motion.div
          initial={{ x: startX, y: startY, opacity: 1, rotate: -4 }}
          animate={{ x: targetX, y: targetY, opacity: 0.85, rotate: 6 }}
          transition={{ duration: MOTION.envelopeFlyMs / 1000 / speed, ease: 'easeInOut' }}
          onAnimationComplete={() => {
            setFlying(false);
            submitAfterPaint();
          }}
          style={{ position: 'fixed', left: 0, top: 0, zIndex: 800, pointerEvents: 'none' }}
        >
          <Envelope label="Đơn + minh chứng" />
        </motion.div>
      )}

      {fillOptionKey && (
        <EvidenceFormModal
          optionKey={fillOptionKey}
          initialData={detailedFormData}
          onSave={handleSaveEvidenceForm}
          onClose={() => setFillOptionKey(null)}
        />
      )}
      {openEvidence && <EvidenceModal item={openEvidence} onClose={() => setOpenEvidence(null)} />}
      {openLetter && <LetterModal letter={openLetter} onClose={() => setOpenLetter(null)} />}
    </>
  );
};
