import React, { useState } from 'react';
import {
  Search,
  Download,
  Printer,
  Plus,
  Filter,
  Calendar,
  Layers,
  CheckCircle,
  FileSpreadsheet,
  CalendarRange,
} from 'lucide-react';

export function StandardViewLayout({
  // 1. Breadcrumb & Title
  titleAr,
  titleEn,
  description,
  entityTag = 'روضة الأطفال',
  branchCode = 'RAWDA',
  // 2. KPI Summary Cards (Exactly 4 cards)
  kpiCards = [],
  // 3. Action & Filter Bar Options
  searchTerm = '',
  onSearchChange,
  searchPlaceholder = 'بحث فوري في السجلات...',
  filterSlot,
  hasMonthToggle = false,
  isCurrentMonthOnly = false,
  onToggleMonthFilter,
  actionButtonLabel = '+ تسجيل جديد',
  onActionButtonClick,
  // 4. Data for CSV Export
  exportFileName = 'data_export',
  exportData = [],
  exportHeaders = [],
  // 5. Body Content
  children,
}) {
  const [copiedNotification, setCopiedNotification] = useState(false);

  // CSV Export utility with UTF-8 BOM for Arabic in Excel
  const handleExportCSV = () => {
    if (!exportData || exportData.length === 0) {
      alert('لا توجد بيانات متاحة للتصدير حالياً');
      return;
    }

    try {
      const headers = exportHeaders.length > 0 ? exportHeaders : Object.keys(exportData[0]);
      const csvRows = [];
      csvRows.push(headers.join(','));

      for (const row of exportData) {
        const values = headers.map((header) => {
          const val = row[header] !== undefined && row[header] !== null ? String(row[header]) : '';
          const escaped = val.replace(/"/g, '""');
          return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
      }

      const csvString = '\uFEFF' + csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${exportFileName}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 3000);
    } catch (e) {
      console.error('Error generating CSV', e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-3 print:p-0 print:space-y-1">
      {/* 1. الهيدر والمسار (Breadcrumb & Title Standard) */}
      <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs print:border-none print:p-1">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span className="font-semibold text-blue-900">
              {branchCode === 'CENTER' ? 'المركز الأكاديمي والتعليمي' : 'روضة وحضانة الأطفال العباقرة'}
            </span>
            <span className="text-slate-300">/</span>
            <span className="tag text-[10px] font-mono px-1.5 py-0.2 bg-blue-50 text-blue-800 border-blue-200">
              {entityTag}
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            {titleAr}
            {titleEn && <span className="text-xs font-normal text-slate-500 font-sans ms-2">({titleEn})</span>}
          </h1>
          {description && (
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0 print:hidden">
          <button
            onClick={handleExportCSV}
            className="h-7 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="تصدير جدول البيانات الحالي إلى ملف CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden md:inline">تصدير CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="h-7 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="طباعة الواجهة الحالية"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden md:inline">طباعة</span>
          </button>
          {onActionButtonClick && (
            <button
              onClick={onActionButtonClick}
              className="h-7 px-3 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{actionButtonLabel}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. الشريط الإحصائي العلوي (KPI Summary Cards - Exactly 4 Cards) */}
      {kpiCards && kpiCards.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 print:hidden">
          {kpiCards.slice(0, 4).map((card, idx) => {
            const Icon = card.icon || Layers;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200 p-3 flex flex-col justify-between shadow-2xs hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center justify-between gap-1 text-slate-500 mb-1">
                  <span className="text-xs font-medium text-slate-600 truncate">{card.label}</span>
                  <div className="w-6 h-6 rounded bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-blue-900" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 tracking-tight">
                    {card.value}
                  </span>
                  {card.change && (
                    <span
                      className={`text-[10px] font-medium font-mono px-1 py-0.2 rounded-[2px] ${
                        card.isPositive !== false
                          ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                          : 'text-rose-700 bg-rose-50 border border-rose-200'
                      }`}
                    >
                      {card.change}
                    </span>
                  )}
                </div>
                {card.subtext && (
                  <p className="text-[10px] text-slate-500 mt-1 truncate">{card.subtext}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 3. شريط العمليات (Action & Filter Bar) */}
      <div className="bg-white border border-slate-200 p-2 sm:p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs print:hidden">
        {/* Search & Custom Filters */}
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          {onSearchChange && (
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute inset-y-0 start-2.5 my-auto text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full h-7 ps-8 pe-2.5 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-900 focus:outline-none transition-colors"
              />
            </div>
          )}

          {filterSlot && (
            <div className="flex items-center gap-2">
              {filterSlot}
            </div>
          )}
        </div>

        {/* Month Toggle (Section 4.2: عرض الشهر الحالي فقط vs عرض السنة كاملة) */}
        <div className="flex items-center gap-2">
          {hasMonthToggle && onToggleMonthFilter && (
            <button
              onClick={onToggleMonthFilter}
              className={`h-7 px-2.5 text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                isCurrentMonthOnly
                  ? 'bg-blue-900 text-white border-blue-900'
                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
              title="التبديل بين تصفية الشهر الحالي وعرض جدول السنة الـ 11 شهراً كاملاً"
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>{isCurrentMonthOnly ? 'عرض الشهر الحالي فقط' : 'عرض السنة كاملة (11 شهر)'}</span>
            </button>
          )}

          {/* Quick Action Button in Mobile */}
          {onActionButtonClick && (
            <button
              onClick={onActionButtonClick}
              className="h-7 px-2.5 bg-blue-900 text-white text-xs font-bold flex sm:hidden items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{actionButtonLabel}</span>
            </button>
          )}
        </div>
      </div>

      {/* Export notification banner */}
      {copiedNotification && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs px-3 py-1.5 flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>تم تجهيز وتصدير ملف البيانات بنجاح (ترميز UTF-8 متوافق مع Excel).</span>
        </div>
      )}

      {/* 4. Main Body Content (Table or Custom Component) */}
      <div className="bg-white border border-slate-200 shadow-2xs overflow-hidden">
        {children}
      </div>
    </div>
  );
}
