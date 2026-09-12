import React from 'react';
import {
  Search,
  Menu,
  CheckCircle,
  Building2,
  Baby,
  GraduationCap,
} from 'lucide-react';

export function Navbar({
  selectedBranch,
  onSelectBranch,
  currentLang,
  onToggleLang,
  activeView,
  onSelectView,
  onToggleSidebar,
  onOpenStudentModal,
  onOpenDrawerModal,
  currentUser,
  onOpenLoginModal,
}) {
  const viewTitles = {
    // Rawda Views (Section 2)
    'rawda-students': 'سجل الأطفال والتسجيل السنوي والشهري (روضة الأطفال)',
    'rawda-cohorts': 'تنظيم وقاعات الأفواج (10 قاعات للروضة)',
    'rawda-daily-expenses': 'سجل المصاريف اليومية للروضة',
    'rawda-budget-variance': 'ملخص المصاريف وتحليل الموازنة (Variance Analysis)',
    'rawda-cash-drawer': 'الملخص اليومي لصندوق الروضة',
    'rawda-cash-handover': 'سجل تسليم السيولة والعهد للروضة',
    'rawda-bread-tracking': 'المراقبة اليومية لاستهلاك الخبز والمطعم',
    'rawda-meat-provisions': 'طلبيات اللحوم والتموين الغذائي الأسبوعي',

    // Center Views (Section 3)
    'center-support-classes': 'دروس الدعم العلمي والأدبي (رياضيات، علوم، لغات)',
    'center-languages': 'برنامج اللغات الأجنبية - دورات المستويات',
    'center-robotics': 'نادي الروبوتيك والذكاء الاصطناعي',
    'center-school-languages': 'دروس دعم مناهج اللغات المدرسية',
    'center-soroban': 'سجل برنامج السوروبان والحساب الذهني',
    'center-quran': 'برنامج تحفيظ القرآن الكريم (الفصل السداسي)',
    'center-preparatory': 'القسم التحضيري المدرسي (الموسم 2025)',
    'center-summer-camp': 'النادي والمخيم الصيفي (نظام دفعتين)',
    'center-soroban-championships': 'سجل بطولات السوروبان (الولائية والوطنية)',
    'center-timetable': 'جدول توقيت الأفواج والقاعات (Timetable Matrix)',
    'center-fixed-payroll': 'جدول الرواتب الشهرية الثابتة',
    'center-trainer-payroll': 'وحدة احتساب أجور المدربين والأساتذة (بالحصة)',
    'center-daily-expenses': 'المصاريف اليومية للمركز الأكاديمي',
    'center-cash-handover': 'سجل تسليم العهدة النقدية للمركز',
    'center-pricing-policy': 'دليل الأسعار وسياسة الخصومات المعتمدة',

    // Super Admin System Views
    'excel-grid': 'سجل جداول البيانات الموحد (Excel Grid)',
    'analytics': 'منظومة الإحصائيات والتحليلات القيادية',
    'treasury': 'حركة الصندوق والخزينة اليومية',
    'programs': 'دليل البرامج والمستويات الأكاديمية',
    'payroll': 'سجل الأجور والرواتب',
    'provisions': 'تموين ومطعم الروضة',
    'academic-years': 'المواسم والسنوات الأكاديمية',
    'branches': 'إدارة المقرات والقاعات التعليمية',
    'audit-trail': 'سجل الرقابة والتتبع الأمني',
    'auth-security': 'إدارة الهوية والصلاحيات والأمان',
  };

  const isCenter = selectedBranch === 'CENTER';

  return (
    <header className="h-12 border-b border-slate-200 bg-white/95 backdrop-blur-xs flex items-center justify-between px-3 sm:px-4 z-20 flex-shrink-0 select-none">
      {/* Left: Sidebar Toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
          title="تبديل القائمة الجانبية"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <img
            src="/assets/branding/logo.webp"
            alt="3abaqira"
            className="w-5 h-5 rounded-full object-cover border border-blue-200"
          />
          <span className="font-serif font-bold text-blue-950">3abaqira</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-800 font-semibold truncate max-w-[200px] sm:max-w-[340px]">
            {viewTitles[activeView] || 'منظومة الإدارة'}
          </span>
          <span className="text-slate-300 hidden md:inline">/</span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.2 hidden md:inline-flex items-center gap-1 border ${
              isCenter
                ? 'bg-blue-50 text-blue-900 border-blue-200'
                : 'bg-pink-50 text-pink-900 border-pink-200'
            }`}
          >
            {isCenter ? <GraduationCap className="w-3 h-3 text-blue-700" /> : <Baby className="w-3 h-3 text-pink-700" />}
            {isCenter ? 'المركز الأكاديمي' : 'روضة الأطفال'}
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

      {/* Right: Actions & User */}
      <div className="flex items-center gap-2">
        {/* Clean System Status */}
        <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-slate-500 pe-2 border-e border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
          <span className="text-slate-700 font-medium">قاعدة البيانات: متزامنة</span>
        </div>

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
              {currentUser?.role_label_ar || 'مدير عام'}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
}
