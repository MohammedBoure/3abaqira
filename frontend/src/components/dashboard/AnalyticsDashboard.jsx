import React, { useState } from 'react';
import {
  TrendingUp,
  Users,
  Wallet,
  Building,
  GraduationCap,
  Calendar,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import {
  MOCK_ANALYTICS_DATA,
  MOCK_PROGRAMS,
  MOCK_STUDENTS_ROSTER,
} from '../../mock/mockData';

export function AnalyticsDashboard({ selectedBranch = 'ALL' }) {
  const [timeRange, setTimeRange] = useState('YTD'); // 'MONTH' | 'QUARTER' | 'YTD' | 'FULL_YEAR'

  // Summary Metrics calculations
  const totalStudents = MOCK_STUDENTS_ROSTER.length;
  const totalAgreed = MOCK_STUDENTS_ROSTER.reduce((sum, s) => sum + (s.agreedAmount || 0), 0);
  const totalPaid = MOCK_STUDENTS_ROSTER.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
  const totalRemaining = MOCK_STUDENTS_ROSTER.reduce((sum, s) => sum + (s.remainingBalance || 0), 0);
  const collectionRate = ((totalPaid / (totalAgreed || 1)) * 100).toFixed(1);

  // Maximum revenue value for chart scaling
  const maxRevenueVal = Math.max(
    ...MOCK_ANALYTICS_DATA.monthlyFinancials.map((m) => Math.max(m.expectedDues, m.collected))
  );

  return (
    <div className="space-y-4 w-full text-slate-800">
      {/* 1. Executive Analytics Header Bar */}
      <div className="p-3 bg-white border border-slate-300 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-blue-900" />
            <h2 className="text-base font-bold font-display text-slate-900 tracking-tight">
              منظومة الإحصائيات والتحليلات القيادية (Executive Business Intelligence)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            مؤشرات السيولة، كفاءة التحصيل المالي، إشغال المقاعد، وتحليل الفوارق بين الفروع
          </p>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center border border-slate-300 bg-white">
            {[
              { id: 'MONTH', label: 'الشهر الحالي' },
              { id: 'QUARTER', label: 'الثلاثي الأخير' },
              { id: 'YTD', label: 'الموسم 2025-2026' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeRange(t.id)}
                className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                  timeRange === t.id
                    ? 'bg-blue-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <GlassButton variant="secondary" size="sm" icon={Printer} className="h-7 text-xs">
            طباعة التقرير
          </GlassButton>
        </div>
      </div>

      {/* 2. Razor-Sharp Executive KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Tile 1: Cash Collections */}
        <div className="p-3.5 bg-white border border-slate-200/90 border-s-4 border-s-emerald-700 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[11px]">المبالغ المحصلة فعلياً</span>
            <CheckCircle className="w-4 h-4 text-emerald-700 flex-shrink-0" />
          </div>
          <div className="flex flex-col gap-1 min-h-[54px] justify-center">
            <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight tabular-nums leading-none">
              {totalPaid.toLocaleString('fr-DZ')} دج
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] min-h-[24px]">
            <span className="text-emerald-700 font-bold font-mono tabular-nums">
              {collectionRate}% نسبة التحصيل
            </span>
            <span className="text-slate-500 font-mono tabular-nums">
              من {totalAgreed.toLocaleString('fr-DZ')} دج
            </span>
          </div>
        </div>

        {/* Tile 2: Outstanding Arrears */}
        <div className="p-3.5 bg-white border border-slate-200/90 border-s-4 border-s-amber-600 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[11px]">الأقساط والمستحقات المتبقية</span>
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          </div>
          <div className="flex flex-col gap-1 min-h-[54px] justify-center">
            <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight tabular-nums leading-none">
              {totalRemaining.toLocaleString('fr-DZ')} دج
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] min-h-[24px]">
            <span className="text-amber-800 font-medium">
              موزعة على 4 دفعات مجدولة
            </span>
            <span className="text-slate-500 font-mono tabular-nums">
              {MOCK_STUDENTS_ROSTER.filter((s) => s.remainingBalance > 0).length} ملفات غير مسددة
            </span>
          </div>
        </div>

        {/* Tile 3: Student Enrollment & Headcount */}
        <div className="p-3.5 bg-white border border-slate-200/90 border-s-4 border-s-blue-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[11px]">إجمالي الطلاب والاشتراكات</span>
            <Users className="w-4 h-4 text-blue-900 flex-shrink-0" />
          </div>
          <div className="flex flex-col gap-1 min-h-[54px] justify-center">
            <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight tabular-nums leading-none">
              273 مسجل
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] min-h-[24px]">
            <span className="text-blue-900 font-medium tabular-nums">
              88.4% استغلال المقاعد
            </span>
            <span className="text-slate-500 font-mono tabular-nums">
              السعة الإجمالية: 310
            </span>
          </div>
        </div>

        {/* Tile 4: Net Operational Margin */}
        <div className="p-3.5 bg-white border border-slate-200/90 border-s-4 border-s-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[11px]">السيولة الصافية للصندوق</span>
            <Wallet className="w-4 h-4 text-slate-800 flex-shrink-0" />
          </div>
          <div className="flex flex-col gap-1 min-h-[54px] justify-center">
            <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight tabular-nums leading-none">
              184,500 دج
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] min-h-[24px]">
            <span className="text-slate-700 font-medium font-mono">
              رصيد الخزينة المعتمد
            </span>
            <span className="text-emerald-700 font-medium">
              مغلق ومطابق 100%
            </span>
          </div>
        </div>
      </div>

      {/* 3. Primary Analytical Grid (Cash Flow Velocity & Capacity Meters) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Monthly Cash Flow & Velocity Chart */}
        <div className="lg:col-span-2 p-4 bg-white border border-slate-300 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-display">
                  منحنى التدفق المالي الشهري: المستحقات المتوقعة مقابل المداخيل المحصلة
                </h3>
                <p className="text-xs text-slate-500">
                  مقارنة حركة الإيرادات والنفقات التشغيلية على مدار أشهر الموسم الدراسي
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1 text-slate-600">
                  <span className="w-3 h-3 bg-slate-200 border border-slate-300" />
                  المستحق النظري
                </span>
                <span className="flex items-center gap-1 text-blue-900 font-bold">
                  <span className="w-3 h-3 bg-blue-900" />
                  المحصل الفعلي
                </span>
                <span className="flex items-center gap-1 text-rose-800">
                  <span className="w-3 h-3 bg-rose-700" />
                  المصاريف
                </span>
              </div>
            </div>

            {/* Sharp Architectural Chart Canvas */}
            <div className="mt-5 space-y-4">
              {MOCK_ANALYTICS_DATA.monthlyFinancials.map((m) => {
                const duesWidth = Math.round((m.expectedDues / maxRevenueVal) * 100);
                const collectedWidth = Math.round((m.collected / maxRevenueVal) * 100);
                const expensesWidth = Math.round((m.expenses / maxRevenueVal) * 100);

                return (
                  <div key={m.month} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 w-16">{m.month}</span>
                      <div className="flex items-center gap-3 font-mono text-[11px]">
                        <span className="text-slate-500">
                          مستحق: {m.expectedDues.toLocaleString('fr-DZ')} دج
                        </span>
                        <span className="text-blue-900 font-bold">
                          محصل: {m.collected.toLocaleString('fr-DZ')} دج
                        </span>
                        <span className="text-rose-700 font-medium">
                          مصاريف: {m.expenses.toLocaleString('fr-DZ')} دج
                        </span>
                      </div>
                    </div>

                    {/* Dual Stacked Progress Line */}
                    <div className="w-full bg-slate-100 h-4 border border-slate-200 relative">
                      {/* Expected Dues Ghost Bar */}
                      <div
                        className="absolute inset-y-0 start-0 bg-slate-200"
                        style={{ width: `${duesWidth}%` }}
                      />
                      {/* Actual Collected Solid Bar */}
                      <div
                        className="absolute inset-y-0 start-0 bg-blue-900"
                        style={{ width: `${collectedWidth}%` }}
                      />
                      {/* Expense Notch Bar */}
                      <div
                        className="absolute inset-y-0 start-0 bg-rose-700 opacity-60"
                        style={{ width: `${expensesWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>متوسط نسبة التحصيل التراكمية: <strong className="text-slate-900">86.2%</strong></span>
            <span>صافي الفائض التشغيلي التراكمي: <strong className="text-emerald-800 font-mono">2,855,000 دج</strong></span>
          </div>
        </div>

        {/* Right 1 Col: Program Capacity Saturation */}
        <div className="p-4 bg-white border border-slate-300 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-display">
                  إشغال المقاعد والقدرة الاستيعابية
                </h3>
                <p className="text-xs text-slate-500">
                  معدل استغلال القاعات وتوزيع المقاعد حسب البرامج
                </p>
              </div>
              <GraduationCap className="w-4 h-4 text-blue-900" />
            </div>

            <div className="mt-4 space-y-3.5">
              {MOCK_PROGRAMS.map((prog) => {
                const percent = Math.min(100, Math.round((prog.studentsCount / prog.targetCapacity) * 100));
                return (
                  <div key={prog.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 truncate max-w-[160px]">
                        {prog.nameAr}
                      </span>
                      <span className="font-mono text-slate-600 text-[11px]">
                        <strong>{prog.studentsCount}</strong> / {prog.targetCapacity} ({percent}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-2 border border-slate-200">
                      <div
                        className="h-full bg-blue-900"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Aging Solvency Proportions */}
          <div className="mt-5 pt-3 border-t border-slate-200">
            <span className="text-xs font-bold text-slate-700 block mb-2">
              توزيع الوضعيات المالية للمسجلين:
            </span>
            <div className="w-full h-3 flex border border-slate-300">
              <div
                title="مسدد بالكامل (84.6%)"
                className="bg-emerald-700 h-full"
                style={{ width: '84.6%' }}
              />
              <div
                title="سداد جزئي (11%)"
                className="bg-amber-500 h-full"
                style={{ width: '11%' }}
              />
              <div
                title="متأخرات مستحقة (4.4%)"
                className="bg-rose-700 h-full"
                style={{ width: '4.4%' }}
              />
            </div>
            <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500 font-mono">
              <span className="text-emerald-800 font-bold">■ مسدد 84.6%</span>
              <span className="text-amber-800 font-bold">■ جزئي 11.0%</span>
              <span className="text-rose-800 font-bold">■ متأخر 4.4%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Comparative Branch Matrix & Department Cost Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Branch Direct Comparison */}
        <div className="p-4 bg-white border border-slate-300 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-900" />
              <h3 className="text-sm font-bold text-slate-900 font-display">
                المقارنة التشغيلية بين المقرات (المركز ⇄ الروضة)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500">سنة 2025-2026</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {/* Center Card */}
            <div className="p-3 bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-blue-900 block mb-1">
                المركز الأكاديمي (3abaqira Center)
              </span>
              <div className="space-y-1.5 text-xs text-slate-700 mt-2">
                <div className="flex justify-between">
                  <span>المسجلون:</span>
                  <strong className="font-mono">158 طالب</strong>
                </div>
                <div className="flex justify-between">
                  <span>البرامج النشطة:</span>
                  <strong className="font-mono">8 مسارات</strong>
                </div>
                <div className="flex justify-between">
                  <span>المداخيل المحصلة:</span>
                  <strong className="font-mono text-emerald-800">1,240,000 دج</strong>
                </div>
                <div className="flex justify-between">
                  <span>المستحقات المتبقية:</span>
                  <strong className="font-mono text-amber-800">145,000 دج</strong>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1">
                  <span>نسبة كفاءة التحصيل:</span>
                  <strong className="font-mono text-blue-900 font-bold">89.5%</strong>
                </div>
              </div>
            </div>

            {/* Rawda Card */}
            <div className="p-3 bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-blue-900 block mb-1">
                روضة وحضانة الأطفال (Daycare)
              </span>
              <div className="space-y-1.5 text-xs text-slate-700 mt-2">
                <div className="flex justify-between">
                  <span>الأطفال المسجلون:</span>
                  <strong className="font-mono">115 طفل</strong>
                </div>
                <div className="flex justify-between">
                  <span>الأقسام والفئات:</span>
                  <strong className="font-mono">4 أقسام (Bébé-GS)</strong>
                </div>
                <div className="flex justify-between">
                  <span>المداخيل المحصلة:</span>
                  <strong className="font-mono text-emerald-800">940,000 دج</strong>
                </div>
                <div className="flex justify-between">
                  <span>المستحقات المتبقية:</span>
                  <strong className="font-mono text-amber-800">95,000 دج</strong>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1">
                  <span>نسبة كفاءة التحصيل:</span>
                  <strong className="font-mono text-blue-900 font-bold">90.8%</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Departmental Expense Ledger Breakdown - Zero Clipping Guardrails */}
        <div className="p-4 bg-white border border-slate-200/90 shadow-xs min-h-fit">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 font-display">
              توزيع النفقات والأعباء التشغيلية (Expense Breakdown)
            </h3>
            <span className="text-xs font-mono font-bold text-rose-800 tabular-nums">
              المجموع: 671,100 دج
            </span>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {MOCK_ANALYTICS_DATA.departmentCostBreakdown.map((item) => (
              <div key={item.nameAr} className="py-2.5 flex items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="w-2 h-2 bg-slate-600 flex-shrink-0" />
                  <span className="font-medium text-slate-800 whitespace-normal break-words leading-relaxed">
                    {item.nameAr}
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono flex-shrink-0 tabular-nums">
                  <span className="text-slate-900 font-bold tabular-nums">
                    {item.amount.toLocaleString('fr-DZ')} دج
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] bg-slate-100 border border-slate-200 text-slate-600 font-bold tabular-nums">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Comprehensive Program Financial Pivot Table */}
      <div className="p-4 bg-white border border-slate-300 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-display">
              جدول التحليل المالي والتربوي حسب المسارات التعليمية (Programs Pivot Table)
            </h3>
            <p className="text-xs text-slate-500">
              كشف تفصيلي للمستحقات، المتحصلات، والمتأخرات لكل فوج وبرنامج
            </p>
          </div>
          <GlassButton variant="secondary" size="sm" icon={FileSpreadsheet} className="h-7 text-xs">
            تصدير الجدول (.CSV)
          </GlassButton>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="excel-table text-xs text-slate-800">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="excel-th py-2 px-3 text-start">البرنامج التعليمي</th>
                <th className="excel-th py-2 px-3 text-start">الفرع</th>
                <th className="excel-th py-2 px-3 text-center">الأفواج</th>
                <th className="excel-th py-2 px-3 text-center">المسجلون</th>
                <th className="excel-th py-2 px-3 text-center">نسبة الإشغال</th>
                <th className="excel-th py-2 px-3 text-end">المستحق المتوقع</th>
                <th className="excel-th py-2 px-3 text-end">المحصل الفعلي</th>
                <th className="excel-th py-2 px-3 text-end">المتأخرات</th>
                <th className="excel-th py-2 px-3 text-center">نسبة التحصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {MOCK_PROGRAMS.map((prog) => {
                const estDues = prog.studentsCount * 13500;
                const estPaid = Math.round(estDues * 0.88);
                const estRem = estDues - estPaid;
                const recRate = ((estPaid / estDues) * 100).toFixed(1);
                const capRate = Math.min(100, Math.round((prog.studentsCount / prog.targetCapacity) * 100));

                return (
                  <tr key={prog.id} className="hover:bg-slate-50">
                    <td className="excel-td py-2 px-3 font-bold text-slate-900">
                      {prog.nameAr}
                    </td>
                    <td className="excel-td py-2 px-3 text-slate-600">
                      {prog.category === 'Daycare' ? 'الروضة والحضانة' : 'المركز الأكاديمي'}
                    </td>
                    <td className="excel-td py-2 px-3 text-center font-mono">
                      {prog.cohortsCount} أفواج
                    </td>
                    <td className="excel-td py-2 px-3 text-center font-mono font-bold">
                      {prog.studentsCount}
                    </td>
                    <td className="excel-td py-2 px-3 text-center font-mono">
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 font-semibold">
                        {capRate}%
                      </span>
                    </td>
                    <td className="excel-td py-2 px-3 text-end font-mono">
                      {estDues.toLocaleString('fr-DZ')} دج
                    </td>
                    <td className="excel-td py-2 px-3 text-end font-mono font-bold text-emerald-800">
                      {estPaid.toLocaleString('fr-DZ')} دج
                    </td>
                    <td className="excel-td py-2 px-3 text-end font-mono text-amber-800">
                      {estRem.toLocaleString('fr-DZ')} دج
                    </td>
                    <td className="excel-td py-2 px-3 text-center font-mono font-bold text-blue-900">
                      {recRate}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
