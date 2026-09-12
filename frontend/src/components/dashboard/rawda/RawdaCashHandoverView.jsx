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
import { MOCK_RAWDA_CASH_HANDOVER } from '../../../mock/rawdaMockData';

export function RawdaCashHandoverView() {
  const [handovers, setHandovers] = useState(MOCK_RAWDA_CASH_HANDOVER);
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

  // 1. KPI Calculations (Section 2.6)
  const totalDelivered = handovers.reduce((acc, h) => acc + h.amount, 0);
  const vouchersCount = handovers.length;
  const lastHandover = handovers[handovers.length - 1];

  const kpiCards = [
    {
      label: 'إجمالي السيولة النقدية المسلّمة',
      value: `${totalDelivered.toLocaleString()} دج`,
      icon: ArrowLeftRight,
      subtext: 'محولة ومودعة بالخزينة المركزية',
      change: '100% مؤكد',
      isPositive: true,
    },
    {
      label: 'عدد سندات التسليم والترحيل',
      value: `${vouchersCount} سندات`,
      icon: FileCheck,
      subtext: 'وصولات رسمية موقعة ومختومة',
      change: 'منتظم',
      isPositive: true,
    },
    {
      label: 'آخر عملية تسليم معتمدة',
      value: lastHandover ? `${lastHandover.amount.toLocaleString()} دج` : '0 دج',
      icon: Calendar,
      subtext: lastHandover ? `بتاريخ ${lastHandover.date}` : '-',
      change: 'الأحدث',
      isPositive: true,
    },
    {
      label: 'المسؤول المعتمد للاستلام',
      value: 'الإدارة العامة',
      icon: ShieldCheck,
      subtext: 'المدير العام / المسؤول المالي',
      change: 'معتمد رسمياً',
      isPositive: true,
    },
  ];

  // 2. Filter Handovers
  const filteredHandovers = useMemo(() => {
    return handovers.filter((h) => {
      const matchSearch =
        h.receiverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.notes.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [handovers, searchTerm]);

  // 3. Add Handover with Unique Receipt Validation (Section 4.1)
  const handleSaveHandover = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!newHandover.receiptNumber.trim()) {
      setErrorMessage('يرجى إدخال رقم الوصل المالي للسند');
      return;
    }

    // Section 4.1: منع تكرار رقم الوصل نهائياً داخل السنة المالية الواحدة
    const isDuplicate = handovers.some(
      (h) => h.receiptNumber.toLowerCase() === newHandover.receiptNumber.trim().toLowerCase()
    );
    if (isDuplicate) {
      setErrorMessage(`خطأ في التحقق المالي: رقم الوصل (${newHandover.receiptNumber}) مكرر ومسجل مسبقاً في النظام.`);
      return;
    }

    const entry = {
      id: `hnd-${Date.now()}`,
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

  const handleOpenVoucherModal = (h) => {
    setSelectedVoucher({
      receiptNumber: h.receiptNumber,
      payerName: 'روضة وحضانة الأطفال العباقرة',
      category: 'تسليم وترحيل عهدة نقدية',
      amount: h.amount,
      paymentMethod: 'تحويل نقدي للإدارة المركزية',
      branch: 'الخزينة المركزية',
      date: h.date,
      notes: `المستلم: ${h.receiverName} - ${h.notes}`,
    });
  };

  return (
    <StandardViewLayout
      titleAr="سجل تسليم السيولة والعهد"
      titleEn="Rawda Cash Custody & Safe Handover Registry"
      description="توثيق محاضر وسندات ترحيل وتسليم السيولة النقدية اليومية من صندوق الروضة إلى الإدارة المركزية أو الحساب البنكي، مع تطبيق قواعد منع تكرار رقم الوصل نهائياً."
      entityTag="حركة الخزينة والسيولة"
      branchCode="RAWDA"
      kpiCards={kpiCards}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="ابحث برقم الوصل، اسم المستلم أو الملاحظات..."
      actionButtonLabel="+ تسليم عهدة جديدة"
      onActionButtonClick={() => setIsModalOpen(true)}
      exportFileName="rawda_cash_handover"
      exportData={filteredHandovers.map((h) => ({
        'التاريخ': h.date,
        'رقم الوصل': h.receiptNumber,
        'المبلغ المسلم (دج)': h.amount,
        'اسم المستلم': h.receiverName,
        'ملاحظات': h.notes,
      }))}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-start text-xs border-collapse">
          <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold select-none">
            <tr>
              <th className="p-2.5 text-center border-e border-slate-200 w-12">#</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[110px]">التاريخ</th>
              <th className="p-2.5 text-center border-e border-slate-200 min-w-[140px]">رقم الوصل المعتمد</th>
              <th className="p-2.5 text-end border-e border-slate-200 min-w-[140px]">المبلغ المسلّم (دج)</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[180px]">اسم المستلم(ة)</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[280px]">الملاحظات وتفاصيل السند</th>
              <th className="p-2.5 text-center min-w-[90px] print:hidden">الإجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {filteredHandovers.map((h, index) => (
              <tr key={h.id} className="hover:bg-blue-50/40 transition-colors">
                <td className="p-2.5 text-center border-e border-slate-200 font-mono text-slate-400 font-bold">
                  {index + 1}
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
                    onClick={() => handleOpenVoucherModal(h)}
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
                المجموع العام للسيولة المنقولة للإدارة
              </td>
              <td className="p-2.5 text-end border-e border-slate-200 text-emerald-800 text-sm font-bold">
                {totalDelivered.toLocaleString()} دج
              </td>
              <td colSpan={3} className="p-2.5 text-start font-sans text-[11px] text-slate-500">
                {handovers.length} سندات تسليم مؤكدة
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
                <label className="block text-slate-700 font-semibold mb-1">تاريخ التحويل *</label>
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
                  رقم الوصل المالي الفريد * <span className="text-slate-400 font-normal">(يمنع التكرار نهائياً)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="REC-HDV-RWD-..."
                  value={newHandover.receiptNumber}
                  onChange={(e) => setNewHandover({ ...newHandover, receiptNumber: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">المبلغ المسلّم (دج) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="40000"
                  value={newHandover.amount}
                  onChange={(e) => setNewHandover({ ...newHandover, amount: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono font-bold text-emerald-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">اسم المستلم(ة) *</label>
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
                <label className="block text-slate-700 font-semibold mb-1">ملاحظات ومرجع الإيداع</label>
                <textarea
                  rows="2"
                  placeholder="تفاصيل السند أو مرجع التحويل..."
                  value={newHandover.notes}
                  onChange={(e) => setNewHandover({ ...newHandover, notes: e.target.value })}
                  className="w-full p-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
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
                  تسجيل السند واعتماده
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
