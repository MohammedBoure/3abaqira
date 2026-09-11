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
      {/* Dark Frosted Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-primary-void/75 backdrop-blur-md transition-opacity duration-300"
        aria-hidden="true"
      />

      {/* Glassmorphic Modal Surface */}
      <div
        className={`
          relative w-full ${maxWidth} rounded-2xl
          bg-[#0a192f]/90 backdrop-blur-2xl
          border border-blue-400/35
          shadow-[0_20px_60px_0_rgba(2,6,23,0.8),0_0_40px_rgba(37,99,235,0.2)]
          p-6 sm:p-8 z-10 my-8
          transition-all duration-300 transform scale-100
        `}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-blue-400/15">
          <div>
            <h3 className="text-xl font-bold font-display text-white tracking-wide">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-blue-300/80 mt-1 font-medium">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-blue-600/20 border border-transparent hover:border-blue-400/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-5">
          {children}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-blue-400/15">
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
