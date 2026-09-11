import React from 'react';

export function GlassButton({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'ghost'
  size = 'md',        // 'xs' | 'sm' | 'md' | 'lg'
  icon: Icon,
  className = '',
  disabled = false,
  ...props
}) {
  const sizeClasses = {
    xs: 'px-2 py-1 text-[11px] gap-1',
    sm: 'px-2.5 py-1.5 text-xs gap-1.5',
    md: 'px-3.5 py-2 text-xs gap-2',
    lg: 'px-5 py-2.5 text-sm gap-2.5',
  };

  const variantClasses = {
    primary: `
      bg-blue-900 text-white font-medium
      border border-slate-900
      hover:bg-blue-800
      active:bg-blue-950
      shadow-xs
    `,
    secondary: `
      bg-white text-slate-800 font-medium
      border border-slate-300
      hover:bg-slate-50 hover:text-slate-950 hover:border-slate-400
      active:bg-slate-100
      shadow-xs
    `,
    accent: `
      bg-slate-900 text-white font-medium
      border border-black
      hover:bg-slate-800
      shadow-xs
    `,
    danger: `
      bg-rose-800 text-white font-medium
      border border-rose-950
      hover:bg-rose-700
      shadow-xs
    `,
    ghost: `
      bg-transparent text-slate-700 font-medium
      hover:bg-slate-100 hover:text-slate-950
      border border-transparent hover:border-slate-300
    `,
  };

  return (
    <button
      disabled={disabled}
      className={`
        inline-flex items-center justify-center
        rounded-none transition-colors duration-150 select-none
        disabled:opacity-40 disabled:pointer-events-none
        ${sizeClasses[size] || sizeClasses.md}
        ${variantClasses[variant] || variantClasses.primary}
        ${className}
      `}
      {...props}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{children}</span>
    </button>
  );
}

