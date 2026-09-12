import React, { useState, useMemo } from 'react';
import {
  Receipt,
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Coins,
  FileSpreadsheet,
  X,
  Printer,
  Ban,
  ArrowDownLeft,
  Copy,
  Eye,
} from 'lucide-react';
import { ContextMenu } from '../common/ContextMenu';
import { MOCK_INVOICES, MOCK_PAYMENTS_LIST } from '../../mock/mockData';

export function InvoicesPaymentsView({ selectedBranch = 'ALL' }) {
  const [invoices, setInvoices] = useState(MOCK_INVOICES);
  const [payments, setPayments] = useState(MOCK_PAYMENTS_LIST);
  const [subTab, setSubTab] = useState('invoices'); // 'invoices' | 'payments'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  // Right-Click Context Menu State
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    x: 0,
    y: 0,
    item: null,
    type: 'invoice', // 'invoice' | 'payment'
  });

  const showToast = (m) => {
    setToastMsg(m);
    setTimeout(() => setToastMsg(''), 2500);
  };

  // Record Payment Form
  const [paymentForm, setPaymentForm] = useState({
    invoice_id: '',
    amount: '',
    payment_method: 'CASH',
    remarks: '',
  });

  const filteredInvoices = invoices.filter((inv) => {
    const matchesBranch = selectedBranch === 'ALL' || inv.branch_id === selectedBranch;
    const matchesSearch =
      inv.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.period_label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(inv.invoice_id).includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesBranch && matchesSearch && matchesStatus;
  });

  const filteredPayments = payments.filter((p) => {
    const matchesBranch = selectedBranch === 'ALL' || p.branch_id === selectedBranch;
    const matchesSearch =
      p.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.receipt_number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesBranch && matchesSearch;
  });

  const totalBilled = filteredInvoices.reduce((acc, inv) => acc + inv.amount_due, 0);
  const totalCollected = filteredInvoices.reduce((acc, inv) => acc + inv.amount_paid, 0);
  const totalOutstanding = totalBilled - totalCollected;
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  const handleRecordPayment = (e) => {
    e.preventDefault();
    const invId = parseInt(paymentForm.invoice_id, 10);
    const amount = parseFloat(paymentForm.amount) || 0;
    if (!invId || amount <= 0) return;

    const targetInv = invoices.find((i) => i.invoice_id === invId);
    if (!targetInv) return;

    const newPayment = {
      payment_id: Date.now(),
      receipt_number: `REC-CENTER-2026-${Date.now().toString().slice(-5)}`,
      invoice_id: invId,
      student_name: targetInv.student_name,
      branch_id: targetInv.branch_id,
      amount: amount,
      payment_method: paymentForm.payment_method,
      payment_date: new Date().toISOString().substring(0, 10),
      collected_by: 'سارة منصوري (أمينة الصندوق)',
      remarks: paymentForm.remarks || 'سداد عبر الواجهة السريعة',
      status: 'COMPLETED',
    };

    setPayments([newPayment, ...payments]);

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.invoice_id === invId) {
          const newPaid = inv.amount_paid + amount;
          return {
            ...inv,
            amount_paid: newPaid,
            status: newPaid >= inv.amount_due ? 'PAID' : 'PARTIALLY_PAID',
          };
        }
        return inv;
      })
    );

    setIsPaymentModalOpen(false);
    setPaymentForm({ invoice_id: '', amount: '', payment_method: 'CASH', remarks: '' });
  };

  const contextMenuItems = useMemo(() => {
    if (!contextMenu.item) return [];

    if (contextMenu.type === 'invoice') {
      const inv = contextMenu.item;
      const rem = inv.amount_due - inv.amount_paid;

      return [
        { type: 'header', label: `فاتورة #${inv.invoice_id} • ${inv.student_name}` },
        {
          label: `نسخ رقم الفاتورة (#${inv.invoice_id})`,
          icon: Copy,
          onClick: () => {
            navigator.clipboard.writeText(String(inv.invoice_id));
            showToast(`تم نسخ رقم الفاتورة: #${inv.invoice_id}`);
          },
        },
        {
          label: `نسخ المبلغ المستحق (${inv.amount_due.toLocaleString()} دج)`,
          icon: Copy,
          onClick: () => {
            navigator.clipboard.writeText(String(inv.amount_due));
            showToast(`تم نسخ المبلغ: ${inv.amount_due} دج`);
          },
        },
        {
          label: `نسخ سطر الفاتورة كـ TSV`,
          icon: FileSpreadsheet,
          onClick: () => {
            const rowStr = `${inv.invoice_id}\t${inv.student_name}\t${inv.period_label}\t${inv.amount_due}\t${inv.amount_paid}\t${rem}\t${inv.due_date}\t${inv.status}`;
            navigator.clipboard.writeText(rowStr);
            showToast(`تم نسخ سطر الفاتورة كـ TSV`);
          },
        },
        { type: 'divider' },
        ...(rem > 0
          ? [
              {
                label: `تسجيل سداد للقسط (المتبقي: ${rem.toLocaleString()} دج)`,
                icon: CreditCard,
                onClick: () => {
                  setPaymentForm({
                    invoice_id: String(inv.invoice_id),
                    amount: String(rem),
                    payment_method: 'CASH',
                    remarks: `سداد ${inv.period_label}`,
                  });
                  setIsPaymentModalOpen(true);
                },
              },
            ]
          : []),
        {
          label: `تصفية الجدول حسب الطالب (${inv.student_name})`,
          icon: Filter,
          onClick: () => {
            setSearchTerm(inv.student_name);
            showToast(`تمت التصفية حسب: ${inv.student_name}`);
          },
        },
        {
          label: 'طباعة كشف الحساب / الفاتورة',
          icon: Printer,
          onClick: () => window.print(),
        },
      ];
    } else {
      const p = contextMenu.item;
      return [
        { type: 'header', label: `سند قبض: ${p.receipt_number}` },
        {
          label: `نسخ رقم الوصل (${p.receipt_number})`,
          icon: Copy,
          onClick: () => {
            navigator.clipboard.writeText(p.receipt_number);
            showToast(`تم نسخ رقم الوصل: ${p.receipt_number}`);
          },
        },
        {
          label: `نسخ المبلغ المقبوض (${p.amount.toLocaleString()} دج)`,
          icon: Copy,
          onClick: () => {
            navigator.clipboard.writeText(String(p.amount));
            showToast(`تم نسخ المبلغ: ${p.amount} دج`);
          },
        },
        {
          label: `نسخ سطر السند كـ TSV`,
          icon: FileSpreadsheet,
          onClick: () => {
            const rowStr = `${p.receipt_number}\t${p.student_name}\t${p.branch_id}\t${p.amount}\t${p.payment_method}\t${p.payment_date}\t${p.collected_by}`;
            navigator.clipboard.writeText(rowStr);
            showToast(`تم نسخ سطر السند كـ TSV`);
          },
        },
        { type: 'divider' },
        {
          label: `تصفية الجدول حسب الطالب (${p.student_name})`,
          icon: Filter,
          onClick: () => {
            setSearchTerm(p.student_name);
            showToast(`تمت التصفية حسب: ${p.student_name}`);
          },
        },
        {
          label: 'طباعة سند القبض الرسمي',
          icon: Printer,
          onClick: () => window.print(),
        },
      ];
    }
  }, [contextMenu.item, contextMenu.type]);

  return (
    <div className="space-y-3 font-arabic">
      {/* 1. Module Header */}
      <div className="bg-white border border-slate-300 p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="eyebrow flex items-center gap-1.5 text-blue-900">
            <Receipt className="w-3.5 h-3.5" />
            <span>دفتر الفوترة والتحصيل المالي المعتمد</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold font-serif text-slate-900 mt-0.5">
            سجل الفواتير، الأقساط وسندات القبض (Invoices & Payments)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            إدارة الدفعات ربع السنوية والشهرية، قيد تحصيلات الصندوق، تتبع الديون المتأخرة، وتوليد وصولات الاستلام الرسمية.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="view-switch text-xs">
            <button
              onClick={() => setSubTab('invoices')}
              className={subTab === 'invoices' ? 'active' : ''}
            >
              <FileSpreadsheet className="w-3 h-3" />
              <span>جدول الأقساط والفواتير</span>
            </button>
            <button
              onClick={() => setSubTab('payments')}
              className={subTab === 'payments' ? 'active' : ''}
            >
              <Receipt className="w-3 h-3" />
              <span>سندات القبض والإيصالات ({payments.length})</span>
            </button>
          </div>

          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="button button-primary text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>تسجيل سند قبض جديد</span>
          </button>
        </div>
      </div>

      {/* 2. Financial Velocity Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-white border border-slate-300 p-3 border-s-4 border-s-blue-900 shadow-xs">
          <span className="eyebrow">TOTAL BILLED TRANCHES</span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {totalBilled.toLocaleString()} دج
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            إجمالي المستحقات عبر {invoices.length} أقساط مفوترة
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-3 border-s-4 border-s-emerald-700 shadow-xs">
          <span className="eyebrow">COLLECTED REVENUE</span>
          <div className="text-xl font-bold font-mono text-emerald-800 mt-1">
            {totalCollected.toLocaleString()} دج
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            مبالغ محصلة ومودعة في الخزينة
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-3 border-s-4 border-s-amber-600 shadow-xs">
          <span className="eyebrow">OUTSTANDING DUES</span>
          <div className="text-xl font-bold font-mono text-amber-800 mt-1">
            {totalOutstanding.toLocaleString()} دج
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            أقساط جارية قيد السداد أو مستحقة
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-3 border-s-4 border-s-slate-700 shadow-xs">
          <span className="eyebrow">COLLECTION VELOCITY</span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {collectionRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            معدل التحصيل العام مقارنة بالفوترة
          </div>
        </div>
      </div>

      {/* 3. Main Data Content */}
      {subTab === 'invoices' ? (
        <div className="bg-white border border-slate-300 shadow-xs">
          {/* Table Filters */}
          <div className="p-2.5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث باسم الطالب، القسط، أو ID الفاتورة..."
                className="w-full h-7 px-2 text-xs border border-slate-300 bg-white focus:outline-none focus:border-blue-900"
              />
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-500 font-semibold me-1">الحالة:</span>
              {['ALL', 'PAID', 'PARTIALLY_PAID', 'UNPAID', 'OVERDUE'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-0.5 text-[10px] font-semibold border ${
                    statusFilter === st
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {st === 'ALL'
                    ? 'الكل'
                    : st === 'PAID'
                    ? 'مسدد'
                    : st === 'PARTIALLY_PAID'
                    ? 'جزئي'
                    : st === 'UNPAID'
                    ? 'غير مسدد'
                    : 'متأخر'}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="excel-table text-xs">
              <thead>
                <tr>
                  <th className="excel-th p-2 text-center w-14">#</th>
                  <th className="excel-th p-2 text-start">الطالب والفوج</th>
                  <th className="excel-th p-2 text-start">بيان القسط والمدة</th>
                  <th className="excel-th p-2 text-center">المبلغ المستحق</th>
                  <th className="excel-th p-2 text-center">المسدد</th>
                  <th className="excel-th p-2 text-center">المتبقي</th>
                  <th className="excel-th p-2 text-center">تاريخ الاستحقاق</th>
                  <th className="excel-th p-2 text-center">حالة السداد</th>
                  <th className="excel-th p-2 text-start">ملاحظات</th>
                  <th className="excel-th p-2 text-center w-28">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => {
                  const rem = inv.amount_due - inv.amount_paid;
                  return (
                    <tr
                      key={inv.invoice_id}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({
                          isOpen: true,
                          x: e.clientX,
                          y: e.clientY,
                          item: inv,
                          type: 'invoice',
                        });
                      }}
                      className="hover:bg-slate-50/80 transition-colors cursor-context-menu"
                    >
                      <td className="excel-td p-2 text-center font-mono text-slate-500">
                        #{inv.invoice_id}
                      </td>
                      <td className="excel-td p-2">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{inv.student_name}</span>
                          <span className="text-[10px] text-slate-500">{inv.group_name}</span>
                        </div>
                      </td>
                      <td className="excel-td p-2 font-semibold text-slate-800">
                        {inv.period_label}
                      </td>
                      <td className="excel-td p-2 text-center font-mono font-bold text-slate-900">
                        {inv.amount_due.toLocaleString()} دج
                      </td>
                      <td className="excel-td p-2 text-center font-mono text-emerald-700 font-bold">
                        {inv.amount_paid.toLocaleString()} دج
                      </td>
                      <td className="excel-td p-2 text-center font-mono font-bold text-amber-700">
                        {rem.toLocaleString()} دج
                      </td>
                      <td className="excel-td p-2 text-center font-mono text-slate-600">
                        {inv.due_date}
                      </td>
                      <td className="excel-td p-2 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 border ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : inv.status === 'PARTIALLY_PAID'
                              ? 'bg-blue-50 text-blue-900 border-blue-300'
                              : inv.status === 'OVERDUE'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          {inv.status === 'PAID'
                            ? 'مسدد بالكامل'
                            : inv.status === 'PARTIALLY_PAID'
                            ? 'مسدد جزئياً'
                            : inv.status === 'OVERDUE'
                            ? 'متأخر عن الموعد'
                            : 'غير مسدد'}
                        </span>
                      </td>
                      <td className="excel-td p-2 text-slate-500 text-[11px] truncate max-w-xs">
                        {inv.notes}
                      </td>
                      <td className="excel-td p-2 text-center">
                        {rem > 0 && (
                          <button
                            onClick={() => {
                              setPaymentForm({
                                invoice_id: String(inv.invoice_id),
                                amount: String(rem),
                                payment_method: 'CASH',
                                remarks: `سداد ${inv.period_label}`,
                              });
                              setIsPaymentModalOpen(true);
                            }}
                            className="button text-[10px] h-6 px-1.5 bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-600 hover:text-white"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>سداد القسط</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="excel-status-bar p-2 text-slate-600 flex items-center justify-between text-[11px]">
            <span>عدد الأقساط المعروضة: <strong>{filteredInvoices.length}</strong> (انقر بالزر الأيمن على السطر لإجراءات إضافية)</span>
            <span className="text-slate-600 font-medium">حالة الربط: متزامن مع قيود الخزينة</span>
          </div>
        </div>
      ) : (
        /* Payments Tab */
        <div className="bg-white border border-slate-300 shadow-xs">
          <div className="overflow-x-auto">
            <table className="excel-table text-xs">
              <thead>
                <tr>
                  <th className="excel-th p-2 text-center w-36">رقم الوصل (Receipt)</th>
                  <th className="excel-th p-2 text-start">الطالب المستفيد</th>
                  <th className="excel-th p-2 text-center">المقر</th>
                  <th className="excel-th p-2 text-center">المبلغ المقبوض</th>
                  <th className="excel-th p-2 text-center">طريقة الدفع</th>
                  <th className="excel-th p-2 text-center">تاريخ السند</th>
                  <th className="excel-th p-2 text-start">أمين الصندوق</th>
                  <th className="excel-th p-2 text-start">ملاحظات التحصيل</th>
                  <th className="excel-th p-2 text-center w-24">طباعة</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => (
                  <tr
                    key={p.payment_id}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({
                        isOpen: true,
                        x: e.clientX,
                        y: e.clientY,
                        item: p,
                        type: 'payment',
                      });
                    }}
                    className="hover:bg-slate-50/80 transition-colors cursor-context-menu"
                  >
                    <td className="excel-td p-2 text-center font-mono font-bold text-blue-900">
                      {p.receipt_number}
                    </td>
                    <td className="excel-td p-2 font-bold text-slate-900">
                      {p.student_name}
                    </td>
                    <td className="excel-td p-2 text-center font-semibold text-slate-600">
                      {p.branch_id}
                    </td>
                    <td className="excel-td p-2 text-center font-mono font-bold text-emerald-700">
                      {p.amount.toLocaleString()} دج
                    </td>
                    <td className="excel-td p-2 text-center">
                      <span className="tag text-[10px] font-mono">
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="excel-td p-2 text-center font-mono text-slate-600">
                      {p.payment_date}
                    </td>
                    <td className="excel-td p-2 text-slate-700">
                      {p.collected_by}
                    </td>
                    <td className="excel-td p-2 text-slate-500 text-[11px]">
                      {p.remarks}
                    </td>
                    <td className="excel-td p-2 text-center">
                      <button className="button text-[10px] h-6 px-2 text-slate-700">
                        <Printer className="w-3 h-3 text-blue-900" />
                        <span>طباعة</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="excel-status-bar p-2 text-slate-600 flex items-center justify-between text-[11px]">
            <span>إجمالي سندات القبض: <strong>{payments.length} سند</strong></span>
            <span className="text-slate-600 font-medium">سندات موثقة ومرحلة مالياً</span>
          </div>
        </div>
      )}

      {/* Modal: Record Payment Receipt */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-3 select-none">
          <div className="bg-white border border-slate-400 max-w-md w-full shadow-lg">
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-900" />
                <h3 className="font-bold text-sm text-slate-900">
                  تسجيل سند قبض وإيصال مالي معتمد
                </h3>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="icon-button w-6 h-6 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-4 space-y-3">
              <div>
                <label className="eyebrow block mb-1 text-slate-700">اختر الفاتورة أو القسط المستهدف *</label>
                <select
                  required
                  value={paymentForm.invoice_id}
                  onChange={(e) => {
                    const id = e.target.value;
                    const inv = invoices.find((i) => String(i.invoice_id) === id);
                    setPaymentForm({
                      ...paymentForm,
                      invoice_id: id,
                      amount: inv ? String(inv.amount_due - inv.amount_paid) : '',
                    });
                  }}
                  className="w-full h-8 px-2 text-xs border border-slate-300 bg-white"
                >
                  <option value="">-- اختر القسط المطلوب سداده --</option>
                  {invoices
                    .filter((i) => i.amount_due > i.amount_paid)
                    .map((i) => (
                      <option key={i.invoice_id} value={i.invoice_id}>
                        #{i.invoice_id} - {i.student_name} ({i.period_label}) - المتبقي: {(i.amount_due - i.amount_paid).toLocaleString()} دج
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="eyebrow block mb-1 text-slate-700">المبلغ المقبوض (دج) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full h-8 px-2.5 text-xs border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="eyebrow block mb-1 text-slate-700">طريقة الدفع</label>
                  <select
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                    className="w-full h-8 px-2 text-xs border border-slate-300 bg-white font-mono"
                  >
                    <option value="CASH">CASH (نقداً)</option>
                    <option value="BANK_TRANSFER">BANK_TRANSFER (تحويل بنكي / بريد)</option>
                    <option value="CHECK">CHECK (صك بنكي)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="eyebrow block mb-1 text-slate-700">ملاحظات السند ورقم الشيك / المرجع</label>
                <input
                  type="text"
                  placeholder="ملاحظات السداد..."
                  value={paymentForm.remarks}
                  onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                  className="w-full h-8 px-2.5 text-xs border border-slate-300"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="button text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="button button-primary text-xs"
                >
                  إصدار الوصل وترحيل المبلغ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-4 end-4 z-50 bg-slate-900 text-white px-3 py-2 text-xs rounded shadow-lg border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Interactive Right-Click Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={{ x: contextMenu.x, y: contextMenu.y }}
        onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
        title={
          contextMenu.type === 'invoice'
            ? `فاتورة: #${contextMenu.item?.invoice_id} • ${contextMenu.item?.student_name}`
            : `سند قبض: ${contextMenu.item?.receipt_number}`
        }
        subtitle={
          contextMenu.type === 'invoice'
            ? `${contextMenu.item?.period_label} • ${contextMenu.item?.amount_due?.toLocaleString()} دج`
            : `${contextMenu.item?.student_name} • ${contextMenu.item?.amount?.toLocaleString()} دج`
        }
        items={contextMenuItems}
      />
    </div>
  );
}
