import React, { useState, useMemo, useEffect } from 'react';
import {
  Wallet,
  Users,
  Coins,
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
  FileCheck,
  TrendingUp,
  Settings,
  DollarSign,
} from 'lucide-react';

const MONTHS_LIST = [
  { id: 'sep', name: 'سبتمبر' },
  { id: 'oct', name: 'أكتوبر' },
  { id: 'nov', name: 'نوفمبر' },
  { id: 'dec', name: 'ديسمبر' },
  { id: 'jan', name: 'جانفي' },
  { id: 'feb', name: 'فيفري' },
  { id: 'mar', name: 'مارس' },
  { id: 'apr', name: 'أفريل' },
  { id: 'may', name: 'ماي' },
  { id: 'jun', name: 'جوان' },
  { id: 'jul', name: 'جويلية' },
];

const INITIAL_STAFF_DATA = [
  // 1. Administration
  {
    id: 'adm-1',
    category: 'admin',
    name: 'صلاح الدين خباش',
    role: 'المدير التنفيذي والمشرف العام',
    baseDue: 60000,
    startDate: '2023-09-01',
    notes: 'دوام كامل وتأطير إداري',
    academicYear: '2025-2026',
    months: {
      sep: 60000,
      oct: 60000,
      nov: 60000,
      dec: 60000,
      jan: 60000,
      feb: 60000,
      mar: 0,
      apr: 0,
      may: 0,
      jun: 0,
      jul: 0,
    },
  },
  {
    id: 'adm-2',
    category: 'admin',
    name: 'حنان زروقي',
    role: 'مسؤولة الاستقبال وأمانة الخزينة',
    baseDue: 38000,
    startDate: '2024-01-15',
    notes: 'استقبال وتسجيلات يومية',
    academicYear: '2025-2026',
    months: {
      sep: 38000,
      oct: 38000,
      nov: 38000,
      dec: 38000,
      jan: 38000,
      feb: 38000,
      mar: 0,
      apr: 0,
      may: 0,
      jun: 0,
      jul: 0,
    },
  },

  // 2. Preparatory Teachers
  {
    id: 'prep-1',
    category: 'prep',
    name: 'أستاذة مريم بن علي',
    role: 'مربية ومعلمة تحضيري أ',
    kidCount: 22,
    baseDue: 45000,
    startDate: '2024-09-01',
    notes: 'فوج 22 طفل - قسم العباقرة 1',
    academicYear: '2025-2026',
    months: {
      sep: 45000,
      oct: 45000,
      nov: 45000,
      dec: 45000,
      jan: 45000,
      feb: 45000,
      mar: 0,
      apr: 0,
      may: 0,
      jun: 0,
      jul: 0,
    },
  },
  {
    id: 'prep-2',
    category: 'prep',
    name: 'أستاذة وسيلة بوطالب',
    role: 'معلمة تحضيري ب',
    kidCount: 20,
    baseDue: 42000,
    startDate: '2024-09-01',
    notes: 'فوج 20 طفل - قسم العباقرة 2',
    academicYear: '2025-2026',
    months: {
      sep: 42000,
      oct: 42000,
      nov: 42000,
      dec: 42000,
      jan: 42000,
      feb: 42000,
      mar: 0,
      apr: 0,
      may: 0,
      jun: 0,
      jul: 0,
    },
  },

  // 3. Languages Trainers
  {
    id: 'lang-1',
    category: 'languages',
    name: 'أستاذ مراد آيت أحمد',
    role: 'أستاذ اللغة الإنجليزية (مستويات A1-B2)',
    kidCount: 35,
    baseDue: 36000,
    startDate: '2024-10-01',
    notes: 'دورات مستويات أسبوعية مكثفة',
    academicYear: '2025-2026',
    months: {
      sep: 0,
      oct: 36000,
      nov: 36000,
      dec: 36000,
      jan: 36000,
      feb: 36000,
      mar: 0,
      apr: 0,
      may: 0,
      jun: 0,
      jul: 0,
    },
  },
  {
    id: 'lang-2',
    category: 'languages',
    name: 'أستاذة سهام قادري',
    role: 'أستاذة اللغة الفرنسية للأطفال',
    kidCount: 28,
    baseDue: 32000,
    startDate: '2024-10-01',
    notes: 'دعم وتأسيس لغوي',
    academicYear: '2025-2026',
    months: {
      sep: 0,
      oct: 32000,
      nov: 32000,
      dec: 32000,
      jan: 32000,
      feb: 32000,
      mar: 0,
      apr: 0,
      may: 0,
      jun: 0,
      jul: 0,
    },
  },

  // 4. Soroban Trainers
  {
    id: 'srb-1',
    category: 'soroban',
    name: 'المدرب يوسف بن عيسى',
    role: 'كبير مدربي السوربان والحساب الذهني',
    kidCount: 42,
    baseDue: 48000,
    startDate: '2023-09-01',
    notes: '4 أفواج تدريبية معتمدة + إعداد بطولات',
    academicYear: '2025-2026',
    months: {
      sep: 48000,
      oct: 48000,
      nov: 48000,
      dec: 48000,
      jan: 48000,
      feb: 48000,
      mar: 0,
      apr: 0,
      may: 0,
      jun: 0,
      jul: 0,
    },
  },
  {
    id: 'srb-2',
    category: 'soroban',
    name: 'المدربة سمية بلعابد',
    role: 'مدربة سوربان مستوى مبتدئ ومتوسط',
    kidCount: 30,
    baseDue: 35000,
    startDate: '2024-09-01',
    notes: '3 أفواج أطفال',
    academicYear: '2025-2026',
    months: {
      sep: 35000,
      oct: 35000,
      nov: 35000,
      dec: 35000,
      jan: 35000,
      feb: 35000,
      mar: 0,
      apr: 0,
      may: 0,
      jun: 0,
      jul: 0,
    },
  },
];

export function CenterFixedPayrollView() {
  const [selectedYear, setSelectedYear] = useState('2025-2026');
  const [activeTab, setActiveTab] = useState('table'); // 'table' | 'config' | 'kpis'
  const [searchTerm, setSearchTerm] = useState('');
  const [staffList, setStaffList] = useState(INITIAL_STAFF_DATA);

  // Config tab state for rates & formulas
  const [ratesConfig, setRatesConfig] = useState({
    adminBaseDefault: 40000,
    prepPerKidRate: 2000,
    languagesHourlyRate: 1500,
    sorobanPerKidRate: 1200,
  });

  // UI Modals
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  // Right-Click Context Menu
  const [contextMenu, setContextMenu] = useState(null);

  // Close context menu on external click
  useEffect(() => {
    const handleWindowClick = () => setContextMenu(null);
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  // Filtered by year and search
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const matchYear = !s.academicYear || s.academicYear === selectedYear;
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.notes.toLowerCase().includes(searchTerm.toLowerCase());
      return matchYear && matchSearch;
    });
  }, [staffList, selectedYear, searchTerm]);

  // Split into 4 categories
  const adminStaff = filteredStaff.filter((s) => s.category === 'admin');
  const prepStaff = filteredStaff.filter((s) => s.category === 'prep');
  const langStaff = filteredStaff.filter((s) => s.category === 'languages');
  const srbStaff = filteredStaff.filter((s) => s.category === 'soroban');

  // Calculate sum for a group of staff for each month
  const calculateGroupTotals = (group) => {
    const totals = { baseDue: 0, totalAnnual: 0 };
    MONTHS_LIST.forEach((m) => {
      totals[m.id] = 0;
    });

    group.forEach((s) => {
      totals.baseDue += s.baseDue || 0;
      MONTHS_LIST.forEach((m) => {
        const val = s.months?.[m.id] || 0;
        totals[m.id] += val;
        totals.totalAnnual += val;
      });
    });

    return totals;
  };

  const adminTotals = useMemo(() => calculateGroupTotals(adminStaff), [adminStaff]);
  const prepTotals = useMemo(() => calculateGroupTotals(prepStaff), [prepStaff]);
  const langTotals = useMemo(() => calculateGroupTotals(langStaff), [langStaff]);
  const srbTotals = useMemo(() => calculateGroupTotals(srbStaff), [srbStaff]);

  // Grand Totals
  const grandTotals = useMemo(() => {
    const totals = { baseDue: 0, totalAnnual: 0 };
    MONTHS_LIST.forEach((m) => {
      totals[m.id] =
        adminTotals[m.id] + prepTotals[m.id] + langTotals[m.id] + srbTotals[m.id];
      totals.totalAnnual += totals[m.id];
    });
    totals.baseDue =
      adminTotals.baseDue + prepTotals.baseDue + langTotals.baseDue + srbTotals.baseDue;
    return totals;
  }, [adminTotals, prepTotals, langTotals, srbTotals]);

  // Toggle Month Payment for a staff member
  const toggleMonthPayment = (staffId, monthId) => {
    setStaffList((prev) =>
      prev.map((s) => {
        if (s.id !== staffId) return s;
        const currentVal = s.months?.[monthId] || 0;
        const newVal = currentVal > 0 ? 0 : s.baseDue;
        return {
          ...s,
          months: {
            ...s.months,
            [monthId]: newVal,
          },
        };
      })
    );
  };

  // Open Context Menu
  const handleContextMenu = (e, staff) => {
    e.preventDefault();
    e.stopPropagation();
    const x = Math.min(e.clientX, window.innerWidth - 220);
    const y = Math.min(e.clientY, window.innerHeight - 260);
    setContextMenu({ x, y, staff });
  };

  // Delete Staff
  const handleDeleteStaff = (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الموظف وسجل رواتبه؟')) {
      setStaffList((prev) => prev.filter((s) => s.id !== id));
      setContextMenu(null);
    }
  };

  // Add New Staff Form
  const [newStaffForm, setNewStaffForm] = useState({
    name: '',
    category: 'admin',
    role: '',
    kidCount: 0,
    baseDue: 35000,
    startDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const handleAddNewStaff = (e) => {
    e.preventDefault();
    if (!newStaffForm.name.trim()) return;

    const monthsObj = {};
    MONTHS_LIST.forEach((m) => {
      monthsObj[m.id] = 0;
    });

    const newEntry = {
      id: `staff-${Date.now()}`,
      academicYear: selectedYear,
      category: newStaffForm.category,
      name: newStaffForm.name.trim(),
      role: newStaffForm.role.trim() || 'موظف معتمد',
      kidCount: Number(newStaffForm.kidCount) || 0,
      baseDue: Number(newStaffForm.baseDue) || 35000,
      startDate: newStaffForm.startDate,
      notes: newStaffForm.notes || 'تسجيل جديد',
      months: monthsObj,
    };

    setStaffList([...staffList, newEntry]);
    setIsAddModalOpen(false);
  };

  // Save Edit Staff
  const handleSaveEditStaff = (e) => {
    e.preventDefault();
    if (editingStaff) {
      setStaffList((prev) =>
        prev.map((s) => (s.id === editingStaff.id ? editingStaff : s))
      );
      setEditingStaff(null);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'القسم / الفئة',
      'الاسم واللقب / المدرب',
      'الدور / الصفة',
      'عدد الأطفال',
      'المبلغ المستحق',
      ...MONTHS_LIST.map((m) => m.name),
      'إجمالي المنصرف السنوي',
      'تاريخ البداية',
      'ملاحظات',
    ];

    const rows = [];
    filteredStaff.forEach((s) => {
      let annual = 0;
      const mVals = MONTHS_LIST.map((m) => {
        const val = s.months?.[m.id] || 0;
        annual += val;
        return val;
      });
      rows.push([
        s.category === 'admin'
          ? 'الإدارة'
          : s.category === 'prep'
          ? 'التحضيري'
          : s.category === 'languages'
          ? 'اللغات'
          : 'السوربان',
        `"${s.name}"`,
        `"${s.role}"`,
        s.kidCount || '-',
        s.baseDue,
        ...mVals,
        annual,
        s.startDate,
        `"${s.notes || ''}"`,
      ]);
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `payroll_${selectedYear}.csv`);
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
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 text-sm">
                جدول الرواتب الشهرية الثابتة (مركز بجاية)
              </span>
              <span className="text-[10px] text-slate-400">|</span>
              <span className="text-[10px] text-slate-500 font-mono">Fixed Monthly Payroll</span>
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
              aria-label="تحديد السنة المالية لجدول الرواتب"
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
              سجل الرواتب السنوي ({filteredStaff.length})
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`px-3 py-1 text-xs font-bold flex items-center gap-1 transition-colors ${
                activeTab === 'config'
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings className="w-3 h-3" />
              إعدادات الأجور والمتغيرات
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
              مؤشرات الأجور
            </button>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1 border-s border-slate-200 ps-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              title="إضافة موظف / أستاذ جديد"
              className="p-1 bg-blue-900 hover:bg-blue-950 text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportCSV}
              title="تصدير جدول الرواتب CSV"
              className="p-1 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.print()}
              title="طباعة جدول الرواتب"
              className="p-1 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsInfoModalOpen(true)}
              title="دليل ومعلومات جدول الرواتب"
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
                placeholder="بحث بالاسم، الدور الوظيفي، أو الملاحظة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-7 pr-7 pl-2 bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
            <span>
              إجمالي الرواتب الأساسية:{' '}
              <strong className="text-slate-800">{grandTotals.baseDue.toLocaleString()} دج</strong>
            </span>
            <span>
              المصروف السنوي الإجمالي:{' '}
              <strong className="text-emerald-700">
                {grandTotals.totalAnnual.toLocaleString()} دج
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
                  <th className="p-1.5 text-start border border-slate-700 min-w-[150px] sticky left-0 z-30 bg-slate-900">
                    الاسم واللقب / المدرب
                  </th>
                  <th className="p-1.5 text-end border border-slate-700 min-w-[95px] bg-slate-800">
                    المبلغ المستحق
                  </th>
                  {MONTHS_LIST.map((m) => (
                    <th
                      key={m.id}
                      className="p-1 text-center border border-slate-700 min-w-[72px] text-[10px]"
                    >
                      {m.name}
                    </th>
                  ))}
                  <th className="p-1.5 text-center border border-slate-700 min-w-[85px]">
                    تاريخ البداية
                  </th>
                  <th className="p-1.5 text-start border border-slate-700 min-w-[140px]">
                    ملاحظات
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {/* SECTION 1: أجور الإدارة والسكرتارية */}
                <tr className="bg-slate-200 text-slate-900 font-bold font-sans">
                  <td colSpan={15} className="p-1.5 px-3 bg-slate-200 border-y border-slate-300">
                    1. أجور الإدارة والسكرتارية (طاقم الإدارة المركزية)
                  </td>
                </tr>
                {adminStaff.map((s) => (
                  <tr
                    key={s.id}
                    onContextMenu={(e) => handleContextMenu(e, s)}
                    className="h-8 hover:bg-blue-50/40 transition-colors"
                  >
                    <td className="p-1.5 border-e border-slate-200 font-sans font-bold text-slate-900 sticky left-0 bg-white">
                      <div>{s.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{s.role}</div>
                    </td>
                    <td className="p-1 text-end border-e border-slate-200 font-bold bg-slate-50">
                      {s.baseDue.toLocaleString()}
                    </td>
                    {MONTHS_LIST.map((m) => {
                      const val = s.months?.[m.id] || 0;
                      return (
                        <td
                          key={m.id}
                          onClick={() => toggleMonthPayment(s.id, m.id)}
                          className={`p-1 text-center border-e border-slate-200 cursor-pointer text-[10px] transition-colors ${
                            val > 0
                              ? 'bg-emerald-50 text-emerald-800 font-bold hover:bg-emerald-100'
                              : 'text-slate-300 hover:bg-slate-100'
                          }`}
                          title={`انقر لتسجيل / إلغاء سداد راتب شهر ${m.name}`}
                        >
                          {val > 0 ? `${(val / 1000).toFixed(0)}k` : '-'}
                        </td>
                      );
                    })}
                    <td className="p-1 text-center border-e border-slate-200 font-sans text-slate-600 text-[10px]">
                      {s.startDate}
                    </td>
                    <td className="p-1.5 font-sans text-slate-600 truncate max-w-[140px]">
                      {s.notes}
                    </td>
                  </tr>
                ))}
                {/* Subtotal Admin */}
                <tr className="bg-slate-100 font-bold border-t border-b border-slate-300 text-slate-900">
                  <td className="p-1.5 font-sans sticky left-0 bg-slate-100">
                    المجموع: أجور الإدارة
                  </td>
                  <td className="p-1 text-end font-bold text-blue-950">
                    {adminTotals.baseDue.toLocaleString()}
                  </td>
                  {MONTHS_LIST.map((m) => (
                    <td key={m.id} className="p-1 text-center text-[10px] text-emerald-800 font-bold">
                      {adminTotals[m.id] > 0 ? `${(adminTotals[m.id] / 1000).toFixed(0)}k` : '-'}
                    </td>
                  ))}
                  <td colSpan={2} className="p-1 text-center font-sans text-[10px] text-slate-500">
                    إجمالي الإدارة: {adminTotals.totalAnnual.toLocaleString()} دج
                  </td>
                </tr>

                {/* SECTION 2: أجور أساتذة التحضيري */}
                <tr className="bg-amber-100/60 text-amber-950 font-bold font-sans">
                  <td colSpan={15} className="p-1.5 px-3 border-y border-amber-200">
                    2. أجور أساتذة التحضيري المدرسي
                  </td>
                </tr>
                {prepStaff.map((s) => (
                  <tr
                    key={s.id}
                    onContextMenu={(e) => handleContextMenu(e, s)}
                    className="h-8 hover:bg-blue-50/40 transition-colors"
                  >
                    <td className="p-1.5 border-e border-slate-200 font-sans font-bold text-slate-900 sticky left-0 bg-white">
                      <div>{s.name}</div>
                      <div className="text-[10px] text-amber-700 font-normal">
                        {s.role} ({s.kidCount} طفل)
                      </div>
                    </td>
                    <td className="p-1 text-end border-e border-slate-200 font-bold bg-slate-50">
                      {s.baseDue.toLocaleString()}
                    </td>
                    {MONTHS_LIST.map((m) => {
                      const val = s.months?.[m.id] || 0;
                      return (
                        <td
                          key={m.id}
                          onClick={() => toggleMonthPayment(s.id, m.id)}
                          className={`p-1 text-center border-e border-slate-200 cursor-pointer text-[10px] transition-colors ${
                            val > 0
                              ? 'bg-emerald-50 text-emerald-800 font-bold hover:bg-emerald-100'
                              : 'text-slate-300 hover:bg-slate-100'
                          }`}
                          title={`انقر لتسجيل / إلغاء سداد راتب شهر ${m.name}`}
                        >
                          {val > 0 ? `${(val / 1000).toFixed(0)}k` : '-'}
                        </td>
                      );
                    })}
                    <td className="p-1 text-center border-e border-slate-200 font-sans text-slate-600 text-[10px]">
                      {s.startDate}
                    </td>
                    <td className="p-1.5 font-sans text-slate-600 truncate max-w-[140px]">
                      {s.notes}
                    </td>
                  </tr>
                ))}
                {/* Subtotal Prep */}
                <tr className="bg-amber-50 font-bold border-t border-b border-amber-200 text-amber-950">
                  <td className="p-1.5 font-sans sticky left-0 bg-amber-50">
                    المجموع: أجور أساتذة التحضيري
                  </td>
                  <td className="p-1 text-end font-bold text-blue-950">
                    {prepTotals.baseDue.toLocaleString()}
                  </td>
                  {MONTHS_LIST.map((m) => (
                    <td key={m.id} className="p-1 text-center text-[10px] text-emerald-800 font-bold">
                      {prepTotals[m.id] > 0 ? `${(prepTotals[m.id] / 1000).toFixed(0)}k` : '-'}
                    </td>
                  ))}
                  <td colSpan={2} className="p-1 text-center font-sans text-[10px] text-slate-500">
                    إجمالي التحضيري: {prepTotals.totalAnnual.toLocaleString()} دج
                  </td>
                </tr>

                {/* SECTION 3: أجور مدربي اللغات - مستويات */}
                <tr className="bg-blue-100/60 text-blue-950 font-bold font-sans">
                  <td colSpan={15} className="p-1.5 px-3 border-y border-blue-200">
                    3. أجور مدربي اللغات (دورات المستويات)
                  </td>
                </tr>
                {langStaff.map((s) => (
                  <tr
                    key={s.id}
                    onContextMenu={(e) => handleContextMenu(e, s)}
                    className="h-8 hover:bg-blue-50/40 transition-colors"
                  >
                    <td className="p-1.5 border-e border-slate-200 font-sans font-bold text-slate-900 sticky left-0 bg-white">
                      <div>{s.name}</div>
                      <div className="text-[10px] text-blue-700 font-normal">{s.role}</div>
                    </td>
                    <td className="p-1 text-end border-e border-slate-200 font-bold bg-slate-50">
                      {s.baseDue.toLocaleString()}
                    </td>
                    {MONTHS_LIST.map((m) => {
                      const val = s.months?.[m.id] || 0;
                      return (
                        <td
                          key={m.id}
                          onClick={() => toggleMonthPayment(s.id, m.id)}
                          className={`p-1 text-center border-e border-slate-200 cursor-pointer text-[10px] transition-colors ${
                            val > 0
                              ? 'bg-emerald-50 text-emerald-800 font-bold hover:bg-emerald-100'
                              : 'text-slate-300 hover:bg-slate-100'
                          }`}
                          title={`انقر لتسجيل / إلغاء سداد راتب شهر ${m.name}`}
                        >
                          {val > 0 ? `${(val / 1000).toFixed(0)}k` : '-'}
                        </td>
                      );
                    })}
                    <td className="p-1 text-center border-e border-slate-200 font-sans text-slate-600 text-[10px]">
                      {s.startDate}
                    </td>
                    <td className="p-1.5 font-sans text-slate-600 truncate max-w-[140px]">
                      {s.notes}
                    </td>
                  </tr>
                ))}
                {/* Subtotal Lang */}
                <tr className="bg-blue-50 font-bold border-t border-b border-blue-200 text-blue-950">
                  <td className="p-1.5 font-sans sticky left-0 bg-blue-50">
                    المجموع: أجور مدربي اللغات
                  </td>
                  <td className="p-1 text-end font-bold text-blue-950">
                    {langTotals.baseDue.toLocaleString()}
                  </td>
                  {MONTHS_LIST.map((m) => (
                    <td key={m.id} className="p-1 text-center text-[10px] text-emerald-800 font-bold">
                      {langTotals[m.id] > 0 ? `${(langTotals[m.id] / 1000).toFixed(0)}k` : '-'}
                    </td>
                  ))}
                  <td colSpan={2} className="p-1 text-center font-sans text-[10px] text-slate-500">
                    إجمالي اللغات: {langTotals.totalAnnual.toLocaleString()} دج
                  </td>
                </tr>

                {/* SECTION 4: أجور مدربي السوربان */}
                <tr className="bg-purple-100/60 text-purple-950 font-bold font-sans">
                  <td colSpan={15} className="p-1.5 px-3 border-y border-purple-200">
                    4. أجور مدربي السوربان والحساب الذهني
                  </td>
                </tr>
                {srbStaff.map((s) => (
                  <tr
                    key={s.id}
                    onContextMenu={(e) => handleContextMenu(e, s)}
                    className="h-8 hover:bg-blue-50/40 transition-colors"
                  >
                    <td className="p-1.5 border-e border-slate-200 font-sans font-bold text-slate-900 sticky left-0 bg-white">
                      <div>{s.name}</div>
                      <div className="text-[10px] text-purple-700 font-normal">{s.role}</div>
                    </td>
                    <td className="p-1 text-end border-e border-slate-200 font-bold bg-slate-50">
                      {s.baseDue.toLocaleString()}
                    </td>
                    {MONTHS_LIST.map((m) => {
                      const val = s.months?.[m.id] || 0;
                      return (
                        <td
                          key={m.id}
                          onClick={() => toggleMonthPayment(s.id, m.id)}
                          className={`p-1 text-center border-e border-slate-200 cursor-pointer text-[10px] transition-colors ${
                            val > 0
                              ? 'bg-emerald-50 text-emerald-800 font-bold hover:bg-emerald-100'
                              : 'text-slate-300 hover:bg-slate-100'
                          }`}
                          title={`انقر لتسجيل / إلغاء سداد راتب شهر ${m.name}`}
                        >
                          {val > 0 ? `${(val / 1000).toFixed(0)}k` : '-'}
                        </td>
                      );
                    })}
                    <td className="p-1 text-center border-e border-slate-200 font-sans text-slate-600 text-[10px]">
                      {s.startDate}
                    </td>
                    <td className="p-1.5 font-sans text-slate-600 truncate max-w-[140px]">
                      {s.notes}
                    </td>
                  </tr>
                ))}
                {/* Subtotal Soroban */}
                <tr className="bg-purple-50 font-bold border-t border-b border-purple-200 text-purple-950">
                  <td className="p-1.5 font-sans sticky left-0 bg-purple-50">
                    المجموع: أجور مدربي السوربان
                  </td>
                  <td className="p-1 text-end font-bold text-blue-950">
                    {srbTotals.baseDue.toLocaleString()}
                  </td>
                  {MONTHS_LIST.map((m) => (
                    <td key={m.id} className="p-1 text-center text-[10px] text-emerald-800 font-bold">
                      {srbTotals[m.id] > 0 ? `${(srbTotals[m.id] / 1000).toFixed(0)}k` : '-'}
                    </td>
                  ))}
                  <td colSpan={2} className="p-1 text-center font-sans text-[10px] text-slate-500">
                    إجمالي السوربان: {srbTotals.totalAnnual.toLocaleString()} دج
                  </td>
                </tr>

                {/* GRAND TOTAL ROW */}
                <tr className="bg-slate-900 text-white font-bold text-xs sticky bottom-0 z-20 shadow-md">
                  <td className="p-2 font-sans sticky left-0 bg-slate-950 text-amber-300">
                    مجموع الرواتب الإجمالي (Grand Total)
                  </td>
                  <td className="p-2 text-end text-amber-300 font-mono">
                    {grandTotals.baseDue.toLocaleString()} دج
                  </td>
                  {MONTHS_LIST.map((m) => (
                    <td key={m.id} className="p-2 text-center text-[10px] text-emerald-400 font-mono">
                      {grandTotals[m.id] > 0
                        ? `${(grandTotals[m.id] / 1000).toFixed(0)}k`
                        : '-'}
                    </td>
                  ))}
                  <td colSpan={2} className="p-2 text-center text-xs font-mono text-amber-200">
                    الكتلة السنوية: {grandTotals.totalAnnual.toLocaleString()} دج
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : activeTab === 'config' ? (
          /* Config Tab: Variable Salary Scales & Settings */
          <div className="p-4 space-y-4 max-w-4xl mx-auto">
            <div className="bg-emerald-50 border border-emerald-200 p-3 flex items-start gap-2">
              <Settings className="w-4 h-4 text-emerald-900 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-950">
                <strong>لوحة ضبط وتعيين سلم الأجور والمتغيرات (بديل ملفات Excel بالكامل):</strong>
                <p className="mt-0.5 text-emerald-900 leading-relaxed">
                  يمكنك هنا ضبط القيم الافتراضية والنسب المعتمدة لحساب أجور كل صنف، لتطبيقها آلياً
                  على الرواتب الشهرية والسنوية.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white border border-slate-200 p-3 shadow-2xs space-y-3">
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-emerald-700" />
                  سلم الأجور الأساسية الافتراضية
                </h4>

                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">
                    الراتب الأساسي المعتمد للإدارة والسكرتارية (دج)
                  </label>
                  <input
                    type="number"
                    value={ratesConfig.adminBaseDefault}
                    onChange={(e) =>
                      setRatesConfig({ ...ratesConfig, adminBaseDefault: Number(e.target.value) })
                    }
                    className="w-full h-8 px-2 border border-slate-300 font-mono bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">
                    معامل أستاذ التحضيري (لكل طفل شهرياً - دج)
                  </label>
                  <input
                    type="number"
                    value={ratesConfig.prepPerKidRate}
                    onChange={(e) =>
                      setRatesConfig({ ...ratesConfig, prepPerKidRate: Number(e.target.value) })
                    }
                    className="w-full h-8 px-2 border border-slate-300 font-mono bg-slate-50"
                  />
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-3 shadow-2xs space-y-3">
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1">
                  <Coins className="w-4 h-4 text-blue-900" />
                  معدلات المدربين وحجم الأفواج
                </h4>

                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">
                    سعر الحصة / الساعة لمدربي اللغات (دج)
                  </label>
                  <input
                    type="number"
                    value={ratesConfig.languagesHourlyRate}
                    onChange={(e) =>
                      setRatesConfig({
                        ...ratesConfig,
                        languagesHourlyRate: Number(e.target.value),
                      })
                    }
                    className="w-full h-8 px-2 border border-slate-300 font-mono bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">
                    معامل مدرب السوربان (لكل طالب نشط بالفوج - دج)
                  </label>
                  <input
                    type="number"
                    value={ratesConfig.sorobanPerKidRate}
                    onChange={(e) =>
                      setRatesConfig({
                        ...ratesConfig,
                        sorobanPerKidRate: Number(e.target.value),
                      })
                    }
                    className="w-full h-8 px-2 border border-slate-300 font-mono bg-slate-50"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* KPIs Tab */
          <div className="p-4 space-y-4 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3 bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold">إجمالي كتلة الأجور الشهرية</span>
                  <Wallet className="w-4 h-4 text-blue-900" />
                </div>
                <div className="text-xl font-bold font-mono text-slate-900">
                  {grandTotals.baseDue.toLocaleString()} دج
                </div>
                <div className="text-[10px] text-slate-400 mt-1">شهرياً عبر الأقسام الـ 4</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold">المنصرف السنوي التراكمي</span>
                  <Coins className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="text-xl font-bold font-mono text-emerald-700">
                  {grandTotals.totalAnnual.toLocaleString()} دج
                </div>
                <div className="text-[10px] text-emerald-600 mt-1">موسم {selectedYear}</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold">طاقم العمل المعتمد</span>
                  <Users className="w-4 h-4 text-slate-700" />
                </div>
                <div className="text-xl font-bold font-mono text-slate-900">
                  {filteredStaff.length} موظفاً
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  إدارة، تحضيري، لغات، وسوربان
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold">المنصرف لشهر فيفري</span>
                  <CheckCircle className="w-4 h-4 text-blue-900" />
                </div>
                <div className="text-xl font-bold font-mono text-blue-900">
                  {grandTotals.feb.toLocaleString()} دج
                </div>
                <div className="text-[10px] text-blue-600 mt-1">رواتب الشهر الحالي</div>
              </div>
            </div>

            {/* Department Breakdown */}
            <div className="bg-white border border-slate-200 p-3 shadow-2xs">
              <h4 className="font-bold text-xs text-slate-900 mb-2">
                توزيع كتلة الأجور والموظفين حسب القسم التشغيلي:
              </h4>
              <table className="w-full text-start text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                  <tr>
                    <th className="p-2 text-start">القسم التشغيلي</th>
                    <th className="p-2 text-center">عدد الطاقم</th>
                    <th className="p-2 text-end">الراتب الشهري الأساسي</th>
                    <th className="p-2 text-end">المنصرف السنوي التراكمي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  <tr>
                    <td className="p-2 font-sans font-semibold text-slate-900">
                      1. الإدارة والسكرتارية
                    </td>
                    <td className="p-2 text-center">{adminStaff.length}</td>
                    <td className="p-2 text-end">{adminTotals.baseDue.toLocaleString()} دج</td>
                    <td className="p-2 text-end text-emerald-700 font-bold">
                      {adminTotals.totalAnnual.toLocaleString()} دج
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 font-sans font-semibold text-slate-900">
                      2. أساتذة التحضيري المدرسي
                    </td>
                    <td className="p-2 text-center">{prepStaff.length}</td>
                    <td className="p-2 text-end">{prepTotals.baseDue.toLocaleString()} دج</td>
                    <td className="p-2 text-end text-emerald-700 font-bold">
                      {prepTotals.totalAnnual.toLocaleString()} دج
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 font-sans font-semibold text-slate-900">
                      3. مدربو اللغات (دورات المستويات)
                    </td>
                    <td className="p-2 text-center">{langStaff.length}</td>
                    <td className="p-2 text-end">{langTotals.baseDue.toLocaleString()} دج</td>
                    <td className="p-2 text-end text-emerald-700 font-bold">
                      {langTotals.totalAnnual.toLocaleString()} دج
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 font-sans font-semibold text-slate-900">
                      4. مدربو السوربان والحساب الذهني
                    </td>
                    <td className="p-2 text-center">{srbStaff.length}</td>
                    <td className="p-2 text-end">{srbTotals.baseDue.toLocaleString()} دج</td>
                    <td className="p-2 text-end text-emerald-700 font-bold">
                      {srbTotals.totalAnnual.toLocaleString()} دج
                    </td>
                  </tr>
                </tbody>
              </table>
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
            {contextMenu.staff.name}
          </div>
          <button
            onClick={() => {
              setEditingStaff(contextMenu.staff);
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-blue-50 text-slate-800 flex items-center gap-2"
          >
            <Edit2 className="w-3.5 h-3.5 text-blue-800" />
            تعديل بيانات وراتب الموظف
          </button>
          <button
            onClick={() => {
              setSelectedPayslip(contextMenu.staff);
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-emerald-50 text-slate-800 flex items-center gap-2"
          >
            <FileCheck className="w-3.5 h-3.5 text-emerald-700" />
            معاينة قسيمة الراتب (Payslip)
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `${contextMenu.staff.name} - ${contextMenu.staff.role} - الراتب: ${contextMenu.staff.baseDue} دج`
              );
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-blue-50 text-slate-800 flex items-center gap-2"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            نسخ ملخص الموظف
          </button>
          <div className="border-t border-slate-200 my-1" />
          <button
            onClick={() => handleDeleteStaff(contextMenu.staff.id)}
            className="w-full text-start px-3 py-1.5 hover:bg-rose-50 text-rose-700 flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            حذف الموظف
          </button>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">تعديل بيانات وراتب الموظف</span>
              <button
                onClick={() => setEditingStaff(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditStaff} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">الاسم واللقب *</label>
                <input
                  type="text"
                  required
                  value={editingStaff.name}
                  onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">القسم / الفئة</label>
                  <select
                    value={editingStaff.category}
                    onChange={(e) => setEditingStaff({ ...editingStaff, category: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white"
                  >
                    <option value="admin">1. الإدارة والسكرتارية</option>
                    <option value="prep">2. أساتذة التحضيري</option>
                    <option value="languages">3. مدربو اللغات</option>
                    <option value="soroban">4. مدربو السوربان</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المسمى الوظيفي</label>
                  <input
                    type="text"
                    value={editingStaff.role}
                    onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    الراتب المستحق شهرياً (دج)
                  </label>
                  <input
                    type="number"
                    value={editingStaff.baseDue}
                    onChange={(e) =>
                      setEditingStaff({ ...editingStaff, baseDue: Number(e.target.value) })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">عدد الأطفال (إن وجد)</label>
                  <input
                    type="number"
                    value={editingStaff.kidCount || 0}
                    onChange={(e) =>
                      setEditingStaff({ ...editingStaff, kidCount: Number(e.target.value) })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ملاحظات</label>
                <input
                  type="text"
                  value={editingStaff.notes}
                  onChange={(e) => setEditingStaff({ ...editingStaff, notes: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
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

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">
                إضافة موظف / أستاذ جديد لجدول الرواتب
              </span>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewStaff} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">الاسم واللقب *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ياسمين حمودي"
                  value={newStaffForm.name}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">القسم / الفئة</label>
                  <select
                    value={newStaffForm.category}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, category: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50"
                  >
                    <option value="admin">1. الإدارة والسكرتارية</option>
                    <option value="prep">2. أساتذة التحضيري</option>
                    <option value="languages">3. مدربو اللغات</option>
                    <option value="soroban">4. مدربو السوربان</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المسمى الوظيفي</label>
                  <input
                    type="text"
                    placeholder="مثال: أستاذة لغة إنجليزية"
                    value={newStaffForm.role}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, role: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    الراتب الشهري الأساسي (دج)
                  </label>
                  <input
                    type="number"
                    value={newStaffForm.baseDue}
                    onChange={(e) =>
                      setNewStaffForm({ ...newStaffForm, baseDue: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">تاريخ بداية العمل</label>
                  <input
                    type="date"
                    value={newStaffForm.startDate}
                    onChange={(e) =>
                      setNewStaffForm({ ...newStaffForm, startDate: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ملاحظات</label>
                <input
                  type="text"
                  placeholder="ملاحظات العقد أو الفوج..."
                  value={newStaffForm.notes}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, notes: e.target.value })}
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
                  تأكيد الإضافة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payslip Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md p-5 text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-700" />
                <span className="font-bold text-slate-900 text-sm">
                  قسيمة الراتب الشهري (Payslip Voucher)
                </span>
              </div>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 space-y-2 text-slate-800">
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-500">المستفيد:</span>
                <strong className="text-slate-900">{selectedPayslip.name}</strong>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-500">المسمى الوظيفي:</span>
                <span>{selectedPayslip.role}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-500">الموسم الدراسي:</span>
                <span>{selectedYear}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-500">الراتب الأساسي الصافي:</span>
                <strong className="text-emerald-800 font-mono text-sm">
                  {selectedPayslip.baseDue.toLocaleString()} دج
                </strong>
              </div>
              <div className="text-[10px] text-slate-500 pt-1">
                ملاحظات: {selectedPayslip.notes}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-bold flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                طباعة القسيمة
              </button>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100"
              >
                إغلاق
              </button>
            </div>
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
                  دليل وإرشادات استخدام جدول الرواتب الشهرية الثابتة (مركز بجاية)
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
                <strong>الهدف من الواجهة:</strong> دفتر سنوي شامل ومبوب لأجور الطواقم الثابتة
                والمؤطرين لشهور الموسم الـ 11 (من سبتمبر إلى جويلية).
              </p>
              <ul className="list-disc list-inside space-y-1 bg-slate-50 p-2.5 border border-slate-200">
                <li>
                  <strong>أقسام السجل الـ 4:</strong> أجور الإدارة، أساتذة التحضيري، مدربو اللغات،
                  ومدربو السوربان مع مجاميع فرعية ومجموع عام نهائي.
                </li>
                <li>
                  <strong>تسجيل السداد بنقرة واحدة:</strong> انقر مباشرة على خانة أي شهر لتسجيل سداد
                  الراتب أو إلغائه فورياً مع تحديث المجاميع تلقائياً.
                </li>
                <li>
                  <strong>الزر الأيمن للفأرة:</strong> يتيح تعديل بيانات الموظف، استخراج قسيمة الراتب
                  (Payslip)، أو حذف السجل.
                </li>
                <li>
                  <strong>تبويب الإعدادات والمتغيرات:</strong> ضبط المعاملات وسلم الأجور ليحل النظام
                  محل ملفات Excel بالكامل.
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
