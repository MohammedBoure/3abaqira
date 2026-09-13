import React, { useState, useMemo, useEffect } from 'react';
import {
  Coins,
  Calculator,
  Users,
  Award,
  BookOpen,
  Languages,
  CheckCircle,
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
  TrendingUp,
  Settings,
} from 'lucide-react';

const PARTS_LIST = Array.from({ length: 13 }, (_, i) => ({
  id: `part_${i + 1}`,
  number: i + 1,
  label: `الجزء ${i + 1}`,
}));

const INITIAL_TRAINERS_DATA = [
  {
    id: 'tr-1',
    trainerName: 'يوسف بن عيسى',
    cohorts: 'فوج السوربان P1 + P2 (مبتدئ)',
    studentCount: 16,
    rateType: 'per_student_session', // 'per_student_session' | 'fixed_per_session'
    rateAmount: 400, // 400 DZD per student per part session
    academicYear: '2025-2026',
    specialty: 'سوربان',
    notes: 'حصة السبت الصباحية',
    completedParts: {
      part_1: true,
      part_2: true,
      part_3: true,
      part_4: true,
      part_5: true,
      part_6: true,
      part_7: false,
      part_8: false,
      part_9: false,
      part_10: false,
      part_11: false,
      part_12: false,
      part_13: false,
    },
  },
  {
    id: 'tr-2',
    trainerName: 'سمية بلعابد',
    cohorts: 'فوج السوربان S1 (متقدم)',
    studentCount: 14,
    rateType: 'per_student_session',
    rateAmount: 450,
    academicYear: '2025-2026',
    specialty: 'سوربان',
    notes: 'إعداد للبطولة الولائية',
    completedParts: {
      part_1: true,
      part_2: true,
      part_3: true,
      part_4: true,
      part_5: true,
      part_6: false,
      part_7: false,
      part_8: false,
      part_9: false,
      part_10: false,
      part_11: false,
      part_12: false,
      part_13: false,
    },
  },
  {
    id: 'tr-3',
    trainerName: 'الشيخ بوعلام أرزقي',
    cohorts: 'حلقات تحفيظ وتجويد القرآن',
    studentCount: 20,
    rateType: 'fixed_per_session',
    rateAmount: 3000, // 3000 DZD per session part
    academicYear: '2025-2026',
    specialty: 'قرآن',
    notes: 'حصص الجمعة والسبت',
    completedParts: {
      part_1: true,
      part_2: true,
      part_3: true,
      part_4: true,
      part_5: true,
      part_6: true,
      part_7: true,
      part_8: false,
      part_9: false,
      part_10: false,
      part_11: false,
      part_12: false,
      part_13: false,
    },
  },
  {
    id: 'tr-4',
    trainerName: 'أستاذة نادية قاسي',
    cohorts: 'الإنجليزية للأطفال - المستوى A2',
    studentCount: 18,
    rateType: 'fixed_per_session',
    rateAmount: 2500,
    academicYear: '2025-2026',
    specialty: 'لغات',
    notes: 'منهاج تفاعلي',
    completedParts: {
      part_1: true,
      part_2: true,
      part_3: true,
      part_4: true,
      part_5: false,
      part_6: false,
      part_7: false,
      part_8: false,
      part_9: false,
      part_10: false,
      part_11: false,
      part_12: false,
      part_13: false,
    },
  },
  {
    id: 'tr-5',
    trainerName: 'كريم طاهري',
    cohorts: 'نادي الروبوتيك والـ STEM',
    studentCount: 12,
    rateType: 'fixed_per_session',
    rateAmount: 3500,
    academicYear: '2025-2026',
    specialty: 'STEM',
    notes: 'معمل الروبوتات والذكاء الاصطناعي',
    completedParts: {
      part_1: true,
      part_2: true,
      part_3: true,
      part_4: false,
      part_5: false,
      part_6: false,
      part_7: false,
      part_8: false,
      part_9: false,
      part_10: false,
      part_11: false,
      part_12: false,
      part_13: false,
    },
  },
];

export function CenterTrainerPayrollView() {
  const [selectedYear, setSelectedYear] = useState('2025-2026');
  const [activeTab, setActiveTab] = useState('table'); // 'table' | 'simulator' | 'kpis'
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('ALL');

  const [trainers, setTrainers] = useState(INITIAL_TRAINERS_DATA);

  // Live Calculator Simulator State
  const [simSpecialty, setSimSpecialty] = useState('soroban');
  const [simStudents, setSimStudents] = useState(15);
  const [simRatePerKid, setSimRatePerKid] = useState(400);
  const [simSessionsCount, setSimSessionsCount] = useState(10);
  const [simFixedRate, setSimFixedRate] = useState(3000);

  // UI Modals
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);

  // Right-Click Context Menu
  const [contextMenu, setContextMenu] = useState(null);

  // Close context menu on external click
  useEffect(() => {
    const handleWindowClick = () => setContextMenu(null);
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  // Compute calculated values for each trainer
  const computedTrainers = useMemo(() => {
    return trainers.map((t) => {
      let partsCount = 0;
      PARTS_LIST.forEach((p) => {
        if (t.completedParts?.[p.id]) partsCount++;
      });

      let partSessionValue = 0;
      if (t.rateType === 'per_student_session') {
        partSessionValue = (t.studentCount || 0) * (t.rateAmount || 0);
      } else {
        partSessionValue = t.rateAmount || 0;
      }

      const totalDue = partsCount * partSessionValue;

      return {
        ...t,
        partsCount,
        partSessionValue,
        totalDue,
      };
    });
  }, [trainers]);

  // Filtered trainers
  const filteredTrainers = useMemo(() => {
    return computedTrainers.filter((t) => {
      const matchYear = !t.academicYear || t.academicYear === selectedYear;
      const matchSpec = specialtyFilter === 'ALL' || t.specialty === specialtyFilter;
      const matchSearch =
        t.trainerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.cohorts.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.notes.toLowerCase().includes(searchTerm.toLowerCase());
      return matchYear && matchSpec && matchSearch;
    });
  }, [computedTrainers, selectedYear, specialtyFilter, searchTerm]);

  // KPIs
  const totalTrainersCount = filteredTrainers.length;
  const totalCompletedPartsAll = filteredTrainers.reduce((acc, t) => acc + t.partsCount, 0);
  const grandTotalDueAll = filteredTrainers.reduce((acc, t) => acc + t.totalDue, 0);
  const totalStudentsEnrolled = filteredTrainers.reduce((acc, t) => acc + (t.studentCount || 0), 0);

  // Toggle single part completion
  const togglePartCompletion = (trainerId, partId) => {
    setTrainers((prev) =>
      prev.map((t) => {
        if (t.id !== trainerId) return t;
        const currentVal = Boolean(t.completedParts?.[partId]);
        return {
          ...t,
          completedParts: {
            ...t.completedParts,
            [partId]: !currentVal,
          },
        };
      })
    );
  };

  // Open Context Menu
  const handleContextMenu = (e, trainer) => {
    e.preventDefault();
    e.stopPropagation();
    const x = Math.min(e.clientX, window.innerWidth - 220);
    const y = Math.min(e.clientY, window.innerHeight - 260);
    setContextMenu({ x, y, trainer });
  };

  // Delete Trainer
  const handleDeleteTrainer = (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المدرب وسجل أجزاء الحصص؟')) {
      setTrainers((prev) => prev.filter((t) => t.id !== id));
      setContextMenu(null);
    }
  };

  // Add New Trainer Form
  const [newTrainerForm, setNewTrainerForm] = useState({
    trainerName: '',
    cohorts: '',
    studentCount: 15,
    rateType: 'per_student_session',
    rateAmount: 400,
    specialty: 'سوربان',
    notes: 'فوج تدريبي جديد',
  });

  const handleAddNewTrainer = (e) => {
    e.preventDefault();
    if (!newTrainerForm.trainerName.trim()) return;

    const partsObj = {};
    PARTS_LIST.forEach((p) => {
      partsObj[p.id] = false;
    });

    const newEntry = {
      id: `tr-${Date.now()}`,
      academicYear: selectedYear,
      trainerName: newTrainerForm.trainerName.trim(),
      cohorts: newTrainerForm.cohorts.trim() || 'فوج جديد',
      studentCount: Number(newTrainerForm.studentCount) || 15,
      rateType: newTrainerForm.rateType,
      rateAmount: Number(newTrainerForm.rateAmount) || 400,
      specialty: newTrainerForm.specialty,
      notes: newTrainerForm.notes || 'تسجيل جديد',
      completedParts: partsObj,
    };

    setTrainers([...trainers, newEntry]);
    setIsAddModalOpen(false);
  };

  // Save Edit Trainer
  const handleSaveEditTrainer = (e) => {
    e.preventDefault();
    if (editingTrainer) {
      setTrainers((prev) =>
        prev.map((t) => (t.id === editingTrainer.id ? editingTrainer : t))
      );
      setEditingTrainer(null);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'المدربين',
      'الأفواج',
      'عدد الأطفال',
      'الأجرة التعاقدية',
      ...PARTS_LIST.map((p) => p.label),
      'الحصص المنجزة',
      'المجموع المستحق (دج)',
      'ملاحظات',
    ];

    const rows = filteredTrainers.map((t) => [
      `"${t.trainerName}"`,
      `"${t.cohorts}"`,
      t.studentCount,
      t.rateType === 'per_student_session'
        ? `${t.rateAmount} دج/طفل`
        : `${t.rateAmount} دج/حصة`,
      ...PARTS_LIST.map((p) => (t.completedParts?.[p.id] ? 1 : 0)),
      t.partsCount,
      t.totalDue,
      `"${t.notes || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `trainers_payroll_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Simulator Result
  const simulatorResult = useMemo(() => {
    if (simSpecialty === 'soroban') {
      const perSession = Number(simStudents) * Number(simRatePerKid);
      return {
        perSession,
        total: perSession * Number(simSessionsCount),
      };
    } else {
      const perSession = Number(simFixedRate);
      return {
        perSession,
        total: perSession * Number(simSessionsCount),
      };
    }
  }, [simSpecialty, simStudents, simRatePerKid, simSessionsCount, simFixedRate]);

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 text-xs overflow-hidden">
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-white border-b border-slate-200 shrink-0">
        {/* Title & Badge */}
        <div className="flex items-center gap-2">
          <div className="p-1 bg-blue-50 text-blue-900 border border-blue-200">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 text-sm">
                احتساب أجور المدربين (بالحصة وحجم الفوج)
              </span>
              <span className="text-[10px] text-slate-400">|</span>
              <span className="text-[10px] text-slate-500 font-mono">
                Per-Session Dynamic Wages
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
              aria-label="تحديد السنة الدراسية لأجور المدربين"
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
              جدول الحصص والأجزاء الـ 13 ({filteredTrainers.length})
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-1 text-xs font-bold flex items-center gap-1 transition-colors ${
                activeTab === 'simulator'
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calculator className="w-3 h-3" />
              حاسبة ومعايير الحصة
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
              مؤشرات الأداء
            </button>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1 border-s border-slate-200 ps-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              title="إضافة مدرب / فوج جديد"
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
              title="طباعة جدول الأجور"
              className="p-1 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsInfoModalOpen(true)}
              title="معلومات ودليل استخدام أجور المدربين"
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
                placeholder="بحث بالمدرب، الفوج، أو الملاحظة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-7 pr-7 pl-2 bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" />
              <select
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
                aria-label="تصفية حسب التخصص التدريبي"
                className="h-7 px-2 bg-slate-50 border border-slate-200 text-[11px] text-slate-700 focus:outline-hidden"
              >
                <option value="ALL">جميع التخصصات</option>
                <option value="سوربان">السوربان</option>
                <option value="قرآن">القرآن الكريم</option>
                <option value="لغات">اللغات</option>
                <option value="STEM">الروبوتيك وSTEM</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
            <span>
              إجمالي الحصص المنجزة:{' '}
              <strong className="text-blue-900">{totalCompletedPartsAll} حصة</strong>
            </span>
            <span>
              الكتلة المستحقة:{' '}
              <strong className="text-emerald-700">
                {grandTotalDueAll.toLocaleString()} دج
              </strong>
            </span>
          </div>
        </div>
      )}

      {/* 3. Main Workspace Area */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'table' ? (
          <div className="min-w-max inline-block align-middle pb-8">
            <table className="text-start text-xs border-collapse select-none border border-slate-300">
              <thead className="bg-slate-800 text-white sticky top-0 z-20 shadow-xs text-[11px]">
                <tr>
                  <th className="p-1.5 text-start border border-slate-700 min-w-[140px] sticky left-0 z-30 bg-slate-900">
                    المدربين
                  </th>
                  <th className="p-1.5 text-start border border-slate-700 min-w-[170px]">الأفواج</th>
                  <th className="p-1.5 text-center border border-slate-700 min-w-[75px] bg-slate-800">
                    عدد الأطفال
                  </th>
                  <th className="p-1.5 text-end border border-slate-700 min-w-[95px] bg-slate-800">
                    الأجرة
                  </th>

                  {/* 13 Parts Headers */}
                  {PARTS_LIST.map((p) => (
                    <th
                      key={p.id}
                      className="p-1 text-center border border-slate-700 min-w-[42px] text-[10px] bg-slate-800/90"
                      title={p.label}
                    >
                      {p.number}
                    </th>
                  ))}

                  <th className="p-1.5 text-center border border-slate-700 min-w-[80px] bg-blue-950 text-blue-100">
                    المنجز
                  </th>
                  <th className="p-1.5 text-end border border-slate-700 min-w-[110px] bg-emerald-950 text-emerald-100 font-bold">
                    المجموع المستحق
                  </th>
                  <th className="p-1.5 text-start border border-slate-700 min-w-[130px]">
                    ملاحظات
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {filteredTrainers.map((t) => (
                  <tr
                    key={t.id}
                    onContextMenu={(e) => handleContextMenu(e, t)}
                    className="h-8 hover:bg-blue-50/40 transition-colors"
                  >
                    {/* Trainer Name */}
                    <td className="p-1.5 border-e border-slate-200 font-sans font-bold text-slate-900 sticky left-0 bg-white">
                      <div>{t.trainerName}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{t.specialty}</div>
                    </td>

                    {/* Cohort */}
                    <td className="p-1.5 border-e border-slate-200 font-sans text-slate-700">
                      {t.cohorts}
                    </td>

                    {/* Student Count */}
                    <td className="p-1 text-center border-e border-slate-200 font-bold text-slate-800 bg-slate-50">
                      {t.studentCount}
                    </td>

                    {/* Wage Rate */}
                    <td className="p-1 text-end border-e border-slate-200 font-bold text-slate-900 bg-slate-50/50">
                      {t.rateType === 'per_student_session' ? (
                        <span title="معامل لكل طالب بالحصة">
                          {t.rateAmount} دج<span className="text-[9px] text-slate-400 block font-normal">/طالب</span>
                        </span>
                      ) : (
                        <span title="مبلغ مقطوع للحصة الواحدة">
                          {t.rateAmount.toLocaleString()} دج<span className="text-[9px] text-slate-400 block font-normal">/حصة</span>
                        </span>
                      )}
                    </td>

                    {/* 13 Parts Cells */}
                    {PARTS_LIST.map((p) => {
                      const isDone = Boolean(t.completedParts?.[p.id]);
                      return (
                        <td
                          key={p.id}
                          onClick={() => togglePartCompletion(t.id, p.id)}
                          className={`p-1 text-center border-e border-slate-200 cursor-pointer text-[10px] transition-all select-none ${
                            isDone
                              ? 'bg-emerald-100 text-emerald-900 font-bold hover:bg-emerald-200'
                              : 'text-slate-300 hover:bg-slate-100'
                          }`}
                          title={`انقر لتسجيل / إلغاء ${p.label}`}
                        >
                          {isDone ? '✓' : '-'}
                        </td>
                      );
                    })}

                    {/* Completed Parts Count */}
                    <td className="p-1 text-center border-e border-slate-200 font-bold text-blue-900 bg-blue-50/30">
                      {t.partsCount} / 13
                    </td>

                    {/* Total Due */}
                    <td className="p-1 text-end border-e border-slate-200 font-bold text-emerald-800 bg-emerald-50/30">
                      {t.totalDue.toLocaleString()} دج
                    </td>

                    {/* Notes */}
                    <td className="p-1.5 font-sans text-slate-600 truncate max-w-[130px]">
                      {t.notes}
                    </td>
                  </tr>
                ))}

                {/* Subtotal Row */}
                <tr className="bg-slate-900 text-white font-bold text-xs sticky bottom-0 z-20 shadow-md">
                  <td className="p-2 font-sans sticky left-0 bg-slate-950 text-amber-300">
                    المجموع الكلي لأجور الحصص
                  </td>
                  <td className="p-2 font-sans text-slate-300">
                    {filteredTrainers.length} أفواج تدريبية
                  </td>
                  <td className="p-2 text-center text-amber-300 font-mono">
                    {totalStudentsEnrolled}
                  </td>
                  <td className="p-2 text-end text-slate-400">-</td>
                  <td colSpan={13} className="p-2 text-center text-slate-300 text-[10px] font-sans">
                    إجمالي الحصص المكتملة عبر كافة الأفواج: {totalCompletedPartsAll} حصة
                  </td>
                  <td className="p-2 text-center text-blue-300 font-mono font-bold">
                    {totalCompletedPartsAll}
                  </td>
                  <td className="p-2 text-end text-emerald-300 font-mono font-bold">
                    {grandTotalDueAll.toLocaleString()} دج
                  </td>
                  <td className="p-2 text-slate-400">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : activeTab === 'simulator' ? (
          /* Simulator Tab */
          <div className="p-4 space-y-4 max-w-3xl mx-auto">
            <div className="bg-white border border-slate-200 p-4 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-blue-900" />
                  <span className="font-bold text-slate-900 text-sm">
                    محاكي احتساب أجرة المدرب بالحصة
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">Live Dynamic Simulator</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">نوع التدريب والمعادلة</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSimSpecialty('soroban')}
                      className={`p-2 text-center border font-bold text-xs transition-colors ${
                        simSpecialty === 'soroban'
                          ? 'bg-blue-900 text-white border-blue-900'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      السوربان (عدد الطلاب × المعامل)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimSpecialty('fixed')}
                      className={`p-2 text-center border font-bold text-xs transition-colors ${
                        simSpecialty === 'fixed'
                          ? 'bg-blue-900 text-white border-blue-900'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      القرآن / اللغات (مبلغ مقطوع للحصة)
                    </button>
                  </div>
                </div>

                {simSpecialty === 'soroban' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 text-xs mb-1">عدد الطلاب بالفوج</label>
                      <input
                        type="number"
                        value={simStudents}
                        onChange={(e) => setSimStudents(e.target.value)}
                        className="w-full h-8 px-2 border border-slate-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 text-xs mb-1">
                        معامل الطالب للحصة (دج)
                      </label>
                      <input
                        type="number"
                        value={simRatePerKid}
                        onChange={(e) => setSimRatePerKid(e.target.value)}
                        className="w-full h-8 px-2 border border-slate-300 font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-slate-600 text-xs mb-1">
                      سعر الحصة الواحدة المقطوع (دج)
                    </label>
                    <input
                      type="number"
                      value={simFixedRate}
                      onChange={(e) => setSimFixedRate(e.target.value)}
                      className="w-full h-8 px-2 border border-slate-300 font-mono"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-slate-600 text-xs mb-1">
                    عدد الحصص المنجزة (من 1 إلى 13)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={13}
                    value={simSessionsCount}
                    onChange={(e) => setSimSessionsCount(e.target.value)}
                    className="w-full h-8 px-2 border border-slate-300 font-mono"
                  />
                </div>

                {/* Calculation Result Box */}
                <div className="p-3 bg-emerald-50 border border-emerald-200 space-y-1.5">
                  <div className="flex justify-between text-xs text-emerald-950">
                    <span>قيمة الحصة الواحدة:</span>
                    <strong className="font-mono">{simulatorResult.perSession.toLocaleString()} دج</strong>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-emerald-950 pt-1 border-t border-emerald-200">
                    <span>إجمالي الأجرة المستحقة عن {simSessionsCount} حصة:</span>
                    <span className="font-mono text-base text-emerald-800">
                      {simulatorResult.total.toLocaleString()} دج
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* KPIs Tab */
          <div className="p-4 space-y-4 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3 bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold">إجمالي الأفواج المؤطرة</span>
                  <Users className="w-4 h-4 text-blue-900" />
                </div>
                <div className="text-xl font-bold font-mono text-slate-900">
                  {totalTrainersCount} أفواج
                </div>
                <div className="text-[10px] text-slate-400 mt-1">موسم {selectedYear}</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold">الحصص المنجزة كلياً</span>
                  <CheckCircle className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="text-xl font-bold font-mono text-emerald-700">
                  {totalCompletedPartsAll} حصة
                </div>
                <div className="text-[10px] text-emerald-600 mt-1">مؤكدة الحضور</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold">الكتلة المستحقة الإجمالية</span>
                  <Coins className="w-4 h-4 text-slate-700" />
                </div>
                <div className="text-xl font-bold font-mono text-slate-900">
                  {grandTotalDueAll.toLocaleString()} دج
                </div>
                <div className="text-[10px] text-slate-400 mt-1">مستحقة الصرف للمدربين</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold">الطلاب المستفيدين</span>
                  <Award className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-xl font-bold font-mono text-amber-600">
                  {totalStudentsEnrolled} طالب
                </div>
                <div className="text-[10px] text-amber-700 mt-1">بأفواج التدريب بالحصة</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right-Click Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white border border-slate-300 shadow-xl py-1 text-xs min-w-[200px] animate-in fade-in"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1 bg-slate-100 border-b border-slate-200 font-bold text-[10px] text-slate-700">
            {contextMenu.trainer.trainerName}
          </div>
          <button
            onClick={() => {
              setEditingTrainer(contextMenu.trainer);
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-blue-50 text-slate-800 flex items-center gap-2"
          >
            <Edit2 className="w-3.5 h-3.5 text-blue-800" />
            تعديل الفوج ومعدل الأجرة
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `${contextMenu.trainer.trainerName} - ${contextMenu.trainer.cohorts} - منجز: ${contextMenu.trainer.partsCount} حصة - مستحق: ${contextMenu.trainer.totalDue} دج`
              );
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-blue-50 text-slate-800 flex items-center gap-2"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            نسخ ملخص المستحقات
          </button>
          <div className="border-t border-slate-200 my-1" />
          <button
            onClick={() => handleDeleteTrainer(contextMenu.trainer.id)}
            className="w-full text-start px-3 py-1.5 hover:bg-rose-50 text-rose-700 flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            حذف المدرب
          </button>
        </div>
      )}

      {/* Edit Trainer Modal */}
      {editingTrainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">تعديل بيانات وأجرة المدرب</span>
              <button
                onClick={() => setEditingTrainer(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTrainer} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">اسم المدرب *</label>
                <input
                  type="text"
                  required
                  value={editingTrainer.trainerName}
                  onChange={(e) =>
                    setEditingTrainer({ ...editingTrainer, trainerName: e.target.value })
                  }
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">الأفواج المسندة</label>
                <input
                  type="text"
                  value={editingTrainer.cohorts}
                  onChange={(e) =>
                    setEditingTrainer({ ...editingTrainer, cohorts: e.target.value })
                  }
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">عدد الأطفال</label>
                  <input
                    type="number"
                    value={editingTrainer.studentCount}
                    onChange={(e) =>
                      setEditingTrainer({
                        ...editingTrainer,
                        studentCount: Number(e.target.value),
                      })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">نوع التعاقد</label>
                  <select
                    value={editingTrainer.rateType}
                    onChange={(e) =>
                      setEditingTrainer({ ...editingTrainer, rateType: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50"
                  >
                    <option value="per_student_session">لكل طالب بالحصة</option>
                    <option value="fixed_per_session">مبلغ مقطوع للحصة</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  قيمة الأجرة التعاقدية (دج)
                </label>
                <input
                  type="number"
                  value={editingTrainer.rateAmount}
                  onChange={(e) =>
                    setEditingTrainer({ ...editingTrainer, rateAmount: Number(e.target.value) })
                  }
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ملاحظات</label>
                <input
                  type="text"
                  value={editingTrainer.notes}
                  onChange={(e) =>
                    setEditingTrainer({ ...editingTrainer, notes: e.target.value })
                  }
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingTrainer(null)}
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

      {/* Add Trainer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">
                إضافة مدرب / فوج تدريبي جديد بالحصة
              </span>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewTrainer} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">اسم المدرب *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: يوسف بن عيسى"
                  value={newTrainerForm.trainerName}
                  onChange={(e) =>
                    setNewTrainerForm({ ...newTrainerForm, trainerName: e.target.value })
                  }
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">الأفواج</label>
                <input
                  type="text"
                  placeholder="مثال: سوربان فوج 1 + فوج 2"
                  value={newTrainerForm.cohorts}
                  onChange={(e) =>
                    setNewTrainerForm({ ...newTrainerForm, cohorts: e.target.value })
                  }
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">عدد الأطفال</label>
                  <input
                    type="number"
                    value={newTrainerForm.studentCount}
                    onChange={(e) =>
                      setNewTrainerForm({ ...newTrainerForm, studentCount: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">نوع التعاقد</label>
                  <select
                    value={newTrainerForm.rateType}
                    onChange={(e) =>
                      setNewTrainerForm({ ...newTrainerForm, rateType: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50"
                  >
                    <option value="per_student_session">لكل طالب بالحصة</option>
                    <option value="fixed_per_session">مبلغ مقطوع للحصة</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  قيمة الأجرة التعاقدية (دج)
                </label>
                <input
                  type="number"
                  value={newTrainerForm.rateAmount}
                  onChange={(e) =>
                    setNewTrainerForm({ ...newTrainerForm, rateAmount: e.target.value })
                  }
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 font-mono"
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
                  تأكيد الإضافة
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
                  دليل وإرشادات احتساب أجور المدربين (بالحصة والأجزاء الـ 13)
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
                <strong>الهدف من الواجهة:</strong> نظام احتساب دقيق لأجور المدربين والمؤطرين بالحصة
                أو بعدد الأطفال، مقسمة على 13 جزءاً/حصة للدورة التدريبية.
              </p>
              <ul className="list-disc list-inside space-y-1 bg-slate-50 p-2.5 border border-slate-200">
                <li>
                  <strong>أعمدة الأجزاء الـ 13:</strong> انقر مباشرة على أي جزء لتسجيل إنجاز الحصة
                  (✓)، ليتم احتساب الأجرة الإجمالية تلقائياً.
                </li>
                <li>
                  <strong>أنماط الاحتساب:</strong> السوربان (عدد الطلاب × معامل المستوى بالحصة)،
                  والقرآن واللغات (مبلغ مقطوع للحصة).
                </li>
                <li>
                  <strong>الزر الأيمن للفأرة:</strong> يتيح تعديل المعاملات، نسخ الملخص المالي، أو
                  حذف السجل.
                </li>
                <li>
                  <strong>محاكي الحساب التفاعلي:</strong> تبويب خاص لحساب المستحقات المتوقعة
                  بمرونة.
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
    </div>
  );
}
