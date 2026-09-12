import React, { useState } from 'react';
import {
  Coins,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  ShieldCheck,
  Building2,
  X,
  FileCheck,
} from 'lucide-react';
import { MOCK_HANDOVERS } from '../../mock/mockData';

export function HandoversView() {
  const [handovers, setHandovers] = useState(MOCK_HANDOVERS);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [form, setForm] = useState({
    branch_id: 'CENTER',
    amount: '',
    received_by_name: 'محمد بوري (الخزينة المركزية)',
    transferred_by: 'سارة منصوري',
    remarks: '',
  });

  const totalRemitted = handovers
    .filter((h) => h.status === 'CONFIRMED')
    .reduce((acc, h) => acc + h.amount, 0);

  const pendingRemitted = handovers
    .filter((h) => h.status === 'PENDING')
    .reduce((acc, h) => acc + h.amount, 0);

  const handleCreateHandover = (e) => {
    e.preventDefault();
    const amt = parseFloat(form.amount) || 0;
    if (amt <= 0) return;

    const newHnd = {
      handover_id: Date.now(),
      receipt_voucher_no: `HND-${form.branch_id}-2026-${Date.now().toString().slice(-5)}`,
      branch_id: form.branch_id,
      amount: amt,
      handover_date: new Date().toISOString().substring(0, 16).replace('T', ' '),
      received_by_name: form.received_by_name,
      transferred_by: form.transferred_by,
      status: 'CONFIRMED',
      remarks: form.remarks || 'تسليم سيولة يومية مصادق عليها',
    };

    setHandovers([newHnd, ...handovers]);
    setIsModalOpen(false);
    setForm({ branch_id: 'CENTER', amount: '', received_by_name: 'محمد بوري (الخزينة المركزية)', transferred_by: 'سارة منصوري', remarks: '' });
  };

  const confirmHandover = (id) => {
    setHandovers((prev) =>
      prev.map((h) => (h.handover_id === id ? { ...h, status: 'CONFIRMED' } : h))
    );
  };

  return (
    <div className="space-y-3 font-arabic">
      {/* 1. Header */}
      <div className="bg-white border border-slate-300 p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="eyebrow flex items-center gap-1.5 text-blue-900">
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>ترحيل السيولة النقدية وأمانات الخزينة</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold font-serif text-slate-900 mt-0.5">
            سجل تسليم السيولة والترحيل للخزينة (Cash Handovers & Safe Remittance)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            توثيق حركات تسليم مبالغ الصناديق اليومية من أمناء الصندوق والمشرفين إلى الخزينة الآمنة مع مطابقة الأرصدة.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="button button-primary text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>تسجيل أمر تسليم سيولة</span>
        </button>
      </div>

      {/* 2. Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="bg-white border border-slate-300 p-3 border-s-4 border-s-emerald-700 shadow-xs">
          <span className="eyebrow">CONFIRMED REMITTED TO SAFE</span>
          <div className="text-xl font-bold font-mono text-emerald-800 mt-1">
            {totalRemitted.toLocaleString()} دج
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            مبالغ مستلمة ومطابقة في الخزينة المركزية
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-3 border-s-4 border-s-amber-600 shadow-xs">
          <span className="eyebrow">PENDING CONFIRMATION</span>
          <div className="text-xl font-bold font-mono text-amber-800 mt-1">
            {pendingRemitted.toLocaleString()} دج
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            سيولة قيد الاستلام والتوقيع
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-3 border-s-4 border-s-blue-900 shadow-xs">
          <span className="eyebrow">TOTAL TRANSFERS</span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {handovers.length} عمليات تسليم
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            سجلات ترحيل رقمية ومشفوعة بأرقام السندات
          </div>
        </div>
      </div>

      {/* 3. Table */}
      <div className="bg-white border border-slate-300 shadow-xs">
        <div className="overflow-x-auto">
          <table className="excel-table text-xs">
            <thead>
              <tr>
                <th className="excel-th p-2 text-center w-36">رقم سند التسليم</th>
                <th className="excel-th p-2 text-center">المقر المصدر</th>
                <th className="excel-th p-2 text-center">المبلغ المحول</th>
                <th className="excel-th p-2 text-center">تاريخ ووقت التسليم</th>
                <th className="excel-th p-2 text-start">القائم بالتحويل (أمين الصندوق)</th>
                <th className="excel-th p-2 text-start">المستلم (الخزينة المركزية)</th>
                <th className="excel-th p-2 text-center">حالة المطابقة</th>
                <th className="excel-th p-2 text-start">ملاحظات التحويل</th>
                <th className="excel-th p-2 text-center w-24">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {handovers.map((h) => (
                <tr key={h.handover_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="excel-td p-2 text-center font-mono font-bold text-blue-900">
                    {h.receipt_voucher_no}
                  </td>
                  <td className="excel-td p-2 text-center font-semibold text-slate-700">
                    {h.branch_id}
                  </td>
                  <td className="excel-td p-2 text-center font-mono font-bold text-slate-900">
                    {h.amount.toLocaleString()} دج
                  </td>
                  <td className="excel-td p-2 text-center font-mono text-slate-600">
                    {h.handover_date}
                  </td>
                  <td className="excel-td p-2 text-slate-900 font-medium">
                    {h.transferred_by}
                  </td>
                  <td className="excel-td p-2 text-slate-800">
                    {h.received_by_name}
                  </td>
                  <td className="excel-td p-2 text-center">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 border ${
                        h.status === 'CONFIRMED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}
                    >
                      {h.status === 'CONFIRMED' ? 'مطابق ومستلم' : 'قيد الاستلام'}
                    </span>
                  </td>
                  <td className="excel-td p-2 text-slate-500 text-[11px]">
                    {h.remarks}
                  </td>
                  <td className="excel-td p-2 text-center">
                    {h.status === 'PENDING' ? (
                      <button
                        onClick={() => confirmHandover(h.handover_id)}
                        className="button text-[10px] h-6 px-1.5 bg-emerald-50 text-emerald-800 border-emerald-300"
                      >
                        <FileCheck className="w-3 h-3" />
                        <span>تأكيد الاستلام</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono">مؤكد</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="excel-status-bar p-2 text-slate-600 flex items-center justify-between text-[11px]">
          <span>إجمالي عمليات الترحيل: <strong>{handovers.length}</strong></span>
          <span className="text-slate-600 font-medium">عمليات ترحيل موثقة ومصادق عليها</span>
        </div>
      </div>

      {/* Modal: New Handover */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-3 select-none">
          <div className="bg-white border border-slate-400 max-w-md w-full shadow-lg">
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-blue-900" />
                <h3 className="font-bold text-sm text-slate-900">
                  أمر تسليم سيولة للخزينة المركزية
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="icon-button w-6 h-6 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateHandover} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="eyebrow block mb-1 text-slate-700">المقر المصدر</label>
                  <select
                    value={form.branch_id}
                    onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                    className="w-full h-8 px-2 text-xs border border-slate-300 bg-white"
                  >
                    <option value="CENTER">CENTER (المركز الأكاديمي)</option>
                    <option value="RAWDA">RAWDA (الروضة)</option>
                  </select>
                </div>

                <div>
                  <label className="eyebrow block mb-1 text-slate-700">المبلغ المسلم (دج) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full h-8 px-2.5 text-xs border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="eyebrow block mb-1 text-slate-700">المستلم في الخزينة</label>
                <input
                  type="text"
                  value={form.received_by_name}
                  onChange={(e) => setForm({ ...form, received_by_name: e.target.value })}
                  className="w-full h-8 px-2.5 text-xs border border-slate-300"
                />
              </div>

              <div>
                <label className="eyebrow block mb-1 text-slate-700">ملاحظات وبيان الترحيل</label>
                <input
                  type="text"
                  placeholder="مثال: تسليم سيولة الإيرادات المسائية..."
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  className="w-full h-8 px-2.5 text-xs border border-slate-300"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="button text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="button button-primary text-xs"
                >
                  تأكيد وإصدار سند التسليم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
