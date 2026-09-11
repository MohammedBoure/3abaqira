import React from 'react';

/**
 * ==============================================================================
 * 3ABAQIRA BRAND LOGO COMPONENT (SWAPPABLE BRANDING ARCHITECTURE)
 * ==============================================================================
 * All logo graphics, emblems, titles, and subheadings are encapsulated here.
 * When the final logo graphics are delivered:
 *   1. Drop new SVG/PNG files into /public/assets/branding/
 *   2. Update the asset paths in logoConfig below.
 * ==============================================================================
 */
export const logoConfig = {
  iconPath: '/assets/branding/logo-icon-placeholder.svg',
  fullPath: '/assets/branding/logo-full-placeholder.svg',
  nameLatin: '3ABAQIRA',
  nameArabic: 'أكاديمية وروضة الأطفال العباقرة',
  tagline: 'Enterprise Management Platform',
};

export function BrandLogo({
  variant = 'full', // 'icon' | 'full' | 'stacked'
  size = 'md',      // 'sm' | 'md' | 'lg'
  className = '',
}) {
  const sizeMap = {
    sm: { icon: 'w-7 h-7', textTitle: 'text-base', textSub: 'text-[10px]' },
    md: { icon: 'w-9 h-9', textTitle: 'text-xl', textSub: 'text-xs' },
    lg: { icon: 'w-12 h-12', textTitle: 'text-2xl', textSub: 'text-sm' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-3 select-none group cursor-pointer ${className}`}>
      {/* Emblem Container */}
      <div className="relative flex items-center justify-center p-1.5 rounded-xl bg-blue-50/90 border border-blue-200 shadow-xs transition-all duration-300 group-hover:scale-105 group-hover:border-blue-400 group-hover:bg-blue-100/70">
        <img
          src={logoConfig.iconPath}
          alt="3abaqira Logo Emblem"
          className={`${currentSize.icon} object-contain transition-transform duration-300 group-hover:rotate-6`}
        />
      </div>

      {/* Brand Text Block */}
      {variant !== 'icon' && (
        <div className={`flex flex-col ${variant === 'stacked' ? 'items-center text-center' : 'items-start'}`}>
          <div className="flex items-center gap-1.5">
            <span className={`font-display font-extrabold tracking-wider text-slate-900 ${currentSize.textTitle}`}>
              {logoConfig.nameLatin}
            </span>
            <span className="px-1.5 py-0.5 text-[9px] font-semibold tracking-widest text-blue-700 bg-blue-50 border border-blue-200 rounded-md uppercase">
              Pro
            </span>
          </div>
          <span className={`font-arabic text-slate-500 font-medium ${currentSize.textSub} line-clamp-1`}>
            {logoConfig.nameArabic}
          </span>
        </div>
      )}
    </div>
  );
}
