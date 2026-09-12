import React from 'react';
import {
  Table,
  BarChart3,
  Coins,
  GraduationCap,
  Users,
  UtensilsCrossed,
  Building2,
  Database,
  ChevronDown,
  UserCheck,
  PanelLeftClose,
  PanelRightClose,
  Sparkles,
  CalendarRange,
  ShieldAlert,
  KeyRound,
  Receipt,
  CreditCard,
  Layers,
  ArrowLeftRight,
  TrendingUp,
  Calendar,
  Trophy,
  Activity,
  Wallet,
  Lock,
  Unlock,
  Shield,
  LogOut,
} from 'lucide-react';
import { MOCK_BRANCHES } from '../../mock/mockData';

export function Sidebar({
  activeView,
  onSelectView,
  selectedBranch,
  onSelectBranch,
  currentUser,
  onOpenLoginModal,
  isCollapsed,
  onToggleCollapse,
}) {
  const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.branch_id === 'ALL';

  const opModules = [
    { id: 'excel-grid', labelAr: 'جداول البيانات الشاملة', icon: Table, tag: 'شامل' },
    { id: 'analytics', labelAr: 'التحليلات والإحصائيات', icon: BarChart3, tag: 'إحصاء' },
    { id: 'schedules-sessions', labelAr: 'التوقيت والحصص المنفذة', icon: Calendar, tag: 'مباشر' },
    { id: 'enrollments', labelAr: 'تسجيل الاشتراكات والعقود', icon: UserCheck, tag: 'عقود' },
    { id: 'guardians', labelAr: 'أولياء الأمور والاتصالات', icon: Users, tag: 'دليل' },
    { id: 'competitions', labelAr: 'المسابقات والبطولات', icon: Trophy, tag: 'فعاليات' },
  ];

  const finModules = [
    { id: 'invoices-payments', labelAr: 'الفواتير وسندات القبض', icon: Receipt, tag: 'تحصيل' },
    { id: 'treasury', labelAr: 'حركة الخزينة والصندوق', icon: Coins, tag: 'سيولة' },
    { id: 'budgets-expenses', labelAr: 'الميزانية وسندات الصرف', icon: TrendingUp, tag: 'نفقات' },
    { id: 'handovers', labelAr: 'ترحيل العهدة النقدية', icon: ArrowLeftRight, tag: 'تسليم' },
    { id: 'pricing-plans', labelAr: 'خطط التسعير والأقساط', icon: CreditCard, tag: 'تعريفات' },
    { id: 'payroll', labelAr: 'سجل الأجور والرواتب', icon: Wallet, tag: 'رواتب' },
    { id: 'provisions', labelAr: 'تموين ومطعم الروضة', icon: UtensilsCrossed, tag: 'إعاشة' },
  ];

  const academicModules = [
    { id: 'groups-levels', labelAr: 'الأفواج والمستويات الدراسية', icon: Layers, tag: 'أفواج' },
    { id: 'programs', labelAr: 'دليل البرامج التعليمية', icon: GraduationCap, tag: 'برامج' },
    { id: 'academic-years', labelAr: 'المواسم والسنوات الدراسية', icon: CalendarRange, tag: 'مواسم' },
  ];

  const sysModules = [
    { id: 'branches', labelAr: 'المقرات والقاعات التعليمية', icon: Building2, tag: 'مرافق' },
    { id: 'system-health', labelAr: 'حالة النظام وقاعدة البيانات', icon: Activity, tag: 'جاهز' },
    { id: 'audit-trail', labelAr: 'سجل العمليات والرقابة', icon: ShieldAlert, tag: 'رقابة' },
    { id: 'auth-security', labelAr: 'الهوية وإدارة الصلاحيات', icon: KeyRound, tag: 'أمان' },
  ];

  const allItems = [...opModules, ...finModules, ...academicModules, ...sysModules];

  if (isCollapsed) {
    return (
      <aside className="w-12 border-e border-slate-200 bg-slate-50/90 flex flex-col items-center py-3 flex-shrink-0 z-30 select-none overflow-y-auto">
        <button
          onClick={onToggleCollapse}
          className="mb-4 hover:scale-105 transition-transform"
          title="توسيع القائمة الجانبية"
        >
          <img
            src="/assets/branding/logo.webp"
            alt="3abaqira Logo"
            className="w-8 h-8 rounded-full border border-blue-300 shadow-2xs object-cover"
          />
        </button>

        <div className="flex flex-col gap-1.5 w-full items-center">
          {allItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`w-9 h-9 flex items-center justify-center rounded-[5px] transition-colors ${
                  isActive
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-500 hover:bg-slate-200 hover:text-slate-900'
                }`}
                title={item.labelAr}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 border-e border-slate-200 bg-[#fbfcfd] flex flex-col flex-shrink-0 z-30 select-none">
      {/* 1. Brand Header with Official Logo */}
      <div className="p-3.5 pb-3 border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img
            src="/assets/branding/logo.webp"
            alt="3abaqira Official Logo"
            className="w-9 h-9 rounded-full border border-blue-300 shadow-xs object-cover flex-shrink-0"
          />
          <div className="flex flex-col">
            <span className="font-serif font-bold text-base text-blue-950 tracking-tight leading-none">
              3abaqira<span className="text-blue-600 font-sans">.</span>
            </span>
            <span className="text-[9px] text-slate-500 font-arabic mt-0.5 leading-tight truncate max-w-[130px]">
              أكاديمية الأطفال العباقرة
            </span>
          </div>
        </div>

        <button
          onClick={onToggleCollapse}
          className="icon-button text-slate-400 hover:text-slate-700"
          title="طي القائمة الجانبية"
        >
          <PanelRightClose className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Workspace Branch Switcher Card */}
      <div className="p-2.5 border-b border-slate-200/80">
        <button
          onClick={() => {
            if (isAdmin) {
              const next = selectedBranch === 'ALL' ? 'CENTER' : selectedBranch === 'CENTER' ? 'RAWDA' : 'ALL';
              onSelectBranch(next);
            } else {
              onOpenLoginModal();
            }
          }}
          title={isAdmin ? 'انقر للتبديل السريع بين المقرات' : 'هذا الحساب مقيد بمقر محدد (انقر لتبديل الحساب)'}
          className="w-full text-start p-2 bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200/80 rounded-[6px] flex items-center gap-2.5 transition-colors cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-[4px] bg-blue-900 text-white flex items-center justify-center font-serif font-bold text-xs shadow-xs group-hover:scale-105 transition-transform">
            {isAdmin ? '👑' : '🏢'}
          </div>
          <div className="flex-1 min-w-0">
            <span className="eyebrow block leading-none text-blue-900/70">
              {isAdmin ? 'WORKSPACE / إدارة المقرات (حر)' : 'WORKSPACE / نطاق الحساب المقيد'}
            </span>
            <strong className="text-xs font-semibold text-slate-900 block truncate mt-0.5">
              {selectedBranch === 'CENTER'
                ? 'المركز الأكاديمي'
                : selectedBranch === 'RAWDA'
                ? 'الروضة والحضانة'
                : 'كافة المقرات والفروع'}
            </strong>
          </div>
          {isAdmin ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-900 transition-colors" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>
      </div>

      {/* 3. Navigation Links (Structured ERP Sections) */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-3.5">
        {/* Operations & Attendance */}
        <div>
          <span className="eyebrow px-2 block mb-1">OPERATIONS & SHEETS</span>
          <nav className="space-y-0.5">
            {opModules.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  className={`nav-item ${isActive ? 'nav-active' : ''}`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-900' : 'text-slate-500'}`} />
                  <span className="truncate flex-1">{item.labelAr}</span>
                  <span className={`tag ${isActive ? 'tag-blue' : ''} text-[9px] font-mono py-0`}>
                    {item.tag}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Financial & Accounting */}
        <div>
          <span className="eyebrow px-2 block mb-1">FINANCE & BILLING</span>
          <nav className="space-y-0.5">
            {finModules.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  className={`nav-item ${isActive ? 'nav-active' : ''}`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-900' : 'text-slate-500'}`} />
                  <span className="truncate flex-1">{item.labelAr}</span>
                  <span className={`tag ${isActive ? 'tag-blue' : ''} text-[9px] font-mono py-0`}>
                    {item.tag}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Academic & Curriculum */}
        <div>
          <span className="eyebrow px-2 block mb-1">ACADEMIC & CURRICULUM</span>
          <nav className="space-y-0.5">
            {academicModules.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  className={`nav-item ${isActive ? 'nav-active' : ''}`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-900' : 'text-slate-500'}`} />
                  <span className="truncate flex-1">{item.labelAr}</span>
                  <span className={`tag ${isActive ? 'tag-blue' : ''} text-[9px] font-mono py-0`}>
                    {item.tag}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* System & Telemetry */}
        <div>
          <span className="eyebrow px-2 block mb-1">SYSTEM & GOVERNANCE</span>
          <nav className="space-y-0.5">
            {sysModules.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  className={`nav-item ${isActive ? 'nav-active' : ''}`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-900' : 'text-slate-500'}`} />
                  <span className="truncate flex-1">{item.labelAr}</span>
                  <span className={`tag ${isActive ? 'tag-blue' : ''} text-[9px] font-mono py-0`}>
                    {item.tag}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Branch Filter Segment */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="eyebrow block">
              {isAdmin ? 'BRANCH SCOPE / صلاحية الإدارة' : 'BRANCH SCOPE / نطاق الحساب'}
            </span>
            <span className="text-[10px] font-mono font-bold text-blue-900 bg-blue-50 px-1 py-0.5 border border-blue-200">
              {selectedBranch}
            </span>
          </div>
          <div className="space-y-1">
            {MOCK_BRANCHES.map((b) => {
              const isCurrent = selectedBranch === b.id;
              const isLockedForUser = !isAdmin && currentUser?.branch_id !== b.id;
              const subtext =
                b.id === 'CENTER'
                  ? '6 قاعات • 158 مسجل نشط'
                  : b.id === 'RAWDA'
                  ? '6 قاعات • 115 مسجل نشط'
                  : '12 قاعة • 273 مسجل إجمالي';

              return (
                <button
                  key={b.id}
                  onClick={() => {
                    onSelectBranch(b.id);
                  }}
                  className={`w-full text-start p-2 rounded transition-all flex flex-col gap-0.5 border ${
                    isCurrent
                      ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                      : isLockedForUser
                      ? 'bg-slate-50/70 text-slate-400 border-slate-200 hover:border-slate-300'
                      : 'bg-white text-slate-700 hover:bg-blue-50/70 hover:text-blue-950 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 w-full">
                    <div className="flex items-center gap-2 truncate font-semibold text-xs">
                      <Building2 className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-blue-200' : isLockedForUser ? 'text-slate-400' : 'text-blue-900'}`} />
                      <span className="truncate">{b.nameAr}</span>
                    </div>
                    {isCurrent ? (
                      <span className="px-1.5 py-0.2 bg-blue-800 text-blue-100 text-[9px] font-mono font-bold shrink-0">
                        محدد ✓
                      </span>
                    ) : isLockedForUser ? (
                      <span className="px-1.5 py-0.2 bg-slate-200 text-slate-600 text-[9px] font-mono shrink-0 flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" />
                        مقيد
                      </span>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-mono ps-5 leading-tight ${
                      isCurrent ? 'text-blue-200 font-medium' : isLockedForUser ? 'text-slate-400' : 'text-slate-400'
                    }`}
                  >
                    {isLockedForUser ? 'مقيد بحساب الإدارة العامة' : subtext}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Active User Account & Switcher Footer */}
      <div className="p-3 border-t border-slate-200/80 bg-slate-50/70">
        <div className="flex items-center justify-between mb-1.5">
          <span className="eyebrow text-slate-500">الحساب النشط والصلاحية</span>
          <button
            onClick={onOpenLoginModal}
            className="text-[10px] text-blue-900 font-bold hover:underline"
          >
            تبديل الحساب
          </button>
        </div>

        {/* User Pill Button */}
        <button
          onClick={onOpenLoginModal}
          className="w-full p-2 bg-white hover:bg-blue-50/60 border border-slate-300 transition-colors flex items-center justify-between text-start group"
          title="انقر لتبديل الحساب أو تغيير الصلاحيات"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 bg-blue-950 text-white flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
              {currentUser?.full_name?.split(' ').map((n) => n[0]).join('') || 'U'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-900 leading-tight truncate">
                {currentUser?.full_name || 'محمد بوري'}
              </span>
              <span className="text-[10px] text-slate-500 font-arabic truncate mt-0.5">
                {currentUser?.role_label_ar || 'مدير عام'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 ps-1">
            <span
              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 border ${
                currentUser?.branch_id === 'ALL'
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-blue-50 text-blue-900 border-blue-300'
              }`}
            >
              {currentUser?.branch_id === 'ALL' ? 'إدارة عامة' : currentUser?.branch_id}
            </span>
          </div>
        </button>
      </div>
    </aside>
  );
}
