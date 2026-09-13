import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  Coins,
  Receipt,
  FileCheck,
  Plus,
  Trash2,
  Edit2,
  X,
  Printer,
  Download,
  Search,
  Info,
  Calendar,
  Filter,
  Check,
  Copy,
  FileText,
} from 'lucide-react';
import { ReceiptVoucherModal } from '../common/ReceiptVoucherModal';
import { MOCK_CENTER_DAILY_EXPENSES } from '../../../mock/centerMockData';

const EXPENSE_CATEGORIES = [
  'أدوات مكتبية وقرطاسية',
  'مستلزمات معامل الروبوتيك',
  'صيانة وتجهيز القاعات',
  'تموين ومشروبات وضيافة',
  'فواتير إنترنت وطاقة',
  'مطبوعات وإعلانات',
  'مصاريف تشغيلية ونقل',
];

const MONTHS_NAMES_AR = [
  { num: '09', name: 'سبتمبر' },
  { num: '10', name: 'أكتوبر' },
  { num: '11', name: 'نوفمبر' },
  { num: '12', name: 'ديسمبر' },
  { num: '01', name: 'جانفي' },
  { num: '02', name: 'فيفري' },
  { num: '03', name: 'مارس' },
  { num: '04', name: 'أفريل' },
  { num: '05', name: 'ماي' },
  { num: '06', name: 'جوان' },
  { num: '07', name: 'جويلية' },
];

export function CenterDailyExpensesView() {
  const [selectedYear, setSelectedYear] = useState('2025-2026');
  const [activeTab, setActiveTab] = useState('table'); // 'table' | 'kpis'
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Expenses Dataset
  const [expenses, setExpenses] = useState(() => {
    return MOCK_CENTER_DAILY_EXPENSES.map((e, idx) => ({
      ...e,
      id: `exp-${idx + 1}`,
      academicYear: '2025-2026',
      voucher: e.voucher || `CTR-VCH-26-${idx + 1}`,
      notes: e.notes || 'مصروف تشغيلي معتمد',
    }));
  });

  // UI Modals
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  // Right-Click Context Menu
  const [contextMenu, setContextMenu] = useState(null);

  // Close context menu on external click
  useEffect(() => {
    const handleWindowClick = () => setContextMenu(null);
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchYear = !e.academicYear || e.academicYear === selectedYear;
      const monthNum = e.date ? e.date.split('-')[1] : '';
      const matchMonth = selectedMonth === 'ALL' || monthNum === selectedMonth;
      const matchCat = selectedCategory === 'ALL' || e.category === selectedCategory;
      const matchSearch =
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.voucher.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchYear && matchMonth && matchCat && matchSearch;
    });
  }, [expenses, selectedYear, selectedMonth, selectedCategory, searchTerm]);

  // Grouping by month for subtotal calculations
  const monthlyGroups = useMemo(() => {
    const groups = {};
    MONTHS_NAMES_AR.forEach((m) => {
      groups[m.num] = {
        name: m.name,
        num: m.num,
        items: [],
        total: 0,
      };
    });

    filteredExpenses.forEach((e) => {
      const mNum = e.date ? e.date.split('-')[1] : '09';
      if (!groups[mNum]) {
        groups[mNum] = { name: `شهر ${mNum}`, num: mNum, items: [], total: 0 };
      }
      groups[mNum].items.push(e);
      groups[mNum].total += Number(e.amount) || 0;
    });

    return groups;
  }, [filteredExpenses]);

  // KPIs
  const totalExpensesAmount = filteredExpenses.reduce(
    (acc, e) => acc + (Number(e.amount) || 0),
    0
  );
  const recordedDaysCount = new Set(filteredExpenses.map((e) => e.date)).size || 1;
  const avgDailyExpense = Math.round(totalExpensesAmount / recordedDaysCount);
  const maxExpenseItem = filteredExpenses.reduce(
    (max, e) => (e.amount > (max.amount || 0) ? e : max),
    { description: 'لا يوجد', amount: 0 }
  );

  // Open Context Menu
  const handleContextMenu = (e, expense) => {
    e.preventDefault();
    e.stopPropagation();
    const x = Math.min(e.clientX, window.innerWidth - 220);
    const y = Math.min(e.clientY, window.innerHeight - 260);
    setContextMenu({ x, y, expense });
  };

  // Open Voucher Preview
  const handleOpenVoucher = (exp) => {
    setSelectedVoucher({
      receiptNumber: exp.voucher || 'CTR-EXP-AUTO',
      payerName: 'خزينة المركز التعليمي',
      category: `سند صرف - ${exp.category}`,
      amount: exp.amount,
      paymentMethod: 'نقداً (صندوق المصاريف اليومي)',
      branch: 'المركز التعليمي والأكاديمي',
      notes: `${exp.description} - بتاريخ: ${exp.date}`,
    });
  };

  // Delete Expense
  const handleDeleteExpense = (id) => {
    if (window.confirm('هل أنت متأكد من حذف سند المصروف هذا؟')) {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      setContextMenu(null);
    }
  };

  // Add New Expense Form
  const [newExpenseForm, setNewExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    category: EXPENSE_CATEGORIES[0],
    voucher: '',
    notes: '',
  });

  const handleAddNewExpense = (e) => {
    e.preventDefault();
    if (!newExpenseForm.description.trim() || !newExpenseForm.amount) return;

    const seq = expenses.length + 1;
    const newEntry = {
      id: `exp-${Date.now()}`,
      academicYear: selectedYear,
      date: newExpenseForm.date,
      description: newExpenseForm.description.trim(),
      amount: Number(newExpenseForm.amount) || 0,
      category: newExpenseForm.category,
      voucher: newExpenseForm.voucher || `CTR-VCH-26-${seq}`,
      notes: newExpenseForm.notes || 'سند صرف جديد',
    };

    setExpenses([newEntry, ...expenses]);
    setIsAddModalOpen(false);
    setNewExpenseForm({
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: '',
      category: EXPENSE_CATEGORIES[0],
      voucher: '',
      notes: '',
    });
  };

  // Save Edit Expense
  const handleSaveEditExpense = (e) => {
    e.preventDefault();
    if (editingExpense) {
      setExpenses((prev) =>
        prev.map((item) => (item.id === editingExpense.id ? editingExpense : item))
      );
      setEditingExpense(null);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'التاريخ',
      'رقم السند',
      'بيان وتعيين المصروف',
      'التصنيف',
      'المبلغ (دج)',
      'ملاحظات',
    ];
    const rows = filteredExpenses.map((e) => [
      e.date,
      `"${e.voucher}"`,
      `"${e.description}"`,
      `"${e.category}"`,
      e.amount,
      `"${e.notes || ''}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `center_expenses_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 text-xs overflow-hidden">
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-white border-b border-slate-200 shrink-0">
        {/* Title & Badge */}
        <div className="flex items-center gap-2">
          <div className="p-1 bg-rose-50 text-rose-700 border border-rose-200">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 text-sm">
                سجل المصاريف اليومية للمركز (المصاريف)
              </span>
              <span className="text-[10px] text-slate-400">|</span>
              <span className="text-[10px] text-slate-500 font-mono">
                Center Daily Operational Expenses
              </span>
            </div>
          </div>
        </div>

        {/* Year Selector & Internal Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              aria-label="تحديد السنة المالية للمصاريف"
              className="bg-transparent font-bold text-slate-800 text-xs border-none focus:outline-hidden cursor-pointer"
            >
              <option value="2024-2025">موسم 2024 - 2025</option>
              <option value="2025-2026">موسم 2025 - 2026</option>
              <option value="2026-2027">موسم 2026 - 2027</option>
            </select>
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 border border-slate-200">
            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1 text-xs font-bold transition-colors ${
                activeTab === 'table'
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              سجل المصاريف ({filteredExpenses.length})
            </button>
            <button
              onClick={() => setActiveTab('kpis')}
              className={`px-3 py-1 text-xs font-bold flex items-center gap-1 transition-colors ${
                activeTab === 'kpis'
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              مؤشرات الصرف
            </button>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1 border-s border-slate-200 ps-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              title="إضافة سند مصروف جديد"
              className="p-1 bg-blue-900 hover:bg-blue-950 text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportCSV}
              title="تصدير CSV"
              className="p-1 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.print()}
              title="طباعة السجل"
              className="p-1 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsInfoModalOpen(true)}
              title="معلومات ودليل استخدام سجل المصاريف"
              className="p-1 hover:bg-amber-50 text-amber-700 border border-amber-200 transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Filter Bar */}
      {activeTab === 'table' && (
        <div className="flex items-center justify-between px-3 py-1 bg-white border-b border-slate-200 shrink-0 gap-2">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute right-2 top-1.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="بحث بالبيان، رقم السند، أو التصنيف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-7 pr-7 pl-2 bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                aria-label="تصفية المصاريف حسب الشهر"
                className="h-7 px-2 bg-slate-50 border border-slate-200 text-[11px] text-slate-700 focus:outline-hidden"
              >
                <option value="ALL">جميع شهور الموسم (11 شهر)</option>
                {MONTHS_NAMES_AR.map((m) => (
                  <option key={m.num} value={m.num}>
                    شهر {m.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="تصفية المصاريف حسب التصنيف"
                className="h-7 px-2 bg-slate-50 border border-slate-200 text-[11px] text-slate-700 focus:outline-hidden"
              >
                <option value="ALL">جميع بنود المصاريف</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
            <span>
              عدد السندات:{' '}
              <strong className="text-slate-800">{filteredExpenses.length}</strong>
            </span>
            <span>
              إجمالي المنصرف:{' '}
              <strong className="text-rose-700">
                {totalExpensesAmount.toLocaleString()} دج
              </strong>
            </span>
          </div>
        </div>
      )}

      {/* 3. Main Workspace Area */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'table' ? (
          <div className="min-w-full inline-block align-middle pb-8">
            <table className="w-full text-start text-xs border-collapse select-none">
              <thead className="bg-slate-100 sticky top-0 z-10 border-b border-slate-300 text-slate-700 font-bold text-[11px]">
                <tr>
                  <th className="p-1 text-center border-e border-slate-300 w-24">التاريخ</th>
                  <th className="p-1 text-center border-e border-slate-300 min-w-[110px]">
                    رقم السند
                  </th>
                  <th className="p-1 text-start border-e border-slate-300 min-w-[220px]">
                    بيان وتعيين المصروف
                  </th>
                  <th className="p-1 text-start border-e border-slate-300 min-w-[150px]">
                    التصنيف والبند
                  </th>
                  <th className="p-1 text-end border-e border-slate-300 min-w-[110px] bg-rose-50 text-rose-900 font-bold">
                    المبلغ (دج)
                  </th>
                  <th className="p-1 text-start min-w-[160px]">ملاحظات</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {/* Render with Monthly Subtotals */}
                {Object.values(monthlyGroups).map((group) => {
                  if (group.items.length === 0) return null;

                  return (
                    <React.Fragment key={group.num}>
                      {/* Month Header Banner */}
                      <tr className="bg-slate-200/70 text-slate-900 font-bold font-sans">
                        <td colSpan={6} className="p-1.5 px-3 border-y border-slate-300 text-xs">
                          شهر {group.name} ({group.items.length} سندات صرف)
                        </td>
                      </tr>

                      {/* Items for this month */}
                      {group.items.map((exp) => (
                        <tr
                          key={exp.id}
                          onContextMenu={(e) => handleContextMenu(e, exp)}
                          className="h-8 hover:bg-blue-50/40 transition-colors cursor-pointer"
                        >
                          {/* Date */}
                          <td className="p-1 text-center border-e border-slate-200 text-slate-600">
                            {exp.date}
                          </td>

                          {/* Voucher */}
                          <td className="p-1 text-center border-e border-slate-200">
                            <button
                              onClick={() => handleOpenVoucher(exp)}
                              className="text-[10px] text-blue-900 font-bold hover:underline flex items-center justify-center gap-1 mx-auto"
                              title="معاينة سند الصرف"
                            >
                              <FileText className="w-2.5 h-2.5" />
                              {exp.voucher}
                            </button>
                          </td>

                          {/* Description */}
                          <td className="p-1 border-e border-slate-200 font-sans font-medium text-slate-900">
                            {exp.description}
                          </td>

                          {/* Category */}
                          <td className="p-1 border-e border-slate-200 font-sans text-slate-700">
                            <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded-xs text-[10px]">
                              {exp.category}
                            </span>
                          </td>

                          {/* Amount */}
                          <td className="p-1 text-end border-e border-slate-200 font-bold text-rose-700 bg-rose-50/30">
                            {exp.amount.toLocaleString()} دج
                          </td>

                          {/* Notes */}
                          <td className="p-1 font-sans text-slate-600 truncate max-w-[160px]">
                            {exp.notes}
                          </td>
                        </tr>
                      ))}

                      {/* Monthly Subtotal Row */}
                      <tr className="bg-rose-50/60 border-t border-b border-rose-200 text-rose-950 font-bold">
                        <td colSpan={4} className="p-1.5 px-3 font-sans text-start">
                          مجموع شهر {group.name}
                        </td>
                        <td className="p-1 text-end font-mono text-xs text-rose-800">
                          {group.total.toLocaleString()} دج
                        </td>
                        <td className="p-1 text-slate-400 font-sans text-[10px]">-</td>
                      </tr>
                    </React.Fragment>
                  );
                })}

                {/* Grand Total Row */}
                <tr className="bg-slate-900 text-white font-bold text-xs sticky bottom-0 z-20 shadow-md">
                  <td colSpan={4} className="p-2 font-sans text-amber-300">
                    مجموع المصاريف الإجمالي للموسم ({selectedYear})
                  </td>
                  <td className="p-2 text-end text-amber-300 font-mono text-sm">
                    {totalExpensesAmount.toLocaleString()} دج
                  </td>
                  <td className="p-2 text-slate-400 font-sans text-[10px]">
                    {filteredExpenses.length} سند صرف معتمد
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          /* KPIs Tab */
          <div className="p-4 space-y-4 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3 bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold">إجمالي المصاريف المنفذة</span>
                  <TrendingUp className="w-4 h-4 text-rose-700" />
                </div>
                <div className="text-xl font-bold font-mono text-rose-700">
                  {totalExpensesAmount.toLocaleString()} دج
                </div>
                <div className="text-[10px] text-slate-400 mt-1">موسم {selectedYear}</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold">متوسط الإنفاق اليومي</span>
                  <Coins className="w-4 h-4 text-slate-700" />
                </div>
                <div className="text-xl font-bold font-mono text-slate-900">
                  {avgDailyExpense.toLocaleString()} دج
                </div>
                <div className="text-[10px] text-slate-400 mt-1">عبر {recordedDaysCount} أيام صرف</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold">سندات الصرف المقيدة</span>
                  <Receipt className="w-4 h-4 text-blue-900" />
                </div>
                <div className="text-xl font-bold font-mono text-slate-900">
                  {filteredExpenses.length} سندات
                </div>
                <div className="text-[10px] text-emerald-600 mt-1">موثقة وموقعة</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold">أكبر عملية صرف</span>
                  <FileCheck className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-xl font-bold font-mono text-amber-700">
                  {maxExpenseItem.amount.toLocaleString()} دج
                </div>
                <div className="text-[10px] text-slate-500 mt-1 truncate">
                  {maxExpenseItem.description}
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white border border-slate-200 p-3 shadow-2xs">
              <h4 className="font-bold text-xs text-slate-900 mb-2">
                توزيع المصاريف حسب البنود التشغيلية:
              </h4>
              <table className="w-full text-start text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                  <tr>
                    <th className="p-2 text-start">بند المصروف</th>
                    <th className="p-2 text-center">عدد العمليات</th>
                    <th className="p-2 text-end">المبلغ الإجمالي</th>
                    <th className="p-2 text-center">النسبة المئوية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {EXPENSE_CATEGORIES.map((cat) => {
                    const catItems = filteredExpenses.filter((e) => e.category === cat);
                    const catTotal = catItems.reduce((a, b) => a + (Number(b.amount) || 0), 0);
                    const pct =
                      totalExpensesAmount > 0
                        ? Math.round((catTotal / totalExpensesAmount) * 100)
                        : 0;
                    if (catItems.length === 0) return null;

                    return (
                      <tr key={cat} className="hover:bg-slate-50">
                        <td className="p-2 font-sans font-semibold text-slate-900">{cat}</td>
                        <td className="p-2 text-center">{catItems.length}</td>
                        <td className="p-2 text-end text-rose-700 font-bold">
                          {catTotal.toLocaleString()} دج
                        </td>
                        <td className="p-2 text-center">{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Right-Click Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white border border-slate-300 shadow-xl py-1 text-xs min-w-[190px] animate-in fade-in"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1 bg-slate-100 border-b border-slate-200 font-bold text-[10px] text-slate-700">
            {contextMenu.expense.voucher}
          </div>
          <button
            onClick={() => {
              setEditingExpense(contextMenu.expense);
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-blue-50 text-slate-800 flex items-center gap-2"
          >
            <Edit2 className="w-3.5 h-3.5 text-blue-800" />
            تعديل سند المصروف
          </button>
          <button
            onClick={() => {
              handleOpenVoucher(contextMenu.expense);
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-blue-50 text-slate-800 flex items-center gap-2"
          >
            <FileText className="w-3.5 h-3.5 text-rose-700" />
            معاينة سند الصرف
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `${contextMenu.expense.voucher} - ${contextMenu.expense.description} - ${contextMenu.expense.amount} دج`
              );
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-blue-50 text-slate-800 flex items-center gap-2"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            نسخ تفاصيل المصروف
          </button>
          <div className="border-t border-slate-200 my-1" />
          <button
            onClick={() => handleDeleteExpense(contextMenu.expense.id)}
            className="w-full text-start px-3 py-1.5 hover:bg-rose-50 text-rose-700 flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            حذف السند
          </button>
        </div>
      )}

      {/* Edit Expense Modal */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">تعديل سند المصروف</span>
              <button
                onClick={() => setEditingExpense(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditExpense} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">التاريخ *</label>
                  <input
                    type="date"
                    required
                    value={editingExpense.date}
                    onChange={(e) =>
                      setEditingExpense({ ...editingExpense, date: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">رقم السند</label>
                  <input
                    type="text"
                    value={editingExpense.voucher}
                    onChange={(e) =>
                      setEditingExpense({ ...editingExpense, voucher: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  بيان وتعيين المصروف *
                </label>
                <input
                  type="text"
                  required
                  value={editingExpense.description}
                  onChange={(e) =>
                    setEditingExpense({ ...editingExpense, description: e.target.value })
                  }
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    المبلغ (دج) *
                  </label>
                  <input
                    type="number"
                    required
                    value={editingExpense.amount}
                    onChange={(e) =>
                      setEditingExpense({ ...editingExpense, amount: Number(e.target.value) })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">التصنيف والبند</label>
                  <select
                    value={editingExpense.category}
                    onChange={(e) =>
                      setEditingExpense({ ...editingExpense, category: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ملاحظات</label>
                <input
                  type="text"
                  value={editingExpense.notes}
                  onChange={(e) =>
                    setEditingExpense({ ...editingExpense, notes: e.target.value })
                  }
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-bold"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">
                قيد سند مصروف تشغيلي جديد
              </span>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewExpense} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">التاريخ *</label>
                  <input
                    type="date"
                    required
                    value={newExpenseForm.date}
                    onChange={(e) =>
                      setNewExpenseForm({ ...newExpenseForm, date: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    رقم السند (تلقائي)
                  </label>
                  <input
                    type="text"
                    placeholder="CTR-VCH-..."
                    value={newExpenseForm.voucher}
                    onChange={(e) =>
                      setNewExpenseForm({ ...newExpenseForm, voucher: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  بيان وتعيين المصروف *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شراء أقلام وورق طباعة A4..."
                  value={newExpenseForm.description}
                  onChange={(e) =>
                    setNewExpenseForm({ ...newExpenseForm, description: e.target.value })
                  }
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    المبلغ (دج) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="مثال: 4500"
                    value={newExpenseForm.amount}
                    onChange={(e) =>
                      setNewExpenseForm({ ...newExpenseForm, amount: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">التصنيف</label>
                  <select
                    value={newExpenseForm.category}
                    onChange={(e) =>
                      setNewExpenseForm({ ...newExpenseForm, category: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ملاحظات</label>
                <input
                  type="text"
                  placeholder="ملاحظات الصرف..."
                  value={newExpenseForm.notes}
                  onChange={(e) =>
                    setNewExpenseForm({ ...newExpenseForm, notes: e.target.value })
                  }
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-bold"
                >
                  تسجيل سند المصروف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-lg p-5 text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-slate-900 text-sm">
                  دليل وإرشادات سجل المصاريف اليومية للمركز
                </span>
              </div>
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-slate-700 leading-relaxed">
              <p>
                <strong>الهدف من الواجهة:</strong> توثيق المشتريات والنفقات التشغيلية للمركز (أدوات
                مكتبية، روبوتيك، صيانة، وضيافة) مربوطة بسندات الصرف الرسمية.
              </p>
              <ul className="list-disc list-inside space-y-1 bg-slate-50 p-2.5 border border-slate-200">
                <li>
                  <strong>المجاميع الشهرية:</strong> تعرض الواجهة المصاريف مقسمة على شهور الموسم مع
                  إظهار مجاميع شهرية تلقائية ملخصة.
                </li>
                <li>
                  <strong>معاينة سند الصرف:</strong> اضغط على رقم السند لمعاينته وطباعة إيصال خروج
                  السيولة.
                </li>
                <li>
                  <strong>الزر الأيمن للفأرة:</strong> يتيح تعديل السند، نسخ تفاصيل العملية، أو
                  حذف السجل.
                </li>
                <li>
                  <strong>دعم تعدد السنوات:</strong> تتبع مصاريف مختلف المواسم الدراسية من القائمة
                  العلوية.
                </li>
              </ul>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-black text-white font-bold"
              >
                إغلاق الدليل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voucher Modal */}
      {selectedVoucher && (
        <ReceiptVoucherModal
          voucherData={selectedVoucher}
          onClose={() => setSelectedVoucher(null)}
        />
      )}
    </div>
  );
}
