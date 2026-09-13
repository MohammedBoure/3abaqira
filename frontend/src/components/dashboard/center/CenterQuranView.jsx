import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Users,
  Coins,
  CreditCard,
  CheckCircle,
  FileText,
  Plus,
  X,
  Printer,
  Download,
  Search,
  Info,
  Calendar,
  Settings,
  TrendingUp,
  Edit2,
  Trash2,
  Copy,
  Sliders,
  Check,
  Eye,
} from 'lucide-react';
import { ReceiptVoucherModal } from '../common/ReceiptVoucherModal';
import { MOCK_CENTER_QURAN } from '../../../mock/centerMockData';

const SHEIKHS_LIST = ['الشيخ الطاهر مقلاتي', 'الشيخ عبد الحميد قاسمي', 'الشيخ فاروق زواوي'];
const DEFAULT_COHORTS = ['فوج الجمعة والسبت صباحاً', 'فوج الجمعة والسبت مساءً', 'فوج الثلاثاء والأربعاء'];

export function CenterQuranView() {
  const [selectedYear, setSelectedYear] = useState('2025-2026');
  const [activeTab, setActiveTab] = useState('table'); // 'table' | 'config' | 'kpis'
  const [searchTerm, setSearchTerm] = useState('');
  const [sheikhFilter, setSheikhFilter] = useState('ALL');

  // Semester Configuration State (Section 1.3 Requirement)
  const [semesterConfig, setSemesterConfig] = useState({
    semesterName: 'السداسي الثاني (الفترة الربيعية)',
    monthlyFee: 2500,
    months: [
      { id: 'jan', label: 'جانفي' },
      { id: 'feb', label: 'فيفري' },
      { id: 'mar', label: 'مارس' },
      { id: 'apr', label: 'أفريل' },
      { id: 'may', label: 'ماي' },
      { id: 'jun', label: 'جوان' },
    ],
  });

  // New month adder state for config tab
  const [newMonthLabel, setNewMonthLabel] = useState('');

  // Students Dataset
  const [students, setStudents] = useState(() => {
    return MOCK_CENTER_QURAN.map((s) => ({
      ...s,
      academicYear: '2025-2026',
      months: s.months || {
        jan: { paid: 2500, receipt: `REC-QRN-26-${s.seq}1` },
        feb: { paid: 0, receipt: '' },
        mar: { paid: 0, receipt: '' },
        apr: { paid: 0, receipt: '' },
        may: { paid: 0, receipt: '' },
        jun: { paid: 0, receipt: '' },
      },
    }));
  });

  // UI Modals
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  // Inline Editing
  const [inlineEdit, setInlineEdit] = useState(null); // { id, field }
  const [inlineVal, setInlineVal] = useState('');

  // Right-Click Context Menu
  const [contextMenu, setContextMenu] = useState(null);

  // New Student Form
  const [newEntry, setNewEntry] = useState({
    fullName: '',
    teacher: SHEIKHS_LIST[0],
    cohort: DEFAULT_COHORTS[0],
    monthlyFee: 2500,
    firstMonthPaid: 2500,
    receiptNumber: '',
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
        s.fullName.toLowerCase().includes(term) ||
        s.teacher.toLowerCase().includes(term) ||
        s.cohort.toLowerCase().includes(term);

      const matchSheikh = sheikhFilter === 'ALL' || s.teacher === sheikhFilter;
      return matchYear && matchSearch && matchSheikh;
    });
  }, [students, selectedYear, searchTerm, sheikhFilter]);

  // KPIs Calculations
  const totalStudents = students.length;
  const totalCollected = students.reduce((acc, s) => {
    const sumMonths = semesterConfig.months.reduce((mAcc, m) => mAcc + Number(s.months?.[m.id]?.paid || 0), 0);
    return acc + sumMonths;
  }, 0);

  const totalPossible = totalStudents * semesterConfig.monthlyFee * semesterConfig.months.length;
  const collectionRate = totalPossible > 0 ? Math.round((totalCollected / totalPossible) * 100) : 0;

  const vouchersCount = students.reduce((acc, s) => {
    let count = 0;
    semesterConfig.months.forEach((m) => {
      if (s.months?.[m.id]?.receipt) count++;
    });
    return acc + count;
  }, 0);

  const kpiCards = [
    {
      label: 'إجمالي حفظة القرآن المسجلين',
      value: `${totalStudents} طالب`,
      icon: BookOpen,
      subtext: `${semesterConfig.semesterName} (${selectedYear})`,
      change: 'نشط',
      isPositive: true,
    },
    {
      label: 'المحصل الإجمالي لاشتراكات السداسي',
      value: `${totalCollected.toLocaleString()} دج`,
      icon: Coins,
      subtext: `عبر شهور السداسي (${semesterConfig.months.length} شهور)`,
      change: 'مقبوض بالخزينة ✓',
      isPositive: true,
    },
    {
      label: 'نسبة الالتزام والتحصيل',
      value: `${collectionRate}%`,
      icon: CreditCard,
      subtext: `من أصل ${totalPossible.toLocaleString()} دج متوقعة`,
      change: 'تتبع دوري',
      isPositive: true,
    },
    {
      label: 'وصولات السداد المعتمدة',
      value: `${vouchersCount} وصل`,
      icon: CheckCircle,
      subtext: 'إيصالات رسمية مودعة ومسلمة للأولياء',
      change: 'موثقة',
      isPositive: true,
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

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        let updated = { ...s };

        if (field === 'fullName') updated.fullName = inlineVal.trim() || updated.fullName;
        if (field === 'teacher') updated.teacher = inlineVal;
        if (field === 'cohort') updated.cohort = inlineVal;
        if (field === 'monthlyFee') updated.monthlyFee = Math.max(0, Number(inlineVal) || 0);

        if (field.startsWith('month.')) {
          const [, mId, subField] = field.split('.');
          const currentMonthData = updated.months?.[mId] || { paid: 0, receipt: '' };
          let updatedMonthData = { ...currentMonthData };

          if (subField === 'paid') updatedMonthData.paid = Math.max(0, Number(inlineVal) || 0);
          if (subField === 'receipt') updatedMonthData.receipt = inlineVal.trim();

          updated.months = { ...updated.months, [mId]: updatedMonthData };
        }

        // Recalculate total paid
        const total = semesterConfig.months.reduce(
          (acc, m) => acc + Number(updated.months?.[m.id]?.paid || 0),
          0
        );
        updated.totalPaid = total;

        return updated;
      })
    );

    setInlineEdit(null);
  };

  // Right-Click Context Menu
  const handleContextMenu = (e, s) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      student: s,
    });
  };

  // Delete Student
  const handleDeleteStudent = (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطالب من برنامج القرآن؟')) {
      setStudents((prev) => prev.filter((s) => s.id !== id));
    }
  };

  // Quick Teacher Change
  const handleQuickChangeTeacher = (studentId, newTeacher) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, teacher: newTeacher } : s))
    );
    setContextMenu(null);
  };

  // Save Add Student
  const handleSaveAddStudent = (e) => {
    e.preventDefault();
    if (!newEntry.fullName.trim()) return;

    const seq = students.length + 1;
    const firstMId = semesterConfig.months[0]?.id || 'jan';
    const firstAmt = Number(newEntry.firstMonthPaid) || 0;

    const monthsObj = {};
    semesterConfig.months.forEach((m) => {
      if (m.id === firstMId) {
        monthsObj[m.id] = {
          paid: firstAmt,
          receipt: newEntry.receiptNumber || `REC-QRN-26-${seq}1`,
        };
      } else {
        monthsObj[m.id] = { paid: 0, receipt: '' };
      }
    });

    const entry = {
      id: `QRN-${Date.now()}`,
      seq,
      academicYear: selectedYear,
      fullName: newEntry.fullName.trim(),
      teacher: newEntry.teacher,
      cohort: newEntry.cohort,
      monthlyFee: Number(newEntry.monthlyFee) || 2500,
      months: monthsObj,
      totalPaid: firstAmt,
    };

    setStudents([entry, ...students]);
    setIsAddModalOpen(false);
  };

  // Open Voucher Preview
  const handleOpenVoucher = (s, mData, monthName) => {
    setSelectedVoucher({
      receiptNumber: mData.receipt || `REC-QRN-26-${s.seq}`,
      payerName: s.fullName,
      category: `تحفيظ القرآن الكريم (${semesterConfig.semesterName}) - اشتراك شهر ${monthName}`,
      amount: mData.paid || s.monthlyFee,
      paymentMethod: 'نقداً (خزينة المركز)',
      branch: 'المركز الأكاديمي والتعليمي',
      date: new Date().toISOString().split('T')[0],
      notes: `المؤطر: ${s.teacher} - الفوج: ${s.cohort}`,
    });
  };

  // Semester Config Handlers (Add / Remove Months)
  const handleAddCustomMonth = () => {
    if (!newMonthLabel.trim()) return;
    const newId = `m_${Date.now()}`;
    setSemesterConfig((prev) => ({
      ...prev,
      months: [...prev.months, { id: newId, label: newMonthLabel.trim() }],
    }));
    setNewMonthLabel('');
  };

  const handleRemoveMonth = (monthId) => {
    if (semesterConfig.months.length <= 1) {
      alert('يجب الإبقاء على شهر واحد على الأقل في السداسي.');
      return;
    }
    setSemesterConfig((prev) => ({
      ...prev,
      months: prev.months.filter((m) => m.id !== monthId),
    }));
  };

  // Copy TSV
  const handleCopyTSV = (s) => {
    const monthsStr = semesterConfig.months
      .map((m) => `${s.months?.[m.id]?.paid || 0}\t${s.months?.[m.id]?.receipt || ''}`)
      .join('\t');
    const tsv = `${s.seq}\t${s.fullName}\t${s.teacher}\t${s.cohort}\t${s.monthlyFee}\t${monthsStr}\t${s.totalPaid}`;
    navigator.clipboard.writeText(tsv);
    alert('تم نسخ سطر بيانات الطالب واشتراكاته (TSV) إلى الحافظة بنجاح');
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['#', 'الاسم واللقب', 'المؤطر', 'الفوج', 'الاشتراك الشهري'];
    semesterConfig.months.forEach((m) => {
      headers.push(`مبلغ ${m.label}`);
      headers.push(`وصل ${m.label}`);
    });
    headers.push('المجموع المحصل');

    const rows = filteredStudents.map((s) => {
      const row = [s.seq, `"${s.fullName}"`, `"${s.teacher}"`, `"${s.cohort}"`, s.monthlyFee];
      semesterConfig.months.forEach((m) => {
        row.push(s.months?.[m.id]?.paid || 0);
        row.push(`"${s.months?.[m.id]?.receipt || ''}"`);
      });
      row.push(s.totalPaid);
      return row;
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `center_quran_${selectedYear}.csv`);
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
            <BookOpen className="w-4 h-4 text-blue-900" />
            برنامج تحفيظ القرآن الكريم ({semesterConfig.semesterName})
          </h1>
          <span className="text-[11px] text-slate-500 hidden md:inline font-sans">
            (Quran Memorization Semester Registry)
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
          {/* Internal Tabs Switcher */}
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
              <span>جدول حفظة القرآن</span>
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`h-6 px-2.5 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                activeTab === 'config'
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings className="w-3 h-3" />
              <span>ضبط السداسي والشهور</span>
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
              placeholder="بحث بالاسم، الشيخ، الفوج..."
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
            title="تسجيل حافظ جديد"
            className="h-7 px-2.5 bg-blue-900 hover:bg-blue-950 text-white font-semibold flex items-center gap-1 text-xs shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>حافظ جديد</span>
          </button>
        </div>
      </div>

      {/* 2. CONFIGURATION TAB (Section 1.3 Requirement) */}
      {activeTab === 'config' && (
        <div className="bg-white border border-slate-200 p-4 shadow-2xs space-y-4 animate-in fade-in text-xs">
          <div className="border-b pb-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-blue-900" />
              ضبط وتعيين السداسي والفصل والشهور المعتمدة
            </h3>
            <p className="text-[11px] text-slate-500">
              يمكنك تخصيص اسم السداسي، تعديل قائمة الشهور (إضافة أو حذف شهور)، وتحديد الاشتراك الشهري القياسي.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3 bg-slate-50 p-3 border border-slate-200">
              <span className="font-bold text-slate-800 block text-xs">إعدادات السداسي الأساسية:</span>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">اسم السداسي أو الفصل:</label>
                <input
                  type="text"
                  value={semesterConfig.semesterName}
                  onChange={(e) => setSemesterConfig({ ...semesterConfig, semesterName: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">قيمة الاشتراك الشهري القياسي (دج):</label>
                <input
                  type="number"
                  min="0"
                  value={semesterConfig.monthlyFee}
                  onChange={(e) =>
                    setSemesterConfig({ ...semesterConfig, monthlyFee: Number(e.target.value) || 0 })
                  }
                  className="w-full h-8 px-2 border border-slate-300 bg-white font-mono font-bold text-emerald-800"
                />
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-3 border border-slate-200">
              <span className="font-bold text-slate-800 block text-xs">
                إدارة شهور السداسي ({semesterConfig.months.length} شهور مفعلة):
              </span>

              <div className="flex flex-wrap gap-1.5">
                {semesterConfig.months.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 rounded-xs text-xs font-semibold"
                  >
                    <span>{m.label}</span>
                    <button
                      onClick={() => handleRemoveMonth(m.id)}
                      title="حذف هذا الشهر"
                      className="text-slate-400 hover:text-rose-600 ms-1 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                <input
                  type="text"
                  placeholder="اسم شهر جديد (مثال: جويلية، أوت)..."
                  value={newMonthLabel}
                  onChange={(e) => setNewMonthLabel(e.target.value)}
                  className="h-8 px-2 border border-slate-300 bg-white text-xs flex-1"
                />
                <button
                  onClick={handleAddCustomMonth}
                  className="h-8 px-3 bg-blue-900 hover:bg-blue-950 text-white font-semibold flex items-center gap-1 text-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة شهر</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. KPIS TAB */}
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
                توزيع الحفظة على المشايخ والمؤطرين:
              </span>
              <div className="space-y-1.5 text-xs">
                {SHEIKHS_LIST.map((sh, sIdx) => {
                  const sCount = students.filter((s) => s.teacher === sh).length;
                  return (
                    <div key={sIdx} className="flex justify-between items-center p-2 bg-slate-50 border">
                      <span className="font-semibold text-slate-800">{sh}</span>
                      <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-xs">
                        {sCount} طلاب
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-3 shadow-2xs space-y-2">
              <span className="font-bold text-slate-800 text-xs block">
                المجموع الشهري لاشتراكات السداسي:
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                {semesterConfig.months.map((m) => {
                  const mSum = students.reduce((acc, s) => acc + Number(s.months?.[m.id]?.paid || 0), 0);
                  return (
                    <div key={m.id} className="p-2 bg-slate-50 border flex justify-between">
                      <span className="font-sans text-slate-700">شهر {m.label}:</span>
                      <span className="font-bold text-emerald-800">{mSum.toLocaleString()} دج</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. MAIN DATA TABLE (MAXIMIZED VERTICAL SPACE) */}
      {activeTab === 'table' && (
        <div className="bg-white border border-slate-200 shadow-2xs overflow-hidden space-y-0">
          <div className="px-3 py-1.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-700">
                سجل حفظة القرآن ({filteredStudents.length} مسجلين) - {semesterConfig.semesterName}
              </span>

              {/* Sheikh Filter */}
              <select
                value={sheikhFilter}
                onChange={(e) => setSheikhFilter(e.target.value)}
                className="h-6 px-1.5 border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:border-blue-900"
              >
                <option value="ALL">كافة المشايخ والمؤطرين</option>
                {SHEIKHS_LIST.map((sh, sIdx) => (
                  <option key={sIdx} value={sh}>
                    {sh}
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

          <div className="overflow-x-auto max-h-[620px]">
            <table className="w-full text-start text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-300 text-slate-700 font-bold select-none text-[11px]">
                <tr>
                  <th className="p-2 text-center border-e border-slate-200 w-10">#</th>
                  <th className="p-2 text-start border-e border-slate-200 min-w-[150px]">اسم الطالب الرباعي</th>
                  <th className="p-2 text-start border-e border-slate-200 min-w-[130px]">المؤطر / الشيخ</th>
                  <th className="p-2 text-start border-e border-slate-200 min-w-[150px]">الفوج والتوقيت</th>
                  <th className="p-2 text-end border-e border-slate-200 min-w-[100px] bg-slate-50">
                    الاشتراك الشهري
                  </th>

                  {/* Dynamic Months Columns based on configured semester */}
                  {semesterConfig.months.map((m) => (
                    <React.Fragment key={m.id}>
                      <th className="p-2 text-end border-e border-slate-200 min-w-[85px] bg-blue-50/20">
                        {m.label}
                      </th>
                      <th className="p-2 text-center border-e border-slate-200 min-w-[90px]">
                        وصل {m.label}
                      </th>
                    </React.Fragment>
                  ))}

                  <th className="p-2 text-end border-e border-slate-200 min-w-[110px] text-emerald-900 bg-emerald-50/40">
                    المجموع المحصل
                  </th>
                  <th className="p-2 text-center min-w-[80px] print:hidden">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 text-[11px]">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5 + semesterConfig.months.length * 2 + 2} className="p-8 text-center text-slate-400">
                      لا يوجد حفظة مطابقين لمعايير البحث
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s, idx) => {
                    const isEditingName = inlineEdit?.id === s.id && inlineEdit?.field === 'fullName';
                    const isEditingTeacher = inlineEdit?.id === s.id && inlineEdit?.field === 'teacher';
                    const isEditingCohort = inlineEdit?.id === s.id && inlineEdit?.field === 'cohort';
                    const isEditingFee = inlineEdit?.id === s.id && inlineEdit?.field === 'monthlyFee';

                    return (
                      <tr
                        key={s.id}
                        onContextMenu={(e) => handleContextMenu(e, s)}
                        className="hover:bg-blue-50/40 transition-colors h-8"
                      >
                        {/* # */}
                        <td className="p-1 text-center border-e border-slate-200 font-mono text-slate-400 font-bold">
                          {idx + 1}
                        </td>

                        {/* Full Name */}
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
                              className="w-full h-6 px-1 text-xs border border-blue-600 bg-white font-bold"
                            />
                          ) : (
                            <span>{s.fullName}</span>
                          )}
                        </td>

                        {/* Teacher */}
                        <td
                          onDoubleClick={() => startInlineEdit(s.id, 'teacher', s.teacher)}
                          className="p-1 border-e border-slate-200 text-slate-800 font-semibold cursor-pointer"
                        >
                          {isEditingTeacher ? (
                            <select
                              autoFocus
                              value={inlineVal}
                              onChange={(e) => setInlineVal(e.target.value)}
                              onBlur={commitInlineEdit}
                              className="w-full h-6 px-1 text-xs border border-blue-600 bg-white font-semibold"
                            >
                              {SHEIKHS_LIST.map((sh, sIdx) => (
                                <option key={sIdx} value={sh}>
                                  {sh}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span>{s.teacher}</span>
                          )}
                        </td>

                        {/* Cohort */}
                        <td
                          onDoubleClick={() => startInlineEdit(s.id, 'cohort', s.cohort)}
                          className="p-1 border-e border-slate-200 text-slate-700 cursor-pointer"
                        >
                          {isEditingCohort ? (
                            <input
                              type="text"
                              autoFocus
                              value={inlineVal}
                              onChange={(e) => setInlineVal(e.target.value)}
                              onBlur={commitInlineEdit}
                              className="w-full h-6 px-1 text-xs border border-blue-600 bg-white"
                            />
                          ) : (
                            <span>{s.cohort}</span>
                          )}
                        </td>

                        {/* Monthly Fee */}
                        <td
                          onDoubleClick={() => startInlineEdit(s.id, 'monthlyFee', s.monthlyFee)}
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
                            <span>{Number(s.monthlyFee || 0).toLocaleString()} دج</span>
                          )}
                        </td>

                        {/* Dynamic Month Cells */}
                        {semesterConfig.months.map((m) => {
                          const mData = s.months?.[m.id] || { paid: 0, receipt: '' };
                          const isEditingMonthPaid = inlineEdit?.id === s.id && inlineEdit?.field === `month.${m.id}.paid`;
                          const isEditingMonthReceipt = inlineEdit?.id === s.id && inlineEdit?.field === `month.${m.id}.receipt`;

                          return (
                            <React.Fragment key={m.id}>
                              {/* Paid */}
                              <td
                                onDoubleClick={() => startInlineEdit(s.id, `month.${m.id}.paid`, mData.paid)}
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

                              {/* Receipt */}
                              <td
                                onDoubleClick={() => startInlineEdit(s.id, `month.${m.id}.receipt`, mData.receipt)}
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
                                    onClick={() => handleOpenVoucher(s, mData, m.label)}
                                    title="معاينة الوصل"
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

                        {/* Total Paid */}
                        <td className="p-1 text-end border-e border-slate-200 font-mono font-bold text-emerald-900 bg-emerald-50/20">
                          {Number(s.totalPaid || 0).toLocaleString()} دج
                        </td>

                        {/* Actions */}
                        <td className="p-1 text-center print:hidden">
                          <div className="flex items-center justify-center gap-1">
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

              {/* Table Footer */}
              <tfoot className="sticky bottom-0 bg-slate-200 font-bold border-t-2 border-slate-300 font-mono text-[11px]">
                <tr>
                  <td colSpan={5} className="p-2 px-3 text-start font-sans text-slate-900 border-e border-slate-300">
                    المجموع الكلي ({filteredStudents.length} طلاب مسجلين)
                  </td>

                  {/* Monthly sums */}
                  {semesterConfig.months.map((m) => {
                    const mTotal = filteredStudents.reduce(
                      (acc, s) => acc + Number(s.months?.[m.id]?.paid || 0),
                      0
                    );
                    return (
                      <React.Fragment key={m.id}>
                        <td className="p-2 text-end border-e border-slate-300 text-emerald-900">
                          {mTotal.toLocaleString()} دج
                        </td>
                        <td className="p-2 text-center border-e border-slate-300 text-slate-400 font-sans text-[10px]">-</td>
                      </React.Fragment>
                    );
                  })}

                  <td className="p-2 text-end border-e border-slate-300 text-emerald-950 font-bold text-xs bg-emerald-100/50">
                    {filteredStudents
                      .reduce((acc, s) => acc + Number(s.totalPaid || 0), 0)
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

      {/* 5. RIGHT-CLICK CONTEXT MENU */}
      {contextMenu && (
        <div
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 bg-white border border-slate-300 shadow-xl py-1 text-xs w-60 divide-y divide-slate-100 animate-in fade-in zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1 font-bold text-slate-800 bg-slate-50 text-[11px] flex items-center justify-between">
            <span>{contextMenu.student.fullName}</span>
            <span className="text-emerald-800 font-mono font-bold">
              {Number(contextMenu.student.totalPaid || 0).toLocaleString()} دج
            </span>
          </div>

          {/* Quick Sheikh Change */}
          <div className="p-1">
            <div className="text-[10px] text-slate-400 px-2 py-0.5 font-bold">إسناد الشيخ / المؤطر:</div>
            <div className="space-y-0.5">
              {SHEIKHS_LIST.map((sh, sIdx) => (
                <button
                  key={sIdx}
                  onClick={() => handleQuickChangeTeacher(contextMenu.student.id, sh)}
                  className={`w-full text-start px-2 py-1 text-[11px] rounded-xs truncate hover:bg-blue-50 ${
                    contextMenu.student.teacher === sh ? 'text-blue-950 font-bold bg-blue-50' : 'text-slate-700'
                  }`}
                >
                  • {sh}
                </button>
              ))}
            </div>
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                startInlineEdit(contextMenu.student.id, 'fullName', contextMenu.student.fullName);
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

      {/* 6. ADD STUDENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">تسجيل حافظ قرآن جديد</span>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAddStudent} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">الاسم واللقب الرباعي *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: عبد الرحمن بن علي قادري"
                  value={newEntry.fullName}
                  onChange={(e) => setNewEntry({ ...newEntry, fullName: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الشيخ المؤطر *</label>
                  <select
                    value={newEntry.teacher}
                    onChange={(e) => setNewEntry({ ...newEntry, teacher: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white font-semibold"
                  >
                    {SHEIKHS_LIST.map((sh, sIdx) => (
                      <option key={sIdx} value={sh}>
                        {sh}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الفوج والتوقيت *</label>
                  <select
                    value={newEntry.cohort}
                    onChange={(e) => setNewEntry({ ...newEntry, cohort: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white font-semibold"
                  >
                    {DEFAULT_COHORTS.map((c, cIdx) => (
                      <option key={cIdx} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الاشتراك الشهري (دج) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newEntry.monthlyFee}
                    onChange={(e) => setNewEntry({ ...newEntry, monthlyFee: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">سداد الشهر الأول *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newEntry.firstMonthPaid}
                    onChange={(e) => setNewEntry({ ...newEntry, firstMonthPaid: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white font-mono font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">رقم وصل الشهر الأول</label>
                <input
                  type="text"
                  placeholder="مثال: REC-QRN-26-01"
                  value={newEntry.receiptNumber}
                  onChange={(e) => setNewEntry({ ...newEntry, receiptNumber: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white font-mono font-bold text-blue-900"
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
                    دليل واجهة: برنامج تحفيظ القرآن الكريم (1.3)
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    إدارة حلقات التحفيظ، الفصول السداسية، وتتبع الاشتراكات الشهرية
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
                  برنامج تحفيظ القرآن الكريم السداسي يعمل بنظام الاشتراكات الشهرية (2,500 دج شهرياً)
                  موزعة على أفواج عطلات نهاية الأسبوع (الجمعة والسبت)، مع إمكانية تعديل الشهور وتخصيص
                  السداسي بالكامل.
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="font-bold text-slate-800">ميزات الواجهة المحدثة:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                  <li>
                    <strong>تبويب ضبط السداسي والشهور:</strong> إمكانية ضبط اسم السداسي وإضافة أو حذف
                    شهور ديناميكياً لتلائم أي فترة زمنية.
                  </li>
                  <li>
                    <strong>فصل مؤشرات الأداء (KPIs):</strong> تم عزل المؤشرات في تبويب مستقل لتوفير
                    أكبر مساحة ممكنة لجدول البيانات الفعلي مع دعم التمرير الرأسي السلس.
                  </li>
                  <li>
                    <strong>التحكم بالزر الأيمن:</strong> قائمة سريعة لتغيير الشيخ المؤطر، تعديل
                    البيانات، نسخ البيانات كـ TSV، أو حذف السجل.
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

      {/* 8. VOUCHER PREVIEW MODAL */}
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
