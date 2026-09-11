import React from 'react';
import { GlassCard } from './GlassCard';

export function StatCounterCard({
  title,
  value,
  change,
  subtext,
  icon: Icon,
  accentColor = 'navy', // 'navy' | 'emerald' | 'amber' | 'slate'
}) {
  const accentStyles = {
    navy: 'border-s-4 border-s-blue-900 bg-white',
    emerald: 'border-s-4 border-s-emerald-700 bg-white',
    amber: 'border-s-4 border-s-amber-600 bg-white',
    slate: 'border-s-4 border-s-slate-700 bg-white',
  };

  return (
    <GlassCard className={`p-4 rounded-none shadow-none ${accentStyles[accentColor] || accentStyles.navy}`}>
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            {title}
          </span>
          <div className="text-2xl font-bold font-display text-slate-900 tracking-tight font-mono">
            {value}
          </div>
        </div>

        {Icon && (
          <div className="p-2 border border-slate-200 bg-slate-50 text-slate-700">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        {change && (
          <span className="font-semibold px-1.5 py-0.5 text-[11px] bg-slate-100 text-slate-800 border border-slate-200 font-mono">
            {change}
          </span>
        )}
        {subtext && (
          <span className="text-slate-500 text-[11px] font-medium truncate max-w-[200px]">
            {subtext}
          </span>
        )}
      </div>
    </GlassCard>
  );
}

