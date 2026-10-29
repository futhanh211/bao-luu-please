import { CaseState, Token, EngineDeps, EngineEvent, SentMessage } from '../types';

export async function handleSendTask(
  nodeId: string,
  state: CaseState,
  _token: Token,
  deps: EngineDeps,
  emit: (event: EngineEvent) => void
): Promise<void> {
  const currentDay = deps.clock.getDay();

  switch (nodeId) {
    case 'T2': {
      // Thông báo hồ sơ chưa hợp lệ (MF2)
      emit({ type: 'ai.requested', touchpoint: 'AI-4', source: 'T2' });
      const returnMsg = await deps.ai.draftText('return', {
        form: state.form,
        validity: state.validity,
      });
      emit({ type: 'ai.responded', touchpoint: 'AI-4', source: 'T2', result: returnMsg });

      const sentMsg: SentMessage = {
        id: `msg_mf2_${Date.now()}`,
        flowId: 'MF2',
        recipient: 'student',
        title: 'Thông báo trả hồ sơ / Yêu cầu bổ sung minh chứng',
        content: returnMsg,
        day: currentDay,
        aiGenerated: true,
      };

      state.messages.push(sentMsg);
      emit({
        type: 'message.sent',
        flowId: 'MF2',
        payload: { ...sentMsg, validity: { ...state.validity, missing: [...state.validity.missing] } },
      });
      break;
    }

    case 'T7': {
      // Thông báo không đủ điều kiện (MF3)
      emit({ type: 'ai.requested', touchpoint: 'AI-4', source: 'T7' });
      const rejectMsg = await deps.ai.draftText('reject', {
        form: state.form,
        validity: state.validity,
        ruleResult: state.ruleResult,
        advisorStatus: state.advisor.status,
        ctsvStatus: state.ctsv.status,
      });
      emit({ type: 'ai.responded', touchpoint: 'AI-4', source: 'T7', result: rejectMsg });

      const sentMsg: SentMessage = {
        id: `msg_mf3_${Date.now()}`,
        flowId: 'MF3',
        recipient: 'student',
        title: 'Thông báo không đủ điều kiện giải quyết bảo lưu kết quả học tập',
        content: rejectMsg,
        day: currentDay,
        aiGenerated: true,
      };

      state.messages.push(sentMsg);
      emit({
        type: 'message.sent',
        flowId: 'MF3',
        payload: {
          ...sentMsg,
          ruleResult: {
            pass: state.ruleResult.pass,
            violations: [...state.ruleResult.violations],
          },
          advisorStatus: state.advisor.status,
          ctsvStatus: state.ctsv.status,
        },
      });
      break;
    }

    case 'T11': {
      // Thông báo quyết định cho sinh viên (MF4)
      const decisionTitle = `Quyết định về việc cho phép sinh viên ${state.form.fullName} nghỉ học tạm thời`;
      const decisionContent = `Chúc mừng bạn! Quyết định nghỉ học tạm thời số ${state.decisionDoc?.number || 'QĐ-ĐHKT'} đã được Ban Giám hiệu ký số điện tử thành công và CSDL sinh viên đã cập nhật trạng thái Bảo lưu.`;

      const sentMsg: SentMessage = {
        id: `msg_mf4_${Date.now()}`,
        flowId: 'MF4',
        recipient: 'student',
        title: decisionTitle,
        content: decisionContent,
        day: currentDay,
        attachments: [state.decisionDoc?.number || 'QuyetDinhBaoLuu.pdf'],
      };

      state.messages.push(sentMsg);
      emit({
        type: 'message.sent',
        flowId: 'MF4',
        payload: { ...sentMsg, decisionDoc: state.decisionDoc ? { ...state.decisionDoc } : undefined },
      });
      break;
    }

    default:
      break;
  }
}
