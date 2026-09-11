import React from 'react';
import { GlassCard } from './GlassCard';

export function StatCounterCard({
  title,
  value,
  change,
  subtext,
  icon: Icon,
  trend = 'positive',
  accentColor = 'blue', // 'blue' | 'cyan' | 'indigo'
}) {
  const accentGradients = {
    blue: 'from-blue-600/30 to-blue-800/10 border-blue-400/30 text-blue-400',
    cyan: 'from-cyan-600/30 to-cyan-800/10 border-cyan-400/30 text-cyan-400',
    indigo: 'from-indigo-600/30 to-indigo-800/10 border-indigo-400/30 text-indigo-400',
  };

  return (
    <GlassCard className="relative overflow-hidden group">
      {/* Subtle ambient corner light */}
      <div className="absolute -right-8 -top-8 w-28 h-28 bg-blue-500/15 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-400/25 transition-colors duration-500" />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-300/80 mb-1">
            {title}
          </p>
          <h3 className="text-2xl lg:text-3xl font-bold font-display text-white tracking-tight">
            {value}
          </h3>
        </div>

        {/* Icon Frame */}
        {Icon && (
          <div className={`p-3 rounded-xl bg-gradient-to-br border backdrop-blur-md shadow-lg transition-transform duration-300 group-hover:scale-110 ${accentGradients[accentColor] || accentGradients.blue}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Trend & Subtext footer */}
      <div className="mt-4 pt-3 border-t border-blue-400/10 flex items-center justify-between text-xs">
        {change && (
          <span className="inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-400/20">
            {change}
          </span>
        )}
        {subtext && (
          <span className="text-slate-400 font-medium line-clamp-1">
            {subtext}
          </span>
        )}
      </div>
    </GlassCard>
  );
}
