import React, { useState, useMemo, useEffect } from 'react';
import {
  Coins,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  Plus,
  Calendar,
  X,
  Edit2,
  Trash2,
  Download,
  Printer,
  Search,
  Info,
  HelpCircle,
  Copy,
  Receipt,
  FileText,
  Check,
} from 'lucide-react';
import { MOCK_RAWDA_CASH_DRAWER, RAWDA_MONTHS } from '../../../mock/rawdaMockData';

export function RawdaCashDrawerView() {
  const [selectedYear, setSelectedYear] = useState('2025-2026');
  const [selectedMonth, setSelectedMonth] = useState('feb');
  const [searchTerm, setSearchTerm] = useState('');

  // Comprehensive multi-year daily cash drawer dataset
  const [drawerRecords, setDrawerRecords] = useState(() => {
    const data = [];
    ['2024-2025', '2025-2026', '2026-2027'].forEach((yr) => {
      RAWDA_MONTHS.forEach((m, mIdx) => {
        // 5 to 7 operational days per month
        const days = [2, 5, 9, 12, 16, 20, 24];
        let runningBalance = 15000;

        days.forEach((dayNum, dIdx) => {
          const dayStr = String(dayNum).padStart(2, '0');
          const monthNum = String(mIdx < 4 ? mIdx + 9 : mIdx - 3).padStart(2, '0');
          const yearNum = yr.split('-')[mIdx < 4 ? 0 : 1];
          const date = `${yearNum}-${monthNum}-${dayStr}`;

          const income = 12000 + (dIdx * 3500) + (mIdx * 800);
          const expenses = 4000 + (dIdx * 1100);
          const delivered = (dIdx === 2 || dIdx === 5) ? 20000 : 0;
          const open = runningBalance;
          const finalBal = open + income - expenses - delivered;
          runningBalance = finalBal;

          data.push({
            id: `drw-${yr}-${m.id}-${dIdx + 1}`,
            academicYear: yr,
            month: m.id,
            date,
            openingBalance: open,
            income,
            expenses,
            delivered,
            finalBalance: finalBal,
            isClosed: true,
            notes: delivered > 0 ? `تم تسليم عهدة نقدية بقيمة ${delivered.toLocaleString()} دج للإدارة` : 'يوم عمل عادي',
          });
        });
      });
    });
    return data;
  });

  // Modals state
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [reconciliationPreview, setReconciliationPreview] = useState(null);

  // Inline Cell Editing State
  const [inlineEdit, setInlineEdit] = useState(null); // { id, field }
  const [inlineVal, setInlineVal] = useState('');

  // Right-Click Context Menu State
  const [contextMenu, setContextMenu] = useState(null); // { x, y, record }

  // New record form
  const [newRecord, setNewRecord] = useState({
    date: new Date().toISOString().split('T')[0],
    openingBalance: '15000',
    income: '',
    expenses: '',
    delivered: '',
    notes: '',
  });

  // Close context menu on click outside
  useEffect(() => {
    const handleOutsideClick = () => setContextMenu(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Filtered by year and month
  const yearRecords = useMemo(() => {
    return drawerRecords.filter((r) => r.academicYear === selectedYear);
  }, [drawerRecords, selectedYear]);

  const monthRecords = useMemo(() => {
    if (selectedMonth === 'ALL') return yearRecords;
    return yearRecords.filter((r) => r.month === selectedMonth);
  }, [yearRecords, selectedMonth]);

  const filteredRecords = useMemo(() => {
    return monthRecords.filter((r) => {
      return (
        !searchTerm ||
        r.date.includes(searchTerm) ||
        (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
  }, [monthRecords, searchTerm]);

  // 1. KPI Calculations
  const latestRecord = filteredRecords[filteredRecords.length - 1] || {};
  const currentCashInDrawer = latestRecord.finalBalance || (filteredRecords.length > 0 ? filteredRecords[filteredRecords.length - 1].finalBalance : 0);
  const totalIncomeAll = filteredRecords.reduce((acc, r) => acc + Number(r.income || 0), 0);
  const totalExpensesAll = filteredRecords.reduce((acc, r) => acc + Number(r.expenses || 0), 0);
  const totalDeliveredAll = filteredRecords.reduce((acc, r) => acc + Number(r.delivered || 0), 0);

  const currentMonthObj = RAWDA_MONTHS.find((m) => m.id === selectedMonth);
  const currentMonthName = currentMonthObj ? currentMonthObj.nameAr : 'كافة الشهور';

  const kpiCards = [
    {
      label: 'الرصيد المرحل بالصندوق',
      value: `${currentCashInDrawer.toLocaleString()} دج`,
      icon: Coins,
      subtext: `رصيد ختام المعاملات (${currentMonthName})`,
      change: 'مطابق ومرحل ✓',
      isPositive: true,
    },
    {
      label: 'إجمالي المداخيل المقبوضة',
      value: `${totalIncomeAll.toLocaleString()} دج`,
      icon: ArrowDownRight,
      subtext: 'حقوق التسجيل والاشتراكات النقدية',
      change: '+100% نقداً',
      isPositive: true,
    },
    {
      label: 'إجمالي المصاريف المقتطعة',
      value: `${totalExpensesAll.toLocaleString()} دج`,
      icon: ArrowUpRight,
      subtext: 'مشتريات ونفقات المطبخ والروضة',
      change: 'مسندة بفواتير',
      isPositive: false,
    },
    {
      label: 'السيولة المسلّمة للإدارة',
      value: `${totalDeliveredAll.toLocaleString()} دج`,
      icon: ShieldCheck,
      subtext: 'محولة ومودعة بالخزينة المركزية',
      change: 'محولة بالكامل',
      isPositive: true,
    },
  ];

  // Right-click trigger
  const handleContextMenu = (e, record) => {
    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 230;
    const menuHeight = 220;
    const x = e.clientX + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 10 : e.clientX;
    const y = e.clientY + menuHeight > window.innerHeight ? window.innerHeight - menuHeight - 10 : e.clientY;

    setContextMenu({ x, y, record });
  };

  // Inline cell edit handlers
  const startInlineEdit = (id, field, currentVal) => {
    setInlineEdit({ id, field });
    setInlineEditVal(String(currentVal ?? ''));
  };

  const commitInlineEdit = () => {
    if (!inlineEdit) return;
    const { id, field } = inlineEdit;

    setDrawerRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r };
        const num = Math.max(0, parseFloat(inlineVal) || 0);

        if (field === 'openingBalance') updated.openingBalance = num;
        else if (field === 'income') updated.income = num;
        else if (field === 'expenses') updated.expenses = num;
        else if (field === 'delivered') updated.delivered = num;
        else if (field === 'date') updated.date = inlineVal || updated.date;
        else if (field === 'notes') updated.notes = inlineVal.trim() || updated.notes;

        // Auto recalculate closing balance
        updated.finalBalance = (updated.openingBalance || 0) + (updated.income || 0) - (updated.expenses || 0) - (updated.delivered || 0);
        return updated;
      })
    );

    setInlineEdit(null);
    setInlineEditVal('');
  };

  // Action: Add Record
  const handleAddRecordSubmit = (e) => {
    e.preventDefault();
    const open = Number(newRecord.openingBalance) || 0;
    const inc = Number(newRecord.income) || 0;
    const exp = Number(newRecord.expenses) || 0;
    const del = Number(newRecord.delivered) || 0;
    const finalBal = open + inc - exp - del;

    const dateObj = new Date(newRecord.date);
    const monthIndex = dateObj.getMonth();
    const monthMapping = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const targetMonthId = monthMapping[monthIndex] || selectedMonth || 'feb';

    const entry = {
      id: `drw-${selectedYear}-${targetMonthId}-${Date.now()}`,
      academicYear: selectedYear,
      month: targetMonthId,
      date: newRecord.date,
      openingBalance: open,
      income: inc,
      expenses: exp,
      delivered: del,
      finalBalance: finalBal,
      isClosed: true,
      notes: newRecord.notes.trim() || (del > 0 ? `تسليم سيولة بقيمة ${del.toLocaleString()} دج` : 'مطابقة يومية'),
    };

    setDrawerRecords([entry, ...drawerRecords]);
    setIsAddModalOpen(false);
    setNewRecord({
      date: new Date().toISOString().split('T')[0],
      openingBalance: String(finalBal),
      income: '',
      expenses: '',
      delivered: '',
      notes: '',
    });
  };

  // Action: Save Full Edit
  const handleSaveFullEdit = (e) => {
    e.preventDefault();
    if (!editingRecord) return;

    setDrawerRecords((prev) =>
      prev.map((r) => {
        if (r.id !== editingRecord.id) return r;
        const open = Number(editingRecord.openingBalance) || 0;
        const inc = Number(editingRecord.income) || 0;
        const exp = Number(editingRecord.expenses) || 0;
        const del = Number(editingRecord.delivered) || 0;
        return {
          ...editingRecord,
          openingBalance: open,
          income: inc,
          expenses: exp,
          delivered: del,
          finalBalance: open + inc - exp - del,
        };
      })
    );

    setEditingRecord(null);
  };

  // CSV Export
  const handleExportCSV = () => {
    try {
      const headers = ['التاريخ', 'الموسم', 'الشهر', 'رصيد الافتتاح (دج)', 'المداخيل (دج)', 'المصاريف (دج)', 'المسلم للإدارة (دج)', 'الرصيد الختامي (دج)', 'ملاحظات'];
      const rows = [headers.join(',')];

      filteredRecords.forEach((r) => {
        const row = [
          `"${r.date}"`,
          `"${r.academicYear}"`,
          `"${r.month}"`,
          r.openingBalance,
          r.income,
          r.expenses,
          r.delivered,
          r.finalBalance,
          `"${r.notes || ''}"`,
        ];
        rows.push(row.join(','));
      });

      const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `الملخص_اليومي_للصندوق_${selectedYear}_${selectedMonth}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export CSV error', err);
    }
  };

  return (
    <div className="space-y-2.5 print:p-0">
      {/* 1. COMPACT TOP HEADER BAR */}
      <div className="bg-white border border-slate-200 px-3 py-2 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-blue-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                الملخص اليومي للصندوق
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                حركة الخزينة والسيولة
              </span>
              {/* Info Button */}
              <button
                onClick={() => setIsInfoModalOpen(true)}
                className="w-5 h-5 rounded-full bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-900 flex items-center justify-center transition-colors"
                title="معلومات وتفاصيل مطابقة الصندوق اليومي"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              مطابقة حركة الصندوق والسيولة نهاية كل يوم عمل، تسجيل المداخيل والمصاريف والمسلم وترحيل الأرصدة تلقائياً.
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
          const Icon = card.icon || Coins;
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
                  <span className="text-[9px] font-medium font-mono px-1 py-0.2 rounded-[2px] text-emerald-700 bg-emerald-50 border border-emerald-200">
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
        {/* Months Quick Filters */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-2xl py-0.5 scrollbar-thin">
          <button
            onClick={() => setSelectedMonth('ALL')}
            className={`h-7 px-2 text-[11px] font-bold shrink-0 border transition-colors ${
              selectedMonth === 'ALL'
                ? 'bg-blue-900 text-white border-blue-900 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            كافة الشهور
          </button>
          {RAWDA_MONTHS.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMonth(m.id)}
              className={`h-7 px-2 text-[11px] font-medium shrink-0 border transition-colors ${
                selectedMonth === m.id
                  ? 'bg-blue-900 text-white border-blue-900 shadow-2xs font-bold'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {m.nameAr}
            </button>
          ))}
        </div>

        {/* Actions & Search */}
        <div className="flex items-center gap-1.5">
          <div className="relative w-44 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute inset-y-0 start-2.5 my-auto text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث في التاريخ والملاحظات..."
              className="w-full h-7 ps-8 pe-2 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-900 focus:outline-none transition-colors"
            />
          </div>

          <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-slate-100 border border-slate-300 text-slate-700">
            {filteredRecords.length} يوم
          </span>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-7 h-7 bg-blue-900 hover:bg-blue-800 text-white flex items-center justify-center transition-colors shadow-2xs"
            title="+ إضافة يومية صندوق جديدة"
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportCSV}
            className="w-7 h-7 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 flex items-center justify-center transition-colors"
            title="تصدير السجل كـ CSV"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => window.print()}
            className="w-7 h-7 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 flex items-center justify-center transition-colors"
            title="طباعة الجدول الحالي"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. RECONCILIATION DATA TABLE WITH MONTHLY & GRAND TOTALS */}
      <div className="bg-white border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto max-h-[620px]">
          <table className="w-full text-start text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-300 text-slate-700 font-bold select-none text-[11px]">
              <tr>
                <th className="p-1.5 text-center border-e border-slate-200 w-10">#</th>
                <th className="p-1.5 text-start border-e border-slate-200 min-w-[95px]">التاريخ</th>
                <th className="p-1.5 text-end border-e border-slate-200 min-w-[110px]">الرصيد الافتتاحي (دج)</th>
                <th className="p-1.5 text-end border-e border-slate-200 min-w-[110px]">المداخيل (دج)</th>
                <th className="p-1.5 text-end border-e border-slate-200 min-w-[110px]">المصاريف (دج)</th>
                <th className="p-1.5 text-end border-e border-slate-200 min-w-[110px]">المسلم للإدارة (دج)</th>
                <th className="p-1.5 text-end border-e border-slate-200 min-w-[120px]">الرصيد الختامي (دج)</th>
                <th className="p-1.5 text-start border-e border-slate-200 min-w-[160px]">ملاحظات وبيان العهدة</th>
                <th className="p-1.5 text-center min-w-[80px] print:hidden">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800 font-sans text-xs">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    لا توجد قيود صندوق مسجلة لشهر {currentMonthName} في موسم {selectedYear}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, index) => {
                  const isEditingOpen = inlineEdit?.id === r.id && inlineEdit?.field === 'openingBalance';
                  const isEditingInc = inlineEdit?.id === r.id && inlineEdit?.field === 'income';
                  const isEditingExp = inlineEdit?.id === r.id && inlineEdit?.field === 'expenses';
                  const isEditingDel = inlineEdit?.id === r.id && inlineEdit?.field === 'delivered';

                  return (
                    <tr
                      key={r.id}
                      onContextMenu={(e) => handleContextMenu(e, r)}
                      className="hover:bg-blue-50/50 transition-colors h-8"
                    >
                      <td className="p-1 text-center border-e border-slate-200 font-mono text-slate-400 font-bold">
                        {index + 1}
                      </td>

                      <td className="p-1 border-e border-slate-200 font-mono font-bold text-slate-900">
                        {r.date}
                      </td>

                      {/* Opening Balance */}
                      <td
                        className="p-1 text-end border-e border-slate-200 font-mono cursor-pointer"
                        onClick={() => startInlineEdit(r.id, 'openingBalance', r.openingBalance)}
                      >
                        {isEditingOpen ? (
                          <input
                            autoFocus
                            type="number"
                            value={inlineVal}
                            onChange={(e) => setInlineVal(e.target.value)}
                            onBlur={commitInlineEdit}
                            onKeyDown={(e) => e.key === 'Enter' && commitInlineEdit()}
                            className="w-20 text-end text-xs p-0.5 border border-blue-600 bg-white font-mono"
                          />
                        ) : (
                          <span>{Number(r.openingBalance).toLocaleString()}</span>
                        )}
                      </td>

                      {/* Income */}
                      <td
                        className="p-1 text-end border-e border-slate-200 font-mono font-bold text-emerald-700 cursor-pointer"
                        onClick={() => startInlineEdit(r.id, 'income', r.income)}
                      >
                        {isEditingInc ? (
                          <input
                            autoFocus
                            type="number"
                            value={inlineVal}
                            onChange={(e) => setInlineVal(e.target.value)}
                            onBlur={commitInlineEdit}
                            onKeyDown={(e) => e.key === 'Enter' && commitInlineEdit()}
                            className="w-20 text-end text-xs p-0.5 border border-blue-600 bg-white font-mono"
                          />
                        ) : (
                          <span>+{Number(r.income).toLocaleString()}</span>
                        )}
                      </td>

                      {/* Expenses */}
                      <td
                        className="p-1 text-end border-e border-slate-200 font-mono font-bold text-rose-700 cursor-pointer"
                        onClick={() => startInlineEdit(r.id, 'expenses', r.expenses)}
                      >
                        {isEditingExp ? (
                          <input
                            autoFocus
                            type="number"
                            value={inlineVal}
                            onChange={(e) => setInlineVal(e.target.value)}
                            onBlur={commitInlineEdit}
                            onKeyDown={(e) => e.key === 'Enter' && commitInlineEdit()}
                            className="w-20 text-end text-xs p-0.5 border border-blue-600 bg-white font-mono"
                          />
                        ) : (
                          <span>-{Number(r.expenses).toLocaleString()}</span>
                        )}
                      </td>

                      {/* Delivered */}
                      <td
                        className="p-1 text-end border-e border-slate-200 font-mono font-bold text-blue-900 cursor-pointer"
                        onClick={() => startInlineEdit(r.id, 'delivered', r.delivered)}
                      >
                        {isEditingDel ? (
                          <input
                            autoFocus
                            type="number"
                            value={inlineVal}
                            onChange={(e) => setInlineVal(e.target.value)}
                            onBlur={commitInlineEdit}
                            onKeyDown={(e) => e.key === 'Enter' && commitInlineEdit()}
                            className="w-20 text-end text-xs p-0.5 border border-blue-600 bg-white font-mono"
                          />
                        ) : (
                          <span>{r.delivered > 0 ? `-${Number(r.delivered).toLocaleString()}` : '0'}</span>
                        )}
                      </td>

                      {/* Final Closing Balance */}
                      <td className="p-1 text-end border-e border-slate-200 font-mono font-bold text-slate-900 bg-slate-50/50">
                        {Number(r.finalBalance).toLocaleString()} دج
                      </td>

                      {/* Notes */}
                      <td className="p-1 border-e border-slate-200 text-slate-600 truncate text-[11px]">
                        {r.notes || '-'}
                      </td>

                      {/* Action */}
                      <td className="p-1 text-center print:hidden">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setReconciliationPreview(r)}
                            className="p-1 text-slate-500 hover:text-blue-900 hover:bg-blue-50 transition-colors"
                            title="معاينة سند إغلاق الصندوق"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingRecord({ ...r })}
                            className="p-1 text-slate-500 hover:text-blue-900 hover:bg-blue-50 transition-colors"
                            title="تعديل قيود اليوم"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Total Footer Row */}
            <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-xs select-none">
              <tr className="h-9">
                <td colSpan={3} className="p-2 text-start border-e border-slate-200 font-bold text-slate-900">
                  المجموع العام لشهر ({currentMonthName} - {selectedYear})
                </td>
                <td className="p-2 text-end border-e border-slate-200 font-mono text-sm text-emerald-800 font-bold">
                  +{totalIncomeAll.toLocaleString()} دج
                </td>
                <td className="p-2 text-end border-e border-slate-200 font-mono text-sm text-rose-800 font-bold">
                  -{totalExpensesAll.toLocaleString()} دج
                </td>
                <td className="p-2 text-end border-e border-slate-200 font-mono text-sm text-blue-900 font-bold">
                  -{totalDeliveredAll.toLocaleString()} دج
                </td>
                <td className="p-2 text-end border-e border-slate-200 font-mono text-sm text-slate-900 font-bold">
                  {currentCashInDrawer.toLocaleString()} دج
                </td>
                <td colSpan={2} className="p-2 text-[11px] text-slate-500 font-normal">
                  {filteredRecords.length} أيام عمل مصفاة ومرحلة
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
            يومية: {contextMenu.record?.date}
          </div>

          <button
            onClick={() => {
              setEditingRecord({ ...contextMenu.record });
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-slate-700"
          >
            <Edit2 className="w-3.5 h-3.5 text-blue-900" />
            <span>تعديل قيود الصندوق لليوم</span>
          </button>

          <button
            onClick={() => {
              setReconciliationPreview(contextMenu.record);
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-slate-700"
          >
            <FileText className="w-3.5 h-3.5 text-blue-800" />
            <span>معاينة سند المطابقة اليومية والطباعة</span>
          </button>

          <button
            onClick={() => {
              const r = contextMenu.record;
              const rowStr = `${r.date}\t${r.openingBalance}\t${r.income}\t${r.expenses}\t${r.delivered}\t${r.finalBalance}\t${r.notes}`;
              navigator.clipboard.writeText(rowStr);
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-slate-700"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>نسخ بيانات اليوم كـ TSV</span>
          </button>
        </div>
      )}

      {/* 6. EDIT RECORD MODAL */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-3 bg-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-300" />
                <span className="font-bold text-xs tracking-wide">
                  تعديل يومية الصندوق: {editingRecord.date}
                </span>
              </div>
              <button onClick={() => setEditingRecord(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFullEdit} className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">الرصيد الافتتاحي (دج)</label>
                  <input
                    type="number"
                    required
                    value={editingRecord.openingBalance}
                    onChange={(e) => setEditingRecord({ ...editingRecord, openingBalance: e.target.value })}
                    className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">المداخيل اليومية (دج)</label>
                  <input
                    type="number"
                    required
                    value={editingRecord.income}
                    onChange={(e) => setEditingRecord({ ...editingRecord, income: e.target.value })}
                    className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">المصاريف اليومية (دج)</label>
                  <input
                    type="number"
                    required
                    value={editingRecord.expenses}
                    onChange={(e) => setEditingRecord({ ...editingRecord, expenses: e.target.value })}
                    className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">المبلغ المسلم للإدارة (دج)</label>
                  <input
                    type="number"
                    value={editingRecord.delivered}
                    onChange={(e) => setEditingRecord({ ...editingRecord, delivered: e.target.value })}
                    className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ملاحظات اليومية</label>
                <input
                  type="text"
                  value={editingRecord.notes}
                  onChange={(e) => setEditingRecord({ ...editingRecord, notes: e.target.value })}
                  className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
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

      {/* 7. ADD RECORD MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-3 bg-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-300" />
                <span className="font-bold text-xs tracking-wide">تسجيل يومية صندوق جديدة</span>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRecordSubmit} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">تاريخ اليومية *</label>
                <input
                  type="date"
                  required
                  value={newRecord.date}
                  onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                  className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">الرصيد الافتتاحي (دج) *</label>
                  <input
                    type="number"
                    required
                    value={newRecord.openingBalance}
                    onChange={(e) => setNewRecord({ ...newRecord, openingBalance: e.target.value })}
                    className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">المداخيل اليومية (دج) *</label>
                  <input
                    type="number"
                    required
                    value={newRecord.income}
                    onChange={(e) => setNewRecord({ ...newRecord, income: e.target.value })}
                    placeholder="0"
                    className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">المصاريف اليومية (دج) *</label>
                  <input
                    type="number"
                    required
                    value={newRecord.expenses}
                    onChange={(e) => setNewRecord({ ...newRecord, expenses: e.target.value })}
                    placeholder="0"
                    className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">السيولة المسلمة للإدارة (دج)</label>
                  <input
                    type="number"
                    value={newRecord.delivered}
                    onChange={(e) => setNewRecord({ ...newRecord, delivered: e.target.value })}
                    placeholder="0"
                    className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ملاحظات اليومية</label>
                <input
                  type="text"
                  value={newRecord.notes}
                  onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                  placeholder="ملاحظات أو مراجع وصولات التسليم"
                  className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-300 text-slate-600 hover:bg-slate-100 font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold shadow-2xs"
                >
                  تسجيل اليومية وترحيل الرصيد
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
                <span className="font-bold text-xs tracking-wide">دليل الملخص اليومي للصندوق</span>
              </div>
              <button onClick={() => setIsInfoModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs text-slate-700 leading-relaxed max-h-[75vh] overflow-y-auto">
              <div className="bg-blue-50 border border-blue-200 p-2.5 text-blue-950">
                <h4 className="font-bold mb-1">روضة وحضانة الأطفال العباقرة — حركة الخزينة والسيولة</h4>
                <p className="text-[11px] text-blue-900">
                  الملخص اليومي للصندوق (Rawda Daily Cash Register Reconciliation)
                </p>
              </div>

              <div>
                <h5 className="font-bold text-slate-900 mb-1">المعادلة المحاسبية المعتمدة للترحيل:</h5>
                <div className="p-2 bg-slate-100 font-mono text-[11px] text-slate-800 border border-slate-200">
                  الرصيد الختامي = الرصيد الافتتاحي + المداخيل - المصاريف - المسلم للإدارة
                </div>
              </div>

              <div>
                <h5 className="font-bold text-slate-900 mb-1">الميزات المتاحة:</h5>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 ps-1">
                  <li><strong>المجاميع الشهرية والسنوية:</strong> تجميع شامل لكل شهر عبر الشريط السفلي مع دعم الانتقال بين المواسم.</li>
                  <li><strong>التعديل المباشر:</strong> اضغط على أي خانة رقمية لتحديث قيمتها وإعادة احتساب الرصيد فورياً.</li>
                  <li><strong>الزر الأيمن للفأرة:</strong> يتيح فتح سند التسوية اليومية، التعديل الكامل، أو نسخ البيانات.</li>
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

      {/* 9. PRINTABLE RECONCILIATION PREVIEW MODAL */}
      {reconciliationPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-3 bg-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-300" />
                <span className="font-bold text-xs">سند تسوية ومطابقة الصندوق اليومي</span>
              </div>
              <button onClick={() => setReconciliationPreview(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs bg-white border-b border-slate-200">
              <div className="text-center border-b border-slate-200 pb-2">
                <h3 className="font-bold text-sm text-slate-900">روضة وحضانة الأطفال العباقرة</h3>
                <p className="text-[10px] text-slate-500 font-mono">محضر مطابقة الصندوق اليومي</p>
                <div className="mt-1 font-mono font-bold text-blue-900 text-xs">
                  يوم: {reconciliationPreview.date}
                </div>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">الرصيد الافتتاحي:</span>
                  <span className="font-mono">{Number(reconciliationPreview.openingBalance).toLocaleString()} دج</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">إجمالي المقبوضات (المداخيل):</span>
                  <span className="font-mono font-bold text-emerald-700">+{Number(reconciliationPreview.income).toLocaleString()} دج</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">إجمالي المدفوعات (المصاريف):</span>
                  <span className="font-mono font-bold text-rose-700">-{Number(reconciliationPreview.expenses).toLocaleString()} دج</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">السيولة المسلمة للإدارة:</span>
                  <span className="font-mono font-bold text-blue-900">-{Number(reconciliationPreview.delivered).toLocaleString()} دج</span>
                </div>
                <div className="flex justify-between py-1 border-b-2 border-slate-300 font-bold bg-slate-50 px-1">
                  <span className="text-slate-800">الرصيد المرحل لليوم التالي:</span>
                  <span className="font-mono text-slate-900 text-sm">{Number(reconciliationPreview.finalBalance).toLocaleString()} دج</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 text-center text-[10px] text-slate-500">
                <div className="border-t border-slate-300 pt-1">
                  <span>توقيع أمين الصندوق</span>
                </div>
                <div className="border-t border-slate-300 pt-1">
                  <span>تأشيرة ومصادقة الإدارة</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-100 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة السند</span>
              </button>
              <button
                onClick={() => setReconciliationPreview(null)}
                className="px-3 py-1.5 border border-slate-300 text-slate-600 hover:bg-slate-200 text-xs font-medium"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
