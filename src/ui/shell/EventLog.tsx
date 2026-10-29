import React from 'react';
import { usePlaybackStore } from '../../store/playback';
import { EngineEvent } from '../../engine/types';

interface EventLogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EventLog: React.FC<EventLogProps> = ({ isOpen, onClose }) => {
  const currentEventLog = usePlaybackStore((s) => s.currentEventLog);
  const setActiveCaption = usePlaybackStore((s) => s.setActiveCaption);

  if (!isOpen) return null;

  const getEventSummary = (e: EngineEvent): { title: string; detail: string; nodeId?: string } => {
    switch (e.type) {
      case 'case.started':
        return { title: 'Bắt đầu ca', detail: `Mã ca: ${e.caseId}` };
      case 'node.entered':
        return { title: 'Vào node', detail: `Node: ${e.nodeId}`, nodeId: e.nodeId };
      case 'node.completed':
        return { title: 'Xong node', detail: `Node: ${e.nodeId}`, nodeId: e.nodeId };
      case 'edge.traversed':
        return { title: 'Chuyển cạnh', detail: `${e.from} → ${e.to}` };
      case 'token.split':
        return { title: 'Phân nhánh AND', detail: `Nhân 3 nhánh song song` };
      case 'token.merged':
        return { title: 'Hội tụ AND', detail: `Đồng bộ 3 nhánh về G4` };
      case 'task.assigned':
        return { title: 'Giao User Task', detail: `Chờ thao tác vai: ${e.lane}`, nodeId: e.nodeId };
      case 'task.completed':
        return { title: 'Hoàn tất User Task', detail: `Kết quả: ${JSON.stringify(e.outcome)}`, nodeId: e.nodeId };
      case 'rule.evaluated':
        return { title: `Đánh giá ${e.ruleId}`, detail: `${e.passed ? '✓ ĐẠT' : '✕ KHÔNG ĐẠT'}: ${e.detail}` };
      case 'message.sent':
        return { title: 'Gửi thông điệp', detail: `Flow: ${e.flowId}` };
      case 'data.read':
        return { title: 'Đọc CSDL', detail: `Kho: ${e.storeId}` };
      case 'data.written':
        return { title: 'Ghi CSDL', detail: `Kho: ${e.storeId}` };
      case 'dataobject.changed':
        return { title: 'Cập nhật hồ sơ', detail: `${e.id} (${e.stage})` };
      case 'timer.fired':
        return { title: 'Timer bắn', detail: `BT1 kích hoạt tại ngày ${e.day}` };
      case 'ai.requested':
        return { title: 'AI được gọi', detail: `${e.touchpoint} · từ ${e.source}` };
      case 'ai.responded':
        return { title: 'AI phản hồi', detail: `${e.touchpoint} · nguồn ${e.source}` };
      case 'human.disagreed':
        return {
          title: 'Người ≠ AI',
          detail: `Tác vụ ${e.taskId}: người chọn "${e.human}", AI đề xuất "${e.ai}"`,
          nodeId: e.taskId,
        };
      case 'case.ended':
        return { title: 'Kết thúc ca', detail: `${e.endEventId}: ${e.outcome}` };
      default:
        return { title: (e as { type: string }).type, detail: '' };
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: 360,
        backgroundColor: 'var(--desk-900)',
        borderLeft: '2px solid var(--desk-700)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 200,
        boxShadow: '-4px 0 12px rgba(0,0,0,0.5)',
        fontFamily: 'var(--font-paper)',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--desk-700)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--desk-700)',
        }}
      >
        <span style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--amber)' }}>
          📋 NHẬT KÝ SỰ KIỆN ({currentEventLog.length})
        </span>
        <button
          onClick={onClose}
          style={{ padding: '2px 8px', color: 'var(--paper)', fontSize: '14px', borderRadius: 2 }}
        >
          ✕
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {currentEventLog.length === 0 ? (
          <div style={{ color: 'var(--paper-dim)', fontSize: '14px', textAlign: 'center', marginTop: 32 }}>
            Chưa có sự kiện nào. Bấm [CHẠY CA] để bắt đầu.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {currentEventLog.map((ev, i) => {
              const summary = getEventSummary(ev);
              return (
                <div
                  key={i}
                  onClick={() => summary.nodeId && setActiveCaption(summary.nodeId)}
                  style={{
                    padding: '8px 10px',
                    backgroundColor: '#1f2420',
                    border: '1px solid #364038',
                    borderRadius: 2,
                    fontSize: '13px',
                    cursor: summary.nodeId ? 'var(--cursor-pointer)' : 'var(--cursor-default)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ color: 'var(--amber)', fontWeight: 'bold' }}>
                      #{i + 1} {summary.title}
                    </span>
                  </div>
                  <div style={{ color: 'var(--paper-dim)', fontSize: '12px' }}>
                    {summary.detail}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
