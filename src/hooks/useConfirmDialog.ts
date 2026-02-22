import { useState, useCallback } from 'react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  dangerMessage?: string;
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  step: 1 | 2;
  onConfirm: () => void;
}

export const useConfirmDialog = () => {
  const [state, setState] = useState<ConfirmState>({
    isOpen: false,
    step: 1,
    message: '',
    onConfirm: () => {},
  });

  const confirm = useCallback((options: ConfirmOptions, onConfirm: () => void) => {
    setState({
      ...options,
      isOpen: true,
      step: 1,
      onConfirm,
    });
  }, []);

  const proceed = useCallback(() => {
    if (state.step === 1) {
      setState((prev) => ({ ...prev, step: 2 }));
    } else {
      state.onConfirm();
      setState((prev) => ({ ...prev, isOpen: false, step: 1 }));
    }
  }, [state]);

  const cancel = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false, step: 1 }));
  }, []);

  return { state, confirm, proceed, cancel };
};
