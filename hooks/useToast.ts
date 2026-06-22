import { useContext } from 'react';
import { ToastContext, type Toast } from '@/components/ToastContext';

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
