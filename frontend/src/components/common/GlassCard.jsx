import React from 'react';

export function GlassCard({
  children,
  className = '',
  hoverEffect = true,
  glow = false,
  onClick,
  ...props
}) {
  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-2xl p-6
        bg-white/85 backdrop-blur-md
        border border-slate-200/85
        shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05),0_2px_6px_-1px_rgba(15,23,42,0.02)]
        transition-all duration-250 ease-out
        ${hoverEffect ? 'hover:border-blue-300 hover:bg-white/95 hover:shadow-[0_10px_28px_-3px_rgba(15,23,42,0.08),0_4px_10px_-2px_rgba(15,23,42,0.03)] hover:-translate-y-0.5' : ''}
        ${glow ? 'shadow-[0_4px_24px_rgba(37,99,235,0.12)] border-blue-300' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {/* Subtle top inner light highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200/50 to-transparent rounded-t-2xl pointer-events-none" />
      {children}
    </div>
  );
}
