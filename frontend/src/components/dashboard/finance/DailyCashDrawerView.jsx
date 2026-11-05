import React, { useState } from 'react';
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  ArrowLeftRight,
  Plus,
  Printer,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Building,
  Receipt,
  Search,
  Filter,
} from 'lucide-react';
import {
  MOCK_DAILY_EXPENSES,
  MOCK_EXPENSE_CATEGORIES,
  MOCK_SAFE_HANDOVERS,
  MOCK_CASH_RECEIPTS,
} from '../../../mock/geniusKindergartenFinanceMockData';

export function DailyCashDrawerView() {
  const [selectedDate, setSelectedDate] = useState('2026-11-05');
  const [activeTab, setActiveTab] = useState('STATEMENT'); // 'STATEMENT', 'EXPENSES', 'HANDOVERS'
  const [expenses, setExpenses] = useState(MOCK_DAILY_EXPENSES);
  const [handovers, setHandovers] = useState(MOCK_SAFE_HANDOVERS);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Expense Form State
  const [expenseForm, setExpenseForm] = useState({
    categoryId: 'CAT-KITCHEN',
    amount: '',
    beneficiary: '',
    notes: '',
  });

  // Handover Form State
  const [handoverForm, setHandoverForm] = useState({
    amount: '',
    recipientStaff: 'محمد بوري (المدير المالي العام)',
    notes: 'تحويل سيولة نقدية فائضة لخزينة الإدارة المركزية',
  });

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Opening Drawer balance for the day (DA)
  const openingBalance = 45000;

  // Live Calculations (Derived, never stored per report spec)
  const totalDailyIncome = MOCK_CASH_RECEIPTS
    .filter((r) => r.status === 'VALID')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalDailyExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalDailyHandovers = handovers.reduce((sum, h) => sum + h.amount, 0);

  // Running balance = Opening + Income - Expenses - Handovers
  const runningDrawerBalance = openingBalance + totalDailyIncome - totalDailyExpenses - totalDailyHandovers;

  // Add Expense
  const handleAddExpense = (e) => {
    e.preventDefault();
    const amountVal = parseFloat(expenseForm.amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      alert('يرجى إدخال مبلغ صحيح');
      return;
    }
    const category = MOCK_EXPENSE_CATEGORIES.find((c) => c.id === expenseForm.categoryId);
    const created = {
      id: `EXP-20261105-${String(expenses.length + 1).padStart(2, '0')}`,
      branchId: 'RAWDA',
      date: selectedDate,
      categoryId: expenseForm.categoryId,
      categoryName: category?.nameAr || 'مصروف عام',
      amount: amountVal,
      voucherNumber: `EXP-VCH-2026-${String(expenses.length + 415)}`,
      beneficiary: expenseForm.beneficiary,
      authorStaff: 'فاطمة بن عميروش (أمينة الصندوق)',
      notes: expenseForm.notes,
    };
    setExpenses([created, ...expenses]);
    setIsExpenseModalOpen(false);
    setExpenseForm({ categoryId: 'CAT-KITCHEN', amount: '', beneficiary: '', notes: '' });
    triggerToast(`تم تسجيل وصل المصروف رقم [${created.voucherNumber}] بقيمة ${amountVal.toLocaleString()} دج.`);
  };

  // Add Safe Handover
  const handleAddHandover = (e) => {
    e.preventDefault();
    const amountVal = parseFloat(handoverForm.amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      alert('يرجى إدخال مبلغ صحيح');
      return;
    }
    if (amountVal > runningDrawerBalance) {
      alert('تنبيه: المبلغ المراد تسليمه يتجاوز السيولة النقدية المتوفرة حالياً في الصندوق!');
      return;
    }

    const created = {
      id: `HND-20261105-${String(handovers.length + 1).padStart(2, '0')}`,
      handoverNumber: `HND-2026-RWD-${String(handovers.length + 56).padStart(4, '0')}`,
      branchId: 'RAWDA',
      date: `${selectedDate} ${new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}`,
      amount: amountVal,
      cashierStaff: 'فاطمة بن عميروش (أمينة الصندوق)',
      recipientStaff: handoverForm.recipientStaff,
      status: 'CONFIRMED',
      notes: handoverForm.notes,
      signatureReference: `SIG-VERIFIED-MB-${String(handovers.length + 56)}`,
    };
    setHandovers([created, ...handovers]);
    setIsHandoverModalOpen(false);
    setHandoverForm({ amount: '', recipientStaff: 'محمد بوري (المدير المالي العام)', notes: '' });
    triggerToast(`تم تحرير سند تسليم السيولة رقم [${created.handoverNumber}] بقيمة ${amountVal.toLocaleString()} دج.`);
  };

  return (
    <div className="space-y-3 font-arabic text-slate-800">
      {/* 1. Header & Live Running Balance Strip */}
      <div className="bg-white border border-slate-200 p-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 leading-none">
                  حركة الصندوق اليومي وتسليم السيولة (Daily Cash Drawer & Handovers)
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 font-bold">
                  أرصدة محتسبة ديناميكياً (Derived, Never Stored)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                إدارة المصاريف المبوبة، وسندات تسليم العهد النقدية للمقر المركزي، والملخص المالي الآني لحركة السيولة اليومية.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-mono font-bold bg-white border border-slate-300 px-2 py-1"
            />
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="px-2.5 py-1 text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white flex items-center gap-1 border border-rose-800 shadow-2xs"
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>تسجيل مصروف</span>
            </button>
            <button
              onClick={() => setIsHandoverModalOpen(true)}
              className="px-2.5 py-1 text-xs font-bold bg-blue-900 hover:bg-blue-950 text-white flex items-center gap-1 border border-blue-950 shadow-2xs"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>تسليم سيولة للعهدة</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-2 py-1 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>طباعة اليومية</span>
            </button>
          </div>
        </div>

        {/* 4 Financial Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2 bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 block">رصيد بداية اليوم (افتتاح الصندوق)</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-slate-900">
                {openingBalance.toLocaleString()} دج
              </span>
              <span className="text-[10px] text-slate-500">رصيد مدور</span>
            </div>
          </div>
          <div className="p-2 bg-emerald-50/50 border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-800 block">إجمالي المقبوضات النقدية (+)</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-emerald-900">
                +{totalDailyIncome.toLocaleString()} دج
              </span>
              <span className="text-[10px] text-emerald-700 font-bold">وصولات قبض</span>
            </div>
          </div>
          <div className="p-2 bg-rose-50/50 border border-rose-200">
            <span className="text-[10px] font-bold text-rose-800 block">النفقات وتسليم السيولة (-)</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-rose-900">
                -{(totalDailyExpenses + totalDailyHandovers).toLocaleString()} دج
              </span>
              <span className="text-[10px] text-rose-700 font-bold">
                مصاريف ({totalDailyExpenses.toLocaleString()}) + عهدة ({totalDailyHandovers.toLocaleString()})
              </span>
            </div>
          </div>
          <div className="p-2 bg-blue-900 text-white border border-blue-950">
            <span className="text-[10px] font-bold text-blue-200 block">السيولة الصافية الحالية بالصندوق</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-white">
                {runningDrawerBalance.toLocaleString()} دج
              </span>
              <span className="text-[10px] text-blue-200 font-bold">رصيد لحظي</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sub-tab Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('STATEMENT')}
          className={`px-3 py-1.5 text-xs font-bold transition-colors ${
            activeTab === 'STATEMENT'
              ? 'bg-blue-900 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          كشف حركة الصندوق الشامل (Daily Statement)
        </button>
        <button
          onClick={() => setActiveTab('EXPENSES')}
          className={`px-3 py-1.5 text-xs font-bold transition-colors ${
            activeTab === 'EXPENSES'
              ? 'bg-rose-700 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          سجل المصاريف المبوبة ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab('HANDOVERS')}
          className={`px-3 py-1.5 text-xs font-bold transition-colors ${
            activeTab === 'HANDOVERS'
              ? 'bg-blue-800 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          سندات تسليم العهدة للإدارة المركزية ({handovers.length})
        </button>
      </div>

      {/* 3. Conditional Content */}
      {activeTab === 'STATEMENT' && (
        <div className="space-y-3">
          {/* Detailed Statement Table */}
          <div className="bg-white border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">
                كشف التدفقات النقدية ليوم: {selectedDate} (روضة وحضانة العباقرة - فرع جيجل)
              </span>
              <span className="font-mono text-slate-500 font-bold">
                حساب رقم: CSH-BOX-RWD-01
              </span>
            </div>

            <table className="w-full text-start border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 select-none">
                  <th className="py-2 px-2 text-center border-e border-slate-200 w-10">#</th>
                  <th className="py-2 px-2.5 text-start border-e border-slate-200 w-32">نوع الحركة</th>
                  <th className="py-2 px-2 text-center border-e border-slate-200 w-36">رقم السند / الوصل</th>
                  <th className="py-2 px-2.5 text-start border-e border-slate-200">البيان والتفاصيل</th>
                  <th className="py-2 px-2.5 text-end border-e border-slate-200 text-emerald-800 w-32">
                    المقبوضات (+)
                  </th>
                  <th className="py-2 px-2.5 text-end border-e border-slate-200 text-rose-800 w-32">
                    المدفوعات (-)
                  </th>
                  <th className="py-2 px-2 text-center">المسؤول</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {/* 1. Opening Balance Row */}
                <tr className="bg-slate-50/70 font-sans">
                  <td className="py-2 px-2 text-center font-mono text-slate-500 border-e border-slate-200">1</td>
                  <td className="py-2 px-2.5 border-e border-slate-200 font-bold text-slate-700">رصيد افتتاحي</td>
                  <td className="py-2 px-2 text-center border-e border-slate-200 font-mono text-slate-500">OPEN-DAY</td>
                  <td className="py-2 px-2.5 border-e border-slate-200 text-slate-600">رصيد ترحيل نهاية يوم أمس</td>
                  <td className="py-2 px-2.5 text-end border-e border-slate-200 font-bold text-slate-800 font-mono">
                    {openingBalance.toLocaleString()} دج
                  </td>
                  <td className="py-2 px-2.5 text-end border-e border-slate-200 font-mono text-slate-400">--</td>
                  <td className="py-2 px-2 text-center text-[10px] text-slate-500">النظام الآلي</td>
                </tr>

                {/* 2. Receipts Rows */}
                {MOCK_CASH_RECEIPTS.filter((r) => r.status === 'VALID').map((rec, idx) => (
                  <tr key={rec.id} className="hover:bg-emerald-50/20 font-sans">
                    <td className="py-2 px-2 text-center font-mono text-slate-500 border-e border-slate-200">
                      {idx + 2}
                    </td>
                    <td className="py-2 px-2.5 border-e border-slate-200 text-emerald-800 font-bold">
                      <span className="inline-flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-600" />
                        قبض اشتراك
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center border-e border-slate-200 font-mono font-bold text-blue-900">
                      {rec.receiptNumber}
                    </td>
                    <td className="py-2 px-2.5 border-e border-slate-200 text-slate-800">
                      قبض نقدي من: {rec.payerName} (التلميذ: {rec.studentName})
                    </td>
                    <td className="py-2 px-2.5 text-end border-e border-slate-200 font-bold text-emerald-800 font-mono">
                      +{rec.amount.toLocaleString()} دج
                    </td>
                    <td className="py-2 px-2.5 text-end border-e border-slate-200 font-mono text-slate-400">--</td>
                    <td className="py-2 px-2 text-center text-[10px] text-slate-600">{rec.cashierStaff}</td>
                  </tr>
                ))}

                {/* 3. Expenses Rows */}
                {expenses.map((exp, idx) => (
                  <tr key={exp.id} className="hover:bg-rose-50/20 font-sans">
                    <td className="py-2 px-2 text-center font-mono text-slate-500 border-e border-slate-200">
                      {idx + 6}
                    </td>
                    <td className="py-2 px-2.5 border-e border-slate-200 text-rose-800 font-bold">
                      <span className="inline-flex items-center gap-1">
                        <TrendingDown className="w-3 h-3 text-rose-600" />
                        مصروف تشغيلي
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center border-e border-slate-200 font-mono font-bold text-rose-900">
                      {exp.voucherNumber}
                    </td>
                    <td className="py-2 px-2.5 border-e border-slate-200 text-slate-800">
                      {exp.categoryName} — المستفيد: {exp.beneficiary} ({exp.notes})
                    </td>
                    <td className="py-2 px-2.5 text-end border-e border-slate-200 font-mono text-slate-400">--</td>
                    <td className="py-2 px-2.5 text-end border-e border-slate-200 font-bold text-rose-800 font-mono">
                      -{exp.amount.toLocaleString()} دج
                    </td>
                    <td className="py-2 px-2 text-center text-[10px] text-slate-600">{exp.authorStaff?.split(' ')[0]}</td>
                  </tr>
                ))}

                {/* 4. Handovers Rows */}
                {handovers.map((hnd, idx) => (
                  <tr key={hnd.id} className="hover:bg-blue-50/20 font-sans">
                    <td className="py-2 px-2 text-center font-mono text-slate-500 border-e border-slate-200">
                      {idx + 9}
                    </td>
                    <td className="py-2 px-2.5 border-e border-slate-200 text-blue-900 font-bold">
                      <span className="inline-flex items-center gap-1">
                        <ArrowLeftRight className="w-3 h-3 text-blue-700" />
                        تسليم عهدة
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center border-e border-slate-200 font-mono font-bold text-blue-950">
                      {hnd.handoverNumber}
                    </td>
                    <td className="py-2 px-2.5 border-e border-slate-200 text-slate-800">
                      تسليم سيولة إلى: {hnd.recipientStaff} ({hnd.notes})
                    </td>
                    <td className="py-2 px-2.5 text-end border-e border-slate-200 font-mono text-slate-400">--</td>
                    <td className="py-2 px-2.5 text-end border-e border-slate-200 font-bold text-blue-900 font-mono">
                      -{hnd.amount.toLocaleString()} دج
                    </td>
                    <td className="py-2 px-2 text-center text-[10px] text-slate-600">أمين الصندوق</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-mono font-bold border-t-2 border-slate-300">
                <tr>
                  <td colSpan={4} className="py-2.5 px-3 text-start font-sans text-slate-800">
                    الرصيد الختامي للصندوق في نهاية اليوم (Closing Drawer Balance):
                  </td>
                  <td colSpan={3} className="py-2.5 px-3 text-end text-sm text-blue-950">
                    {runningDrawerBalance.toLocaleString()} دج
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'EXPENSES' && (
        <div className="bg-white border border-slate-200 overflow-hidden shadow-2xs">
          <table className="w-full text-start border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 select-none">
                <th className="py-2 px-2 text-center border-e border-slate-200 w-10">#</th>
                <th className="py-2 px-2 text-center border-e border-slate-200 w-36">رقم سند الصرف</th>
                <th className="py-2 px-2.5 text-start border-e border-slate-200">تبويب النفقة</th>
                <th className="py-2 px-2.5 text-start border-e border-slate-200">المستفيد والجهة</th>
                <th className="py-2 px-2.5 text-end border-e border-slate-200 text-rose-900">المبلغ</th>
                <th className="py-2 px-2.5 text-start border-e border-slate-200">البيان والملاحظات</th>
                <th className="py-2 px-2 text-center">المسؤول عن الصرف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {expenses.map((exp, idx) => (
                <tr key={exp.id} className="hover:bg-slate-50">
                  <td className="py-2 px-2 text-center font-mono text-slate-500 border-e border-slate-200">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-2 text-center font-mono font-bold text-rose-900 border-e border-slate-200">
                    {exp.voucherNumber}
                  </td>
                  <td className="py-2 px-2.5 border-e border-slate-200 font-semibold text-slate-800">
                    {exp.categoryName}
                  </td>
                  <td className="py-2 px-2.5 border-e border-slate-200 text-slate-700 font-medium">
                    {exp.beneficiary}
                  </td>
                  <td className="py-2 px-2.5 text-end font-mono font-bold text-rose-800 border-e border-slate-200">
                    {exp.amount.toLocaleString()} دج
                  </td>
                  <td className="py-2 px-2.5 border-e border-slate-200 text-slate-600">
                    {exp.notes}
                  </td>
                  <td className="py-2 px-2 text-center text-[10px] text-slate-600">
                    {exp.authorStaff}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'HANDOVERS' && (
        <div className="bg-white border border-slate-200 overflow-hidden shadow-2xs">
          <table className="w-full text-start border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 select-none">
                <th className="py-2 px-2 text-center border-e border-slate-200 w-10">#</th>
                <th className="py-2 px-2 text-center border-e border-slate-200 w-36">رقم سند التسليم</th>
                <th className="py-2 px-2 text-center border-e border-slate-200">التاريخ والتوقيت</th>
                <th className="py-2 px-2.5 text-end border-e border-slate-200 text-blue-950 font-bold">المبلغ المسلم</th>
                <th className="py-2 px-2.5 text-start border-e border-slate-200">المسلم (أمين الصندوق)</th>
                <th className="py-2 px-2.5 text-start border-e border-slate-200">المستلم (الإدارة / المقر)</th>
                <th className="py-2 px-2 text-center border-e border-slate-200">حالة الاستلام</th>
                <th className="py-2 px-2.5 text-start">البيان والتوقيع الرقمي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {handovers.map((hnd, idx) => (
                <tr key={hnd.id} className="hover:bg-slate-50">
                  <td className="py-2 px-2 text-center font-mono text-slate-500 border-e border-slate-200">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-2 text-center font-mono font-bold text-blue-900 border-e border-slate-200">
                    {hnd.handoverNumber}
                  </td>
                  <td className="py-2 px-2 text-center font-mono text-slate-600 border-e border-slate-200 text-[11px]">
                    {hnd.date}
                  </td>
                  <td className="py-2 px-2.5 text-end font-mono font-bold text-blue-950 border-e border-slate-200 text-sm">
                    {hnd.amount.toLocaleString()} دج
                  </td>
                  <td className="py-2 px-2.5 border-e border-slate-200 text-slate-700">
                    {hnd.cashierStaff}
                  </td>
                  <td className="py-2 px-2.5 border-e border-slate-200 font-bold text-slate-900">
                    {hnd.recipientStaff}
                  </td>
                  <td className="py-2 px-2 text-center border-e border-slate-200">
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      مستلم ومعتمد
                    </span>
                  </td>
                  <td className="py-2 px-2.5 text-slate-600 text-[11px]">
                    <span className="block">{hnd.notes}</span>
                    <span className="text-[10px] font-mono text-slate-400">{hnd.signatureReference}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Log Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-3 font-arabic">
          <div className="bg-white border border-slate-300 shadow-xl w-full max-w-md p-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-700" />
                <h3 className="text-sm font-bold text-slate-900">تسجيل وتوثيق نفقة تشغيلية جديدة</h3>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">تصنيف النفقة / الباب *</label>
                <select
                  value={expenseForm.categoryId}
                  onChange={(e) => setExpenseForm({ ...expenseForm, categoryId: e.target.value })}
                  className="w-full p-1.5 border border-slate-300 bg-white font-arabic focus:border-rose-800"
                  required
                >
                  {MOCK_EXPENSE_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-rose-900 mb-1">المبلغ المصروف نقداً (دج) *</label>
                <input
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  placeholder="مثال: 5000"
                  className="w-full p-1.5 border border-rose-300 font-mono font-bold text-rose-900 text-sm focus:border-rose-800"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المستفيد / المورد / المحل *</label>
                <input
                  type="text"
                  value={expenseForm.beneficiary}
                  onChange={(e) => setExpenseForm({ ...expenseForm, beneficiary: e.target.value })}
                  placeholder="مثال: مخبزة النور، مكتبة النجاح..."
                  className="w-full p-1.5 border border-slate-300 font-arabic"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">البيان والملاحظات</label>
                <textarea
                  rows={2}
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  placeholder="تفاصيل المشتريات ورقم الفاتورة المرفقة إن وجدت..."
                  className="w-full p-1.5 border border-slate-300 font-arabic"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold"
                >
                  حفظ وخصم من الصندوق
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Safe Handover Modal */}
      {isHandoverModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-3 font-arabic">
          <div className="bg-white border border-slate-300 shadow-xl w-full max-w-md p-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-blue-900" />
                <h3 className="text-sm font-bold text-slate-900">تسليم سيولة نقدية للعهدة / الإدارة المركزية</h3>
              </div>
              <button
                onClick={() => setIsHandoverModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddHandover} className="space-y-3 text-xs">
              <div className="p-2 bg-blue-50 border border-blue-200">
                <span className="text-[10px] text-blue-800 block">السيولة المتاحة حالياً في الصندوق:</span>
                <span className="text-base font-mono font-bold text-blue-950">
                  {runningDrawerBalance.toLocaleString()} دج
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المبلغ المراد تسليمه (دج) *</label>
                <input
                  type="number"
                  value={handoverForm.amount}
                  onChange={(e) => setHandoverForm({ ...handoverForm, amount: e.target.value })}
                  placeholder="مثال: 30000"
                  className="w-full p-1.5 border border-slate-300 font-mono font-bold text-blue-900 text-sm focus:border-blue-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المستلم المعتمد بالإدارة المركزية *</label>
                <input
                  type="text"
                  value={handoverForm.recipientStaff}
                  onChange={(e) => setHandoverForm({ ...handoverForm, recipientStaff: e.target.value })}
                  className="w-full p-1.5 border border-slate-300 font-arabic"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">بيان التسليم</label>
                <textarea
                  rows={2}
                  value={handoverForm.notes}
                  onChange={(e) => setHandoverForm({ ...handoverForm, notes: e.target.value })}
                  className="w-full p-1.5 border border-slate-300 font-arabic"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsHandoverModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-bold"
                >
                  تأكيد التحويل وإصدار السند
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-12 end-4 z-50 bg-blue-950 text-white px-3.5 py-2 text-xs shadow-xl border border-blue-800 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
