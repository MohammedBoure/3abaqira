import React from 'react';
import { Users, GraduationCap, ChevronLeft } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { MOCK_PROGRAMS } from '../../mock/mockData';

export function ProgramsOverview() {
  return (
    <GlassCard className="h-full flex flex-col justify-between rounded-none shadow-xs">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-300">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 border border-blue-200 text-blue-900">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-display">
                دليل البرامج والأفواج الأكاديمية
              </h3>
              <p className="text-[11px] text-slate-500">
                توزيع المقاعد المستغلة والقدرة الاستيعابية
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-300">
            5 مسارات رئيسية
          </span>
        </div>

        {/* Programs List */}
        <div className="mt-3 space-y-2.5">
          {MOCK_PROGRAMS.map((prog) => {
            const capacityPercent = Math.min(100, Math.round((prog.studentsCount / prog.targetCapacity) * 100));
            return (
              <div
                key={prog.id}
                className="p-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-white transition-all"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2"
                      style={{ backgroundColor: prog.color }}
                    />
                    <span className="text-xs font-bold text-slate-900">
                      {prog.nameAr}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-600">
                    <span className="flex items-center gap-1 font-semibold text-slate-800">
                      <Users className="w-3 h-3 text-blue-900" />
                      {prog.studentsCount} طالب
                    </span>
                    <span>•</span>
                    <span className="text-slate-500">
                      {prog.cohortsCount} أفواج
                    </span>
                  </div>
                </div>

                {/* Capacity Progress Bar - Sharp architectural */}
                <div className="w-full bg-slate-200 h-1.5 border border-slate-300">
                  <div
                    className="h-full bg-blue-900"
                    style={{
                      width: `${capacityPercent}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-300 flex items-center justify-between text-xs text-slate-600">
        <span>مصفوفة تسعير الأقساط والخصومات</span>
        <button className="flex items-center gap-1 font-bold text-blue-900 hover:text-blue-700 transition-colors">
          <span>عرض جدول الرسوم</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>
    </GlassCard>
  );
}

