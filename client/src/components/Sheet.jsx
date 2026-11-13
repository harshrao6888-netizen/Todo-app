import { useEffect, useRef } from 'react';
import { Icon } from './Icon.jsx';
import { icons } from './icons.js';

/** Bottom sheet with a dimmed backdrop, as in the "Add New Task" Figma frame. */
export default function Sheet({ title, onClose, children, labelledBy = 'sheet-title' }) {
  const panel = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const prevFocus = document.activeElement;
    panel.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-center">
      <div className="animate-fade-in absolute inset-0 bg-black/25" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className="animate-sheet-up absolute bottom-0 flex max-h-[92dvh] w-full max-w-[480px] flex-col bg-white outline-none"
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 id={labelledBy} className="text-lg font-medium text-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-m-2 flex size-10 items-center justify-center"
          >
            <Icon src={icons.close} size={15.6} className="rotate-45" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>
  );
}
