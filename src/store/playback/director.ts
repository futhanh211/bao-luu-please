import { useAppStore } from '../useApp';
import { collectAnomalies } from '../../data/inspection';
import {
  updateCaseAdvisorDecision,
  updateCaseCtsvDecision,
  updateCasePrincipalSign,
} from '../../data/caseRegistry';
import type { PlaybackStoreState } from './types';

type Getter = () => PlaybackStoreState;
type Setter = (
  partial:
    | Partial<PlaybackStoreState>
    | ((state: PlaybackStoreState) => Partial<PlaybackStoreState>)
) => void;

const IS_HEADLESS = typeof window === 'undefined';

/** Chờ có thể dừng khi Pause và thoát ngay nếu đổi chế độ khỏi Director. */
export async function sleepWithPause(ms: number, get: Getter): Promise<boolean> {
  if (IS_HEADLESS || ms <= 0) return true;
  const step = 80;
  let elapsed = 0;
  while (elapsed < ms) {
    if (get().isPaused) {
      await new Promise((resolve) => setTimeout(resolve, 80));
      continue;
    }
    if (useAppStore.getState().mode !== 'director') {
      return false;
    }
    await new Promise((resolve) => setTimeout(resolve, step));
    elapsed += step;
  }
  return true;
}

export function getDirectorNodeNarration(nodeId: string): string {
  switch (nodeId) {
    case 'T1':
      return '🎬 ĐẠO DIỄN [T1]: Hệ thống tự động kiểm tra hồ sơ và AI-1 DocScan quét bóc tách minh chứng ra viện.';
    case 'T2':
      return '🎬 ĐẠO DIỄN [T2]: Hệ thống tự động soạn thông báo trả hồ sơ do thiếu minh chứng bắt buộc.';
    case 'T3':
      return '🎬 ĐẠO DIỄN [T3]: Hệ thống đối chiếu tự động 4 nhóm quy tắc R1–R4 với CSDL học vụ & tài chính (DS1).';
    case 'T4':
      return '🎬 ĐẠO DIỄN [T4]: Bàn Cố vấn học tập — Thầy cố vấn tham khảo đề xuất AI Co-pilot và xác nhận hồ sơ.';
    case 'T5':
      return '🎬 ĐẠO DIỄN [T5]: Bàn Phòng CTSV — Cán bộ đối chiếu minh chứng gốc, thẩm định tính hợp pháp.';
    case 'T6':
      return '🎬 ĐẠO DIỄN [T6]: Bộ đếm SLA (BT1) quá 3 ngày — Hệ thống gửi thông báo nhắc việc đến Cố vấn học tập.';
    case 'T7':
      return '🎬 ĐẠO DIỄN [T7]: Hệ thống tự động soạn thông báo từ chối bảo lưu kèm lý do quy tắc không đạt.';
    case 'T8':
      return '🎬 ĐẠO DIỄN [T8]: Hệ thống sinh dự thảo Quyết định; AI-4 tự động điền các căn cứ pháp lý.';
    case 'T9':
      return '🎬 ĐẠO DIỄN [T9]: Bàn Ban Giám hiệu — Lãnh đạo thẩm tra dự thảo số hóa và thực hiện ký số điện tử.';
    case 'T10':
      return "🎬 ĐẠO DIỄN [T10]: Hệ thống tự động ghi nhận trạng thái 'Bảo lưu' vào CSDL sinh viên (DS2).";
    case 'T11':
      return '🎬 ĐẠO DIỄN [T11]: Phát hành quyết định điện tử ký số và gửi thông báo (MF4) đến hộp thư sinh viên.';
    case 'G1':
      return '🎬 ĐẠO DIỄN [G1]: Cổng XOR — Đánh giá tính đầy đủ của hồ sơ trước khi phân luồng.';
    case 'G2':
      return '🎬 ĐẠO DIỄN [G2]: Phân nhánh song song (AND Split) — Kích hoạt đồng thời T3 (Luật), T4 (Cố vấn), T5 (CTSV).';
    case 'G3':
      return '🎬 ĐẠO DIỄN [G3]: Hội tụ song song (AND Join) — Chờ đủ cả 3 nhánh trước khi tổng hợp kết quả.';
    case 'G4':
      return '🎬 ĐẠO DIỄN [G4]: Cổng XOR — Tổng hợp kết quả thẩm tra; nếu tất cả hợp lệ thì chuyển sang dự thảo.';
    case 'E_END_OK':
      return '🎬 ĐẠO DIỄN [KẾT CỤC]: Thủ tục bảo lưu hoàn tất thành công! Mở Báo cáo cuối ca tổng kết.';
    case 'E_END_REJECTED':
      return '🎬 ĐẠO DIỄN [KẾT CỤC]: Hồ sơ không thỏa điều kiện — Gửi thông báo từ chối và mở Báo cáo cuối ca.';
    case 'E_END_RETURNED':
      return '🎬 ĐẠO DIỄN [KẾT CỤC]: Hồ sơ thiếu chứng từ — Hệ thống tự động trả lại sinh viên.';
    default:
      return `🎬 ĐẠO DIỄN: Đang xử lý bước ${nodeId}...`;
  }
}

/** Tự động chuẩn bị và nộp đơn ở chế độ Director nếu chưa nộp. */
export async function startDirectorIfReady(get: Getter): Promise<void> {
  const appStore = useAppStore.getState();
  const { submitted, scenario } = get();
  if (submitted || !scenario) return;

  const speed = appStore.speed || 1;
  const scaled = (ms: number) => (IS_HEADLESS ? 0 : Math.max(100, Math.round(ms / speed)));

  appStore.setRole('student');
  appStore.setDirectorCaption(
    `🎬 ĐẠO DIỄN: Sinh viên ${scenario.studentName} nộp đơn xin bảo lưu kết quả học tập trực tuyến kèm minh chứng.`
  );

  const ok = await sleepWithPause(scaled(3000), get);
  if (!ok || appStore.mode !== 'director' || get().isPaused) return;

  await get().submitApplication({ useScenarioDefaults: true });
}

/** Tự động giải quyết các User Task (T4, T5, T9) khi quy trình dừng chờ con người. */
export async function handleDirectorUserTask(
  get: Getter,
  _set: Setter
): Promise<boolean> {
  const { engine, scenario, waitingTaskIds } = get();
  if (!engine || !scenario || waitingTaskIds.length === 0) return false;

  const appStore = useAppStore.getState();
  if (appStore.mode !== 'director' || get().isPaused) return false;

  const speed = appStore.speed || 1;
  const scaled = (ms: number) => (IS_HEADLESS ? 0 : Math.max(100, Math.round(ms / speed)));
  const plan = scenario.directorPlan;

  // 1. Bàn Cố vấn học tập (T4)
  if (waitingTaskIds.includes('T4')) {
    appStore.setRole('advisor');
    appStore.setDirectorCaption(
      `🎬 ĐẠO DIỄN [T4]: Bàn Cố vấn học tập — Thầy cố vấn xem xét tóm tắt AI Co-pilot và tình trạng học tập của sinh viên ${scenario.studentName}.`
    );

    // Kịch bản S4 có độ trễ 4 ngày (> 3 ngày SLA): tua ngày để kích hoạt timer
    if (plan.advisorDelayDays && plan.advisorDelayDays > 3) {
      const ok1 = await sleepWithPause(scaled(2500), get);
      if (!ok1 || appStore.mode !== 'director' || get().isPaused) return false;

      appStore.setDirectorCaption(
        '🎬 ĐẠO DIỄN [SLA]: Quá hạn 3 ngày làm việc — Hệ thống kích hoạt Boundary Timer (BT1) gửi nhắc việc.'
      );
      await get().advanceDays(3);

      const ok2 = await sleepWithPause(scaled(3000), get);
      if (!ok2 || appStore.mode !== 'director' || get().isPaused) return false;
    } else {
      const ok = await sleepWithPause(scaled(6500), get);
      if (!ok || appStore.mode !== 'director' || get().isPaused) return false;
    }

    appStore.setDirectorCaption(
      `🎬 ĐẠO DIỄN [T4]: Cố vấn xác nhận đề xuất — ĐÓNG DẤU [${
        plan.advisorOutcome === 'confirmed' ? 'XÁC NHẬN' : 'TỪ CHỐI'
      }].`
    );
    await sleepWithPause(scaled(1800), get);

    const targetAdvisorId = engine.state.caseId ?? scenario.code ?? useAppStore.getState().caseCode;
    const advisorDecision = plan.advisorOutcome === 'declined' ? 'declined' : 'confirmed';
    if (targetAdvisorId) {
      updateCaseAdvisorDecision(targetAdvisorId, advisorDecision);
    }
    await get().completeUserTask('T4', advisorDecision);
    return true;
  }

  // 2. Bàn Phòng CTSV (T5)
  if (waitingTaskIds.includes('T5')) {
    appStore.setRole('ctsv');
    appStore.setDirectorCaption(
      '🎬 ĐẠO DIỄN [T5]: Bàn Phòng CTSV — Cán bộ đối chiếu minh chứng gốc với CSDL bệnh viện và kết quả quét AI.'
    );

    const ok1 = await sleepWithPause(scaled(7000), get);
    if (!ok1 || appStore.mode !== 'director' || get().isPaused) return false;

    const caseId = engine.state.caseId ?? scenario.code;
    const mssvKey = scenario.form.mssv;
    const allAnomalies = collectAnomalies(scenario.evidence);
    const markedKeys = plan.ctsvOutcome === 'invalid' ? allAnomalies.map((a) => a.key) : [];
    const inspectionRecord = {
      outcome: plan.ctsvOutcome as 'valid' | 'invalid',
      score: {
        caught: markedKeys.length,
        total: allAnomalies.length,
        falseMarks: 0,
      },
      anomalies: allAnomalies,
      markedKeys,
    };
    get().sealCtsvInspection(caseId, inspectionRecord);
    if (mssvKey && mssvKey !== caseId) {
      get().sealCtsvInspection(mssvKey, inspectionRecord);
    }

    if (plan.ctsvOutcome === 'invalid') {
      appStore.setDirectorCaption(
        '🎬 ĐẠO DIỄN [T5]: Cán bộ phát hiện dấu hiệu sai lệch trên giấy tờ — ĐÓNG DẤU [KHÔNG HỢP LỆ].'
      );
    } else {
      appStore.setDirectorCaption(
        '🎬 ĐẠO DIỄN [T5]: Thẩm định hồ sơ y tế đầy đủ, hợp lệ — ĐÓNG DẤU [HỢP LỆ].'
      );
    }

    const ok2 = await sleepWithPause(scaled(2500), get);
    if (!ok2 || appStore.mode !== 'director' || get().isPaused) return false;

    const targetCtsvId = engine.state.caseId ?? scenario.code ?? useAppStore.getState().caseCode;
    const ctsvDecision = plan.ctsvOutcome === 'invalid' ? 'invalid' : 'valid';
    if (targetCtsvId) {
      updateCaseCtsvDecision(targetCtsvId, ctsvDecision, markedKeys);
    }
    await get().completeUserTask('T5', ctsvDecision);
    return true;
  }

  // 3. Bàn Ban Giám hiệu (T9)
  if (waitingTaskIds.includes('T9')) {
    appStore.setRole('principal');
    appStore.setDirectorCaption(
      '🎬 ĐẠO DIỄN [T9]: Bàn Ban Giám hiệu — Lãnh đạo thẩm tra dự thảo quyết định do hệ thống và AI-4 tự động soạn thảo.'
    );

    const ok1 = await sleepWithPause(scaled(6000), get);
    if (!ok1 || appStore.mode !== 'director' || get().isPaused) return false;

    appStore.setDirectorCaption(
      '🎬 ĐẠO DIỄN [T9]: Thực hiện nghi thức ký số điện tử (Digital Signature) và áp dấu đỏ thẩm quyền...'
    );

    const ok2 = await sleepWithPause(scaled(3500), get);
    if (!ok2 || appStore.mode !== 'director' || get().isPaused) return false;

    const principalSignerName = plan.principalSigner ?? 'PGS.TS. Đoàn Ngọc Phi Anh - Phó Hiệu trưởng';
    const targetBghId = engine.state.caseId ?? scenario.code ?? useAppStore.getState().caseCode;
    if (targetBghId) {
      updateCasePrincipalSign(targetBghId, principalSignerName);
    }
    await get().completeUserTask('T9', {
      signerName: principalSignerName,
    });

    // Chuyển về màn hình Sinh viên để đón thư kết quả
    await sleepWithPause(scaled(1500), get);
    appStore.setRole('student');
    appStore.setDirectorCaption(
      '🎬 ĐẠO DIỄN [T11]: Quyết định bảo lưu chính thức đã được gửi về Hộp thư cá nhân của sinh viên.'
    );
    return true;
  }

  return false;
}
