import React, { useCallback, useState } from 'react';
import { ChatMessage } from '../../../ai/provider';
import { QUICK_QUESTIONS, StudentChatContext } from '../../../data/knowledge-base';
import { useAppStore } from '../../../store/useApp';
import { usePlaybackStore } from '../../../store/playback';
import { AiBadge } from '../../kit/AiBadge';
import { AiText } from '../../kit/AiText';

interface ChatMsg {
  role: 'user' | 'assistant';
  text: string;
}

interface Props {
  context: StudentChatContext;
}

const WELCOME =
  'Xin chào! Mình là Trợ lý Cổng thông tin sinh viên. Bạn hỏi về thủ tục, giấy tờ, SLA hoặc tiến độ hồ sơ nhé.';

export const AssistantTab: React.FC<Props> = ({ context }) => {
  const askAssistant = usePlaybackStore((s) => s.askAssistant);
  const isCustomCase = usePlaybackStore((s) => s.isCustomCase);
  const aiStatus = useAppStore((s) => s.aiStatus);
  const sessionMode = useAppStore((s) => s.sessionMode);
  const isCustomFlow = isCustomCase || sessionMode === 'portal';

  const [messages, setMessages] = useState<ChatMsg[]>([{ role: 'assistant', text: WELCOME }]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [typingIndex, setTypingIndex] = useState<number | null>(null);

  const finishTyping = useCallback(() => setTypingIndex(null), []);

  const ask = async (question: string): Promise<void> => {
    const text = question.trim();
    if (!text || thinking) return;

    const history: ChatMsg[] = [...messages, { role: 'user', text }];
    setMessages(history);
    setInput('');
    setThinking(true);

    try {
      const payload: ChatMessage[] = history.map((m) => ({ role: m.role, content: m.text }));
      const reply = await askAssistant(payload, context);
      setTypingIndex(history.length);
      setMessages([...history, { role: 'assistant', text: reply }]);
    } catch {
      setMessages([
        ...history,
        { role: 'assistant', text: 'Trợ lý đang bận, bạn hỏi lại giúp mình nhé.' },
      ]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ fontFamily: 'var(--font-paper)', fontSize: 12, fontWeight: 'bold' }}>
          {isCustomFlow ? 'TRỢ LÝ HỖ TRỢ TRỰC TUYẾN' : 'TRỢ LÝ AI'}
        </span>
        {!isCustomFlow && <AiBadge />}
      </div>

      <div
        className="student-scroll"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 7,
          paddingRight: 2,
          minHeight: 90,
          maxHeight: 260,
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={`${msg.role}-${i}`}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '92%',
              padding: '6px 8px',
              fontSize: 12,
              lineHeight: 1.45,
              background: msg.role === 'user' ? 'var(--paper-dim)' : 'var(--paper)',
              border: '1px solid var(--paper-line)',
              borderLeft: msg.role === 'assistant' ? '3px solid var(--stamp-blue)' : '1px solid var(--paper-line)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-read)',
            }}
          >
            {msg.role === 'assistant' && typingIndex === i ? (
              <AiText
                text={msg.text}
                speedMs={25}
                style={{ fontFamily: 'var(--font-read)', fontSize: 12, lineHeight: 1.45 }}
                onComplete={finishTyping}
              />
            ) : (
              msg.text
            )}
          </div>
        ))}
        {thinking && (
          <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
            {isCustomFlow ? 'Hệ thống đang chuẩn bị câu trả lời…' : 'AI đang soạn…'}
          </div>
        )}
      </div>

      {!isCustomFlow && aiStatus === 'fallback' && (
        <div className="ai-fallback-note">
          AI LIVE không phản hồi — đã chuyển sang MOCK (fallback).
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q.id}
            onClick={() => ask(q.text)}
            disabled={thinking}
            style={{
              fontFamily: 'var(--font-paper)',
              fontSize: 10,
              padding: '3px 6px',
              border: '1px solid var(--paper-line)',
              background: 'var(--paper-dim)',
              color: 'var(--ink)',
              borderRadius: 2,
              cursor: thinking ? 'wait' : 'var(--cursor-pointer)',
            }}
          >
            {q.text}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(input);
        }}
        style={{ display: 'flex', gap: 5, marginTop: 6 }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Hỏi trợ lý…"
          aria-label={isCustomFlow ? 'Câu hỏi cho trợ lý' : 'Câu hỏi cho trợ lý AI'}
          className="student-input"
          style={{ fontSize: 12 }}
        />
        <button
          type="submit"
          disabled={thinking}
          style={{
            padding: '4px 10px',
            background: 'var(--stamp-blue)',
            color: 'var(--text-on-stamp)',
            fontFamily: 'var(--font-paper)',
            fontSize: 11,
            borderRadius: 2,
            opacity: thinking ? 0.6 : 1,
          }}
        >
          Gửi
        </button>
      </form>

      <div style={{ fontSize: 9, color: 'var(--ink-soft)', marginTop: 4 }}>
        Trợ lý chỉ dùng tri thức của quy trình này; không tự quyết định kết quả hồ sơ.
      </div>
    </div>
  );
};
