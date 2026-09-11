import React from 'react';
import {
  Search,
  Globe,
  Building2,
  Table,
  BarChart3,
  Coins,
  GraduationCap,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { BrandLogo } from '../branding/BrandLogo';
import { MOCK_BRANCHES } from '../../mock/mockData';

export function Navbar({
  selectedBranch,
  onSelectBranch,
  currentLang,
  onToggleLang,
  activeView,
  onSelectView,
}) {
  const views = [
    { id: 'excel-grid', labelAr: 'جداول البيانات (Excel Grid)', icon: Table },
    { id: 'analytics', labelAr: 'التحليلات والإحصائيات (Analytics)', icon: BarChart3 },
    { id: 'treasury', labelAr: 'الخزينة والصندوق (Treasury)', icon: Coins },
    { id: 'programs', labelAr: 'البرامج والأفواج (Programs)', icon: GraduationCap },
    { id: 'payroll', labelAr: 'الأجور والرواتب (HR / Payroll)', icon: Users },
    { id: 'provisions', labelAr: 'التموين والمطعم (Provisions)', icon: UtensilsCrossed },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-300 bg-white shadow-xs select-none">
      {/* Upper Main Operational Bar */}
      <div className="w-full px-2 sm:px-3 flex items-center justify-between h-12 gap-3">
        {/* Left: Brand Logo & Branch Switcher */}
        <div className="flex items-center gap-4">
          <BrandLogo size="sm" variant="full" />

          {/* Branch Multi-tenant Switcher */}
          <div className="hidden lg:flex items-center border border-slate-300 bg-slate-100 p-0.5">
            <Building2 className="w-3.5 h-3.5 text-blue-900 mx-1.5" />
            {MOCK_BRANCHES.map((b) => {
              const isActive = selectedBranch === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => onSelectBranch(b.id)}
                  className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    isActive
                      ? 'bg-blue-900 text-white'
                      : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {b.id === 'ALL' ? 'كافة الفروع' : b.id === 'CENTER' ? 'المركز' : 'الروضة'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: Quick Search */}
        <div className="hidden md:flex flex-1 max-w-sm mx-2">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute inset-y-0 start-2.5 my-auto text-slate-400" />
            <input
              type="text"
              placeholder="البحث السريع في المنظومة (Ctrl+K)..."
              className="w-full h-7 ps-7 pe-10 text-xs sharp-input"
            />
            <span className="absolute inset-y-0 end-1.5 my-auto h-4 px-1 flex items-center text-[9px] font-mono text-slate-400 bg-slate-100 border border-slate-200">
              Ctrl+K
            </span>
          </div>
        </div>

        {/* Right: Language Switcher & System Profile */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1.5 h-7 px-2.5 sharp-btn-secondary text-xs"
            title="تبديل اللغة / Changer de langue"
          >
            <Globe className="w-3 h-3 text-blue-900" />
            <span>{currentLang === 'ar' ? 'العربية' : 'Français'}</span>
          </button>

          <div className="flex items-center gap-2 ps-2 border-s border-slate-300 text-xs">
            <div className="w-7 h-7 bg-blue-950 text-white flex items-center justify-center font-mono font-bold text-xs">
              AD
            </div>
            <div className="hidden xl:flex flex-col text-start">
              <span className="font-bold text-slate-900 leading-none">مدير النظام</span>
              <span className="text-[10px] text-blue-900 font-mono">SUPER_ADMIN</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Navigation Ribbon (Module Template Switcher) */}
      <div className="w-full px-2 sm:px-3 bg-slate-100 border-t border-slate-200 flex items-center gap-1 overflow-x-auto text-xs">
        {views.map((v) => {
          const isActive = activeView === v.id;
          const Icon = v.icon;
          return (
            <button
              key={v.id}
              onClick={() => onSelectView(v.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border-b-2 font-semibold transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-blue-900 bg-white text-blue-900 shadow-xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-900' : 'text-slate-500'}`} />
              <span>{v.labelAr}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}

