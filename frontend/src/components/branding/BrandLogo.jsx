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
      {/* 3D Glassmorphic Emblem Container */}
      <div className="relative flex items-center justify-center p-1.5 rounded-xl bg-gradient-to-br from-blue-500/20 via-blue-600/10 to-cyan-500/10 border border-blue-400/30 backdrop-blur-md shadow-lg shadow-blue-500/10 transition-all duration-300 group-hover:scale-105 group-hover:border-blue-400/60 group-hover:shadow-cyan-glow">
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
            <span className={`font-display font-extrabold tracking-wider text-white ${currentSize.textTitle} bg-gradient-to-r from-white via-blue-100 to-blue-300 bg-clip-text text-transparent`}>
              {logoConfig.nameLatin}
            </span>
            <span className="px-1.5 py-0.5 text-[9px] font-semibold tracking-widest text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 rounded-md uppercase">
              Pro
            </span>
          </div>
          <span className={`font-arabic text-blue-300/80 font-medium ${currentSize.textSub} line-clamp-1`}>
            {logoConfig.nameArabic}
          </span>
        </div>
      )}
    </div>
  );
}
