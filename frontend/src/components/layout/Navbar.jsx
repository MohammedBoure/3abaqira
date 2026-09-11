import React from 'react';
import { Search, Bell, Globe, Building2 } from 'lucide-react';
import { BrandLogo } from '../branding/BrandLogo';
import { MOCK_BRANCHES } from '../../mock/mockData';

export function Navbar({
  selectedBranch,
  onSelectBranch,
  currentLang,
  onToggleLang,
  onOpenNewStudent,
}) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/85 backdrop-blur-xl shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">

          {/* Left: Swappable Brand Logo */}
          <div className="flex items-center gap-6">
            <BrandLogo size="md" variant="full" />

            {/* Branch Multi-tenant Switcher Pill */}
            <div className="hidden lg:flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 border border-slate-200">
              <Building2 className="w-4 h-4 text-blue-700 ms-2" />
              {MOCK_BRANCHES.map((b) => {
                const isActive = selectedBranch === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => onSelectBranch(b.id)}
                    className={`
                      px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200
                      ${isActive
                        ? 'bg-blue-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'}
                    `}
                  >
                    {b.id === 'CENTER' ? 'المركز (الأكاديمية)' : 'الروضة (الحضانة)'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center: Global Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute inset-y-0 start-3 my-auto text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="البحث السريع عن طالب، فوج، وصل، أو ولي أمر..."
                className="w-full h-10 ps-9 pe-12 text-xs rounded-xl glass-input text-slate-900 placeholder-slate-400"
              />
              <span className="absolute inset-y-0 end-2.5 my-auto h-5 px-1.5 flex items-center text-[10px] font-mono font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded">
                ⌘K
              </span>
            </div>
          </div>

          {/* Right: Actions & User Avatar */}
          <div className="flex items-center gap-3">
            {/* Language Switcher Pill */}
            <button
              onClick={onToggleLang}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-xs"
              title="تبديل اللغة / Changer de langue"
            >
              <Globe className="w-3.5 h-3.5 text-blue-700" />
              <span>{currentLang === 'ar' ? 'العربية' : 'Français'}</span>
            </button>

            {/* Notification Bell */}
            <button className="relative p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-xs">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 end-1.5 w-2 h-2 rounded-full bg-blue-600" />
            </button>

            {/* User Profile Summary */}
            <div className="flex items-center gap-2 ps-2 border-s border-slate-200">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-800 border border-blue-600/20 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                  AD
                </div>
                <span className="absolute -bottom-0.5 -end-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
              </div>
              <div className="hidden xl:flex flex-col text-start">
                <span className="text-xs font-semibold text-slate-900">مدير النظام (Admin)</span>
                <span className="text-[10px] text-blue-700 font-mono font-semibold">SUPER_ADMIN</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
