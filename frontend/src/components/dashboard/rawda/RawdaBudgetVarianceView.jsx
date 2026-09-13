import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Plus,
  Edit2,
  X,
  Calendar,
  Download,
  Printer,
  Search,
  Info,
  HelpCircle,
  Check,
  Copy,
  Coins,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { RAWDA_MONTHS } from '../../../mock/rawdaMockData';

export function RawdaBudgetVarianceView() {
  const [selectedYear, setSelectedYear] = useState('2025-2026');
  const [selectedMonth, setSelectedMonth] = useState('jun'); // Default to June (جوان) as exemplified in user prompt

  // Structured multi-month variance dataset matching exact specification
  const [monthlyVarianceData, setMonthlyVarianceData] = useState(() => {
    const data = {};
    const defaultStructure = [
      // 1. Monthly overarching categories (شهر ...)
      { id: 'diapers_cleaning', group: 'MONTHLY', periodLabel: 'شهر', category: 'حفاظات و مواد التنظيف', variableFactor: '25 كرتون حفاضات + منظفات', budget: 35000, actual: 32400 },
      { id: 'daily_petty', group: 'MONTHLY', periodLabel: 'شهر', category: 'المصروف اليومي', variableFactor: 'نثريات وطوارئ الروضة', budget: 20000, actual: 18200 },
      { id: 'dry_goods', group: 'MONTHLY', periodLabel: 'شهر', category: 'مواد جافة', variableFactor: 'حبوب، عجائن، سكر، زيت', budget: 40000, actual: 42500 },
      { id: 'bread', group: 'MONTHLY', periodLabel: 'شهر', category: 'الخبز', variableFactor: '22 يوم × 18 خبزة (15 دج)', budget: 5940, actual: 5500 },

      // 2. Weekly provisions breakdown (Weeks 1 to 5)
      { id: 'w1_veg_fruit', group: 'WEEKLY', periodLabel: 'الاسبوع 1', category: 'خضر وفواكه', variableFactor: 'توريد أسبوعي طازج', budget: 7000, actual: 6500 },
      { id: 'w1_yogurt_dairy', group: 'WEEKLY', periodLabel: 'الاسبوع 1', category: 'ياوغورت', variableFactor: 'ألبان ولمجة يومية للأطفال', budget: 6000, actual: 5700 },

      { id: 'w2_veg_fruit', group: 'WEEKLY', periodLabel: 'الاسبوع 2', category: 'خضر وفواكه', variableFactor: 'توريد أسبوعي طازج', budget: 7000, actual: 6800 },
      { id: 'w2_yogurt_dairy', group: 'WEEKLY', periodLabel: 'الاسبوع 2', category: 'ياوغورت', variableFactor: 'ألبان ولمجة يومية للأطفال', budget: 6000, actual: 5700 },

      { id: 'w3_veg_fruit', group: 'WEEKLY', periodLabel: 'الاسبوع 3', category: 'خضر وفواكه', variableFactor: 'توريد أسبوعي طازج', budget: 7000, actual: 7200 },
      { id: 'w3_yogurt_dairy', group: 'WEEKLY', periodLabel: 'الاسبوع 3', category: 'ياوغورت', variableFactor: 'ألبان ولمجة يومية للأطفال', budget: 6000, actual: 5700 },

      { id: 'w4_veg_fruit', group: 'WEEKLY', periodLabel: 'الاسبوع 4', category: 'خضر وفواكه', variableFactor: 'توريد أسبوعي طازج', budget: 7000, actual: 6400 },
      { id: 'w4_yogurt_dairy', group: 'WEEKLY', periodLabel: 'الاسبوع 4', category: 'ياوغورت', variableFactor: 'ألبان ولمجة يومية للأطفال', budget: 6000, actual: 5700 },

      { id: 'w5_veg_fruit', group: 'WEEKLY', periodLabel: 'الأسبوع 5', category: 'خضر وفواكه', variableFactor: 'توريد ختامي للشهر', budget: 4000, actual: 3800 },
      { id: 'w5_yogurt_dairy', group: 'WEEKLY', periodLabel: 'الأسبوع 5', category: 'ياوغورت', variableFactor: 'لمجة ختامية', budget: 3500, actual: 3200 },
    ];

    ['2024-2025', '2025-2026', '2026-2027'].forEach((yr) => {
      data[yr] = {};
      RAWDA_MONTHS.forEach((m, mIdx) => {
        data[yr][m.id] = defaultStructure.map((row) => ({
          ...row,
          id: `${yr}-${m.id}-${row.id}`,
          periodLabel: row.group === 'MONTHLY' ? `شهر ${m.nameAr}` : row.periodLabel,
          // slight variation for realism across months
          budget: Math.round(row.budget * (1 + (mIdx % 3) * 0.02)),
          actual: Math.round(row.actual * (1 + (mIdx % 2) * 0.03)),
        }));
      });
    });

    return data;
  });

  // Current active month's rows
  const activeRows = useMemo(() => {
    return monthlyVarianceData[selectedYear]?.[selectedMonth] || [];
  }, [monthlyVarianceData, selectedYear, selectedMonth]);

  // Modals state
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isAddRowModalOpen, setIsAddRowModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null); // Full edit modal

  // Inline Cell Editing State
  const [inlineEdit, setInlineEdit] = useState(null); // { id, field }
  const [inlineVal, setInlineVal] = useState('');

  // Right-Click Context Menu State
  const [contextMenu, setContextMenu] = useState(null); // { x, y, row }

  // New item form
  const [newRowData, setNewRowData] = useState({
    periodLabel: 'الأسبوع 1',
    category: '',
    variableFactor: '',
    budget: '',
    actual: '',
  });

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = () => setContextMenu(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // 1. KPI Calculations
  const totalBudget = activeRows.reduce((acc, r) => acc + (Number(r.budget) || 0), 0);
  const totalActual = activeRows.reduce((acc, r) => acc + (Number(r.actual) || 0), 0);
  const netVariance = totalBudget - totalActual; // Positive = savings (وفر), Negative = deficit (عجز)
  const savingsRate = totalBudget > 0 ? ((netVariance / totalBudget) * 100).toFixed(1) : 0;

  const currentMonthName = RAWDA_MONTHS.find((m) => m.id === selectedMonth)?.nameAr || 'المحدد';

  const kpiCards = [
    {
      label: `الموازنة التقديرية (شهر ${currentMonthName})`,
      value: `${totalBudget.toLocaleString()} دج`,
      icon: PieChart,
      subtext: `مجموع المستحقات المخططة لموسم ${selectedYear}`,
      change: 'مخطط',
      isPositive: true,
    },
    {
      label: 'المصروف الحقيقي الفعلي',
      value: `${totalActual.toLocaleString()} دج`,
      icon: TrendingUp,
      subtext: 'إجمالي المنصرف والمسدد بفواتير',
      change: totalActual <= totalBudget ? 'ضمن الحدود' : 'تجاوز للموازنة',
      isPositive: totalActual <= totalBudget,
    },
    {
      label: 'صافي الفارق (وفر / عجز)',
      value: `${Math.abs(netVariance).toLocaleString()} دج`,
      icon: netVariance >= 0 ? CheckCircle : AlertTriangle,
      subtext: netVariance >= 0 ? 'وفر مالي محقق لصالح الخزينة' : 'عجز في المصاريف يستلزم ترشيداً',
      change: netVariance >= 0 ? `+${savingsRate}% وفر` : `${savingsRate}% عجز`,
      isPositive: netVariance >= 0,
    },
    {
      label: 'معدل الالتزام بالموازنة',
      value: `${totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0}%`,
      icon: TrendingDown,
      subtext: 'نسبة التنفيذ من السقف المالي',
      change: 'مراقب بدقة',
      isPositive: totalActual <= totalBudget,
    },
  ];

  // Right click trigger
  const handleContextMenu = (e, row) => {
    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 220;
    const menuHeight = 200;
    const x = e.clientX + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 10 : e.clientX;
    const y = e.clientY + menuHeight > window.innerHeight ? window.innerHeight - menuHeight - 10 : e.clientY;

    setContextMenu({ x, y, row });
  };

  // Inline cell edit handlers
  const startInlineEdit = (id, field, initialVal) => {
    setInlineEdit({ id, field });
    setInlineVal(String(initialVal ?? ''));
  };

  const commitInlineEdit = () => {
    if (!inlineEdit) return;
    const { id, field } = inlineEdit;

    setMonthlyVarianceData((prev) => {
      const yearObj = { ...(prev[selectedYear] || {}) };
      const currentMonthRows = [...(yearObj[selectedMonth] || [])];

      const updatedRows = currentMonthRows.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r };
        if (field === 'variableFactor') {
          updated.variableFactor = inlineVal.trim() || updated.variableFactor;
        } else if (field === 'budget') {
          updated.budget = Math.max(0, parseFloat(inlineVal) || 0);
        } else if (field === 'actual') {
          updated.actual = Math.max(0, parseFloat(inlineVal) || 0);
        } else if (field === 'category') {
          updated.category = inlineVal.trim() || updated.category;
        }
        return updated;
      });

      yearObj[selectedMonth] = updatedRows;
      return { ...prev, [selectedYear]: yearObj };
    });

    setInlineEdit(null);
    setInlineVal('');
  };

  // Action: Save Full Edit
  const handleSaveFullEdit = (e) => {
    e.preventDefault();
    if (!editingRow) return;

    setMonthlyVarianceData((prev) => {
      const yearObj = { ...(prev[selectedYear] || {}) };
      const currentMonthRows = [...(yearObj[selectedMonth] || [])];

      const updatedRows = currentMonthRows.map((r) =>
        r.id === editingRow.id
          ? {
              ...editingRow,
              budget: Math.max(0, parseFloat(editingRow.budget) || 0),
              actual: Math.max(0, parseFloat(editingRow.actual) || 0),
            }
          : r
      );

      yearObj[selectedMonth] = updatedRows;
      return { ...prev, [selectedYear]: yearObj };
    });

    setEditingRow(null);
  };

  // Action: Add New Row to current month
  const handleAddRowSubmit = (e) => {
    e.preventDefault();
    if (!newRowData.category.trim()) return;

    const newRow = {
      id: `${selectedYear}-${selectedMonth}-custom-${Date.now()}`,
      group: 'CUSTOM',
      periodLabel: newRowData.periodLabel || `شهر ${currentMonthName}`,
      category: newRowData.category.trim(),
      variableFactor: newRowData.variableFactor.trim() || '-',
      budget: Math.max(0, parseFloat(newRowData.budget) || 0),
      actual: Math.max(0, parseFloat(newRowData.actual) || 0),
    };

    setMonthlyVarianceData((prev) => {
      const yearObj = { ...(prev[selectedYear] || {}) };
      const currentMonthRows = [...(yearObj[selectedMonth] || [])];
      yearObj[selectedMonth] = [...currentMonthRows, newRow];
      return { ...prev, [selectedYear]: yearObj };
    });

    setIsAddRowModalOpen(false);
    setNewRowData({
      periodLabel: 'الأسبوع 1',
      category: '',
      variableFactor: '',
      budget: '',
      actual: '',
    });
  };

  // CSV Export Utility
  const handleExportCSV = () => {
    try {
      const headers = ['الفترة', 'البند / التعيين', 'المتغير / الكمية', 'المبلغ المستحق (دج)', 'المبلغ الحقيقي (دج)', 'الباقي (دج)', 'الوضعية'];
      const rows = [headers.join(',')];

      activeRows.forEach((r) => {
        const diff = (r.budget || 0) - (r.actual || 0);
        const row = [
          `"${r.periodLabel}"`,
          `"${r.category}"`,
          `"${r.variableFactor}"`,
          r.budget,
          r.actual,
          diff,
          diff >= 0 ? '"وفر"' : '"عجز"',
        ];
        rows.push(row.join(','));
      });

      const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `تحليل_الموازنة_${selectedYear}_${selectedMonth}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export CSV error', err);
    }
  };

  return (
    <div className="space-y-2.5 print:p-0">
      {/* 1. COMPACT TOP HEADER BAR (Eliminates bulky banner to save screen real estate) */}
      <div className="bg-white border border-slate-200 px-3 py-2 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-blue-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                ملخص المصاريف وتحليل الموازنة
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                الرقابة والموازنة
              </span>
              {/* Exclamation / Info Button triggering Guide Modal */}
              <button
                onClick={() => setIsInfoModalOpen(true)}
                className="w-5 h-5 rounded-full bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-900 flex items-center justify-center transition-colors"
                title="معلومات وتفاصيل الموازنة وبنود الرقابة"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              مقارنة تحليلية للموازنة التقديرية والمصروف الفعلي لبنود الروضة مع احتساب فوارق الوفر والعجز وتعديل المتغيرات.
            </p>
          </div>
        </div>

        {/* Multi-Year Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 px-2 py-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-blue-900" />
            <span className="font-semibold text-slate-700 text-[11px] hidden md:inline">الموسم:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent font-mono font-bold text-slate-900 text-xs focus:outline-none cursor-pointer"
            >
              <option value="2024-2025">2024 - 2025</option>
              <option value="2025-2026">2025 - 2026 (الحالي)</option>
              <option value="2026-2027">2026 - 2027</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. COMPACT 4 KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 print:hidden">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon || PieChart;
          return (
            <div
              key={idx}
              className="bg-white border border-slate-200 px-3 py-2 flex flex-col justify-between shadow-2xs hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center justify-between text-slate-500 mb-0.5">
                <span className="text-[11px] font-medium text-slate-600 truncate">{card.label}</span>
                <Icon className="w-3.5 h-3.5 text-blue-900 shrink-0" />
              </div>
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-base sm:text-lg font-bold font-mono text-slate-900 tracking-tight">
                  {card.value}
                </span>
                {card.change && (
                  <span
                    className={`text-[9px] font-medium font-mono px-1 py-0.2 rounded-[2px] ${
                      card.isPositive !== false
                        ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                        : 'text-rose-700 bg-rose-50 border border-rose-200'
                    }`}
                  >
                    {card.change}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. COMPACT TOOLBAR DIRECTLY ABOVE TABLE */}
      <div className="bg-white border border-slate-200 px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs print:hidden">
        {/* Right: 11-Month Selector Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-2xl py-0.5 scrollbar-thin">
          <span className="text-[11px] font-bold text-slate-500 me-1 hidden sm:inline">الشهر:</span>
          {RAWDA_MONTHS.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMonth(m.id)}
              className={`h-7 px-2.5 text-xs font-semibold shrink-0 border transition-colors ${
                selectedMonth === m.id
                  ? 'bg-blue-900 text-white border-blue-900 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {m.nameAr}
            </button>
          ))}
        </div>

        {/* Left: Icon-only actions */}
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 text-[11px] font-bold bg-slate-100 border border-slate-300 text-slate-700">
            مصاريف شهر {currentMonthName}
          </span>

          {/* Add Row Button (Icon-only with tooltip) */}
          <button
            onClick={() => setIsAddRowModalOpen(true)}
            className="w-7 h-7 bg-blue-900 hover:bg-blue-800 text-white flex items-center justify-center transition-colors shadow-2xs"
            title="+ إضافة بند مالي مخصص للشهر"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Export CSV Button (Icon-only with tooltip) */}
          <button
            onClick={handleExportCSV}
            className="w-7 h-7 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 flex items-center justify-center transition-colors"
            title="تصدير جدول الموازنة كـ CSV"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Print Button (Icon-only with tooltip) */}
          <button
            onClick={() => window.print()}
            className="w-7 h-7 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 flex items-center justify-center transition-colors"
            title="طباعة الجدول الحالي"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. HIGH-DENSITY VARIANCE ANALYSIS TABLE (Matching exact user specification) */}
      <div className="bg-white border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-2 bg-slate-100 border-b border-slate-300 flex items-center justify-between">
          <h2 className="font-bold text-xs sm:text-sm text-blue-950">
            مصاريف شهر {currentMonthName} ({selectedYear})
          </h2>
          <span className="text-[11px] text-slate-500">
            اضغط بالزر الأيمن على أي سطر للتعديل السريع، أو اضغط على الخانات للتعديل الفوري
          </span>
        </div>

        <div className="overflow-x-auto max-h-[620px]">
          <table className="w-full text-start text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-300 text-slate-700 font-bold select-none text-[11px]">
              <tr>
                <th className="p-2 text-start border-e border-slate-200 min-w-[120px]">الفترة</th>
                <th className="p-2 text-start border-e border-slate-200 min-w-[200px]">التعيين / بند النفقة</th>
                <th className="p-2 text-start border-e border-slate-200 min-w-[220px]">المتغير (الكمية / البيان)</th>
                <th className="p-2 text-end border-e border-slate-200 min-w-[130px]">المبلغ المستحق (دج)</th>
                <th className="p-2 text-end border-e border-slate-200 min-w-[130px]">المبلغ الحقيقي (دج)</th>
                <th className="p-2 text-end border-e border-slate-200 min-w-[130px]">الباقي (دج)</th>
                <th className="p-2 text-center min-w-[80px] print:hidden">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800 font-sans text-xs">
              {activeRows.map((row, idx) => {
                const diff = (row.budget || 0) - (row.actual || 0);
                const isSavings = diff >= 0;

                const isEditingVar = inlineEdit?.id === row.id && inlineEdit?.field === 'variableFactor';
                const isEditingBudget = inlineEdit?.id === row.id && inlineEdit?.field === 'budget';
                const isEditingActual = inlineEdit?.id === row.id && inlineEdit?.field === 'actual';

                // Distinguish group separators visually
                const isNewGroup = idx === 0 || row.periodLabel !== activeRows[idx - 1].periodLabel;

                return (
                  <tr
                    key={row.id}
                    onContextMenu={(e) => handleContextMenu(e, row)}
                    className={`hover:bg-blue-50/50 transition-colors h-8 ${
                      isNewGroup ? 'border-t-2 border-slate-300' : ''
                    }`}
                  >
                    {/* Period Label (e.g. شهر جوان, الاسبوع 1, الاسبوع 2...) */}
                    <td className="p-1.5 border-e border-slate-200 font-bold text-slate-700 bg-slate-50/60 text-[11px]">
                      {row.periodLabel}
                    </td>

                    {/* Category Name */}
                    <td className="p-1.5 border-e border-slate-200 font-semibold text-slate-900">
                      {row.category}
                    </td>

                    {/* Variable Factor (Inline editable on click) */}
                    <td
                      className="p-1.5 border-e border-slate-200 cursor-pointer text-slate-600"
                      onClick={() => startInlineEdit(row.id, 'variableFactor', row.variableFactor)}
                    >
                      {isEditingVar ? (
                        <input
                          autoFocus
                          type="text"
                          value={inlineVal}
                          onChange={(e) => setInlineVal(e.target.value)}
                          onBlur={commitInlineEdit}
                          onKeyDown={(e) => e.key === 'Enter' && commitInlineEdit()}
                          className="w-full text-xs p-0.5 border border-blue-600 bg-white"
                        />
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="truncate">{row.variableFactor || '-'}</span>
                          <Edit2 className="w-2.5 h-2.5 text-slate-300 hover:text-blue-900 ms-1 shrink-0 opacity-0 group-hover:opacity-100" />
                        </div>
                      )}
                    </td>

                    {/* Due / Budget Amount (Inline editable) */}
                    <td
                      className="p-1.5 text-end border-e border-slate-200 font-mono font-medium text-slate-900 cursor-pointer"
                      onClick={() => startInlineEdit(row.id, 'budget', row.budget)}
                    >
                      {isEditingBudget ? (
                        <input
                          autoFocus
                          type="number"
                          value={inlineVal}
                          onChange={(e) => setInlineVal(e.target.value)}
                          onBlur={commitInlineEdit}
                          onKeyDown={(e) => e.key === 'Enter' && commitInlineEdit()}
                          className="w-24 text-end text-xs p-0.5 border border-blue-600 bg-white font-mono"
                        />
                      ) : (
                        <span>{Number(row.budget || 0).toLocaleString()}</span>
                      )}
                    </td>

                    {/* Actual Spent Amount (Inline editable) */}
                    <td
                      className="p-1.5 text-end border-e border-slate-200 font-mono font-medium text-slate-900 cursor-pointer"
                      onClick={() => startInlineEdit(row.id, 'actual', row.actual)}
                    >
                      {isEditingActual ? (
                        <input
                          autoFocus
                          type="number"
                          value={inlineVal}
                          onChange={(e) => setInlineVal(e.target.value)}
                          onBlur={commitInlineEdit}
                          onKeyDown={(e) => e.key === 'Enter' && commitInlineEdit()}
                          className="w-24 text-end text-xs p-0.5 border border-blue-600 bg-white font-mono"
                        />
                      ) : (
                        <span>{Number(row.actual || 0).toLocaleString()}</span>
                      )}
                    </td>

                    {/* Remaining Balance (Surplus / Deficit calculation) */}
                    <td className="p-1.5 text-end border-e border-slate-200 font-mono font-bold text-xs">
                      <span className={isSavings ? 'text-emerald-700' : 'text-rose-700'}>
                        {isSavings ? '+' : ''}
                        {diff.toLocaleString()} دج
                      </span>
                    </td>

                    {/* Action */}
                    <td className="p-1 text-center print:hidden">
                      <button
                        onClick={() => setEditingRow({ ...row })}
                        className="p-1 text-slate-400 hover:text-blue-900 hover:bg-blue-50 transition-colors"
                        title="تعديل تفاصيل البند"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Total Footer Row (المجموع: - | - | -) */}
            <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-xs select-none">
              <tr className="h-9">
                <td colSpan={3} className="p-2 text-start border-e border-slate-200 font-bold text-slate-900">
                  المجموع العام لشهر {currentMonthName} ({selectedYear})
                </td>
                <td className="p-2 text-end border-e border-slate-200 font-mono text-sm text-slate-900 font-bold">
                  {totalBudget.toLocaleString()} دج
                </td>
                <td className="p-2 text-end border-e border-slate-200 font-mono text-sm text-slate-900 font-bold">
                  {totalActual.toLocaleString()} دج
                </td>
                <td className="p-2 text-end border-e border-slate-200 font-mono text-sm font-bold">
                  <span className={netVariance >= 0 ? 'text-emerald-800' : 'text-rose-800'}>
                    {netVariance >= 0 ? '+' : ''}
                    {netVariance.toLocaleString()} دج
                  </span>
                </td>
                <td className="p-2 text-center text-[11px] text-slate-500 font-normal">
                  {netVariance >= 0 ? 'وفر صافي' : 'عجز إجمالي'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 5. RIGHT-CLICK CONTEXT MENU */}
      {contextMenu && (
        <div
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 bg-white border border-slate-300 shadow-xl py-1 text-xs text-slate-800 w-56 animate-in fade-in select-none"
        >
          <div className="px-3 py-1 bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-700 truncate">
            {contextMenu.row?.category} ({contextMenu.row?.periodLabel})
          </div>

          <button
            onClick={() => {
              setEditingRow({ ...contextMenu.row });
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-slate-700"
          >
            <Edit2 className="w-3.5 h-3.5 text-blue-900" />
            <span>تعديل الموازنة والمصروف الحقيقي</span>
          </button>

          <button
            onClick={() => {
              startInlineEdit(contextMenu.row.id, 'variableFactor', contextMenu.row.variableFactor);
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-slate-700"
          >
            <Coins className="w-3.5 h-3.5 text-slate-500" />
            <span>تعديل بيان المتغير</span>
          </button>

          <button
            onClick={() => {
              const diff = (contextMenu.row.budget || 0) - (contextMenu.row.actual || 0);
              const rowStr = `${contextMenu.row.periodLabel}\t${contextMenu.row.category}\t${contextMenu.row.variableFactor}\t${contextMenu.row.budget}\t${contextMenu.row.actual}\t${diff}`;
              navigator.clipboard.writeText(rowStr);
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-slate-700"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>نسخ بيانات السطر (Excel / TSV)</span>
          </button>
        </div>
      )}

      {/* 6. EDIT ROW MODAL */}
      {editingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-3 bg-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-300" />
                <span className="font-bold text-xs tracking-wide">
                  تعديل بند: {editingRow.category} ({editingRow.periodLabel})
                </span>
              </div>
              <button onClick={() => setEditingRow(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFullEdit} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">المتغير (الكمية / التحديد) *</label>
                <input
                  type="text"
                  required
                  value={editingRow.variableFactor}
                  onChange={(e) => setEditingRow({ ...editingRow, variableFactor: e.target.value })}
                  className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">المبلغ المستحق المخطط (دج) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingRow.budget}
                    onChange={(e) => setEditingRow({ ...editingRow, budget: e.target.value })}
                    className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">المبلغ الحقيقي المنفذ (دج) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingRow.actual}
                    onChange={(e) => setEditingRow({ ...editingRow, actual: e.target.value })}
                    className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-2 border border-slate-200 text-slate-600">
                <span className="text-[11px] block">الفارق المتوقع:</span>
                <span className={`font-mono font-bold text-sm ${((Number(editingRow.budget) || 0) - (Number(editingRow.actual) || 0)) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {((Number(editingRow.budget) || 0) - (Number(editingRow.actual) || 0)).toLocaleString()} دج
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRow(null)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-600 hover:bg-slate-100 font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold shadow-2xs"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. ADD NEW ROW MODAL */}
      {isAddRowModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-3 bg-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-300" />
                <span className="font-bold text-xs tracking-wide">
                  إضافة بند موازنة لشهر {currentMonthName}
                </span>
              </div>
              <button onClick={() => setIsAddRowModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRowSubmit} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">الفترة / الأسبوع *</label>
                <select
                  value={newRowData.periodLabel}
                  onChange={(e) => setNewRowData({ ...newRowData, periodLabel: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                >
                  <option value={`شهر ${currentMonthName}`}>شهر {currentMonthName} (شامل)</option>
                  <option value="الاسبوع 1">الاسبوع 1</option>
                  <option value="الاسبوع 2">الاسبوع 2</option>
                  <option value="الاسبوع 3">الاسبوع 3</option>
                  <option value="الاسبوع 4">الاسبوع 4</option>
                  <option value="الأسبوع 5">الأسبوع 5</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">اسم البند / التعيين *</label>
                <input
                  type="text"
                  required
                  value={newRowData.category}
                  onChange={(e) => setNewRowData({ ...newRowData, category: e.target.value })}
                  placeholder="مثال: لحوم ودواجن إضافية"
                  className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">المتغير (الكمية / الوصف)</label>
                <input
                  type="text"
                  value={newRowData.variableFactor}
                  onChange={(e) => setNewRowData({ ...newRowData, variableFactor: e.target.value })}
                  placeholder="مثال: 15 كغ لحم طازج"
                  className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">المبلغ المستحق (دج) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newRowData.budget}
                    onChange={(e) => setNewRowData({ ...newRowData, budget: e.target.value })}
                    placeholder="10000"
                    className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">المبلغ الحقيقي (دج) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newRowData.actual}
                    onChange={(e) => setNewRowData({ ...newRowData, actual: e.target.value })}
                    placeholder="9500"
                    className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddRowModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-300 text-slate-600 hover:bg-slate-100 font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold shadow-2xs"
                >
                  إضافة البند
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. INFORMATION & GUIDE MODAL */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-3 bg-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-300" />
                <span className="font-bold text-xs tracking-wide">دليل ملخص المصاريف وتحليل الموازنة</span>
              </div>
              <button onClick={() => setIsInfoModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs text-slate-700 leading-relaxed max-h-[75vh] overflow-y-auto">
              <div className="bg-blue-50 border border-blue-200 p-2.5 text-blue-950">
                <h4 className="font-bold mb-1">روضة وحضانة الأطفال العباقرة — الرقابة والموازنة</h4>
                <p className="text-[11px] text-blue-900">
                  مقارنة محاسبية تحليلية بين الموازنة التقديرية المخططة والمصاريف الحقيقية المنفذة لبنود الروضة مع احتساب فوارق الوفر والعجز تلقائياً.
                </p>
              </div>

              <div>
                <h5 className="font-bold text-slate-900 mb-1">هيكلية الجدول المحاسبي المعتمدة:</h5>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 ps-1">
                  <li><strong>بنود الشهر الإجمالية:</strong> حفاظات ومواد التنظيف، المصروف اليومي، مواد جافة، الخبز.</li>
                  <li><strong>بنود التموين الأسبوعية (الأسابيع 1 إلى 5):</strong> خضر وفواكه طازجة، ياوغورت وألبان للأطفال.</li>
                  <li><strong>حساب الفارق (الباقي):</strong> ناتج طرح (المستحق التقديري - الحقيقي الفعلي). يُلوّن بالأخضر عند وجود وفر وبالأحمر عند العجز.</li>
                  <li><strong>المتغير:</strong> حقل مرن لتوثيق كميات الاستهلاك، الكراتين، والأوزان المعتمدة لكل شهر.</li>
                </ul>
              </div>
            </div>

            <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs"
              >
                فهمت ذلك
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
