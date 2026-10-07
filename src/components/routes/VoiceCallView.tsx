import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Conversation } from '../../types';
import { VoiceCallModal } from '../voice/VoiceCallModal';

interface VoiceCallViewProps {
  activeConversation?: Conversation | null;
}

export const VoiceCallView: React.FC<VoiceCallViewProps> = ({ activeConversation }) => {
  const navigate = useNavigate();

  const partner: User = activeConversation?.participant || {
    id: 'voice-partner',
    email: 'voice@soniva.internal',
    username: 'audio_friend',
    displayName: 'SONIVA Audio Friend',
    gender: 'Male',
    birthYear: 2002,
    musicInterests: ['Audio Call', 'Lo-Fi'],
    role: 'user',
    createdAt: new Date().toISOString(),
    isOnline: true,
    status: 'active'
  };

  const roomId = activeConversation?.roomId || 'voice-room-call';

  return (
    <VoiceCallModal
      partner={partner}
      roomId={roomId}
      onClose={() => navigate('/chat')}
    />
  );
};
