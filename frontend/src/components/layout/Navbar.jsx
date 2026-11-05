import React from 'react';
import {
  Search,
  Menu,
  CheckCircle,
  Building2,
  Baby,
  GraduationCap,
  Printer,
  FileText,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { MOCK_BRANCHES } from '../../mock/mockData';

export function Navbar({
  selectedBranch,
  onSelectBranch,
  currentLang,
  onToggleLang,
  activeView,
  onSelectView,
  onToggleSidebar,
  currentUser,
  onOpenLoginModal,
  onOpenReceiptModal,
  onOpenReportCardModal,
}) {
  const viewTitles = {
    // 9 System Report Modules
    'auth-security': 'الوحدة 1: إدارة الهوية والصلاحيات والأمان (Identity & Access)',
    'audit-logs': 'الوحدة 1: سجل الرقابة والتدقيق الأمني المالي (Audit Logs)',
    'branches': 'الوحدة 2: شبكة المقرات الـ 13 وتجهيز القاعات (13 Branches & Facilities)',
    'academic-years': 'الوحدة 2: المواسم والسنوات الأكاديمية (Academic Years)',
    'guardians': 'الوحدة 3: سجل الأفراد والعائلة والأولياء وقائمة الاستلام (People & Family)',
    'staff-hr': 'الوحدة 4: إدارة الموارد البشرية والتوظيف والحضور (Staff & HR Console)',
    'center-installment-programs': 'الوحدة 5: البرامج بنظام الدفعات (دعم، لغات، STEM)',
    'center-support-classes': 'الوحدة 5: دروس الدعم العلمي واللغات المدرسية',
    'center-languages': 'الوحدة 5: برنامج اللغات الأجنبية - دورات المستويات',
    'center-robotics': 'الوحدة 5: نادي الروبوتيك والذكاء الاصطناعي',
    'center-school-languages': 'الوحدة 5: دعم مناهج اللغات المدرسية',
    'center-soroban': 'الوحدة 5: سجل برنامج السوروبان والحساب الذهني',
    'center-quran': 'الوحدة 5: برنامج تحفيظ القرآن الكريم والتجويد',
    'center-preparatory': 'الوحدة 5: القسم التحضيري المدرسي',
    'center-summer-camp': 'الوحدة 5: النادي والمخيم الصيفي',
    'center-soroban-championships': 'الوحدة 5: سجل البطولات والمنافسات الأكاديمية',
    'center-timetable': 'الوحدة 5: جدول توقيت الأفواج والقاعات (Timetable Matrix)',
    'center-fixed-payroll': 'الوحدة 4/5: جدول الرواتب الشهرية الثابتة',
    'center-trainer-payroll': 'الوحدة 4/5: وحدة احتساب أجور المدربين (بالحصة)',
    'center-daily-expenses': 'الوحدة 8: المصاريف اليومية للمركز الأكاديمي',
    'center-cash-handover': 'الوحدة 8: سجل تسليم العهدة النقدية للمركز',
    'center-pricing-policy': 'الوحدة 8: دليل الأسعار وسياسة الخصومات المعتمدة',

    // Kindergarten Views (Module 6)
    'rawda-console': 'الوحدة 6: محطة عمل الروضة والتقارير الشهرية وسجل الحوادث',
    'kindergarten-workstation': 'الوحدة 6: محطة روضة وحضانة الأطفال الشاملة (Kindergarten Workstation)',
    'kg-bands-books': 'الوحدة 6: الأفواج العمرية والدفاتر المرقمنة (Age Bands & Numbered Books)',
    'kg-attendance': 'الوحدة 6: سجل الحضور والغياب اليومي (Daily Attendance Register)',
    'kg-daily-log': 'الوحدة 6: ورقة التقييم اليومي (Daily Child Log Sheet A/B/C)',
    'kg-monthly-reports': 'الوحدة 6: مركز اعتماد التقارير الشهرية (Monthly Report Approval Center)',
    'kg-incidents': 'الوحدة 6: سجل الحوادث والوقائع (Incident Tracker Log)',
    'kg-orthophonist': 'الوحدة 6: لوحة المتابعة الإكلينيكية والأرطوفونيا (Orthophonist Panel)',
    'kg-habits-menu': 'الوحدة 6: بروفايل عادات الأطفال وقائمة وجبات المطعم (Habits & Cafeteria)',
    'rawda-students': 'الوحدة 6: سجل الأطفال والتسجيل السنوي والشهري',
    'rawda-cohorts': 'الوحدة 6: تنظيم وقاعات الأفواج (10 قاعات للروضة)',
    'rawda-daily-expenses': 'الوحدة 8: سجل المصاريف اليومية للروضة',
    'rawda-budget-variance': 'الوحدة 8: ملخص المصاريف وتحليل الموازنة (Variance)',
    'rawda-cash-drawer': 'الوحدة 8: الملخص اليومي لصندوق الروضة',
    'rawda-cash-handover': 'الوحدة 8: سجل تسليم السيولة والعهد للروضة',
    'rawda-bread-tracking': 'الوحدة 6: المراقبة اليومية لاستهلاك الخبز والمطعم',
    'rawda-meat-provisions': 'الوحدة 6: طلبيات اللحوم والتموين الغذائي الأسبوعي',

    // Communication (Module 7)
    'communication': 'الوحدة 7: منظومة التواصل ورسائل الأولياء والإشعارات المركزية',
    'communication-center': 'الوحدة 7: مركز المراسلات الثنائية وطابور الإشعارات (Communication Center)',
    'parent-notes': 'الوحدة 7: دفتر ملاحظات الأولياء الثنائي (Parent Notes Thread)',
    'notification-queue': 'الوحدة 7: طابور الإشعارات الصادرة (Notification Queue Monitor)',

    // Finance (Module 8)
    'treasury-finance-desk': 'الوحدة 8: شباك الخزينة والمالية الموحد (Treasury & Finance Desk)',
    'finance-pricing': 'الوحدة 8: دليل الأسعار والخصومات المعتمدة (Pricing & Dynamic Overrides)',
    'finance-invoices': 'الوحدة 8: جدول الفواتير ومواعيد الأقساط (Invoices & Installments Scheduler)',
    'finance-receipts': 'الوحدة 8: شباك وصولات القبض النقدي والإلغاء (Sequential Cash Receipts)',
    'finance-drawer': 'الوحدة 8: حركة الصندوق اليومي وتسليم العهد (Daily Cash Drawer & Handovers)',
    'invoices-payments': 'الوحدة 8: إدارة الفواتير والمقبوضات وسندات القبض المتسلسلة',
    'cash-drawer': 'الوحدة 8: حركة الخزينة والصندوق اليومي الموحد',
    'pricing-plans': 'الوحدة 8: دليل الأسعار وخطط الاشتراكات',

    // Migration (Module 9)
    'data-migration': 'الوحدة 9: وحدة ترحيل سجلات إكسل ومطابقة الكاش الدفتري',
    'data-migration-console': 'الوحدة 9: منصة ترحيل وتدقيق بيانات الإكسل القديمة (Data Migration Console)',

    // Super Admin Tools
    'excel-grid': 'سجل جداول البيانات الموحد (Excel Grid)',
    'analytics': 'منظومة الإحصائيات والتحليلات القيادية',
    'system-health': 'سلامة النظام وقاعدة البيانات الموحدة',
  };

  const currentBranchObj = MOCK_BRANCHES.find((b) => b.id === selectedBranch);
  const isAcademy =
    selectedBranch === 'CENTER' ||
    (currentBranchObj && currentBranchObj.branchType === 'ACADEMY') ||
    selectedBranch.includes('ACADEMY');

  return (
    <header className="h-12 border-b border-slate-200 bg-white/95 backdrop-blur-xs flex items-center justify-between px-3 sm:px-4 z-20 flex-shrink-0 select-none">
      {/* Left: Sidebar Toggle & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
          title="تبديل القائمة الجانبية"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-500 min-w-0">
          <img
            src="/assets/branding/logo.webp"
            alt="3abaqira"
            className="w-5 h-5 rounded-full object-cover border border-blue-200 shrink-0"
          />
          <span className="font-serif font-bold text-blue-950 shrink-0">3abaqira</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-800 font-semibold truncate max-w-[160px] sm:max-w-[280px]">
            {viewTitles[activeView] || 'منظومة الإدارة'}
          </span>
          <span className="text-slate-300 hidden md:inline">/</span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.2 hidden md:inline-flex items-center gap-1 border shrink-0 ${
              isAcademy
                ? 'bg-blue-50 text-blue-900 border-blue-200'
                : 'bg-pink-50 text-pink-900 border-pink-200'
            }`}
          >
            {isAcademy ? (
              <GraduationCap className="w-3 h-3 text-blue-700" />
            ) : (
              <Baby className="w-3 h-3 text-pink-700" />
            )}
            {isAcademy ? 'أكاديمية' : 'روضة أطفال'}
          </span>
        </div>
      </div>

      {/* Center: Search Field */}
      <div className="hidden lg:flex items-center max-w-xs flex-1 mx-4">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 absolute inset-y-0 start-2.5 my-auto text-slate-400" />
          <input
            type="text"
            placeholder="بحث فوري في السجلات والملفات..."
            className="w-full h-7 ps-7 pe-10 text-xs border border-slate-200 rounded-[4px] bg-slate-50 focus:bg-white focus:border-blue-900 focus:outline-none transition-colors"
          />
          <kbd className="absolute inset-y-0 end-1.5 my-auto h-4 text-[9px] px-1 flex items-center text-slate-400 border border-slate-200 bg-white">
            Ctrl K
          </kbd>
        </div>
      </div>

      {/* Right: Actions, Printable Shortcuts & User */}
      <div className="flex items-center gap-2">
        {/* Quick Printable Action Buttons (Direct Requirement) */}
        <button
          onClick={onOpenReceiptModal}
          className="h-7 px-2.5 bg-blue-900 hover:bg-blue-800 text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
          title="فتح نموذج سند القبض المالي المتسلسل للطباعة الفورية"
        >
          <Printer className="w-3 h-3" />
          <span className="hidden sm:inline">سند قبض نقدي</span>
        </button>

        <button
          onClick={onOpenReportCardModal}
          className="h-7 px-2.5 bg-pink-700 hover:bg-pink-600 text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
          title="فتح بطاقة المتابعة الشهرية للروضة للطباعة الفورية"
        >
          <FileText className="w-3 h-3" />
          <span className="hidden sm:inline">بطاقة الروضة</span>
        </button>

        {/* Clean System Status */}
        <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-slate-500 pe-2 border-e border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
          <span className="text-slate-700 font-medium">13 فرعاً متزامنة</span>
        </div>

        {/* Language Toggle */}
        <button
          onClick={onToggleLang}
          className="h-7 px-2 border border-slate-300 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-700"
          title="تبديل لغة العرض"
        >
          {currentLang === 'ar' ? 'العربية' : 'Français'}
        </button>

        {/* User Account Switcher Button */}
        <button
          onClick={onOpenLoginModal}
          className="h-7 px-2 flex items-center gap-2 border border-slate-300 bg-slate-50 hover:bg-blue-50/80 hover:border-blue-900 transition-colors text-xs"
          title="تبديل المستخدم أو الصلاحيات"
        >
          <div className="w-5 h-5 bg-blue-950 text-white flex items-center justify-center font-mono font-bold text-[10px]">
            {currentUser?.full_name?.split(' ').map((n) => n[0]).join('') || 'U'}
          </div>
          <div className="hidden md:flex flex-col text-start leading-none">
            <span className="font-bold text-slate-900 text-[11px] truncate max-w-[110px]">
              {currentUser?.full_name || 'تسجيل الدخول'}
            </span>
            <span className="text-[9px] text-slate-500 font-normal">
              {currentUser?.role_label_ar || 'مستخدم'}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
}
