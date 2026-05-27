import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../cn';
import { Check, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

// --- Types ---
export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
}

// --- Context ---
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// --- Provider ---
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((type: ToastType, message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {createPortal(
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100000] flex flex-col gap-2 pointer-events-none">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

// --- Toast Item ---
const iconMap = {
  success: Check,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: 'bg-success-950 border-success-600/30 text-success-400',
  error: 'bg-error-950 border-error-600/30 text-error-400',
  warning: 'bg-warning-950 border-warning-600/30 text-warning-400',
  info: 'bg-info-950 border-info-600/30 text-info-400',
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const Icon = iconMap[toast.type];

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-lg border shadow-lg',
        'animate-slide-up min-w-[280px] max-w-[420px]',
        colorMap[toast.type]
      )}
    >
      <Icon size={14} className="flex-shrink-0" />
      <p className="text-xs font-medium flex-1">{toast.message}</p>
      <button onClick={onDismiss} className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
        <X size={12} />
      </button>
    </div>
  );
}
