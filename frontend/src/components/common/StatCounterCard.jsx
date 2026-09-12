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
    <GlassCard className={`p-3.5 sm:p-4 rounded-none shadow-xs border border-slate-200/90 ${accentStyles[accentColor] || accentStyles.navy}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-h-[54px] justify-between flex-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block leading-tight">
            {title}
          </span>
          <div className="text-2xl font-bold text-slate-900 tracking-tight font-mono tabular-nums leading-none">
            {value}
          </div>
        </div>

        {Icon && (
          <div className="p-2 border border-slate-200 bg-slate-50 text-slate-700 flex-shrink-0">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap min-h-[24px] text-xs">
        {change && (
          <span className="font-semibold px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-800 border border-slate-200 font-mono tabular-nums leading-tight flex-shrink-0">
            {change}
          </span>
        )}
        {subtext && (
          <span className="text-slate-500 text-[11px] font-medium leading-tight whitespace-normal break-words flex-1 text-end">
            {subtext}
          </span>
        )}
      </div>
    </GlassCard>
  );
}

