import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ListenTogetherModal } from '../modals/ListenTogetherModal';

export const ListenTogetherView: React.FC = () => {
  const { roomId } = useParams<{ roomId?: string }>();
  const navigate = useNavigate();

  return (
    <ListenTogetherModal
      isOpen={true}
      roomId={roomId || 'room-sync'}
      partnerName={roomId ? `Room #${roomId}` : 'Public Music Lounge'}
      onClose={() => navigate('/')}
      onOpenSearch={() => navigate('/music')}
    />
  );
};
