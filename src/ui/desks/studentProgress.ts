import { EngineEvent } from '../../engine/types';

/**
 * Ánh xạ event của engine sang dòng thời gian dành cho sinh viên.
 * Hàm THUẦN, không React, không DOM — dùng chung cho UI và test.
 */

export type ProgressTone = 'neutral' | 'info' | 'ok' | 'warn' | 'error';

export interface StudentProgressItem {
  id: string;
  label: string;
  detail?: string;
  day: number;
  tone: ProgressTone;
  nodeId?: string;
}

interface EventPayloadShape {
  title?: string;
  content?: string;
  day?: number;
}

const NODE_LABELS: Record<string, { label: string; tone: ProgressTone; detail?: string }> = {
  T1: {
    label: 'Hệ thống đang kiểm tra hồ sơ',
    tone: 'info',
    detail: 'Đối chiếu thông tin bắt buộc, minh chứng và CSDL sinh viên.',
  },
  T2: {
    label: 'Đang soạn thông báo bổ sung hồ sơ',
    tone: 'warn',
    detail: 'Hệ thống chỉ ra nội dung còn thiếu để bạn nộp lại.',
  },
  T3: {
    label: 'Đang đối chiếu điều kiện',
    tone: 'info',
    detail: 'Đối chiếu kết quả học tập và công nợ học phí tự động (R1–R4).',
  },
  T7: {
    label: 'Đang soạn thông báo kết quả xét',
    tone: 'warn',
    detail: 'Giải thích điều kiện chưa đạt và hướng xử lý.',
  },
  T8: {
    label: 'Đang soạn dự thảo quyết định',
    tone: 'info',
    detail: 'Hệ thống điền sẵn họ tên, MSSV và thời hạn bảo lưu.',
  },
  T10: {
    label: 'Đang cập nhật trạng thái sinh viên',
    tone: 'info',
    detail: 'Ghi trạng thái “Bảo lưu” vào CSDL Quản lý sinh viên.',
  },
};

function readPayload(payload: unknown): EventPayloadShape {
  if (!payload || typeof payload !== 'object') return {};
  return payload as EventPayloadShape;
}

function endLabel(endEventId: string, outcome: string): StudentProgressItem {
  if (endEventId === 'E_END_OK') {
    return {
      id: 'ended-ok',
      label: 'Đã có quyết định',
      detail: 'Quyết định nghỉ học tạm thời đã được ký số và gửi vào Hộp thư của bạn.',
      day: 0,
      tone: 'ok',
      nodeId: 'E_END_OK',
    };
  }
  if (endEventId === 'E_END_RETURNED') {
    return {
      id: 'ended-returned',
      label: 'Hồ sơ đã được trả lại',
      detail: 'Hệ thống đã gửi thông báo bổ sung vào Hộp thư của bạn.',
      day: 0,
      tone: 'warn',
      nodeId: 'E_END_RETURNED',
    };
  }
  if (endEventId === 'E_END_REJECTED') {
    return {
      id: 'ended-rejected',
      label: 'Hồ sơ chưa đủ điều kiện bảo lưu',
      detail: 'Lý do chi tiết nằm trong thư phản hồi ở Hộp thư.',
      day: 0,
      tone: 'error',
      nodeId: 'E_END_REJECTED',
    };
  }
  return {
    id: `ended-${endEventId}`,
    label: outcome || 'Ca làm việc đã kết thúc',
    day: 0,
    tone: 'neutral',
    nodeId: endEventId,
  };
}

export function buildStudentTimeline(
  events: EngineEvent[],
  eventDays: number[] = []
): StudentProgressItem[] {
  const items: StudentProgressItem[] = [];
  const dayAt = (index: number): number => eventDays[index] ?? 0;

  const push = (item: StudentProgressItem): void => {
    const last = items[items.length - 1];
    if (last && last.label === item.label) return;
    items.push(item);
  };

  events.forEach((event, index) => {
    const day = dayAt(index);

    switch (event.type) {
      case 'case.started':
        push({
          id: `submitted-${index}`,
          label: 'Đã nộp đơn',
          detail: 'Đơn và minh chứng đã được gửi trực tuyến tới Nhà trường.',
          day,
          tone: 'info',
          nodeId: 'SV_T1',
        });
        break;

      case 'node.entered': {
        const mapping = NODE_LABELS[event.nodeId];
        if (mapping) {
          push({
            id: `node-${event.nodeId}-${index}`,
            label: mapping.label,
            detail: mapping.detail,
            day,
            tone: mapping.tone,
            nodeId: event.nodeId,
          });
        }
        if (event.nodeId === 'G2') {
          push({
            id: `parallel-${index}`,
            label: 'Hồ sơ hợp lệ — đang xét song song',
            detail: 'Ba bộ phận xử lý đồng thời: điều kiện học tập, Cố vấn và CTSV.',
            day,
            tone: 'info',
            nodeId: 'G2',
          });
        }
        if (event.nodeId === 'T9') {
          push({
            id: `sign-${index}`,
            label: 'Chờ Ban Giám hiệu ký số',
            detail: 'Dự thảo quyết định đã sẵn sàng để ký điện tử.',
            day,
            tone: 'info',
            nodeId: 'T9',
          });
        }
        break;
      }

      case 'task.assigned': {
        if (event.nodeId === 'T4') {
          push({
            id: `wait-t4-${index}`,
            label: 'Chờ Cố vấn xác nhận',
            detail: 'SLA 3 ngày làm việc; quá hạn hệ thống tự nhắc Cố vấn.',
            day,
            tone: 'warn',
            nodeId: 'T4',
          });
        } else if (event.nodeId === 'T5') {
          push({
            id: `wait-t5-${index}`,
            label: 'Đang thẩm định minh chứng',
            detail: 'Phòng Công tác sinh viên kiểm tra giấy tờ bạn đã nộp.',
            day,
            tone: 'warn',
            nodeId: 'T5',
          });
        }
        break;
      }

      case 'message.sent': {
        const payload = readPayload(event.payload);
        const label =
          event.flowId === 'MF2'
            ? 'Hồ sơ cần bổ sung'
            : event.flowId === 'MF3'
              ? 'Chưa đủ điều kiện bảo lưu'
              : event.flowId === 'MF4'
                ? 'Đã có quyết định'
                : null;
        if (label) {
          push({
            id: `msg-${event.flowId}-${index}`,
            label,
            detail: payload.title || 'Thư mới trong Hộp thư.',
            day,
            tone: event.flowId === 'MF4' ? 'ok' : event.flowId === 'MF3' ? 'error' : 'warn',
            nodeId: event.flowId,
          });
        }
        break;
      }

      case 'timer.fired':
        push({
          id: `timer-${index}`,
          label: 'Đã nhắc Cố vấn quá hạn',
          detail: 'Hồ sơ chờ quá 3 ngày làm việc, hệ thống tự động nhắc việc.',
          day,
          tone: 'warn',
          nodeId: 'T6',
        });
        break;

      case 'case.ended': {
        const item = endLabel(event.endEventId, event.outcome);
        push({ ...item, id: `${item.id}-${index}`, day });
        break;
      }

      default:
        break;
    }
  });

  return items;
}
