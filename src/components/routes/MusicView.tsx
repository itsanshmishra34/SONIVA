import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GlobalSearchModal } from '../modals/GlobalSearchModal';

export const MusicView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <GlobalSearchModal
      isOpen={true}
      inline={true}
      onClose={() => navigate('/')}
      onSelectUserToChat={() => navigate('/chat')}
      onStartListenTogether={() => navigate('/listen-together')}
    />
  );
};
