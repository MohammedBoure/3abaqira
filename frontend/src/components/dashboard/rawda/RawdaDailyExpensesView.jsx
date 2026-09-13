import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  Coins,
  Calendar,
  Layers,
  Plus,
  Trash2,
  Edit2,
  X,
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  Info,
  HelpCircle,
  Check,
  Copy,
  Receipt,
  FileText,
  DollarSign,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { MOCK_RAWDA_DAILY_EXPENSES, RAWDA_MONTHS } from '../../../mock/rawdaMockData';

export function RawdaDailyExpensesView() {
  // Pre-seed comprehensive multi-year expenses dataset
  const [expenses, setExpenses] = useState(() => {
    const base = [...MOCK_RAWDA_DAILY_EXPENSES];
    // Seed initial entries for other months if base only has feb
    const sampleItems = [
      { desc: 'شراء منظفات ومعقمات صحية للأفواج', amt: 5200, cat: 'حفاظات ومواد تنظيف' },
      { desc: 'توريد خضر وفواكه طازجة لمطبخ الروضة', amt: 7100, cat: 'خضر وفواكه' },
      { desc: 'فاتورة توريد الخبز اليومي', amt: 2600, cat: 'الخبز' },
      { desc: 'شراء لحم بقري ودجاج طازج للأسبوع', amt: 15800, cat: 'اللحم والدجاج' },
      { desc: 'مشتريات بقالة ومواد جافة (عجائن، سكر، حليب)', amt: 8900, cat: 'مواد جافة' },
      { desc: 'شراء ألبان وياوغورت لوجبات الأطفال', amt: 4800, cat: 'ياوغورت وألبان' },
      { desc: 'صيانة قفل الباب الرئيسي وإنارة القاعة 2', amt: 3200, cat: 'مصاريف صيانة' },
      { desc: 'مستلزمات وأوراق رسم وألوان تربوية', amt: 6400, cat: 'المصروف اليومي' },
    ];

    const allData = [];
    // Generate across 2024-2025, 2025-2026, 2026-2027
    ['2024-2025', '2025-2026', '2026-2027'].forEach((yr) => {
      RAWDA_MONTHS.forEach((m, mIdx) => {
        // 3 to 6 entries per month
        const count = 4 + (mIdx % 3);
        for (let i = 1; i <= count; i++) {
          const sample = sampleItems[(mIdx + i) % sampleItems.length];
          const day = String(2 + i * 4).padStart(2, '0');
          const monthNum = String(mIdx < 4 ? mIdx + 9 : mIdx - 3).padStart(2, '0');
          const yearNum = yr.split('-')[mIdx < 4 ? 0 : 1];
          const date = `${yearNum}-${monthNum}-${day}`;
          const id = `exp-${yr}-${m.id}-${i}`;
          const voucher = `VCH-${yr.slice(2, 4)}-${m.id.toUpperCase()}-${String(i).padStart(3, '0')}`;

          allData.push({
            id,
            academicYear: yr,
            date,
            month: m.id,
            description: sample.desc,
            amount: sample.amt + (i * 250),
            paymentMethod: i % 4 === 0 ? 'شيك بنكي' : 'نقداً (صندوق)',
            voucher,
            category: sample.cat,
          });
        }
      });
    });

    return allData;
  });

  const [selectedYear, setSelectedYear] = useState('2025-2026');
  const [selectedMonth, setSelectedMonth] = useState('feb'); // 'ALL' or month id like 'feb'
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null); // Full edit modal
  const [selectedVoucherPreview, setSelectedVoucherPreview] = useState(null); // Print / Voucher preview

  // Inline Editing State
  const [inlineEditingCell, setInlineEditingCell] = useState(null); // { id, field }
  const [inlineEditVal, setInlineEditVal] = useState('');

  // Right-Click Context Menu State
  const [contextMenu, setContextMenu] = useState(null); // { x, y, expense }

  // Add Expense Form State
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    paymentMethod: 'نقداً (صندوق)',
    category: 'المصروف اليومي',
    voucher: '',
  });

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = () => setContextMenu(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // 1. Year & Month Filtering
  const yearExpenses = useMemo(() => {
    return expenses.filter((e) => e.academicYear === selectedYear);
  }, [expenses, selectedYear]);

  const monthExpenses = useMemo(() => {
    if (selectedMonth === 'ALL') return yearExpenses;
    return yearExpenses.filter((e) => e.month === selectedMonth);
  }, [yearExpenses, selectedMonth]);

  // 2. Search filtering
  const filteredExpenses = useMemo(() => {
    return monthExpenses.filter((e) => {
      const matchSearch =
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.date.includes(searchTerm) ||
        (e.voucher && e.voucher.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.category && e.category.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchSearch;
    });
  }, [monthExpenses, searchTerm]);

  // 3. KPI Calculations
  const totalMonthlyExpense = filteredExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const recordedDaysCount = new Set(filteredExpenses.map((e) => e.date)).size || (filteredExpenses.length > 0 ? 1 : 0);
  const averageDailyExpense = recordedDaysCount > 0 ? Math.round(totalMonthlyExpense / recordedDaysCount) : 0;
  const maxExpenseItem = filteredExpenses.reduce(
    (max, e) => (Number(e.amount) > Number(max.amount || 0) ? e : max),
    { description: 'لا يوجد', amount: 0 }
  );

  const kpiCards = [
    {
      label: 'إجمالي المصروف المعتمد',
      value: `${totalMonthlyExpense.toLocaleString()} دج`,
      icon: TrendingUp,
      subtext: selectedMonth === 'ALL' ? `الموسم الدراسي كامل (${selectedYear})` : `شهر ${RAWDA_MONTHS.find((m) => m.id === selectedMonth)?.nameAr || ''}`,
      change: 'مطابق للصندوق',
      isPositive: true,
    },
    {
      label: 'متوسط الصرف اليومي',
      value: `${averageDailyExpense.toLocaleString()} دج`,
      icon: Coins,
      subtext: `معدل الإنفاق عبر ${recordedDaysCount} أيام مسجلة`,
      change: 'طبيعي',
      isPositive: true,
    },
    {
      label: 'عدد الأيام الموثقة',
      value: `${recordedDaysCount} يوم`,
      icon: Calendar,
      subtext: 'سندات وفواتير يومية مؤكدة',
      change: 'محدث يومياً',
      isPositive: true,
    },
    {
      label: 'أكبر بند صرف بالسجل',
      value: `${Number(maxExpenseItem.amount).toLocaleString()} دج`,
      icon: Layers,
      subtext: maxExpenseItem.description,
      change: 'سند معتمد',
      isPositive: false,
    },
  ];

  // Right-Click Context Menu Trigger
  const handleContextMenu = (e, expense) => {
    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 230;
    const menuHeight = 220;
    const x = e.clientX + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 10 : e.clientX;
    const y = e.clientY + menuHeight > window.innerHeight ? window.innerHeight - menuHeight - 10 : e.clientY;

    setContextMenu({ x, y, expense });
  };

  // Inline cell edit handlers
  const startInlineEdit = (id, field, currentVal) => {
    setInlineEditingCell({ id, field });
    setInlineEditVal(String(currentVal ?? ''));
  };

  const commitInlineEdit = () => {
    if (!inlineEditingCell) return;
    const { id, field } = inlineEditingCell;

    setExpenses((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const updated = { ...e };
        if (field === 'amount') {
          updated.amount = Math.max(0, parseFloat(inlineEditVal) || 0);
        } else if (field === 'description') {
          updated.description = inlineEditVal.trim() || updated.description;
        } else if (field === 'date') {
          updated.date = inlineEditVal || updated.date;
        } else if (field === 'paymentMethod') {
          updated.paymentMethod = inlineEditVal;
        } else if (field === 'voucher') {
          updated.voucher = inlineEditVal.trim() || updated.voucher;
        }
        return updated;
      })
    );

    setInlineEditingCell(null);
    setInlineEditVal('');
  };

  // Action: Add Expense
  const handleAddExpenseSubmit = (e) => {
    e.preventDefault();
    if (!newExpense.description.trim() || !newExpense.amount) return;

    const amt = Math.max(0, parseFloat(newExpense.amount) || 0);
    const dateObj = new Date(newExpense.date);
    const monthIndex = dateObj.getMonth(); // 0-based
    // Map date month to RAWDA_MONTHS (sep is 8, oct is 9, etc.)
    const monthMapping = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const targetMonthId = monthMapping[monthIndex] || selectedMonth || 'feb';

    const voucherNum = newExpense.voucher.trim() || `VCH-${selectedYear.slice(2, 4)}-${targetMonthId.toUpperCase()}-${String(filteredExpenses.length + 1).padStart(3, '0')}`;

    const newEntry = {
      id: `exp-${Date.now()}`,
      academicYear: selectedYear,
      date: newExpense.date,
      month: targetMonthId,
      description: newExpense.description.trim(),
      amount: amt,
      paymentMethod: newExpense.paymentMethod || 'نقداً (صندوق)',
      category: newExpense.category || 'المصروف اليومي',
      voucher: voucherNum,
    };

    setExpenses([newEntry, ...expenses]);
    setIsAddModalOpen(false);
    setNewExpense({
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: '',
      paymentMethod: 'نقداً (صندوق)',
      category: 'المصروف اليومي',
      voucher: '',
    });
  };

  // Action: Save Full Edit
  const handleSaveFullEdit = (e) => {
    e.preventDefault();
    if (!editingExpense) return;

    setExpenses((prev) =>
      prev.map((item) => (item.id === editingExpense.id ? { ...editingExpense } : item))
    );
    setEditingExpense(null);
  };

  // Action: Delete Expense
  const handleDeleteExpense = (id) => {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا السند المالي؟')) {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    }
  };

  // CSV Export Utility
  const handleExportCSV = () => {
    try {
      const headers = ['الرقم', 'التاريخ', 'الموسم', 'الشهر', 'التعيين / البيان', 'المبلغ (دج)', 'طريقة الدفع', 'رقم السند'];
      const rows = [headers.join(',')];

      filteredExpenses.forEach((e, idx) => {
        const row = [
          idx + 1,
          `"${e.date}"`,
          `"${e.academicYear}"`,
          `"${e.month}"`,
          `"${e.description}"`,
          e.amount,
          `"${e.paymentMethod}"`,
          `"${e.voucher}"`,
        ];
        rows.push(row.join(','));
      });

      const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `المصاريف_اليومية_${selectedYear}_${selectedMonth}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export CSV error', err);
    }
  };

  return (
    <div className="space-y-2.5 print:p-0">
      {/* 1. COMPACT TOP HEADER BAR (Eliminates bulky banner to save vertical screen space) */}
      <div className="bg-white border border-slate-200 px-3 py-2 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-blue-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                سجل المصاريف اليومية
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                المالية والمصاريف التشغيلية
              </span>
              {/* Exclamation / Info Button triggering Guide Modal */}
              <button
                onClick={() => setIsInfoModalOpen(true)}
                className="w-5 h-5 rounded-full bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-900 flex items-center justify-center transition-colors"
                title="معلومات وتفاصيل الواجهة وسندات الصرف"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              التوثيق اليومي لمشتريات ونفقات الروضة، تسوية الصندوق، والمطابقة المحاسبية عبر شهور الموسم الـ 11.
            </p>
          </div>
        </div>

        {/* Academic Year Selector (Multi-Year Support) */}
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
          const Icon = card.icon || TrendingUp;
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
              {card.subtext && (
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{card.subtext}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. COMPACT TOOLBAR DIRECTLY ABOVE TABLE (Icon-only actions & months selector) */}
      <div className="bg-white border border-slate-200 px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs print:hidden">
        {/* Right: 11 Months Quick Filter Buttons */}
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

        {/* Search Input and Icon-only Actions on Left */}
        <div className="flex items-center gap-1.5">
          <div className="relative w-48 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute inset-y-0 start-2.5 my-auto text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث في البيان، التاريخ، أو السند..."
              className="w-full h-7 ps-8 pe-2 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-900 focus:outline-none transition-colors"
            />
          </div>

          <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-slate-100 border border-slate-300 text-slate-700">
            {filteredExpenses.length} سند
          </span>

          {/* Add Expense Button (Icon-only with tooltip) */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-7 h-7 bg-blue-900 hover:bg-blue-800 text-white flex items-center justify-center transition-colors shadow-2xs"
            title="+ إضافة سند مصروف جديد"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Export CSV Button (Icon-only with tooltip) */}
          <button
            onClick={handleExportCSV}
            className="w-7 h-7 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 flex items-center justify-center transition-colors"
            title="تصدير السجل كـ CSV"
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

      {/* 4. HIGH-DENSITY INTERACTIVE EXPENSES DATA TABLE */}
      <div className="bg-white border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto max-h-[620px]">
          <table className="w-full text-start text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-300 text-slate-700 font-bold select-none text-[11px]">
              <tr>
                <th className="p-1.5 text-center border-e border-slate-200 w-10">#</th>
                <th className="p-1.5 text-start border-e border-slate-200 min-w-[95px]">التاريخ</th>
                <th className="p-1.5 text-start border-e border-slate-200 min-w-[260px]">التعيين / البيان</th>
                <th className="p-1.5 text-end border-e border-slate-200 min-w-[110px]">المبلغ (دج)</th>
                <th className="p-1.5 text-center border-e border-slate-200 min-w-[100px]">طريقة الدفع</th>
                <th className="p-1.5 text-center border-e border-slate-200 min-w-[120px]">رقم السند</th>
                <th className="p-1.5 text-center min-w-[90px] print:hidden">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800 font-sans text-xs">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    لا توجد مصاريف مسجلة لشهر {selectedMonth === 'ALL' ? 'المحدد' : RAWDA_MONTHS.find((m) => m.id === selectedMonth)?.nameAr} في موسم {selectedYear}
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((e, index) => {
                  const isEditingDesc = inlineEditingCell?.id === e.id && inlineEditingCell?.field === 'description';
                  const isEditingAmt = inlineEditingCell?.id === e.id && inlineEditingCell?.field === 'amount';
                  const isEditingDate = inlineEditingCell?.id === e.id && inlineEditingCell?.field === 'date';

                  return (
                    <tr
                      key={e.id}
                      onContextMenu={(evt) => handleContextMenu(evt, e)}
                      className="hover:bg-blue-50/50 transition-colors h-8"
                    >
                      {/* Index */}
                      <td className="p-1 text-center border-e border-slate-200 font-mono text-slate-400 font-bold">
                        {index + 1}
                      </td>

                      {/* Date (Inline editable on click) */}
                      <td
                        className="p-1 border-e border-slate-200 font-mono font-medium text-slate-900 cursor-pointer"
                        onClick={() => startInlineEdit(e.id, 'date', e.date)}
                      >
                        {isEditingDate ? (
                          <input
                            autoFocus
                            type="date"
                            value={inlineEditVal}
                            onChange={(ev) => setInlineEditVal(ev.target.value)}
                            onBlur={commitInlineEdit}
                            onKeyDown={(ev) => ev.key === 'Enter' && commitInlineEdit()}
                            className="w-full text-xs p-0.5 border border-blue-600 bg-white font-mono"
                          />
                        ) : (
                          <span>{e.date}</span>
                        )}
                      </td>

                      {/* Description / Designation (Inline editable on click) */}
                      <td
                        className="p-1 border-e border-slate-200 font-semibold text-slate-900 cursor-pointer"
                        onClick={() => startInlineEdit(e.id, 'description', e.description)}
                      >
                        {isEditingDesc ? (
                          <input
                            autoFocus
                            type="text"
                            value={inlineEditVal}
                            onChange={(ev) => setInlineEditVal(ev.target.value)}
                            onBlur={commitInlineEdit}
                            onKeyDown={(ev) => ev.key === 'Enter' && commitInlineEdit()}
                            className="w-full text-xs p-0.5 border border-blue-600 bg-white"
                          />
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="truncate">{e.description}</span>
                            {e.category && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-slate-100 text-slate-600 font-normal ms-1 hidden lg:inline">
                                {e.category}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Amount (Inline editable on click) */}
                      <td
                        className="p-1 text-end border-e border-slate-200 font-mono font-bold text-rose-700 cursor-pointer"
                        onClick={() => startInlineEdit(e.id, 'amount', e.amount)}
                      >
                        {isEditingAmt ? (
                          <input
                            autoFocus
                            type="number"
                            value={inlineEditVal}
                            onChange={(ev) => setInlineEditVal(ev.target.value)}
                            onBlur={commitInlineEdit}
                            onKeyDown={(ev) => ev.key === 'Enter' && commitInlineEdit()}
                            className="w-20 text-end text-xs p-0.5 border border-blue-600 bg-white font-mono"
                          />
                        ) : (
                          <span>{Number(e.amount).toLocaleString()} دج</span>
                        )}
                      </td>

                      {/* Payment Method */}
                      <td className="p-1 text-center border-e border-slate-200">
                        <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 text-[10px] font-semibold">
                          {e.paymentMethod}
                        </span>
                      </td>

                      {/* Voucher Number */}
                      <td className="p-1 text-center border-e border-slate-200 font-mono text-slate-600 text-[11px]">
                        {e.voucher}
                      </td>

                      {/* Actions */}
                      <td className="p-1 text-center print:hidden">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedVoucherPreview(e)}
                            className="p-1 text-slate-500 hover:text-blue-900 hover:bg-blue-50 transition-colors"
                            title="معاينة وطباعة السند"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingExpense({ ...e })}
                            className="p-1 text-slate-500 hover:text-blue-900 hover:bg-blue-50 transition-colors"
                            title="تعديل بيانات السند"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(e.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="حذف السند"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-xs">
              <tr>
                <td colSpan={3} className="p-2 text-start border-e border-slate-200 font-bold">
                  إجمالي المصاريف ({selectedMonth === 'ALL' ? 'كافة الشهور' : RAWDA_MONTHS.find((m) => m.id === selectedMonth)?.nameAr} - {selectedYear})
                </td>
                <td className="p-2 text-end border-e border-slate-200 font-mono text-sm text-rose-800 font-bold">
                  {totalMonthlyExpense.toLocaleString()} دج
                </td>
                <td colSpan={3} className="p-2 text-slate-500 text-[11px]">
                  {filteredExpenses.length} سند صرف معتمد ومطابق
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
          onClick={(ev) => ev.stopPropagation()}
          className="fixed z-50 bg-white border border-slate-300 shadow-xl py-1 text-xs text-slate-800 w-56 animate-in fade-in select-none"
        >
          <div className="px-3 py-1 bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-700 truncate">
            {contextMenu.expense?.voucher} — {Number(contextMenu.expense?.amount).toLocaleString()} دج
          </div>

          <button
            onClick={() => {
              setEditingExpense({ ...contextMenu.expense });
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-slate-700"
          >
            <Edit2 className="w-3.5 h-3.5 text-blue-900" />
            <span>تعديل السند المالي</span>
          </button>

          <button
            onClick={() => {
              setSelectedVoucherPreview(contextMenu.expense);
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-slate-700"
          >
            <FileText className="w-3.5 h-3.5 text-blue-800" />
            <span>معاينة سند الصرف والطباعة</span>
          </button>

          <button
            onClick={() => {
              const currentMethod = contextMenu.expense.paymentMethod;
              const nextMethod = currentMethod.includes('نقداً') ? 'شيك بنكي' : 'نقداً (صندوق)';
              setExpenses((prev) =>
                prev.map((it) => (it.id === contextMenu.expense.id ? { ...it, paymentMethod: nextMethod } : it))
              );
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-slate-700"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>تبديل طريقة الدفع (نقداً / شيك)</span>
          </button>

          <button
            onClick={() => {
              const rowStr = `${contextMenu.expense.date}\t${contextMenu.expense.description}\t${contextMenu.expense.amount}\t${contextMenu.expense.paymentMethod}\t${contextMenu.expense.voucher}`;
              navigator.clipboard.writeText(rowStr);
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-slate-700"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>نسخ بيانات السند (Excel / TSV)</span>
          </button>

          <div className="my-1 border-t border-slate-100" />

          <button
            onClick={() => {
              handleDeleteExpense(contextMenu.expense.id);
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-rose-50 text-rose-700 flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>حذف السند المالي</span>
          </button>
        </div>
      )}

      {/* 6. FULL EDIT EXPENSE MODAL */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-3 bg-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-300" />
                <span className="font-bold text-xs tracking-wide">
                  تعديل سند المصروف: {editingExpense.voucher}
                </span>
              </div>
              <button onClick={() => setEditingExpense(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFullEdit} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">تاريخ النفقة *</label>
                <input
                  type="date"
                  required
                  value={editingExpense.date}
                  onChange={(e) => setEditingExpense({ ...editingExpense, date: e.target.value })}
                  className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">التعيين / بيان النفقة *</label>
                <input
                  type="text"
                  required
                  value={editingExpense.description}
                  onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                  className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">المبلغ (دج) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editingExpense.amount}
                    onChange={(e) => setEditingExpense({ ...editingExpense, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">طريقة الدفع</label>
                  <select
                    value={editingExpense.paymentMethod}
                    onChange={(e) => setEditingExpense({ ...editingExpense, paymentMethod: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                  >
                    <option value="نقداً (صندوق)">نقداً (صندوق)</option>
                    <option value="شيك بنكي">شيك بنكي</option>
                    <option value="تحويل بنكي">تحويل بنكي</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">رقم السند</label>
                <input
                  type="text"
                  value={editingExpense.voucher}
                  onChange={(e) => setEditingExpense({ ...editingExpense, voucher: e.target.value })}
                  className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
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

      {/* 7. NEW EXPENSE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-3 bg-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-300" />
                <span className="font-bold text-xs tracking-wide">تسجيل سند مصروف تشغيلي جديد</span>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">تاريخ النفقة *</label>
                <input
                  type="date"
                  required
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                  className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">التعيين / بيان النفقة *</label>
                <input
                  type="text"
                  required
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  placeholder="مثال: شراء مواد تنظيف ومعقمات صحية"
                  className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">المبلغ المنفق (دج) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    placeholder="5000"
                    className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">طريقة الدفع</label>
                  <select
                    value={newExpense.paymentMethod}
                    onChange={(e) => setNewExpense({ ...newExpense, paymentMethod: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                  >
                    <option value="نقداً (صندوق)">نقداً (صندوق)</option>
                    <option value="شيك بنكي">شيك بنكي</option>
                    <option value="تحويل بنكي">تحويل بنكي</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">رقم السند (تلقائي إن تُرِك فارغاً)</label>
                <input
                  type="text"
                  value={newExpense.voucher}
                  onChange={(e) => setNewExpense({ ...newExpense, voucher: e.target.value })}
                  placeholder="مثال: VCH-26-FEB-012"
                  className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
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
                  تأكيد وقيد المصروف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. INFORMATION & GUIDE MODAL (Replaces bulky header text) */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-3 bg-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-300" />
                <span className="font-bold text-xs tracking-wide">دليل سجل المصاريف اليومية</span>
              </div>
              <button onClick={() => setIsInfoModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs text-slate-700 leading-relaxed max-h-[75vh] overflow-y-auto">
              <div className="bg-blue-50 border border-blue-200 p-2.5 text-blue-950">
                <h4 className="font-bold mb-1">روضة وحضانة الأطفال العباقرة — المالية والمصاريف التشغيلية</h4>
                <p className="text-[11px] text-blue-900">
                  سجل المصاريف اليومية (Rawda Daily Operational Expenses & Vouchers Ledger)
                </p>
              </div>

              <div>
                <h5 className="font-bold text-slate-900 mb-1">القواعد المحاسبية المعتمدة:</h5>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 ps-1">
                  <li><strong>التوثيق اليومي:</strong> تسجيل مشتريات ونفقات الروضة التشغيلية (مواد تنظيف، صيانة، تموين، مستلزمات مكتبية).</li>
                  <li><strong>ربط الصندوق:</strong> تُخصم النفقات النقدية تلقائياً من رصيد الصندوق اليومي للروضة في نهاية دوام العمل.</li>
                  <li><strong>تصفية الشهور الـ 11:</strong> متابعة موازية للمصروف الشهري من سبتمبر إلى جويلية مع احتساب الفوارق.</li>
                </ul>
              </div>

              <div>
                <h5 className="font-bold text-slate-900 mb-1">طرق التفاعل والتعديل المباشر:</h5>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 ps-1">
                  <li><strong>التعديل المباشر (Inline Editing):</strong> اضغط على التاريخ، البيان، أو المبلغ للتعديل الفوري من الجدول مباشرة.</li>
                  <li><strong>الزر الأيمن للفأرة (Right-Click):</strong> اضغط باليمين على أي سطر لفتح قائمة الإجراءات السريعة (تعديل كامل، معاينة السند، تبديل طريقة الدفع، أو نسخ كـ TSV).</li>
                  <li><strong>التبديل بين المواسم الدراسية:</strong> استخدم محول الموسم في الأعلى للتنقل بين السنوات السابقة والحالية.</li>
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

      {/* 9. EXPENSE VOUCHER PREVIEW MODAL (Printable payment voucher) */}
      {selectedVoucherPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-3 bg-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-300" />
                <span className="font-bold text-xs">سند صرف مصروف تشغيلي</span>
              </div>
              <button onClick={() => setSelectedVoucherPreview(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs bg-white border-b border-slate-200 font-sans" id="printVoucherSection">
              <div className="text-center border-b border-slate-200 pb-2">
                <h3 className="font-bold text-sm text-slate-900">روضة وحضانة الأطفال العباقرة</h3>
                <p className="text-[10px] text-slate-500 font-mono">سند خروج سيولة وصرف نفقات</p>
                <div className="mt-1 font-mono font-bold text-blue-900 text-xs">
                  {selectedVoucherPreview.voucher}
                </div>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">تاريخ الصرف:</span>
                  <span className="font-mono font-bold">{selectedVoucherPreview.date}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">البيان / الغرض:</span>
                  <span className="font-bold text-slate-900">{selectedVoucherPreview.description}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">المبلغ المصروف:</span>
                  <span className="font-mono font-bold text-rose-700 text-sm">
                    {Number(selectedVoucherPreview.amount).toLocaleString()} دج
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">طريقة الدفع:</span>
                  <span>{selectedVoucherPreview.paymentMethod}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">الموسم الدراسي:</span>
                  <span className="font-mono">{selectedVoucherPreview.academicYear}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 text-center text-[10px] text-slate-500">
                <div className="border-t border-slate-300 pt-1">
                  <span>توقيع أمين الصندوق</span>
                </div>
                <div className="border-t border-slate-300 pt-1">
                  <span>تأشيرة الإدارة والمدير</span>
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
                onClick={() => setSelectedVoucherPreview(null)}
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
