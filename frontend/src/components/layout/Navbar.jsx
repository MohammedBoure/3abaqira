import React from 'react';
import { Search, Bell, Globe, ChevronDown, Sparkles, Building2, UserCircle2 } from 'lucide-react';
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
    <header className="sticky top-0 z-40 w-full border-b border-blue-400/20 bg-[#0a192f]/70 backdrop-blur-xl shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">

          {/* Left: Swappable Brand Logo */}
          <div className="flex items-center gap-6">
            <BrandLogo size="md" variant="full" />

            {/* Branch Multi-tenant Switcher Pill */}
            <div className="hidden lg:flex items-center gap-1.5 p-1 rounded-xl bg-blue-950/60 border border-blue-500/25 backdrop-blur-md">
              <Building2 className="w-4 h-4 text-blue-400 ms-2" />
              {MOCK_BRANCHES.map((b) => {
                const isActive = selectedBranch === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => onSelectBranch(b.id)}
                    className={`
                      px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200
                      ${isActive
                        ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.5)] border border-blue-300/40'
                        : 'text-blue-200 hover:text-white hover:bg-blue-900/40'}
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
              <Search className="w-4 h-4 absolute inset-y-0 start-3 my-auto text-blue-300/60 pointer-events-none" />
              <input
                type="text"
                placeholder="البحث السريع عن طالب، فوج، وصل، أو ولي أمر..."
                className="w-full h-10 ps-9 pe-12 text-xs rounded-xl glass-input text-white placeholder-blue-300/50"
              />
              <span className="absolute inset-y-0 end-2.5 my-auto h-5 px-1.5 flex items-center text-[10px] font-mono font-medium text-blue-300/70 bg-blue-900/70 border border-blue-500/30 rounded">
                ⌘K
              </span>
            </div>
          </div>

          {/* Right: Actions & User Avatar */}
          <div className="flex items-center gap-3">
            {/* Language Switcher Pill */}
            <button
              onClick={onToggleLang}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-950/50 border border-blue-400/25 text-xs font-medium text-blue-200 hover:text-white hover:border-blue-400/50 transition-colors"
              title="تبديل اللغة / Changer de langue"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>{currentLang === 'ar' ? 'العربية' : 'Français'}</span>
            </button>

            {/* Notification Bell */}
            <button className="relative p-2 rounded-xl bg-blue-950/50 border border-blue-400/25 text-blue-200 hover:text-white hover:border-blue-400/50 transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 end-1.5 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
            </button>

            {/* User Profile Summary */}
            <div className="flex items-center gap-2 ps-2 border-s border-blue-400/20">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-900 border border-blue-400/40 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  AD
                </div>
                <span className="absolute -bottom-0.5 -end-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0a192f]" />
              </div>
              <div className="hidden xl:flex flex-col text-start">
                <span className="text-xs font-semibold text-white">مدير النظام (Admin)</span>
                <span className="text-[10px] text-cyan-300/80 font-mono font-medium">SUPER_ADMIN</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
