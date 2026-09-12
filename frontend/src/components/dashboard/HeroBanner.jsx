import React from 'react';
import { UserPlus, Receipt, ShieldCheck, Database, Calendar, Building2 } from 'lucide-react';
import { GlassButton } from '../common/GlassButton';

export function HeroBanner({ selectedBranch = 'ALL', onOpenStudentModal, onOpenDrawerModal }) {
  const currentDate = new Date().toLocaleDateString('ar-DZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const branchTitle =
    selectedBranch === 'CENTER'
      ? 'أكاديمية الأطفال العباقرة — المركز الأكاديمي الرئيسي'
      : selectedBranch === 'RAWDA'
      ? 'روضة وحضانة الأطفال العباقرة النموذجية'
      : 'كافة المقرات والفروع (المركز الأكاديمي + الروضة النموذجية)';

  const branchBadge =
    selectedBranch === 'CENTER'
      ? 'المقر: المركز الأكاديمي (158 طالب نشط)'
      : selectedBranch === 'RAWDA'
      ? 'المقر: روضة وحضانة العباقرة (115 طفل نشط)'
      : 'نطاق موحد: كافة المقرات (273 مسجل)';

  return (
    <div className="relative rounded-none p-4 sm:p-5 bg-white border border-slate-300 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {/* Top meta tags */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-900 border border-blue-300">
              <Calendar className="w-3 h-3 text-blue-800" />
              <span>السنة الأكاديمية: 2025-2026</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold bg-blue-900 text-white">
              <Building2 className="w-3 h-3 text-blue-200" />
              <span>{branchBadge}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300">
              <ShieldCheck className="w-3 h-3 text-emerald-700" />
              <span>حالة المزامنة: متصل ومتزامن</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono text-slate-600 bg-slate-100 border border-slate-200">
              {currentDate}
            </span>
          </div>

          {/* Heading with Logo */}
          <div className="flex items-center gap-3 mt-1">
            <img
              src="/assets/branding/logo.webp"
              alt="3abaqira Logo"
              className="w-12 h-12 rounded-full border border-blue-300 shadow-xs object-cover flex-shrink-0"
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 tracking-tight leading-tight">
                {branchTitle}
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-600 font-normal max-w-3xl leading-relaxed">
                المنصة المركزية لإدارة الأكاديمية والروضة — استغلال كامل لواجهة العمل وتكامل شامل مع بنية Excel لسهولة الترحيل والتشغيل الميداني.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action CTA Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <GlassButton
            onClick={onOpenStudentModal}
            variant="primary"
            size="sm"
            icon={UserPlus}
            className="h-8 text-xs font-semibold"
          >
            تسجيل طالب جديد
          </GlassButton>

          <GlassButton
            onClick={onOpenDrawerModal}
            variant="secondary"
            size="sm"
            icon={Receipt}
            className="h-8 text-xs font-semibold"
          >
            مطابقة الصندوق اليومي
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
