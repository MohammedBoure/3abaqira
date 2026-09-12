import React from 'react';
import {
  Search,
  Globe,
  Building2,
  Database,
  Menu,
  UserPlus,
  Receipt,
  CheckCircle,
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
  onOpenStudentModal,
  onOpenDrawerModal,
  currentUser,
  onOpenLoginModal,
}) {
  const viewTitles = {
    'excel-grid': 'سجل جداول البيانات الموحد (Excel Grid)',
    'analytics': 'منظومة الإحصائيات والتحليلات القيادية',
    'treasury': 'حركة الصندوق والخزينة اليومية',
    'programs': 'دليل البرامج والمستويات الأكاديمية',
    'payroll': 'سجل الأجور والرواتب',
    'provisions': 'تموين ومطعم الروضة',
    'academic-years': 'المواسم والسنوات الأكاديمية (Academic Cycles)',
    'branches': 'إدارة الفروع والمقرات والقاعات (Branches)',
    'audit-trail': 'سجل الرقابة والتتبع الأمني (Audit Trail)',
    'auth-security': 'إدارة الهوية والصلاحيات والأمان (Auth & Security)',
    'invoices-payments': 'سجل الفواتير وسندات القبض (Invoices & Payments)',
    'budgets-expenses': 'الميزانية التقديرية وسجل النفقات (Budgets & Expenses)',
    'handovers': 'التسليم وسجل ترحيل العهدة (Delivery & Safe Remittance)',
    'pricing-plans': 'خطط التسعير والأقساط المعيارية (Pricing Plans)',
    'enrollments': 'تسجيل اشتراكات الطلاب المعتمدة (Enrollments)',
    'groups-levels': 'الأفواج، المستويات وتوزيع القاعات (Groups & Levels)',
    'schedules-sessions': 'التوقيت الأسبوعي والحصص المنفذة (Schedules & Sessions)',
    'competitions': 'المسابقات والبطولات وتوليد الوصولات (Competitions)',
    'guardians': 'دليل أولياء الأمور وجهات الاتصال (Guardians Registry)',
    'system-health': 'صحة الخادم، قاعدة البيانات والبارامترات (System Telemetry)',
  };

  return (
    <header className="h-12 border-b border-slate-200 bg-white/95 backdrop-blur-xs flex items-center justify-between px-3 sm:px-4 z-20 flex-shrink-0 select-none">
      {/* Left: Sidebar Toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="icon-button text-slate-500 hover:text-slate-800"
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
          <span className="text-slate-700 font-semibold truncate max-w-[200px] sm:max-w-[320px]">
            {viewTitles[activeView] || 'منظومة الإدارة'}
          </span>
          <span className="text-slate-300 hidden md:inline">/</span>
          <span className="tag text-[10px] hidden md:inline-flex">
            {selectedBranch === 'CENTER' ? 'المركز الأكاديمي' : selectedBranch === 'RAWDA' ? 'الروضة' : 'كافة الفروع'}
          </span>
        </div>
      </div>

      {/* Center: Search Field with Shortcut */}
      <div className="hidden lg:flex items-center max-w-xs flex-1 mx-4">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 absolute inset-y-0 start-2.5 my-auto text-slate-400" />
          <input
            type="text"
            placeholder="بحث فوري في السجلات والملفات..."
            className="w-full h-7 ps-7 pe-10 text-xs border border-slate-200 rounded-[5px] bg-slate-50 focus:bg-white focus:border-blue-700 focus:outline-none transition-colors"
          />
          <kbd className="absolute inset-y-0 end-1.5 my-auto h-4 text-[9px] px-1 flex items-center">
            Ctrl K
          </kbd>
        </div>
      </div>

      {/* Right: Actions & Controls */}
      <div className="flex items-center gap-2">
        {/* Clean System Status */}
        <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-slate-500 pe-2 border-e border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
          <span className="text-slate-700 font-medium">النظام: نشط ومتزامن</span>
        </div>

        {/* User Account Switcher Button */}
        <button
          onClick={onOpenLoginModal}
          className="h-7 px-2 flex items-center gap-2 border border-slate-300 bg-slate-50 hover:bg-blue-50/80 hover:border-blue-900 transition-colors text-xs"
          title="انقر لتبديل الحساب أو تغيير صلاحيات المقر"
        >
          <div className="w-5 h-5 bg-blue-950 text-white flex items-center justify-center font-mono font-bold text-[10px]">
            {currentUser?.full_name?.split(' ').map((n) => n[0]).join('') || 'U'}
          </div>
          <div className="hidden md:flex flex-col text-start leading-none">
            <span className="font-bold text-slate-900 text-[11px] truncate max-w-[110px]">
              {currentUser?.full_name || 'تسجيل الدخول'}
            </span>
            <span className="text-[9px] text-slate-500 font-normal">
              {currentUser?.branch_id === 'ALL'
                ? 'إدارة عامة'
                : currentUser?.branch_id === 'CENTER'
                ? 'مقر المركز'
                : 'مقر الروضة'}
            </span>
          </div>
        </button>

        {/* Language Switcher */}
        <button
          onClick={onToggleLang}
          className="button text-[11px] h-7 px-2 text-slate-700"
          title="تبديل لغة الواجهة"
        >
          <Globe className="w-3 h-3 text-blue-900" />
          <span>{currentLang === 'ar' ? 'العربية' : 'Français'}</span>
        </button>

        {/* Primary CTA Buttons */}
        <button
          onClick={onOpenDrawerModal}
          className="button text-[11px] h-7 px-2.5 hidden sm:inline-flex"
        >
          <Receipt className="w-3.5 h-3.5 text-slate-600" />
          <span>الصندوق اليومي</span>
        </button>

        <button
          onClick={onOpenStudentModal}
          className="button button-primary text-[11px] h-7 px-2.5"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>تسجيل جديد</span>
        </button>
      </div>
    </header>
  );
}


