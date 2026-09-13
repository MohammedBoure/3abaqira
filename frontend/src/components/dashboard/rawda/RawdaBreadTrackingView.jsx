import React, { useState, useMemo, useEffect } from 'react';
import {
  Utensils,
  ShoppingBag,
  Coins,
  CheckCircle,
  Plus,
  Calendar,
  X,
  Printer,
  Download,
  Search,
  Info,
  Edit2,
  Trash2,
  Copy,
  Check,
  Sparkles,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { RAWDA_MONTHS } from '../../../mock/rawdaMockData';

// Standard operational lunch meals in Algerian Daycare/Rawda
const PRESET_MEALS = [
  'كسكس تقليدي بالخضر والمرق واللحم',
  'سباغيتي بصلصة الطماطم وجبن مبشور',
  'بيري (بطاطا مهروسة) مع مرق الدجاج',
  'عدس بالخضار واللحم البقري',
  'لوبيا بيضاء باللحم والكمون',
  'أرز مفور بالخضر والدجاج المحمر',
  'معكرونة بالخضار وسلطة طازجة',
  'بطاطا كوشة مع كفتة سكالوب',
  'طاجين الزيتون مع كريات الدجاج',
  'شوربة خضار شتوية مع بيض مسلوق',
];

const SCHOOL_DAYS = [
  { day: 'الأحد', defaultMeal: 'عدس بالخضار واللحم البقري', defaultBread: 20 },
  { day: 'الإثنين', defaultMeal: 'سباغيتي بصلصة الطماطم وجبن مبشور', defaultBread: 15 },
  { day: 'الثلاثاء', defaultMeal: 'بيري (بطاطا مهروسة) مع مرق الدجاج', defaultBread: 18 },
  { day: 'الأربعاء', defaultMeal: 'كسكس تقليدي بالخضر والمرق واللحم', defaultBread: 12 },
  { day: 'الخميس', defaultMeal: 'معكرونة بالخضار وسلطة طازجة', defaultBread: 17 },
];

export function RawdaBreadTrackingView() {
  const [selectedYear, setSelectedYear] = useState('2025-2026');
  const [selectedMonth, setSelectedMonth] = useState('feb');
  const [selectedWeek, setSelectedWeek] = useState('1'); // '1', '2', '3', '4', '5', or 'ALL'
  const [searchTerm, setSearchTerm] = useState('');

  // Comprehensive multi-year, multi-month, multi-week bread tracking logs
  const [breadLogs, setBreadLogs] = useState(() => {
    const data = [];
    const years = ['2024-2025', '2025-2026', '2026-2027'];

    years.forEach((yr) => {
      RAWDA_MONTHS.forEach((m) => {
        for (let week = 1; week <= 5; week++) {
          SCHOOL_DAYS.forEach((sd, dIdx) => {
            const count = sd.defaultBread + (week % 2 === 0 ? (dIdx % 2 === 0 ? 2 : -1) : 0);
            const unitPrice = 15;
            data.push({
              id: `brd-${yr}-${m.id}-w${week}-d${dIdx + 1}`,
              academicYear: yr,
              month: m.id,
              week,
              day: sd.day,
              meal: sd.defaultMeal,
              breadCount: count,
              unitPrice,
              totalAmount: count * unitPrice,
              notes: count <= 14 ? 'انخفاض في استهلاك الخبز (وفر)' : 'استهلاك طبيعي منتظم للأفواج',
            });
          });
        }
      });
    });
    return data;
  });

  // UI Modals State
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isMealScheduleModalOpen, setIsMealScheduleModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);

  // Meal Customization State for Helper Modal
  const [mealPlanConfig, setMealPlanConfig] = useState({
    targetScope: 'month', // 'week', 'month', 'year'
    targetWeek: '1',
    sundayMeal: SCHOOL_DAYS[0].defaultMeal,
    mondayMeal: SCHOOL_DAYS[1].defaultMeal,
    tuesdayMeal: SCHOOL_DAYS[2].defaultMeal,
    wednesdayMeal: SCHOOL_DAYS[3].defaultMeal,
    thursdayMeal: SCHOOL_DAYS[4].defaultMeal,
  });

  // Inline Cell Editing State
  const [inlineEdit, setInlineEdit] = useState(null); // { id, field }
  const [inlineVal, setInlineVal] = useState('');

  // Right-Click Context Menu State
  const [contextMenu, setContextMenu] = useState(null); // { x, y, log }

  // New bread entry form state
  const [entryForm, setEntryForm] = useState({
    week: 1,
    day: 'الأحد',
    meal: 'كسكس تقليدي بالخضر والمرق واللحم',
    breadCount: 18,
    unitPrice: 15,
    notes: '',
  });

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = () => setContextMenu(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Filter logs by Year, Month, Week and Search
  const currentLogs = useMemo(() => {
    return breadLogs.filter((l) => {
      const matchYear = l.academicYear === selectedYear;
      const matchMonth = selectedMonth === 'ALL' || l.month === selectedMonth;
      const matchWeek = selectedWeek === 'ALL' || l.week === Number(selectedWeek);
      const matchSearch =
        !searchTerm ||
        l.meal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.day.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.notes && l.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchYear && matchMonth && matchWeek && matchSearch;
    });
  }, [breadLogs, selectedYear, selectedMonth, selectedWeek, searchTerm]);

  // KPIs Calculations
  const totalLoaves = currentLogs.reduce((acc, l) => acc + Number(l.breadCount || 0), 0);
  const totalCost = currentLogs.reduce((acc, l) => acc + Number(l.totalAmount || 0), 0);
  const avgLoavesPerDay = currentLogs.length > 0 ? (totalLoaves / currentLogs.length).toFixed(1) : 0;
  const daysRecorded = currentLogs.length;

  const currentMonthObj = RAWDA_MONTHS.find((m) => m.id === selectedMonth);
  const currentMonthName = currentMonthObj ? currentMonthObj.nameAr : 'كافة الشهور';

  const kpiCards = [
    {
      label: 'إجمالي استهلاك الخبز بالمؤسسة',
      value: `${totalLoaves.toLocaleString()} خبزة`,
      icon: Utensils,
      subtext: `${selectedWeek === 'ALL' ? 'كامل أسابيع الشهر' : `الأسبوع ${selectedWeek}`} (${currentMonthName})`,
      change: 'استهلاك مراقب ✓',
      isPositive: true,
    },
    {
      label: 'التكلفة الإجمالية لفواتير الخبز',
      value: `${totalCost.toLocaleString()} دج`,
      icon: Coins,
      subtext: 'مفوترة بسعر 15 دج للخبزة المعتمدة',
      change: 'ضمن الموازنة',
      isPositive: true,
    },
    {
      label: 'متوسط الاستهلاك اليومي',
      value: `${avgLoavesPerDay} خبزة/يوم`,
      icon: ShoppingBag,
      subtext: `عبر ${daysRecorded} وجبة غداء مسجلة`,
      change: 'معدل صحي متزن',
      isPositive: true,
    },
    {
      label: 'مطابقة برنامج الوجبات المبرمجة',
      value: '100% مطابقة',
      icon: CheckCircle,
      subtext: 'برنامج غذائي خماسي معتمد وصحي',
      change: 'معتمد رسمياً',
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

    setBreadLogs((prev) =>
      prev.map((log) => {
        if (log.id === id) {
          let updatedBreadCount = log.breadCount;
          let updatedUnitPrice = log.unitPrice;
          let updatedMeal = log.meal;
          let updatedNotes = log.notes;

          if (field === 'breadCount') updatedBreadCount = Math.max(0, Number(inlineVal) || 0);
          if (field === 'unitPrice') updatedUnitPrice = Math.max(0, Number(inlineVal) || 0);
          if (field === 'meal') updatedMeal = inlineVal;
          if (field === 'notes') updatedNotes = inlineVal;

          return {
            ...log,
            breadCount: updatedBreadCount,
            unitPrice: updatedUnitPrice,
            totalAmount: updatedBreadCount * updatedUnitPrice,
            meal: updatedMeal,
            notes: updatedNotes,
          };
        }
        return log;
      })
    );
    setInlineEdit(null);
  };

  // Open Edit Dialog
  const handleOpenEdit = (log) => {
    setEditingLog(log);
    setEntryForm({
      week: log.week,
      day: log.day,
      meal: log.meal,
      breadCount: log.breadCount,
      unitPrice: log.unitPrice,
      notes: log.notes || '',
    });
    setIsAddModalOpen(true);
  };

  // Open Add Dialog
  const handleOpenAdd = () => {
    setEditingLog(null);
    setEntryForm({
      week: selectedWeek === 'ALL' ? 1 : Number(selectedWeek),
      day: 'الأحد',
      meal: PRESET_MEALS[0],
      breadCount: 18,
      unitPrice: 15,
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  // Save Bread Entry (Add or Edit)
  const handleSaveEntry = (e) => {
    e.preventDefault();
    const count = Number(entryForm.breadCount) || 0;
    const price = Number(entryForm.unitPrice) || 15;

    if (editingLog) {
      setBreadLogs((prev) =>
        prev.map((l) =>
          l.id === editingLog.id
            ? {
                ...l,
                week: Number(entryForm.week),
                day: entryForm.day,
                meal: entryForm.meal,
                breadCount: count,
                unitPrice: price,
                totalAmount: count * price,
                notes: entryForm.notes,
              }
            : l
        )
      );
    } else {
      const newEntry = {
        id: `brd-${selectedYear}-${Date.now()}`,
        academicYear: selectedYear,
        month: selectedMonth === 'ALL' ? 'feb' : selectedMonth,
        week: Number(entryForm.week),
        day: entryForm.day,
        meal: entryForm.meal,
        breadCount: count,
        unitPrice: price,
        totalAmount: count * price,
        notes: entryForm.notes || 'استهلاك مسجل',
      };
      setBreadLogs((prev) => [...prev, newEntry]);
    }
    setIsAddModalOpen(false);
  };

  // Delete Log
  const handleDeleteLog = (id) => {
    if (window.confirm('هل أنت متأكد من حذف سجل استهلاك الخبز هذا؟')) {
      setBreadLogs((prev) => prev.filter((l) => l.id !== id));
    }
  };

  // Right-Click Context Menu Trigger
  const handleContextMenu = (e, log) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      log,
    });
  };

  // Apply Planned Meals Schedule Helper Tool
  const handleApplyMealSchedule = () => {
    const dayMap = {
      'الأحد': mealPlanConfig.sundayMeal,
      'الإثنين': mealPlanConfig.mondayMeal,
      'الثلاثاء': mealPlanConfig.tuesdayMeal,
      'الأربعاء': mealPlanConfig.wednesdayMeal,
      'الخميس': mealPlanConfig.thursdayMeal,
    };

    setBreadLogs((prev) =>
      prev.map((log) => {
        let shouldApply = false;
        if (mealPlanConfig.targetScope === 'year') {
          shouldApply = log.academicYear === selectedYear;
        } else if (mealPlanConfig.targetScope === 'month') {
          shouldApply = log.academicYear === selectedYear && log.month === selectedMonth;
        } else if (mealPlanConfig.targetScope === 'week') {
          shouldApply =
            log.academicYear === selectedYear &&
            log.month === selectedMonth &&
            log.week === Number(mealPlanConfig.targetWeek);
        }

        if (shouldApply && dayMap[log.day]) {
          return {
            ...log,
            meal: dayMap[log.day],
          };
        }
        return log;
      })
    );

    setIsMealScheduleModalOpen(false);
    alert('تم تطبيق وضبط برنامج الوجبات المبرمجة بنجاح!');
  };

  // Quick preset helper to change meal from context menu
  const handleQuickChangeMeal = (logId, newMeal) => {
    setBreadLogs((prev) =>
      prev.map((l) => (l.id === logId ? { ...l, meal: newMeal } : l))
    );
    setContextMenu(null);
  };

  // Copy row to clipboard as TSV
  const handleCopyTSV = (log) => {
    const tsv = `${log.academicYear}\t${log.month}\tالأسبوع ${log.week}\t${log.day}\t${log.meal}\t${log.breadCount}\t${log.unitPrice}\t${log.totalAmount}\t${log.notes || ''}`;
    navigator.clipboard.writeText(tsv);
    alert('تم نسخ بيانات الاستهلاك اليومي إلى الحافظة بنجاح');
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['الموسم', 'الشهر', 'الأسبوع', 'اليوم', 'الوجبة المبرمجة', 'عدد الخبز', 'سعر الوحدة (دج)', 'المبلغ الإجمالي (دج)', 'الملاحظات'];
    const rows = currentLogs.map((l) => [
      l.academicYear,
      l.month,
      `الأسبوع ${l.week}`,
      l.day,
      `"${l.meal.replace(/"/g, '""')}"`,
      l.breadCount,
      l.unitPrice,
      l.totalAmount,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rawda_bread_tracking_${selectedYear}_${selectedMonth}_week_${selectedWeek}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Group logs by week for ALL view
  const groupedByWeek = useMemo(() => {
    if (selectedWeek !== 'ALL') {
      return [{ weekNum: Number(selectedWeek), list: currentLogs }];
    }
    return [1, 2, 3, 4, 5].map((w) => {
      const list = currentLogs.filter((l) => l.week === w);
      return { weekNum: w, list };
    }).filter((g) => g.list.length > 0);
  }, [currentLogs, selectedWeek]);

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
            <Utensils className="w-4 h-4 text-blue-900" />
            المراقبة اليومية لاستهلاك الخبز
          </h1>
          <span className="text-[11px] text-slate-500 hidden md:inline font-sans">
            (Rawda Daily Bread Procurement & Dietary Tracking)
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

        {/* Left side: Year Selector, Search & Action Buttons */}
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
              placeholder="بحث بالوجبة، اليوم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-7 w-40 ps-7 pe-2 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-900 transition-colors"
            />
          </div>

          {/* Planned Meal Schedule Button */}
          <button
            onClick={() => setIsMealScheduleModalOpen(true)}
            title="تخصيص وبرمجة جدول وجبات الغداء الشهرية"
            className="h-7 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>ضبط الوجبات المبرمجة</span>
          </button>

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
            title="تسجيل استهلاك خبز جديد"
            className="h-7 px-2.5 bg-blue-900 hover:bg-blue-950 text-white font-semibold flex items-center gap-1 text-xs shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>استهلاك جديد</span>
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
          كافة الشهور (الموسم كاملاً)
        </button>
        <span className="w-px h-4 bg-slate-200 shrink-0 mx-0.5" />

        {RAWDA_MONTHS.map((m) => {
          const isSelected = selectedMonth === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setSelectedMonth(m.id)}
              className={`h-7 px-2.5 text-xs font-semibold shrink-0 transition-colors border ${
                isSelected
                  ? 'bg-blue-900 text-white border-blue-900 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>{m.nameAr}</span>
            </button>
          );
        })}
      </div>

      {/* 3. WEEK FILTER SUB-BAR */}
      <div className="bg-white border border-slate-200 px-3 py-1.5 shadow-2xs flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-slate-600 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-blue-900" />
            تصفية الأسابيع:
          </span>
          <button
            onClick={() => setSelectedWeek('ALL')}
            className={`h-6 px-2 text-xs font-semibold border transition-colors ${
              selectedWeek === 'ALL'
                ? 'bg-blue-900 text-white border-blue-900'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            كافة أسابيع الشهر (1 - 5)
          </button>
          {[1, 2, 3, 4, 5].map((w) => (
            <button
              key={w}
              onClick={() => setSelectedWeek(String(w))}
              className={`h-6 px-2.5 text-xs font-semibold border transition-colors ${
                selectedWeek === String(w)
                  ? 'bg-blue-900 text-white border-blue-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              الأسبوع {w}
            </button>
          ))}
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          شهر: <span className="font-bold text-blue-900">{currentMonthName}</span> | الأسبوع:{' '}
          <span className="font-bold text-blue-900">{selectedWeek === 'ALL' ? 'الكل' : selectedWeek}</span>
        </div>
      </div>

      {/* 4. KPI METRICS CARDS */}
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

      {/* 5. INTERACTIVE BREAD DATA TABLE */}
      <div className="bg-white border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-3 py-1.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">سجل الاستهلاك اليومي للخبز للأفواج الـ 10</span>
            <span className="text-slate-400 font-mono text-[11px]">
              ({currentLogs.length} حصة مسجلة)
            </span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-2">
            <span className="bg-amber-50 border border-amber-200 text-amber-900 px-1.5 py-0.5 rounded-xs">
              💡 انقر نقراً مزدوجاً أو بالزر الأيمن لتعديل الوجبة وعدد الخبز مباشرة
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs border-collapse">
            <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold select-none">
              <tr>
                <th className="p-2 text-center border-e border-slate-200 w-10">#</th>
                <th className="p-2 text-center border-e border-slate-200 min-w-[80px]">الأسبوع</th>
                <th className="p-2 text-start border-e border-slate-200 min-w-[90px]">اليوم الدراسي</th>
                <th className="p-2 text-start border-e border-slate-200 min-w-[240px]">
                  الوجبة المبرمجة (القائمة المعتمدة)
                </th>
                <th className="p-2 text-center border-e border-slate-200 min-w-[120px]">
                  عدد الخبز المستهلك
                </th>
                <th className="p-2 text-center border-e border-slate-200 min-w-[100px]">
                  سعر الوحدة (دج)
                </th>
                <th className="p-2 text-end border-e border-slate-200 min-w-[120px]">
                  المبلغ الإجمالي (دج)
                </th>
                <th className="p-2 text-start border-e border-slate-200 min-w-[220px]">
                  الملاحظات وتقييم الاستهلاك
                </th>
                <th className="p-2 text-center min-w-[90px] print:hidden">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {groupedByWeek.map((grp) => {
                const weekLoaves = grp.list.reduce((acc, l) => acc + Number(l.breadCount || 0), 0);
                const weekTotal = grp.list.reduce((acc, l) => acc + Number(l.totalAmount || 0), 0);

                return (
                  <React.Fragment key={grp.weekNum}>
                    {/* Week Sub-Header when viewing ALL weeks */}
                    {selectedWeek === 'ALL' && (
                      <tr className="bg-slate-200/70 border-y border-slate-300 font-bold text-slate-800">
                        <td colSpan={9} className="p-1.5 px-3">
                          <div className="flex items-center justify-between">
                            <span className="text-blue-900 font-bold">الأسبوع {grp.weekNum}</span>
                            <span className="font-mono text-slate-600 text-[11px]">
                              {weekLoaves} خبزة | {weekTotal.toLocaleString()} دج
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}

                    {grp.list.map((log, idx) => {
                      const isEditingMeal = inlineEdit?.id === log.id && inlineEdit?.field === 'meal';
                      const isEditingBread = inlineEdit?.id === log.id && inlineEdit?.field === 'breadCount';
                      const isEditingPrice = inlineEdit?.id === log.id && inlineEdit?.field === 'unitPrice';
                      const isEditingNotes = inlineEdit?.id === log.id && inlineEdit?.field === 'notes';

                      return (
                        <tr
                          key={log.id}
                          onContextMenu={(e) => handleContextMenu(e, log)}
                          className="hover:bg-blue-50/40 transition-colors h-8 text-[11px]"
                        >
                          {/* Row Number */}
                          <td className="p-1 text-center border-e border-slate-200 font-mono text-slate-400 font-bold">
                            {idx + 1}
                          </td>

                          {/* Week */}
                          <td className="p-1 text-center border-e border-slate-200 font-semibold text-slate-700">
                            الأسبوع {log.week}
                          </td>

                          {/* Day */}
                          <td className="p-1 border-e border-slate-200 font-bold text-slate-900">
                            {log.day}
                          </td>

                          {/* Meal */}
                          <td
                            onDoubleClick={() => startInlineEdit(log.id, 'meal', log.meal)}
                            className="p-1 border-e border-slate-200 font-semibold text-slate-900 cursor-pointer"
                          >
                            {isEditingMeal ? (
                              <select
                                autoFocus
                                value={inlineVal}
                                onChange={(e) => setInlineVal(e.target.value)}
                                onBlur={commitInlineEdit}
                                className="w-full h-6 px-1 text-xs border border-blue-600 bg-white font-semibold"
                              >
                                {PRESET_MEALS.map((m, mIdx) => (
                                  <option key={mIdx} value={m}>
                                    {m}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div className="flex items-center justify-between">
                                <span className="hover:underline">{log.meal}</span>
                                <span className="text-[10px] text-slate-400 ms-1 print:hidden">✏️</span>
                              </div>
                            )}
                          </td>

                          {/* Bread Count */}
                          <td
                            onDoubleClick={() => startInlineEdit(log.id, 'breadCount', log.breadCount)}
                            className="p-1 text-center border-e border-slate-200 font-mono font-bold text-blue-900 cursor-pointer"
                          >
                            {isEditingBread ? (
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
                                className="w-16 h-6 px-1 text-center text-xs border border-blue-600 bg-white font-mono font-bold mx-auto block"
                              />
                            ) : (
                              <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-xs">
                                {log.breadCount} خبزة
                              </span>
                            )}
                          </td>

                          {/* Unit Price */}
                          <td
                            onDoubleClick={() => startInlineEdit(log.id, 'unitPrice', log.unitPrice)}
                            className="p-1 text-center border-e border-slate-200 font-mono text-slate-700 cursor-pointer"
                          >
                            {isEditingPrice ? (
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
                                className="w-16 h-6 px-1 text-center text-xs border border-blue-600 bg-white font-mono mx-auto block"
                              />
                            ) : (
                              <span>{log.unitPrice} دج</span>
                            )}
                          </td>

                          {/* Total Amount */}
                          <td className="p-1 text-end border-e border-slate-200 font-mono font-bold text-emerald-800 text-xs">
                            {Number(log.totalAmount || 0).toLocaleString()} دج
                          </td>

                          {/* Notes */}
                          <td
                            onDoubleClick={() => startInlineEdit(log.id, 'notes', log.notes)}
                            className="p-1 border-e border-slate-200 text-slate-600 cursor-pointer truncate max-w-[220px]"
                            title={log.notes}
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
                              <span>{log.notes || '-'}</span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="p-1 text-center print:hidden">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(log)}
                                title="تعديل السطر"
                                className="p-1 bg-slate-100 hover:bg-amber-50 text-amber-700 border border-slate-200 rounded-xs transition-colors"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteLog(log.id)}
                                title="حذف السطر"
                                className="p-1 bg-slate-100 hover:bg-rose-50 text-rose-700 border border-slate-200 rounded-xs transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Weekly Subtotal Row */}
                    <tr className="bg-slate-100/90 font-bold border-y border-slate-300 font-mono text-[11px]">
                      <td colSpan={4} className="p-1.5 px-3 text-start font-sans text-slate-700 border-e border-slate-200">
                        مجموع استهلاك الأسبوع {grp.weekNum}
                      </td>
                      <td className="p-1.5 text-center border-e border-slate-200 text-blue-900 font-bold">
                        {weekLoaves} خبزة
                      </td>
                      <td className="p-1.5 text-center border-e border-slate-200 text-slate-400">-</td>
                      <td className="p-1.5 text-end border-e border-slate-200 text-emerald-800 font-bold">
                        {weekTotal.toLocaleString()} دج
                      </td>
                      <td colSpan={2} className="p-1.5 px-3 text-start font-sans text-slate-500 text-[10px]">
                        {grp.list.length} أيام وجبات دراسية
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>

            {/* GRAND TOTAL ROW */}
            <tfoot className="bg-slate-200 font-bold border-t-2 border-slate-400 font-mono text-xs">
              <tr>
                <td colSpan={4} className="p-2 px-3 text-start font-sans text-slate-900 border-e border-slate-300">
                  المجموع الإجمالي ({selectedWeek === 'ALL' ? 'كامل الشهر' : `الأسبوع ${selectedWeek}`} - {currentMonthName})
                </td>
                <td className="p-2 text-center border-e border-slate-300 text-blue-950 font-bold">
                  {totalLoaves.toLocaleString()} خبزة
                </td>
                <td className="p-2 text-center border-e border-slate-300 text-slate-400">-</td>
                <td className="p-2 text-end border-e border-slate-300 text-emerald-900 text-sm font-bold">
                  {totalCost.toLocaleString()} دج
                </td>
                <td colSpan={2} className="p-2 px-3 text-start font-sans text-xs text-slate-600">
                  {currentLogs.length} وجبات مدرسية معتمدة
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 6. RIGHT-CLICK CONTEXT MENU */}
      {contextMenu && (
        <div
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 bg-white border border-slate-300 shadow-xl py-1 text-xs w-60 divide-y divide-slate-100 animate-in fade-in zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1 font-bold text-slate-700 bg-slate-50 text-[11px] flex items-center justify-between">
            <span>{contextMenu.log.day} (الأسبوع {contextMenu.log.week})</span>
            <span className="text-blue-900 font-mono font-bold">{contextMenu.log.breadCount} خبزة</span>
          </div>

          {/* Quick Meals Picker Submenu */}
          <div className="p-1">
            <div className="text-[10px] text-slate-400 px-2 py-0.5 font-bold">تغيير سريع للوجبة:</div>
            <div className="max-h-32 overflow-y-auto space-y-0.5">
              {PRESET_MEALS.slice(0, 5).map((meal, mIdx) => (
                <button
                  key={mIdx}
                  onClick={() => handleQuickChangeMeal(contextMenu.log.id, meal)}
                  className={`w-full text-start px-2 py-1 text-[11px] rounded-xs truncate hover:bg-amber-50 ${
                    contextMenu.log.meal === meal ? 'text-amber-900 font-bold bg-amber-50/60' : 'text-slate-700'
                  }`}
                >
                  • {meal}
                </button>
              ))}
            </div>
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                handleOpenEdit(contextMenu.log);
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-start hover:bg-blue-50 flex items-center gap-2 text-slate-700"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-700" />
              <span>تعديل السطر بالكامل</span>
            </button>
            <button
              onClick={() => {
                startInlineEdit(contextMenu.log.id, 'breadCount', contextMenu.log.breadCount);
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-start hover:bg-blue-50 flex items-center gap-2 text-slate-700"
            >
              <Edit2 className="w-3.5 h-3.5 text-blue-600" />
              <span>تعديل عدد الخبز مباشرة</span>
            </button>
            <button
              onClick={() => {
                handleCopyTSV(contextMenu.log);
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-start hover:bg-blue-50 flex items-center gap-2 text-slate-700"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>نسخ بيانات السطر (TSV)</span>
            </button>
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                handleDeleteLog(contextMenu.log.id);
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-start hover:bg-rose-50 text-rose-700 flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>حذف السطر من السجل</span>
            </button>
          </div>
        </div>
      )}

      {/* 7. PLANNED MEAL SCHEDULE HELPER TOOL MODAL */}
      {isMealScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-lg p-5 text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 text-amber-900 rounded-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    أداة تخصيص الوجبات المبرمجة (الجدول الخماسي)
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    تعديل وتطبيق خطة وجبات الغداء للأفواج الـ 10
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsMealScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Scope Selector */}
            <div className="bg-slate-50 p-2 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 block text-[11px]">نطاق تطبيق الخطة:</span>
              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="scope"
                    value="month"
                    checked={mealPlanConfig.targetScope === 'month'}
                    onChange={(e) => setMealPlanConfig({ ...mealPlanConfig, targetScope: e.target.value })}
                  />
                  <span>كامل شهر {currentMonthName}</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="scope"
                    value="week"
                    checked={mealPlanConfig.targetScope === 'week'}
                    onChange={(e) => setMealPlanConfig({ ...mealPlanConfig, targetScope: e.target.value })}
                  />
                  <span>أسبوع محدد:</span>
                  <select
                    value={mealPlanConfig.targetWeek}
                    onChange={(e) => setMealPlanConfig({ ...mealPlanConfig, targetWeek: e.target.value })}
                    disabled={mealPlanConfig.targetScope !== 'week'}
                    className="h-6 px-1 border border-slate-300 bg-white text-xs ms-1"
                  >
                    {[1, 2, 3, 4, 5].map((w) => (
                      <option key={w} value={w}>
                        الأسبوع {w}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="scope"
                    value="year"
                    checked={mealPlanConfig.targetScope === 'year'}
                    onChange={(e) => setMealPlanConfig({ ...mealPlanConfig, targetScope: e.target.value })}
                  />
                  <span>كامل الموسم الدراسي ({selectedYear})</span>
                </label>
              </div>
            </div>

            {/* Daily Meals Form */}
            <div className="space-y-2 max-h-72 overflow-y-auto pe-1">
              {[
                { day: 'الأحد', stateKey: 'sundayMeal' },
                { day: 'الإثنين', stateKey: 'mondayMeal' },
                { day: 'الثلاثاء', stateKey: 'tuesdayMeal' },
                { day: 'الأربعاء', stateKey: 'wednesdayMeal' },
                { day: 'الخميس', stateKey: 'thursdayMeal' },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col gap-1 p-2 bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{item.day}:</span>
                    <span className="text-[10px] text-slate-400">الوجبة المعتمدة</span>
                  </div>
                  <select
                    value={mealPlanConfig[item.stateKey]}
                    onChange={(e) => setMealPlanConfig({ ...mealPlanConfig, [item.stateKey]: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-white font-semibold text-xs"
                  >
                    {PRESET_MEALS.map((meal, mIdx) => (
                      <option key={mIdx} value={meal}>
                        {meal}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="border-t pt-3 flex justify-between items-center">
              <span className="text-[11px] text-slate-500">
                سيتم تحديث الوجبات تلقائياً مع الحفاظ على معدلات استهلاك الخبز.
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsMealScheduleModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleApplyMealSchedule}
                  className="px-4 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>تطبيق الخطة</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. INFO MODAL (REPLACING OLD BULKY BANNER) */}
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
                    دليل واجهة: المراقبة اليومية لاستهلاك الخبز (1.8)
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Rawda Daily Bread Procurement & Dietary Tracking
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
                <p className="font-semibold mb-1">الهدف والمفهوم التشغيلي:</p>
                <p className="text-[11px]">
                  تتبع يومي دقيق لكميات الخبز المستهلكة في وجبات الغداء للأفواج الـ 10 (من الأحد إلى
                  الخميس)، وربطها بنوع الوجبة المبرمجة واحتساب التكلفة الإجمالية وفوارق التوريد، لمنع
                  أي إهدار وضمان التوازن الغذائي للأطفال.
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="font-bold text-slate-800">ميزات الواجهة المحدثة:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                  <li>
                    <strong>دعم متعدد السنوات والأشهر:</strong> إمكانية التنقل بين المواسم الدراسية
                    (2024-2025، 2025-2026، 2026-2027) وشهور الموسم الـ 11.
                  </li>
                  <li>
                    <strong>أداة تخصيص الوجبات المبرمجة:</strong> إمكانية تعديل خطة الوجبات المبرمجة
                    لكل شهر أو أسبوع وتوفير أدوات مساعدة وقوائم مأكولات معتمدة.
                  </li>
                  <li>
                    <strong>التعديل المباشر بالماوس:</strong> انقر نقراً مزدوجاً على خانة عدد الخبز،
                    الوجبة، أو السعر لتعديلها مباشرة أو انقر بالزر الأيمن لفتح القائمة المنسدلة.
                  </li>
                  <li>
                    <strong>المجاميع الأسبوعية والكلية:</strong> احتساب فوري لتكلفة الخبز الإجمالية
                    ومتوسط الاستهلاك اليومي.
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

      {/* 9. ADD / EDIT BREAD ENTRY MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">
                {editingLog ? 'تعديل سجل استهلاك خبز' : 'تسجيل استهلاك خبز يومي جديد'}
              </span>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الأسبوع *</label>
                  <select
                    value={entryForm.week}
                    onChange={(e) => setEntryForm({ ...entryForm, week: Number(e.target.value) })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-semibold"
                  >
                    {[1, 2, 3, 4, 5].map((w) => (
                      <option key={w} value={w}>
                        الأسبوع {w}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">اليوم الدراسي *</label>
                  <select
                    value={entryForm.day}
                    onChange={(e) => setEntryForm({ ...entryForm, day: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-semibold"
                  >
                    {SCHOOL_DAYS.map((sd, sIdx) => (
                      <option key={sIdx} value={sd.day}>
                        {sd.day}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">الوجبة المبرمجة *</label>
                <select
                  value={entryForm.meal}
                  onChange={(e) => setEntryForm({ ...entryForm, meal: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-semibold"
                >
                  {PRESET_MEALS.map((meal, mIdx) => (
                    <option key={mIdx} value={meal}>
                      {meal}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">عدد الخبز *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={entryForm.breadCount}
                    onChange={(e) => setEntryForm({ ...entryForm, breadCount: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono font-bold text-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">سعر الوحدة (دج) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={entryForm.unitPrice}
                    onChange={(e) => setEntryForm({ ...entryForm, unitPrice: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                  />
                </div>
              </div>

              <div className="p-2 bg-slate-100 border border-slate-200 text-xs flex justify-between items-center font-mono">
                <span className="text-slate-600 font-sans">المبلغ الإجمالي المحتسب:</span>
                <span className="font-bold text-emerald-800">
                  {((Number(entryForm.breadCount) || 0) * (Number(entryForm.unitPrice) || 0)).toLocaleString()} دج
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">الملاحظات وتقييم الاستهلاك</label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات حول الفائض أو مطابقة الحصص..."
                  value={entryForm.notes}
                  onChange={(e) => setEntryForm({ ...entryForm, notes: e.target.value })}
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
                  <span>{editingLog ? 'تحديث السجل' : 'حفظ السجل'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
