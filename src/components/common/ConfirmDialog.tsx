import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  step: 1 | 2;
  title?: string;
  message: string;
  dangerMessage?: string;
  confirmLabel?: string;
  onProceed: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<Props> = ({
  isOpen,
  step,
  title,
  message,
  dangerMessage,
  confirmLabel = 'Confirmer',
  onProceed,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in fade-in slide-in-from-bottom-4">
        <button onClick={onCancel} className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          <X size={18} className="text-gray-500" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-xl ${step === 2 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
            <AlertTriangle className={step === 2 ? 'text-red-600' : 'text-amber-600'} size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
              {step === 1 ? (title || 'Confirmation') : '⚠️ Action irréversible'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {step === 1 ? message : (dangerMessage || 'Cette action est définitive et irréversible. Les données seront perdues définitivement.')}
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium text-sm transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onProceed}
            className={`flex-1 px-4 py-2 rounded-xl font-medium text-sm text-white transition-colors ${
              step === 2 ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'
            }`}
          >
            {step === 1 ? 'Continuer' : confirmLabel}
          </button>
        </div>

        {step === 2 && (
          <p className="text-xs text-center text-red-500 mt-3">
            Étape 2/2 - Confirmation finale
          </p>
        )}
      </div>
    </div>
  );
};

export default ConfirmDialog;
