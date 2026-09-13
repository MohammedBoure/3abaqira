import React, { useState, useMemo, useEffect } from 'react';
import {
  Award,
  Users,
  Coins,
  CreditCard,
  AlertCircle,
  FileText,
  Plus,
  X,
  Printer,
  Download,
  Search,
  Info,
  Calendar,
  Filter,
  Check,
  Edit2,
  Trash2,
  Copy,
  Sliders,
  TrendingUp,
  Eye,
  CheckCircle,
} from 'lucide-react';
import { ReceiptVoucherModal } from '../common/ReceiptVoucherModal';
import { MOCK_CENTER_SOROBAN } from '../../../mock/centerMockData';

const BELTS_LIST = [
  { name: 'أصفر', colorClass: 'bg-amber-100 text-amber-900 border-amber-300' },
  { name: 'أخضر', colorClass: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  { name: 'أزرق', colorClass: 'bg-blue-100 text-blue-900 border-blue-300' },
  { name: 'أحمر', colorClass: 'bg-rose-100 text-rose-900 border-rose-300' },
  { name: 'بني', colorClass: 'bg-amber-900/20 text-amber-950 border-amber-700' },
  { name: 'أسود', colorClass: 'bg-slate-900 text-white border-black' },
];

const SOROBAN_LEVELS = ['p1', 'p2', 'p3', 's1', 's2', 's3', 's4', 's5', 's6'];
const SOROBAN_COACHES = ['يوسف بن عيسى', 'سمية بلعابد', 'أمينة بوغرارة'];

export function CenterSorobanView() {
  const [selectedYear, setSelectedYear] = useState('2025-2026');
  const [activeTab, setActiveTab] = useState('table'); // 'table' | 'kpis'
  const [searchTerm, setSearchTerm] = useState('');
  const [beltFilter, setBeltFilter] = useState('ALL');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [coachFilter, setCoachFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Students Dataset
  const [students, setStudents] = useState(() => {
    return MOCK_CENTER_SOROBAN.map((s, idx) => ({
      ...s,
      academicYear: '2025-2026',
      status: s.remaining === 0 ? 'مسدد كلياً' : 'نشط (توجد ديون)',
      inst1: s.inst1 || { amount: 4000, receipt: `REC-SRB-26-${idx + 1}` },
      inst2: s.inst2 || { amount: 4000, dueDate: '2026-01-15', receipt: `REC-SRB-26-${idx + 1}B` },
      inst3: s.inst3 || { amount: 3000, dueDate: '2026-03-15', receipt: '' },
      inst4: s.inst4 || { amount: 3000, dueDate: '2026-05-15', receipt: '' },
      notes: s.notes || 'تسجيل منتظم',
    }));
  });

  // UI Modals
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [relationalEditStudent, setRelationalEditStudent] = useState(null);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  // Inline Cell Editing
  const [inlineEdit, setInlineEdit] = useState(null); // { id, field }
  const [inlineVal, setInlineVal] = useState('');

  // Right-Click Context Menu
  const [contextMenu, setContextMenu] = useState(null);

  // New Student Registration Form
  const [newStudent, setNewStudent] = useState({
    nameAr: '',
    nameFr: '',
    coach: SOROBAN_COACHES[0],
    belt: 'أخضر',
    levelCode: 'p2',
    totalFee: 14000,
    inst1Amount: 4000,
    receipt1: '',
    inst2DueDate: '2026-01-15',
    inst3DueDate: '2026-03-15',
    inst4DueDate: '2026-05-15',
    phone: '',
    notes: '',
  });

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = () => setContextMenu(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchYear = !s.academicYear || s.academicYear === selectedYear;
      const term = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        s.nameAr.toLowerCase().includes(term) ||
        (s.nameFr && s.nameFr.toLowerCase().includes(term)) ||
        s.coach.toLowerCase().includes(term) ||
        s.levelCode.toLowerCase().includes(term) ||
        (s.notes && s.notes.toLowerCase().includes(term));

      const matchBelt = beltFilter === 'ALL' || s.belt === beltFilter;
      const matchLevel = levelFilter === 'ALL' || s.levelCode === levelFilter;
      const matchCoach = coachFilter === 'ALL' || s.coach === coachFilter;

      const hasDebt = (s.remaining || 0) > 0;
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PAID' && !hasDebt) ||
        (statusFilter === 'DEBT' && hasDebt);

      return matchYear && matchSearch && matchBelt && matchLevel && matchCoach && matchStatus;
    });
  }, [students, selectedYear, searchTerm, beltFilter, levelFilter, coachFilter, statusFilter]);

  // KPIs
  const totalStudents = students.length;
  const totalFees = students.reduce((acc, s) => acc + (Number(s.totalFee) || 0), 0);
  const totalCollected = students.reduce((acc, s) => acc + (Number(s.totalPaid) || 0), 0);
  const totalDebts = students.reduce((acc, s) => acc + (Number(s.remaining) || 0), 0);
  const collectionRate = totalFees > 0 ? Math.round((totalCollected / totalFees) * 100) : 0;

  // Filtered Totals
  const sumFee = filteredStudents.reduce((acc, s) => acc + (Number(s.totalFee) || 0), 0);
  const sumInst1 = filteredStudents.reduce((acc, s) => acc + (Number(s.inst1?.amount) || 0), 0);
  const sumInst2 = filteredStudents.reduce((acc, s) => acc + (Number(s.inst2?.amount) || 0), 0);
  const sumInst3 = filteredStudents.reduce((acc, s) => acc + (Number(s.inst3?.amount) || 0), 0);
  const sumInst4 = filteredStudents.reduce((acc, s) => acc + (Number(s.inst4?.amount) || 0), 0);
  const sumTotalPaid = filteredStudents.reduce((acc, s) => acc + (Number(s.totalPaid) || 0), 0);
  const sumRemaining = filteredStudents.reduce((acc, s) => acc + (Number(s.remaining) || 0), 0);

  const kpiCards = [
    {
      label: 'إجمالي أبطال السوروبان المسجلين',
      value: `${totalStudents} بطل`,
      icon: Award,
      subtext: `موزعين عبر مستويات p1 إلى s6 (${selectedYear})`,
      change: '+8 هذا الموسم',
      isPositive: true,
    },
    {
      label: 'مجموع الرسوم المستحقة (دج)',
      value: `${totalFees.toLocaleString()} دج`,
      icon: Coins,
      subtext: 'شاملة المعداد الرسمي والمقرر والشهادات',
      change: 'مستحق',
      isPositive: true,
    },
    {
      label: 'المبالغ المحصلة فعلياً (دج)',
      value: `${totalCollected.toLocaleString()} دج`,
      icon: CreditCard,
      subtext: `${collectionRate}% نسبة التحصيل المالي`,
      change: 'محصل بالخزينة ✓',
      isPositive: true,
    },
    {
      label: 'المتأخرات والديون العالقة',
      value: `${totalDebts.toLocaleString()} دج`,
      icon: AlertCircle,
      subtext: totalDebts > 0 ? 'أقساط دورية قيد المتابعة' : '0 دج ديون ✓',
      change: totalDebts > 0 ? 'متبقي' : 'خالص ✓',
      isPositive: totalDebts === 0,
    },
  ];

  // Inline Editing
  const startInlineEdit = (id, field, currentVal) => {
    setInlineEdit({ id, field });
    setInlineVal(String(currentVal ?? ''));
  };

  const commitInlineEdit = () => {
    if (!inlineEdit) return;
    const { id, field } = inlineEdit;

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        let updated = { ...s };

        if (field === 'nameAr') updated.nameAr = inlineVal.trim() || updated.nameAr;
        if (field === 'belt') updated.belt = inlineVal;
        if (field === 'levelCode') updated.levelCode = inlineVal;
        if (field === 'coach') updated.coach = inlineVal;
        if (field === 'notes') updated.notes = inlineVal;

        if (field === 'totalFee') {
          const fee = Math.max(0, Number(inlineVal) || 0);
          updated.totalFee = fee;
          updated.remaining = Math.max(0, fee - (updated.totalPaid || 0));
        }

        if (field === 'inst1.amount') {
          const val = Math.max(0, Number(inlineVal) || 0);
          updated.inst1 = { ...updated.inst1, amount: val };
        }
        if (field === 'inst1.receipt') updated.inst1 = { ...updated.inst1, receipt: inlineVal.trim() };

        if (field === 'inst2.amount') {
          const val = Math.max(0, Number(inlineVal) || 0);
          updated.inst2 = { ...updated.inst2, amount: val };
        }
        if (field === 'inst2.dueDate') updated.inst2 = { ...updated.inst2, dueDate: inlineVal };
        if (field === 'inst2.receipt') updated.inst2 = { ...updated.inst2, receipt: inlineVal.trim() };

        if (field === 'inst3.amount') {
          const val = Math.max(0, Number(inlineVal) || 0);
          updated.inst3 = { ...updated.inst3, amount: val };
        }
        if (field === 'inst3.receipt') updated.inst3 = { ...updated.inst3, receipt: inlineVal.trim() };
        if (field === 'inst3.dueDate') updated.inst3 = { ...updated.inst3, dueDate: inlineVal };

        if (field === 'inst4.amount') {
          const val = Math.max(0, Number(inlineVal) || 0);
          updated.inst4 = { ...updated.inst4, amount: val };
        }
        if (field === 'inst4.receipt') updated.inst4 = { ...updated.inst4, receipt: inlineVal.trim() };
        if (field === 'inst4.dueDate') updated.inst4 = { ...updated.inst4, dueDate: inlineVal };

        // Recalculate
        const paid =
          (Number(updated.inst1?.amount) || 0) +
          (Number(updated.inst2?.amount) || 0) +
          (Number(updated.inst3?.amount) || 0) +
          (Number(updated.inst4?.amount) || 0);

        updated.totalPaid = paid;
        updated.remaining = Math.max(0, (Number(updated.totalFee) || 0) - paid);
        updated.status = updated.remaining === 0 ? 'مسدد كلياً' : 'نشط (توجد ديون)';

        return updated;
      })
    );

    setInlineEdit(null);
  };

  // Context Menu
  const handleContextMenu = (e, s) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      student: s,
    });
  };

  // Delete
  const handleDeleteStudent = (id) => {
    if (window.confirm('هل أنت متأكد من حذف بطل السوروبان هذا من السجل؟')) {
      setStudents((prev) => prev.filter((s) => s.id !== id));
    }
  };

  // Quick Belt Change
  const handleQuickChangeBelt = (studentId, newBelt) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, belt: newBelt } : s))
    );
    setContextMenu(null);
  };

  // Quick Level Change
  const handleQuickChangeLevel = (studentId, newLevel) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, levelCode: newLevel } : s))
    );
    setContextMenu(null);
  };

  // Save Relational Edit
  const handleSaveRelationalEdit = (e) => {
    e.preventDefault();
    if (!relationalEditStudent) return;

    const fee = Number(relationalEditStudent.totalFee) || 0;
    const paid =
      (Number(relationalEditStudent.inst1?.amount) || 0) +
      (Number(relationalEditStudent.inst2?.amount) || 0) +
      (Number(relationalEditStudent.inst3?.amount) || 0) +
      (Number(relationalEditStudent.inst4?.amount) || 0);

    const rem = Math.max(0, fee - paid);
    const updated = {
      ...relationalEditStudent,
      totalPaid: paid,
      remaining: rem,
      status: rem === 0 ? 'مسدد كلياً' : 'نشط (توجد ديون)',
    };

    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setRelationalEditStudent(null);
  };

  // Open Add Student
  const handleOpenAdd = () => {
    const seq = students.length + 1;
    setNewStudent({
      nameAr: '',
      nameFr: '',
      coach: SOROBAN_COACHES[0],
      belt: 'أخضر',
      levelCode: 'p2',
      totalFee: 14000,
      inst1Amount: 4000,
      receipt1: `REC-SRB-26-${String(seq).padStart(2, '0')}`,
      inst2DueDate: '2026-01-15',
      inst3DueDate: '2026-03-15',
      inst4DueDate: '2026-05-15',
      phone: '',
      notes: 'تسجيل جديد',
    });
    setIsAddModalOpen(true);
  };

  // Save New Student
  const handleSaveNewStudent = (e) => {
    e.preventDefault();
    if (!newStudent.nameAr.trim()) return;

    const seq = students.length + 1;
    const fee = Number(newStudent.totalFee) || 14000;
    const i1 = Number(newStudent.inst1Amount) || 0;

    const entry = {
      id: `SRB-${Date.now()}`,
      seq,
      academicYear: selectedYear,
      nameAr: newStudent.nameAr.trim(),
      nameFr: newStudent.nameFr.trim() || newStudent.nameAr.trim(),
      coach: newStudent.coach,
      belt: newStudent.belt,
      levelCode: newStudent.levelCode,
      totalFee: fee,
      inst1: { amount: i1, receipt: newStudent.receipt1 || `REC-SRB-26-${seq}` },
      inst2: { amount: 0, dueDate: newStudent.inst2DueDate, receipt: '' },
      inst3: { amount: 0, dueDate: newStudent.inst3DueDate, receipt: '' },
      inst4: { amount: 0, dueDate: newStudent.inst4DueDate, receipt: '' },
      totalPaid: i1,
      remaining: Math.max(0, fee - i1),
      status: fee - i1 === 0 ? 'مسدد كلياً' : 'نشط (توجد ديون)',
      phone: newStudent.phone || '0550 00 00 00',
      notes: newStudent.notes || 'تسجيل جديد',
    };

    setStudents([entry, ...students]);
    setIsAddModalOpen(false);
  };

  // Open Voucher
  const handleOpenVoucher = (s, inst, num) => {
    setSelectedVoucher({
      receiptNumber: inst.receipt || `REC-SRB-26-${s.seq}-${num}`,
      payerName: `${s.nameAr} (${s.nameFr || ''})`,
      category: `برنامج السوروبان والحساب الذهني - المستوى (${s.levelCode}) الحزام ${s.belt} - الدفعة ${num}`,
      amount: inst.amount,
      paymentMethod: 'نقداً (خزينة المركز)',
      branch: 'المركز الأكاديمي والتعليمي',
      date: inst.dueDate || '2026-02-15',
      notes: `المتبقي: ${(s.remaining || 0).toLocaleString()} دج - المؤطر: ${s.coach}`,
    });
  };

  // Copy TSV
  const handleCopyTSV = (s) => {
    const tsv = `${s.nameAr}\t${s.totalFee}\t${s.inst1?.amount || 0}\t${s.inst1?.receipt || ''}\t${s.inst2?.amount || 0}\t${s.inst2?.dueDate || ''}\t${s.inst2?.receipt || ''}\t${s.inst3?.amount || 0}\t${s.inst3?.receipt || ''}\t${s.inst3?.dueDate || ''}\t${s.inst4?.amount || 0}\t${s.inst4?.dueDate || ''}\t${s.inst4?.receipt || ''}\t${s.totalPaid}\t${s.remaining}\t${s.notes || ''}`;
    navigator.clipboard.writeText(tsv);
    alert('تم نسخ سطر بيانات الطالب إلى الحافظة بنجاح');
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      '#',
      'الإسم واللقب',
      'الوضعية (المستحق)',
      'الدفعة 1',
      'الوصل 1',
      'الدفعة 2',
      'التاريخ المقترح 2',
      'الوصل 2',
      'الدفعة 3',
      'الوصل 3',
      'التاريخ المقترح 3',
      'الدفعة 4',
      'التاريخ المقترح 4',
      'الوصل 4',
      'مجموع الدفعات',
      'الباقي',
      'الملاحظات',
    ];
    const rows = filteredStudents.map((s) => [
      s.seq,
      `"${s.nameAr}"`,
      s.totalFee,
      s.inst1?.amount || 0,
      `"${s.inst1?.receipt || ''}"`,
      s.inst2?.amount || 0,
      s.inst2?.dueDate || '',
      `"${s.inst2?.receipt || ''}"`,
      s.inst3?.amount || 0,
      `"${s.inst3?.receipt || ''}"`,
      s.inst3?.dueDate || '',
      s.inst4?.amount || 0,
      s.inst4?.dueDate || '',
      `"${s.inst4?.receipt || ''}"`,
      s.totalPaid,
      s.remaining,
      `"${(s.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `center_soroban_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-2.5 p-3 bg-slate-50 min-h-screen text-slate-800 font-sans" dir="rtl">
      {/* 1. TOP COMPACT HEADER */}
      <div className="bg-white border border-slate-200 px-3 py-2 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        {/* Right: Title & Info Button */}
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-blue-900 text-white font-bold text-[11px] rounded-xs">
            المركز الأكاديمي والتعليمي
          </span>
          <span className="text-slate-300">|</span>
          <h1 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Award className="w-4 h-4 text-blue-900" />
            سجل السوروبان والحساب الذهني
          </h1>
          <span className="text-[11px] text-slate-500 hidden md:inline font-sans">
            (Soroban Mental Math Registry)
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
          {/* Internal Tab Switcher: Table vs KPIs */}
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
              <span>جدول أبطال السوروبان</span>
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

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث بالاسم، الحزام..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-7 w-40 ps-7 pe-2 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-900 transition-colors"
            />
          </div>

          {/* Icon Actions */}
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
            onClick={handleOpenAdd}
            title="تسجيل بطل جديد"
            className="h-7 px-2.5 bg-blue-900 hover:bg-blue-950 text-white font-semibold flex items-center gap-1 text-xs shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>بطل جديد</span>
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

          {/* Belts Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="bg-white border border-slate-200 p-3 shadow-2xs space-y-2">
              <span className="font-bold text-slate-800 text-xs block">
                توزيع الأبطال حسب الأحزمة المعتمدة:
              </span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {BELTS_LIST.map((b, bIdx) => {
                  const bCount = students.filter((s) => s.belt === b.name).length;
                  return (
                    <div
                      key={bIdx}
                      className={`p-2 border rounded-xs text-center font-bold ${b.colorClass}`}
                    >
                      <div>حزام {b.name}</div>
                      <div className="text-sm font-mono mt-0.5">{bCount} أبطال</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-3 shadow-2xs space-y-2">
              <span className="font-bold text-slate-800 text-xs block">
                مؤشرات التحصيل المالي للسوروبان:
              </span>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between p-1.5 bg-slate-50 border border-slate-100">
                  <span className="font-sans text-slate-700">إجمالي رسوم العقود:</span>
                  <span className="font-bold">{totalFees.toLocaleString()} دج</span>
                </div>
                <div className="flex justify-between p-1.5 bg-emerald-50 border border-emerald-100">
                  <span className="font-sans text-emerald-900">المحصل بالخزينة:</span>
                  <span className="font-bold text-emerald-800">{totalCollected.toLocaleString()} دج</span>
                </div>
                <div className="flex justify-between p-1.5 bg-rose-50 border border-rose-100">
                  <span className="font-sans text-rose-900">الديون المتبقية:</span>
                  <span className="font-bold text-rose-700">{totalDebts.toLocaleString()} دج</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN TABLE VIEW (MAXIMIZED VERTICAL SPACE) */}
      {activeTab === 'table' && (
        <div className="bg-white border border-slate-200 shadow-2xs overflow-hidden space-y-0">
          {/* Filters Bar */}
          <div className="px-3 py-1.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-700">
                سجل أبطال السوروبان ({filteredStudents.length} مسجل)
              </span>

              {/* Belt Filter */}
              <select
                value={beltFilter}
                onChange={(e) => setBeltFilter(e.target.value)}
                className="h-6 px-1.5 border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:border-blue-900"
              >
                <option value="ALL">كافة الأحزمة</option>
                {BELTS_LIST.map((b, bIdx) => (
                  <option key={bIdx} value={b.name}>
                    حزام {b.name}
                  </option>
                ))}
              </select>

              {/* Level Filter */}
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="h-6 px-1.5 border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:border-blue-900"
              >
                <option value="ALL">كافة المستويات</option>
                {SOROBAN_LEVELS.map((lvl, lIdx) => (
                  <option key={lIdx} value={lvl}>
                    مستوى {lvl}
                  </option>
                ))}
              </select>

              {/* Coach Filter */}
              <select
                value={coachFilter}
                onChange={(e) => setCoachFilter(e.target.value)}
                className="h-6 px-1.5 border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:border-blue-900"
              >
                <option value="ALL">كافة المدربين</option>
                {SOROBAN_COACHES.map((c, cIdx) => (
                  <option key={cIdx} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-6 px-1.5 border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:border-blue-900"
              >
                <option value="ALL">كافة الوضعيات</option>
                <option value="PAID">مسدد كلياً (خالص ✓)</option>
                <option value="DEBT">توجد ديون</option>
              </select>
            </div>

            <div className="text-[11px] text-slate-500">
              <span className="bg-amber-50 border border-amber-200 text-amber-900 px-1.5 py-0.5 rounded-xs">
                💡 انقر نقراً مزدوجاً أو بالزر الأيمن للتعديل
              </span>
            </div>
          </div>

          {/* EXACT TABLE STRUCTURE FOR 1.2 */}
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border-collapse">
              <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold select-none text-[11px]">
                <tr>
                  <th className="p-2 text-center border-e border-slate-200 w-10">#</th>
                  <th className="p-2 text-start border-e border-slate-200 min-w-[140px]">الإسم و اللقب</th>
                  <th className="p-2 text-end border-e border-slate-200 min-w-[105px] bg-slate-50">الوضعية</th>

                  {/* Inst 1 */}
                  <th className="p-2 text-end border-e border-slate-200 min-w-[90px] bg-blue-50/30">الدفعة 1</th>
                  <th className="p-2 text-center border-e border-slate-200 min-w-[90px]">الوصل</th>

                  {/* Inst 2 */}
                  <th className="p-2 text-end border-e border-slate-200 min-w-[90px]">الدفعة 2</th>
                  <th className="p-2 text-center border-e border-slate-200 min-w-[100px]">التاريخ المقترح</th>
                  <th className="p-2 text-center border-e border-slate-200 min-w-[90px]">الوصل</th>

                  {/* Inst 3 */}
                  <th className="p-2 text-end border-e border-slate-200 min-w-[90px]">الدفعة 3</th>
                  <th className="p-2 text-center border-e border-slate-200 min-w-[90px]">الوصل</th>
                  <th className="p-2 text-center border-e border-slate-200 min-w-[100px]">التاريخ المقترح</th>

                  {/* Inst 4 */}
                  <th className="p-2 text-end border-e border-slate-200 min-w-[90px]">الدفعة 4</th>
                  <th className="p-2 text-center border-e border-slate-200 min-w-[100px]">التاريخ المقترح</th>
                  <th className="p-2 text-center border-e border-slate-200 min-w-[90px]">الوصل</th>

                  {/* Totals & Notes */}
                  <th className="p-2 text-end border-e border-slate-200 min-w-[110px] text-emerald-900 bg-emerald-50/40">
                    مجموع الدفعات
                  </th>
                  <th className="p-2 text-end border-e border-slate-200 min-w-[100px]">الباقي</th>
                  <th className="p-2 text-start border-e border-slate-200 min-w-[140px]">ملاحظة</th>
                  <th className="p-2 text-center min-w-[75px] print:hidden">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 text-[11px]">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={18} className="p-8 text-center text-slate-400">
                      لا يوجد أبطال مطابقين لمعايير البحث
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s, idx) => {
                    const isEditingName = inlineEdit?.id === s.id && inlineEdit?.field === 'nameAr';
                    const isEditingFee = inlineEdit?.id === s.id && inlineEdit?.field === 'totalFee';

                    const isEditingI1 = inlineEdit?.id === s.id && inlineEdit?.field === 'inst1.amount';
                    const isEditingI1Rec = inlineEdit?.id === s.id && inlineEdit?.field === 'inst1.receipt';

                    const isEditingI2 = inlineEdit?.id === s.id && inlineEdit?.field === 'inst2.amount';
                    const isEditingI2Date = inlineEdit?.id === s.id && inlineEdit?.field === 'inst2.dueDate';
                    const isEditingI2Rec = inlineEdit?.id === s.id && inlineEdit?.field === 'inst2.receipt';

                    const isEditingI3 = inlineEdit?.id === s.id && inlineEdit?.field === 'inst3.amount';
                    const isEditingI3Rec = inlineEdit?.id === s.id && inlineEdit?.field === 'inst3.receipt';
                    const isEditingI3Date = inlineEdit?.id === s.id && inlineEdit?.field === 'inst3.dueDate';

                    const isEditingI4 = inlineEdit?.id === s.id && inlineEdit?.field === 'inst4.amount';
                    const isEditingI4Date = inlineEdit?.id === s.id && inlineEdit?.field === 'inst4.dueDate';
                    const isEditingI4Rec = inlineEdit?.id === s.id && inlineEdit?.field === 'inst4.receipt';

                    const isEditingNotes = inlineEdit?.id === s.id && inlineEdit?.field === 'notes';

                    const hasDebt = (s.remaining || 0) > 0;

                    return (
                      <tr
                        key={s.id}
                        onContextMenu={(e) => handleContextMenu(e, s)}
                        className="hover:bg-blue-50/40 transition-colors h-8"
                      >
                        {/* 1. Seq */}
                        <td className="p-1 text-center border-e border-slate-200 font-mono text-slate-400 font-bold">
                          {idx + 1}
                        </td>

                        {/* 2. الإسم و اللقب */}
                        <td
                          onDoubleClick={() => startInlineEdit(s.id, 'nameAr', s.nameAr)}
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
                            <div className="flex items-center gap-1.5">
                              <span>{s.nameAr}</span>
                              <span className="text-[9px] text-slate-400 font-mono">({s.levelCode})</span>
                            </div>
                          )}
                        </td>

                        {/* 3. الوضعية (المستحق المتفق عليه) */}
                        <td
                          onDoubleClick={() => startInlineEdit(s.id, 'totalFee', s.totalFee)}
                          className="p-1 text-end border-e border-slate-200 font-mono font-bold text-slate-900 bg-slate-50/50 cursor-pointer"
                        >
                          {isEditingFee ? (
                            <input
                              type="number"
                              autoFocus
                              value={inlineVal}
                              onChange={(e) => setInlineVal(e.target.value)}
                              onBlur={commitInlineEdit}
                              className="w-full h-6 px-1 text-end text-xs border border-blue-600 bg-white font-mono font-bold"
                            />
                          ) : (
                            <span>{Number(s.totalFee || 0).toLocaleString()} دج</span>
                          )}
                        </td>

                        {/* 4. الدفعة 1 */}
                        <td
                          onDoubleClick={() => startInlineEdit(s.id, 'inst1.amount', s.inst1?.amount)}
                          className="p-1 text-end border-e border-slate-200 font-mono font-bold text-emerald-800 cursor-pointer bg-blue-50/10"
                        >
                          {isEditingI1 ? (
                            <input
                              type="number"
                              autoFocus
                              value={inlineVal}
                              onChange={(e) => setInlineVal(e.target.value)}
                              onBlur={commitInlineEdit}
                              className="w-full h-6 px-1 text-end text-xs border border-blue-600 bg-white font-mono font-bold"
                            />
                          ) : (
                            <span>{Number(s.inst1?.amount || 0).toLocaleString()} دج</span>
                          )}
                        </td>

                        {/* 5. الوصل (الدفعة 1) */}
                        <td
                          onDoubleClick={() => startInlineEdit(s.id, 'inst1.receipt', s.inst1?.receipt)}
                          className="p-1 text-center border-e border-slate-200 font-mono text-[10px] cursor-pointer"
                        >
                          {isEditingI1Rec ? (
                            <input
                              type="text"
                              autoFocus
                              value={inlineVal}
                              onChange={(e) => setInlineVal(e.target.value)}
                              onBlur={commitInlineEdit}
                              className="w-full h-6 px-1 text-center text-[10px] border border-blue-600 bg-white font-mono"
                            />
                          ) : s.inst1?.receipt ? (
                            <button
                              onClick={() => handleOpenVoucher(s, s.inst1, 1)}
                              className="px-1 py-0.2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xs font-mono font-bold"
                            >
                              {s.inst1.receipt}
                            </button>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* 6. الدفعة 2 */}
                        <td
                          onDoubleClick={() => startInlineEdit(s.id, 'inst2.amount', s.inst2?.amount)}
                          className="p-1 text-end border-e border-slate-200 font-mono font-bold cursor-pointer"
                        >
                          {isEditingI2 ? (
                            <input
                              type="number"
                              autoFocus
                              value={inlineVal}
                              onChange={(e) => setInlineVal(e.target.value)}
                              onBlur={commitInlineEdit}
                              className="w-full h-6 px-1 text-end text-xs border border-blue-600 bg-white font-mono font-bold"
                            />
                          ) : (
                            <span className={Number(s.inst2?.amount || 0) > 0 ? 'text-emerald-800 font-bold' : 'text-slate-400'}>
                              {Number(s.inst2?.amount || 0).toLocaleString()} دج
                            </span>
                          )}
                        </td>

                        {/* 7. التاريخ المقترح (الدفعة 2) */}
                        <td
                          onDoubleClick={() => startInlineEdit(s.id, 'inst2.dueDate', s.inst2?.dueDate)}
                          className="p-1 text-center border-e border-slate-200 font-mono text-slate-600 cursor-pointer text-[10px]"
                        >
                          {isEditingI2Date ? (
                            <input
                              type="date"
                              autoFocus
                              value={inlineVal}
                              onChange={(e) => setInlineVal(e.target.value)}
                              onBlur={commitInlineEdit}
                              className="w-full h-6 px-1 text-[10px] border border-blue-600 bg-white font-mono"
                            />
                          ) : (
                            <span>{s.inst2?.dueDate || '-'}</span>
                          )}
                        </td>

                        {/* 8. الوصل (الدفعة 2) */}
                        <td
                          onDoubleClick={() => startInlineEdit(s.id, 'inst2.receipt', s.inst2?.receipt)}
                          className="p-1 text-center border-e border-slate-200 font-mono text-[10px] cursor-pointer"
                        >
                          {isEditingI2Rec ? (
                            <input
                              type="text"
                              autoFocus
                              value={inlineVal}
                              onChange={(e) => setInlineVal(e.target.value)}
                              onBlur={commitInlineEdit}
                              className="w-full h-6 px-1 text-center text-[10px] border border-blue-600 bg-white font-mono"
                            />
                          ) : s.inst2?.receipt ? (
                            <button
                              onClick={() => handleOpenVoucher(s, s.inst2, 2)}
                              className="px-1 py-0.2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xs font-mono font-bold"
                            >
                              {s.inst2.receipt}
                            </button>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* 9. الدفعة 3 */}
                        <td
                          onDoubleClick={() => startInlineEdit(s.id, 'inst3.amount', s.inst3?.amount)}
                          className="p-1 text-end border-e border-slate-200 font-mono font-bold cursor-pointer"
                        >
                          {isEditingI3 ? (
                            <input
                              type="number"
                              autoFocus
                              value={inlineVal}
                              onChange={(e) => setInlineVal(e.target.value)}
                              onBlur={commitInlineEdit}
                              className="w-full h-6 px-1 text-end text-xs border border-blue-600 bg-white font-mono font-bold"
                            />
                          ) : (
                            <span className={Number(s.inst3?.amount || 0) > 0 ? 'text-emerald-800 font-bold' : 'text-slate-400'}>
                              {Number(s.inst3?.amount || 0).toLocaleString()} دج
                            </span>
                          )}
                        </td>

                        {/* 10. الوصل (الدفعة 3) */}
                        <td
                          onDoubleClick={() => startInlineEdit(s.id, 'inst3.receipt', s.inst3?.receipt)}
                          className="p-1 text-center border-e border-slate-200 font-mono text-[10px] cursor-pointer"
                        >
                          {isEditingI3Rec ? (
                            <input
                              type="text"
                              autoFocus
                              value={inlineVal}
                              onChange={(e) => setInlineVal(e.target.value)}
                              onBlur={commitInlineEdit}
                              className="w-full h-6 px-1 text-center text-[10px] border border-blue-600 bg-white font-mono"
                            />
                          ) : s.inst3?.receipt ? (
                            <button
                              onClick={() => handleOpenVoucher(s, s.inst3, 3)}
                              className="px-1 py-0.2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xs font-mono font-bold"
                            >
                              {s.inst3.receipt}
                            </button>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* 11. التاريخ المقترح (الدفعة 3) */}
                        <td
                          onDoubleClick={() => startInlineEdit(s.id, 'inst3.dueDate', s.inst3?.dueDate)}
                          className="p-1 text-center border-e border-slate-200 font-mono text-slate-600 cursor-pointer text-[10px]"
                        >
                          {isEditingI3Date ? (
                            <input
                              type="date"
                              autoFocus
                              value={inlineVal}
                              onChange={(e) => setInlineVal(e.target.value)}
                              onBlur={commitInlineEdit}
                              className="w-full h-6 px-1 text-[10px] border border-blue-600 bg-white font-mono"
                            />
                          ) : (
                            <span>{s.inst3?.dueDate || '-'}</span>
                          )}
                        </td>

                        {/* 12. الدفعة 4 */}
                        <td
                          onDoubleClick={() => startInlineEdit(s.id, 'inst4.amount', s.inst4?.amount)}
                          className="p-1 text-end border-e border-slate-200 font-mono font-bold cursor-pointer"
                        >
                          {isEditingI4 ? (
                            <input
                              type="number"
                              autoFocus
                              value={inlineVal}
                              onChange={(e) => setInlineVal(e.target.value)}
                              onBlur={commitInlineEdit}
                              className="w-full h-6 px-1 text-end text-xs border border-blue-600 bg-white font-mono font-bold"
                            />
                          ) : (
                            <span className={Number(s.inst4?.amount || 0) > 0 ? 'text-emerald-800 font-bold' : 'text-slate-400'}>
                              {Number(s.inst4?.amount || 0).toLocaleString()} دج
                            </span>
                          )}
                        </td>

                        {/* 13. التاريخ المقترح (الدفعة 4) */}
                        <td
                          onDoubleClick={() => startInlineEdit(s.id, 'inst4.dueDate', s.inst4?.dueDate)}
                          className="p-1 text-center border-e border-slate-200 font-mono text-slate-600 cursor-pointer text-[10px]"
                        >
                          {isEditingI4Date ? (
                            <input
                              type="date"
                              autoFocus
                              value={inlineVal}
                              onChange={(e) => setInlineVal(e.target.value)}
                              onBlur={commitInlineEdit}
                              className="w-full h-6 px-1 text-[10px] border border-blue-600 bg-white font-mono"
                            />
                          ) : (
                            <span>{s.inst4?.dueDate || '-'}</span>
                          )}
                        </td>

                        {/* 14. الوصل (الدفعة 4) */}
                        <td
                          onDoubleClick={() => startInlineEdit(s.id, 'inst4.receipt', s.inst4?.receipt)}
                          className="p-1 text-center border-e border-slate-200 font-mono text-[10px] cursor-pointer"
                        >
                          {isEditingI4Rec ? (
                            <input
                              type="text"
                              autoFocus
                              value={inlineVal}
                              onChange={(e) => setInlineVal(e.target.value)}
                              onBlur={commitInlineEdit}
                              className="w-full h-6 px-1 text-center text-[10px] border border-blue-600 bg-white font-mono"
                            />
                          ) : s.inst4?.receipt ? (
                            <button
                              onClick={() => handleOpenVoucher(s, s.inst4, 4)}
                              className="px-1 py-0.2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xs font-mono font-bold"
                            >
                              {s.inst4.receipt}
                            </button>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* 15. مجموع الدفعات */}
                        <td className="p-1 text-end border-e border-slate-200 font-mono font-bold text-emerald-900 bg-emerald-50/20">
                          {Number(s.totalPaid || 0).toLocaleString()} دج
                        </td>

                        {/* 16. الباقي */}
                        <td className="p-1 text-end border-e border-slate-200 font-mono font-bold">
                          {hasDebt ? (
                            <span className="px-1.5 py-0.2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xs">
                              {Number(s.remaining || 0).toLocaleString()} دج
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-semibold text-[10px]">خالص ✓</span>
                          )}
                        </td>

                        {/* 17. ملاحظة */}
                        <td
                          onDoubleClick={() => startInlineEdit(s.id, 'notes', s.notes)}
                          className="p-1 border-e border-slate-200 text-slate-600 cursor-pointer truncate max-w-[140px]"
                          title={s.notes}
                        >
                          {isEditingNotes ? (
                            <input
                              type="text"
                              autoFocus
                              value={inlineVal}
                              onChange={(e) => setInlineVal(e.target.value)}
                              onBlur={commitInlineEdit}
                              className="w-full h-6 px-1 text-xs border border-blue-600 bg-white"
                            />
                          ) : (
                            <span>{s.notes || '-'}</span>
                          )}
                        </td>

                        {/* 18. الإجراء */}
                        <td className="p-1 text-center print:hidden">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setRelationalEditStudent(JSON.parse(JSON.stringify(s)))}
                              title="تعديل البيانات والروابط العلائقية"
                              className="p-1 bg-slate-100 hover:bg-blue-50 text-blue-900 border border-slate-200 rounded-xs transition-colors cursor-pointer"
                            >
                              <Sliders className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(s.id)}
                              title="حذف الطالب"
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

              {/* Summary Footer */}
              <tfoot className="bg-slate-200 font-bold border-t-2 border-slate-300 font-mono text-[11px]">
                <tr>
                  <td colSpan={3} className="p-2 px-3 text-start font-sans text-slate-900 border-e border-slate-300">
                    المجموع الكلي ({filteredStudents.length} أبطال مسجلين)
                  </td>

                  {/* Inst 1 */}
                  <td className="p-2 text-end border-e border-slate-300 text-emerald-900">
                    {sumInst1.toLocaleString()} دج
                  </td>
                  <td className="p-2 text-center border-e border-slate-300 text-slate-400 font-sans text-[10px]">-</td>

                  {/* Inst 2 */}
                  <td className="p-2 text-end border-e border-slate-300 text-emerald-900">
                    {sumInst2.toLocaleString()} دج
                  </td>
                  <td colSpan={2} className="p-2 text-center border-e border-slate-300 text-slate-400 font-sans text-[10px]">-</td>

                  {/* Inst 3 */}
                  <td className="p-2 text-end border-e border-slate-300 text-emerald-900">
                    {sumInst3.toLocaleString()} دج
                  </td>
                  <td colSpan={2} className="p-2 text-center border-e border-slate-300 text-slate-400 font-sans text-[10px]">-</td>

                  {/* Inst 4 */}
                  <td className="p-2 text-end border-e border-slate-300 text-emerald-900">
                    {sumInst4.toLocaleString()} دج
                  </td>
                  <td colSpan={2} className="p-2 text-center border-e border-slate-300 text-slate-400 font-sans text-[10px]">-</td>

                  {/* Total Paid */}
                  <td className="p-2 text-end border-e border-slate-300 text-emerald-950 font-bold text-xs bg-emerald-100/50">
                    {sumTotalPaid.toLocaleString()} دج
                  </td>

                  {/* Debts */}
                  <td className="p-2 text-end border-e border-slate-300 text-rose-800 font-bold">
                    {sumRemaining.toLocaleString()} دج
                  </td>
                  <td colSpan={2} className="p-2 text-center text-slate-500 font-sans text-[10px]">
                    {collectionRate}% محصل
                  </td>
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
            <span>{contextMenu.student.nameAr}</span>
            <span className="text-blue-900 font-mono font-bold">
              {contextMenu.student.remaining > 0 ? `باقي: ${contextMenu.student.remaining} دج` : 'خالص ✓'}
            </span>
          </div>

          {/* Quick Belt Changer */}
          <div className="p-1">
            <div className="text-[10px] text-slate-400 px-2 py-0.5 font-bold">تغيير الحزام المعتمد:</div>
            <div className="grid grid-cols-3 gap-1 px-1">
              {BELTS_LIST.map((b, bIdx) => (
                <button
                  key={bIdx}
                  onClick={() => handleQuickChangeBelt(contextMenu.student.id, b.name)}
                  className={`px-1 py-0.5 text-[10px] rounded-xs border font-semibold ${
                    contextMenu.student.belt === b.name ? 'ring-2 ring-blue-900 font-bold' : ''
                  } ${b.colorClass}`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Level Changer */}
          <div className="p-1">
            <div className="text-[10px] text-slate-400 px-2 py-0.5 font-bold">تغيير المستوى (p1 - s6):</div>
            <div className="grid grid-cols-3 gap-1 px-1">
              {SOROBAN_LEVELS.map((lvl, lIdx) => (
                <button
                  key={lIdx}
                  onClick={() => handleQuickChangeLevel(contextMenu.student.id, lvl)}
                  className={`px-1 py-0.5 text-[10px] rounded-xs border text-center font-mono font-bold ${
                    contextMenu.student.levelCode === lvl
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                setRelationalEditStudent(JSON.parse(JSON.stringify(contextMenu.student)));
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-start hover:bg-blue-50 flex items-center gap-2 text-slate-700"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-900" />
              <span>تعديل البيانات والروابط العلائقية (شامل)</span>
            </button>

            <button
              onClick={() => {
                startInlineEdit(contextMenu.student.id, 'nameAr', contextMenu.student.nameAr);
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-start hover:bg-blue-50 flex items-center gap-2 text-slate-700"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-700" />
              <span>تعديل الاسم مباشرة</span>
            </button>

            <button
              onClick={() => {
                handleCopyTSV(contextMenu.student);
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-start hover:bg-blue-50 flex items-center gap-2 text-slate-700"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>نسخ سطر الطالب (TSV)</span>
            </button>
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                handleDeleteStudent(contextMenu.student.id);
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-start hover:bg-rose-50 text-rose-700 flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>حذف الطالب من السجل</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. RELATIONAL EDIT MODAL */}
      {relationalEditStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-2xl p-5 text-xs space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 text-blue-900 rounded-xs">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    تعديل بيانات ورسوم بطل السوروبان: {relationalEditStudent.nameAr}
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    التحكم في الحزام، المستوى، والأقساط الـ 4
                  </span>
                </div>
              </div>
              <button
                onClick={() => setRelationalEditStudent(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRelationalEdit} className="space-y-3.5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 bg-slate-50 p-3 border border-slate-200">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الاسم بالعربية *</label>
                  <input
                    type="text"
                    required
                    value={relationalEditStudent.nameAr}
                    onChange={(e) =>
                      setRelationalEditStudent({ ...relationalEditStudent, nameAr: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الحزام المعتمد *</label>
                  <select
                    value={relationalEditStudent.belt}
                    onChange={(e) =>
                      setRelationalEditStudent({ ...relationalEditStudent, belt: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-white font-semibold"
                  >
                    {BELTS_LIST.map((b, bIdx) => (
                      <option key={bIdx} value={b.name}>
                        حزام {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المستوى التدريبي *</label>
                  <select
                    value={relationalEditStudent.levelCode}
                    onChange={(e) =>
                      setRelationalEditStudent({ ...relationalEditStudent, levelCode: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-white font-mono font-bold"
                  >
                    {SOROBAN_LEVELS.map((lvl, lIdx) => (
                      <option key={lIdx} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المدرب المشرف *</label>
                  <select
                    value={relationalEditStudent.coach}
                    onChange={(e) =>
                      setRelationalEditStudent({ ...relationalEditStudent, coach: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-white font-semibold"
                  >
                    {SOROBAN_COACHES.map((c, cIdx) => (
                      <option key={cIdx} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المستحق المتفق عليه (دج) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={relationalEditStudent.totalFee}
                    onChange={(e) =>
                      setRelationalEditStudent({
                        ...relationalEditStudent,
                        totalFee: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ملاحظات</label>
                  <input
                    type="text"
                    value={relationalEditStudent.notes || ''}
                    onChange={(e) =>
                      setRelationalEditStudent({ ...relationalEditStudent, notes: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-white"
                  />
                </div>
              </div>

              {/* Installments Breakdown */}
              <div className="space-y-2 border border-slate-200 p-3 bg-white">
                <span className="font-bold text-slate-800 text-xs block">
                  الأقساط الـ 4 وتفاصيل الوصولات:
                </span>

                {/* Inst 1 */}
                <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 border border-slate-200">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">الدفعة 1 (دج)</label>
                    <input
                      type="number"
                      value={relationalEditStudent.inst1?.amount || 0}
                      onChange={(e) =>
                        setRelationalEditStudent({
                          ...relationalEditStudent,
                          inst1: { ...relationalEditStudent.inst1, amount: Number(e.target.value) || 0 },
                        })
                      }
                      className="w-full h-7 px-1.5 border border-slate-300 bg-white font-mono font-bold text-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">وصل الدفعة 1</label>
                    <input
                      type="text"
                      value={relationalEditStudent.inst1?.receipt || ''}
                      onChange={(e) =>
                        setRelationalEditStudent({
                          ...relationalEditStudent,
                          inst1: { ...relationalEditStudent.inst1, receipt: e.target.value },
                        })
                      }
                      className="w-full h-7 px-1.5 border border-slate-300 bg-white font-mono"
                    />
                  </div>
                </div>

                {/* Inst 2 */}
                <div className="grid grid-cols-3 gap-2 p-2 bg-slate-50 border border-slate-200">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">الدفعة 2 (دج)</label>
                    <input
                      type="number"
                      value={relationalEditStudent.inst2?.amount || 0}
                      onChange={(e) =>
                        setRelationalEditStudent({
                          ...relationalEditStudent,
                          inst2: { ...relationalEditStudent.inst2, amount: Number(e.target.value) || 0 },
                        })
                      }
                      className="w-full h-7 px-1.5 border border-slate-300 bg-white font-mono font-bold text-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">التاريخ المقترح 2</label>
                    <input
                      type="date"
                      value={relationalEditStudent.inst2?.dueDate || '2026-01-15'}
                      onChange={(e) =>
                        setRelationalEditStudent({
                          ...relationalEditStudent,
                          inst2: { ...relationalEditStudent.inst2, dueDate: e.target.value },
                        })
                      }
                      className="w-full h-7 px-1.5 border border-slate-300 bg-white font-mono text-[10px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">وصل الدفعة 2</label>
                    <input
                      type="text"
                      value={relationalEditStudent.inst2?.receipt || ''}
                      onChange={(e) =>
                        setRelationalEditStudent({
                          ...relationalEditStudent,
                          inst2: { ...relationalEditStudent.inst2, receipt: e.target.value },
                        })
                      }
                      className="w-full h-7 px-1.5 border border-slate-300 bg-white font-mono"
                    />
                  </div>
                </div>

                {/* Inst 3 */}
                <div className="grid grid-cols-3 gap-2 p-2 bg-slate-50 border border-slate-200">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">الدفعة 3 (دج)</label>
                    <input
                      type="number"
                      value={relationalEditStudent.inst3?.amount || 0}
                      onChange={(e) =>
                        setRelationalEditStudent({
                          ...relationalEditStudent,
                          inst3: { ...relationalEditStudent.inst3, amount: Number(e.target.value) || 0 },
                        })
                      }
                      className="w-full h-7 px-1.5 border border-slate-300 bg-white font-mono font-bold text-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">وصل الدفعة 3</label>
                    <input
                      type="text"
                      value={relationalEditStudent.inst3?.receipt || ''}
                      onChange={(e) =>
                        setRelationalEditStudent({
                          ...relationalEditStudent,
                          inst3: { ...relationalEditStudent.inst3, receipt: e.target.value },
                        })
                      }
                      className="w-full h-7 px-1.5 border border-slate-300 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">التاريخ المقترح 3</label>
                    <input
                      type="date"
                      value={relationalEditStudent.inst3?.dueDate || '2026-03-15'}
                      onChange={(e) =>
                        setRelationalEditStudent({
                          ...relationalEditStudent,
                          inst3: { ...relationalEditStudent.inst3, dueDate: e.target.value },
                        })
                      }
                      className="w-full h-7 px-1.5 border border-slate-300 bg-white font-mono text-[10px]"
                    />
                  </div>
                </div>

                {/* Inst 4 */}
                <div className="grid grid-cols-3 gap-2 p-2 bg-slate-50 border border-slate-200">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">الدفعة 4 (دج)</label>
                    <input
                      type="number"
                      value={relationalEditStudent.inst4?.amount || 0}
                      onChange={(e) =>
                        setRelationalEditStudent({
                          ...relationalEditStudent,
                          inst4: { ...relationalEditStudent.inst4, amount: Number(e.target.value) || 0 },
                        })
                      }
                      className="w-full h-7 px-1.5 border border-slate-300 bg-white font-mono font-bold text-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">التاريخ المقترح 4</label>
                    <input
                      type="date"
                      value={relationalEditStudent.inst4?.dueDate || '2026-05-15'}
                      onChange={(e) =>
                        setRelationalEditStudent({
                          ...relationalEditStudent,
                          inst4: { ...relationalEditStudent.inst4, dueDate: e.target.value },
                        })
                      }
                      className="w-full h-7 px-1.5 border border-slate-300 bg-white font-mono text-[10px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">وصل الدفعة 4</label>
                    <input
                      type="text"
                      value={relationalEditStudent.inst4?.receipt || ''}
                      onChange={(e) =>
                        setRelationalEditStudent({
                          ...relationalEditStudent,
                          inst4: { ...relationalEditStudent.inst4, receipt: e.target.value },
                        })
                      }
                      className="w-full h-7 px-1.5 border border-slate-300 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setRelationalEditStudent(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>تثبيت التعديل العلائقي</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. ADD STUDENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">تسجيل بطل سوروبان جديد</span>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewStudent} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">الاسم واللقب (عربي) *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: يوسف لعور"
                  value={newStudent.nameAr}
                  onChange={(e) => setNewStudent({ ...newStudent, nameAr: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الحزام *</label>
                  <select
                    value={newStudent.belt}
                    onChange={(e) => setNewStudent({ ...newStudent, belt: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white font-semibold"
                  >
                    {BELTS_LIST.map((b, bIdx) => (
                      <option key={bIdx} value={b.name}>
                        حزام {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المستوى (p1 - s6) *</label>
                  <select
                    value={newStudent.levelCode}
                    onChange={(e) => setNewStudent({ ...newStudent, levelCode: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white font-mono font-bold"
                  >
                    {SOROBAN_LEVELS.map((lvl, lIdx) => (
                      <option key={lIdx} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المدرب المشرف *</label>
                  <select
                    value={newStudent.coach}
                    onChange={(e) => setNewStudent({ ...newStudent, coach: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white font-semibold"
                  >
                    {SOROBAN_COACHES.map((c, cIdx) => (
                      <option key={cIdx} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المستحق المتفق عليه (دج) *</label>
                  <input
                    type="number"
                    required
                    value={newStudent.totalFee}
                    onChange={(e) => setNewStudent({ ...newStudent, totalFee: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الدفعة 1 المسددة (دج) *</label>
                  <input
                    type="number"
                    required
                    value={newStudent.inst1Amount}
                    onChange={(e) => setNewStudent({ ...newStudent, inst1Amount: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white font-mono font-bold text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">رقم وصل الدفعة 1 *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.receipt1}
                    onChange={(e) => setNewStudent({ ...newStudent, receipt1: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white font-mono font-bold text-blue-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ملاحظات</label>
                <textarea
                  rows={2}
                  value={newStudent.notes}
                  onChange={(e) => setNewStudent({ ...newStudent, notes: e.target.value })}
                  className="w-full p-2 border border-slate-300 bg-slate-50 focus:bg-white"
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
                    دليل واجهة: سجل السوروبان والحساب الذهني (1.2)
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    نظام متابعة أبطال السوروبان، تصنيف الأحزمة، والدفعات الـ 4
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
                <p className="font-semibold mb-1">النموذج المعتمد:</p>
                <p className="text-[11px]">
                  متابعة تقدم طلاب الحساب الذهني والسوروبان عبر تصنيف الأحزمة الـ 6 المعتمدة
                  (أصفر، أخضر، أزرق، أحمر، بني، أسود) والمستويات الـ 9 (p1 إلى s6)، بنظام الأقساط الـ 4
                  مع توثيق وصولات السداد وتواريخ الاستحقاق.
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="font-bold text-slate-800">ميزات الواجهة المحدثة:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                  <li>
                    <strong>فصل مؤشرات الأداء (KPIs):</strong> تم نقل جميع المؤشرات إلى تبويب مستقل
                    لإفساح المجال كاملاً لجدول البيانات الفعلي.
                  </li>
                  <li>
                    <strong>هيكل البيانات المعتمد:</strong> التزام كامل بتسلسل الأعمدة المحدد
                    (الإسم واللقب، الوضعية، الدفعات الـ 4 مع الوصولات وتواريخ الاستحقاق، المجموع والباقي).
                  </li>
                  <li>
                    <strong>التحكم بالزر الأيمن:</strong> قائمة سريعة لتغيير الحزام، المستوى، تسجيل سداد
                    دفعة جديدة، أو فتح نافذة التعديل العلائقي الشامل.
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
