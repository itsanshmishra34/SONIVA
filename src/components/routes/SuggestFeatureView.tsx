import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SuggestFeatureModal } from '../modals/SuggestFeatureModal';

export const SuggestFeatureView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <SuggestFeatureModal
      isOpen={true}
      onClose={() => navigate('/')}
    />
  );
};
