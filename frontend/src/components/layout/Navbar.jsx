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
    // Core Modules
    'auth-security': 'إدارة الهوية والصلاحيات والأمان',
    'audit-logs': 'سجل الرقابة والتدقيق الأمني والمالي',
    'branches': 'شبكة المقرات الـ 13 وتجهيز القاعات',
    'academic-years': 'المواسم والسنوات الأكاديمية',
    'guardians': 'سجل الأفراد والعائلات والأولياء وقائمة الاستلام',
    'staff-hr': 'إدارة الموارد البشرية والتوظيف والحضور',
    'center-installment-programs': 'البرامج بنظام الدفعات (دعم، لغات، مهارات)',
    'center-support-classes': 'دروس الدعم العلمي واللغات المدرسية',
    'center-languages': 'برنامج اللغات الأجنبية - دورات المستويات',
    'center-robotics': 'نادي الروبوتيك والذكاء الاصطناعي',
    'center-school-languages': 'دعم مناهج اللغات المدرسية',
    'center-soroban': 'سجل برنامج السوروبان والحساب الذهني',
    'center-quran': 'برنامج تحفيظ القرآن الكريم والتجويد',
    'center-preparatory': 'القسم التحضيري المدرسي',
    'center-summer-camp': 'النادي والمخيم الصيفي',
    'center-soroban-championships': 'سجل البطولات والمنافسات الأكاديمية',
    'center-timetable': 'جدول توقيت الأفواج والقاعات',
    'center-fixed-payroll': 'جدول الرواتب الشهرية الثابتة',
    'center-trainer-payroll': 'وحدة احتساب أجور المدربين بالحصة',
    'center-daily-expenses': 'المصاريف اليومية للمركز التعليمي',
    'center-cash-handover': 'سجل تسليم العهدة النقدية للمركز',
    'center-pricing-policy': 'دليل الأسعار وسياسة الخصومات المعتمدة',

    // Kindergarten Views
    'rawda-console': 'محطة عمل الروضة والتقارير وسجل الحوادث',
    'kindergarten-workstation': 'محطة روضة وحضانة الأطفال الشاملة',
    'kg-bands-books': 'الأفواج العمرية والدفاتر المرقمنة',
    'kg-attendance': 'سجل الحضور والغياب اليومي',
    'kg-daily-log': 'ورقة التقييم اليومي',
    'kg-monthly-reports': 'مركز اعتماد التقارير الشهرية',
    'kg-incidents': 'سجل الحوادث والوقائع',
    'kg-orthophonist': 'لوحة المتابعة الإكلينيكية والأرطوفونيا',
    'kg-habits-menu': 'عادات الأطفال وقائمة وجبات المطعم',
    'rawda-students': 'سجل الأطفال والتسجيل السنوي والشهري',
    'rawda-cohorts': 'تنظيم وقاعات الأفواج',
    'rawda-daily-expenses': 'سجل المصاريف اليومية للروضة',
    'rawda-budget-variance': 'ملخص المصاريف وتحليل الموازنة',
    'rawda-cash-drawer': 'الملخص اليومي لصندوق الروضة',
    'rawda-cash-handover': 'سجل تسليم السيولة والعهد للروضة',
    'rawda-bread-tracking': 'المراقبة اليومية لاستهلاك الخبز والمطعم',
    'rawda-meat-provisions': 'طلبيات اللحوم والتموين الغذائي الأسبوعي',

    // Communication
    'communication': 'منظومة التواصل ورسائل الأولياء والإشعارات',
    'communication-center': 'مركز المراسلات الثنائية وطابور الإشعارات',
    'parent-notes': 'دفتر ملاحظات الأولياء الثنائي',
    'notification-queue': 'طابور الإشعارات الصادرة',

    // Finance
    'treasury-finance-desk': 'شباك الخزينة والمالية الموحد',
    'finance-pricing': 'دليل الأسعار والخصومات المعتمدة',
    'finance-invoices': 'جدول الفواتير ومواعيد الأقساط',
    'finance-receipts': 'وصولات القبض النقدي وسندات الإلغاء',
    'finance-drawer': 'حركة الصندوق اليومي وتسليم العهد',
    'invoices-payments': 'إدارة الفواتير والمقبوضات وسندات القبض المتسلسلة',
    'cash-drawer': 'حركة الخزينة والصندوق اليومي الموحد',
    'pricing-plans': 'دليل الأسعار وخطط الاشتراكات',

    // Migration
    'data-migration': 'وحدة ترحيل سجلات إكسل ومطابقة الكاش الدفتري',
    'data-migration-console': 'منصة ترحيل وتدقيق بيانات الإكسل القديمة',

    // Super Admin Tools
    'excel-grid': 'سجل جداول البيانات الموحد',
    'analytics': 'منظومة الإحصائيات والتحليلات العامة',
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
