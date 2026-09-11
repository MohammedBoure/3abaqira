import React from 'react';

export function GlassCard({
  children,
  className = '',
  hoverEffect = false,
  glow = false,
  onClick,
  ...props
}) {
  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-none p-5
        bg-white/95 backdrop-blur-sm
        border border-slate-300
        shadow-[0_1px_3px_0_rgba(15,23,42,0.06)]
        transition-all duration-150 ease-out
        ${hoverEffect ? 'hover:border-slate-400 hover:shadow-sm' : ''}
        ${glow ? 'border-blue-700 ring-1 ring-blue-700' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {/* Crisp subtle architectural top border accent */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-900 via-blue-700 to-transparent pointer-events-none opacity-80" />
      {children}
    </div>
  );
}

