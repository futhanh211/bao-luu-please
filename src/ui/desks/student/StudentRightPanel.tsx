import React from 'react';
import { LetterDoc } from '../../../data/letters';
import { StudentProgressItem } from '../studentProgress';
import { StudentChatContext } from '../../../data/knowledge-base';
import { usePlaybackStore } from '../../../store/playback';
import { useAppStore } from '../../../store/useApp';
import { InboxTab } from './InboxTab';
import { ProgressTab } from './ProgressTab';
import { AssistantTab } from './AssistantTab';

export type DeskTab = 'inbox' | 'progress' | 'ai';

interface Props {
  tab: DeskTab;
  onTabChange: (tab: DeskTab) => void;
  unreadCount: number;
  letters: LetterDoc[];
  readIds: string[];
  onOpenLetter: (letter: LetterDoc) => void;
  timeline: StudentProgressItem[];
  waitingTaskId: string | null;
  chatContext: StudentChatContext;
}

export const StudentRightPanel: React.FC<Props> = ({
  tab,
  onTabChange,
  unreadCount,
  letters,
  readIds,
  onOpenLetter,
  timeline,
  waitingTaskId,
  chatContext,
}) => {
  const isCustomCase = usePlaybackStore((s) => s.isCustomCase);
  const sessionMode = useAppStore((s) => s.sessionMode);
  const isCustomFlow = isCustomCase || sessionMode === 'portal';

  const tabLabels: { id: DeskTab; label: string }[] = [
    { id: 'inbox', label: 'Hộp thư' },
    { id: 'progress', label: 'Tiến độ' },
    { id: 'ai', label: isCustomFlow ? 'Trợ lý hỗ trợ' : 'Trợ lý AI' },
  ];

  return (
    <div className="student-col paper-sheet" style={{ padding: 10 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {tabLabels.map((t) => (
          <button
            key={t.id}
            className="student-tab"
            data-active={tab === t.id}
            onClick={() => onTabChange(t.id)}
            style={{ position: 'relative' }}
          >
            {t.label}
            {t.id === 'inbox' && unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -3,
                  right: -3,
                  minWidth: 15,
                  height: 15,
                  borderRadius: '50%',
                  background: 'var(--stamp-red)',
                  color: 'var(--text-on-stamp)',
                  fontSize: 9,
                  lineHeight: '15px',
                  fontFamily: 'var(--font-paper)',
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="student-scroll" style={{ flex: 1 }}>
        {tab === 'inbox' && (
          <InboxTab
            letters={letters}
            readIds={readIds}
            onOpen={onOpenLetter}
          />
        )}
        {tab === 'progress' && <ProgressTab items={timeline} waitingTask={waitingTaskId} />}
        {tab === 'ai' && <AssistantTab context={chatContext} />}
      </div>
    </div>
  );
};
