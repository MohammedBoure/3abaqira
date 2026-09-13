import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Users,
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle,
  FileText,
  Edit2,
  Trash2,
  Archive,
  Plus,
  X,
  Download,
  Printer,
  Search,
  Info,
  HelpCircle,
  Check,
  RotateCcw,
  Copy,
  ChevronDown,
  Layers,
  Sparkles,
  DollarSign,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import { ReceiptVoucherModal } from '../common/ReceiptVoucherModal';
import { MOCK_RAWDA_STUDENTS, RAWDA_MONTHS } from '../../../mock/rawdaMockData';

export function RawdaStudentsRosterView() {
  const [students, setStudents] = useState(() => {
    // Generate a robust pool of 120+ students for realistic lazy loading demo
    const base = [...MOCK_RAWDA_STUDENTS];
    if (base.length < 50) {
      const extraCategories = ['Bébé', 'Petit Section', 'Moyen Section', 'Grand Section'];
      const firstNames = ['يوسف', 'مريم', 'أنس', 'خديجة', 'ريان', 'أميرة', 'هارون', 'إيناس', 'معاذ', 'أسماء', 'بلال', 'سارة', 'لقمان', 'نور', 'ياسين', 'هبة'];
      const lastNames = ['براهيمي', 'بن عامر', 'طاهري', 'منصوري', 'علوي', 'حميدي', 'سليماني', 'دحماني', 'سعيدي', 'قاسم', 'بلقاسم', 'زروقي', 'بوعكاز'];
      
      for (let i = base.length + 1; i <= 120; i++) {
        const cat = extraCategories[i % extraCategories.length];
        const hasAnnual = i % 7 === 0;
        const fn = firstNames[i % firstNames.length];
        const ln = lastNames[i % lastNames.length];
        const fullName = `${fn} ${ln}`;
        
        const mObj = {};
        RAWDA_MONTHS.forEach((m, mIdx) => {
          if (hasAnnual) {
            mObj[m.id] = { paid: 0, status: 'عرض سنوي', receipt: `REC-RWD-ANN-${i}` };
          } else if (mIdx < 5) {
            mObj[m.id] = { paid: 14500, status: 'مسدد', receipt: `REC-RWD-26-${100 + i}` };
          } else {
            mObj[m.id] = { paid: 0, status: 'مستحق', receipt: '' };
          }
        });

        base.push({
          id: `RWD-${String(i).padStart(3, '0')}`,
          seqNumber: i,
          ageCategory: cat,
          fullName,
          registrationFee: 8000,
          annualOffer: hasAnnual ? 121500 : 0,
          monthlyDue: hasAnnual ? 0 : 14500,
          paymentStatus: hasAnnual ? 'خالص كلياً' : (i % 5 === 0 ? 'توجد ديون' : 'مسدد شهرياً'),
          guardianPhone: `0550 ${String(10 + (i % 80)).padStart(2, '0')} ${String(20 + (i % 70)).padStart(2, '0')} ${String(30 + (i % 60)).padStart(2, '0')}`,
          guardianName: `ولي أمر ${fullName}`,
          room: cat === 'Bébé' ? 'Bébé' : `${cat} 1`,
          months: mObj,
          totalPaid: hasAnnual ? 129500 : (i % 5 === 0 ? 51500 : 80500),
          remainingBalance: i % 5 === 0 ? 29000 : 0,
        });
      }
    }
    return base;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [ageFilter, setAgeFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [isCurrentMonthOnly, setIsCurrentMonthOnly] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2025-2026');

  // Lazy loading state
  const [visibleCount, setVisibleCount] = useState(50);

  // Modals state
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null); // Full edit modal
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  // Inline Cell Editing State
  const [editingCell, setEditingCell] = useState(null); // { studentId, field, monthId }
  const [cellEditVal, setCellEditVal] = useState('');

  // Right-Click Context Menu State
  const [contextMenu, setContextMenu] = useState(null); // { x, y, student, columnId, monthId }

  // New Student Form State
  const [newStudentData, setNewStudentData] = useState({
    fullName: '',
    ageCategory: 'Bébé',
    guardianName: '',
    guardianPhone: '',
    hasAnnualOffer: false,
    registrationFee: 8000,
    monthlyDue: 14500,
  });
  const [validationError, setValidationError] = useState('');

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = () => setContextMenu(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // 1. KPI Calculations
  const totalStudents = students.length;
  const totalRegistrationRevenue = students.reduce((acc, s) => acc + (s.registrationFee || 0), 0);
  const currentMonthSubscriptions = students.reduce((acc, s) => {
    const feb = s.months?.feb;
    return acc + (feb && feb.paid ? feb.paid : 0);
  }, 0);
  const totalDebts = students.reduce((acc, s) => acc + (s.remainingBalance || 0), 0);

  const kpiCards = [
    {
      label: 'إجمالي الأطفال المسجلين',
      value: `${totalStudents} طفل`,
      icon: Users,
      subtext: 'موزعين على 10 قاعات وأفواج',
      change: '+6 هذا الموسم',
      isPositive: true,
    },
    {
      label: 'مداخيل حقوق التسجيل المحصلة',
      value: `${totalRegistrationRevenue.toLocaleString()} دج`,
      icon: CreditCard,
      subtext: 'القيمة القياسية: 8,000 دج / طفل',
      change: '100% مسدد',
      isPositive: true,
    },
    {
      label: 'اشتراكات الشهر الجاري (فيفري)',
      value: `${currentMonthSubscriptions.toLocaleString()} دج`,
      icon: Calendar,
      subtext: 'تحصيل الاشتراكات والخدمات الشهرية',
      change: 'منتظم',
      isPositive: true,
    },
    {
      label: 'المتأخرات والديون العالقة',
      value: `${totalDebts.toLocaleString()} دج`,
      icon: AlertCircle,
      subtext: 'اشتراكات غير مسددة قيد المتابعة',
      change: totalDebts > 0 ? 'مستحق' : '0 دج',
      isPositive: totalDebts === 0,
    },
  ];

  // 2. Search & Filter
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.guardianPhone.includes(searchTerm) ||
        (s.id && s.id.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchAge = ageFilter === 'ALL' || s.ageCategory === ageFilter;
      const matchPayment = paymentFilter === 'ALL' || s.paymentStatus === paymentFilter;
      return matchSearch && matchAge && matchPayment;
    });
  }, [students, searchTerm, ageFilter, paymentFilter]);

  // Displayed students restricted by lazy loading visible count
  const displayedStudents = useMemo(() => {
    return filteredStudents.slice(0, visibleCount);
  }, [filteredStudents, visibleCount]);

  // Handle Right Click Context Menu
  const handleCellContextMenu = (e, student, columnId, monthId = null) => {
    e.preventDefault();
    e.stopPropagation();

    // Clamp coordinates inside window viewport
    const menuWidth = 220;
    const menuHeight = 240;
    const x = e.clientX + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 10 : e.clientX;
    const y = e.clientY + menuHeight > window.innerHeight ? window.innerHeight - menuHeight - 10 : e.clientY;

    setContextMenu({
      x,
      y,
      student,
      columnId,
      monthId,
    });
  };

  // Inline Cell Edit Trigger
  const startInlineEdit = (studentId, field, initialValue, monthId = null) => {
    setEditingCell({ studentId, field, monthId });
    setCellEditVal(String(initialValue ?? ''));
  };

  // Commit Inline Cell Edit
  const commitInlineEdit = () => {
    if (!editingCell) return;
    const { studentId, field, monthId } = editingCell;

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;

        const updated = { ...s };

        if (field === 'fullName') {
          updated.fullName = cellEditVal.trim() || updated.fullName;
        } else if (field === 'ageCategory') {
          updated.ageCategory = cellEditVal;
        } else if (field === 'registrationFee') {
          updated.registrationFee = Math.max(0, parseFloat(cellEditVal) || 0);
        } else if (field === 'monthlyDue') {
          updated.monthlyDue = Math.max(0, parseFloat(cellEditVal) || 0);
        } else if (field === 'month' && monthId) {
          const numVal = Math.max(0, parseFloat(cellEditVal) || 0);
          const currentMonth = updated.months?.[monthId] || {};
          updated.months = {
            ...updated.months,
            [monthId]: {
              ...currentMonth,
              paid: numVal,
              status: numVal >= (updated.monthlyDue || 14500) ? 'مسدد' : (numVal > 0 ? 'جزئي' : 'مستحق'),
              receipt: numVal > 0 ? (currentMonth.receipt || `REC-RWD-26-${s.seqNumber}`) : '',
            },
          };
        }

        // Recompute totals
        let totalMonthsPaid = 0;
        let totalMonthsDue = 0;
        RAWDA_MONTHS.forEach((m) => {
          if (updated.annualOffer > 0) {
            // Prepaid in annual offer
          } else {
            const mPaid = updated.months?.[m.id]?.paid || 0;
            totalMonthsPaid += mPaid;
            totalMonthsDue += updated.monthlyDue || 14500;
          }
        });

        if (updated.annualOffer > 0) {
          updated.totalPaid = (updated.registrationFee || 0) + (updated.annualOffer || 0);
          updated.remainingBalance = 0;
          updated.paymentStatus = 'خالص كلياً';
        } else {
          updated.totalPaid = (updated.registrationFee || 0) + totalMonthsPaid;
          updated.remainingBalance = Math.max(0, totalMonthsDue - totalMonthsPaid);
          updated.paymentStatus = updated.remainingBalance === 0 ? 'مسدد شهرياً' : 'توجد ديون';
        }

        return updated;
      })
    );

    setEditingCell(null);
    setCellEditVal('');
  };

  // Quick context menu state mutation for a month cell
  const handleQuickMonthStatusChange = (statusType, customAmount = null) => {
    if (!contextMenu || !contextMenu.student || !contextMenu.monthId) return;
    const { student, monthId } = contextMenu;

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== student.id) return s;
        const updated = { ...s };
        const curMonths = { ...updated.months };
        const prevM = curMonths[monthId] || {};

        let paid = 0;
        let status = 'مستحق';
        let receipt = '';

        if (statusType === 'PAID') {
          paid = customAmount !== null ? customAmount : (updated.monthlyDue || 14500);
          status = 'مسدد';
          receipt = prevM.receipt || `REC-RWD-26-${String(s.seqNumber).padStart(4, '0')}`;
        } else if (statusType === 'ANNUAL') {
          paid = 0;
          status = 'عرض سنوي';
          receipt = prevM.receipt || `REC-RWD-ANN-${String(s.seqNumber).padStart(2, '0')}`;
        } else if (statusType === 'UNPAID') {
          paid = 0;
          status = 'مستحق';
          receipt = '';
        }

        curMonths[monthId] = { paid, status, receipt };
        updated.months = curMonths;

        // Recompute
        let totalMonthsPaid = 0;
        RAWDA_MONTHS.forEach((m) => {
          totalMonthsPaid += curMonths[m.id]?.paid || 0;
        });

        if (updated.annualOffer > 0) {
          updated.totalPaid = (updated.registrationFee || 0) + updated.annualOffer;
          updated.remainingBalance = 0;
          updated.paymentStatus = 'خالص كلياً';
        } else {
          const totalExpected = (updated.monthlyDue || 14500) * 11;
          updated.totalPaid = (updated.registrationFee || 0) + totalMonthsPaid;
          updated.remainingBalance = Math.max(0, totalExpected - totalMonthsPaid);
          updated.paymentStatus = updated.remainingBalance === 0 ? 'مسدد شهرياً' : 'توجد ديون';
        }

        return updated;
      })
    );

    setContextMenu(null);
  };

  // 3. Add Student Handler
  const handleSaveStudent = (e) => {
    e.preventDefault();
    if (!newStudentData.fullName.trim()) {
      setValidationError('يرجى كتابة الاسم واللقب الكامل للطفل');
      return;
    }

    const regFee = parseFloat(newStudentData.registrationFee) || 8000;
    const annualOfferAmount = newStudentData.hasAnnualOffer ? 121500 : 0;
    const monthlyDue = newStudentData.hasAnnualOffer ? 0 : 14500;
    const seq = students.length + 1;
    const newId = `RWD-${String(seq).padStart(3, '0')}`;

    const monthsObj = {};
    RAWDA_MONTHS.forEach((m) => {
      if (newStudentData.hasAnnualOffer) {
        monthsObj[m.id] = { paid: 0, status: 'عرض سنوي', receipt: `REC-RWD-ANN-${seq}` };
      } else {
        monthsObj[m.id] = { paid: 0, status: 'مستحق', receipt: '' };
      }
    });

    const newEntry = {
      id: newId,
      seqNumber: seq,
      ageCategory: newStudentData.ageCategory,
      fullName: newStudentData.fullName,
      registrationFee: regFee,
      annualOffer: annualOfferAmount,
      monthlyDue: monthlyDue,
      paymentStatus: newStudentData.hasAnnualOffer ? 'خالص كلياً' : 'مسدد شهرياً',
      guardianPhone: newStudentData.guardianPhone || '0550 00 00 00',
      guardianName: newStudentData.guardianName || 'ولي الأمر',
      room: newStudentData.ageCategory === 'Bébé' ? 'Bébé' : `${newStudentData.ageCategory} 1`,
      months: monthsObj,
      totalPaid: newStudentData.hasAnnualOffer ? 129500 : regFee,
      remainingBalance: newStudentData.hasAnnualOffer ? 0 : (monthlyDue * 11),
    };

    setStudents([newEntry, ...students]);
    setIsNewStudentModalOpen(false);
    setNewStudentData({
      fullName: '',
      ageCategory: 'Bébé',
      guardianName: '',
      guardianPhone: '',
      hasAnnualOffer: false,
      registrationFee: 8000,
      monthlyDue: 14500,
    });
    setValidationError('');
  };

  // Full Edit Student Handler
  const handleSaveFullEdit = (e) => {
    e.preventDefault();
    if (!editingStudent) return;

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== editingStudent.id) return s;
        const updated = { ...editingStudent };

        let totalMonthsPaid = 0;
        let totalMonthsDue = 0;
        RAWDA_MONTHS.forEach((m) => {
          if (updated.annualOffer > 0) {
            // prepaid
          } else {
            totalMonthsPaid += updated.months?.[m.id]?.paid || 0;
            totalMonthsDue += updated.monthlyDue || 14500;
          }
        });

        if (updated.annualOffer > 0) {
          updated.totalPaid = (updated.registrationFee || 0) + updated.annualOffer;
          updated.remainingBalance = 0;
          updated.paymentStatus = 'خالص كلياً';
        } else {
          updated.totalPaid = (updated.registrationFee || 0) + totalMonthsPaid;
          updated.remainingBalance = Math.max(0, totalMonthsDue - totalMonthsPaid);
          updated.paymentStatus = updated.remainingBalance === 0 ? 'مسدد شهرياً' : 'توجد ديون';
        }

        return updated;
      })
    );

    setEditingStudent(null);
  };

  // Open Receipt Voucher
  const handleOpenVoucher = (student) => {
    setSelectedVoucher({
      receiptNumber: `REC-RWD-26-${String(student.seqNumber).padStart(4, '0')}`,
      payerName: student.fullName,
      category: `روضة وحضانة العباقرة - ${student.ageCategory}`,
      amount: student.annualOffer > 0 ? 129500 : (student.registrationFee + student.monthlyDue),
      paymentMethod: 'نقداً (صندوق الروضة)',
      branch: 'روضة وحضانة العباقرة',
      notes: student.annualOffer > 0 ? 'سداد العرض السنوي الشامل مع حقوق التسجيل' : 'سداد حقوق التسجيل واشتراك الشهر الجاري',
    });
  };

  // CSV Export Utility
  const handleExportCSV = () => {
    try {
      const headers = ['الرقم', 'فئة العمر', 'الاسم واللقب', 'حقوق التسجيل', 'العرض السنوي', 'المستحق شهرياً', 'المحصل الإجمالي', 'الديون', 'حالة الدفع', 'الهاتف'];
      const csvRows = [headers.join(',')];

      for (const s of filteredStudents) {
        const row = [
          s.seqNumber,
          `"${s.ageCategory}"`,
          `"${s.fullName}"`,
          s.registrationFee || 0,
          s.annualOffer || 0,
          s.monthlyDue || 0,
          s.totalPaid || 0,
          s.remainingBalance || 0,
          `"${s.paymentStatus}"`,
          `"${s.guardianPhone}"`,
        ];
        csvRows.push(row.join(','));
      }

      const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `المداخيل_والتسجيلات_${selectedYear}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export CSV error', err);
    }
  };

  return (
    <div className="space-y-2.5 print:p-0">
      {/* 1. COMPACT TOP HEADER BAR (Eliminates bulky banner to save vertical screen real estate) */}
      <div className="bg-white border border-slate-200 px-3 py-2 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-blue-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                المداخيل و التسجيلات
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                روضة وحضانة الأطفال
              </span>
              {/* Exclamation / Info button triggering the Guide & Information Modal */}
              <button
                onClick={() => setIsInfoModalOpen(true)}
                className="w-5 h-5 rounded-full bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-900 flex items-center justify-center transition-colors"
                title="معلومات وتفاصيل الواجهة والتعليمات التشغيلية"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              إدارة اشتراكات الموسم الـ 11 شهراً، متابعة حقوق التسجيل والعروض السنوية، والتحكم الفوري بالدفعات.
            </p>
          </div>
        </div>

        {/* Academic Year Switcher (Frontend multi-year selector) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 px-2 py-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-blue-900" />
            <span className="font-semibold text-slate-700 text-[11px] hidden md:inline">الموسم:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent font-mono font-bold text-slate-900 text-xs focus:outline-none cursor-pointer"
            >
              <option value="2024-2025">2024 - 2025</option>
              <option value="2025-2026">2025 - 2026 (الحالي)</option>
              <option value="2026-2027">2026 - 2027</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. COMPACT 4 KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 print:hidden">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon || Users;
          return (
            <div
              key={idx}
              className="bg-white border border-slate-200 px-3 py-2 flex flex-col justify-between shadow-2xs hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center justify-between text-slate-500 mb-0.5">
                <span className="text-[11px] font-medium text-slate-600 truncate">{card.label}</span>
                <Icon className="w-3.5 h-3.5 text-blue-900 shrink-0" />
              </div>
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-base sm:text-lg font-bold font-mono text-slate-900 tracking-tight">
                  {card.value}
                </span>
                {card.change && (
                  <span
                    className={`text-[9px] font-medium font-mono px-1 py-0.2 rounded-[2px] ${
                      card.isPositive !== false
                        ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                        : 'text-rose-700 bg-rose-50 border border-rose-200'
                    }`}
                  >
                    {card.change}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. COMPACT TOOLBAR DIRECTLY ABOVE TABLE (Icon-only actions to maximize screen space) */}
      <div className="bg-white border border-slate-200 px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs print:hidden">
        {/* Right side: Search and Category/Payment Filters */}
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute inset-y-0 start-2.5 my-auto text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث بالاسم، الهاتف أو الرمز..."
              className="w-full h-7 ps-8 pe-2 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-900 focus:outline-none transition-colors"
            />
          </div>

          <select
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value)}
            className="h-7 px-2 text-xs bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:border-blue-900"
          >
            <option value="ALL">كافة فئات العمر</option>
            <option value="Bébé">Bébé (الرضع)</option>
            <option value="Petit Section">Petit Section (الصغار)</option>
            <option value="Moyen Section">Moyen Section (المتوسطين)</option>
            <option value="Grand Section">Grand Section (الكبار)</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="h-7 px-2 text-xs bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:border-blue-900"
          >
            <option value="ALL">كافة حالات الدفع</option>
            <option value="خالص كلياً">خالص كلياً</option>
            <option value="مسدد شهرياً">مسدد شهرياً</option>
            <option value="توجد ديون">توجد ديون</option>
          </select>

          {/* 11 Months vs Current Month Toggle */}
          <button
            onClick={() => setIsCurrentMonthOnly(!isCurrentMonthOnly)}
            className={`h-7 px-2 text-xs border font-medium flex items-center gap-1 transition-colors ${
              isCurrentMonthOnly
                ? 'bg-blue-900 text-white border-blue-900'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
            title="التبديل بين عرض الـ 11 شهراً كاملة أو شهر فيفري فقط"
          >
            <Calendar className="w-3 h-3" />
            <span className="text-[11px]">{isCurrentMonthOnly ? 'شهر فيفري فقط' : 'الـ 11 شهراً'}</span>
          </button>
        </div>

        {/* Left side: Loaded count badge & Icon-only Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Lazy Loading Count Indicator (e.g. 50 / 120 محمل) */}
          <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-slate-100 border border-slate-300 text-slate-700">
            {displayedStudents.length} / {filteredStudents.length} محمل
          </span>

          {/* Add Student Button (Icon-only with tooltip) */}
          <button
            onClick={() => setIsNewStudentModalOpen(true)}
            className="w-7 h-7 bg-blue-900 hover:bg-blue-800 text-white flex items-center justify-center transition-colors shadow-2xs"
            title="تسجيل طفل جديد في الروضة"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* CSV Export Button (Icon-only with tooltip) */}
          <button
            onClick={handleExportCSV}
            className="w-7 h-7 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 flex items-center justify-center transition-colors"
            title="تصدير جدول البيانات الحالي كـ CSV"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Print Button (Icon-only with tooltip) */}
          <button
            onClick={() => window.print()}
            className="w-7 h-7 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 flex items-center justify-center transition-colors"
            title="طباعة الجدول الحالي"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. HIGH-DENSITY INTERACTIVE EXCEL-GRADE DATA TABLE */}
      <div className="bg-white border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto max-h-[620px]">
          <table className="w-full text-start text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-300 text-slate-700 font-bold select-none text-[11px]">
              <tr>
                <th className="p-1.5 text-center border-e border-slate-200 w-10">#</th>
                <th className="p-1.5 text-start border-e border-slate-200 min-w-[100px]">فئة العمر</th>
                <th className="p-1.5 text-start border-e border-slate-200 min-w-[150px]">الاسم واللقب</th>
                <th className="p-1.5 text-end border-e border-slate-200 min-w-[80px]">حقوق التسجيل</th>
                <th className="p-1.5 text-end border-e border-slate-200 min-w-[95px]">العرض السنوي</th>
                <th className="p-1.5 text-end border-e border-slate-200 min-w-[90px]">المستحق شهرياً</th>

                {/* 11 Months columns or current month */}
                {isCurrentMonthOnly ? (
                  <th className="p-1.5 text-center border-e border-slate-200 min-w-[100px] bg-blue-50 text-blue-900">
                    شهر فيفري (الحالي)
                  </th>
                ) : (
                  RAWDA_MONTHS.map((m) => (
                    <th key={m.id} className="p-1 text-center border-e border-slate-200 min-w-[58px] font-mono text-[10px]">
                      {m.shortAr}
                    </th>
                  ))
                )}

                <th className="p-1.5 text-center border-e border-slate-200 min-w-[85px]">حالة الدفع</th>
                <th className="p-1.5 text-end border-e border-slate-200 min-w-[80px]">الديون (دج)</th>
                <th className="p-1.5 text-center min-w-[90px] print:hidden">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800 font-sans text-xs">
              {displayedStudents.length === 0 ? (
                <tr>
                  <td colSpan={isCurrentMonthOnly ? 9 : 19} className="p-8 text-center text-slate-400">
                    لا توجد نتائج مطابقة لمعايير البحث الحالية
                  </td>
                </tr>
              ) : (
                displayedStudents.map((s) => (
                  <tr
                    key={s.id}
                    onContextMenu={(e) => handleCellContextMenu(e, s, 'ROW')}
                    className="hover:bg-blue-50/50 transition-colors h-8"
                  >
                    {/* Index */}
                    <td
                      onContextMenu={(e) => handleCellContextMenu(e, s, 'seqNumber')}
                      className="p-1 text-center border-e border-slate-200 font-mono text-slate-500 font-bold"
                    >
                      {s.seqNumber}
                    </td>

                    {/* Age Category (Inline editable on click) */}
                    <td
                      onContextMenu={(e) => handleCellContextMenu(e, s, 'ageCategory')}
                      className="p-1 border-e border-slate-200 cursor-pointer"
                      onClick={() => startInlineEdit(s.id, 'ageCategory', s.ageCategory)}
                    >
                      {editingCell?.studentId === s.id && editingCell?.field === 'ageCategory' ? (
                        <select
                          autoFocus
                          value={cellEditVal}
                          onChange={(e) => setCellEditVal(e.target.value)}
                          onBlur={commitInlineEdit}
                          className="w-full text-[11px] p-0.5 border border-blue-600 bg-white"
                        >
                          <option value="Bébé">Bébé</option>
                          <option value="Petit Section">Petit Section</option>
                          <option value="Moyen Section">Moyen Section</option>
                          <option value="Grand Section">Grand Section</option>
                        </select>
                      ) : (
                        <span
                          className={`px-1.5 py-0.2 text-[10px] font-bold rounded-[2px] ${
                            s.ageCategory === 'Bébé'
                              ? 'bg-pink-100 text-pink-800'
                              : s.ageCategory === 'Petit Section'
                              ? 'bg-amber-100 text-amber-800'
                              : s.ageCategory === 'Moyen Section'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {s.ageCategory}
                        </span>
                      )}
                    </td>

                    {/* Full Name (Inline editable on click) */}
                    <td
                      onContextMenu={(e) => handleCellContextMenu(e, s, 'fullName')}
                      className="p-1 border-e border-slate-200 font-semibold text-slate-900 cursor-pointer"
                      onClick={() => startInlineEdit(s.id, 'fullName', s.fullName)}
                    >
                      {editingCell?.studentId === s.id && editingCell?.field === 'fullName' ? (
                        <input
                          autoFocus
                          type="text"
                          value={cellEditVal}
                          onChange={(e) => setCellEditVal(e.target.value)}
                          onBlur={commitInlineEdit}
                          onKeyDown={(e) => e.key === 'Enter' && commitInlineEdit()}
                          className="w-full text-xs p-0.5 border border-blue-600 bg-white"
                        />
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="truncate">{s.fullName}</span>
                          <span className="text-[9px] font-mono text-slate-400 ms-1 hidden sm:inline">{s.guardianPhone}</span>
                        </div>
                      )}
                    </td>

                    {/* Registration Fee (Inline editable) */}
                    <td
                      onContextMenu={(e) => handleCellContextMenu(e, s, 'registrationFee')}
                      className="p-1 text-end border-e border-slate-200 font-mono cursor-pointer"
                      onClick={() => startInlineEdit(s.id, 'registrationFee', s.registrationFee)}
                    >
                      {editingCell?.studentId === s.id && editingCell?.field === 'registrationFee' ? (
                        <input
                          autoFocus
                          type="number"
                          value={cellEditVal}
                          onChange={(e) => setCellEditVal(e.target.value)}
                          onBlur={commitInlineEdit}
                          onKeyDown={(e) => e.key === 'Enter' && commitInlineEdit()}
                          className="w-16 text-end text-xs p-0.5 border border-blue-600 bg-white font-mono"
                        />
                      ) : (
                        <span>{s.registrationFee ? `${s.registrationFee.toLocaleString()}` : '-'}</span>
                      )}
                    </td>

                    {/* Annual Offer */}
                    <td
                      onContextMenu={(e) => handleCellContextMenu(e, s, 'annualOffer')}
                      className="p-1 text-end border-e border-slate-200 font-mono"
                    >
                      {s.annualOffer > 0 ? (
                        <span className="text-emerald-700 font-bold">121,500</span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Monthly Due (Inline editable) */}
                    <td
                      onContextMenu={(e) => handleCellContextMenu(e, s, 'monthlyDue')}
                      className="p-1 text-end border-e border-slate-200 font-mono cursor-pointer"
                      onClick={() => startInlineEdit(s.id, 'monthlyDue', s.monthlyDue)}
                    >
                      {editingCell?.studentId === s.id && editingCell?.field === 'monthlyDue' ? (
                        <input
                          autoFocus
                          type="number"
                          value={cellEditVal}
                          onChange={(e) => setCellEditVal(e.target.value)}
                          onBlur={commitInlineEdit}
                          onKeyDown={(e) => e.key === 'Enter' && commitInlineEdit()}
                          className="w-16 text-end text-xs p-0.5 border border-blue-600 bg-white font-mono"
                        />
                      ) : (
                        <span>{s.monthlyDue > 0 ? `${s.monthlyDue.toLocaleString()}` : <span className="text-slate-400">0</span>}</span>
                      )}
                    </td>

                    {/* Months breakdown (Inline click & Right-click supported) */}
                    {isCurrentMonthOnly ? (
                      <td
                        onContextMenu={(e) => handleCellContextMenu(e, s, 'month', 'feb')}
                        className="p-1 text-center border-e border-slate-200 bg-blue-50/40 cursor-pointer"
                        onClick={() => {
                          const curPaid = s.months?.feb?.paid || 0;
                          const nextVal = curPaid > 0 ? 0 : (s.monthlyDue || 14500);
                          startInlineEdit(s.id, 'month', nextVal, 'feb');
                        }}
                      >
                        {s.annualOffer > 0 ? (
                          <span className="text-[10px] text-emerald-700 font-bold">سنوي ✓</span>
                        ) : s.months?.feb?.status === 'مسدد' ? (
                          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                            {s.months.feb.paid?.toLocaleString()} ✓
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 text-[10px] font-bold">
                            مستحق
                          </span>
                        )}
                      </td>
                    ) : (
                      RAWDA_MONTHS.map((m) => {
                        const mData = s.months?.[m.id];
                        const isPaid = mData?.status === 'مسدد' || s.annualOffer > 0;
                        const isEditingThis = editingCell?.studentId === s.id && editingCell?.field === 'month' && editingCell?.monthId === m.id;

                        return (
                          <td
                            key={m.id}
                            onContextMenu={(e) => handleCellContextMenu(e, s, 'month', m.id)}
                            className="p-0.5 text-center border-e border-slate-200 font-mono text-[10px] cursor-pointer hover:bg-amber-50 select-none"
                            onClick={() => {
                              if (s.annualOffer > 0) return;
                              // Toggle or edit
                              const currentAmt = mData?.paid || 0;
                              const targetAmt = currentAmt > 0 ? 0 : (s.monthlyDue || 14500);
                              setCellEditVal(String(targetAmt));
                              setEditingCell({ studentId: s.id, field: 'month', monthId: m.id });
                            }}
                          >
                            {isEditingThis ? (
                              <input
                                autoFocus
                                type="number"
                                value={cellEditVal}
                                onChange={(e) => setCellEditVal(e.target.value)}
                                onBlur={commitInlineEdit}
                                onKeyDown={(e) => e.key === 'Enter' && commitInlineEdit()}
                                className="w-12 text-center text-[10px] p-0 border border-blue-600 bg-white font-mono"
                              />
                            ) : s.annualOffer > 0 ? (
                              <span className="text-emerald-700 font-bold" title="مشمول في العرض السنوي">✓</span>
                            ) : isPaid ? (
                              <span className="text-emerald-700 font-bold" title={`مسدد: ${mData?.paid} دج`}>✓</span>
                            ) : mData?.status === 'جزئي' ? (
                              <span className="text-amber-700 font-bold" title={`مسدد جزئياً: ${mData?.paid} دج`}>~</span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        );
                      })
                    )}

                    {/* Payment Status */}
                    <td
                      onContextMenu={(e) => handleCellContextMenu(e, s, 'paymentStatus')}
                      className="p-1 text-center border-e border-slate-200"
                    >
                      <span
                        className={`px-1.5 py-0.2 text-[9px] font-bold ${
                          s.paymentStatus === 'خالص كلياً'
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.paymentStatus === 'مسدد شهرياً'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {s.paymentStatus}
                      </span>
                    </td>

                    {/* Debts Balance */}
                    <td
                      onContextMenu={(e) => handleCellContextMenu(e, s, 'remainingBalance')}
                      className="p-1 text-end border-e border-slate-200 font-mono font-bold text-xs"
                    >
                      {s.remainingBalance > 0 ? (
                        <span className="text-rose-700">{s.remainingBalance.toLocaleString()}</span>
                      ) : (
                        <span className="text-emerald-700">0</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-1 text-center print:hidden">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenVoucher(s)}
                          className="px-1.5 py-0.5 bg-slate-100 hover:bg-blue-50 text-blue-900 font-medium text-[10px] flex items-center gap-0.5 border border-slate-200 transition-colors"
                          title="معاينة وطباعة وصل استلام"
                        >
                          <FileText className="w-3 h-3" />
                          <span>وصل</span>
                        </button>
                        <button
                          onClick={() => setEditingStudent({ ...s })}
                          className="p-1 hover:bg-blue-50 text-slate-500 hover:text-blue-900 transition-colors"
                          title="تعديل بيانات الطالب كاملاً"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Lazy Loading More Bar */}
        {filteredStudents.length > visibleCount && (
          <div className="p-2 bg-slate-50 border-t border-slate-200 flex items-center justify-center">
            <button
              onClick={() => setVisibleCount((prev) => prev + 50)}
              className="px-4 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
            >
              تحميل المزيد من الطلبة (+50) — معروض {displayedStudents.length} من أصل {filteredStudents.length}
            </button>
          </div>
        )}
      </div>

      {/* 5. RIGHT-CLICK CONTEXT MENU (Interactive for any cell) */}
      {contextMenu && (
        <div
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 bg-white border border-slate-300 shadow-xl py-1 text-xs text-slate-800 w-56 animate-in fade-in"
        >
          <div className="px-3 py-1 bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-700 truncate">
            {contextMenu.student?.fullName}
          </div>

          {/* Month Cell Quick Actions */}
          {contextMenu.monthId && (
            <>
              <div className="px-3 py-0.5 text-[10px] font-semibold text-slate-400">
                إجراءات شهر: {RAWDA_MONTHS.find((m) => m.id === contextMenu.monthId)?.nameAr}
              </div>
              <button
                onClick={() => handleQuickMonthStatusChange('PAID')}
                className="w-full text-start px-3 py-1.5 hover:bg-emerald-50 text-emerald-800 flex items-center gap-2"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>تعليم كـ: مسدد (14,500 دج)</span>
              </button>
              <button
                onClick={() => handleQuickMonthStatusChange('UNPAID')}
                className="w-full text-start px-3 py-1.5 hover:bg-rose-50 text-rose-800 flex items-center gap-2"
              >
                <X className="w-3.5 h-3.5 text-rose-600" />
                <span>تعليم كـ: غير مسدد (مستحق)</span>
              </button>
              <button
                onClick={() => handleQuickMonthStatusChange('ANNUAL')}
                className="w-full text-start px-3 py-1.5 hover:bg-blue-50 text-blue-900 flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>مشمول في العرض السنوي</span>
              </button>
              <div className="my-1 border-t border-slate-100" />
            </>
          )}

          {/* General Row Actions */}
          <button
            onClick={() => {
              setEditingStudent({ ...contextMenu.student });
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-slate-700"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
            <span>تعديل كامل لبيانات الطفل</span>
          </button>

          <button
            onClick={() => {
              handleOpenVoucher(contextMenu.student);
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-slate-700"
          >
            <FileText className="w-3.5 h-3.5 text-blue-800" />
            <span>إصدار وصل مالي استلام</span>
          </button>

          <button
            onClick={() => {
              const rowStr = `${contextMenu.student.fullName}\t${contextMenu.student.ageCategory}\t${contextMenu.student.registrationFee}\t${contextMenu.student.annualOffer}\t${contextMenu.student.monthlyDue}\t${contextMenu.student.totalPaid}`;
              navigator.clipboard.writeText(rowStr);
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-slate-700"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>نسخ بيانات السطر (Excel / TSV)</span>
          </button>

          <div className="my-1 border-t border-slate-100" />

          <button
            onClick={() => {
              if (confirm(`هل أنت متأكد من حذف ${contextMenu.student.fullName}؟`)) {
                setStudents((prev) => prev.filter((s) => s.id !== contextMenu.student.id));
              }
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-rose-50 text-rose-700 flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>حذف من السجل</span>
          </button>
        </div>
      )}

      {/* 6. FULL STUDENT EDIT DIALOG (Comprehensive Modal) */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-3 bg-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-300" />
                <span className="font-bold text-xs tracking-wide">
                  تعديل بيانات الطفل: {editingStudent.fullName} ({editingStudent.id})
                </span>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFullEdit} className="p-4 space-y-4 text-xs overflow-y-auto">
              {/* General Info */}
              <div>
                <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1 mb-2.5">
                  1. المعلومات الشخصية والتمدرس
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">الاسم واللقب *</label>
                    <input
                      type="text"
                      required
                      value={editingStudent.fullName}
                      onChange={(e) => setEditingStudent({ ...editingStudent, fullName: e.target.value })}
                      className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">فئة العمر والقسم</label>
                    <select
                      value={editingStudent.ageCategory}
                      onChange={(e) => setEditingStudent({ ...editingStudent, ageCategory: e.target.value })}
                      className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                    >
                      <option value="Bébé">Bébé (قسم الرضع)</option>
                      <option value="Petit Section">Petit Section (الصغار)</option>
                      <option value="Moyen Section">Moyen Section (المتوسطين)</option>
                      <option value="Grand Section">Grand Section (الكبار)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">اسم ولي الأمر</label>
                    <input
                      type="text"
                      value={editingStudent.guardianName || ''}
                      onChange={(e) => setEditingStudent({ ...editingStudent, guardianName: e.target.value })}
                      className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">هاتف ولي الأمر</label>
                    <input
                      type="tel"
                      value={editingStudent.guardianPhone}
                      onChange={(e) => setEditingStudent({ ...editingStudent, guardianPhone: e.target.value })}
                      className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Financial Contract */}
              <div>
                <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1 mb-2.5">
                  2. البيانات والاشتراكات المالية
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">حقوق التسجيل (دج)</label>
                    <input
                      type="number"
                      value={editingStudent.registrationFee}
                      onChange={(e) => setEditingStudent({ ...editingStudent, registrationFee: parseFloat(e.target.value) || 0 })}
                      className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">المستحق شهرياً (دج)</label>
                    <input
                      type="number"
                      disabled={editingStudent.annualOffer > 0}
                      value={editingStudent.monthlyDue}
                      onChange={(e) => setEditingStudent({ ...editingStudent, monthlyDue: parseFloat(e.target.value) || 0 })}
                      className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">العرض السنوي (2025)</label>
                    <div className="flex items-center gap-2 h-8 px-2 border border-slate-200 bg-slate-50">
                      <input
                        type="checkbox"
                        id="modalAnnualOffer"
                        checked={editingStudent.annualOffer > 0}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setEditingStudent({
                            ...editingStudent,
                            annualOffer: isChecked ? 121500 : 0,
                            monthlyDue: isChecked ? 0 : 14500,
                          });
                        }}
                        className="w-4 h-4 text-blue-900"
                      />
                      <label htmlFor="modalAnnualOffer" className="cursor-pointer font-bold text-slate-800">
                        121,500 دج شامل
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Month-by-month payment override */}
              <div>
                <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1 mb-2">
                  3. حالة السداد لشهور الموسم الـ 11
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 border border-slate-200 max-h-48 overflow-y-auto">
                  {RAWDA_MONTHS.map((m) => {
                    const mInfo = editingStudent.months?.[m.id] || { paid: 0, status: 'مستحق' };
                    return (
                      <div key={m.id} className="bg-white p-1.5 border border-slate-200 flex flex-col justify-between">
                        <span className="font-bold text-[11px] text-slate-800">{m.nameAr}</span>
                        <div className="mt-1 flex items-center gap-1">
                          <input
                            type="number"
                            value={mInfo.paid}
                            disabled={editingStudent.annualOffer > 0}
                            onChange={(e) => {
                              const pVal = parseFloat(e.target.value) || 0;
                              setEditingStudent({
                                ...editingStudent,
                                months: {
                                  ...editingStudent.months,
                                  [m.id]: {
                                    ...mInfo,
                                    paid: pVal,
                                    status: pVal >= (editingStudent.monthlyDue || 14500) ? 'مسدد' : (pVal > 0 ? 'جزئي' : 'مستحق'),
                                  },
                                },
                              });
                            }}
                            className="w-full text-xs p-1 border border-slate-300 font-mono disabled:bg-slate-100"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-1.5 border border-slate-300 text-slate-600 hover:bg-slate-100 font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold shadow-2xs"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. INFORMATION & GUIDE MODAL (Replaces bulky header text and explains full system) */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-3 bg-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-300" />
                <span className="font-bold text-xs tracking-wide">دليل واجهة المداخيل والتسجيلات</span>
              </div>
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs text-slate-700 leading-relaxed max-h-[75vh] overflow-y-auto">
              <div className="bg-blue-50 border border-blue-200 p-2.5 text-blue-950">
                <h4 className="font-bold mb-1">روضة وحضانة الأطفال العباقرة — شؤون الأطفال والتمدرس</h4>
                <p className="text-[11px] text-blue-900">
                  سجل الأطفال والتسجيل السنوي والشهري (Rawda Child Enrolment & 11-Month Subscriptions Registry)
                </p>
              </div>

              <div>
                <h5 className="font-bold text-slate-900 mb-1">النموذج المالي والتعريفات المعتمدة:</h5>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 ps-1">
                  <li><strong>حقوق التسجيل المبدئية:</strong> 8,000 دج سنوياً لكل طفل.</li>
                  <li><strong>العرض السنوي الشامل:</strong> 121,500 دج (يغطي الموسم كاملاً وتصبح الأقساط الشهرية 0 تلقائياً).</li>
                  <li><strong>الاشتراك الشهري القياسي:</strong> 14,500 دج / شهرياً عبر 11 شهراً (من سبتمبر إلى جويلية).</li>
                </ul>
              </div>

              <div>
                <h5 className="font-bold text-slate-900 mb-1">ميزات التفاعل السريع بالجدول:</h5>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 ps-1">
                  <li><strong>الزر الأيمن للفأرة (Right-Click):</strong> اضغط بالزر الأيمن على أي خانة لتغيير حالة السداد فوراً (مسدد، مستحق، عرض سنوي)، أو تعديل بيانات الطفل كاملة، أو إصدار وصل.</li>
                  <li><strong>التعديل المباشر (Inline Editing):</strong> اضغط على الاسم، فئة العمر، أو المبالغ للتعديل الفوري بدون مغادرة الشاشة.</li>
                  <li><strong>التحميل التدريجي (Lazy Loading):</strong> يعرض 50 طفلاً كدفعة أولى لتسريع الأداء مع إمكانية تحميل البقية بسلاسة.</li>
                </ul>
              </div>
            </div>

            <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs"
              >
                فهمت ذلك
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. NEW STUDENT REGISTRATION MODAL */}
      {isNewStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-3 bg-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-300" />
                <span className="font-bold text-xs tracking-wide">تسجيل طفل جديد في روضة الأطفال</span>
              </div>
              <button
                onClick={() => setIsNewStudentModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-4 space-y-3 text-xs">
              {validationError && (
                <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {validationError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">الاسم واللقب الكامل للطفل *</label>
                  <input
                    type="text"
                    required
                    value={newStudentData.fullName}
                    onChange={(e) => setNewStudentData({ ...newStudentData, fullName: e.target.value })}
                    placeholder="مثال: يحيى بن مهيدي"
                    className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">فئة العمر والقسم *</label>
                  <select
                    value={newStudentData.ageCategory}
                    onChange={(e) => setNewStudentData({ ...newStudentData, ageCategory: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                  >
                    <option value="Bébé">Bébé (قسم الرضع)</option>
                    <option value="Petit Section">Petit Section (الصغار)</option>
                    <option value="Moyen Section">Moyen Section (المتوسطين)</option>
                    <option value="Grand Section">Grand Section (الكبار)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">رقم هاتف ولي الأمر *</label>
                  <input
                    type="tel"
                    required
                    value={newStudentData.guardianPhone}
                    onChange={(e) => setNewStudentData({ ...newStudentData, guardianPhone: e.target.value })}
                    placeholder="0550 00 00 00"
                    className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">اسم ولي الأمر</label>
                  <input
                    type="text"
                    value={newStudentData.guardianName}
                    onChange={(e) => setNewStudentData({ ...newStudentData, guardianName: e.target.value })}
                    placeholder="اسم الأب أو الأم"
                    className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">حقوق التسجيل المبدئية (دج)</label>
                  <input
                    type="number"
                    value={newStudentData.registrationFee}
                    onChange={(e) => setNewStudentData({ ...newStudentData, registrationFee: parseFloat(e.target.value) || 0 })}
                    className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">المستحق شهرياً (دج)</label>
                  <input
                    type="number"
                    disabled={newStudentData.hasAnnualOffer}
                    value={newStudentData.hasAnnualOffer ? 0 : newStudentData.monthlyDue}
                    onChange={(e) => setNewStudentData({ ...newStudentData, monthlyDue: parseFloat(e.target.value) || 0 })}
                    className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono disabled:bg-slate-100"
                  />
                </div>

                <div className="col-span-2 bg-blue-50/50 p-2.5 border border-blue-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newStudentData.hasAnnualOffer}
                      onChange={(e) => setNewStudentData({ ...newStudentData, hasAnnualOffer: e.target.checked })}
                      className="w-4 h-4 text-blue-900 border-slate-300"
                    />
                    <div>
                      <span className="font-bold text-blue-950">اشتراك العرض السنوي (121,500 دج)</span>
                      <p className="text-[10px] text-blue-800">
                        تسديد مسبق للموسم الدراسي كاملاً (يصبح القسط الشهري 0 دج تلقائياً).
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewStudentModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-300 text-slate-600 hover:bg-slate-100 font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold shadow-2xs"
                >
                  تأكيد وحفظ الطفل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. RECEIPT VOUCHER MODAL */}
      {selectedVoucher && (
        <ReceiptVoucherModal
          voucherData={selectedVoucher}
          onClose={() => setSelectedVoucher(null)}
        />
      )}
    </div>
  );
}
