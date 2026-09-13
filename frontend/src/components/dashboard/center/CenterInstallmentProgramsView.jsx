import React, { useState, useMemo, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  Coins,
  CreditCard,
  AlertCircle,
  CheckCircle,
  FileText,
  Edit2,
  Plus,
  X,
  Printer,
  Download,
  Search,
  Info,
  Calendar,
  Layers,
  BookOpen,
  Copy,
  Trash2,
  Check,
  UserCheck,
  TrendingUp,
  Tag,
  Eye,
  Filter,
  ArrowUpDown,
  Sliders,
} from 'lucide-react';
import { ReceiptVoucherModal } from '../common/ReceiptVoucherModal';
import { MOCK_CENTER_PROGRAMS } from '../../../mock/centerMockData';

// Programs metadata
const PROGRAMS_META = [
  {
    id: 'support-classes',
    labelAr: 'دروس الدعم العلمي والأدبي (دعم)',
    shortLabel: 'دروس الدعم',
    icon: GraduationCap,
    badge: 'دعم',
    coaches: ['أ. عبد القادر مرابط', 'أ. كمال بن ناصر', 'أ. نادية سعيدي', 'أ. سمير بوعزة'],
    levels: ['4AM (رابعة متوسط)', '1AS (أولى ثانوي علمي)', '2AS (ثانية ثانوي علمي)', '3AS (بكالوريا رياضيات)', '3AS (بكالوريا علوم تجريبية)', '3AM (ثالثة متوسط)'],
  },
  {
    id: 'languages',
    labelAr: 'برنامج اللغات - دورات المستويات (لغات)',
    shortLabel: 'دورات اللغات',
    icon: BookOpen,
    badge: 'لغات',
    coaches: ['أ. إسلام عماري', 'أ. صابرينا بن طيب', 'أ. مريم بن عيسى', 'أ. حكيم دراجي'],
    levels: ['A1 - مبتدئ', 'A2 - فرنسية عامة', 'B1 - إنجليزية تواصل', 'B2 - Business English', 'C1 - إنجليزية متقدمة'],
  },
  {
    id: 'robotics',
    labelAr: 'نادي الروبوتيك والذكاء الاصطناعي (STEM)',
    shortLabel: 'الروبوتيك و AI',
    icon: Layers,
    badge: 'STEM',
    coaches: ['م. حسام الدين شريف', 'م. أسامة بلقاسم', 'م. ياسين زروال'],
    levels: ['Arduino Level 1', 'Lego Spike Prime', 'AI & Python Junior', 'Microbit & Sensors', 'Robotics Masters'],
  },
  {
    id: 'school-languages',
    labelAr: 'دعم مناهج اللغات المدرسية (مناهج)',
    shortLabel: 'مناهج اللغات',
    icon: BookOpen,
    badge: 'مناهج',
    coaches: ['أ. فتيحة بوزيد', 'أ. إسلام عماري', 'أ. مريم بن عيسى'],
    levels: ['BEM Prep - فرنسية', 'BAC Prep - إنجليزية', '1AS - تقوية مناهج', 'Primary - لغات مبكرة'],
  },
];

export function CenterInstallmentProgramsView({ defaultProgram = 'support-classes' }) {
  const [activeProgram, setActiveProgram] = useState(defaultProgram);
  const [selectedYear, setSelectedYear] = useState('2025-2026');
  const [activeTab, setActiveTab] = useState('table'); // 'table' | 'kpis'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [coachFilter, setCoachFilter] = useState('ALL');
  const [levelFilter, setLevelFilter] = useState('ALL');

  // Programs Dataset (Multi-Year & 4 Programs)
  const [programsData, setProgramsData] = useState(() => {
    // Enrich with status and ensure safe defaults
    const copy = JSON.parse(JSON.stringify(MOCK_CENTER_PROGRAMS));
    Object.keys(copy).forEach((k) => {
      copy[k].students = (copy[k].students || []).map((s) => ({
        ...s,
        academicYear: '2025-2026',
        status: s.remaining === 0 ? 'مسدد كلياً' : 'نشط (توجد ديون)',
        inst1: s.inst1 || { amount: 0, receipt: '', date: '2025-10-15' },
        inst2: s.inst2 || { amount: 0, dueDate: '2026-01-15', receipt: '' },
        inst3: s.inst3 || { amount: 0, dueDate: '2026-03-15', receipt: '' },
        inst4: s.inst4 || { amount: 0, dueDate: '2026-05-15', receipt: '' },
      }));
    });
    return copy;
  });

  // UI Modals State
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [relationalEditStudent, setRelationalEditStudent] = useState(null);
  const [quickPayStudent, setQuickPayStudent] = useState(null);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  // Quick Payment form
  const [paymentForm, setPaymentForm] = useState({
    installmentNumber: 2,
    amount: '',
    receipt: '',
    paymentDate: new Date().toISOString().split('T')[0],
  });

  // Inline Editing State
  const [inlineEdit, setInlineEdit] = useState(null); // { id, field }
  const [inlineVal, setInlineVal] = useState('');

  // Right-Click Context Menu State
  const [contextMenu, setContextMenu] = useState(null); // { x, y, student, field }

  // New Student Registration Form
  const [newStudent, setNewStudent] = useState({
    fullName: '',
    level: '',
    coach: '',
    agreedFee: '20000',
    inst1: '5000',
    inst1Receipt: '',
    inst2DueDate: '2026-01-15',
    inst3DueDate: '2026-03-15',
    inst4DueDate: '2026-05-15',
    notes: '',
  });

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = () => setContextMenu(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const currentMeta = PROGRAMS_META.find((p) => p.id === activeProgram) || PROGRAMS_META[0];
  const currentProgram = programsData[activeProgram] || { titleAr: currentMeta.labelAr, students: [] };
  const studentsList = currentProgram.students || [];

  // Filter students
  const filteredStudents = useMemo(() => {
    return studentsList.filter((s) => {
      const matchYear = !s.academicYear || s.academicYear === selectedYear;
      const matchCoach = coachFilter === 'ALL' || s.coach === coachFilter;
      const matchLevel = levelFilter === 'ALL' || s.level === levelFilter;
      const hasDebt = (s.remaining || 0) > 0;
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PAID' && !hasDebt) ||
        (statusFilter === 'DEBT' && hasDebt) ||
        (statusFilter === 'ACTIVE' && s.status?.includes('نشط'));

      const q = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        s.fullName.toLowerCase().includes(q) ||
        s.level.toLowerCase().includes(q) ||
        s.coach.toLowerCase().includes(q) ||
        (s.notes && s.notes.toLowerCase().includes(q)) ||
        (s.inst1?.receipt && s.inst1.receipt.toLowerCase().includes(q)) ||
        (s.inst2?.receipt && s.inst2.receipt.toLowerCase().includes(q)) ||
        (s.inst3?.receipt && s.inst3.receipt.toLowerCase().includes(q)) ||
        (s.inst4?.receipt && s.inst4.receipt.toLowerCase().includes(q));

      return matchYear && matchCoach && matchLevel && matchStatus && matchSearch;
    });
  }, [studentsList, selectedYear, coachFilter, levelFilter, statusFilter, searchTerm]);

  // KPIs Calculations
  const totalStudents = studentsList.length;
  const filteredCount = filteredStudents.length;
  const totalDue = studentsList.reduce((acc, s) => acc + (Number(s.agreedFee) || 0), 0);
  const totalCollected = studentsList.reduce((acc, s) => acc + (Number(s.totalPaid) || 0), 0);
  const totalDebts = studentsList.reduce((acc, s) => acc + (Number(s.remaining) || 0), 0);
  const collectionRate = totalDue > 0 ? Math.round((totalCollected / totalDue) * 100) : 0;

  // Totals for filtered table columns
  const sumAgreed = filteredStudents.reduce((acc, s) => acc + (Number(s.agreedFee) || 0), 0);
  const sumInst1 = filteredStudents.reduce((acc, s) => acc + (Number(s.inst1?.amount) || 0), 0);
  const sumInst2 = filteredStudents.reduce((acc, s) => acc + (Number(s.inst2?.amount) || 0), 0);
  const sumInst3 = filteredStudents.reduce((acc, s) => acc + (Number(s.inst3?.amount) || 0), 0);
  const sumInst4 = filteredStudents.reduce((acc, s) => acc + (Number(s.inst4?.amount) || 0), 0);
  const sumTotalPaid = filteredStudents.reduce((acc, s) => acc + (Number(s.totalPaid) || 0), 0);
  const sumRemaining = filteredStudents.reduce((acc, s) => acc + (Number(s.remaining) || 0), 0);

  const kpiCards = [
    {
      label: 'إجمالي الطلاب المسجلين بالبرنامج',
      value: `${totalStudents} طالب`,
      icon: Users,
      subtext: currentMeta.labelAr.split('(')[0],
      change: 'نشط',
      isPositive: true,
    },
    {
      label: 'مجموع المستحقات الكلية (دج)',
      value: `${totalDue.toLocaleString()} دج`,
      icon: Coins,
      subtext: `عقود الدورة لعام (${selectedYear})`,
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
      label: 'الديون والمتبقيات قيد التحصيل',
      value: `${totalDebts.toLocaleString()} دج`,
      icon: AlertCircle,
      subtext: totalDebts > 0 ? 'أقساط مجدولة قيد الدفع' : 'تم التحصيل كلياً',
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

    setProgramsData((prev) => {
      const currentList = prev[activeProgram]?.students || [];
      const updatedList = currentList.map((s) => {
        if (s.id !== id) return s;

        let updated = { ...s };

        if (field === 'fullName') updated.fullName = inlineVal.trim() || updated.fullName;
        if (field === 'level') updated.level = inlineVal;
        if (field === 'coach') updated.coach = inlineVal;
        if (field === 'notes') updated.notes = inlineVal;
        if (field === 'status') updated.status = inlineVal;

        if (field === 'agreedFee') {
          const fee = Math.max(0, Number(inlineVal) || 0);
          updated.agreedFee = fee;
          updated.remaining = Math.max(0, fee - (updated.totalPaid || 0));
        }

        // Installment amounts
        if (field === 'inst1.amount') {
          const val = Math.max(0, Number(inlineVal) || 0);
          updated.inst1 = { ...updated.inst1, amount: val };
        }
        if (field === 'inst2.amount') {
          const val = Math.max(0, Number(inlineVal) || 0);
          updated.inst2 = { ...updated.inst2, amount: val };
        }
        if (field === 'inst3.amount') {
          const val = Math.max(0, Number(inlineVal) || 0);
          updated.inst3 = { ...updated.inst3, amount: val };
        }
        if (field === 'inst4.amount') {
          const val = Math.max(0, Number(inlineVal) || 0);
          updated.inst4 = { ...updated.inst4, amount: val };
        }

        // Installment due dates & receipts
        if (field === 'inst2.dueDate') updated.inst2 = { ...updated.inst2, dueDate: inlineVal };
        if (field === 'inst2.receipt') updated.inst2 = { ...updated.inst2, receipt: inlineVal.trim() };
        if (field === 'inst3.dueDate') updated.inst3 = { ...updated.inst3, dueDate: inlineVal };
        if (field === 'inst3.receipt') updated.inst3 = { ...updated.inst3, receipt: inlineVal.trim() };
        if (field === 'inst4.dueDate') updated.inst4 = { ...updated.inst4, dueDate: inlineVal };
        if (field === 'inst4.receipt') updated.inst4 = { ...updated.inst4, receipt: inlineVal.trim() };

        // Recalculate totals
        const paid =
          (Number(updated.inst1?.amount) || 0) +
          (Number(updated.inst2?.amount) || 0) +
          (Number(updated.inst3?.amount) || 0) +
          (Number(updated.inst4?.amount) || 0);

        updated.totalPaid = paid;
        updated.remaining = Math.max(0, (Number(updated.agreedFee) || 0) - paid);
        updated.status = updated.remaining === 0 ? 'مسدد كلياً' : 'نشط (توجد ديون)';

        return updated;
      });

      return {
        ...prev,
        [activeProgram]: {
          ...prev[activeProgram],
          students: updatedList,
        },
      };
    });

    setInlineEdit(null);
  };

  // Quick Relational Coach Change
  const handleQuickChangeCoach = (studentId, newCoach) => {
    setProgramsData((prev) => {
      const list = prev[activeProgram]?.students || [];
      return {
        ...prev,
        [activeProgram]: {
          ...prev[activeProgram],
          students: list.map((s) => (s.id === studentId ? { ...s, coach: newCoach } : s)),
        },
      };
    });
    setContextMenu(null);
  };

  // Quick Relational Level Change
  const handleQuickChangeLevel = (studentId, newLevel) => {
    setProgramsData((prev) => {
      const list = prev[activeProgram]?.students || [];
      return {
        ...prev,
        [activeProgram]: {
          ...prev[activeProgram],
          students: list.map((s) => (s.id === studentId ? { ...s, level: newLevel } : s)),
        },
      };
    });
    setContextMenu(null);
  };

  // Context Menu Trigger
  const handleContextMenu = (e, student, field) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      student,
      field,
    });
  };

  // Delete student
  const handleDeleteStudent = (id) => {
    if (window.confirm('هل أنت متأكد من حذف تسجيل هذا الطالب نهائياً من البرنامج؟')) {
      setProgramsData((prev) => ({
        ...prev,
        [activeProgram]: {
          ...prev[activeProgram],
          students: (prev[activeProgram]?.students || []).filter((s) => s.id !== id),
        },
      }));
    }
  };

  // Save Relational Edit Form
  const handleSaveRelationalEdit = (e) => {
    e.preventDefault();
    if (!relationalEditStudent) return;

    const fee = Number(relationalEditStudent.agreedFee) || 0;
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

    setProgramsData((prev) => ({
      ...prev,
      [activeProgram]: {
        ...prev[activeProgram],
        students: (prev[activeProgram]?.students || []).map((s) =>
          s.id === updated.id ? updated : s
        ),
      },
    }));

    setRelationalEditStudent(null);
  };

  // Quick Payment Save
  const handleSaveQuickPayment = (e) => {
    e.preventDefault();
    if (!quickPayStudent) return;

    const instKey = `inst${paymentForm.installmentNumber}`;
    const amountNum = Number(paymentForm.amount) || 0;
    const receiptStr = paymentForm.receipt.trim() || `REC-PAY-${Date.now().toString().slice(-4)}`;

    const currentInst = quickPayStudent[instKey] || {};
    const updatedInst = {
      ...currentInst,
      amount: amountNum,
      receipt: receiptStr,
      dueDate: currentInst.dueDate || paymentForm.paymentDate,
    };

    const updatedStudent = {
      ...quickPayStudent,
      [instKey]: updatedInst,
    };

    const paid =
      (Number(updatedStudent.inst1?.amount) || 0) +
      (Number(updatedStudent.inst2?.amount) || 0) +
      (Number(updatedStudent.inst3?.amount) || 0) +
      (Number(updatedStudent.inst4?.amount) || 0);

    updatedStudent.totalPaid = paid;
    updatedStudent.remaining = Math.max(0, (Number(updatedStudent.agreedFee) || 0) - paid);
    updatedStudent.status = updatedStudent.remaining === 0 ? 'مسدد كلياً' : 'نشط (توجد ديون)';

    setProgramsData((prev) => ({
      ...prev,
      [activeProgram]: {
        ...prev[activeProgram],
        students: (prev[activeProgram]?.students || []).map((s) =>
          s.id === updatedStudent.id ? updatedStudent : s
        ),
      },
    }));

    setQuickPayStudent(null);
  };

  // Open Add Student
  const handleOpenAdd = () => {
    const seq = studentsList.length + 1;
    setNewStudent({
      fullName: '',
      level: currentMeta.levels[0] || 'المستوى 1',
      coach: currentMeta.coaches[0] || 'أستاذ الدورة',
      agreedFee: '20000',
      inst1: '5000',
      inst1Receipt: `REC-${currentMeta.badge}-26-${String(seq).padStart(2, '0')}`,
      inst2DueDate: '2026-01-15',
      inst3DueDate: '2026-03-15',
      inst4DueDate: '2026-05-15',
      notes: 'تسجيل جديد',
    });
    setIsAddModalOpen(true);
  };

  // Save New Student
  const handleSaveNewStudent = (e) => {
    e.preventDefault();
    if (!newStudent.fullName.trim()) return;

    const fee = Number(newStudent.agreedFee) || 0;
    const i1 = Number(newStudent.inst1) || 0;
    const seq = studentsList.length + 1;

    const entry = {
      id: `STD-${currentMeta.badge}-${Date.now()}`,
      seq,
      academicYear: selectedYear,
      fullName: newStudent.fullName.trim(),
      level: newStudent.level,
      coach: newStudent.coach,
      agreedFee: fee,
      inst1: { amount: i1, receipt: newStudent.inst1Receipt, date: '2025-10-15' },
      inst2: { amount: 0, dueDate: newStudent.inst2DueDate, receipt: '' },
      inst3: { amount: 0, dueDate: newStudent.inst3DueDate, receipt: '' },
      inst4: { amount: 0, dueDate: newStudent.inst4DueDate, receipt: '' },
      totalPaid: i1,
      remaining: Math.max(0, fee - i1),
      status: fee - i1 === 0 ? 'مسدد كلياً' : 'نشط (توجد ديون)',
      notes: newStudent.notes || 'تسجيل جديد',
    };

    setProgramsData((prev) => ({
      ...prev,
      [activeProgram]: {
        ...prev[activeProgram],
        students: [entry, ...studentsList],
      },
    }));

    setIsAddModalOpen(false);
  };

  // Open Voucher Preview
  const handleOpenVoucher = (student, inst, instNumber) => {
    setSelectedVoucher({
      receiptNumber: inst.receipt || `REC-CTR-INST-${student.seq}-${instNumber}`,
      payerName: student.fullName,
      category: `${currentMeta.shortLabel} (${student.level}) - الدفعة ${instNumber}`,
      amount: inst.amount,
      paymentMethod: 'نقداً (خزينة المركز)',
      branch: 'المركز الأكاديمي والتعليمي',
      date: inst.date || inst.dueDate || '2026-02-15',
      notes: `المتبقي على الطالب: ${(student.remaining || 0).toLocaleString()} دج - أستاذ الدورة: ${student.coach}`,
    });
  };

  // Copy row to clipboard as TSV
  const handleCopyTSV = (s) => {
    const tsv = `${s.seq}\t${s.fullName}\t${s.level}\t${s.coach}\t${s.agreedFee}\t${s.inst1?.amount || 0}\t${s.inst2?.amount || 0}\t${s.inst2?.dueDate || ''}\t${s.inst2?.receipt || ''}\t${s.inst3?.amount || 0}\t${s.inst3?.dueDate || ''}\t${s.inst3?.receipt || ''}\t${s.inst4?.amount || 0}\t${s.inst4?.dueDate || ''}\t${s.inst4?.receipt || ''}\t${s.totalPaid}\t${s.remaining}\t${s.notes || ''}`;
    navigator.clipboard.writeText(tsv);
    alert('تم نسخ بيانات الطالب وجميع الدفعات (TSV) إلى الحافظة بنجاح');
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      '#',
      'الإسم واللقب',
      'المستوى',
      'المدرب',
      'الوضعية (المستحق)',
      'الدفعة 1',
      'الدفعة 2',
      'التاريخ المقترح 2',
      'الوصل 2',
      'الدفعة 3',
      'التاريخ المقترح 3',
      'الوصل 3',
      'الدفعة 4',
      'التاريخ المقترح 4',
      'الوصل 4',
      'مجموع الدفعات',
      'الباقي (الديون)',
      'الملاحظات',
    ];

    const rows = filteredStudents.map((s) => [
      s.seq,
      `"${s.fullName}"`,
      `"${s.level}"`,
      `"${s.coach}"`,
      s.agreedFee,
      s.inst1?.amount || 0,
      s.inst2?.amount || 0,
      s.inst2?.dueDate || '',
      `"${s.inst2?.receipt || ''}"`,
      s.inst3?.amount || 0,
      s.inst3?.dueDate || '',
      `"${s.inst3?.receipt || ''}"`,
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
    link.setAttribute('download', `center_${activeProgram}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-2.5 p-3 bg-slate-50 min-h-screen text-slate-800 font-sans" dir="rtl">
      {/* 1. TOP COMPACT HEADER (Replacing bulky sub-header banner) */}
      <div className="bg-white border border-slate-200 px-3 py-2 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        {/* Right: Title & Info Button */}
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-blue-900 text-white font-bold text-[11px] rounded-xs">
            المركز الأكاديمي والتعليمي
          </span>
          <span className="text-slate-300">|</span>
          <h1 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-blue-900" />
            البرامج بنظام الدفعات (دعم، لغات، STEM، مناهج)
          </h1>
          <span className="text-[11px] text-slate-500 hidden md:inline font-sans">
            (Center 4-Installment Programs Management)
          </span>

          {/* Info Modal Button */}
          <button
            onClick={() => setIsInfoModalOpen(true)}
            title="معلومات وتفاصيل الواجهة"
            className="p-1 text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-xs transition-colors flex items-center gap-0.5 text-xs font-semibold cursor-pointer"
          >
            <Info className="w-4 h-4 text-blue-700" />
            <span className="text-[11px] underline">دليل الواجهة</span>
          </button>
        </div>

        {/* Left: View Mode Switcher, Year, Search & Action Icons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Main View Mode Switcher: Data Table vs KPIs Tab */}
          <div className="flex items-center bg-slate-100 p-0.5 border border-slate-300 rounded-xs">
            <button
              onClick={() => setActiveTab('table')}
              className={`h-6 px-2.5 text-xs font-bold transition-colors flex items-center gap-1 ${
                activeTab === 'table'
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>جدول الدفعات والمسجلين</span>
            </button>
            <button
              onClick={() => setActiveTab('kpis')}
              className={`h-6 px-2.5 text-xs font-bold transition-colors flex items-center gap-1 ${
                activeTab === 'kpis'
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              <span>مؤشرات الأداء والتحليلات (KPIs)</span>
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

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث بالطالب، الأستاذ، الوصل..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-7 w-44 ps-7 pe-2 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-900 transition-colors"
            />
          </div>

          {/* Icon-Only Actions */}
          <button
            onClick={() => window.print()}
            title="طباعة السجل"
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
            title="تسجيل طالب جديد"
            className="h-7 px-2.5 bg-blue-900 hover:bg-blue-950 text-white font-semibold flex items-center gap-1 text-xs shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>طالب جديد</span>
          </button>
        </div>
      </div>

      {/* 2. PROGRAM NAVIGATION BUTTONS BAR (Replacing multiple sidebar items) */}
      <div className="bg-white border border-slate-200 p-1.5 shadow-2xs flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-bold text-slate-500 ms-1">اختر البرنامج التعليمي:</span>
          {PROGRAMS_META.map((prog) => {
            const Icon = prog.icon;
            const count = (programsData[prog.id]?.students || []).length;
            const isSelected = activeProgram === prog.id;

            return (
              <button
                key={prog.id}
                onClick={() => {
                  setActiveProgram(prog.id);
                  setCoachFilter('ALL');
                  setLevelFilter('ALL');
                }}
                className={`h-7 px-3 text-xs font-bold shrink-0 transition-colors border flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-900 text-white border-blue-900 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-200' : 'text-slate-500'}`} />
                <span>{prog.labelAr}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isSelected ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Program Badge Summary */}
        <div className="text-[11px] text-slate-500 font-mono hidden lg:flex items-center gap-3">
          <span>
            الطلبة: <b className="text-slate-800">{filteredCount}</b>
          </span>
          <span>
            المحصل: <b className="text-emerald-800">{sumTotalPaid.toLocaleString()} دج</b>
          </span>
          <span>
            الديون: <b className="text-rose-700">{sumRemaining.toLocaleString()} دج</b>
          </span>
        </div>
      </div>

      {/* 3. DEDICATED KPIS TAB (When activeTab === 'kpis') */}
      {activeTab === 'kpis' && (
        <div className="space-y-3 animate-in fade-in">
          {/* Top 4 Cards */}
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

          {/* In-depth Analytics Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {/* Installments Progress */}
            <div className="bg-white border border-slate-200 p-3 shadow-2xs space-y-2">
              <span className="font-bold text-slate-800 text-xs block">
                توزيع التحصيل عبر الدفعات الـ 4:
              </span>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between items-center p-1.5 bg-slate-50 border border-slate-100">
                  <span className="font-sans text-slate-700">الدفعة 1 (التسجيل الأولي):</span>
                  <span className="font-bold text-emerald-800">{sumInst1.toLocaleString()} دج</span>
                </div>
                <div className="flex justify-between items-center p-1.5 bg-slate-50 border border-slate-100">
                  <span className="font-sans text-slate-700">الدفعة 2 (استحقاق جانفي):</span>
                  <span className="font-bold text-emerald-800">{sumInst2.toLocaleString()} دج</span>
                </div>
                <div className="flex justify-between items-center p-1.5 bg-slate-50 border border-slate-100">
                  <span className="font-sans text-slate-700">الدفعة 3 (استحقاق مارس):</span>
                  <span className="font-bold text-emerald-800">{sumInst3.toLocaleString()} دج</span>
                </div>
                <div className="flex justify-between items-center p-1.5 bg-slate-50 border border-slate-100">
                  <span className="font-sans text-slate-700">الدفعة 4 (استحقاق ماي):</span>
                  <span className="font-bold text-emerald-800">{sumInst4.toLocaleString()} دج</span>
                </div>
              </div>
            </div>

            {/* Collection Gauge */}
            <div className="bg-white border border-slate-200 p-3 shadow-2xs flex flex-col justify-between">
              <span className="font-bold text-slate-800 text-xs block mb-1">
                مؤشر كفاءة استرداد الديون:
              </span>
              <div className="flex flex-col items-center justify-center my-auto py-2">
                <div className="relative flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full border-8 border-slate-100 border-t-blue-900 border-r-blue-900 flex items-center justify-center font-mono font-bold text-xl text-blue-950">
                    {collectionRate}%
                  </div>
                </div>
                <span className="text-[11px] text-slate-500 mt-2">
                  تم تحصيل {totalCollected.toLocaleString()} دج من أصل {totalDue.toLocaleString()} دج
                </span>
              </div>
            </div>

            {/* Coaches Distribution */}
            <div className="bg-white border border-slate-200 p-3 shadow-2xs space-y-2">
              <span className="font-bold text-slate-800 text-xs block">
                توزيع الطلاب على الأساتذة والمدربين:
              </span>
              <div className="space-y-1 text-xs max-h-40 overflow-y-auto">
                {currentMeta.coaches.map((c, cIdx) => {
                  const cCount = studentsList.filter((s) => s.coach === c).length;
                  return (
                    <div
                      key={cIdx}
                      className="flex justify-between items-center p-1 px-2 bg-slate-50 border border-slate-100"
                    >
                      <span className="font-semibold text-slate-800">{c}</span>
                      <span className="font-mono text-blue-900 font-bold bg-blue-50 px-1.5 py-0.2 rounded-xs">
                        {cCount} طلاب
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. MAIN DATA TABLE (Maximum space when activeTab === 'table') */}
      {activeTab === 'table' && (
        <div className="bg-white border border-slate-200 shadow-2xs overflow-hidden space-y-0">
          {/* Sub-Filters Bar */}
          <div className="px-3 py-1.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-700">
                قائمة طلاب {currentMeta.shortLabel} ({filteredStudents.length} طالب مسجل)
              </span>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-6 px-1.5 border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:border-blue-900"
              >
                <option value="ALL">كافة الوضعيات</option>
                <option value="PAID">مسدد كلياً (خالص ✓)</option>
                <option value="DEBT">توجد ديون متأخرة</option>
                <option value="ACTIVE">النشطون حالياً</option>
              </select>

              {/* Coach Filter */}
              <select
                value={coachFilter}
                onChange={(e) => setCoachFilter(e.target.value)}
                className="h-6 px-1.5 border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:border-blue-900"
              >
                <option value="ALL">كافة الأساتذة / المدربين</option>
                {currentMeta.coaches.map((c, cIdx) => (
                  <option key={cIdx} value={c}>
                    {c}
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
                {currentMeta.levels.map((l, lIdx) => (
                  <option key={lIdx} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <span className="bg-amber-50 border border-amber-200 text-amber-900 px-1.5 py-0.5 rounded-xs">
                💡 انقر نقراً مزدوجاً أو بالزر الأيمن للتعديل العلائقي المباشر
              </span>
            </div>
          </div>

          {/* THE EXACT TABLE STRUCTURE SPECIFIED BY THE USER */}
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border-collapse">
              <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold select-none text-[11px]">
                <tr>
                  <th className="p-2 text-center border-e border-slate-200 w-10">#</th>
                  <th className="p-2 text-start border-e border-slate-200 min-w-[140px]">الإسم و اللقب</th>
                  <th className="p-2 text-start border-e border-slate-200 min-w-[120px]">المستوى</th>
                  <th className="p-2 text-start border-e border-slate-200 min-w-[130px]">المدرب</th>
                  <th className="p-2 text-end border-e border-slate-200 min-w-[105px] bg-slate-50">الوضعية</th>

                  {/* Inst 1 */}
                  <th className="p-2 text-end border-e border-slate-200 min-w-[95px] bg-blue-50/30">الدفعة1</th>

                  {/* Inst 2 */}
                  <th className="p-2 text-end border-e border-slate-200 min-w-[95px]">الدفعة 2</th>
                  <th className="p-2 text-center border-e border-slate-200 min-w-[100px]">التاريخ المقترح</th>
                  <th className="p-2 text-center border-e border-slate-200 min-w-[95px]">الوصل</th>

                  {/* Inst 3 */}
                  <th className="p-2 text-end border-e border-slate-200 min-w-[95px]">الدفعة3</th>
                  <th className="p-2 text-center border-e border-slate-200 min-w-[100px]">التاريخ المقترح</th>
                  <th className="p-2 text-center border-e border-slate-200 min-w-[95px]">الوصل</th>

                  {/* Inst 4 */}
                  <th className="p-2 text-end border-e border-slate-200 min-w-[95px]">الدفعة4</th>
                  <th className="p-2 text-center border-e border-slate-200 min-w-[100px]">التاريخ المقترح</th>
                  <th className="p-2 text-center border-e border-slate-200 min-w-[95px]">الوصل</th>

                  {/* Totals & Notes */}
                  <th className="p-2 text-end border-e border-slate-200 min-w-[110px] text-emerald-900 bg-emerald-50/40">
                    مجموع الدفعات
                  </th>
                  <th className="p-2 text-end border-e border-slate-200 min-w-[100px]">الباقي</th>
                  <th className="p-2 text-start border-e border-slate-200 min-w-[140px]">ملاحظة</th>
                  <th className="p-2 text-center min-w-[80px] print:hidden">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 text-[11px]">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={19} className="p-8 text-center text-slate-400">
                      لا توجد سجلات مطابقة لمعايير البحث في هذا البرنامج
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s, idx) => {
                    const isEditingName = inlineEdit?.id === s.id && inlineEdit?.field === 'fullName';
                    const isEditingLevel = inlineEdit?.id === s.id && inlineEdit?.field === 'level';
                    const isEditingCoach = inlineEdit?.id === s.id && inlineEdit?.field === 'coach';
                    const isEditingFee = inlineEdit?.id === s.id && inlineEdit?.field === 'agreedFee';

                    const isEditingI1 = inlineEdit?.id === s.id && inlineEdit?.field === 'inst1.amount';
                    const isEditingI2 = inlineEdit?.id === s.id && inlineEdit?.field === 'inst2.amount';
                    const isEditingI2Date = inlineEdit?.id === s.id && inlineEdit?.field === 'inst2.dueDate';
                    const isEditingI2Rec = inlineEdit?.id === s.id && inlineEdit?.field === 'inst2.receipt';

                    const isEditingI3 = inlineEdit?.id === s.id && inlineEdit?.field === 'inst3.amount';
                    const isEditingI3Date = inlineEdit?.id === s.id && inlineEdit?.field === 'inst3.dueDate';
                    const isEditingI3Rec = inlineEdit?.id === s.id && inlineEdit?.field === 'inst3.receipt';

                    const isEditingI4 = inlineEdit?.id === s.id && inlineEdit?.field === 'inst4.amount';
                    const isEditingI4Date = inlineEdit?.id === s.id && inlineEdit?.field === 'inst4.dueDate';
                    const isEditingI4Rec = inlineEdit?.id === s.id && inlineEdit?.field === 'inst4.receipt';

                    const isEditingNotes = inlineEdit?.id === s.id && inlineEdit?.field === 'notes';

                    const hasDebt = (s.remaining || 0) > 0;

                    return (
                      <tr
                        key={s.id}
                        onContextMenu={(e) => handleContextMenu(e, s, 'row')}
                        className="hover:bg-blue-50/40 transition-colors h-8"
                      >
                        {/* 1. Seq */}
                        <td className="p-1 text-center border-e border-slate-200 font-mono text-slate-400 font-bold">
                          {idx + 1}
                        </td>

                        {/* 2. الإسم و اللقب */}
                        <td
                          onDoubleClick={() => startInlineEdit(s.id, 'fullName', s.fullName)}
                          className="p-1 border-e border-slate-200 font-bold text-slate-900 cursor-pointer"
                        >
                          {isEditingName ? (
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
                              className="w-full h-6 px-1 text-xs border border-blue-600 bg-white font-bold"
                            />
                          ) : (
                            <span>{s.fullName}</span>
                          )}
                        </td>

                        {/* 3. المستوى */}
                        <td
                          onDoubleClick={() => startInlineEdit(s.id, 'level', s.level)}
                          className="p-1 border-e border-slate-200 cursor-pointer"
                        >
                          {isEditingLevel ? (
                            <select
                              autoFocus
                              value={inlineVal}
                              onChange={(e) => setInlineVal(e.target.value)}
                              onBlur={commitInlineEdit}
                              className="w-full h-6 px-1 text-xs border border-blue-600 bg-white font-semibold"
                            >
                              {currentMeta.levels.map((l, lIdx) => (
                                <option key={lIdx} value={l}>
                                  {l}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="px-1.5 py-0.2 bg-blue-50 text-blue-900 border border-blue-200 text-[10px] font-semibold rounded-xs">
                              {s.level}
                            </span>
                          )}
                        </td>

                        {/* 4. المدرب */}
                        <td
                          onDoubleClick={() => startInlineEdit(s.id, 'coach', s.coach)}
                          className="p-1 border-e border-slate-200 text-slate-800 font-semibold cursor-pointer"
                        >
                          {isEditingCoach ? (
                            <select
                              autoFocus
                              value={inlineVal}
                              onChange={(e) => setInlineVal(e.target.value)}
                              onBlur={commitInlineEdit}
                              className="w-full h-6 px-1 text-xs border border-blue-600 bg-white font-semibold"
                            >
                              {currentMeta.coaches.map((c, cIdx) => (
                                <option key={cIdx} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span>{s.coach}</span>
                          )}
                        </td>

                        {/* 5. الوضعية (المستحق المتفق عليه) */}
                        <td
                          onDoubleClick={() => startInlineEdit(s.id, 'agreedFee', s.agreedFee)}
                          className="p-1 text-end border-e border-slate-200 font-mono font-bold text-slate-900 bg-slate-50/50 cursor-pointer"
                        >
                          {isEditingFee ? (
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
                            <span>{Number(s.agreedFee || 0).toLocaleString()} دج</span>
                          )}
                        </td>

                        {/* 6. الدفعة 1 */}
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
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitInlineEdit();
                                if (e.key === 'Escape') setInlineEdit(null);
                              }}
                              className="w-full h-6 px-1 text-end text-xs border border-blue-600 bg-white font-mono font-bold"
                            />
                          ) : (
                            <span>{Number(s.inst1?.amount || 0).toLocaleString()} دج</span>
                          )}
                        </td>

                        {/* 7. الدفعة 2 */}
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
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitInlineEdit();
                                if (e.key === 'Escape') setInlineEdit(null);
                              }}
                              className="w-full h-6 px-1 text-end text-xs border border-blue-600 bg-white font-mono font-bold"
                            />
                          ) : (
                            <span className={Number(s.inst2?.amount || 0) > 0 ? 'text-emerald-800 font-bold' : 'text-slate-400'}>
                              {Number(s.inst2?.amount || 0).toLocaleString()} دج
                            </span>
                          )}
                        </td>

                        {/* 8. التاريخ المقترح (الدفعة 2) */}
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

                        {/* 9. الوصل (الدفعة 2) */}
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
                              className="w-full h-6 px-1 text-[10px] border border-blue-600 bg-white font-mono text-center"
                            />
                          ) : s.inst2?.receipt ? (
                            <button
                              onClick={() => handleOpenVoucher(s, s.inst2, 2)}
                              title="معاينة الوصل"
                              className="px-1.5 py-0.2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xs font-mono font-bold"
                            >
                              {s.inst2.receipt}
                            </button>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* 10. الدفعة 3 */}
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

                        {/* 12. الوصل (الدفعة 3) */}
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
                              className="w-full h-6 px-1 text-[10px] border border-blue-600 bg-white font-mono text-center"
                            />
                          ) : s.inst3?.receipt ? (
                            <button
                              onClick={() => handleOpenVoucher(s, s.inst3, 3)}
                              title="معاينة الوصل"
                              className="px-1.5 py-0.2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xs font-mono font-bold"
                            >
                              {s.inst3.receipt}
                            </button>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* 13. الدفعة 4 */}
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

                        {/* 14. التاريخ المقترح (الدفعة 4) */}
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

                        {/* 15. الوصل (الدفعة 4) */}
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
                              className="w-full h-6 px-1 text-[10px] border border-blue-600 bg-white font-mono text-center"
                            />
                          ) : s.inst4?.receipt ? (
                            <button
                              onClick={() => handleOpenVoucher(s, s.inst4, 4)}
                              title="معاينة الوصل"
                              className="px-1.5 py-0.2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xs font-mono font-bold"
                            >
                              {s.inst4.receipt}
                            </button>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* 16. مجموع الدفعات */}
                        <td className="p-1 text-end border-e border-slate-200 font-mono font-bold text-emerald-900 bg-emerald-50/20">
                          {Number(s.totalPaid || 0).toLocaleString()} دج
                        </td>

                        {/* 17. الباقي (الديون) */}
                        <td className="p-1 text-end border-e border-slate-200 font-mono font-bold">
                          {hasDebt ? (
                            <span className="px-1.5 py-0.2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xs">
                              {Number(s.remaining || 0).toLocaleString()} دج
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-semibold text-[10px]">خالص ✓</span>
                          )}
                        </td>

                        {/* 18. ملاحظة */}
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

                        {/* 19. الإجراءات */}
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

              {/* TABLE SUMMARY FOOTER */}
              <tfoot className="bg-slate-200 font-bold border-t-2 border-slate-300 font-mono text-[11px]">
                <tr>
                  <td colSpan={5} className="p-2 px-3 text-start font-sans text-slate-900 border-e border-slate-300">
                    المجموع الكلي ({filteredStudents.length} طلاب مسجلين)
                  </td>

                  {/* Inst 1 Sum */}
                  <td className="p-2 text-end border-e border-slate-300 text-emerald-900">
                    {sumInst1.toLocaleString()} دج
                  </td>

                  {/* Inst 2 Sum */}
                  <td className="p-2 text-end border-e border-slate-300 text-emerald-900">
                    {sumInst2.toLocaleString()} دج
                  </td>
                  <td colSpan={2} className="p-2 text-center border-e border-slate-300 text-slate-400 font-sans text-[10px]">
                    -
                  </td>

                  {/* Inst 3 Sum */}
                  <td className="p-2 text-end border-e border-slate-300 text-emerald-900">
                    {sumInst3.toLocaleString()} دج
                  </td>
                  <td colSpan={2} className="p-2 text-center border-e border-slate-300 text-slate-400 font-sans text-[10px]">
                    -
                  </td>

                  {/* Inst 4 Sum */}
                  <td className="p-2 text-end border-e border-slate-300 text-emerald-900">
                    {sumInst4.toLocaleString()} دج
                  </td>
                  <td colSpan={2} className="p-2 text-center border-e border-slate-300 text-slate-400 font-sans text-[10px]">
                    -
                  </td>

                  {/* Total Paid Sum */}
                  <td className="p-2 text-end border-e border-slate-300 text-emerald-950 font-bold text-xs bg-emerald-100/50">
                    {sumTotalPaid.toLocaleString()} دج
                  </td>

                  {/* Debts Sum */}
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

      {/* 5. SMART RIGHT-CLICK CONTEXT MENU (RELATIONAL ACTIONS) */}
      {contextMenu && (
        <div
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 bg-white border border-slate-300 shadow-xl py-1 text-xs w-64 divide-y divide-slate-100 animate-in fade-in zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1 font-bold text-slate-800 bg-slate-50 text-[11px] flex items-center justify-between">
            <span>{contextMenu.student.fullName}</span>
            <span className="text-blue-900 font-mono font-bold">
              {Number(contextMenu.student.remaining || 0) > 0 ? `باقي: ${contextMenu.student.remaining} دج` : 'خالص ✓'}
            </span>
          </div>

          {/* Relational Quick Coaches Switcher */}
          <div className="p-1">
            <div className="text-[10px] text-slate-400 px-2 py-0.5 font-bold">
              الربط العلائقي: تعيين المدرب / الأستاذ:
            </div>
            <div className="max-h-24 overflow-y-auto space-y-0.5">
              {currentMeta.coaches.map((c, cIdx) => (
                <button
                  key={cIdx}
                  onClick={() => handleQuickChangeCoach(contextMenu.student.id, c)}
                  className={`w-full text-start px-2 py-1 text-[11px] rounded-xs truncate hover:bg-blue-50 ${
                    contextMenu.student.coach === c ? 'text-blue-950 font-bold bg-blue-50' : 'text-slate-700'
                  }`}
                >
                  • {c}
                </button>
              ))}
            </div>
          </div>

          {/* Relational Quick Level Switcher */}
          <div className="p-1">
            <div className="text-[10px] text-slate-400 px-2 py-0.5 font-bold">
              الربط العلائقي: تعديل المستوى الدراسي:
            </div>
            <div className="max-h-24 overflow-y-auto space-y-0.5">
              {currentMeta.levels.map((l, lIdx) => (
                <button
                  key={lIdx}
                  onClick={() => handleQuickChangeLevel(contextMenu.student.id, l)}
                  className={`w-full text-start px-2 py-1 text-[11px] rounded-xs truncate hover:bg-blue-50 ${
                    contextMenu.student.level === l ? 'text-blue-950 font-bold bg-blue-50' : 'text-slate-700'
                  }`}
                >
                  • {l}
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

            {(contextMenu.student.remaining || 0) > 0 && (
              <button
                onClick={() => {
                  const s = contextMenu.student;
                  const nextInst = !s.inst2?.amount ? 2 : !s.inst3?.amount ? 3 : 4;
                  setQuickPayStudent(s);
                  setPaymentForm({
                    installmentNumber: nextInst,
                    amount: String(Math.min(s.remaining, 5000)),
                    receipt: `REC-${currentMeta.badge}-26-${Date.now().toString().slice(-3)}`,
                    paymentDate: new Date().toISOString().split('T')[0],
                  });
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 text-start hover:bg-emerald-50 flex items-center gap-2 text-emerald-800 font-semibold"
              >
                <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                <span>تسجيل تسديد دفعة مالية جديدة</span>
              </button>
            )}

            <button
              onClick={() => {
                startInlineEdit(contextMenu.student.id, 'fullName', contextMenu.student.fullName);
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-start hover:bg-blue-50 flex items-center gap-2 text-slate-700"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-700" />
              <span>تعديل الاسم والبيانات مباشرة</span>
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

      {/* 6. COMPREHENSIVE RELATIONAL EDIT DIALOG */}
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
                    تعديل البيانات والروابط العلائقية للطالب: {relationalEditStudent.fullName}
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    التحكم في الأستاذ المدرب، المستوى التعليمي، وجدول الدفعات الـ 4
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
              {/* Basic & Relational Links */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 bg-slate-50 p-3 border border-slate-200">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-slate-700 font-semibold mb-1">الاسم واللقب *</label>
                  <input
                    type="text"
                    required
                    value={relationalEditStudent.fullName}
                    onChange={(e) =>
                      setRelationalEditStudent({ ...relationalEditStudent, fullName: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-white font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    المستوى التعليمي (رابط علائقي) *
                  </label>
                  <select
                    value={relationalEditStudent.level}
                    onChange={(e) =>
                      setRelationalEditStudent({ ...relationalEditStudent, level: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-white font-semibold text-xs text-blue-900"
                  >
                    {currentMeta.levels.map((l, lIdx) => (
                      <option key={lIdx} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    المدرب / الأستاذ (رابط علائقي) *
                  </label>
                  <select
                    value={relationalEditStudent.coach}
                    onChange={(e) =>
                      setRelationalEditStudent({ ...relationalEditStudent, coach: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-white font-semibold text-xs text-blue-900"
                  >
                    {currentMeta.coaches.map((c, cIdx) => (
                      <option key={cIdx} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    المستحق الكلي المتفق عليه (الوضعية) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={relationalEditStudent.agreedFee}
                    onChange={(e) =>
                      setRelationalEditStudent({
                        ...relationalEditStudent,
                        agreedFee: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-white font-mono font-bold text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الحالة والوضعية</label>
                  <select
                    value={relationalEditStudent.status}
                    onChange={(e) =>
                      setRelationalEditStudent({ ...relationalEditStudent, status: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-white font-semibold text-xs"
                  >
                    <option value="نشط (توجد ديون)">نشط (توجد ديون)</option>
                    <option value="مسدد كلياً">مسدد كلياً (خالص ✓)</option>
                    <option value="مؤجل">مؤجل الدفع</option>
                    <option value="منسحب">منسحب من الدورة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ملاحظات خاصة</label>
                  <input
                    type="text"
                    value={relationalEditStudent.notes || ''}
                    onChange={(e) =>
                      setRelationalEditStudent({ ...relationalEditStudent, notes: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-white text-xs"
                  />
                </div>
              </div>

              {/* 4 Installments Details Grid */}
              <div className="space-y-2 border border-slate-200 p-3 bg-white">
                <span className="font-bold text-slate-800 text-xs block">
                  تفاصيل الأقساط الـ 4 والوصولات وتواريخ الاستحقاق:
                </span>

                {/* Inst 1 */}
                <div className="grid grid-cols-3 gap-2 p-2 bg-slate-50 border border-slate-200">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">الدفعة 1 (المبلغ دج)</label>
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
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">رقم وصل الدفعة 1</label>
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
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">تاريخ الدفعة 1</label>
                    <input
                      type="date"
                      value={relationalEditStudent.inst1?.date || '2025-10-15'}
                      onChange={(e) =>
                        setRelationalEditStudent({
                          ...relationalEditStudent,
                          inst1: { ...relationalEditStudent.inst1, date: e.target.value },
                        })
                      }
                      className="w-full h-7 px-1.5 border border-slate-300 bg-white font-mono text-[10px]"
                    />
                  </div>
                </div>

                {/* Inst 2 */}
                <div className="grid grid-cols-3 gap-2 p-2 bg-slate-50 border border-slate-200">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">الدفعة 2 (المبلغ دج)</label>
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
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">التاريخ المقترح (استحقاق 2)</label>
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
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">رقم وصل الدفعة 2</label>
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
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">الدفعة 3 (المبلغ دج)</label>
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
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">التاريخ المقترح (استحقاق 3)</label>
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
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">رقم وصل الدفعة 3</label>
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
                </div>

                {/* Inst 4 */}
                <div className="grid grid-cols-3 gap-2 p-2 bg-slate-50 border border-slate-200">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">الدفعة 4 (المبلغ دج)</label>
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
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">التاريخ المقترح (استحقاق 4)</label>
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
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">رقم وصل الدفعة 4</label>
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

              {/* Real-time calculated balances */}
              <div className="p-2.5 bg-slate-100 border border-slate-200 flex justify-between items-center text-xs font-mono">
                <div>
                  <span className="font-sans text-slate-600">المجموع المحصل: </span>
                  <span className="font-bold text-emerald-800">
                    {(
                      (Number(relationalEditStudent.inst1?.amount) || 0) +
                      (Number(relationalEditStudent.inst2?.amount) || 0) +
                      (Number(relationalEditStudent.inst3?.amount) || 0) +
                      (Number(relationalEditStudent.inst4?.amount) || 0)
                    ).toLocaleString()}{' '}
                    دج
                  </span>
                </div>
                <div>
                  <span className="font-sans text-slate-600">الباقي (الديون): </span>
                  <span className="font-bold text-rose-700">
                    {Math.max(
                      0,
                      (Number(relationalEditStudent.agreedFee) || 0) -
                        ((Number(relationalEditStudent.inst1?.amount) || 0) +
                          (Number(relationalEditStudent.inst2?.amount) || 0) +
                          (Number(relationalEditStudent.inst3?.amount) || 0) +
                          (Number(relationalEditStudent.inst4?.amount) || 0))
                    ).toLocaleString()}{' '}
                    دج
                  </span>
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
                  <span>تحديث وتثبيت التعديل العلائقي</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. QUICK PAYMENT POPUP DIALOG */}
      {quickPayStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">
                تسجيل تسديد دفعة مالية: {quickPayStudent.fullName}
              </span>
              <button onClick={() => setQuickPayStudent(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2 bg-blue-50 border border-blue-200 text-blue-950 text-[11px] flex justify-between">
              <span>المتبقي حالياً:</span>
              <span className="font-mono font-bold text-rose-700">
                {(quickPayStudent.remaining || 0).toLocaleString()} دج
              </span>
            </div>

            <form onSubmit={handleSaveQuickPayment} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">اختر الدفعة المراد سدادها *</label>
                <select
                  value={paymentForm.installmentNumber}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, installmentNumber: Number(e.target.value) })
                  }
                  className="w-full h-8 px-2 border border-slate-300 bg-white font-semibold"
                >
                  <option value={2}>الدفعة 2</option>
                  <option value={3}>الدفعة 3</option>
                  <option value={4}>الدفعة 4</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">المبلغ المسدد (دج) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={quickPayStudent.remaining}
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-white font-mono font-bold text-emerald-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">رقم الوصل المالي *</label>
                <input
                  type="text"
                  required
                  value={paymentForm.receipt}
                  onChange={(e) => setPaymentForm({ ...paymentForm, receipt: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-white font-mono font-bold text-blue-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">تاريخ التسديد *</label>
                <input
                  type="date"
                  required
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setQuickPayStudent(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>تأكيد التسديد</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. NEW STUDENT REGISTRATION MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">
                تسجيل طالب جديد في: {currentMeta.shortLabel}
              </span>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewStudent} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">الاسم واللقب *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: حسام الدين بوشامة"
                  value={newStudent.fullName}
                  onChange={(e) => setNewStudent({ ...newStudent, fullName: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المستوى التعليمي *</label>
                  <select
                    value={newStudent.level}
                    onChange={(e) => setNewStudent({ ...newStudent, level: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-semibold"
                  >
                    {currentMeta.levels.map((l, lIdx) => (
                      <option key={lIdx} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المدرب / الأستاذ *</label>
                  <select
                    value={newStudent.coach}
                    onChange={(e) => setNewStudent({ ...newStudent, coach: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-semibold"
                  >
                    {currentMeta.coaches.map((c, cIdx) => (
                      <option key={cIdx} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المستحق المتفق عليه (دج) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newStudent.agreedFee}
                    onChange={(e) => setNewStudent({ ...newStudent, agreedFee: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الدفعة الأولى المدفوعة *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newStudent.inst1}
                    onChange={(e) => setNewStudent({ ...newStudent, inst1: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">رقم وصل الدفعة الأولى *</label>
                <input
                  type="text"
                  required
                  value={newStudent.inst1Receipt}
                  onChange={(e) => setNewStudent({ ...newStudent, inst1Receipt: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono font-bold text-blue-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ملاحظات التسجيل</label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات حول طريقة السداد، خصومات الأخوة..."
                  value={newStudent.notes}
                  onChange={(e) => setNewStudent({ ...newStudent, notes: e.target.value })}
                  className="w-full p-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>تأكيد التسجيل</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. INFO GUIDE MODAL (REPLACING OLD BULKY BANNER) */}
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
                    دليل واجهة: البرامج بنظام الدفعات الـ 4
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    دروس الدعم، اللغات الأجنبية، الروبوتيك والذكاء الاصطناعي، ودعم مناهج اللغات
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
                <p className="font-semibold mb-1">النموذج المالي والتنظيمي المعتمد:</p>
                <p className="text-[11px]">
                  نظام موحد لإدارة وتحصيل مستحقات الدورات الأكاديمية بنظام الدفعات الـ 4 المجدولة:
                  الدفعة الأولى عند التسجيل، الدفعة الثانية (منتصف جانفي)، الدفعة الثالثة (منتصف مارس)،
                  والدفعة الرابعة (منتصف ماي)، مع احتساب فوري لمجموع الدفعات والديون المتبقية.
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="font-bold text-slate-800">ميزات وخصائص الواجهة المحدثة:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                  <li>
                    <strong>دمج الجداول الأربعة في شريط موحد:</strong> تم دمج أزرار القائمة الجانبية
                    في زر واحد، مع توفير أزرار تنقل علوية سريعة بين البرامج الأربعة.
                  </li>
                  <li>
                    <strong>فصل مؤشرات الأداء (KPIs):</strong> تم تخصيص تبويب منفصل لمؤشرات الأداء
                    والتحليلات لترك 100% من مساحة الشاشة للجدول الفعلي.
                  </li>
                  <li>
                    <strong>الربط والتعديل العلائقي بالماوس:</strong> انقر بالزر الأيمن على أي طالب
                    لتعديل الأستاذ المشرف، المستوى التعليمي، أو تسجيل تسديد دفعة جديدة مع الوصل.
                  </li>
                  <li>
                    <strong>التعديل المباشر بالخانات:</strong> انقر نقراً مزدوجاً على أي خلية لتعديل
                    المبالغ وتواريخ الاستحقاق مع تحديث تلقائي وفوري لمجموع الدفعات والباقي.
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

      {/* 10. OFFICIAL RECEIPT VOUCHER MODAL */}
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
