import React, { useState } from 'react';
import {
  Receipt,
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Printer,
  ChevronDown,
  Layers,
  ArrowRight,
  Eye,
} from 'lucide-react';
import {
  MOCK_FINANCE_INVOICES,
  MOCK_KG_STUDENTS,
} from '../../../mock/geniusKindergartenFinanceMockData';

export function InvoicesInstallmentsView() {
  const [invoices, setInvoices] = useState(MOCK_FINANCE_INVOICES);
  const [selectedInvoice, setSelectedInvoice] = useState(MOCK_FINANCE_INVOICES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, PAID, PARTIAL, UNPAID
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.studentName.includes(searchQuery) ||
      inv.guardianName.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalRemaining = invoices.reduce((sum, inv) => sum + inv.remainingAmount, 0);
  const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

  return (
    <div className="space-y-3 font-arabic text-slate-800">
      {/* 1. Header & Live Financial Telemetry */}
      <div className="bg-white border border-slate-200 p-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 leading-none">
                  جدول الفواتير ومواعيد الأقساط (Invoices & Installments Scheduler)
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 font-bold">
                  سداد كلي أو مجدول بأقساط
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                توليد ومتابعة الفواتير التفصيلية، جدولة أقساط الدفع (Upfront vs Installments)، وتتبع رصيد المتبقي بدقة.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedInvoice(invoices[0]);
                setIsPreviewModalOpen(true);
              }}
              className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-blue-800" />
              <span>معاينة الفاتورة الرسمية</span>
            </button>
          </div>
        </div>

        {/* 4 Financial KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2 bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 block">إجمالي المبالغ المفوترة</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-slate-900">
                {totalInvoiced.toLocaleString()} دج
              </span>
              <span className="text-[10px] text-slate-500 font-mono">{invoices.length} فاتورة</span>
            </div>
          </div>
          <div className="p-2 bg-emerald-50/50 border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-800 block">المحصل الفعلي بالخزينة</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-emerald-900">
                {totalCollected.toLocaleString()} دج
              </span>
              <span className="text-[10px] text-emerald-700 font-bold font-mono">{collectionRate}% تحصيل</span>
            </div>
          </div>
          <div className="p-2 bg-amber-50/50 border border-amber-200">
            <span className="text-[10px] font-bold text-amber-800 block">الأقساط المتبقية المستحقة</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-amber-900">
                {totalRemaining.toLocaleString()} دج
              </span>
              <span className="text-[10px] text-amber-700 font-bold">مجدولة الدفع</span>
            </div>
          </div>
          <div className="p-2 bg-blue-50/50 border border-blue-200">
            <span className="text-[10px] font-bold text-blue-800 block">نمط الدفع المعتمد</span>
            <div className="mt-1 text-[11px] font-bold text-slate-800">
              دفع نقدي حصري (Cash Only)
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filter Ribbon */}
      <div className="bg-white border border-slate-200 p-2 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute start-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث برقم الفاتورة، اسم الطفل، الولي..."
              className="w-full ps-8 pe-2 py-1 text-xs border border-slate-200 bg-slate-50/50"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs p-1 border border-slate-200 bg-white font-arabic font-semibold"
          >
            <option value="ALL">كافة حالات السداد</option>
            <option value="PAID">مسدد كلياً (Paid)</option>
            <option value="PARTIAL">مسدد جزئياً (Partial)</option>
            <option value="UNPAID">غير مسدد (Unpaid)</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          عرض <span className="font-bold text-slate-800">{filteredInvoices.length}</span> فاتورة
        </div>
      </div>

      {/* 3. Invoices Master-Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Invoices List (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold select-none">
                  <th className="py-2 px-2 text-center border-e border-slate-200 w-10">#</th>
                  <th className="py-2 px-2 text-start border-e border-slate-200">رقم الفاتورة</th>
                  <th className="py-2 px-2.5 text-start border-e border-slate-200">الطفل والولي</th>
                  <th className="py-2 px-2 text-end border-e border-slate-200">المبلغ الإجمالي</th>
                  <th className="py-2 px-2 text-end border-e border-slate-200 text-emerald-800">المدفوع</th>
                  <th className="py-2 px-2 text-end border-e border-slate-200 text-rose-800">المتبقي</th>
                  <th className="py-2 px-2 text-center border-e border-slate-200">الحالة</th>
                  <th className="py-2 px-2 text-center">تفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredInvoices.map((inv, idx) => {
                  const isSelected = selectedInvoice?.id === inv.id;
                  return (
                    <tr
                      key={inv.id}
                      onClick={() => setSelectedInvoice(inv)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2 px-2 text-center font-mono text-slate-500 border-e border-slate-200">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2 text-start font-mono font-bold text-blue-950 border-e border-slate-200">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-2 px-2.5 border-e border-slate-200 font-semibold text-slate-900">
                        <div className="flex flex-col">
                          <span>{inv.studentName}</span>
                          <span className="text-[10px] text-slate-500 font-normal">{inv.guardianName}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-end font-mono font-bold text-slate-900 border-e border-slate-200">
                        {inv.totalAmount.toLocaleString()} دج
                      </td>
                      <td className="py-2 px-2 text-end font-mono text-emerald-800 font-semibold border-e border-slate-200">
                        {inv.paidAmount.toLocaleString()} دج
                      </td>
                      <td className="py-2 px-2 text-end font-mono text-rose-800 font-bold border-e border-slate-200">
                        {inv.remainingAmount.toLocaleString()} دج
                      </td>
                      <td className="py-2 px-2 text-center border-e border-slate-200">
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-bold border ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : inv.status === 'PARTIAL'
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {inv.status === 'PAID' ? 'خالص' : inv.status === 'PARTIAL' ? 'أقساط جارية' : 'غير مسدد'}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInvoice(inv);
                            setIsPreviewModalOpen(true);
                          }}
                          className="px-1.5 py-0.5 text-[10px] text-blue-900 hover:bg-blue-100 border border-blue-200"
                        >
                          معاينة
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Installment Scheduler Detail (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 shadow-2xs p-3 flex flex-col justify-between">
          {selectedInvoice ? (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">جدول أقساط الفاتورة</span>
                  <h3 className="text-sm font-bold text-slate-900">{selectedInvoice.invoiceNumber}</h3>
                </div>
                <div className="text-end">
                  <span className="text-[10px] text-slate-500 block">نظام السداد:</span>
                  <span className="text-xs font-bold text-blue-900 font-mono">
                    {selectedInvoice.paymentPlanType}
                  </span>
                </div>
              </div>

              {/* Invoice Lines */}
              <div>
                <span className="font-bold text-slate-700 block mb-1">بنود الفاتورة الرسمية (Line Items):</span>
                <div className="border border-slate-200 divide-y divide-slate-100">
                  {selectedInvoice.lines.map((line) => (
                    <div key={line.id} className="p-2 flex items-center justify-between bg-slate-50/50">
                      <div>
                        <span className="font-semibold text-slate-900 block">{line.label}</span>
                        <span className="text-[10px] text-slate-500 font-mono">الكمية: {line.quantity}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-800">
                        {line.total.toLocaleString()} دج
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Installments Table */}
              <div>
                <span className="font-bold text-slate-700 block mb-1">
                  جدول مواعيد الأقساط (Installment Schedule):
                </span>
                <div className="border border-slate-200 overflow-hidden">
                  <table className="w-full text-start border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-1.5 text-center border-e border-slate-200 w-8">#</th>
                        <th className="p-1.5 text-start border-e border-slate-200">تاريخ الاستحقاق</th>
                        <th className="p-1.5 text-end border-e border-slate-200">القسط</th>
                        <th className="p-1.5 text-center border-e border-slate-200">الحالة</th>
                        <th className="p-1.5 text-start">رقم الوصل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedInvoice.installments.map((inst) => (
                        <tr key={inst.seq} className="hover:bg-slate-50">
                          <td className="p-1.5 text-center font-mono text-slate-500 border-e border-slate-200">
                            {inst.seq}
                          </td>
                          <td className="p-1.5 text-start font-mono text-slate-800 border-e border-slate-200">
                            {inst.dueDate}
                          </td>
                          <td className="p-1.5 text-end font-mono font-bold text-slate-900 border-e border-slate-200">
                            {inst.amount.toLocaleString()} دج
                          </td>
                          <td className="p-1.5 text-center border-e border-slate-200">
                            {inst.status === 'PAID' ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 border border-emerald-200">
                                مسدد
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1 py-0.2 border border-amber-200">
                                مستحق
                              </span>
                            )}
                          </td>
                          <td className="p-1.5 text-start font-mono text-[10px] text-slate-600">
                            {inst.receiptNumber || 'في الانتظار'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary Balance */}
              <div className="p-2.5 bg-slate-100 border border-slate-200 flex items-center justify-between font-mono">
                <span className="font-bold text-slate-700">الرصيد المتبقي على الفاتورة:</span>
                <span className="text-sm font-bold text-rose-800">
                  {selectedInvoice.remainingAmount.toLocaleString()} دج
                </span>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">يرجى اختيار فاتورة</div>
          )}
        </div>
      </div>

      {/* 4. Official Printable Invoice Modal Preview */}
      {isPreviewModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-3">
          <div className="bg-white border border-slate-400 shadow-2xl w-full max-w-2xl p-6 font-arabic animate-in fade-in zoom-in-95 print:p-0">
            {/* Modal Header Controls */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-4 print:hidden">
              <span className="text-xs font-bold text-slate-700">معاينة الفاتورة الضريبية / الرسمية</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 text-xs font-bold bg-blue-900 text-white flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة الفاتورة</span>
                </button>
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 font-mono text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Invoice Sheet */}
            <div className="border-2 border-slate-800 p-5 space-y-4 text-xs text-slate-900">
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3">
                <div>
                  <h1 className="text-base font-bold text-blue-950">مؤسسة العباقرة للتربية والتعليم — جيجل</h1>
                  <p className="text-[10px] text-slate-600 font-mono">
                    فرع: روضة وحضانة الأطفال • سجل تجاري: 18/00-098231 • NIF: 001818098231201
                  </p>
                </div>
                <div className="text-end font-mono">
                  <span className="text-xs font-bold block text-blue-900">فاتورة رقم: {selectedInvoice.invoiceNumber}</span>
                  <span className="text-[10px] text-slate-500 block">تاريخ الإصدار: {selectedInvoice.issueDate}</span>
                </div>
              </div>

              {/* Customer Box */}
              <div className="grid grid-cols-2 gap-3 p-2 bg-slate-50 border border-slate-300">
                <div>
                  <span className="text-[10px] text-slate-500 block">الزبون / الولي:</span>
                  <span className="font-bold text-slate-900">{selectedInvoice.guardianName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">اسم التلميذ:</span>
                  <span className="font-bold text-slate-900">{selectedInvoice.studentName}</span>
                </div>
              </div>

              {/* Table */}
              <table className="w-full text-start border-collapse border border-slate-800">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-800 font-bold">
                    <th className="p-2 border-e border-slate-800 text-start">البيان / الخدمة التعليمية</th>
                    <th className="p-2 border-e border-slate-800 text-center w-16">الكمية</th>
                    <th className="p-2 border-e border-slate-800 text-end w-28">السعر الفردي</th>
                    <th className="p-2 text-end w-28">المبلغ الصافي</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-slate-800">
                  {selectedInvoice.lines.map((l) => (
                    <tr key={l.id}>
                      <td className="p-2 border-e border-slate-800 font-semibold">{l.label}</td>
                      <td className="p-2 border-e border-slate-800 text-center font-mono">{l.quantity}</td>
                      <td className="p-2 border-e border-slate-800 text-end font-mono">{l.unitPrice.toLocaleString()} دج</td>
                      <td className="p-2 text-end font-mono font-bold">{l.total.toLocaleString()} دج</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-1 font-mono text-xs">
                  <div className="flex justify-between border-b border-slate-200 pb-1">
                    <span>المبلغ الإجمالي المستحق:</span>
                    <span className="font-bold">{selectedInvoice.totalAmount.toLocaleString()} دج</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1 text-emerald-800">
                    <span>المدفوع نقداً بالخزينة:</span>
                    <span className="font-bold">{selectedInvoice.paidAmount.toLocaleString()} دج</span>
                  </div>
                  <div className="flex justify-between pt-1 font-bold text-rose-800">
                    <span>الرصيد المتبقي المستحق:</span>
                    <span>{selectedInvoice.remainingAmount.toLocaleString()} دج</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-4 border-t-2 border-slate-800 pt-3">
                <div>
                  <span className="font-bold block">توقيع الولي / المسدد:</span>
                </div>
                <div className="text-end">
                  <span className="font-bold block">أمين الصندوق والإدارة المالية:</span>
                  <span className="text-[10px] text-slate-500 font-mono block mt-1">تأشيرة الصندوق المالي</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
