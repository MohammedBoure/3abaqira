import React from 'react';
import { Users, GraduationCap, ChevronLeft } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { MOCK_PROGRAMS } from '../../mock/mockData';

export function ProgramsOverview() {
  return (
    <GlassCard className="h-full flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                دليل البرامج والمستويات الأكاديمية
              </h3>
              <p className="text-xs text-slate-500">
                توزيع الأفواج، المقاعد المستغلة، والقدرة الاستيعابية
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 text-xs font-mono font-semibold rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
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
                className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/90 hover:border-blue-300 hover:bg-white transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: prog.color }}
                    />
                    <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      {prog.nameAr}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-600">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-blue-700" />
                      {prog.studentsCount} طالب
                    </span>
                    <span>•</span>
                    <span className="text-slate-400">
                      {prog.levelsCount} مستويات
                    </span>
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${capacityPercent}%`,
                      backgroundColor: prog.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <span>مصفوفة تسعير الأقساط والخصومات</span>
        <button className="flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900 transition-colors">
          <span>عرض خطط الرسوم</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>
    </GlassCard>
  );
}
