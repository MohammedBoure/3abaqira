import React, { useState, useMemo, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  CreditCard,
  Coins,
  Calendar,
  Plus,
  X,
  Printer,
  Download,
  Search,
  Info,
  Edit2,
  Trash2,
  Copy,
  Sliders,
  Check,
  TrendingUp,
  FileText,
  Eye,
} from 'lucide-react';
import { ReceiptVoucherModal } from '../common/ReceiptVoucherModal';
import { MOCK_CENTER_PREPARATORY } from '../../../mock/centerMockData';

const PREP_MONTHS = [
  { id: 'sep', label: 'سبتمبر', receiptLabel: 'رقم الوصل' },
  { id: 'oct', label: 'أكتوبر', receiptLabel: 'رقم الوصل' },
  { id: 'nov', label: 'نوفمبر', receiptLabel: 'رقم الوصل' },
  { id: 'dec', label: 'ديسمبر', receiptLabel: 'رقم الوصل' },
  { id: 'jan', label: 'جانفي', receiptLabel: 'الوصل' },
  { id: 'feb', label: 'فيفري', receiptLabel: 'الوصل' },
  { id: 'mar', label: 'مارس', receiptLabel: 'الوصل' },
  { id: 'apr', label: 'أفريل', receiptLabel: 'الوصل' },
  { id: 'may', label: 'ماي', receiptLabel: 'الوصل' },
];

const PREP_SECTIONS = ['القسم التحضيري أ', 'القسم التحضيري ب', 'القسم التحضيري ج'];

export function CenterPreparatoryView() {
  const [selectedYear, setSelectedYear] = useState('2025-2026');
  const [activeTab, setActiveTab] = useState('table'); // 'table' | 'kpis'
  const [searchTerm, setSearchTerm] = useState('');
  const [sectionFilter, setSectionFilter] = useState('ALL');

  // Children Dataset
  const [children, setChildren] = useState(() => {
    return MOCK_CENTER_PREPARATORY.map((c, idx) => ({
      ...c,
      academicYear: '2025-2026',
      birthDate: c.birthDate || '2020-04-15',
      registrationDate: c.registrationDate || '2025-09-01',
      regReceipt: c.regReceipt || `REC-PRP-REG-${idx + 1}`,
      monthlyDue: c.monthlyDue || 12000,
      months: c.months || {
        sep: { paid: 12000, receipt: `REC-PRP-26-${idx + 1}1` },
        oct: { paid: 12000, receipt: `REC-PRP-26-${idx + 1}2` },
        nov: { paid: 12000, receipt: `REC-PRP-26-${idx + 1}3` },
        dec: { paid: 0, receipt: '' },
        jan: { paid: 0, receipt: '' },
        feb: { paid: 0, receipt: '' },
        mar: { paid: 0, receipt: '' },
        apr: { paid: 0, receipt: '' },
        may: { paid: 0, receipt: '' },
      },
    }));
  });

  // UI Modals
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [relationalEditChild, setRelationalEditChild] = useState(null);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  // Inline Cell Editing
  const [inlineEdit, setInlineEdit] = useState(null); // { id, field }
  const [inlineVal, setInlineVal] = useState('');

  // Right-Click Context Menu
  const [contextMenu, setContextMenu] = useState(null);

  // New Child Form
  const [newChild, setNewChild] = useState({
    fullName: '',
    section: PREP_SECTIONS[0],
    registrationFee: 8000,
    regReceipt: '',
    birthDate: '2020-01-01',
    registrationDate: new Date().toISOString().split('T')[0],
    monthlyDue: 12000,
    sepPaid: 12000,
    sepReceipt: '',
  });

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = () => setContextMenu(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Filtered Children
  const filteredChildren = useMemo(() => {
    return children.filter((c) => {
      const matchYear = !c.academicYear || c.academicYear === selectedYear;
      const term = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        c.fullName.toLowerCase().includes(term) ||
        c.section.toLowerCase().includes(term) ||
        (c.regReceipt && c.regReceipt.toLowerCase().includes(term));

      const matchSection = sectionFilter === 'ALL' || c.section === sectionFilter;
      return matchYear && matchSearch && matchSection;
    });
  }, [children, selectedYear, searchTerm, sectionFilter]);

  // KPIs
  const totalKids = children.length;
  const totalRegFees = children.reduce((acc, c) => acc + Number(c.registrationFee || 0), 0);
  const totalCollected = children.reduce((acc, c) => {
    const sumMonths = PREP_MONTHS.reduce((mAcc, m) => mAcc + Number(c.months?.[m.id]?.paid || 0), 0);
    return acc + Number(c.registrationFee || 0) + sumMonths;
  }, 0);

  const totalExpected = children.reduce((acc, c) => {
    return acc + Number(c.registrationFee || 0) + Number(c.monthlyDue || 12000) * 9;
  }, 0);
  const totalDebts = Math.max(0, totalExpected - totalCollected);
  const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

  const kpiCards = [
    {
      label: 'إجمالي أطفال القسم التحضيري',
      value: `${totalKids} أطفال`,
      icon: GraduationCap,
      subtext: `القسم التحضيري المدرسي (${selectedYear})`,
      change: 'طاقة استيعاب مكتملة',
      isPositive: true,
    },
    {
      label: 'إجمالي حقوق التسجيل المحصلة',
      value: `${totalRegFees.toLocaleString()} دج`,
      icon: CreditCard,
      subtext: '8,000 دج رسوم الملف والتأمين',
      change: '100% مسدد ✓',
      isPositive: true,
    },
    {
      label: 'المبالغ المحصلة فعلياً (دج)',
      value: `${totalCollected.toLocaleString()} دج`,
      icon: Coins,
      subtext: `${collectionRate}% نسبة التحصيل الشامل`,
      change: 'مقبوض بالخزينة ✓',
      isPositive: true,
    },
    {
      label: 'المتبقيات والديون المجدولة',
      value: `${totalDebts.toLocaleString()} دج`,
      icon: Calendar,
      subtext: 'أقساط باقي الموسم الدراسي (9 أشهر)',
      change: totalDebts > 0 ? 'متبقي' : '0 دج ✓',
      isPositive: totalDebts === 0,
    },
  ];

  // Inline Cell Editing
  const startInlineEdit = (id, field, currentVal) => {
    setInlineEdit({ id, field });
    setInlineVal(String(currentVal ?? ''));
  };

  const commitInlineEdit = () => {
    if (!inlineEdit) return;
    const { id, field } = inlineEdit;

    setChildren((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        let updated = { ...c };

        if (field === 'fullName') updated.fullName = inlineVal.trim() || updated.fullName;
        if (field === 'section') updated.section = inlineVal;
        if (field === 'registrationFee') updated.registrationFee = Math.max(0, Number(inlineVal) || 0);
        if (field === 'regReceipt') updated.regReceipt = inlineVal.trim();
        if (field === 'birthDate') updated.birthDate = inlineVal;
        if (field === 'registrationDate') updated.registrationDate = inlineVal;
        if (field === 'monthlyDue') updated.monthlyDue = Math.max(0, Number(inlineVal) || 0);

        if (field.startsWith('month.')) {
          const [, mId, subField] = field.split('.');
          const currentMonthData = updated.months?.[mId] || { paid: 0, receipt: '' };
          let updatedMonthData = { ...currentMonthData };

          if (subField === 'paid') updatedMonthData.paid = Math.max(0, Number(inlineVal) || 0);
          if (subField === 'receipt') updatedMonthData.receipt = inlineVal.trim();

          updated.months = { ...updated.months, [mId]: updatedMonthData };
        }

        // Recalculate totals
        const sumMonths = PREP_MONTHS.reduce(
          (acc, m) => acc + Number(updated.months?.[m.id]?.paid || 0),
          0
        );
        updated.totalPaid = Number(updated.registrationFee || 0) + sumMonths;
        const expected = Number(updated.registrationFee || 0) + Number(updated.monthlyDue || 12000) * 9;
        updated.remaining = Math.max(0, expected - updated.totalPaid);

        return updated;
      })
    );

    setInlineEdit(null);
  };

  // Right-Click Context Menu
  const handleContextMenu = (e, c) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      child: c,
    });
  };

  // Delete Child
  const handleDeleteChild = (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطفل من القسم التحضيري؟')) {
      setChildren((prev) => prev.filter((c) => c.id !== id));
    }
  };

  // Save Relational Edit
  const handleSaveRelationalEdit = (e) => {
    e.preventDefault();
    if (!relationalEditChild) return;

    const reg = Number(relationalEditChild.registrationFee) || 0;
    const due = Number(relationalEditChild.monthlyDue) || 12000;
    const sumMonths = PREP_MONTHS.reduce(
      (acc, m) => acc + Number(relationalEditChild.months?.[m.id]?.paid || 0),
      0
    );

    const paid = reg + sumMonths;
    const exp = reg + due * 9;
    const rem = Math.max(0, exp - paid);

    const updated = {
      ...relationalEditChild,
      totalPaid: paid,
      remaining: rem,
    };

    setChildren((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setRelationalEditChild(null);
  };

  // Save New Child
  const handleSaveNewChild = (e) => {
    e.preventDefault();
    if (!newChild.fullName.trim()) return;

    const seq = children.length + 1;
    const regFee = Number(newChild.registrationFee) || 8000;
    const monthly = Number(newChild.monthlyDue) || 12000;
    const sep = Number(newChild.sepPaid) || 0;

    const monthsObj = {};
    PREP_MONTHS.forEach((m) => {
      if (m.id === 'sep') {
        monthsObj.sep = { paid: sep, receipt: newChild.sepReceipt || `REC-PRP-26-${seq}1` };
      } else {
        monthsObj[m.id] = { paid: 0, receipt: '' };
      }
    });

    const totalPaid = regFee + sep;
    const expected = regFee + monthly * 9;

    const entry = {
      id: `PREP-${Date.now()}`,
      seq,
      academicYear: selectedYear,
      fullName: newChild.fullName.trim(),
      section: newChild.section,
      registrationFee: regFee,
      regReceipt: newChild.regReceipt || `REC-PRP-REG-${seq}`,
      birthDate: newChild.birthDate,
      registrationDate: newChild.registrationDate,
      monthlyDue: monthly,
      months: monthsObj,
      totalPaid,
      remaining: Math.max(0, expected - totalPaid),
    };

    setChildren([entry, ...children]);
    setIsAddModalOpen(false);
  };

  // Open Voucher Preview
  const handleOpenVoucher = (child, receiptNum, label, amount) => {
    setSelectedVoucher({
      receiptNumber: receiptNum || `REC-PRP-26-${child.seq}`,
      payerName: child.fullName,
      category: `القسم التحضيري المدرسي (${child.section}) - ${label}`,
      amount: amount || child.monthlyDue,
      paymentMethod: 'نقداً (خزينة المركز)',
      branch: 'المركز الأكاديمي والتعليمي',
      date: new Date().toISOString().split('T')[0],
      notes: `المتبقي للموسم: ${(child.remaining || 0).toLocaleString()} دج`,
    });
  };

  // Copy TSV
  const handleCopyTSV = (c) => {
    const monthsData = PREP_MONTHS.map(
      (m) => `${c.months?.[m.id]?.paid || 0}\t${c.months?.[m.id]?.receipt || ''}`
    ).join('\t');
    const tsv = `${c.seq}\t${c.fullName}\t${c.section}\t${c.registrationFee}\t${c.regReceipt}\t${c.birthDate}\t${c.registrationDate}\t${c.monthlyDue}\t${monthsData}\t${c.totalPaid}\t${c.remaining}`;
    navigator.clipboard.writeText(tsv);
    alert('تم نسخ سطر بيانات الطفل بالكامل (TSV) إلى الحافظة بنجاح');
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      '#',
      'الاسم واللقب',
      'الفئة',
      'ح.تسجيل',
      'وصل التسجيل',
      'تاريخ الميلاد',
      'تاريخ الدفع',
      'المبلغ المستحق',
    ];
    PREP_MONTHS.forEach((m) => {
      headers.push(`مبلغ ${m.label}`);
      headers.push(m.receiptLabel + ` ${m.label}`);
    });
    headers.push('المجموع المحصل', 'الباقي');

    const rows = filteredChildren.map((c) => {
      const row = [
        c.seq,
        `"${c.fullName}"`,
        `"${c.section}"`,
        c.registrationFee,
        `"${c.regReceipt}"`,
        c.birthDate,
        c.registrationDate,
        c.monthlyDue,
      ];
      PREP_MONTHS.forEach((m) => {
        row.push(c.months?.[m.id]?.paid || 0);
        row.push(`"${c.months?.[m.id]?.receipt || ''}"`);
      });
      row.push(c.totalPaid, c.remaining);
      return row;
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `center_preparatory_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-2.5 p-3 bg-slate-50 min-h-screen text-slate-800 font-sans" dir="rtl">
      {/* 1. TOP COMPACT HEADER (Title renamed as requested to 'القسم التحضيري المدرسي' without years) */}
      <div className="bg-white border border-slate-200 px-3 py-2 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        {/* Right: Title & Info Button */}
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-blue-900 text-white font-bold text-[11px] rounded-xs">
            المركز الأكاديمي والتعليمي
          </span>
          <span className="text-slate-300">|</span>
          <h1 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-blue-900" />
            القسم التحضيري المدرسي
          </h1>
          <span className="text-[11px] text-slate-500 hidden md:inline font-sans">
            (Academic Preparatory School Registry)
          </span>

          <button
            onClick={() => setIsInfoModalOpen(true)}
            title="معلومات وتفاصيل الواجهة"
            className="p-1 text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-xs transition-colors flex items-center gap-0.5 text-xs font-semibold cursor-pointer"
          >
            <Info className="w-4 h-4 text-blue-700" />
            <span className="text-[11px] underline">دليل الواجهة</span>
          </button>
        </div>

        {/* Left: View Mode Tabs, Year, Search, Actions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Internal Tab Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 border border-slate-300 rounded-xs">
            <button
              onClick={() => setActiveTab('table')}
              className={`h-6 px-2.5 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>جدول أطفال التحضيري</span>
            </button>
            <button
              onClick={() => setActiveTab('kpis')}
              className={`h-6 px-2.5 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                activeTab === 'kpis'
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              <span>مؤشرات الأداء (KPIs)</span>
            </button>
          </div>

          {/* Year selector (Multi-year support) */}
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

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث باسم الطفل، الوصل..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-7 w-40 ps-7 pe-2 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-900 transition-colors"
            />
          </div>

          {/* Actions */}
          <button
            onClick={() => window.print()}
            title="طباعة السجل"
            className="h-7 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1 text-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-700" />
          </button>

          <button
            onClick={handleExportCSV}
            title="تصدير CSV"
            className="h-7 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1 text-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-700" />
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            title="تسجيل طفل جديد"
            className="h-7 px-2.5 bg-blue-900 hover:bg-blue-950 text-white font-semibold flex items-center gap-1 text-xs shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>طفل جديد</span>
          </button>
        </div>
      </div>

      {/* 2. DEDICATED KPIS TAB */}
      {activeTab === 'kpis' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {kpiCards.map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 p-3 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between text-slate-500 mb-1.5">
                    <span className="text-xs font-semibold">{kpi.label}</span>
                    <div className="p-1 bg-slate-50 rounded-xs text-blue-900 border border-slate-100">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-bold font-mono text-slate-900 leading-tight">
                      {kpi.value}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                      <span>{kpi.subtext}</span>
                      <span className="text-emerald-700 font-bold font-mono">{kpi.change}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="bg-white border border-slate-200 p-3 shadow-2xs space-y-2">
              <span className="font-bold text-slate-800 text-xs block">
                توزيع الأطفال حسب الأقسام:
              </span>
              <div className="space-y-1.5 text-xs">
                {PREP_SECTIONS.map((sec, sIdx) => {
                  const sCount = children.filter((c) => c.section === sec).length;
                  return (
                    <div key={sIdx} className="flex justify-between items-center p-2 bg-slate-50 border">
                      <span className="font-semibold text-slate-800">{sec}</span>
                      <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-xs">
                        {sCount} أطفال
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-3 shadow-2xs space-y-2">
              <span className="font-bold text-slate-800 text-xs block">
                تحصيل أقساط شهور الموسم الـ 9:
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
                {PREP_MONTHS.map((m) => {
                  const mSum = children.reduce((acc, c) => acc + Number(c.months?.[m.id]?.paid || 0), 0);
                  return (
                    <div key={m.id} className="p-1.5 bg-slate-50 border text-center">
                      <div className="font-sans text-[10px] text-slate-500">{m.label}</div>
                      <div className="font-bold text-emerald-800 text-[11px]">{mSum.toLocaleString()} دج</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN DATA TABLE (EXACT REQUESTED COLUMNS & COMPACT HEIGHT) */}
      {activeTab === 'table' && (
        <div className="bg-white border border-slate-200 shadow-2xs overflow-hidden space-y-0">
          <div className="px-3 py-1.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-700">
                سجل أطفال التحضيري ({filteredChildren.length} مسجلين)
              </span>

              {/* Section Filter */}
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="h-6 px-1.5 border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:border-blue-900"
              >
                <option value="ALL">كافة الأقسام</option>
                {PREP_SECTIONS.map((sec, sIdx) => (
                  <option key={sIdx} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-[11px] text-slate-500">
              <span className="bg-amber-50 border border-amber-200 text-amber-900 px-1.5 py-0.5 rounded-xs">
                💡 انقر نقراً مزدوجاً أو بالزر الأيمن للتعديل المباشر
              </span>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[640px]">
            <table className="w-full text-start text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-300 text-slate-700 font-bold select-none text-[11px]">
                <tr>
                  <th className="p-2 text-center border-e border-slate-200 w-10">#</th>
                  <th className="p-2 text-start border-e border-slate-200 min-w-[130px]">الاسم واللقب</th>
                  <th className="p-2 text-start border-e border-slate-200 min-w-[110px]">الفئة</th>
                  <th className="p-2 text-end border-e border-slate-200 min-w-[90px] bg-blue-50/20">ح,تسجيل</th>
                  <th className="p-2 text-center border-e border-slate-200 min-w-[90px]">الوصل</th>
                  <th className="p-2 text-center border-e border-slate-200 min-w-[95px]">تاريخ الميلاد</th>
                  <th className="p-2 text-center border-e border-slate-200 min-w-[95px]">تاريخ الدفع</th>
                  <th className="p-2 text-end border-e border-slate-200 min-w-[95px] bg-slate-50">المبلغ المستحق</th>

                  {/* 9 Months Columns (Sept to May) each followed by Receipt column */}
                  {PREP_MONTHS.map((m) => (
                    <React.Fragment key={m.id}>
                      <th className="p-2 text-end border-e border-slate-200 min-w-[80px] bg-slate-50/40">
                        {m.label}
                      </th>
                      <th className="p-2 text-center border-e border-slate-200 min-w-[85px]">
                        {m.receiptLabel}
                      </th>
                    </React.Fragment>
                  ))}

                  <th className="p-2 text-end border-e border-slate-200 min-w-[100px] text-emerald-900 bg-emerald-50/40">
                    المجموع
                  </th>
                  <th className="p-2 text-end border-e border-slate-200 min-w-[90px]">الباقي</th>
                  <th className="p-2 text-center min-w-[75px] print:hidden">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 text-[11px]">
                {filteredChildren.length === 0 ? (
                  <tr>
                    <td colSpan={29} className="p-8 text-center text-slate-400">
                      لا يوجد أطفال مطابقين لمعايير البحث
                    </td>
                  </tr>
                ) : (
                  filteredChildren.map((c, idx) => {
                    const isEditingName = inlineEdit?.id === c.id && inlineEdit?.field === 'fullName';
                    const isEditingSection = inlineEdit?.id === c.id && inlineEdit?.field === 'section';
                    const isEditingRegFee = inlineEdit?.id === c.id && inlineEdit?.field === 'registrationFee';
                    const isEditingRegRec = inlineEdit?.id === c.id && inlineEdit?.field === 'regReceipt';
                    const isEditingBirth = inlineEdit?.id === c.id && inlineEdit?.field === 'birthDate';
                    const isEditingRegDate = inlineEdit?.id === c.id && inlineEdit?.field === 'registrationDate';
                    const isEditingDue = inlineEdit?.id === c.id && inlineEdit?.field === 'monthlyDue';

                    return (
                      <tr
                        key={c.id}
                        onContextMenu={(e) => handleContextMenu(e, c)}
                        className="hover:bg-blue-50/40 transition-colors h-8"
                      >
                        {/* # */}
                        <td className="p-1 text-center border-e border-slate-200 font-mono text-slate-400 font-bold">
                          {idx + 1}
                        </td>

                        {/* الاسم واللقب */}
                        <td
                          onDoubleClick={() => startInlineEdit(c.id, 'fullName', c.fullName)}
                          className="p-1 border-e border-slate-200 font-bold text-slate-900 cursor-pointer"
                        >
                          {isEditingName ? (
                            <input
                              type="text"
                              autoFocus
                              value={inlineVal}
                              onChange={(e) => setInlineVal(e.target.value)}
                              onBlur={commitInlineEdit}
                              className="w-full h-6 px-1 text-xs border border-blue-600 bg-white font-bold"
                            />
                          ) : (
                            <span>{c.fullName}</span>
                          )}
                        </td>

                        {/* الفئة */}
                        <td
                          onDoubleClick={() => startInlineEdit(c.id, 'section', c.section)}
                          className="p-1 border-e border-slate-200 cursor-pointer"
                        >
                          {isEditingSection ? (
                            <select
                              autoFocus
                              value={inlineVal}
                              onChange={(e) => setInlineVal(e.target.value)}
                              onBlur={commitInlineEdit}
                              className="w-full h-6 px-1 text-xs border border-blue-600 bg-white font-semibold"
                            >
                              {PREP_SECTIONS.map((sec, sIdx) => (
                                <option key={sIdx} value={sec}>
                                  {sec}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="px-1.5 py-0.2 bg-blue-50 text-blue-900 border border-blue-200 text-[10px] font-semibold rounded-xs">
                              {c.section}
                            </span>
                          )}
                        </td>

                        {/* ح,تسجيل */}
                        <td
                          onDoubleClick={() => startInlineEdit(c.id, 'registrationFee', c.registrationFee)}
                          className="p-1 text-end border-e border-slate-200 font-mono font-bold text-emerald-800 bg-blue-50/10 cursor-pointer"
                        >
                          {isEditingRegFee ? (
                            <input
                              type="number"
                              autoFocus
                              value={inlineVal}
                              onChange={(e) => setInlineVal(e.target.value)}
                              onBlur={commitInlineEdit}
                              className="w-full h-6 px-1 text-end text-xs border border-blue-600 bg-white font-mono font-bold"
                            />
                          ) : (
                            <span>{Number(c.registrationFee || 0).toLocaleString()} دج</span>
                          )}
                        </td>

                        {/* الوصل (تسجيل) */}
                        <td
                          onDoubleClick={() => startInlineEdit(c.id, 'regReceipt', c.regReceipt)}
                          className="p-1 text-center border-e border-slate-200 font-mono text-[10px] cursor-pointer"
                        >
                          {isEditingRegRec ? (
                            <input
                              type="text"
                              autoFocus
                              value={inlineVal}
                              onChange={(e) => setInlineVal(e.target.value)}
                              onBlur={commitInlineEdit}
                              className="w-full h-6 px-1 text-center text-[10px] border border-blue-600 bg-white font-mono"
                            />
                          ) : c.regReceipt ? (
                            <button
                              onClick={() => handleOpenVoucher(c, c.regReceipt, 'حقوق التسجيل والملف', c.registrationFee)}
                              className="px-1 py-0.2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xs font-mono font-bold"
                            >
                              {c.regReceipt}
                            </button>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* تاريخ الميلاد */}
                        <td
                          onDoubleClick={() => startInlineEdit(c.id, 'birthDate', c.birthDate)}
                          className="p-1 text-center border-e border-slate-200 font-mono text-[10px] text-slate-600 cursor-pointer"
                        >
                          {isEditingBirth ? (
                            <input
                              type="date"
                              autoFocus
                              value={inlineVal}
                              onChange={(e) => setInlineVal(e.target.value)}
                              onBlur={commitInlineEdit}
                              className="w-full h-6 px-1 text-[10px] border border-blue-600 bg-white font-mono"
                            />
                          ) : (
                            <span>{c.birthDate}</span>
                          )}
                        </td>

                        {/* تاريخ الدفع */}
                        <td
                          onDoubleClick={() => startInlineEdit(c.id, 'registrationDate', c.registrationDate)}
                          className="p-1 text-center border-e border-slate-200 font-mono text-[10px] text-slate-600 cursor-pointer"
                        >
                          {isEditingRegDate ? (
                            <input
                              type="date"
                              autoFocus
                              value={inlineVal}
                              onChange={(e) => setInlineVal(e.target.value)}
                              onBlur={commitInlineEdit}
                              className="w-full h-6 px-1 text-[10px] border border-blue-600 bg-white font-mono"
                            />
                          ) : (
                            <span>{c.registrationDate}</span>
                          )}
                        </td>

                        {/* المبلغ المستحق */}
                        <td
                          onDoubleClick={() => startInlineEdit(c.id, 'monthlyDue', c.monthlyDue)}
                          className="p-1 text-end border-e border-slate-200 font-mono font-bold text-slate-900 bg-slate-50/50 cursor-pointer"
                        >
                          {isEditingDue ? (
                            <input
                              type="number"
                              autoFocus
                              value={inlineVal}
                              onChange={(e) => setInlineVal(e.target.value)}
                              onBlur={commitInlineEdit}
                              className="w-full h-6 px-1 text-end text-xs border border-blue-600 bg-white font-mono font-bold"
                            />
                          ) : (
                            <span>{Number(c.monthlyDue || 12000).toLocaleString()} دج</span>
                          )}
                        </td>

                        {/* 9 Months (Sept to May) and Receipts */}
                        {PREP_MONTHS.map((m) => {
                          const mData = c.months?.[m.id] || { paid: 0, receipt: '' };
                          const isEditingMonthPaid = inlineEdit?.id === c.id && inlineEdit?.field === `month.${m.id}.paid`;
                          const isEditingMonthReceipt = inlineEdit?.id === c.id && inlineEdit?.field === `month.${m.id}.receipt`;

                          return (
                            <React.Fragment key={m.id}>
                              {/* Month Paid */}
                              <td
                                onDoubleClick={() => startInlineEdit(c.id, `month.${m.id}.paid`, mData.paid)}
                                className="p-1 text-end border-e border-slate-200 font-mono font-bold cursor-pointer"
                              >
                                {isEditingMonthPaid ? (
                                  <input
                                    type="number"
                                    autoFocus
                                    value={inlineVal}
                                    onChange={(e) => setInlineVal(e.target.value)}
                                    onBlur={commitInlineEdit}
                                    className="w-full h-6 px-1 text-end text-xs border border-blue-600 bg-white font-mono font-bold"
                                  />
                                ) : (
                                  <span className={mData.paid > 0 ? 'text-emerald-800 font-bold' : 'text-slate-300'}>
                                    {Number(mData.paid || 0).toLocaleString()} دج
                                  </span>
                                )}
                              </td>

                              {/* Month Receipt */}
                              <td
                                onDoubleClick={() => startInlineEdit(c.id, `month.${m.id}.receipt`, mData.receipt)}
                                className="p-1 text-center border-e border-slate-200 font-mono text-[10px] cursor-pointer"
                              >
                                {isEditingMonthReceipt ? (
                                  <input
                                    type="text"
                                    autoFocus
                                    value={inlineVal}
                                    onChange={(e) => setInlineVal(e.target.value)}
                                    onBlur={commitInlineEdit}
                                    className="w-full h-6 px-1 text-center text-[10px] border border-blue-600 bg-white font-mono"
                                  />
                                ) : mData.receipt ? (
                                  <button
                                    onClick={() => handleOpenVoucher(c, mData.receipt, `اشتراك شهر ${m.label}`, mData.paid)}
                                    className="px-1 py-0.2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xs font-mono font-bold"
                                  >
                                    {mData.receipt}
                                  </button>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                            </React.Fragment>
                          );
                        })}

                        {/* المجموع المحصل */}
                        <td className="p-1 text-end border-e border-slate-200 font-mono font-bold text-emerald-900 bg-emerald-50/20">
                          {Number(c.totalPaid || 0).toLocaleString()} دج
                        </td>

                        {/* الباقي */}
                        <td className="p-1 text-end border-e border-slate-200 font-mono font-bold">
                          {Number(c.remaining || 0) > 0 ? (
                            <span className="px-1.5 py-0.2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xs">
                              {Number(c.remaining || 0).toLocaleString()} دج
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-semibold text-[10px]">خالص ✓</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-1 text-center print:hidden">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setRelationalEditChild(JSON.parse(JSON.stringify(c)))}
                              title="تعديل الطفل"
                              className="p-1 bg-slate-100 hover:bg-blue-50 text-blue-900 border border-slate-200 rounded-xs transition-colors cursor-pointer"
                            >
                              <Sliders className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteChild(c.id)}
                              title="حذف الطفل"
                              className="p-1 bg-slate-100 hover:bg-rose-50 text-rose-700 border border-slate-200 rounded-xs transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Table Summary Footer */}
              <tfoot className="sticky bottom-0 bg-slate-200 font-bold border-t-2 border-slate-300 font-mono text-[11px]">
                <tr>
                  <td colSpan={3} className="p-2 px-3 text-start font-sans text-slate-900 border-e border-slate-300">
                    المجموع الكلي ({filteredChildren.length} أطفال مسجلين)
                  </td>

                  {/* Reg fees sum */}
                  <td className="p-2 text-end border-e border-slate-300 text-emerald-900">
                    {filteredChildren
                      .reduce((acc, c) => acc + Number(c.registrationFee || 0), 0)
                      .toLocaleString()}{' '}
                    دج
                  </td>
                  <td colSpan={4} className="p-2 text-center border-e border-slate-300 text-slate-400 font-sans text-[10px]">-</td>

                  {/* 9 Months sums */}
                  {PREP_MONTHS.map((m) => {
                    const mSum = filteredChildren.reduce(
                      (acc, c) => acc + Number(c.months?.[m.id]?.paid || 0),
                      0
                    );
                    return (
                      <React.Fragment key={m.id}>
                        <td className="p-2 text-end border-e border-slate-300 text-emerald-900">
                          {mSum.toLocaleString()} دج
                        </td>
                        <td className="p-2 text-center border-e border-slate-300 text-slate-400 font-sans text-[10px]">-</td>
                      </React.Fragment>
                    );
                  })}

                  {/* Total Paid sum */}
                  <td className="p-2 text-end border-e border-slate-300 text-emerald-950 font-bold text-xs bg-emerald-100/50">
                    {filteredChildren
                      .reduce((acc, c) => acc + Number(c.totalPaid || 0), 0)
                      .toLocaleString()}{' '}
                    دج
                  </td>

                  {/* Debts sum */}
                  <td className="p-2 text-end border-e border-slate-300 text-rose-800 font-bold">
                    {filteredChildren
                      .reduce((acc, c) => acc + Number(c.remaining || 0), 0)
                      .toLocaleString()}{' '}
                    دج
                  </td>
                  <td className="p-2 text-center text-slate-500 font-sans text-[10px]">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* 4. RIGHT-CLICK CONTEXT MENU */}
      {contextMenu && (
        <div
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 bg-white border border-slate-300 shadow-xl py-1 text-xs w-60 divide-y divide-slate-100 animate-in fade-in zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1 font-bold text-slate-800 bg-slate-50 text-[11px] flex items-center justify-between">
            <span>{contextMenu.child.fullName}</span>
            <span className="text-emerald-800 font-mono font-bold">
              {Number(contextMenu.child.totalPaid || 0).toLocaleString()} دج
            </span>
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                setRelationalEditChild(JSON.parse(JSON.stringify(contextMenu.child)));
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-start hover:bg-blue-50 flex items-center gap-2 text-slate-700"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-900" />
              <span>تعديل بيانات وأقساط الطفل بالكامل</span>
            </button>

            <button
              onClick={() => {
                startInlineEdit(contextMenu.child.id, 'fullName', contextMenu.child.fullName);
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-start hover:bg-blue-50 flex items-center gap-2 text-slate-700"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-700" />
              <span>تعديل الاسم مباشرة</span>
            </button>

            <button
              onClick={() => {
                handleCopyTSV(contextMenu.child);
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-start hover:bg-blue-50 flex items-center gap-2 text-slate-700"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>نسخ سطر الطفل (TSV)</span>
            </button>
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                handleDeleteChild(contextMenu.child.id);
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-start hover:bg-rose-50 text-rose-700 flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>حذف الطفل من السجل</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. RELATIONAL EDIT MODAL */}
      {relationalEditChild && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-2xl p-5 text-xs space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 text-blue-900 rounded-xs">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    تعديل بيانات الطفل: {relationalEditChild.fullName}
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    التحكم في رسوم التسجيل وأقساط الأشهر الـ 9
                  </span>
                </div>
              </div>
              <button onClick={() => setRelationalEditChild(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRelationalEdit} className="space-y-3.5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 bg-slate-50 p-3 border border-slate-200">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الاسم واللقب *</label>
                  <input
                    type="text"
                    required
                    value={relationalEditChild.fullName}
                    onChange={(e) =>
                      setRelationalEditChild({ ...relationalEditChild, fullName: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">القسم (الفئة) *</label>
                  <select
                    value={relationalEditChild.section}
                    onChange={(e) =>
                      setRelationalEditChild({ ...relationalEditChild, section: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-white font-semibold"
                  >
                    {PREP_SECTIONS.map((sec, sIdx) => (
                      <option key={sIdx} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">حقوق التسجيل (دج) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={relationalEditChild.registrationFee}
                    onChange={(e) =>
                      setRelationalEditChild({
                        ...relationalEditChild,
                        registrationFee: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-white font-mono font-bold text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">وصل التسجيل *</label>
                  <input
                    type="text"
                    value={relationalEditChild.regReceipt}
                    onChange={(e) =>
                      setRelationalEditChild({ ...relationalEditChild, regReceipt: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">تاريخ الميلاد</label>
                  <input
                    type="date"
                    value={relationalEditChild.birthDate}
                    onChange={(e) =>
                      setRelationalEditChild({ ...relationalEditChild, birthDate: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المستحق الشهري (دج) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={relationalEditChild.monthlyDue}
                    onChange={(e) =>
                      setRelationalEditChild({
                        ...relationalEditChild,
                        monthlyDue: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-white font-mono font-bold"
                  />
                </div>
              </div>

              {/* 9 Months Grid */}
              <div className="space-y-2 border border-slate-200 p-3 bg-white">
                <span className="font-bold text-slate-800 text-xs block">
                  أقساط شهور الموسم الـ 9:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {PREP_MONTHS.map((m) => (
                    <div key={m.id} className="p-2 bg-slate-50 border border-slate-200 space-y-1">
                      <div className="font-bold text-slate-800 text-[11px]">شهر {m.label}:</div>
                      <input
                        type="number"
                        placeholder="المبلغ"
                        value={relationalEditChild.months?.[m.id]?.paid || 0}
                        onChange={(e) =>
                          setRelationalEditChild({
                            ...relationalEditChild,
                            months: {
                              ...relationalEditChild.months,
                              [m.id]: {
                                ...(relationalEditChild.months?.[m.id] || {}),
                                paid: Number(e.target.value) || 0,
                              },
                            },
                          })
                        }
                        className="w-full h-6 px-1.5 border border-slate-300 bg-white font-mono font-bold text-emerald-800 text-[11px]"
                      />
                      <input
                        type="text"
                        placeholder="رقم الوصل"
                        value={relationalEditChild.months?.[m.id]?.receipt || ''}
                        onChange={(e) =>
                          setRelationalEditChild({
                            ...relationalEditChild,
                            months: {
                              ...relationalEditChild.months,
                              [m.id]: {
                                ...(relationalEditChild.months?.[m.id] || {}),
                                receipt: e.target.value,
                              },
                            },
                          })
                        }
                        className="w-full h-6 px-1.5 border border-slate-300 bg-white font-mono text-[10px]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setRelationalEditChild(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>تثبيت التعديل</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. ADD CHILD MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">تسجيل طفل في القسم التحضيري</span>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewChild} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">اسم ولقب الطفل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: يونس بوشاشية"
                  value={newChild.fullName}
                  onChange={(e) => setNewChild({ ...newChild, fullName: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">القسم التحضيري *</label>
                  <select
                    value={newChild.section}
                    onChange={(e) => setNewChild({ ...newChild, section: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white font-semibold"
                  >
                    {PREP_SECTIONS.map((sec, sIdx) => (
                      <option key={sIdx} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">تاريخ الميلاد</label>
                  <input
                    type="date"
                    value={newChild.birthDate}
                    onChange={(e) => setNewChild({ ...newChild, birthDate: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">حقوق التسجيل (دج) *</label>
                  <input
                    type="number"
                    required
                    value={newChild.registrationFee}
                    onChange={(e) => setNewChild({ ...newChild, registrationFee: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white font-mono font-bold text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">وصل التسجيل *</label>
                  <input
                    type="text"
                    required
                    value={newChild.regReceipt}
                    placeholder="REC-PRP-REG-01"
                    onChange={(e) => setNewChild({ ...newChild, regReceipt: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white font-mono font-bold text-blue-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المستحق الشهري (دج) *</label>
                  <input
                    type="number"
                    required
                    value={newChild.monthlyDue}
                    onChange={(e) => setNewChild({ ...newChild, monthlyDue: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">قسط سبتمبر المسدد</label>
                  <input
                    type="number"
                    value={newChild.sepPaid}
                    onChange={(e) => setNewChild({ ...newChild, sepPaid: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white font-mono font-bold text-emerald-800"
                  />
                </div>
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
                  <span>تأكيد التسجيل</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. INFO GUIDE MODAL */}
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
                    دليل واجهة: القسم التحضيري المدرسي (1.4)
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    متابعة حقوق التسجيل وأقساط الأشهر الـ 9 المعتمدة
                  </span>
                </div>
              </div>
              <button onClick={() => setIsInfoModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-slate-700 leading-relaxed">
              <div className="p-2.5 bg-blue-50 border-s-4 border-blue-900 text-blue-950">
                <p className="font-semibold mb-1">النموذج المالي والتنظيمي المعتمد:</p>
                <p className="text-[11px]">
                  سجل متكامل لأطفال القسم التحضيري، يشمل رسوم التسجيل الأولي (8,000 دج) وأقساط الأشهر
                  التسعة (من سبتمبر إلى ماي) بمعدل 12,000 دج شهرياً، مع تتبع دقيق لأرقام وصولات السداد.
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="font-bold text-slate-800">ميزات الواجهة المحدثة:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                  <li>
                    <strong>دعم تعدد السنوات:</strong> إمكانية التنقل بين المواسم الدراسية
                    (2024-2025، 2025-2026، 2026-2027).
                  </li>
                  <li>
                    <strong>هيكل البيانات المطابق:</strong> ترتيب دقيق للأعمدة (الاسم واللقب، الفئة،
                    حقوق التسجيل، الوصل، تواريخ الميلاد والدفع، المستحق، والشهور الـ 9 مقترنة بأرقام الوصولات).
                  </li>
                  <li>
                    <strong>فصل مؤشرات الأداء:</strong> تبويب مستقل للمؤشرات المالية لضمان استغلال
                    أقصى مساحة ممكنة لجدول البيانات الفعلي.
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

      {/* 8. VOUCHER MODAL */}
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
