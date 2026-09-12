import React from 'react';
import { X, Printer, CheckCircle, ShieldCheck } from 'lucide-react';

export function ReceiptVoucherModal({ isOpen, onClose, voucherData }) {
  if (!isOpen || !voucherData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col print:shadow-none print:border-none">
        {/* Header (Screen only) */}
        <div className="p-3 bg-blue-950 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-xs tracking-wide">معاينة سند القبض / وصل السداد المعتمد</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-2.5 py-1 bg-blue-800 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة السند</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Formal Printable Receipt Canvas */}
        <div className="p-6 bg-white space-y-4 text-slate-800 text-sm">
          {/* Institutional Header */}
          <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/assets/branding/logo.webp"
                alt="3abaqira"
                className="w-12 h-12 rounded-full border border-slate-300 object-cover"
              />
              <div>
                <h2 className="font-bold text-base text-blue-950">منظومة أكاديمية وروضة الأطفال العباقرة</h2>
                <p className="text-[11px] text-slate-500">3abaqira Academy & Daycare - Bejaia Branch</p>
                <p className="text-[10px] text-slate-400 font-mono">الجمهورية الجزائرية الديمقراطية الشعبية</p>
              </div>
            </div>
            <div className="text-end">
              <div className="inline-block border border-blue-900 px-2 py-0.5 bg-blue-50 text-blue-900 font-bold font-mono text-xs">
                {voucherData.receiptNumber || 'REC-OFFICIAL'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">التاريخ: {voucherData.date || new Date().toISOString().split('T')[0]}</p>
            </div>
          </div>

          {/* Voucher Title */}
          <div className="text-center py-1 bg-slate-100 border-y border-slate-200">
            <h3 className="font-bold text-sm text-slate-900">
              وصل استلام وقبض مالي {voucherData.branch ? `(${voucherData.branch})` : ''}
            </h3>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2 border border-slate-200 bg-slate-50">
              <span className="text-slate-500 block text-[10px]">الاسم واللقب للمستفيد:</span>
              <strong className="text-slate-900 text-sm block mt-0.5">{voucherData.payerName || 'مشترك مسجل'}</strong>
            </div>
            <div className="p-2 border border-slate-200 bg-slate-50">
              <span className="text-slate-500 block text-[10px]">النشاط / الفوج:</span>
              <strong className="text-slate-900 text-sm block mt-0.5">{voucherData.category || 'اشتراك تعليمي'}</strong>
            </div>
            <div className="p-2 border border-slate-200 bg-slate-50">
              <span className="text-slate-500 block text-[10px]">طريقة الدفع:</span>
              <strong className="text-slate-900 block mt-0.5">{voucherData.paymentMethod || 'نقداً (خزينة)'}</strong>
            </div>
            <div className="p-2 border border-slate-200 bg-slate-50">
              <span className="text-slate-500 block text-[10px]">المبلغ المقبوض:</span>
              <strong className="text-emerald-700 text-base font-mono font-bold block mt-0.5">
                {(voucherData.amount || 0).toLocaleString()} دج
              </strong>
            </div>
          </div>

          {/* Notes */}
          {voucherData.notes && (
            <div className="p-2 bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500 text-[10px] block">ملاحظات وبيان العملية:</span>
              <p className="text-slate-700 mt-0.5">{voucherData.notes}</p>
            </div>
          )}

          {/* Financial Validation & Signatures */}
          <div className="pt-4 border-t border-dashed border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <span className="text-slate-500 block mb-8">ختم وتوقيع أمين الخزينة</span>
              <span className="text-[10px] text-slate-400">محمد بوري - الإدارة المالية</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-8">توقيع ولي الأمر / المستلم</span>
              <span className="text-[10px] text-slate-400">حرر باليد والمصادقة الآلية</span>
            </div>
          </div>

          <div className="pt-2 text-center text-[10px] text-slate-400 border-t border-slate-100 flex items-center justify-between">
            <span>نظام الإدارة الإلكتروني الموحد لأكاديمية العباقرة</span>
            <span className="font-mono">معرف السند الفريد: {voucherData.receiptNumber}</span>
          </div>
        </div>

        {/* Footer (Screen only) */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end gap-2 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors"
          >
            إغلاق النافذة
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة</span>
          </button>
        </div>
      </div>
    </div>
  );
}
