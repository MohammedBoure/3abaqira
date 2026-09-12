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
} from 'lucide-react';
import { MOCK_BRANCHES } from '../../mock/mockData';

export function Sidebar({
  activeView,
  onSelectView,
  selectedBranch,
  onSelectBranch,
  isCollapsed,
  onToggleCollapse,
}) {
  const opModules = [
    { id: 'excel-grid', labelAr: 'جداول البيانات (Excel Grid)', icon: Table, tag: '26 col' },
    { id: 'analytics', labelAr: 'التحليلات القيادية (Analytics)', icon: BarChart3, tag: 'BI' },
    { id: 'schedules-sessions', labelAr: 'التوقيت والحصص (Schedules)', icon: Calendar, tag: 'Live' },
    { id: 'enrollments', labelAr: 'تسجيل الاشتراكات (Enroll)', icon: UserCheck, tag: 'Active' },
    { id: 'guardians', labelAr: 'أولياء الأمور (Guardians)', icon: Users, tag: 'Parents' },
    { id: 'competitions', labelAr: 'المسابقات والبطولات', icon: Trophy, tag: 'Events' },
  ];

  const finModules = [
    { id: 'invoices-payments', labelAr: 'الفواتير والمدفوعات', icon: Receipt, tag: 'Dues' },
    { id: 'treasury', labelAr: 'حركة الخزينة والصندوق', icon: Coins, tag: 'Cash' },
    { id: 'budgets-expenses', labelAr: 'الميزانية والنفقات', icon: TrendingUp, tag: 'Costs' },
    { id: 'handovers', labelAr: 'ترحيل السيولة (Handovers)', icon: ArrowLeftRight, tag: 'Vault' },
    { id: 'pricing-plans', labelAr: 'خطط التسعير والأقساط', icon: CreditCard, tag: 'Tariffs' },
    { id: 'payroll', labelAr: 'سجل الأجور والرواتب', icon: Wallet, tag: 'HR' },
    { id: 'provisions', labelAr: 'تموين ومطعم الروضة', icon: UtensilsCrossed, tag: 'Daily' },
  ];

  const academicModules = [
    { id: 'groups-levels', labelAr: 'الأفواج والمستويات', icon: Layers, tag: 'Cohorts' },
    { id: 'programs', labelAr: 'دليل البرامج الأكاديمية', icon: GraduationCap, tag: '5 Progs' },
    { id: 'academic-years', labelAr: 'المواسم الأكاديمية (Years)', icon: CalendarRange, tag: 'Fiscal' },
  ];

  const sysModules = [
    { id: 'branches', labelAr: 'المقرات والقاعات (Branches)', icon: Building2, tag: '2 Sites' },
    { id: 'system-health', labelAr: 'صحة الخادم والبارامترات', icon: Activity, tag: 'Telemetry' },
    { id: 'audit-trail', labelAr: 'سجل الرقابة والتتبع (Audit)', icon: ShieldAlert, tag: 'Logs' },
    { id: 'auth-security', labelAr: 'الهوية والصلاحيات والأمان', icon: KeyRound, tag: 'JWT' },
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
            const next = selectedBranch === 'ALL' ? 'CENTER' : selectedBranch === 'CENTER' ? 'RAWDA' : 'ALL';
            onSelectBranch(next);
          }}
          title="انقر للتبديل السريع بين المقرات"
          className="w-full text-start p-2 bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200/80 rounded-[6px] flex items-center gap-2.5 transition-colors cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-[4px] bg-blue-900 text-white flex items-center justify-center font-serif font-bold text-xs shadow-xs group-hover:scale-105 transition-transform">
            3A
          </div>
          <div className="flex-1 min-w-0">
            <span className="eyebrow block leading-none text-blue-900/70">
              WORKSPACE (انقر للتبديل)
            </span>
            <strong className="text-xs font-semibold text-slate-900 block truncate mt-0.5">
              {selectedBranch === 'CENTER'
                ? 'المركز الأكاديمي'
                : selectedBranch === 'RAWDA'
                ? 'الروضة والحضانة'
                : 'كافة المقرات والفروع'}
            </strong>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-900 transition-colors" />
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
          <span className="eyebrow px-2 block mb-1">SYSTEM & APIS</span>
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
            <span className="eyebrow block">BRANCH SCOPE / تصفية المقر</span>
            <span className="text-[10px] font-mono font-bold text-blue-900 bg-blue-50 px-1 py-0.5 border border-blue-200">
              {selectedBranch}
            </span>
          </div>
          <div className="space-y-1">
            {MOCK_BRANCHES.map((b) => {
              const isCurrent = selectedBranch === b.id;
              const subtext =
                b.id === 'CENTER'
                  ? '6 قاعات • 158 مسجل نشط'
                  : b.id === 'RAWDA'
                  ? '6 قاعات • 115 مسجل نشط'
                  : '12 قاعة • 273 مسجل إجمالي';

              return (
                <button
                  key={b.id}
                  onClick={() => onSelectBranch(b.id)}
                  className={`w-full text-start p-2 rounded transition-all flex flex-col gap-0.5 border ${
                    isCurrent
                      ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-blue-50/70 hover:text-blue-950 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 w-full">
                    <div className="flex items-center gap-2 truncate font-semibold text-xs">
                      <Building2 className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-blue-200' : 'text-blue-900'}`} />
                      <span className="truncate">{b.nameAr}</span>
                    </div>
                    {isCurrent ? (
                      <span className="px-1.5 py-0.2 bg-blue-800 text-blue-100 text-[9px] font-mono font-bold shrink-0">
                        محدد ✓
                      </span>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-mono ps-5 leading-tight ${
                      isCurrent ? 'text-blue-200 font-medium' : 'text-slate-400'
                    }`}
                  >
                    {subtext}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Local System Health Footer Card */}
      <div className="p-3 border-t border-slate-200/80 bg-slate-50/50">
        <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
          <Database className="w-3.5 h-3.5 text-blue-900" />
          <span className="font-semibold text-slate-800">قاعدة البيانات: abaqira</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 ms-auto" />
        </div>
        <p className="text-[10px] text-slate-500 font-normal leading-relaxed">
          اتصال متزامن وشامل لجميع الواجهات والـ APIs
        </p>

        {/* User Pill */}
        <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[3px] bg-blue-900 text-white flex items-center justify-center font-mono font-bold text-[10px]">
              MB
            </div>
            <div className="flex flex-col text-start">
              <span className="text-[11px] font-bold text-slate-900 leading-none">محمد بوري</span>
              <span className="text-[9px] text-slate-400 font-mono">SUPER_ADMIN</span>
            </div>
          </div>
          <span className="text-[10px] text-emerald-700 font-mono font-semibold">Active</span>
        </div>
      </div>
    </aside>
  );
}
