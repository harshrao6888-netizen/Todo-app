import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef();

  const hide = useCallback(() => setToast(null), []);

  const show = useCallback((message, { tone = 'info', action, duration = 4500 } = {}) => {
    clearTimeout(timer.current);
    setToast({ id: Date.now(), message, tone, action });
    timer.current = setTimeout(() => setToast(null), duration);
  }, []);

  const value = useMemo(() => ({ show, hide }), [show, hide]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[120px] z-[60] flex justify-center px-4"
      >
        {toast && (
          <div
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className={`animate-fade-in pointer-events-auto flex w-full max-w-sm items-center gap-3 px-4 py-3 text-sm text-white shadow-lg ${
              toast.tone === 'error' ? 'bg-danger' : 'bg-ink'
            }`}
          >
            <span className="flex-1">{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                className="font-semibold text-complete-icon"
                onClick={() => {
                  hide();
                  toast.action.onClick();
                }}
              >
                {toast.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
