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
        bg-[#0f274a]/45 backdrop-blur-xl
        border border-blue-400/20
        shadow-[0_8px_32px_0_rgba(2,6,23,0.45)]
        inset-shadow-[0_1px_0_0_rgba(255,255,255,0.08)]
        transition-all duration-300 ease-out
        ${hoverEffect ? 'hover:border-blue-400/40 hover:bg-[#13305c]/50 hover:shadow-[0_12px_40px_0_rgba(2,6,23,0.55),0_0_25px_rgba(59,130,246,0.15)] hover:-translate-y-0.5' : ''}
        ${glow ? 'shadow-[0_0_30px_rgba(59,130,246,0.25)] border-blue-400/40' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {/* Subtle top inner light highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/25 to-transparent rounded-t-2xl pointer-events-none" />
      {children}
    </div>
  );
}
