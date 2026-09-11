import React from 'react';

export function GlassButton({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'cyan' | 'ghost'
  size = 'md',        // 'sm' | 'md' | 'lg'
  icon: Icon,
  className = '',
  disabled = false,
  ...props
}) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
    md: 'px-4 py-2.5 text-sm gap-2 rounded-xl',
    lg: 'px-6 py-3 text-base gap-2.5 rounded-xl',
  };

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800
      text-white font-medium
      border border-blue-400/35
      shadow-[0_4px_16px_rgba(37,99,235,0.35)]
      hover:from-blue-500 hover:to-blue-700
      hover:shadow-[0_6px_24px_rgba(37,99,235,0.55)]
      hover:border-blue-300/60
      hover:-translate-y-0.5
      active:translate-y-0
    `,
    secondary: `
      bg-[#0f274a]/60 text-blue-100 font-medium
      border border-blue-400/25
      backdrop-blur-md
      hover:bg-[#1e3a8a]/60 hover:text-white
      hover:border-blue-400/50 hover:shadow-[0_4px_16px_rgba(59,130,246,0.2)]
      hover:-translate-y-0.5
      active:translate-y-0
    `,
    cyan: `
      bg-gradient-to-r from-cyan-600 to-blue-600
      text-white font-medium
      border border-cyan-400/40
      shadow-[0_4px_16px_rgba(6,182,212,0.35)]
      hover:from-cyan-500 hover:to-blue-500
      hover:shadow-[0_6px_24px_rgba(6,182,212,0.55)]
      hover:-translate-y-0.5
      active:translate-y-0
    `,
    ghost: `
      bg-transparent text-blue-200 font-medium
      hover:bg-blue-600/15 hover:text-white
      border border-transparent hover:border-blue-400/20
    `,
  };

  return (
    <button
      disabled={disabled}
      className={`
        inline-flex items-center justify-center
        transition-all duration-200 select-none
        disabled:opacity-50 disabled:pointer-events-none
        ${sizeClasses[size] || sizeClasses.md}
        ${variantClasses[variant] || variantClasses.primary}
        ${className}
      `}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />}
      <span>{children}</span>
    </button>
  );
}
