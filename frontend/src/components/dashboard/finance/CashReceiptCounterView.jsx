import React, { useState } from 'react';
import {
  Banknote,
  Search,
  Plus,
  Printer,
  Ban,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  UserCheck,
  Calendar,
  FileSpreadsheet,
  Clock,
  Eye,
  Hash,
} from 'lucide-react';
import {
  MOCK_CASH_RECEIPTS,
  MOCK_KG_STUDENTS,
} from '../../../mock/geniusKindergartenFinanceMockData';

export function CashReceiptCounterView() {
  const [receipts, setReceipts] = useState(MOCK_CASH_RECEIPTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, VALID, VOIDED
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [selectedReceiptForVoid, setSelectedReceiptForVoid] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [selectedReceiptForPrint, setSelectedReceiptForPrint] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Collect Payment Form State
  const [newReceipt, setNewReceipt] = useState({
    studentId: '',
    payerName: '',
    amount: '',
    invoiceNumber: 'INV-2026-RWD-00088',
    remarks: 'سداد نقدي مباشر عند شباك الاستقبال',
    cashierStaff: 'فاطمة بن عميروش',
  });

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Next sequential number generator (Gapless per branch/year)
  const generateNextReceiptNumber = () => {
    const nextSeq = receipts.length + 101;
    return `REC-2026-RWD-${String(nextSeq).padStart(5, '0')}`;
  };

  // Create Cash Receipt
  const handleCollectCash = (e) => {
    e.preventDefault();
    const student = MOCK_KG_STUDENTS.find((s) => s.id === newReceipt.studentId);
    if (!student) {
      alert('يرجى اختيار التلميذ');
      return;
    }
    const amountVal = parseFloat(newReceipt.amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      alert('يرجى إدخال مبلغ نقدي صحيح أكبر من الصفر');
      return;
    }

    const created = {
      id: `PAY-2026-RWD-${String(receipts.length + 101)}`,
      receiptNumber: generateNextReceiptNumber(),
      branchId: 'RAWDA',
      year: 2026,
      date: new Date().toLocaleString('ar-DZ', { hour12: false }),
      payerName: newReceipt.payerName || student.guardianName,
      studentName: student.fullNameAr,
      invoiceNumber: newReceipt.invoiceNumber,
      amount: amountVal,
      paymentMethod: 'CASH', // strictly cash only
      cashierStaff: newReceipt.cashierStaff,
      status: 'VALID',
      voidReason: null,
      voidedBy: null,
      voidedAt: null,
      remarks: newReceipt.remarks,
    };

    setReceipts([created, ...receipts]);
    setIsCollectModalOpen(false);
    triggerToast(`تم إصدار الوصل التسلسلي رقم [${created.receiptNumber}] بقيمة ${amountVal.toLocaleString()} دج نقداً.`);
  };

  // Void Receipt with Mandatory Reason (Rule: "a payment can be voided but never deleted; void needs a reason")
  const handleConfirmVoid = (e) => {
    e.preventDefault();
    if (!voidReason.trim() || voidReason.trim().length < 8) {
      alert('قاعدة أمنية إلزامية: يجب كتابة سبب وتبرير مفصل لإلغاء الوصل المالي (Void Reason is mandatory).');
      return;
    }

    setReceipts((prev) =>
      prev.map((r) =>
        r.id === selectedReceiptForVoid.id
          ? {
              ...r,
              status: 'VOIDED',
              voidReason: voidReason,
              voidedBy: 'محمد بوري (المدير العام)',
              voidedAt: new Date().toLocaleString('ar-DZ', { hour12: false }),
            }
          : r
      )
    );

    setIsVoidModalOpen(false);
    setVoidReason('');
    triggerToast(`تم إلغاء الوصل [${selectedReceiptForVoid.receiptNumber}] وتجميد أثره المالي مع بقاء السجل للرقابة.`);
  };

  const filteredReceipts = receipts.filter((r) => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesSearch =
      r.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.studentName.includes(searchQuery) ||
      r.payerName.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const totalValidCash = receipts
    .filter((r) => r.status === 'VALID')
    .reduce((sum, r) => sum + r.amount, 0);
  const totalVoidedCount = receipts.filter((r) => r.status === 'VOIDED').length;
  const validReceiptsCount = receipts.filter((r) => r.status === 'VALID').length;

  return (
    <div className="space-y-3 font-arabic text-slate-800">
      {/* 1. Header & Financial Strip */}
      <div className="bg-white border border-slate-200 p-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 leading-none">
                  شباك وسجل وصولات القبض النقدي (Sequential Cash Receipt Counter)
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                  ترقيم تسلسلي إلزامي بدون فجوات
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                إصدار وصولات الاستلام النقدية المتسلسلة (Gapless per branch/year)، وإلغاء الوصولات الخاطئة مع الاحتفاظ بالأثر الرقابي.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCollectModalOpen(true)}
              className="px-3 py-1 text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white flex items-center gap-1.5 border border-emerald-900 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>قبض نقدي جديد (+ وصل)</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>طباعة يومية المقبوضات</span>
            </button>
          </div>
        </div>

        {/* 4 Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2 bg-emerald-50/50 border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-800 block">إجمالي المقبوضات الصافية</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-emerald-900">
                {totalValidCash.toLocaleString()} دج
              </span>
              <span className="text-[10px] text-emerald-700 font-bold">سيولة نقدية فعلية</span>
            </div>
          </div>
          <div className="p-2 bg-blue-50/50 border border-blue-200">
            <span className="text-[10px] font-bold text-blue-800 block">وصولات القبض الصالحة</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-blue-900">{validReceiptsCount}</span>
              <span className="text-[10px] text-blue-700 font-mono">وصل قانوني</span>
            </div>
          </div>
          <div className="p-2 bg-rose-50/50 border border-rose-200">
            <span className="text-[10px] font-bold text-rose-800 block">الوصولات الملغاة رقابياً (Voided)</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-rose-900">{totalVoidedCount}</span>
              <span className="text-[10px] text-rose-700 font-bold">لا تحذف، تلغى فقط</span>
            </div>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 block">الوصل التالي المتسلسل</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-xs font-mono font-bold text-slate-800">
                {generateNextReceiptNumber()}
              </span>
              <span className="text-[9px] text-slate-500">تسلسل متواصل</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-white border border-slate-200 p-2 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute start-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث برقم الوصل، اسم التلميذ، المسدد..."
              className="w-full ps-8 pe-2 py-1 text-xs border border-slate-200 bg-slate-50/50"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs p-1 border border-slate-200 bg-white font-arabic font-semibold"
          >
            <option value="ALL">كافة الوصولات ({receipts.length})</option>
            <option value="VALID">الوصولات الصالحة ({validReceiptsCount})</option>
            <option value="VOIDED">الوصولات الملغاة رقابياً ({totalVoidedCount})</option>
          </select>
        </div>

        <div className="text-xs text-slate-500">
          طريقة الدفع: <span className="font-bold text-slate-800">نقد فقط (Cash Terminal)</span>
        </div>
      </div>

      {/* 3. Receipts Table */}
      <div className="bg-white border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold select-none">
                <th className="py-2 px-2 text-center border-e border-slate-200 w-10">#</th>
                <th className="py-2 px-2.5 text-start border-e border-slate-200 w-36 bg-blue-50/30">
                  رقم الوصل التسلسلي
                </th>
                <th className="py-2 px-2 text-center border-e border-slate-200">التاريخ والوقت</th>
                <th className="py-2 px-2.5 text-start border-e border-slate-200">المسدد (الولي)</th>
                <th className="py-2 px-2.5 text-start border-e border-slate-200">التلميذ المستفيد</th>
                <th className="py-2 px-2.5 text-end border-e border-slate-200 text-emerald-950 font-bold">
                  المبلغ المقبوض
                </th>
                <th className="py-2 px-2 text-center border-e border-slate-200">أمين الصندوق</th>
                <th className="py-2 px-2 text-center border-e border-slate-200">الحالة الرقابية</th>
                <th className="py-2 px-2 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredReceipts.map((rec, idx) => {
                const isVoided = rec.status === 'VOIDED';
                return (
                  <tr
                    key={rec.id}
                    className={`transition-colors ${
                      isVoided ? 'bg-rose-50/30 opacity-80' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-2 px-2 text-center font-mono text-slate-500 border-e border-slate-200">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-2.5 font-mono font-bold text-blue-950 border-e border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                        <span className={isVoided ? 'line-through text-slate-500' : ''}>
                          {rec.receiptNumber}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center font-mono text-slate-600 border-e border-slate-200 text-[11px]">
                      {rec.date}
                    </td>
                    <td className="py-2 px-2.5 border-e border-slate-200 font-semibold text-slate-800">
                      {rec.payerName}
                    </td>
                    <td className="py-2 px-2.5 border-e border-slate-200 font-bold text-slate-900">
                      {rec.studentName}
                    </td>
                    <td className="py-2 px-2.5 text-end font-mono font-bold border-e border-slate-200 text-sm">
                      <span className={isVoided ? 'line-through text-rose-500' : 'text-emerald-900'}>
                        {rec.amount.toLocaleString()} دج
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center text-slate-700 border-e border-slate-200">
                      {rec.cashierStaff}
                    </td>
                    <td className="py-2 px-2 text-center border-e border-slate-200">
                      {isVoided ? (
                        <div className="flex flex-col items-center">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                            <Ban className="w-3 h-3 text-rose-700" />
                            ملغى رقابياً
                          </span>
                          <span className="text-[9px] text-rose-700 mt-0.5 font-sans" title={rec.voidReason}>
                            {rec.voidReason?.slice(0, 20)}...
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          صالح ومعتمد
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedReceiptForPrint(rec)}
                          className="px-2 py-0.5 text-[10px] font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          معاينة
                        </button>
                        {!isVoided && (
                          <button
                            onClick={() => {
                              setSelectedReceiptForVoid(rec);
                              setVoidReason('');
                              setIsVoidModalOpen(true);
                            }}
                            className="px-2 py-0.5 text-[10px] font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center gap-1"
                            title="إلغاء الوصل مع تدوين السبب"
                          >
                            <Ban className="w-3 h-3 text-rose-600" />
                            إلغاء
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Collect Cash Payment Modal */}
      {isCollectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-3">
          <div className="bg-white border border-slate-300 shadow-xl w-full max-w-lg p-4 animate-in fade-in zoom-in-95 font-arabic">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-800" />
                <h3 className="text-sm font-bold text-slate-900">
                  تسجيل وقبض دفعة نقدية جديدة (New Cash Receipt)
                </h3>
              </div>
              <button
                onClick={() => setIsCollectModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCollectCash} className="space-y-3 text-xs">
              <div className="p-2 bg-blue-50 border border-blue-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-blue-800 block">رقم الوصل التسلسلي الآلي (Gapless):</span>
                  <span className="font-mono font-bold text-blue-950 text-sm">
                    {generateNextReceiptNumber()}
                  </span>
                </div>
                <span className="text-[10px] font-bold bg-white text-blue-900 px-2 py-1 border border-blue-200">
                  دفع نقدي حصري
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الطفل / التلميذ *</label>
                <select
                  value={newReceipt.studentId}
                  onChange={(e) => {
                    const stu = MOCK_KG_STUDENTS.find((s) => s.id === e.target.value);
                    setNewReceipt({
                      ...newReceipt,
                      studentId: e.target.value,
                      payerName: stu ? stu.guardianName : '',
                    });
                  }}
                  className="w-full p-1.5 border border-slate-300 bg-white font-arabic focus:border-emerald-800"
                  required
                >
                  <option value="">-- اختر التلميذ من القائمة --</option>
                  {MOCK_KG_STUDENTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullNameAr} ({s.bookNumber}) - الولي: {s.guardianName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم المسدد الفعلي *</label>
                  <input
                    type="text"
                    value={newReceipt.payerName}
                    onChange={(e) => setNewReceipt({ ...newReceipt, payerName: e.target.value })}
                    className="w-full p-1.5 border border-slate-300 font-arabic"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-emerald-900 mb-1">المبلغ المقبوض نقداً (دج) *</label>
                  <input
                    type="number"
                    value={newReceipt.amount}
                    onChange={(e) => setNewReceipt({ ...newReceipt, amount: e.target.value })}
                    placeholder="مثال: 14500"
                    className="w-full p-1.5 border border-emerald-400 font-mono font-bold text-emerald-900 text-sm focus:border-emerald-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">البيان والملاحظات</label>
                <input
                  type="text"
                  value={newReceipt.remarks}
                  onChange={(e) => setNewReceipt({ ...newReceipt, remarks: e.target.value })}
                  className="w-full p-1.5 border border-slate-300 font-arabic"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCollectModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold"
                >
                  تأكيد القبض وإصدار الوصل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Payment Void Modal (Rule Enforcement) */}
      {isVoidModalOpen && selectedReceiptForVoid && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-3">
          <div className="bg-white border-2 border-rose-600 shadow-2xl w-full max-w-md p-4 animate-in fade-in zoom-in-95 font-arabic">
            <div className="flex items-center justify-between border-b border-rose-200 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-700" />
                <h3 className="text-sm font-bold text-rose-950">إلغاء وصل مالي رقابياً (Payment Void)</h3>
              </div>
              <button
                onClick={() => setIsVoidModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmVoid} className="space-y-3 text-xs">
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-950 space-y-1">
                <div className="flex justify-between">
                  <span>رقم الوصل المراد إلغاؤه:</span>
                  <span className="font-mono font-bold">{selectedReceiptForVoid.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>المبلغ المسجل:</span>
                  <span className="font-mono font-bold text-rose-900">
                    {selectedReceiptForVoid.amount.toLocaleString()} دج
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>التلميذ:</span>
                  <span className="font-bold">{selectedReceiptForVoid.studentName}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-rose-950 mb-1">
                  السبب الإلزامي لإلغاء الوصل (Mandatory Void Reason) *
                </label>
                <textarea
                  rows={3}
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="اكتب التبرير الرقابي الدقيق (مثال: خطأ في إدخال المبلغ، تحرير وصل بديل مصحح، تكرار عملية القبض...)"
                  className="w-full p-2 border border-rose-300 font-arabic focus:border-rose-700 bg-rose-50/20"
                  required
                />
                <span className="text-[10px] text-rose-800 mt-1 block">
                  وفق ميثاق النظام: لا يتم حذف أي سجل مالي نهائياً بل يتم تجميده وتوثيق المسؤول وسبب الإلغاء.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsVoidModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 font-semibold"
                >
                  تراجع
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold"
                >
                  تأكيد الإلغاء الرقابي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Printable Cash Receipt Modal */}
      {selectedReceiptForPrint && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-3">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-lg p-5 font-arabic animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3 print:hidden">
              <span className="text-xs font-bold text-slate-700">معاينة وصل الاستلام النقدي</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-2.5 py-1 text-xs font-bold bg-blue-900 text-white flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة الوصل</span>
                </button>
                <button
                  onClick={() => setSelectedReceiptForPrint(null)}
                  className="text-slate-400 hover:text-slate-700 font-mono"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Official Receipt Voucher Document */}
            <div className="border-2 border-dashed border-slate-800 p-4 space-y-3 text-xs text-slate-900">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <h2 className="text-sm font-bold text-blue-950">مؤسسة العباقرة — روضة وحضانة الأطفال</h2>
                  <p className="text-[10px] text-slate-600 font-mono">فرع جيجل المركزي • وصل استلام نقدي رسمي</p>
                </div>
                <div className="text-end font-mono">
                  <span className="font-bold text-slate-900 block">{selectedReceiptForPrint.receiptNumber}</span>
                  <span className="text-[10px] text-slate-500">{selectedReceiptForPrint.date}</span>
                </div>
              </div>

              {selectedReceiptForPrint.status === 'VOIDED' && (
                <div className="p-1.5 bg-rose-100 text-rose-900 font-bold text-center border border-rose-300">
                  تنبيه: هذا الوصل ملغى رسمياً في المنظومة — لا يعتد به مالياً
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-600">استلمنا من السيد(ة):</span>
                  <span className="font-bold">{selectedReceiptForPrint.payerName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-600">لصالح التلميذ(ة):</span>
                  <span className="font-bold">{selectedReceiptForPrint.studentName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-600">المبلغ المقبوض نقداً:</span>
                  <span className="font-mono font-bold text-base text-emerald-900">
                    {selectedReceiptForPrint.amount.toLocaleString()} دج
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-600">البيان:</span>
                  <span>{selectedReceiptForPrint.remarks}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 block">توقيع المسدد:</span>
                </div>
                <div className="text-end">
                  <span className="text-[10px] text-slate-500 block">أمين الصندوق:</span>
                  <span className="font-semibold text-[11px]">{selectedReceiptForPrint.cashierStaff}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-12 end-4 z-50 bg-blue-950 text-white px-3.5 py-2 text-xs shadow-xl border border-blue-800 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
