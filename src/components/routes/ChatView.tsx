import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Conversation, User } from '../../types';
import { ConversationList } from '../chat/ConversationList';
import { ChatPanel } from '../chat/ChatPanel';

interface ChatViewProps {
  conversations: Conversation[];
  activeConversationId: string;
  onSelectConversation: (convo: Conversation) => void;
  onOpenFindSomeone: () => void;
  onOpenCreatePrivate: () => void;
  onOpenJoinCode: () => void;
  onReportUser: (user: User) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onOpenFindSomeone,
  onOpenCreatePrivate,
  onOpenJoinCode,
  onReportUser
}) => {
  const { roomId } = useParams<{ roomId?: string }>();
  const navigate = useNavigate();

  // Handle deep-linking by roomId
  useEffect(() => {
    if (roomId && roomId !== activeConversationId) {
      const match = conversations.find((c) => c.roomId === roomId);
      if (match) {
        onSelectConversation(match);
      }
    }
  }, [roomId, activeConversationId, conversations, onSelectConversation]);

  const activeConversation = conversations.find((c) => c.roomId === activeConversationId) || conversations[0];

  const handleSelect = (convo: Conversation) => {
    onSelectConversation(convo);
    navigate(`/chat/${convo.roomId}`, { replace: true });
  };

  return (
    <div className="flex-1 flex overflow-hidden w-full h-full relative min-w-0">
      {/* 
        Conversation List Column:
        - Mobile: Hidden when a conversation is active (roomId exists), shown otherwise.
        - Desktop (md+): Always shown as a fixed-width column on the left.
      */}
      <ConversationList
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelect}
        onOpenFindSomeone={onOpenFindSomeone}
        onOpenCreatePrivate={onOpenCreatePrivate}
        onOpenJoinCode={onOpenJoinCode}
        onOpenSearch={() => navigate('/music')}
        className={`w-full md:w-80 h-full flex flex-col min-w-0 shrink-0 ${
          roomId ? 'hidden md:flex' : 'flex'
        }`}
      />

      {/* 
        Chat Workspace Column:
        - Mobile: Shown when a conversation is active, hidden otherwise.
        - Desktop (md+): Always shown and occupies the remaining viewport space.
      */}
      {activeConversation ? (
        <ChatPanel
          partner={activeConversation.participant}
          roomId={activeConversation.roomId}
          compatibilityScore={activeConversation.compatibilityScore}
          onStartListenTogether={() => navigate('/listen-together')}
          onStartSingTogether={() => navigate('/sing-together')}
          onStartVoiceCall={() => navigate('/voice-call')}
          onOpenSongSearch={() => navigate('/music')}
          onReportUser={onReportUser}
          onBackToList={() => navigate('/chat')}
          className={`flex-1 h-full min-w-0 ${
            roomId ? 'flex' : 'hidden md:flex'
          }`}
        />
      ) : (
        <div 
          className={`flex-1 h-full flex-col items-center justify-center text-slate-400 text-xs p-8 text-center space-y-3 min-w-0 ${
            roomId ? 'flex' : 'hidden md:flex'
          }`}
        >
          <p>Select a conversation or find someone to start chatting!</p>
          <button
            onClick={onOpenFindSomeone}
            className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold hover:bg-cyan-500/30 transition-colors cursor-pointer"
          >
            Find Someone (Random Connect)
          </button>
        </div>
      )}
    </div>
  );
};
