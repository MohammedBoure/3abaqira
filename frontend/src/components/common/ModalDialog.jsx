import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { GlassButton } from './GlassButton';

export function ModalDialog({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-2xl',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Dark Translucent Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      {/* Modal Surface - Sharp Enterprise Windows */}
      <div
        className={`
          relative w-full ${maxWidth} rounded-none
          bg-white
          border border-slate-400
          shadow-2xl
          p-5 sm:p-6 z-10 my-4
        `}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-300">
          <div>
            <h3 className="text-base font-bold font-display text-slate-900 tracking-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5 font-normal">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-4">
          {children}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <GlassButton variant="secondary" size="sm" onClick={onClose}>
            إغلاق
          </GlassButton>
          <GlassButton variant="primary" size="sm" onClick={onClose}>
            حفظ وتأكيد
          </GlassButton>
        </div>
      </div>
    </div>
  );
}

