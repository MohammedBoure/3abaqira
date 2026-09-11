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
    md: 'px-4 py-2 text-sm gap-2 rounded-xl',
    lg: 'px-6 py-2.5 text-base gap-2.5 rounded-xl',
  };

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700
      text-white font-medium
      border border-blue-800/20
      shadow-[0_2px_8px_rgba(29,78,216,0.2)]
      hover:from-blue-600 hover:to-blue-800
      hover:shadow-[0_4px_14px_rgba(29,78,216,0.3)]
      hover:-translate-y-0.5
      active:translate-y-0
    `,
    secondary: `
      bg-white text-slate-700 font-medium
      border border-slate-300
      shadow-xs
      hover:bg-slate-50 hover:text-slate-900
      hover:border-slate-400
      hover:-translate-y-0.5
      active:translate-y-0
    `,
    cyan: `
      bg-gradient-to-r from-sky-600 to-blue-600
      text-white font-medium
      border border-sky-700/20
      shadow-[0_2px_8px_rgba(2,132,199,0.2)]
      hover:from-sky-500 hover:to-blue-700
      hover:shadow-[0_4px_14px_rgba(2,132,199,0.3)]
      hover:-translate-y-0.5
      active:translate-y-0
    `,
    ghost: `
      bg-transparent text-slate-600 font-medium
      hover:bg-slate-100 hover:text-slate-900
      border border-transparent hover:border-slate-200
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
      {Icon && <Icon className="w-4 h-4 transition-transform group-hover:scale-105" />}
      <span>{children}</span>
    </button>
  );
}
