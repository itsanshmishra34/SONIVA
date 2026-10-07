import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CameraSidebar } from '../views/CameraSidebar';

export const CameraView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <CameraSidebar
      isOpen={true}
      onClose={() => navigate('/')}
    />
  );
};
