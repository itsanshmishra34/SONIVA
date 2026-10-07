import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RateFeedbackModal } from '../modals/RateFeedbackModal';

export const FeedbackView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <RateFeedbackModal
      isOpen={true}
      onClose={() => navigate('/')}
    />
  );
};
