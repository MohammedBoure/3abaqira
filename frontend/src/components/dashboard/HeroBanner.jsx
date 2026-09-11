import React from 'react';
import { Sparkles, UserPlus, Receipt, ShieldCheck } from 'lucide-react';
import { GlassButton } from '../common/GlassButton';

export function HeroBanner({ onOpenStudentModal, onOpenDrawerModal }) {
  const currentDate = new Date().toLocaleDateString('ar-DZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden bg-white/90 border border-slate-200/90 backdrop-blur-md shadow-sm">
      {/* Subtle ambient gradient highlights */}
      <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-10 top-0 w-80 h-80 bg-slate-100/60 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          {/* Top meta tags */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-blue-700" />
              <span>السنة الأكاديمية النشطة: 2025-2026</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>قاعدة البيانات: MySQL (abaqira)</span>
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-4xl font-extrabold font-display text-slate-900 tracking-tight leading-tight">
            لوحة قيادة إدارة المؤسسة الموحدة
          </h1>

          <p className="mt-2 text-sm sm:text-base text-slate-600 font-normal max-w-2xl leading-relaxed">
            {currentDate} — المنظومة الإدارية المتكاملة لأكاديمية وروضة الأطفال العباقرة، بواجهة مهنية كلاسيكية وعنصر بصري ثلاثي الأبعاد هادئ.
          </p>
        </div>

        {/* Quick Action CTA Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <GlassButton
            onClick={onOpenStudentModal}
            variant="primary"
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
