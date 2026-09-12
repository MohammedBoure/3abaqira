import React, { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  ShieldCheck,
  FileCheck,
  Calendar,
  Plus,
  X,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { StandardViewLayout } from '../common/StandardViewLayout';
import { ReceiptVoucherModal } from '../common/ReceiptVoucherModal';
import { MOCK_CENTER_CASH_HANDOVER } from '../../../mock/centerMockData';

export function CenterCashHandoverView() {
  const [handovers, setHandovers] = useState(MOCK_CENTER_CASH_HANDOVER);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const [newHandover, setNewHandover] = useState({
    date: new Date().toISOString().split('T')[0],
    receiptNumber: '',
    amount: '',
    receiverName: 'محمد بوري (المدير العام)',
    notes: '',
  });

  // 1. KPI Calculations (Section 3.4.14)
  const totalDelivered = handovers.reduce((acc, h) => acc + h.amount, 0);
  const totalReceipts = handovers.length;
  const lastHandover = handovers[handovers.length - 1];

  const kpiCards = [
    {
      label: 'إجمالي السيولة المحولة للخزينة',
      value: `${totalDelivered.toLocaleString()} دج`,
      icon: ArrowLeftRight,
      subtext: 'مداخيل السوروبان واللغات والدعم',
      change: '100% مودع',
      isPositive: true,
    },
    {
      label: 'عدد وصولات التسليم المعتمدة',
      value: `${totalReceipts} سندات`,
      icon: FileCheck,
      subtext: 'إيصالات رسمية موقعة',
      change: 'منتظم',
      isPositive: true,
    },
    {
      label: 'آخر عملية تسليم مسجلة',
      value: lastHandover ? `${lastHandover.amount.toLocaleString()} دج` : '0 دج',
      icon: Calendar,
      subtext: lastHandover ? `بتاريخ ${lastHandover.date}` : '-',
      change: 'الأحدث',
      isPositive: true,
    },
    {
      label: 'الجهة المشرفة على الاستلام',
      value: 'المدير العام',
      icon: ShieldCheck,
      subtext: 'محمد بوري / صلاح الدين',
      change: 'معتمد',
      isPositive: true,
    },
  ];

  // 2. Filter
  const filteredHandovers = useMemo(() => {
    return handovers.filter((h) => {
      return (
        h.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.receiverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.notes.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [handovers, searchTerm]);

  // 3. Add Handover with Unique Receipt Validation (Section 4.1)
  const handleSaveHandover = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!newHandover.receiptNumber.trim()) {
      setErrorMessage('يرجى كتابة رقم سند التسليم');
      return;
    }

    // Section 4.1: منع تكرار رقم الوصل نهائياً داخل السنة المالية الواحدة
    const isDuplicate = handovers.some(
      (h) => h.receiptNumber.toLowerCase() === newHandover.receiptNumber.trim().toLowerCase()
    );
    if (isDuplicate) {
      setErrorMessage(`رقم السند (${newHandover.receiptNumber}) مسجل مسبقاً! يمنع تكرار أرقام الوصولات.`);
      return;
    }

    const entry = {
      id: `ctr-hd-${Date.now()}`,
      date: newHandover.date,
      receiptNumber: newHandover.receiptNumber.trim(),
      amount: Number(newHandover.amount),
      receiverName: newHandover.receiverName,
      notes: newHandover.notes,
    };

    setHandovers([...handovers, entry]);
    setIsModalOpen(false);
    setNewHandover({
      date: new Date().toISOString().split('T')[0],
      receiptNumber: '',
      amount: '',
      receiverName: 'محمد بوري (المدير العام)',
      notes: '',
    });
  };

  const handleOpenVoucher = (h) => {
    setSelectedVoucher({
      receiptNumber: h.receiptNumber,
      payerName: 'المركز الأكاديمي والتعليمي (مركز بحاية)',
      category: 'تسليم وترحيل سيولة نقدية إلى الإدارة',
      amount: h.amount,
      paymentMethod: 'إيداع نقدي مباشر',
      branch: 'الخزينة المركزية',
      date: h.date,
      notes: `المستلم: ${h.receiverName} - ${h.notes}`,
    });
  };

  return (
    <StandardViewLayout
      titleAr="سجل تسليم العهدة النقدية والسيولة"
      titleEn="Center Cash Custody Handover & Safe Remittance Ledger"
      description="توثيق ومطابقة عمليات تسليم وترحيل الإيرادات النقدية المقبوضة بالمركز إلى الإدارة العامة، مع تطبيق التحقق من فرادة أرقام الوصولات لضمان الانضباط المالي."
      entityTag="الخزينة والنفقات"
      branchCode="CENTER"
      kpiCards={kpiCards}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="ابحث برقم السند، اسم المستلم أو الملاحظات..."
      actionButtonLabel="+ تسجيل تسليم عهدة"
      onActionButtonClick={() => setIsModalOpen(true)}
      exportFileName="center_cash_handover"
      exportData={filteredHandovers.map((h) => ({
        'التاريخ': h.date,
        'رقم السند': h.receiptNumber,
        'المبلغ المسلم (دج)': h.amount,
        'المستلم المشرف': h.receiverName,
        'الملاحظات': h.notes,
      }))}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-start text-xs border-collapse">
          <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold select-none">
            <tr>
              <th className="p-2.5 text-center border-e border-slate-200 w-12">#</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[120px]">التاريخ</th>
              <th className="p-2.5 text-center border-e border-slate-200 min-w-[150px]">رقم سند التسليم</th>
              <th className="p-2.5 text-end border-e border-slate-200 min-w-[140px]">المبلغ المسلم (دج)</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[180px]">اسم المستلم المشرف</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[260px]">الملاحظات</th>
              <th className="p-2.5 text-center min-w-[80px] print:hidden">وصل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {filteredHandovers.map((h, idx) => (
              <tr key={h.id} className="hover:bg-blue-50/40 transition-colors">
                <td className="p-2.5 text-center border-e border-slate-200 font-mono text-slate-400 font-bold">
                  {idx + 1}
                </td>
                <td className="p-2.5 border-e border-slate-200 font-mono text-slate-900 font-medium">
                  {h.date}
                </td>
                <td className="p-2.5 text-center border-e border-slate-200 font-mono font-bold text-blue-900">
                  <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-[2px]">
                    {h.receiptNumber}
                  </span>
                </td>
                <td className="p-2.5 text-end border-e border-slate-200 font-mono font-bold text-emerald-800 text-sm">
                  {h.amount.toLocaleString()} دج
                </td>
                <td className="p-2.5 border-e border-slate-200 font-semibold text-slate-900">
                  {h.receiverName}
                </td>
                <td className="p-2.5 border-e border-slate-200 text-slate-600">
                  {h.notes}
                </td>
                <td className="p-2.5 text-center print:hidden">
                  <button
                    onClick={() => handleOpenVoucher(h)}
                    className="px-2 py-1 bg-slate-100 hover:bg-blue-50 text-blue-900 font-medium text-[10px] flex items-center gap-1 border border-slate-200 transition-colors mx-auto"
                  >
                    <FileText className="w-3 h-3" />
                    <span>معاينة</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 font-mono">
            <tr>
              <td colSpan={3} className="p-2.5 text-start font-sans text-xs border-e border-slate-200">
                المجموع العام للسيولة المحولة
              </td>
              <td className="p-2.5 text-end border-e border-slate-200 text-emerald-800 text-sm font-bold">
                {totalDelivered.toLocaleString()} دج
              </td>
              <td colSpan={3} className="p-2.5 text-start font-sans text-[11px] text-slate-500">
                {handovers.length} سندات ترحيل مؤكدة
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
              <span className="font-bold text-slate-900 text-sm">تسجيل سند تسليم عهدة نقدية</span>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-2 bg-rose-50 border border-rose-300 text-rose-800 flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveHandover} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">تاريخ العملية *</label>
                <input
                  type="date"
                  required
                  value={newHandover.date}
                  onChange={(e) => setNewHandover({ ...newHandover, date: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  رقم سند التسليم الفريد * <span className="text-slate-400 font-normal">(يمنع التكرار)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="CTR-HDV-26-..."
                  value={newHandover.receiptNumber}
                  onChange={(e) => setNewHandover({ ...newHandover, receiptNumber: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">المبلغ المسلم (دج) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="65000"
                  value={newHandover.amount}
                  onChange={(e) => setNewHandover({ ...newHandover, amount: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono font-bold text-emerald-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">اسم المستلم المشرف *</label>
                <select
                  value={newHandover.receiverName}
                  onChange={(e) => setNewHandover({ ...newHandover, receiverName: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                >
                  <option value="محمد بوري (المدير العام)">محمد بوري (المدير العام)</option>
                  <option value="صلاح الدين (المسؤول المالي)">صلاح الدين (المسؤول المالي)</option>
                  <option value="الإيداع المباشر في حساب البنك">الإيداع المباشر في حساب البنك</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ملاحظات التحويل</label>
                <input
                  type="text"
                  placeholder="تفاصيل التوريد أو الإيداع..."
                  value={newHandover.notes}
                  onChange={(e) => setNewHandover({ ...newHandover, notes: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                />
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

      {/* Receipt Modal */}
      <ReceiptVoucherModal
        isOpen={!!selectedVoucher}
        onClose={() => setSelectedVoucher(null)}
        voucherData={selectedVoucher}
      />
    </StandardViewLayout>
  );
}
