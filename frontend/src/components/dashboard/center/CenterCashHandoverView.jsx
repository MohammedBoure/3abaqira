import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeftRight,
  ShieldCheck,
  FileCheck,
  Calendar,
  Plus,
  X,
  Printer,
  Download,
  Search,
  Info,
  Filter,
  Check,
  Edit2,
  Trash2,
  Copy,
  FileText,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { ReceiptVoucherModal } from '../common/ReceiptVoucherModal';
import { MOCK_CENTER_CASH_HANDOVER } from '../../../mock/centerMockData';

const MONTHS_NAMES_AR = [
  { num: '09', name: 'سبتمبر' },
  { num: '10', name: 'أكتوبر' },
  { num: '11', name: 'نوفمبر' },
  { num: '12', name: 'ديسمبر' },
  { num: '01', name: 'جانفي' },
  { num: '02', name: 'فيفري' },
  { num: '03', name: 'مارس' },
  { num: '04', name: 'أفريل' },
  { num: '05', name: 'ماي' },
  { num: '06', name: 'جوان' },
  { num: '07', name: 'جويلية' },
];

const RECIPIENTS_LIST = [
  'محمد بوري (المدير العام)',
  'صلاح الدين خباش (المدير التنفيذي)',
  'إيداع بالحساب البنكي (البنك الوطني الجزائري)',
];

export function CenterCashHandoverView() {
  const [selectedYear, setSelectedYear] = useState('2025-2026');
  const [activeTab, setActiveTab] = useState('table'); // 'table' | 'kpis'
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Handovers Dataset
  const [handovers, setHandovers] = useState(() => {
    return MOCK_CENTER_CASH_HANDOVER.map((h, idx) => ({
      ...h,
      id: `hnd-${idx + 1}`,
      academicYear: '2025-2026',
      receiptNumber: h.receiptNumber || `HND-26-${idx + 1}`,
      status: 'مستلم ومودع',
      notes: h.notes || 'تسليم سيولة معتمد',
    }));
  });

  // UI Modals
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingHandover, setEditingHandover] = useState(null);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Right-Click Context Menu
  const [contextMenu, setContextMenu] = useState(null);

  // Close context menu on external click
  useEffect(() => {
    const handleWindowClick = () => setContextMenu(null);
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  // Filtered Handovers
  const filteredHandovers = useMemo(() => {
    return handovers.filter((h) => {
      const matchYear = !h.academicYear || h.academicYear === selectedYear;
      const monthNum = h.date ? h.date.split('-')[1] : '';
      const matchMonth = selectedMonth === 'ALL' || monthNum === selectedMonth;
      const matchSearch =
        h.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.receiverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.notes.toLowerCase().includes(searchTerm.toLowerCase());
      return matchYear && matchMonth && matchSearch;
    });
  }, [handovers, selectedYear, selectedMonth, searchTerm]);

  // Grouping by Month for Subtotals
  const monthlyGroups = useMemo(() => {
    const groups = {};
    MONTHS_NAMES_AR.forEach((m) => {
      groups[m.num] = {
        name: m.name,
        num: m.num,
        items: [],
        total: 0,
      };
    });

    filteredHandovers.forEach((h) => {
      const mNum = h.date ? h.date.split('-')[1] : '09';
      if (!groups[mNum]) {
        groups[mNum] = { name: `شهر ${mNum}`, num: mNum, items: [], total: 0 };
      }
      groups[mNum].items.push(h);
      groups[mNum].total += Number(h.amount) || 0;
    });

    return groups;
  }, [filteredHandovers]);

  // KPIs
  const totalDeliveredAmount = filteredHandovers.reduce(
    (acc, h) => acc + (Number(h.amount) || 0),
    0
  );
  const totalReceiptsCount = filteredHandovers.length;
  const lastHandover = filteredHandovers[filteredHandovers.length - 1];

  // Open Context Menu
  const handleContextMenu = (e, handover) => {
    e.preventDefault();
    e.stopPropagation();
    const x = Math.min(e.clientX, window.innerWidth - 220);
    const y = Math.min(e.clientY, window.innerHeight - 260);
    setContextMenu({ x, y, handover });
  };

  // Open Voucher Preview
  const handleOpenVoucher = (h) => {
    setSelectedVoucher({
      receiptNumber: h.receiptNumber,
      payerName: 'أمين صندوق المركز التعليمي',
      category: `محضر تسليم عهدة وسيولة نقدية`,
      amount: h.amount,
      paymentMethod: 'نقداً باليد (تسليم رسمي)',
      branch: 'المركز التعليمي والأكاديمي',
      notes: `المستلم: ${h.receiverName} - بتاريخ: ${h.date} - ${h.notes}`,
    });
  };

  // Delete Handover
  const handleDeleteHandover = (id) => {
    if (window.confirm('هل أنت متأكد من حذف محضر تسليم السيولة هذا؟')) {
      setHandovers((prev) => prev.filter((h) => h.id !== id));
      setContextMenu(null);
    }
  };

  // Add New Handover Form
  const [newHandoverForm, setNewHandoverForm] = useState({
    date: new Date().toISOString().split('T')[0],
    receiptNumber: '',
    amount: '',
    receiverName: RECIPIENTS_LIST[0],
    notes: '',
  });

  const handleAddNewHandover = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!newHandoverForm.receiptNumber.trim()) {
      setErrorMessage('يرجى تحديد رقم سند التسليم.');
      return;
    }

    // Unique Receipt Validation within current year
    const isDuplicate = handovers.some(
      (h) =>
        h.academicYear === selectedYear &&
        h.receiptNumber.toLowerCase() === newHandoverForm.receiptNumber.trim().toLowerCase()
    );
    if (isDuplicate) {
      setErrorMessage(
        `رقم السند (${newHandoverForm.receiptNumber}) مسجل مسبقاً! يمنع تكرار أرقام السندات والوصولات.`
      );
      return;
    }

    const newEntry = {
      id: `hnd-${Date.now()}`,
      academicYear: selectedYear,
      date: newHandoverForm.date,
      receiptNumber: newHandoverForm.receiptNumber.trim(),
      amount: Number(newHandoverForm.amount) || 0,
      receiverName: newHandoverForm.receiverName,
      status: 'مستلم ومودع',
      notes: newHandoverForm.notes || 'تسليم سيولة معتمد',
    };

    setHandovers([...handovers, newEntry]);
    setIsAddModalOpen(false);
    setNewHandoverForm({
      date: new Date().toISOString().split('T')[0],
      receiptNumber: '',
      amount: '',
      receiverName: RECIPIENTS_LIST[0],
      notes: '',
    });
  };

  // Save Edit Handover
  const handleSaveEditHandover = (e) => {
    e.preventDefault();
    if (editingHandover) {
      setHandovers((prev) =>
        prev.map((h) => (h.id === editingHandover.id ? editingHandover : h))
      );
      setEditingHandover(null);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'التاريخ',
      'رقم سند التسليم',
      'المبلغ المسلم (دج)',
      'الجهة المستلمة / المشرفة',
      'حالة الإيداع',
      'ملاحظات',
    ];
    const rows = filteredHandovers.map((h) => [
      h.date,
      `"${h.receiptNumber}"`,
      h.amount,
      `"${h.receiverName}"`,
      `"${h.status}"`,
      `"${h.notes || ''}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `center_handovers_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 text-xs overflow-hidden">
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-white border-b border-slate-200 shrink-0">
        {/* Title & Badge */}
        <div className="flex items-center gap-2">
          <div className="p-1 bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 text-sm">
                سجل تسليم العهدة النقدية والسيولة (عهدة)
              </span>
              <span className="text-[10px] text-slate-400">|</span>
              <span className="text-[10px] text-slate-500 font-mono">
                Safe Custody & Cash Handover
              </span>
            </div>
          </div>
        </div>

        {/* Year Selector & Internal Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              aria-label="تحديد السنة المالية لتسليم العهدة"
              className="bg-transparent font-bold text-slate-800 text-xs border-none focus:outline-hidden cursor-pointer"
            >
              <option value="2024-2025">موسم 2024 - 2025</option>
              <option value="2025-2026">موسم 2025 - 2026</option>
              <option value="2026-2027">موسم 2026 - 2027</option>
            </select>
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 border border-slate-200">
            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1 text-xs font-bold transition-colors ${
                activeTab === 'table'
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              سجل التسليمات ({filteredHandovers.length})
            </button>
            <button
              onClick={() => setActiveTab('kpis')}
              className={`px-3 py-1 text-xs font-bold flex items-center gap-1 transition-colors ${
                activeTab === 'kpis'
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              مؤشرات السيولة
            </button>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1 border-s border-slate-200 ps-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              title="إضافة محضر تسليم سيولة جديد"
              className="p-1 bg-blue-900 hover:bg-blue-950 text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportCSV}
              title="تصدير CSV"
              className="p-1 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.print()}
              title="طباعة السجل"
              className="p-1 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsInfoModalOpen(true)}
              title="معلومات ودليل استخدام سجل تسليم العهدة"
              className="p-1 hover:bg-amber-50 text-amber-700 border border-amber-200 transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Filter Bar */}
      {activeTab === 'table' && (
        <div className="flex items-center justify-between px-3 py-1 bg-white border-b border-slate-200 shrink-0 gap-2">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute right-2 top-1.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="بحث برقم السند، الجهة المستلمة، أو البيان..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-7 pr-7 pl-2 bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                aria-label="تصفية التسليمات حسب الشهر"
                className="h-7 px-2 bg-slate-50 border border-slate-200 text-[11px] text-slate-700 focus:outline-hidden"
              >
                <option value="ALL">جميع الشهور (11 شهر)</option>
                {MONTHS_NAMES_AR.map((m) => (
                  <option key={m.num} value={m.num}>
                    شهر {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
            <span>
              عدد السندات:{' '}
              <strong className="text-slate-800">{filteredHandovers.length}</strong>
            </span>
            <span>
              إجمالي السيولة المحولة:{' '}
              <strong className="text-emerald-700">
                {totalDeliveredAmount.toLocaleString()} دج
              </strong>
            </span>
          </div>
        </div>
      )}

      {/* 3. Main Workspace Area */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'table' ? (
          <div className="min-w-full inline-block align-middle pb-8">
            <table className="w-full text-start text-xs border-collapse select-none">
              <thead className="bg-slate-100 sticky top-0 z-10 border-b border-slate-300 text-slate-700 font-bold text-[11px]">
                <tr>
                  <th className="p-1 text-center border-e border-slate-300 w-24">التاريخ</th>
                  <th className="p-1 text-center border-e border-slate-300 min-w-[120px]">
                    رقم سند التسليم
                  </th>
                  <th className="p-1 text-end border-e border-slate-300 min-w-[120px] bg-emerald-50 text-emerald-950 font-bold">
                    المبلغ المسلم (دج)
                  </th>
                  <th className="p-1 text-start border-e border-slate-300 min-w-[200px]">
                    الجهة المشرفة على الاستلام
                  </th>
                  <th className="p-1 text-center border-e border-slate-300 min-w-[110px]">
                    حالة الإيداع
                  </th>
                  <th className="p-1 text-start min-w-[160px]">ملاحظات</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {/* Monthly Subtotals */}
                {Object.values(monthlyGroups).map((group) => {
                  if (group.items.length === 0) return null;

                  return (
                    <React.Fragment key={group.num}>
                      {/* Month Header Banner */}
                      <tr className="bg-slate-200/70 text-slate-900 font-bold font-sans">
                        <td colSpan={6} className="p-1.5 px-3 border-y border-slate-300 text-xs">
                          تسليمات شهر {group.name} ({group.items.length} عمليات ترحيل)
                        </td>
                      </tr>

                      {/* Items */}
                      {group.items.map((h) => (
                        <tr
                          key={h.id}
                          onContextMenu={(e) => handleContextMenu(e, h)}
                          className="h-8 hover:bg-blue-50/40 transition-colors cursor-pointer"
                        >
                          {/* Date */}
                          <td className="p-1 text-center border-e border-slate-200 text-slate-600">
                            {h.date}
                          </td>

                          {/* Receipt Number */}
                          <td className="p-1 text-center border-e border-slate-200">
                            <button
                              onClick={() => handleOpenVoucher(h)}
                              className="text-[10px] text-blue-900 font-bold hover:underline flex items-center justify-center gap-1 mx-auto"
                              title="معاينة محضر التسليم الرسمي"
                            >
                              <FileText className="w-2.5 h-2.5" />
                              {h.receiptNumber}
                            </button>
                          </td>

                          {/* Amount */}
                          <td className="p-1 text-end border-e border-slate-200 font-bold text-emerald-800 bg-emerald-50/30">
                            {h.amount.toLocaleString()} دج
                          </td>

                          {/* Receiver */}
                          <td className="p-1 border-e border-slate-200 font-sans font-medium text-slate-900">
                            {h.receiverName}
                          </td>

                          {/* Status */}
                          <td className="p-1 text-center border-e border-slate-200 font-sans text-[10px]">
                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xs font-semibold">
                              ✓ {h.status}
                            </span>
                          </td>

                          {/* Notes */}
                          <td className="p-1 font-sans text-slate-600 truncate max-w-[160px]">
                            {h.notes}
                          </td>
                        </tr>
                      ))}

                      {/* Subtotal Row */}
                      <tr className="bg-emerald-50/60 border-t border-b border-emerald-200 text-emerald-950 font-bold">
                        <td colSpan={2} className="p-1.5 px-3 font-sans text-start">
                          مجموع تسليمات شهر {group.name}
                        </td>
                        <td className="p-1 text-end font-mono text-xs text-emerald-800">
                          {group.total.toLocaleString()} دج
                        </td>
                        <td colSpan={3} className="p-1 text-slate-400 font-sans text-[10px]">-</td>
                      </tr>
                    </React.Fragment>
                  );
                })}

                {/* Grand Total Row */}
                <tr className="bg-slate-900 text-white font-bold text-xs sticky bottom-0 z-20 shadow-md">
                  <td colSpan={2} className="p-2 font-sans text-amber-300">
                    مجموع السيولة النقدية المحولة للخزينة بالموسم ({selectedYear})
                  </td>
                  <td className="p-2 text-end text-amber-300 font-mono text-sm">
                    {totalDeliveredAmount.toLocaleString()} دج
                  </td>
                  <td colSpan={3} className="p-2 text-slate-400 font-sans text-[10px]">
                    {filteredHandovers.length} سند ترحيل معتمد
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          /* KPIs Tab */
          <div className="p-4 space-y-4 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3 bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold">إجمالي السيولة المودعة</span>
                  <ArrowLeftRight className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="text-xl font-bold font-mono text-emerald-700">
                  {totalDeliveredAmount.toLocaleString()} دج
                </div>
                <div className="text-[10px] text-slate-400 mt-1">موسم {selectedYear}</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold">سندات التسليم المعتمدة</span>
                  <FileCheck className="w-4 h-4 text-blue-900" />
                </div>
                <div className="text-xl font-bold font-mono text-slate-900">
                  {totalReceiptsCount} سندات
                </div>
                <div className="text-[10px] text-emerald-600 mt-1">محاضر رسمية موقعة</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold">آخر عملية ترحيل</span>
                  <Calendar className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-xl font-bold font-mono text-amber-700">
                  {lastHandover ? `${lastHandover.amount.toLocaleString()} دج` : '0 دج'}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {lastHandover ? `بتاريخ ${lastHandover.date}` : '-'}
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold">الجهة المشرفة</span>
                  <ShieldCheck className="w-4 h-4 text-blue-900" />
                </div>
                <div className="text-sm font-bold font-sans text-slate-900 mt-1">
                  المدير العام / التنفيذي
                </div>
                <div className="text-[10px] text-emerald-600 mt-1">تسليم مؤكد ومطابق</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right-Click Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white border border-slate-300 shadow-xl py-1 text-xs min-w-[190px] animate-in fade-in"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1 bg-slate-100 border-b border-slate-200 font-bold text-[10px] text-slate-700">
            {contextMenu.handover.receiptNumber}
          </div>
          <button
            onClick={() => {
              setEditingHandover(contextMenu.handover);
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-blue-50 text-slate-800 flex items-center gap-2"
          >
            <Edit2 className="w-3.5 h-3.5 text-blue-800" />
            تعديل سند التسليم
          </button>
          <button
            onClick={() => {
              handleOpenVoucher(contextMenu.handover);
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-blue-50 text-slate-800 flex items-center gap-2"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-700" />
            معاينة محضر التسليم
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `${contextMenu.handover.receiptNumber} - ${contextMenu.handover.amount} دج - المستلم: ${contextMenu.handover.receiverName}`
              );
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-blue-50 text-slate-800 flex items-center gap-2"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            نسخ تفاصيل السند
          </button>
          <div className="border-t border-slate-200 my-1" />
          <button
            onClick={() => handleDeleteHandover(contextMenu.handover.id)}
            className="w-full text-start px-3 py-1.5 hover:bg-rose-50 text-rose-700 flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            حذف السند
          </button>
        </div>
      )}

      {/* Edit Handover Modal */}
      {editingHandover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">تعديل سند تسليم العهدة</span>
              <button
                onClick={() => setEditingHandover(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditHandover} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">التاريخ *</label>
                  <input
                    type="date"
                    required
                    value={editingHandover.date}
                    onChange={(e) =>
                      setEditingHandover({ ...editingHandover, date: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">رقم السند</label>
                  <input
                    type="text"
                    value={editingHandover.receiptNumber}
                    onChange={(e) =>
                      setEditingHandover({ ...editingHandover, receiptNumber: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  المبلغ المسلم (دج) *
                </label>
                <input
                  type="number"
                  required
                  value={editingHandover.amount}
                  onChange={(e) =>
                    setEditingHandover({ ...editingHandover, amount: Number(e.target.value) })
                  }
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  الجهة المشرفة على الاستلام
                </label>
                <select
                  value={editingHandover.receiverName}
                  onChange={(e) =>
                    setEditingHandover({ ...editingHandover, receiverName: e.target.value })
                  }
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50"
                >
                  {RECIPIENTS_LIST.map((rec) => (
                    <option key={rec} value={rec}>
                      {rec}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ملاحظات</label>
                <input
                  type="text"
                  value={editingHandover.notes}
                  onChange={(e) =>
                    setEditingHandover({ ...editingHandover, notes: e.target.value })
                  }
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingHandover(null)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-bold"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Handover Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">
                تسجيل محضر تسليم سيولة وعهدة جديد
              </span>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleAddNewHandover} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">التاريخ *</label>
                  <input
                    type="date"
                    required
                    value={newHandoverForm.date}
                    onChange={(e) =>
                      setNewHandoverForm({ ...newHandoverForm, date: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    رقم السند (فريد) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="HND-26-..."
                    value={newHandoverForm.receiptNumber}
                    onChange={(e) =>
                      setNewHandoverForm({ ...newHandoverForm, receiptNumber: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  المبلغ المسلم (دج) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="مثال: 85000"
                  value={newHandoverForm.amount}
                  onChange={(e) =>
                    setNewHandoverForm({ ...newHandoverForm, amount: e.target.value })
                  }
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  الجهة المشرفة على الاستلام
                </label>
                <select
                  value={newHandoverForm.receiverName}
                  onChange={(e) =>
                    setNewHandoverForm({ ...newHandoverForm, receiverName: e.target.value })
                  }
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50"
                >
                  {RECIPIENTS_LIST.map((rec) => (
                    <option key={rec} value={rec}>
                      {rec}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ملاحظات</label>
                <input
                  type="text"
                  placeholder="ملاحظات التسليم والتوقيع..."
                  value={newHandoverForm.notes}
                  onChange={(e) =>
                    setNewHandoverForm({ ...newHandoverForm, notes: e.target.value })
                  }
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-bold"
                >
                  تأكيد تسليم العهدة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-lg p-5 text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-slate-900 text-sm">
                  دليل وإرشادات سجل تسليم العهدة النقدية (المركز التعليمي)
                </span>
              </div>
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-slate-700 leading-relaxed">
              <p>
                <strong>الهدف من الواجهة:</strong> توثيق محاضر وسندات تسليم السيولة النقدية اليومية
                من صندوق المركز إلى الإدارة المركزية أو الحساب البنكي.
              </p>
              <ul className="list-disc list-inside space-y-1 bg-slate-50 p-2.5 border border-slate-200">
                <li>
                  <strong>منع تكرار رقم السند:</strong> يطبق النظام تحققاً صارماً يمنع تكرار رقم سند
                  التسليم داخل السنة المالية نهائياً.
                </li>
                <li>
                  <strong>المجاميع الشهرية:</strong> تعرض الواجهة تسليمات كل شهر مع مجاميع جزئية
                  تلقائية.
                </li>
                <li>
                  <strong>معاينة المحضر وطباعته:</strong> اضغط على رقم السند لفتح محضر تسليم السيولة
                  المعتمد.
                </li>
                <li>
                  <strong>الزر الأيمن للفأرة:</strong> يتيح تعديل السند، نسخ البيانات، أو حذف السجل.
                </li>
              </ul>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-black text-white font-bold"
              >
                إغلاق الدليل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voucher Modal */}
      {selectedVoucher && (
        <ReceiptVoucherModal
          voucherData={selectedVoucher}
          onClose={() => setSelectedVoucher(null)}
        />
      )}
    </div>
  );
}
