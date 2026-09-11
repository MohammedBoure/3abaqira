import React from 'react';
import { Layers, Users, GraduationCap, ChevronLeft } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { MOCK_PROGRAMS } from '../../mock/mockData';

export function ProgramsOverview() {
  return (
    <GlassCard className="h-full flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-blue-400/15">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-400/30 text-blue-300">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">
                دليل البرامج والمستويات الأكاديمية
              </h3>
              <p className="text-xs text-blue-300/70">
                توزيع الأفواج، المقاعد المستغلة، والقدرة الاستيعابية
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 text-xs font-mono font-semibold rounded-lg bg-blue-900/60 text-blue-300 border border-blue-400/25">
            9 مسارات
          </span>
        </div>

        {/* Programs List */}
        <div className="mt-4 space-y-3.5">
          {MOCK_PROGRAMS.map((prog) => {
            const capacityPercent = Math.min(100, Math.round((prog.studentsCount / 100) * 100));
            return (
              <div
                key={prog.id}
                className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-400/15 hover:border-blue-400/35 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: prog.color }}
                    />
                    <span className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                      {prog.nameAr}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-blue-200">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-cyan-400" />
                      {prog.studentsCount} طالب
                    </span>
                    <span>•</span>
                    <span className="text-slate-400">
                      {prog.levelsCount} مستويات
                    </span>
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div className="w-full bg-blue-950/80 rounded-full h-1.5 overflow-hidden border border-blue-500/20">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${capacityPercent}%`,
                      backgroundColor: prog.color,
                      boxShadow: `0 0 10px ${prog.color}`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-blue-400/15 flex items-center justify-between text-xs text-blue-300/80">
        <span>مصفوفة تسعير الأقساط والخصومات</span>
        <button className="flex items-center gap-1 font-semibold text-cyan-300 hover:text-white transition-colors">
          <span>عرض خطط الرسوم</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>
    </GlassCard>
  );
}
