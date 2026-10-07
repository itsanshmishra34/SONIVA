import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SingTogetherStudio } from '../sing/SingTogetherStudio';

export const SingTogetherView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col justify-center items-center relative overflow-y-auto animate-page-enter">
      <SingTogetherStudio
        onClose={() => navigate('/')}
        onOpenChat={() => navigate('/chat')}
      />
    </div>
  );
};
