import React from 'react';
import { X, Printer, ShieldCheck, CheckCircle2, AlertOctagon, QrCode } from 'lucide-react';

export function ArabicCashReceiptModal({ isOpen, onClose, voucherData }) {
  if (!isOpen || !voucherData) return null;

  const handlePrint = () => {
    window.print();
  };

  const isVoided = voucherData.status === 'VOIDED';

  // Format currency in Algerian Dinars
  const formatDZD = (num) => {
    const val = Number(num) || 0;
    return val.toLocaleString('ar-DZ') + ' د.ج';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white border-2 border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col print:shadow-none print:border-none my-auto">
        {/* Screen Header (Hidden when printing) */}
        <div className="p-3 bg-blue-950 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm tracking-wide">
              سند قبض مالي نقدي متسلسل (Official Cash Voucher)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة السند (A5 / A4)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-300 hover:text-white hover:bg-blue-900 transition-colors rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Canvas */}
        <div className="receipt-printable-canvas p-6 bg-white text-slate-900 text-xs font-arabic">
          {/* Institutional Header */}
          <div className="receipt-header border-b-2 border-slate-900 pb-3 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/assets/branding/logo.webp"
                alt="3abaqira"
                className="w-14 h-14 rounded-full border border-slate-400 object-cover"
              />
              <div>
                <h2 className="font-bold text-base text-blue-950 font-display">
                  منظومة أكاديمية وروضة الأطفال العباقرة
                </h2>
                <p className="text-[11px] text-slate-600 font-medium">
                  {voucherData.branchNameAr || 'المقر الرئيسي - جيجل'} • ولاية جيجل، الجزائر
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  سجل المؤسسات التعليمية المعتمدة • هاتف الخزينة: 034.47.12.34
                </p>
              </div>
            </div>

            <div className="text-end space-y-1">
              <div className="receipt-number-badge inline-block border-2 border-slate-900 px-3 py-1 bg-slate-50 font-mono font-bold text-sm text-blue-950">
                {voucherData.receiptNumber || 'REC-2026-00001'}
              </div>
              <p className="text-[11px] text-slate-600 font-mono">
                التاريخ: {voucherData.date || new Date().toISOString().split('T')[0]}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                السنة المالية: 2026 / 2027
              </p>
            </div>
          </div>

          {/* Void watermark banner if cancelled */}
          {isVoided && (
            <div className="my-2 p-2 bg-red-100 border-2 border-red-600 text-red-800 text-center font-bold text-sm flex items-center justify-center gap-2">
              <AlertOctagon className="w-5 h-5 text-red-700" />
              <span>هذا السند ملغى رسمياً في النظام وموثق في سجل الرقابة المالي</span>
            </div>
          )}

          {/* Title Bar */}
          <div className="text-center my-3 py-1.5 bg-slate-100 border-y border-slate-300">
            <h3 className="font-bold text-sm text-slate-900">
              وصل سداد وقبض مالي نقدي (Cash Receipt Voucher)
            </h3>
            <span className="text-[10px] text-slate-500">
              رقم التسلسل المالي المركزي الموحد • خزينة الفرع
            </span>
          </div>

          {/* Grid Metadata */}
          <div className="receipt-grid grid grid-cols-2 gap-2 text-xs p-2 border border-slate-300 bg-slate-50/50">
            <div className="p-2 border border-slate-200 bg-white">
              <span className="text-slate-500 block text-[10px]">استلمنا من السيد(ة) / ولي الأمر:</span>
              <strong className="text-slate-950 text-sm block mt-0.5">
                {voucherData.payerName || voucherData.guardianName || 'ولي الأمر'}
              </strong>
            </div>

            <div className="p-2 border border-slate-200 bg-white">
              <span className="text-slate-500 block text-[10px]">لحساب التلميذ(ة) المستفيد:</span>
              <strong className="text-slate-950 text-sm block mt-0.5">
                {voucherData.studentName || voucherData.fullNameAr || 'التلميذ المسجل'}
              </strong>
            </div>

            <div className="p-2 border border-slate-200 bg-white">
              <span className="text-slate-500 block text-[10px]">النشاط أو الفوج الدراسي:</span>
              <strong className="text-slate-900 block mt-0.5">
                {voucherData.category || voucherData.program || 'اشتراك تعليمي'}
              </strong>
            </div>

            <div className="p-2 border border-slate-200 bg-white">
              <span className="text-slate-500 block text-[10px]">طريقة السداد المالي:</span>
              <strong className="text-slate-900 block mt-0.5">
                {voucherData.paymentMethod || 'نقداً بالخزينة (Cash Drawer)'}
              </strong>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="mt-3 border border-slate-300 overflow-hidden">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                  <th className="p-2 text-start">البيان والتفاصيل</th>
                  <th className="p-2 text-center w-28">المبلغ المستحق</th>
                  <th className="p-2 text-center w-28">المبلغ المسدد</th>
                  <th className="p-2 text-center w-28">الرصيد المتبقي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2 text-slate-800">
                    <span className="font-semibold block">{voucherData.periodLabel || 'قسط الاشتراك الدراسي / النشاط'}</span>
                    <span className="text-[10px] text-slate-500">
                      {voucherData.notes || 'تسوية حساب دورية وفق التسعيرة المعتمدة'}
                    </span>
                  </td>
                  <td className="p-2 text-center font-mono">{formatDZD(voucherData.agreedAmount || voucherData.amount || 0)}</td>
                  <td className="p-2 text-center font-mono font-bold text-emerald-800 bg-emerald-50/50">
                    {formatDZD(voucherData.amount || voucherData.totalPaid || 0)}
                  </td>
                  <td className="p-2 text-center font-mono text-slate-700">
                    {formatDZD(voucherData.remainingBalance || 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Amount In Arabic Words Box */}
          <div className="mt-3 p-2.5 bg-slate-50 border border-slate-300 flex items-center justify-between">
            <div>
              <span className="text-slate-500 text-[10px] block">المبلغ الإجمالي المقبوض رقماً وكتابة:</span>
              <p className="font-bold text-slate-900 text-xs mt-0.5">
                {voucherData.amountInWords || 'فقط وقدره المبلغ المذكور أعلاه دينار جزائري نقداً لا غير.'}
              </p>
            </div>
            <div className="text-end">
              <span className="font-mono font-bold text-base text-emerald-700">
                {formatDZD(voucherData.amount || voucherData.totalPaid || 0)}
              </span>
            </div>
          </div>

          {/* Signatures & Seal Section */}
          <div className="receipt-signatures mt-6 pt-4 border-t-2 border-dashed border-slate-300 grid grid-cols-3 gap-4 text-center">
            <div>
              <span className="text-slate-500 text-[10px] block">توقيع ولي الأمر / المودع</span>
              <div className="h-14 mt-1 border-b border-slate-300 flex items-end justify-center pb-1">
                <span className="text-[10px] text-slate-400 font-serif italic">استلمت الوصل الأصلي</span>
              </div>
            </div>

            <div>
              <span className="text-slate-500 text-[10px] block">ختم الخزينة المركزية</span>
              <div className="h-14 mt-1 border-b border-slate-300 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border border-blue-900 text-blue-900 flex flex-col items-center justify-center text-[7px] font-bold p-1 leading-tight rotate-[-6deg]">
                  <span>خزينة المركز</span>
                  <span>معتمد نقداً</span>
                  <span>جيجل 2026</span>
                </div>
              </div>
            </div>

            <div>
              <span className="text-slate-500 text-[10px] block">أمين الصندوق والمحاسب</span>
              <div className="h-14 mt-1 border-b border-slate-300 flex items-end justify-center pb-1">
                <span className="text-xs font-bold text-slate-800">
                  {voucherData.cashierName || 'محمد بوري (المحاسب المسؤول)'}
                </span>
              </div>
            </div>
          </div>

          {/* Legal Footnote */}
          <div className="mt-4 pt-2 border-t border-slate-200 text-center text-[9px] text-slate-400 flex items-center justify-between">
            <span>* هذا الوصل رسمي ومعتمد من إدارة أكاديمية وروضة العباقرة، ويثبت إتمام المعاملة النقدية بنجاح.</span>
            <span className="font-mono">ID: {voucherData.receiptNumber || 'REC-2026-00001'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
