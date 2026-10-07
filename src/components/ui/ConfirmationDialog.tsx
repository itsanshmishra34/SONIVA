import React from 'react';
import { LiquidGlassCard } from './LiquidGlassCard';
import { LiquidGlassButton } from './LiquidGlassButton';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <LiquidGlassCard depth={3} className="max-w-md w-full p-6 space-y-4 border-rose-500/30">
        <div className="flex items-center gap-3 text-rose-400">
          <AlertTriangle className="w-6 h-6" />
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>
        <p className="text-sm text-slate-300">{message}</p>
        <div className="flex justify-end gap-3">
          <LiquidGlassButton variant="secondary" onClick={onClose}>{cancelLabel}</LiquidGlassButton>
          <LiquidGlassButton variant="primary" onClick={onConfirm} className="bg-rose-600 hover:bg-rose-700">{confirmLabel}</LiquidGlassButton>
        </div>
      </LiquidGlassCard>
    </div>
  );
};
