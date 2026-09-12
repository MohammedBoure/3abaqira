import React, { useEffect, useRef, useState } from 'react';

export function ContextMenu({
  isOpen,
  position = { x: 0, y: 0 },
  onClose,
  title,
  subtitle,
  items = [],
}) {
  const menuRef = useRef(null);
  const [adjustedPos, setAdjustedPos] = useState({ top: 0, left: 0 });

  // Calculate clamped position inside viewport bounds
  useEffect(() => {
    if (!isOpen) return;

    const calculatePosition = () => {
      const menu = menuRef.current;
      const width = menu ? menu.offsetWidth : 240;
      const height = menu ? menu.offsetHeight : 280;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let left = position.x;
      let top = position.y;

      // Check right boundary
      if (left + width > viewportWidth - 10) {
        left = Math.max(10, viewportWidth - width - 10);
      }

      // Check bottom boundary
      if (top + height > viewportHeight - 10) {
        top = Math.max(10, viewportHeight - height - 10);
      }

      setAdjustedPos({ top, left });
    };

    calculatePosition();
    // Re-calculate after render in case dimensions were estimated
    const timer = setTimeout(calculatePosition, 10);
    return () => clearTimeout(timer);
  }, [isOpen, position]);

  // Close on Escape, click outside, or window scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      style={{
        top: `${adjustedPos.top}px`,
        left: `${adjustedPos.left}px`,
      }}
      className="fixed z-50 bg-white border border-slate-300 shadow-2xl rounded-none text-xs font-arabic min-w-[230px] max-w-xs select-none animate-in fade-in zoom-in-95 duration-100 py-1"
    >
      {/* Optional Menu Header */}
      {(title || subtitle) && (
        <div className="px-3 py-1.5 border-b border-slate-200 bg-slate-50/80 mb-1">
          {title && (
            <div className="font-bold text-slate-900 truncate text-[11px]">
              {title}
            </div>
          )}
          {subtitle && (
            <div className="text-[10px] text-slate-500 font-mono truncate">
              {subtitle}
            </div>
          )}
        </div>
      )}

      {/* Menu Items List */}
      <div className="space-y-0.5">
        {items.map((item, index) => {
          if (item.type === 'divider') {
            return (
              <div
                key={`divider-${index}`}
                className="my-1 border-t border-slate-200"
              />
            );
          }

          if (item.type === 'header') {
            return (
              <div
                key={`header-${index}`}
                className="px-3 py-0.5 text-[9px] font-bold tracking-wider text-slate-400 uppercase"
              >
                {item.label}
              </div>
            );
          }

          const Icon = item.icon;
          const isDanger = item.danger;

          return (
            <button
              key={`item-${index}`}
              onClick={(e) => {
                e.stopPropagation();
                if (item.onClick) item.onClick();
                onClose();
              }}
              disabled={item.disabled}
              className={`w-full px-3 py-1.5 flex items-center justify-between gap-2 text-start transition-colors ${
                item.disabled
                  ? 'opacity-40 cursor-not-allowed text-slate-400'
                  : isDanger
                  ? 'text-rose-700 hover:bg-rose-50'
                  : 'text-slate-800 hover:bg-blue-50 hover:text-blue-950'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                {Icon && (
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isDanger
                        ? 'text-rose-600'
                        : 'text-blue-900 group-hover:text-blue-950'
                    }`}
                  />
                )}
                <span className="truncate">{item.label}</span>
              </div>

              {item.shortcut && (
                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                  {item.shortcut}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
