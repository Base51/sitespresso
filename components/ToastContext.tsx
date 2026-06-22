'use client';

import { createContext, ReactNode, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (params: Omit<Toast, 'id'> & { duration?: number }) => void;
  dismiss: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

type ToastProviderProps = {
  children: ReactNode;
};

export function ToastProvider({ children }: ToastProviderProps): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((params: Omit<Toast, 'id'> & { duration?: number }) => {
    const id = `${Date.now()}-${Math.random()}`;
    const newToast: Toast = {
      ...params,
      id,
      duration: params.duration ?? 5000,
    };

    setToasts((prev) => [...prev, newToast]);

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, newToast.duration);
    }

    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}
