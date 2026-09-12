import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { StandardViewLayout } from '../common/StandardViewLayout';
import { MOCK_RAWDA_DAILY_EXPENSES, RAWDA_MONTHS } from '../../../mock/rawdaMockData';

export function RawdaDailyExpensesView() {
  const [expenses, setExpenses] = useState(MOCK_RAWDA_DAILY_EXPENSES);
  const [selectedMonth, setSelectedMonth] = useState('feb');
  const [searchTerm, setSearchTerm] = useState('');

  // Add Expense Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    paymentMethod: 'نقداً (صندوق)',
    voucher: '',
  });

  // 1. KPI Calculations (Section 2.3)
  const monthExpenses = useMemo(() => {
    return expenses.filter((e) => !selectedMonth || e.month === selectedMonth);
  }, [expenses, selectedMonth]);

  const totalMonthlyExpense = monthExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const recordedDaysCount = new Set(monthExpenses.map((e) => e.date)).size || 1;
  const averageDailyExpense = Math.round(totalMonthlyExpense / recordedDaysCount);
  const maxExpenseItem = monthExpenses.reduce(
    (max, e) => (Number(e.amount) > Number(max.amount || 0) ? e : max),
    { description: 'لا يوجد', amount: 0 }
  );

  const kpiCards = [
    {
      label: 'إجمالي المصروف الشهري',
      value: `${totalMonthlyExpense.toLocaleString()} دج`,
      icon: TrendingUp,
      subtext: `شهر ${RAWDA_MONTHS.find((m) => m.id === selectedMonth)?.nameAr || 'المحدد'}`,
      change: 'مضبوط بالصندوق',
      isPositive: true,
    },
    {
      label: 'متوسط الصرف اليومي',
      value: `${averageDailyExpense.toLocaleString()} دج`,
      icon: Coins,
      subtext: `معدل الإنفاق عبر ${recordedDaysCount} أيام عمل`,
      change: 'طبيعي',
      isPositive: true,
    },
    {
      label: 'عدد الأيام الموثقة',
      value: `${recordedDaysCount} يوم`,
      icon: Calendar,
      subtext: 'سجلات وفواتير يومية مؤكدة',
      change: 'محدث يومياً',
      isPositive: true,
    },
    {
      label: 'أكبر بند صرف بالشهادة',
      value: `${Number(maxExpenseItem.amount).toLocaleString()} دج`,
      icon: Layers,
      subtext: maxExpenseItem.description,
      change: 'فاتورة معتمدة',
      isPositive: false,
    },
  ];

  // 2. Filter expenses
  const filteredExpenses = useMemo(() => {
    return monthExpenses.filter((e) => {
      const matchSearch =
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.voucher && e.voucher.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchSearch;
    });
  }, [monthExpenses, searchTerm]);

  // 3. Add Expense Handler
  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount) return;

    const entry = {
      id: `exp-${Date.now()}`,
      date: newExpense.date,
      month: selectedMonth,
      description: newExpense.description,
      amount: Number(newExpense.amount),
      paymentMethod: newExpense.paymentMethod || 'نقداً (صندوق)',
      voucher: newExpense.voucher || `VCH-EXP-${expenses.length + 1}`,
    };

    setExpenses([entry, ...expenses]);
    setIsModalOpen(false);
    setNewExpense({
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: '',
      paymentMethod: 'نقداً (صندوق)',
      voucher: '',
    });
  };

  const handleDeleteExpense = (id) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا السند المالي؟')) {
      setExpenses(expenses.filter((e) => e.id !== id));
    }
  };

  return (
    <StandardViewLayout
      titleAr="سجل المصاريف اليومية"
      titleEn="Rawda Daily Operational Expenses & Vouchers Ledger"
      description="التوثيق اليومي لمشتريات ونفقات الروضة التشغيلية (مواد تنظيف، صيانة، تموين، مستلزمات مكتبية)، مربوطة بصندوق المصاريف اليومي وتصفية الشهور الـ 11."
      entityTag="المالية والمصاريف التشغيلية"
      branchCode="RAWDA"
      kpiCards={kpiCards}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="ابحث في بيان النفقة أو رقم السند..."
      actionButtonLabel="+ إضافة سند مصروف"
      onActionButtonClick={() => setIsModalOpen(true)}
      exportFileName={`rawda_expenses_${selectedMonth}`}
      exportData={filteredExpenses.map((e) => ({
        'التاريخ': e.date,
        'البيان': e.description,
        'المبلغ (دج)': e.amount,
        'طريقة الدفع': e.paymentMethod,
        'رقم السند': e.voucher,
      }))}
      filterSlot={
        <div className="flex items-center gap-1 overflow-x-auto max-w-xl py-0.5">
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
      }
    >
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-start text-xs border-collapse">
          <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold select-none">
            <tr>
              <th className="p-2.5 text-center border-e border-slate-200 w-12">#</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[110px]">رقم اليوم / التاريخ</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[280px]">التعيين / البيان</th>
              <th className="p-2.5 text-end border-e border-slate-200 min-w-[120px]">المبلغ (دج)</th>
              <th className="p-2.5 text-center border-e border-slate-200 min-w-[120px]">طريقة الدفع</th>
              <th className="p-2.5 text-center border-e border-slate-200 min-w-[110px]">رقم السند</th>
              <th className="p-2.5 text-center min-w-[90px] print:hidden">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  لا توجد مصاريف مسجلة لشهر {RAWDA_MONTHS.find((m) => m.id === selectedMonth)?.nameAr}
                </td>
              </tr>
            ) : (
              filteredExpenses.map((e, index) => (
                <tr key={e.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="p-2 text-center border-e border-slate-200 font-mono text-slate-400 font-bold">
                    {index + 1}
                  </td>
                  <td className="p-2 border-e border-slate-200 font-mono font-medium text-slate-900">
                    {e.date}
                  </td>
                  <td className="p-2 border-e border-slate-200 font-semibold text-slate-900">
                    {e.description}
                  </td>
                  <td className="p-2 text-end border-e border-slate-200 font-mono font-bold text-rose-700">
                    {e.amount.toLocaleString()} دج
                  </td>
                  <td className="p-2 text-center border-e border-slate-200">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold">
                      {e.paymentMethod}
                    </span>
                  </td>
                  <td className="p-2 text-center border-e border-slate-200 font-mono text-slate-600 text-[11px]">
                    {e.voucher}
                  </td>
                  <td className="p-2 text-center print:hidden">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        className="text-slate-400 hover:text-slate-700 p-1"
                        title="تعديل السند"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(e.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="حذف السند"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
            <tr>
              <td colSpan={3} className="p-2 text-start border-e border-slate-200">
                إجمالي المصروف لشهر ({RAWDA_MONTHS.find((m) => m.id === selectedMonth)?.nameAr})
              </td>
              <td className="p-2 text-end border-e border-slate-200 font-mono text-sm text-rose-800">
                {totalMonthlyExpense.toLocaleString()} دج
              </td>
              <td colSpan={3} className="p-2 text-slate-500 text-[11px]">
                {filteredExpenses.length} سند صرف مقيد
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
              <span className="font-bold text-slate-900 text-sm">تسجيل سند صرف جديد</span>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">التاريخ *</label>
                <input
                  type="date"
                  required
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">التعيين / بيان النفقة *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شراء صابون ومواد تعقيم صحية"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المبلغ (دج) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="5000"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">رقم السند / الفاتورة</label>
                  <input
                    type="text"
                    placeholder="VCH-EXP-..."
                    value={newExpense.voucher}
                    onChange={(e) => setNewExpense({ ...newExpense, voucher: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">طريقة الدفع</label>
                <select
                  value={newExpense.paymentMethod}
                  onChange={(e) => setNewExpense({ ...newExpense, paymentMethod: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                >
                  <option value="نقداً (صندوق)">نقداً (صندوق الروضة)</option>
                  <option value="صك بنكي">صك بنكي (حساب الروضة)</option>
                  <option value="تحويل CCP">تحويل بريدي CCP</option>
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
