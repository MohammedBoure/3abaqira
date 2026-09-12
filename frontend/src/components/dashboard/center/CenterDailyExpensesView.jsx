import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Coins,
  Receipt,
  FileCheck,
  Plus,
  Trash2,
  Edit2,
  X,
} from 'lucide-react';
import { StandardViewLayout } from '../common/StandardViewLayout';
import { MOCK_CENTER_DAILY_EXPENSES } from '../../../mock/centerMockData';

export function CenterDailyExpensesView() {
  const [expenses, setExpenses] = useState(MOCK_CENTER_DAILY_EXPENSES);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    voucher: '',
    category: 'أدوات مكتبية',
  });

  // 1. KPI Calculations (Section 3.4.13)
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const recordedDays = new Set(expenses.map((e) => e.date)).size || 1;
  const avgDaily = Math.round(totalExpenses / recordedDays);
  const maxExpense = expenses.reduce(
    (max, e) => (e.amount > (max.amount || 0) ? e : max),
    { description: 'لا يوجد', amount: 0 }
  );

  const kpiCards = [
    {
      label: 'إجمالي مصاريف المركز التشغيلية',
      value: `${totalExpenses.toLocaleString()} دج`,
      icon: TrendingUp,
      subtext: 'مشتريات المركز وأدوات المعامل والصيانة',
      change: 'مسندة بوصولات',
      isPositive: true,
    },
    {
      label: 'متوسط الصرف اليومي للمركز',
      value: `${avgDaily.toLocaleString()} دج`,
      icon: Coins,
      subtext: `معدل الإنفاق اليومي عبر ${recordedDays} أيام`,
      change: 'ضمن المخطط',
      isPositive: true,
    },
    {
      label: 'عدد سندات ووصولات الصرف المقيدة',
      value: `${expenses.length} سندات`,
      icon: Receipt,
      subtext: 'وصولات خروج معتمدة وموقعة',
      change: 'موثقة',
      isPositive: true,
    },
    {
      label: 'أكبر عملية صرف مسجلة',
      value: `${maxExpense.amount.toLocaleString()} دج`,
      icon: FileCheck,
      subtext: maxExpense.description,
      change: 'معتمد',
      isPositive: false,
    },
  ];

  // 2. Filter
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      return (
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.voucher.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [expenses, searchTerm]);

  // 3. Add Expense
  const handleSaveExpense = (e) => {
    e.preventDefault();
    if (!newExpense.description.trim() || !newExpense.amount) return;

    const entry = {
      id: `cd-exp-${Date.now()}`,
      date: newExpense.date,
      description: newExpense.description.trim(),
      amount: Number(newExpense.amount),
      voucher: newExpense.voucher || `CTR-VCH-${expenses.length + 1}`,
      category: newExpense.category,
    };

    setExpenses([entry, ...expenses]);
    setIsModalOpen(false);
    setNewExpense({
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: '',
      voucher: '',
      category: 'أدوات مكتبية',
    });
  };

  return (
    <StandardViewLayout
      titleAr="المصاريف اليومية للمركز الأكاديمي"
      titleEn="Center Daily Operating Expenses & Petty Cash Ledger"
      description="التسجيل المحاسبي اليومي لمشتريات ونفقات المركز الأكاديمي (مستلزمات مختبر الروبوتيك، إنترنت، أدوات تدريس، طباعة، صيانة) مع تتبع وصولات الخروج."
      entityTag="الخزينة والنفقات"
      branchCode="CENTER"
      kpiCards={kpiCards}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="ابحث في بيان النفقة أو رقم وصل الخروج..."
      actionButtonLabel="+ تسجيل سند صرف"
      onActionButtonClick={() => setIsModalOpen(true)}
      exportFileName="center_daily_expenses"
      exportData={filteredExpenses.map((e) => ({
        'التاريخ اليومي': e.date,
        'البيان ونوع النفقة': e.description,
        'المبلغ المنصرف (دج)': e.amount,
        'وصل الخروج': e.voucher,
        'التصنيف': e.category,
      }))}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-start text-xs border-collapse">
          <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold select-none">
            <tr>
              <th className="p-2.5 text-center border-e border-slate-200 w-12">#</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[120px]">التاريخ اليومي</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[280px]">
                بيان التعيين ونوع النفقة
              </th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[140px]">تصنيف البند</th>
              <th className="p-2.5 text-end border-e border-slate-200 min-w-[140px]">المبلغ المنصرف (دج)</th>
              <th className="p-2.5 text-center min-w-[130px]">وصل الخروج المالي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {filteredExpenses.map((e, idx) => (
              <tr key={e.id} className="hover:bg-blue-50/40 transition-colors">
                <td className="p-2.5 text-center border-e border-slate-200 font-mono text-slate-400 font-bold">
                  {idx + 1}
                </td>
                <td className="p-2.5 border-e border-slate-200 font-mono text-slate-900 font-medium">
                  {e.date}
                </td>
                <td className="p-2.5 border-e border-slate-200 font-semibold text-slate-900">
                  {e.description}
                </td>
                <td className="p-2.5 border-e border-slate-200">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold">
                    {e.category}
                  </span>
                </td>
                <td className="p-2.5 text-end border-e border-slate-200 font-mono font-bold text-rose-700 text-sm">
                  {e.amount.toLocaleString()} دج
                </td>
                <td className="p-2.5 text-center font-mono font-bold text-blue-900">
                  <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-[2px]">
                    {e.voucher}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 font-mono">
            <tr>
              <td colSpan={4} className="p-2.5 text-start font-sans text-xs border-e border-slate-200">
                المجموع العام لمصاريف المركز
              </td>
              <td className="p-2.5 text-end border-e border-slate-200 text-rose-800 text-sm font-bold">
                {totalExpenses.toLocaleString()} دج
              </td>
              <td className="p-2.5 text-center font-sans text-[11px] text-slate-500">
                {expenses.length} سندات صرف
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">تسجيل سند صرف للمركز</span>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">التاريخ اليومي *</label>
                <input
                  type="date"
                  required
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">بيان التعيين ونوع النفقة *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شراء أوراق طابعة وأقلام سبورة"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المبلغ المنصرف (دج) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="3500"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">رقم وصل الخروج</label>
                  <input
                    type="text"
                    placeholder="CTR-VCH-..."
                    value={newExpense.voucher}
                    onChange={(e) => setNewExpense({ ...newExpense, voucher: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">تصنيف البند</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                >
                  <option value="أدوات مكتبية">أدوات مكتبية</option>
                  <option value="اتصالات وإنترنت">اتصالات وإنترنت</option>
                  <option value="صيانة وتشغيل">صيانة وتشغيل</option>
                  <option value="مستلزمات تعليمية">مستلزمات تعليمية</option>
                  <option value="طباعة ونشر">طباعة ونشر</option>
                  <option value="ضيافة ونثريات">ضيافة ونثريات</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold"
                >
                  حفظ السند
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </StandardViewLayout>
  );
}
