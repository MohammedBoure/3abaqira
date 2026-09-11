import React from 'react';
import { Sparkles, UserPlus, Receipt, FileSpreadsheet, ShieldCheck } from 'lucide-react';
import { GlassButton } from '../common/GlassButton';

export function HeroBanner({ onOpenStudentModal, onOpenDrawerModal }) {
  const currentDate = new Date().toLocaleDateString('ar-DZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden bg-gradient-to-r from-blue-950/70 via-[#0f274a]/60 to-blue-900/40 border border-blue-400/25 backdrop-blur-2xl shadow-2xl">
      {/* Background radial ambient lights */}
      <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-10 top-0 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          {/* Top meta tags */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>السنة الأكاديمية النشطة: 2025-2026</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>قاعدة البيانات: MySQL (abaqira)</span>
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-4xl font-extrabold font-display text-white tracking-tight leading-tight">
            لوحة قيادة إدارة المؤسسة الموحدة
          </h1>

          <p className="mt-2 text-sm sm:text-base text-blue-200/80 font-medium max-w-2xl">
            {currentDate} — الواجهة المرئية الحديثة لإدارة الأكاديمية وروضة الأطفال العباقرة، مصممة بأعلى معايير الحداثة والتفاعل ثلاثي الأبعاد.
          </p>
        </div>

        {/* Quick Action CTA Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <GlassButton
            onClick={onOpenStudentModal}
            variant="cyan"
            size="md"
            icon={UserPlus}
          >
            تسجيل طالب جديد
          </GlassButton>

          <GlassButton
            onClick={onOpenDrawerModal}
            variant="secondary"
            size="md"
            icon={Receipt}
          >
            مطابقة الصندوق اليومي
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
