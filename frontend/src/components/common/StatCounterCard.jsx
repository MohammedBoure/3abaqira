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
  const accentStyles = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    cyan: 'bg-sky-50 border-sky-200 text-sky-700',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  };

  return (
    <GlassCard className="relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            {title}
          </p>
          <h3 className="text-2xl lg:text-3xl font-bold font-display text-slate-900 tracking-tight">
            {value}
          </h3>
        </div>

        {/* Icon Frame */}
        {Icon && (
          <div className={`p-3 rounded-xl border shadow-xs transition-transform duration-250 group-hover:scale-105 ${accentStyles[accentColor] || accentStyles.blue}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Trend & Subtext footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        {change && (
          <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
            {change}
          </span>
        )}
        {subtext && (
          <span className="text-slate-500 font-medium line-clamp-1">
            {subtext}
          </span>
        )}
      </div>
    </GlassCard>
  );
}
