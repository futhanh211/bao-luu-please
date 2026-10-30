import { create } from 'zustand';
import { createEngine } from '../../engine/engine';
import { PROCESS_DEF } from '../../engine/process.def';
import { DocScanResult, EngineDeps, EngineEvent, ReviewerBrief, StudentApplicationForm } from '../../engine/types';
import { SCENARIOS, ScenarioConfig } from '../../data/scenarios';
import { CaseSummary } from '../../ai/provider';
import { useAppStore } from '../useApp';
import { createInitialMapState } from '../../ui/map/mapState';
import { tokenAnimManager } from '../../ui/map/tokenAnim';
import { processQueue } from './controller';
import { mark, measure } from './animation';
import { startDirectorIfReady } from './director';
import type { CtsvInspectionRecord, PlaybackStoreState } from './types';
import {
  beginSession,
  clearSessionQueue,
  enqueueEvent,
  getActiveAI,
  getActiveStudentsDb,
  getActiveAcademicFinanceDb,
  getPlaybackDay,
  queuedCount,
} from './session';
import {
  CUSTOM_PRESETS,
  buildCustomEvidence,
  syncCustomTestDataToDatabases,
  CustomTestDataConfig,
} from '../../data/customTestData';
import { getStudentFormData } from '../../data/studentFormData';
import {
  saveSubmittedCase,
  getSubmittedCaseByMssv,
  getSubmittedCaseById,
  getNextCaseCode,
} from '../../data/caseRegistry';

export type { PlaybackStoreState } from './types';

const EMPTY_INSPECTION: CtsvInspectionRecord = { marks: [], result: null, sealed: false };

function inspectionOf(
  map: Record<string, CtsvInspectionRecord>,
  caseId: string
): CtsvInspectionRecord {
  return map[caseId] ?? EMPTY_INSPECTION;
}

let isAdvancingTime = false;

export const usePlaybackStore = create<PlaybackStoreState>((set, get) => ({
  engine: null,
  scenario: null,
  mapState: createInitialMapState(),
  isPlaying: false,
  isPaused: false,
  isWaitingUserTask: false,
  waitingTaskId: null,
  waitingTaskIds: [],
  currentEventLog: [],
  eventDays: [],
  activeCaptionNodeId: null,
  submissionDraft: null,
  submitted: false,
  studentRecord: null,
  disagreements: 0,
  ctsvInspections: {},
  reportDismissed: false,
  customTestConfig: null,
  isCustomCase: false,

  setActiveCaption: (nodeId) => set({ activeCaptionNodeId: nodeId }),
  setReportDismissed: (dismissed) => set({ reportDismissed: dismissed }),

  initScenario: (scenarioId: string) => {
    tokenAnimManager.cancelAll();
    clearSessionQueue();

    const scenario: ScenarioConfig =
      SCENARIOS.find((s) => s.id === scenarioId) || SCENARIOS[0];
    const session = beginSession(scenario, useAppStore.getState().aiMode);

    session.ai.onSourceChange((source) => useAppStore.getState().setAiStatus(source));
    session.ai.onActivity((touchpoint) => useAppStore.getState().setAiBusy(touchpoint));
    useAppStore.getState().setAiStatus(session.ai.source);
    useAppStore.getState().setAiBusy(null);

    const deps: EngineDeps = {
      clock: session.clock,
      db: { ds1: session.academicFinanceDb, ds2: session.studentsDb },
      ai: session.ai,
    };

    const isCustom = scenario.id === 's6';
    const initialCustomConfig = isCustom ? { ...CUSTOM_PRESETS[0].config } : null;

    if (isCustom && initialCustomConfig) {
      syncCustomTestDataToDatabases(
        initialCustomConfig,
        session.studentsDb,
        session.academicFinanceDb
      );
      scenario.form = {
        fullName: initialCustomConfig.fullName,
        mssv: initialCustomConfig.mssv,
        className: initialCustomConfig.className,
        faculty: initialCustomConfig.faculty,
        phone: initialCustomConfig.phone,
        email: initialCustomConfig.email,
        reason: initialCustomConfig.reason,
        semesterCount: initialCustomConfig.semesterCount,
        startSemester: initialCustomConfig.startSemester,
        commitment: initialCustomConfig.commitment,
      };
      scenario.evidence = buildCustomEvidence(
        initialCustomConfig.evidencePreset,
        initialCustomConfig.fullName
      );
    }

    const engine = createEngine(PROCESS_DEF, scenario, deps);
    engine.subscribe(enqueueEvent);

    set({
      engine,
      scenario,
      mapState: createInitialMapState(),
      isPlaying: false,
      isPaused: false,
      isWaitingUserTask: false,
      waitingTaskId: null,
      waitingTaskIds: [],
      currentEventLog: [],
      eventDays: [],
      activeCaptionNodeId: null,
      customTestConfig: initialCustomConfig,
      submissionDraft: {
        form: { ...scenario.form },
        attachedEvidenceIds:
          scenario.id === 's2' || (isCustom && initialCustomConfig?.evidencePreset === 'none')
            ? []
            : scenario.evidence.map((e) => e.id),
      },
      submitted: false,
      studentRecord: session.studentsDb.get(scenario.form.mssv) ?? null,
      disagreements: 0,
      ctsvInspections: {},
      reportDismissed: false,
      isCustomCase: isCustom,
    });
  },

  initStudentSession: (student, scenarioId, evidencePreset = 'none') => {
    if (scenarioId && scenarioId !== 's6') {
      get().initScenario(scenarioId);
      useAppStore.getState().setScenario(scenarioId);
      return;
    }

    // Kiểm tra nếu sinh viên này đã nộp hồ sơ trước đó thì phục hồi trạng thái ca của họ
    const existingCase = getSubmittedCaseByMssv(student.mssv);
    if (existingCase) {
      get().initScenario('s6');
      useAppStore.getState().setScenario('s6');
      useAppStore.getState().setCaseCode(existingCase.caseCode);
      const sc = get().scenario;
      if (sc && existingCase.evidence.length > 0) {
        sc.evidence = [...existingCase.evidence];
      }
      set({
        submissionDraft: {
          form: { ...existingCase.form },
          attachedEvidenceIds: [...existingCase.attachedEvidenceIds],
        },
        submitted: true,
        isCustomCase: true,
      });
      return;
    }

    get().initScenario('s6');
    useAppStore.getState().setScenario('s6');
    useAppStore.getState().setCaseCode(getNextCaseCode());

    const saved = getStudentFormData(student.mssv, student);

    const config: CustomTestDataConfig = {
      fullName: student.name,
      mssv: student.mssv,
      className: student.className,
      faculty: student.faculty,
      phone: student.phone || saved.phone || '0905123456',
      email: student.email || saved.email || `${student.mssv}@due.udn.vn`,
      reason: saved.reason || 'Ốm đau/tai nạn điều trị dài',
      semesterCount: saved.semesterCount || 1,
      startSemester: saved.startSemester || 'Học kỳ 1 năm học 2026–2027',
      commitment: saved.commitment ?? true,
      semestersCompleted: 3,
      discipline: 'none',
      tuitionDebt: 0,
      forcedWithdrawal: false,
      evidencePreset,
    };

    get().applyCustomTestData(config);
    set({
      submissionDraft: {
        form: {
          fullName: student.name,
          mssv: student.mssv,
          className: student.className,
          faculty: student.faculty,
          phone: student.phone || saved.phone || '0905123456',
          email: student.email || saved.email || `${student.mssv}@due.udn.vn`,
          reason: saved.reason || 'Ốm đau/tai nạn điều trị dài',
          semesterCount: saved.semesterCount || 1,
          startSemester: saved.startSemester || 'Học kỳ 1 năm học 2026–2027',
          commitment: saved.commitment ?? true,
        },
        attachedEvidenceIds: [],
      },
      submitted: false,
      isCustomCase: !scenarioId || scenarioId === 's6',
    });
  },

  applyCustomTestData: (config: CustomTestDataConfig) => {
    const { scenario, submitted, engine } = get();
    if (submitted || !scenario) return;

    const studentsDb = getActiveStudentsDb();
    const academicFinanceDb = getActiveAcademicFinanceDb();
    if (studentsDb && academicFinanceDb) {
      syncCustomTestDataToDatabases(config, studentsDb, academicFinanceDb);
    }

    const trimmedFullName = config.fullName.trim();
    const trimmedMssv = config.mssv.trim();

    const evidence = buildCustomEvidence(config.evidencePreset, trimmedFullName);
    const form: StudentApplicationForm = {
      fullName: trimmedFullName,
      mssv: trimmedMssv,
      className: config.className.trim(),
      faculty: config.faculty.trim(),
      phone: config.phone.trim(),
      email: config.email.trim(),
      reason: config.reason,
      semesterCount: config.semesterCount,
      startSemester: config.startSemester,
      commitment: config.commitment,
    };

    scenario.form = { ...form };
    scenario.evidence = evidence;
    scenario.studentName = trimmedFullName;
    scenario.mssv = trimmedMssv;

    // Cập nhật state nội bộ của engine nếu đã tạo để luôn khớp 100%
    if (engine) {
      engine.state.form = { ...form };
      engine.state.evidence = [...evidence];
      const rec = studentsDb?.get(trimmedMssv);
      engine.state.studentStatus = rec?.status || 'Đang học';
    }

    if (config.evidencePreset === 'suspicious_medical') {
      scenario.directorPlan.ctsvOutcome = 'invalid';
      scenario.directorPlan.advisorOutcome = 'confirmed';
    } else {
      scenario.directorPlan.advisorOutcome = 'confirmed';
      scenario.directorPlan.ctsvOutcome = 'valid';
    }

    const attachedEvidenceIds =
      config.evidencePreset === 'none' ? [] : evidence.map((e) => e.id);

    set({
      customTestConfig: config,
      submissionDraft: {
        form,
        attachedEvidenceIds,
      },
      studentRecord: studentsDb?.get(trimmedMssv) ?? null,
    });
  },

  start: async () => {
    const { engine, isPlaying, submitted, mapState } = get();
    if (!engine || isPlaying || mapState.caseEnded) return;

    // Chưa nộp mà bấm CHẠY CA ở overlay: nộp bằng form + minh chứng chuẩn (M2).
    if (!submitted) {
      await get().submitApplication({ useScenarioDefaults: true });
      return;
    }

    set({ isPlaying: true, isPaused: false });
    await engine.start();
    await processQueue(get, set);
  },

  startDirector: async () => {
    useAppStore.getState().setMode('director');
    const { submitted, isPlaying, mapState } = get();
    if (mapState.caseEnded) return;

    if (!submitted) {
      await startDirectorIfReady(get);
      return;
    }

    if (!isPlaying) {
      set({ isPlaying: true, isPaused: false });
      await processQueue(get, set);
    }
  },

  submitApplication: async (options) => {
    const { engine, scenario, submissionDraft, submitted, mapState } = get();
    if (!engine || !scenario || submitted || mapState.caseEnded) return;

    const useDefaults = options?.useScenarioDefaults === true;
    const form: StudentApplicationForm = useDefaults
      ? { ...scenario.form }
      : { ...(submissionDraft?.form ?? scenario.form) };
    const attachedEvidenceIds = useDefaults
      ? scenario.evidence.map((e) => e.id)
      : [...(submissionDraft?.attachedEvidenceIds ?? [])];

    set({
      submitted: true,
      submissionDraft: { form, attachedEvidenceIds },
      isPlaying: true,
      isPaused: false,
      studentRecord: getActiveStudentsDb()?.get(form.mssv) ?? null,
    });

    mark('submit:start');
    await engine.start({ form, attachedEvidenceIds });
    mark('submit:engine-start-done');

    // Lưu vào Sổ tiếp nhận hồ sơ Một Cửa Số (Case Registry)
    const currentCode = useAppStore.getState().caseCode || getNextCaseCode();
    saveSubmittedCase({
      id: currentCode,
      caseCode: currentCode,
      studentMssv: form.mssv,
      studentName: form.fullName,
      studentClass: form.className,
      studentFaculty: form.faculty,
      studentPhone: form.phone,
      studentEmail: form.email,
      form: { ...form },
      evidence: scenario.evidence ? [...scenario.evidence] : [],
      attachedEvidenceIds: [...attachedEvidenceIds],
      submittedAt:
        new Date().toLocaleDateString('vi-VN') +
        ' ' +
        new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      day: get().mapState.counters.day || 0,
      status: 'pending_advisor',
    });

    await processQueue(get, set);

    // Nếu hồ sơ bị từ chối/trả lại sớm ngay tại cổng Một cửa tự động (T1 -> G1=Không -> T2 -> E_END_RETURNED)
    const isReturnedEarly = get().currentEventLog.some(
      (e) => e.type === 'case.ended' && e.endEventId === 'E_END_RETURNED'
    );
    if (isReturnedEarly) {
      const reg = getSubmittedCaseById(currentCode);
      if (reg) {
        reg.status = 'returned';
        saveSubmittedCase(reg);
      }
    }

    mark('submit:queue-blocked');
    measure('submit:start->engine-start', 'submit:start', 'submit:engine-start-done');
    measure('submit:engine-start->queue', 'submit:engine-start-done', 'submit:queue-blocked');
  },

  updateDraftForm: (patch) => {
    const { submissionDraft, submitted } = get();
    if (submitted || !submissionDraft) return;
    set({ submissionDraft: { ...submissionDraft, form: { ...submissionDraft.form, ...patch } } });
  },

  attachEvidence: (evidenceId) => {
    const { submissionDraft, submitted } = get();
    if (submitted || !submissionDraft) return;
    if (submissionDraft.attachedEvidenceIds.includes(evidenceId)) return;
    set({
      submissionDraft: {
        ...submissionDraft,
        attachedEvidenceIds: [...submissionDraft.attachedEvidenceIds, evidenceId],
      },
    });
  },

  detachEvidence: (evidenceId) => {
    const { submissionDraft, submitted } = get();
    if (submitted || !submissionDraft) return;
    set({
      submissionDraft: {
        ...submissionDraft,
        attachedEvidenceIds: submissionDraft.attachedEvidenceIds.filter((id) => id !== evidenceId),
      },
    });
  },

  addEvidenceItem: (item, autoAttach = false) => {
    const { scenario, submissionDraft, engine, submitted } = get();
    if (submitted || !scenario) return;

    const existing = scenario.evidence || [];
    const nextEvidence = [...existing.filter((e) => e.id !== item.id), item];
    scenario.evidence = nextEvidence;

    if (engine) {
      engine.state.evidence = [...nextEvidence];
    }

    const nextAttachedIds = autoAttach
      ? Array.from(new Set([...(submissionDraft?.attachedEvidenceIds || []), item.id]))
      : (submissionDraft?.attachedEvidenceIds || []);

    set({
      submissionDraft: {
        form: submissionDraft?.form ?? scenario.form,
        attachedEvidenceIds: nextAttachedIds,
      },
    });
  },

  removeEvidenceItem: (itemId: string) => {
    const { scenario, submissionDraft, engine, submitted } = get();
    if (submitted || !scenario) return;

    const nextEvidence = (scenario.evidence || []).filter((e) => e.id !== itemId);
    scenario.evidence = nextEvidence;

    if (engine) {
      engine.state.evidence = [...nextEvidence];
    }

    const nextAttachedIds = (submissionDraft?.attachedEvidenceIds || []).filter((id) => id !== itemId);

    set({
      submissionDraft: {
        form: submissionDraft?.form ?? scenario.form,
        attachedEvidenceIds: nextAttachedIds,
      },
    });
  },

  setEvidenceList: (items, autoAttach = false) => {
    const { scenario, submissionDraft, engine, submitted } = get();
    if (submitted || !scenario) return;

    scenario.evidence = [...items];

    if (engine) {
      engine.state.evidence = [...items];
    }

    const nextAttachedIds = autoAttach
      ? items.map((i) => i.id)
      : (submissionDraft?.attachedEvidenceIds || []).filter((id) => items.some((i) => i.id === id));

    set({
      submissionDraft: {
        form: submissionDraft?.form ?? scenario.form,
        attachedEvidenceIds: nextAttachedIds,
      },
    });
  },

  pause: () => set({ isPaused: true }),

  resume: async () => {
    set({ isPaused: false });
    await processQueue(get, set);
  },

  stepNext: async () => {
    const { engine, isWaitingUserTask, mapState } = get();
    if (!engine || isWaitingUserTask || mapState.caseEnded) return;

    set({ isPlaying: true, isPaused: false });
    if (queuedCount() === 0) {
      await engine.step();
    }
    await processQueue(get, set, true);
  },

  completeUserTask: async (taskId: string, outcome: unknown) => {
    const { engine, mapState } = get();
    if (!engine || mapState.caseEnded) return;

    const remaining = get().waitingTaskIds.filter((id) => id !== taskId);
    set({
      waitingTaskIds: remaining,
      waitingTaskId: remaining[0] ?? null,
      isWaitingUserTask: remaining.length > 0,
      isPlaying: true,
      isPaused: false,
    });
    await engine.completeUserTask(taskId, outcome);
    await processQueue(get, set);
  },

  askReviewerBrief: async (role, overrideSummary) => {
    const { engine, mapState } = get();
    const ai = getActiveAI();
    if (!ai) return null;

    const source = role === 'advisor' ? 'T4' : 'T5';
    let ctx: CaseSummary;

    if (overrideSummary) {
      ctx = overrideSummary;
    } else {
      if (!engine || mapState.caseEnded) return null;
      const caseState = engine.state;
      ctx = {
        form: caseState.form,
        validity: { ...caseState.validity, missing: [...caseState.validity.missing] },
        ruleResult: { ...caseState.ruleResult, violations: [...caseState.ruleResult.violations] },
        advisorStatus: caseState.advisor.status,
        ctsvStatus: caseState.ctsv.status,
        day: getPlaybackDay(),
        evidence: caseState.evidence,
        aiScan: lastDocScan(get().currentEventLog),
      };
    }

    let brief: ReviewerBrief | null = null;
    try {
      brief = await ai.reviewerBrief(role, ctx);
    } catch {
      return null;
    }
    if (!brief) return null;

    // AI-3 do người dùng bấm nên store ghi log; mỗi vai chỉ một cặp mỗi ca.
    const alreadyLogged = get().currentEventLog.some(
      (event) => event.type === 'ai.requested' && event.touchpoint === 'AI-3' && event.source === source
    );
    if (!alreadyLogged) {
      const day = getPlaybackDay();
      set((state) => ({
        currentEventLog: [
          ...state.currentEventLog,
          { type: 'ai.requested', touchpoint: 'AI-3', source },
          { type: 'ai.responded', touchpoint: 'AI-3', source, result: brief as ReviewerBrief },
        ],
        eventDays: [...state.eventDays, day, day],
      }));
    }

    return brief;
  },

  askAssistant: (history, ctx) => {
    const ai = getActiveAI();
    if (!ai) return Promise.resolve('Trợ lý chưa sẵn sàng. Bạn thử lại sau nhé.');
    return ai.chat(history, ctx);
  },

  setAiMode: (mode) => {
    const ai = getActiveAI();
    if (!ai) return false;
    const ok = ai.setMode(mode);
    if (ok) useAppStore.getState().setAiMode(mode);
    return ok;
  },

  /** Ghi vết người quyết khác AI — chỉ ở store/UI, engine không bị đổi hành vi. */
  recordHumanDecision: (taskId, human, ai) => {
    const humanOutcome = normalizeOutcome(human);
    const aiOutcome = normalizeOutcome(ai);
    if (!aiOutcome || humanOutcome === aiOutcome) return;
    set((state) => ({
      disagreements: state.disagreements + 1,
      currentEventLog: [
        ...state.currentEventLog,
        { type: 'human.disagreed', taskId, human: humanOutcome, ai: aiOutcome },
      ],
      eventDays: [...state.eventDays, getPlaybackDay()],
    }));
  },

  advanceDays: async (days: number) => {
    const { engine, mapState } = get();
    if (!engine || mapState.caseEnded || isAdvancingTime) return;

    isAdvancingTime = true;
    try {
      await engine.advanceDays(days);
      const day = getPlaybackDay();
      set((state) => ({
        isPlaying: true,
        isPaused: false,
        mapState: { ...state.mapState, counters: { ...state.mapState.counters, day } },
      }));
      await processQueue(get, set);
    } finally {
      isAdvancingTime = false;
    }
  },

  setCtsvMarks: (caseId, marks) => {
    set((state) => {
      const prev = inspectionOf(state.ctsvInspections, caseId);
      return {
        ctsvInspections: {
          ...state.ctsvInspections,
          [caseId]: { ...prev, marks },
        },
      };
    });
  },

  sealCtsvInspection: (caseId, result) => {
    set((state) => {
      return {
        ctsvInspections: {
          ...state.ctsvInspections,
          [caseId]: { marks: result.markedKeys, result, sealed: true },
        },
      };
    });
  },

  reset: () => {
    tokenAnimManager.cancelAll();
    clearSessionQueue();
    useAppStore.getState().setAiBusy(null);

    const { engine, scenario, customTestConfig } = get();
    engine?.reset();
    if (engine) {
      engine.subscribe(enqueueEvent);
    }

    const studentsDb = getActiveStudentsDb();
    const academicFinanceDb = getActiveAcademicFinanceDb();
    studentsDb?.reset();
    academicFinanceDb?.reset();

    if (scenario?.id === 's6' && customTestConfig && studentsDb && academicFinanceDb) {
      syncCustomTestDataToDatabases(customTestConfig, studentsDb, academicFinanceDb);
    }

    set({
      mapState: createInitialMapState(),
      isPlaying: false,
      isPaused: false,
      isWaitingUserTask: false,
      waitingTaskId: null,
      waitingTaskIds: [],
      currentEventLog: [],
      eventDays: [],
      activeCaptionNodeId: null,
      submissionDraft: scenario
        ? {
            form: { ...scenario.form },
            attachedEvidenceIds:
              scenario.id === 's2' || (scenario.id === 's6' && customTestConfig?.evidencePreset === 'none')
                ? []
                : scenario.evidence.map((e) => e.id),
          }
        : null,
      submitted: false,
      studentRecord: studentsDb?.get(engine?.state.form.mssv ?? '') ?? null,
      disagreements: 0,
      ctsvInspections: {},
      reportDismissed: false,
      isCustomCase: scenario?.id === 's6',
    });
  },
}));

/** AI dùng confirm/decline, engine dùng confirmed/declined — chuẩn hóa trước khi so. */
function normalizeOutcome(value: string): string {
  if (value === 'confirm') return 'confirmed';
  if (value === 'decline') return 'declined';
  return value;
}

/** Kết quả AI-1 gần nhất, dùng lại cho AI-3 thay vì quét lại minh chứng. */
function lastDocScan(log: EngineEvent[]): DocScanResult | undefined {
  for (let i = log.length - 1; i >= 0; i -= 1) {
    const event = log[i];
    if (event.type !== 'ai.responded' || event.touchpoint !== 'AI-1') continue;
    const result = event.result;
    if (result && typeof result === 'object' && 'confidence' in result) {
      return result as DocScanResult;
    }
  }
  return undefined;
}
