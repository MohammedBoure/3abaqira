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
  const navModules = [
    { id: 'excel-grid', labelAr: 'جداول البيانات (Excel Grid)', icon: Table, tag: '26 col' },
    { id: 'analytics', labelAr: 'التحليلات القيادية (Analytics)', icon: BarChart3, tag: 'BI' },
    { id: 'treasury', labelAr: 'الخزينة والصندوق (Treasury)', icon: Coins, tag: '184.5k' },
    { id: 'programs', labelAr: 'دليل البرامج والأفواج', icon: GraduationCap, tag: '5' },
    { id: 'payroll', labelAr: 'سجل الأجور والرواتب', icon: Users, tag: 'HR' },
    { id: 'provisions', labelAr: 'تموين ومطعم الروضة', icon: UtensilsCrossed, tag: 'Daily' },
  ];

  const apiModules = [
    { id: 'academic-years', labelAr: 'المواسم الأكاديمية (Years)', icon: CalendarRange, tag: 'Fiscal' },
    { id: 'branches', labelAr: 'المقرات والقاعات (Branches)', icon: Building2, tag: '2 Sites' },
    { id: 'audit-trail', labelAr: 'سجل الرقابة (Audit Trail)', icon: ShieldAlert, tag: 'Logs' },
    { id: 'auth-security', labelAr: 'الهوية والأمان (Auth/Sec)', icon: KeyRound, tag: 'JWT' },
  ];

  const allItems = [...navModules, ...apiModules];

  if (isCollapsed) {
    return (
      <aside className="w-12 border-e border-slate-200 bg-slate-50/90 flex flex-col items-center py-3 flex-shrink-0 z-30 select-none overflow-y-auto">
        <button
          onClick={onToggleCollapse}
          className="icon-button mb-4 text-blue-900"
          title="توسيع القائمة الجانبية"
        >
          <div className="brand-symbol">
            <i /><i /><i /><i /><i /><i />
          </div>
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
    <aside className="w-60 border-e border-slate-200 bg-[#fbfcfd] flex flex-col flex-shrink-0 z-30 select-none">
      {/* 1. Brand Header (Signature Spatial Starburst Emblem) */}
      <div className="p-4 pb-3 border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="brand-symbol">
            <i /><i /><i /><i /><i /><i />
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-lg text-blue-950 tracking-tight leading-none">
              3abaqira<span className="text-blue-600 font-sans">.</span>
            </span>
            <span className="text-[9px] text-slate-400 font-mono tracking-wider mt-0.5">
              SPATIAL WORKSPACE
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
      <div className="p-3 border-b border-slate-200/80">
        <div className="p-2 bg-blue-50/70 border border-blue-200/80 rounded-[6px] flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[4px] bg-blue-900 text-white flex items-center justify-center font-serif font-bold text-xs shadow-xs">
            3A
          </div>
          <div className="flex-1 min-w-0">
            <span className="eyebrow block leading-none text-blue-900/70">
              WORKSPACE
            </span>
            <strong className="text-xs font-semibold text-slate-900 block truncate mt-0.5">
              {selectedBranch === 'CENTER'
                ? 'المركز الأكاديمي'
                : selectedBranch === 'RAWDA'
                ? 'الروضة والحضانة'
                : 'كافة المقرات والفروع'}
            </strong>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* 3. Navigation Links (Modules & Sheets) */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-4">
        <div>
          <span className="eyebrow px-2 block mb-1.5">MODULES & SHEETS</span>
          <nav className="space-y-0.5">
            {navModules.map((item) => {
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

        {/* System & Backend APIs Section */}
        <div>
          <span className="eyebrow px-2 block mb-1.5">SYSTEM APIS & CONTROL</span>
          <nav className="space-y-0.5">
            {apiModules.map((item) => {
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
          <span className="eyebrow px-2 block mb-1.5">BRANCH SCOPE / تصفية المقر</span>
          <div className="space-y-0.5">
            {MOCK_BRANCHES.map((b) => {
              const isCurrent = selectedBranch === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => onSelectBranch(b.id)}
                  className={`nav-item text-xs py-1.5 ${
                    isCurrent ? 'bg-slate-200/70 text-slate-900 font-semibold' : ''
                  }`}
                >
                  <Building2 className={`w-3 h-3 ${isCurrent ? 'text-blue-900' : 'text-slate-400'}`} />
                  <span className="truncate flex-1">{b.nameAr}</span>
                  {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-blue-900" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Local System Health Footer Card */}
      <div className="p-3 border-t border-slate-200/80 bg-slate-50/50">
        <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
          <Database className="w-3.5 h-3.5 text-blue-900" />
          <span className="font-semibold text-slate-800">قاعدة البيانات: abaqira</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 ms-auto" />
        </div>
        <p className="text-[10px] text-slate-500 font-normal leading-relaxed">
          اتصال مشفر ومطابق مع جداول Excel القديمة
        </p>

        {/* User Pill */}
        <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[3px] bg-slate-200 text-slate-700 flex items-center justify-center font-mono font-bold text-[10px]">
              AD
            </div>
            <div className="flex flex-col text-start">
              <span className="text-[11px] font-bold text-slate-900 leading-none">مدير النظام</span>
              <span className="text-[9px] text-slate-400 font-mono">SUPER_ADMIN</span>
            </div>
          </div>
          <span className="text-[10px] text-emerald-700 font-mono font-semibold">Active</span>
        </div>
      </div>
    </aside>
  );
}
