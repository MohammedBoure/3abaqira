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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Dark Translucent Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200"
        aria-hidden="true"
      />

      {/* Modal Surface */}
      <div
        className={`
          relative w-full ${maxWidth} rounded-2xl
          bg-white/95 backdrop-blur-xl
          border border-slate-200
          shadow-2xl
          p-6 sm:p-8 z-10 my-8
          transition-all duration-250 transform scale-100
        `}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-xl font-bold font-display text-slate-900 tracking-wide">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-5">
          {children}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <GlassButton variant="secondary" size="sm" onClick={onClose}>
            إغلاق المعاينة
          </GlassButton>
          <GlassButton variant="primary" size="sm" onClick={onClose}>
            حفظ النموذج (معاينة مرئية)
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
