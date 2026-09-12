import React, { useState } from 'react';
import {
  Coins,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  Plus,
  Calendar,
  X,
} from 'lucide-react';
import { StandardViewLayout } from '../common/StandardViewLayout';
import { MOCK_RAWDA_CASH_DRAWER } from '../../../mock/rawdaMockData';

export function RawdaCashDrawerView() {
  const [drawerRecords, setDrawerRecords] = useState(MOCK_RAWDA_CASH_DRAWER);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRecord, setNewRecord] = useState({
    date: new Date().toISOString().split('T')[0],
    openingBalance: '',
    income: '',
    expenses: '',
    delivered: '',
  });

  // 1. KPI Calculations (Section 2.5)
  const latestRecord = drawerRecords[drawerRecords.length - 1] || {};
  const currentCashInDrawer = latestRecord.finalBalance || 14400;
  const totalIncomeAll = drawerRecords.reduce((acc, r) => acc + r.income, 0);
  const totalExpensesAll = drawerRecords.reduce((acc, r) => acc + r.expenses, 0);
  const totalDeliveredAll = drawerRecords.reduce((acc, r) => acc + r.delivered, 0);

  const kpiCards = [
    {
      label: 'الرصيد المرحل بالصندوق اليوم',
      value: `${currentCashInDrawer.toLocaleString()} دج`,
      icon: Coins,
      subtext: 'جاهز لمصادقة إغلاق يوم العمل',
      change: 'مطابق ✓',
      isPositive: true,
    },
    {
      label: 'إجمالي المداخيل النقدية',
      value: `${totalIncomeAll.toLocaleString()} دج`,
      icon: ArrowDownRight,
      subtext: 'حقوق التسجيل والاشتراكات المقبوضة',
      change: '+100% نقداً',
      isPositive: true,
    },
    {
      label: 'إجمالي المصاريف المقتطعة',
      value: `${totalExpensesAll.toLocaleString()} دج`,
      icon: ArrowUpRight,
      subtext: 'مشتريات ونثريات المطبخ والروضة',
      change: 'مسندة بفواتير',
      isPositive: false,
    },
    {
      label: 'السيولة المسلّمة للإدارة العامة',
      value: `${totalDeliveredAll.toLocaleString()} دج`,
      icon: ShieldCheck,
      subtext: 'مرحلة بوصل تسليم رسمي للخزينة',
      change: 'محولة بالكامل',
      isPositive: true,
    },
  ];

  // 2. Add reconciliation record
  const handleAddRecord = (e) => {
    e.preventDefault();
    const open = Number(newRecord.openingBalance) || 0;
    const inc = Number(newRecord.income) || 0;
    const exp = Number(newRecord.expenses) || 0;
    const del = Number(newRecord.delivered) || 0;
    const finalBal = open + inc - exp - del;

    const entry = {
      id: `drw-${Date.now()}`,
      date: newRecord.date,
      openingBalance: open,
      income: inc,
      expenses: exp,
      delivered: del,
      finalBalance: finalBal,
    };

    setDrawerRecords([...drawerRecords, entry]);
    setIsModalOpen(false);
    setNewRecord({
      date: new Date().toISOString().split('T')[0],
      openingBalance: '',
      income: '',
      expenses: '',
      delivered: '',
    });
  };

  return (
    <StandardViewLayout
      titleAr="الملخص اليومي للصندوق"
      titleEn="Rawda Daily Cash Register Reconciliation"
      description="مطابقة حركة الصندوق والسيولة في نهاية كل يوم عمل، تسجيل المداخيل النقدية، المصاريف اليومية المقتطعة، والسيولة المسلمة للإدارة مع ترحيل الرصيد تلقائياً."
      entityTag="حركة الخزينة والسيولة"
      branchCode="RAWDA"
      kpiCards={kpiCards}
      actionButtonLabel="+ مطابقة يومية جديدة"
      onActionButtonClick={() => setIsModalOpen(true)}
      exportFileName="rawda_cash_drawer"
      exportData={drawerRecords.map((r) => ({
        'التاريخ': r.date,
        'رصيد الافتتاح': r.openingBalance,
        'المداخيل': r.income,
        'المصاريف': r.expenses,
        'المبلغ المسلّم': r.delivered,
        'الباقي في الصندوق': r.finalBalance,
      }))}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-start text-xs border-collapse">
          <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold select-none">
            <tr>
              <th className="p-2.5 text-center border-e border-slate-200 w-12">#</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[120px]">التاريخ</th>
              <th className="p-2.5 text-end border-e border-slate-200 min-w-[130px]">رصيد الافتتاح</th>
              <th className="p-2.5 text-end border-e border-slate-200 min-w-[150px] text-emerald-800">
                المداخيل (اشتراكات + تسجيل)
              </th>
              <th className="p-2.5 text-end border-e border-slate-200 min-w-[130px] text-rose-800">
                المصاريف اليومية
              </th>
              <th className="p-2.5 text-end border-e border-slate-200 min-w-[140px] text-blue-900">
                المبلغ المسلّم للإدارة
              </th>
              <th className="p-2.5 text-end border-e border-slate-200 min-w-[150px]">
                الباقي في الصندوق (الرصيد المرحل)
              </th>
              <th className="p-2.5 text-center min-w-[100px]">حالة المطابقة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800 font-mono">
            {drawerRecords.map((r, index) => (
              <tr key={r.id} className="hover:bg-blue-50/40 transition-colors">
                <td className="p-2.5 text-center border-e border-slate-200 text-slate-400 font-bold">
                  {index + 1}
                </td>
                <td className="p-2.5 border-e border-slate-200 font-bold text-slate-900 font-sans">
                  {r.date}
                </td>
                <td className="p-2.5 text-end border-e border-slate-200 text-slate-600">
                  {r.openingBalance.toLocaleString()} دج
                </td>
                <td className="p-2.5 text-end border-e border-slate-200 font-bold text-emerald-700">
                  +{r.income.toLocaleString()} دج
                </td>
                <td className="p-2.5 text-end border-e border-slate-200 font-bold text-rose-700">
                  -{r.expenses.toLocaleString()} دج
                </td>
                <td className="p-2.5 text-end border-e border-slate-200 font-bold text-blue-900">
                  -{r.delivered.toLocaleString()} دج
                </td>
                <td className="p-2.5 text-end border-e border-slate-200 font-bold text-slate-900 bg-slate-50 text-sm">
                  {r.finalBalance.toLocaleString()} دج
                </td>
                <td className="p-2.5 text-center font-sans">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    مطابق ومغلق ✓
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 font-mono">
            <tr>
              <td colSpan={3} className="p-2.5 text-start font-sans text-xs border-e border-slate-200">
                المجموع العام للحركات المسجلة
              </td>
              <td className="p-2.5 text-end border-e border-slate-200 text-emerald-800">
                +{totalIncomeAll.toLocaleString()} دج
              </td>
              <td className="p-2.5 text-end border-e border-slate-200 text-rose-800">
                -{totalExpensesAll.toLocaleString()} دج
              </td>
              <td className="p-2.5 text-end border-e border-slate-200 text-blue-900">
                -{totalDeliveredAll.toLocaleString()} دج
              </td>
              <td className="p-2.5 text-end border-e border-slate-200 text-slate-900 font-bold text-sm bg-slate-200/60">
                {currentCashInDrawer.toLocaleString()} دج
              </td>
              <td className="p-2.5 text-center text-[10px] font-sans text-slate-500">
                {drawerRecords.length} أيام مقفلة
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
              <span className="font-bold text-slate-900 text-sm">مطابقة وإغلاق صندوق يومي</span>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRecord} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">يوم العمل الفعلي *</label>
                <input
                  type="date"
                  required
                  value={newRecord.date}
                  onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">رصيد الافتتاح (دج) *</label>
                  <input
                    type="number"
                    required
                    value={newRecord.openingBalance}
                    onChange={(e) => setNewRecord({ ...newRecord, openingBalance: e.target.value })}
                    placeholder="15000"
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المداخيل اليومية (دج) *</label>
                  <input
                    type="number"
                    required
                    value={newRecord.income}
                    onChange={(e) => setNewRecord({ ...newRecord, income: e.target.value })}
                    placeholder="35000"
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono font-bold text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المصاريف اليومية (دج) *</label>
                  <input
                    type="number"
                    required
                    value={newRecord.expenses}
                    onChange={(e) => setNewRecord({ ...newRecord, expenses: e.target.value })}
                    placeholder="6500"
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono font-bold text-rose-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المبلغ المسلّم للإدارة *</label>
                  <input
                    type="number"
                    required
                    value={newRecord.delivered}
                    onChange={(e) => setNewRecord({ ...newRecord, delivered: e.target.value })}
                    placeholder="30000"
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono font-bold text-blue-900"
                  />
                </div>
              </div>

              {/* Real-time formula preview */}
              <div className="p-2.5 bg-blue-50 border border-blue-200 font-sans">
                <span className="text-[10px] text-slate-500 block">المعادلة: رصيد الافتتاح + المداخيل - المصاريف - المسلّم</span>
                <div className="flex items-center justify-between mt-1 text-xs">
                  <span className="font-semibold text-slate-700">الباقي المرحل في الصندوق:</span>
                  <strong className="font-mono text-sm text-slate-900 font-bold">
                    {(
                      (Number(newRecord.openingBalance) || 0) +
                      (Number(newRecord.income) || 0) -
                      (Number(newRecord.expenses) || 0) -
                      (Number(newRecord.delivered) || 0)
                    ).toLocaleString()}{' '}
                    دج
                  </strong>
                </div>
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
                  اعتماد المطابقة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </StandardViewLayout>
  );
}
