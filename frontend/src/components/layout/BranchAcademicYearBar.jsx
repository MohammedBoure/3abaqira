import React, { useState } from 'react';
import {
  Building2,
  Calendar,
  ChevronDown,
  Check,
  School,
  Baby,
  GraduationCap,
  Sparkles,
  Users,
  DoorOpen,
  Filter,
} from 'lucide-react';
import { MOCK_13_BRANCHES, MOCK_ACADEMIC_YEARS_EXTENDED } from '../../mock/academyHrMockData';

/**
 * BranchAcademicYearBar
 * High-density top bar switcher providing:
 * 1. 13-branch switcher annotating Academy vs Kindergarten type.
 * 2. Academic fiscal year selector with atomic current indicator.
 * Excel-like technical styling, RTL Cairo font, zero neon bloat.
 */
export function BranchAcademicYearBar({
  selectedBranchId,
  onSelectBranch,
  selectedYearId,
  onSelectYear,
}) {
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [branchFilter, setBranchFilter] = useState('ALL'); // 'ALL' | 'ACADEMY' | 'KINDERGARTEN'

  const currentBranch =
    MOCK_13_BRANCHES.find((b) => b.id === selectedBranchId) || MOCK_13_BRANCHES[0];

  const currentYear =
    MOCK_ACADEMIC_YEARS_EXTENDED.find((y) => y.yearId === selectedYearId) ||
    MOCK_ACADEMIC_YEARS_EXTENDED.find((y) => y.isCurrent) ||
    MOCK_ACADEMIC_YEARS_EXTENDED[0];

  const filteredBranches = MOCK_13_BRANCHES.filter((b) => {
    if (branchFilter === 'ALL') return true;
    return b.type === branchFilter;
  });

  const academyCount = MOCK_13_BRANCHES.filter((b) => b.type === 'ACADEMY').length;
  const kindergartenCount = MOCK_13_BRANCHES.filter((b) => b.type === 'KINDERGARTEN').length;

  return (
    <div className="bg-slate-900 text-slate-100 border-b border-slate-800 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs select-none">
      {/* Right / Start: 13-Branch Switcher */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-slate-400 font-medium">
          <Building2 className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">المقر / الفرع (13 فرعاً بولاية جيجل):</span>
          <span className="sm:hidden">الفرع:</span>
        </div>

        {/* Dropdown Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsBranchDropdownOpen(!isBranchDropdownOpen);
              setIsYearDropdownOpen(false);
            }}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded px-2.5 py-1 text-xs font-semibold text-white shadow-2xs transition-colors"
          >
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold ${
                currentBranch.type === 'ACADEMY'
                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}
            >
              {currentBranch.type === 'ACADEMY' ? (
                <GraduationCap className="w-2.5 h-2.5" />
              ) : (
                <Baby className="w-2.5 h-2.5" />
              )}
              {currentBranch.typeLabelAr}
            </span>
            <span className="truncate max-w-[150px] sm:max-w-[220px]">
              {currentBranch.nameAr}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">({currentBranch.code})</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* 13 Branches Popup Menu */}
          {isBranchDropdownOpen && (
            <div className="absolute top-full start-0 mt-1 w-80 sm:w-96 bg-white text-slate-800 border border-slate-300 shadow-xl rounded z-50 overflow-hidden text-xs">
              {/* Header filter pills */}
              <div className="bg-slate-100 p-2 border-b border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-700 text-[11px]">
                  دليل مقرات ولاية جيجل (13 مقراً)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setBranchFilter('ALL')}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      branchFilter === 'ALL'
                        ? 'bg-slate-800 text-white'
                        : 'bg-white text-slate-600 border border-slate-300'
                    }`}
                  >
                    الكل (13)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBranchFilter('ACADEMY')}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      branchFilter === 'ACADEMY'
                        ? 'bg-blue-700 text-white'
                        : 'bg-white text-blue-800 border border-blue-200'
                    }`}
                  >
                    أكاديميات ({academyCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBranchFilter('KINDERGARTEN')}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      branchFilter === 'KINDERGARTEN'
                        ? 'bg-amber-700 text-white'
                        : 'bg-white text-amber-800 border border-amber-200'
                    }`}
                  >
                    رياض أطفال ({kindergartenCount})
                  </button>
                </div>
              </div>

              {/* Scrollable Branches List */}
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {filteredBranches.map((branch) => {
                  const isSelected = branch.id === currentBranch.id;
                  return (
                    <button
                      key={branch.id}
                      type="button"
                      onClick={() => {
                        onSelectBranch(branch.id);
                        setIsBranchDropdownOpen(false);
                      }}
                      className={`w-full text-start p-2 hover:bg-slate-50 flex items-start justify-between gap-2 transition-colors ${
                        isSelected ? 'bg-sky-50/70 border-s-4 border-sky-600' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                              branch.type === 'ACADEMY'
                                ? 'bg-blue-100 text-blue-900'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {branch.typeLabelAr}
                          </span>
                          <span className="font-bold text-slate-900 truncate">
                            {branch.nameAr}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {branch.code}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {branch.address}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1 font-mono">
                          <span className="flex items-center gap-1">
                            <DoorOpen className="w-2.5 h-2.5 text-slate-500" />
                            {branch.roomsCount} قاعات
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-2.5 h-2.5 text-slate-500" />
                            {branch.enrolledCount} مسجل / {branch.totalCapacity} طاقة
                          </span>
                          <span>• {branch.activeStaff} موظف</span>
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-sky-600 flex-shrink-0 mt-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Quick type badge */}
        <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 border border-slate-700">
          <span className="text-slate-400">النوع التشغيلي:</span>
          <span className="text-sky-300 font-semibold">{currentBranch.typeLabelAr}</span>
          <span className="text-slate-500 font-mono">({currentBranch.city})</span>
        </span>
      </div>

      {/* Left / End: Academic Fiscal Year Selector */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-slate-400 font-medium">
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">السنة الأكاديمية:</span>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsYearDropdownOpen(!isYearDropdownOpen);
              setIsBranchDropdownOpen(false);
            }}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded px-2.5 py-1 text-xs font-semibold text-white shadow-2xs transition-colors"
          >
            {currentYear.isCurrent && (
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            )}
            <span className="font-mono">{currentYear.name}</span>
            <span className="text-[10px] text-slate-300">
              {currentYear.isCurrent ? '(الحالي)' : `(${currentYear.status})`}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Academic Years Dropdown */}
          {isYearDropdownOpen && (
            <div className="absolute top-full end-0 mt-1 w-72 bg-white text-slate-800 border border-slate-300 shadow-xl rounded z-50 overflow-hidden text-xs">
              <div className="bg-slate-100 p-2 border-b border-slate-200">
                <span className="font-bold text-slate-700 text-[11px]">
                  السنوات والمواسم الأكاديمية
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  وفق قاعدة البيانات: سنة واحدة فقط نشطة حالياً وغير متداخلة
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {MOCK_ACADEMIC_YEARS_EXTENDED.map((year) => {
                  const isSelected = year.yearId === currentYear.yearId;
                  return (
                    <button
                      key={year.yearId}
                      type="button"
                      onClick={() => {
                        onSelectYear(year.yearId);
                        setIsYearDropdownOpen(false);
                      }}
                      className={`w-full text-start p-2 hover:bg-slate-50 flex items-center justify-between gap-2 transition-colors ${
                        isSelected ? 'bg-emerald-50/80 border-s-4 border-emerald-600' : ''
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          {year.isCurrent ? (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800 font-semibold">
                              الموسم الحالي
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600">
                              {year.status === 'ARCHIVED' ? 'مؤرشف' : 'قادم'}
                            </span>
                          )}
                          <span className="font-mono">{year.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {year.startDate} إلى {year.endDate}
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
