import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeftRight,
  ShieldCheck,
  FileCheck,
  Calendar,
  Plus,
  X,
  FileText,
  AlertCircle,
  Edit2,
  Trash2,
  Download,
  Printer,
  Search,
  Info,
  HelpCircle,
  Copy,
  Check,
  Eye,
} from 'lucide-react';
import { ReceiptVoucherModal } from '../common/ReceiptVoucherModal';
import { RAWDA_MONTHS } from '../../../mock/rawdaMockData';

export function RawdaCashHandoverView() {
  const [selectedYear, setSelectedYear] = useState('2025-2026');
  const [selectedMonth, setSelectedMonth] = useState('feb');
  const [searchTerm, setSearchTerm] = useState('');

  // Comprehensive multi-year handovers dataset
  const [handovers, setHandovers] = useState(() => {
    const data = [];
    const years = ['2024-2025', '2025-2026', '2026-2027'];
    const receivers = ['محمد بوري (المدير العام)', 'صلاح الدين (المسؤول المالي)', 'الإدارة المركزية (الخزينة)'];

    years.forEach((yr, yIdx) => {
      const yrPrefix = yr.slice(2, 4);
      let voucherCounter = 1;

      RAWDA_MONTHS.forEach((m, mIdx) => {
        const monthNum = String(mIdx < 4 ? mIdx + 9 : mIdx - 3).padStart(2, '0');
        const calYear = yr.split('-')[mIdx < 4 ? 0 : 1];

        // 2 to 3 handovers per month
        const days = [10, 20, 28];
        days.forEach((dayNum, dIdx) => {
          const dayStr = String(dayNum).padStart(2, '0');
          const receiptNumber = `REC-HDV-RWD-${yrPrefix}-${String(voucherCounter).padStart(3, '0')}`;
          voucherCounter++;

          const amount = 30000 + (dIdx * 5000) + (mIdx * 1000) + (yIdx * 2000);
          const receiverName = receivers[(dIdx + mIdx) % receivers.length];
          const notes = dIdx === 0
            ? 'إيداع إيرادات التسجيلات بالخزينة المركزية'
            : dIdx === 1
            ? 'تسليم سيولة الاشتراكات اليومية المجمعة'
            : 'ترحيل فائض الصندوق الشهري وتصفية العهدة';

          data.push({
            id: `hnd-${yr}-${m.id}-${dIdx + 1}`,
            academicYear: yr,
            month: m.id,
            date: `${calYear}-${monthNum}-${dayStr}`,
            receiptNumber,
            amount,
            receiverName,
            notes,
          });
        });
      });
    });
    return data;
  });

  // UI Modals
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingHandover, setEditingHandover] = useState(null);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Inline Editing
  const [inlineEdit, setInlineEdit] = useState(null); // { id, field }
  const [inlineVal, setInlineVal] = useState('');

  // Right-Click Context Menu
  const [contextMenu, setContextMenu] = useState(null); // { x, y, handover }

  // Form State
  const [handoverForm, setHandoverForm] = useState({
    date: new Date().toISOString().split('T')[0],
    receiptNumber: '',
    amount: '',
    receiverName: 'محمد بوري (المدير العام)',
    notes: '',
  });

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = () => setContextMenu(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Filter records by year and month
  const yearHandovers = useMemo(() => {
    return handovers.filter((h) => h.academicYear === selectedYear);
  }, [handovers, selectedYear]);

  const monthHandovers = useMemo(() => {
    if (selectedMonth === 'ALL') return yearHandovers;
    return yearHandovers.filter((h) => h.month === selectedMonth);
  }, [yearHandovers, selectedMonth]);

  const filteredHandovers = useMemo(() => {
    return monthHandovers.filter((h) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        h.receiptNumber.toLowerCase().includes(q) ||
        h.receiverName.toLowerCase().includes(q) ||
        (h.notes && h.notes.toLowerCase().includes(q)) ||
        h.date.includes(q)
      );
    });
  }, [monthHandovers, searchTerm]);

  // KPIs Calculations
  const totalDelivered = filteredHandovers.reduce((acc, h) => acc + Number(h.amount || 0), 0);
  const vouchersCount = filteredHandovers.length;
  const lastHandover = filteredHandovers[filteredHandovers.length - 1];

  const currentMonthObj = RAWDA_MONTHS.find((m) => m.id === selectedMonth);
  const currentMonthName = currentMonthObj ? currentMonthObj.nameAr : 'كافة الشهور';

  const kpiCards = [
    {
      label: 'إجمالي السيولة النقدية المسلّمة',
      value: `${totalDelivered.toLocaleString()} دج`,
      icon: ArrowLeftRight,
      subtext: `محولة ومودعة بالخزينة (${currentMonthName} - ${selectedYear})`,
      change: '100% مؤكد ✓',
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

  // Open full edit modal
  const handleOpenEdit = (h) => {
    setEditingHandover(h);
    setHandoverForm({
      date: h.date,
      receiptNumber: h.receiptNumber,
      amount: String(h.amount),
      receiverName: h.receiverName,
      notes: h.notes || '',
    });
    setErrorMessage('');
    setIsAddModalOpen(true);
  };

  // Open add new modal
  const handleOpenAdd = () => {
    setEditingHandover(null);
    const yrPrefix = selectedYear.slice(2, 4);
    const nextNum = yearHandovers.length + 1;
    setHandoverForm({
      date: new Date().toISOString().split('T')[0],
      receiptNumber: `REC-HDV-RWD-${yrPrefix}-${String(nextNum).padStart(3, '0')}`,
      amount: '',
      receiverName: 'محمد بوري (المدير العام)',
      notes: '',
    });
    setErrorMessage('');
    setIsAddModalOpen(true);
  };

  // Save Handover (Create or Edit) with Duplicate Receipt Check
  const handleSaveHandover = (e) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedReceipt = handoverForm.receiptNumber.trim();
    if (!trimmedReceipt) {
      setErrorMessage('يرجى إدخال رقم الوصل المالي للسند');
      return;
    }

    // Duplicate check within same academic year
    const isDuplicate = yearHandovers.some(
      (h) =>
        h.receiptNumber.toLowerCase() === trimmedReceipt.toLowerCase() &&
        (!editingHandover || h.id !== editingHandover.id)
    );

    if (isDuplicate) {
      setErrorMessage(`خطأ في التحقق المالي: رقم الوصل (${trimmedReceipt}) مكرر ومسجل مسبقاً في هذه السنة المالية.`);
      return;
    }

    const amt = Number(handoverForm.amount) || 0;
    if (amt <= 0) {
      setErrorMessage('يرجى إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }

    // Determine target month from date
    const monthNum = parseInt(handoverForm.date.split('-')[1], 10);
    let targetMonthId = 'sep';
    if (monthNum >= 9 && monthNum <= 12) {
      const idx = monthNum - 9;
      targetMonthId = RAWDA_MONTHS[idx].id;
    } else if (monthNum >= 1 && monthNum <= 7) {
      const idx = monthNum + 3;
      targetMonthId = RAWDA_MONTHS[idx].id;
    }

    if (editingHandover) {
      setHandovers((prev) =>
        prev.map((h) =>
          h.id === editingHandover.id
            ? {
                ...h,
                date: handoverForm.date,
                receiptNumber: trimmedReceipt,
                amount: amt,
                receiverName: handoverForm.receiverName,
                notes: handoverForm.notes,
                month: targetMonthId,
              }
            : h
        )
      );
    } else {
      const newEntry = {
        id: `hnd-${selectedYear}-${Date.now()}`,
        academicYear: selectedYear,
        month: selectedMonth === 'ALL' ? targetMonthId : selectedMonth,
        date: handoverForm.date,
        receiptNumber: trimmedReceipt,
        amount: amt,
        receiverName: handoverForm.receiverName,
        notes: handoverForm.notes,
      };
      setHandovers((prev) => [...prev, newEntry]);
    }

    setIsAddModalOpen(false);
  };

  // Delete Handover
  const handleDeleteHandover = (id) => {
    if (window.confirm('هل أنت متأكد من حذف سند تسليم العهدة هذا نهائياً من السجل؟')) {
      setHandovers((prev) => prev.filter((h) => h.id !== id));
    }
  };

  // Inline Cell Editing
  const startInlineEdit = (id, field, currentVal) => {
    setInlineEdit({ id, field });
    setInlineVal(String(currentVal ?? ''));
  };

  const commitInlineEdit = () => {
    if (!inlineEdit) return;
    const { id, field } = inlineEdit;

    if (field === 'receiptNumber') {
      const trimmed = inlineVal.trim();
      const isDuplicate = yearHandovers.some(
        (h) => h.receiptNumber.toLowerCase() === trimmed.toLowerCase() && h.id !== id
      );
      if (isDuplicate) {
        alert(`تنبيه: رقم الوصل (${trimmed}) مسجل مسبقاً في هذه السنة المالية.`);
        setInlineEdit(null);
        return;
      }
    }

    setHandovers((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          let updatedVal = inlineVal;
          if (field === 'amount') updatedVal = Number(inlineVal) || 0;
          return { ...h, [field]: updatedVal };
        }
        return h;
      })
    );
    setInlineEdit(null);
  };

  // Open voucher modal
  const handleOpenVoucherModal = (h) => {
    setSelectedVoucher({
      receiptNumber: h.receiptNumber,
      payerName: 'روضة وحضانة الأطفال العباقرة',
      category: 'تسليم وترحيل عهدة نقدية',
      amount: h.amount,
      paymentMethod: 'تحويل نقدي للإدارة المركزية',
      branch: 'الخزينة المركزية',
      date: h.date,
      notes: `المستلم: ${h.receiverName} - ${h.notes || 'تسليم رسمي معتمد'}`,
    });
  };

  // Context Menu
  const handleContextMenu = (e, h, fieldName) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      handover: h,
      field: fieldName,
    });
  };

  // Copy row to clipboard as TSV
  const handleCopyTSV = (h) => {
    const tsv = `${h.date}\t${h.receiptNumber}\t${h.amount}\t${h.receiverName}\t${h.notes || ''}`;
    navigator.clipboard.writeText(tsv);
    alert('تم نسخ بيانات السند إلى الحافظة بنجاح');
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['السنة الدراسية', 'الشهر', 'التاريخ', 'رقم الوصل المالي', 'المبلغ المسلّم (دج)', 'اسم المستلم', 'الملاحظات'];
    const rows = filteredHandovers.map((h) => [
      h.academicYear,
      h.month,
      h.date,
      h.receiptNumber,
      h.amount,
      h.receiverName,
      `"${(h.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rawda_cash_handover_${selectedYear}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Group handovers by month for ALL view
  const groupedByMonth = useMemo(() => {
    if (selectedMonth !== 'ALL') {
      return [{ monthId: selectedMonth, list: filteredHandovers }];
    }
    return RAWDA_MONTHS.map((m) => {
      const list = filteredHandovers.filter((h) => h.month === m.id);
      return { monthId: m.id, monthName: m.nameAr, list };
    }).filter((g) => g.list.length > 0);
  }, [filteredHandovers, selectedMonth]);

  return (
    <div className="space-y-3 p-3 bg-slate-50 min-h-screen text-slate-800 font-sans" dir="rtl">
      {/* 1. TOP COMPACT HEADER (Replacing bulky sub-header banner) */}
      <div className="bg-white border border-slate-200 px-3 py-2 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        {/* Right side: Title & Info Button */}
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-blue-900 text-white font-bold text-[11px] rounded-xs">
            روضة وحضانة الأطفال العباقرة
          </span>
          <span className="text-slate-300">|</span>
          <h1 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <ArrowLeftRight className="w-4 h-4 text-blue-900" />
            سجل تسليم السيولة والعهد
          </h1>
          <span className="text-[11px] text-slate-500 hidden md:inline font-sans">
            (Rawda Cash Custody & Safe Handover Registry)
          </span>

          {/* Info Modal Button */}
          <button
            onClick={() => setIsInfoModalOpen(true)}
            title="معلومات وتفاصيل الواجهة"
            className="p-1 text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-xs transition-colors flex items-center gap-0.5 text-xs font-semibold"
          >
            <Info className="w-4 h-4 text-blue-700" />
            <span className="text-[11px] underline">دليل الواجهة</span>
          </button>
        </div>

        {/* Left side: Year Selector, Search & Action Icons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Year selector */}
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[11px] font-semibold text-slate-600">الموسم:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent font-mono text-xs font-bold text-blue-950 focus:outline-hidden cursor-pointer"
            >
              <option value="2024-2025">2024-2025</option>
              <option value="2025-2026">2025-2026</option>
              <option value="2026-2027">2026-2027</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث بالوصل، المستلم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-7 w-44 ps-7 pe-2 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-900 transition-colors"
            />
          </div>

          {/* Icon-Only Action Buttons */}
          <button
            onClick={() => window.print()}
            title="طباعة السجل الحالي"
            className="h-7 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1 text-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-700" />
          </button>

          <button
            onClick={handleExportCSV}
            title="تصدير كملف CSV"
            className="h-7 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1 text-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-700" />
          </button>

          <button
            onClick={handleOpenAdd}
            title="تسجيل سند تسليم عهدة جديد"
            className="h-7 px-2.5 bg-blue-900 hover:bg-blue-950 text-white font-semibold flex items-center gap-1 text-xs shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>سند جديد</span>
          </button>
        </div>
      </div>

      {/* 2. 11-MONTH NAVIGATION TABS */}
      <div className="bg-white border border-slate-200 p-1.5 shadow-2xs flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setSelectedMonth('ALL')}
          className={`h-7 px-2.5 text-xs font-bold shrink-0 transition-colors border ${
            selectedMonth === 'ALL'
              ? 'bg-blue-900 text-white border-blue-900 shadow-2xs'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          كافة الشهور (11 شهراً)
        </button>
        <span className="w-px h-4 bg-slate-200 shrink-0 mx-0.5" />

        {RAWDA_MONTHS.map((m) => {
          const count = yearHandovers.filter((h) => h.month === m.id).length;
          const isSelected = selectedMonth === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setSelectedMonth(m.id)}
              className={`h-7 px-2.5 text-xs font-semibold shrink-0 transition-colors border flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-blue-900 text-white border-blue-900 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>{m.nameAr}</span>
              <span
                className={`px-1 py-0.2 rounded-full text-[10px] font-mono ${
                  isSelected ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. KPI METRICS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white border border-slate-200 p-2.5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-semibold">{kpi.label}</span>
                <div className="p-1 bg-slate-50 rounded-xs text-blue-900 border border-slate-100">
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <div className="text-base font-bold font-mono text-slate-900 leading-tight">
                  {kpi.value}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
                  <span>{kpi.subtext}</span>
                  <span className="text-emerald-700 font-bold font-mono">{kpi.change}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. COMPACT DATA TABLE WITH MONTHLY & GRAND TOTALS */}
      <div className="bg-white border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-3 py-1.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">بيانات سندات تسليم السيولة النقدية</span>
            <span className="text-slate-400 font-mono text-[11px]">
              ({filteredHandovers.length} سند مسجل)
            </span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-2">
            <span className="bg-amber-50 border border-amber-200 text-amber-900 px-1.5 py-0.5 rounded-xs">
              💡 انقر نقراً مزدوجاً أو بالزر الأيمن للتعديل
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs border-collapse">
            <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold select-none">
              <tr>
                <th className="p-2 text-center border-e border-slate-200 w-10">#</th>
                <th className="p-2 text-start border-e border-slate-200 min-w-[105px]">التاريخ</th>
                <th className="p-2 text-center border-e border-slate-200 min-w-[150px]">رقم الوصل المعتمد</th>
                <th className="p-2 text-end border-e border-slate-200 min-w-[140px]">المبلغ المسلّم (دج)</th>
                <th className="p-2 text-start border-e border-slate-200 min-w-[180px]">اسم المستلم(ة)</th>
                <th className="p-2 text-start border-e border-slate-200 min-w-[260px]">الملاحظات وتفاصيل السند</th>
                <th className="p-2 text-center min-w-[110px] print:hidden">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {groupedByMonth.map((grp) => {
                const monthSubtotal = grp.list.reduce((acc, h) => acc + Number(h.amount || 0), 0);
                const monthObj = RAWDA_MONTHS.find((m) => m.id === grp.monthId);
                const titleAr = monthObj ? monthObj.nameAr : grp.monthId;

                return (
                  <React.Fragment key={grp.monthId}>
                    {/* Month Section Header when in ALL view */}
                    {selectedMonth === 'ALL' && (
                      <tr className="bg-slate-200/70 border-y border-slate-300 font-bold text-slate-800">
                        <td colSpan={7} className="p-1.5 px-3">
                          <div className="flex items-center justify-between">
                            <span className="text-blue-900 font-bold">شهر {titleAr}</span>
                            <span className="font-mono text-slate-600 text-[11px]">
                              {grp.list.length} سندات تسليم
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}

                    {grp.list.map((h, idx) => {
                      const isEditingDate = inlineEdit?.id === h.id && inlineEdit?.field === 'date';
                      const isEditingReceipt = inlineEdit?.id === h.id && inlineEdit?.field === 'receiptNumber';
                      const isEditingAmount = inlineEdit?.id === h.id && inlineEdit?.field === 'amount';
                      const isEditingReceiver = inlineEdit?.id === h.id && inlineEdit?.field === 'receiverName';
                      const isEditingNotes = inlineEdit?.id === h.id && inlineEdit?.field === 'notes';

                      return (
                        <tr
                          key={h.id}
                          onContextMenu={(e) => handleContextMenu(e, h, 'row')}
                          className="hover:bg-blue-50/40 transition-colors h-8 text-[11px]"
                        >
                          {/* Row Number */}
                          <td className="p-1 text-center border-e border-slate-200 font-mono text-slate-400 font-bold">
                            {idx + 1}
                          </td>

                          {/* Date */}
                          <td
                            onDoubleClick={() => startInlineEdit(h.id, 'date', h.date)}
                            className="p-1 border-e border-slate-200 font-mono text-slate-900 font-medium cursor-pointer"
                          >
                            {isEditingDate ? (
                              <input
                                type="date"
                                autoFocus
                                value={inlineVal}
                                onChange={(e) => setInlineVal(e.target.value)}
                                onBlur={commitInlineEdit}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') commitInlineEdit();
                                  if (e.key === 'Escape') setInlineEdit(null);
                                }}
                                className="w-full h-6 px-1 text-xs border border-blue-600 bg-white font-mono"
                              />
                            ) : (
                              <span>{h.date}</span>
                            )}
                          </td>

                          {/* Receipt Number */}
                          <td
                            onDoubleClick={() => startInlineEdit(h.id, 'receiptNumber', h.receiptNumber)}
                            className="p-1 text-center border-e border-slate-200 font-mono font-bold text-blue-900 cursor-pointer"
                          >
                            {isEditingReceipt ? (
                              <input
                                type="text"
                                autoFocus
                                value={inlineVal}
                                onChange={(e) => setInlineVal(e.target.value)}
                                onBlur={commitInlineEdit}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') commitInlineEdit();
                                  if (e.key === 'Escape') setInlineEdit(null);
                                }}
                                className="w-full h-6 px-1 text-center text-xs border border-blue-600 bg-white font-mono font-bold"
                              />
                            ) : (
                              <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-xs text-blue-900">
                                {h.receiptNumber}
                              </span>
                            )}
                          </td>

                          {/* Amount */}
                          <td
                            onDoubleClick={() => startInlineEdit(h.id, 'amount', h.amount)}
                            className="p-1 text-end border-e border-slate-200 font-mono font-bold text-emerald-800 text-xs cursor-pointer"
                          >
                            {isEditingAmount ? (
                              <input
                                type="number"
                                autoFocus
                                value={inlineVal}
                                onChange={(e) => setInlineVal(e.target.value)}
                                onBlur={commitInlineEdit}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') commitInlineEdit();
                                  if (e.key === 'Escape') setInlineEdit(null);
                                }}
                                className="w-full h-6 px-1 text-end text-xs border border-blue-600 bg-white font-mono font-bold"
                              />
                            ) : (
                              <span>{Number(h.amount || 0).toLocaleString()} دج</span>
                            )}
                          </td>

                          {/* Receiver Name */}
                          <td
                            onDoubleClick={() => startInlineEdit(h.id, 'receiverName', h.receiverName)}
                            className="p-1 border-e border-slate-200 font-semibold text-slate-900 cursor-pointer"
                          >
                            {isEditingReceiver ? (
                              <select
                                autoFocus
                                value={inlineVal}
                                onChange={(e) => setInlineVal(e.target.value)}
                                onBlur={commitInlineEdit}
                                className="w-full h-6 px-1 text-xs border border-blue-600 bg-white font-semibold"
                              >
                                <option value="محمد بوري (المدير العام)">محمد بوري (المدير العام)</option>
                                <option value="صلاح الدين (المسؤول المالي)">صلاح الدين (المسؤول المالي)</option>
                                <option value="الإدارة المركزية (الخزينة)">الإدارة المركزية (الخزينة)</option>
                              </select>
                            ) : (
                              <span>{h.receiverName}</span>
                            )}
                          </td>

                          {/* Notes */}
                          <td
                            onDoubleClick={() => startInlineEdit(h.id, 'notes', h.notes)}
                            className="p-1 border-e border-slate-200 text-slate-600 cursor-pointer truncate max-w-[260px]"
                            title={h.notes}
                          >
                            {isEditingNotes ? (
                              <input
                                type="text"
                                autoFocus
                                value={inlineVal}
                                onChange={(e) => setInlineVal(e.target.value)}
                                onBlur={commitInlineEdit}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') commitInlineEdit();
                                  if (e.key === 'Escape') setInlineEdit(null);
                                }}
                                className="w-full h-6 px-1 text-xs border border-blue-600 bg-white"
                              />
                            ) : (
                              <span>{h.notes || '-'}</span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="p-1 text-center print:hidden">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenVoucherModal(h)}
                                title="معاينة وطباعة السند"
                                className="p-1 bg-slate-100 hover:bg-blue-50 text-blue-900 border border-slate-200 rounded-xs transition-colors"
                              >
                                <Eye className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(h)}
                                title="تعديل السند"
                                className="p-1 bg-slate-100 hover:bg-amber-50 text-amber-700 border border-slate-200 rounded-xs transition-colors"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteHandover(h.id)}
                                title="حذف السند"
                                className="p-1 bg-slate-100 hover:bg-rose-50 text-rose-700 border border-slate-200 rounded-xs transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Monthly Subtotal Row (Mandatory Requirement) */}
                    <tr className="bg-slate-100/90 font-bold border-y border-slate-300 font-mono text-[11px]">
                      <td colSpan={3} className="p-1.5 px-3 text-start font-sans text-slate-700 border-e border-slate-200">
                        مجموع تسليمات شهر {titleAr}
                      </td>
                      <td className="p-1.5 text-end border-e border-slate-200 text-emerald-800 font-bold">
                        {monthSubtotal.toLocaleString()} دج
                      </td>
                      <td colSpan={3} className="p-1.5 px-3 text-start font-sans text-slate-500 text-[10px]">
                        {grp.list.length} سندات تسليم مؤكدة لهذا الشهر
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>

            {/* GRAND TOTAL ROW */}
            <tfoot className="bg-slate-200 font-bold border-t-2 border-slate-400 font-mono text-xs">
              <tr>
                <td colSpan={3} className="p-2 px-3 text-start font-sans text-slate-900 border-e border-slate-300">
                  المجموع الإجمالي العام للسيولة المحولة ({selectedMonth === 'ALL' ? 'السنة كاملة' : currentMonthName})
                </td>
                <td className="p-2 text-end border-e border-slate-300 text-emerald-900 text-sm font-bold">
                  {totalDelivered.toLocaleString()} دج
                </td>
                <td colSpan={3} className="p-2 px-3 text-start font-sans text-xs text-slate-600">
                  {filteredHandovers.length} سندات تسليم رسمية مسجلة
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 5. RIGHT-CLICK CONTEXT MENU */}
      {contextMenu && (
        <div
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 bg-white border border-slate-300 shadow-xl py-1 text-xs w-52 divide-y divide-slate-100 animate-in fade-in zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1 font-bold text-slate-700 bg-slate-50 text-[11px] flex items-center justify-between">
            <span>{contextMenu.handover.receiptNumber}</span>
            <span className="text-emerald-700 font-mono font-bold">
              {Number(contextMenu.handover.amount).toLocaleString()} دج
            </span>
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                handleOpenVoucherModal(contextMenu.handover);
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-start hover:bg-blue-50 flex items-center gap-2 text-slate-700"
            >
              <Eye className="w-3.5 h-3.5 text-blue-900" />
              <span>معاينة وطباعة السند المالي</span>
            </button>
            <button
              onClick={() => {
                handleOpenEdit(contextMenu.handover);
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-start hover:bg-blue-50 flex items-center gap-2 text-slate-700"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-700" />
              <span>تعديل بيانات السند بالكامل</span>
            </button>
            <button
              onClick={() => {
                startInlineEdit(contextMenu.handover.id, 'amount', contextMenu.handover.amount);
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-start hover:bg-blue-50 flex items-center gap-2 text-slate-700"
            >
              <Edit2 className="w-3.5 h-3.5 text-blue-600" />
              <span>تعديل المبلغ مباشرة</span>
            </button>
            <button
              onClick={() => {
                handleCopyTSV(contextMenu.handover);
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-start hover:bg-blue-50 flex items-center gap-2 text-slate-700"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>نسخ بيانات السند (TSV)</span>
            </button>
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                handleDeleteHandover(contextMenu.handover.id);
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-start hover:bg-rose-50 text-rose-700 flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>حذف السند من السجل</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. INFO MODAL (REPLACING OLD BULKY BANNER) */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-lg p-5 text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 text-blue-900 rounded-xs">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    دليل واجهة: سجل تسليم السيولة والعهد (1.7)
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Rawda Cash Custody & Safe Handover Registry
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-slate-700 leading-relaxed">
              <div className="p-2.5 bg-blue-50 border-s-4 border-blue-900 text-blue-950">
                <p className="font-semibold mb-1">الهدف والمفهوم المحاسبي:</p>
                <p className="text-[11px]">
                  توثيق محاضر وسندات ترحيل وتسليم السيولة النقدية اليومية من صندوق الروضة إلى الإدارة
                  المركزية أو الحساب البنكي، مع تطبيق قواعد منع تكرار رقم الوصل نهائياً وضمان تطابق
                  سجلات الصندوق اليومي مع السندات الفعلية.
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="font-bold text-slate-800">القواعد والضوابط الصارمة:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                  <li>
                    <strong>منع تكرار رقم الوصل:</strong> يمنع النظام تكرار رقم الوصل المالي داخل نفس
                    الموسم الدراسي نهائياً لمنع أي ازدواجية مالية.
                  </li>
                  <li>
                    <strong>المطابقة مع الصندوق اليومي:</strong> كل عملية تسليم تقتطع تلقائياً من
                    رصيد الصندوق اليومي للروضة في بند السيولة المسلمة للإدارة.
                  </li>
                  <li>
                    <strong>دعم متعدد السنوات والأشهر:</strong> إمكانية التنقل بين المواسم الدراسية
                    (2024-2025، 2025-2026، 2026-2027) وشهور الموسم الـ 11.
                  </li>
                  <li>
                    <strong>التعديل والتحكم بالماوس:</strong> انقر نقراً مزدوجاً أو اضغط بالزر الأيمن
                    على أي سطر لإجراء تعديلات مباشرة أو نسخ أو طباعة.
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t pt-3 flex justify-end">
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="px-4 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-semibold text-xs shadow-2xs cursor-pointer"
              >
                فهمت ذلك، إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. ADD / EDIT HANDOVER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">
                {editingHandover ? 'تعديل سند تسليم عهدة نقدية' : 'تسجيل سند تسليم عهدة نقدية جديد'}
              </span>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
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
                  value={handoverForm.date}
                  onChange={(e) => setHandoverForm({ ...handoverForm, date: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  رقم الوصل المالي المعتمد * (لا يقبل التكرار)
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: REC-HDV-RWD-26-001"
                  value={handoverForm.receiptNumber}
                  onChange={(e) => setHandoverForm({ ...handoverForm, receiptNumber: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono text-blue-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">المبلغ المسلّم (دج) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="مثال: 45000"
                  value={handoverForm.amount}
                  onChange={(e) => setHandoverForm({ ...handoverForm, amount: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono font-bold text-emerald-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">المسؤول المستلم *</label>
                <select
                  value={handoverForm.receiverName}
                  onChange={(e) => setHandoverForm({ ...handoverForm, receiverName: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-semibold"
                >
                  <option value="محمد بوري (المدير العام)">محمد بوري (المدير العام)</option>
                  <option value="صلاح الدين (المسؤول المالي)">صلاح الدين (المسؤول المالي)</option>
                  <option value="الإدارة المركزية (الخزينة)">الإدارة المركزية (الخزينة)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">الملاحظات وتفاصيل السند</label>
                <textarea
                  rows={2}
                  placeholder="بيانات إضافية عن السند والجهة المودع لديها..."
                  value={handoverForm.notes}
                  onChange={(e) => setHandoverForm({ ...handoverForm, notes: e.target.value })}
                  className="w-full p-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-semibold flex items-center gap-1 shadow-2xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingHandover ? 'تحديث السند' : 'حفظ وتثبيت السند'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. OFFICIAL RECEIPT VOUCHER PREVIEW MODAL */}
      {selectedVoucher && (
        <ReceiptVoucherModal
          isOpen={Boolean(selectedVoucher)}
          onClose={() => setSelectedVoucher(null)}
          voucher={selectedVoucher}
        />
      )}
    </div>
  );
}
