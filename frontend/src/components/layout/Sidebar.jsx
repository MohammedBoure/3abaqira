import React from 'react';
import {
  Baby,
  GraduationCap,
  Users,
  Coins,
  TrendingUp,
  Receipt,
  UtensilsCrossed,
  Layers,
  Calendar,
  Wallet,
  ShieldCheck,
  Building,
  Award,
  BookOpen,
  Sun,
  Trophy,
  Tag,
  ArrowLeftRight,
  PanelRightClose,
  PanelLeftClose,
  Lock,
  ChevronDown,
  UserCheck,
  Table,
  BarChart3,
  ShieldAlert,
  KeyRound,
  Activity,
} from 'lucide-react';

export function Sidebar({
  activeView,
  onSelectView,
  selectedBranch = 'RAWDA',
  onSelectBranch,
  currentUser,
  onOpenLoginModal,
  isCollapsed,
  onToggleCollapse,
}) {
  const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.branch_id === 'ALL';
  const effectiveBranch = selectedBranch === 'CENTER' ? 'CENTER' : 'RAWDA';

  // Branch context switch handler
  const handleSwitchBranch = (branchKey) => {
    if (!isAdmin && currentUser?.branch_id !== 'ALL' && currentUser?.branch_id !== branchKey) {
      alert(`عذراً، حسابك الحالي (${currentUser?.full_name}) مقيد بمقر [${currentUser?.branch_name_ar}].`);
      return;
    }
    onSelectBranch(branchKey);
    // Set default view for the selected entity
    if (branchKey === 'RAWDA') {
      onSelectView('rawda-students');
    } else {
      onSelectView('center-support-classes');
    }
  };

  // 1. Rawda Navigation Groups (Section 2)
  const rawdaNavigationGroups = [
    {
      groupTitle: 'التمدرس وشؤون الأطفال',
      groupEn: 'STUDENT AFFAIRS',
      items: [
        { id: 'rawda-students', labelAr: 'المداخيل و التسجيلات', icon: Users, tag: 'تسجيل' },
        { id: 'rawda-cohorts', labelAr: 'تقسيم الأفواج', icon: Layers, tag: 'أفواج' },
      ],
    },
    {
      groupTitle: 'المالية والمصاريف التشغيلية',
      groupEn: 'OPERATING EXPENSES',
      items: [
        { id: 'rawda-daily-expenses', labelAr: 'سجل المصاريف اليومية', icon: TrendingUp, tag: '11 شهر' },
        { id: 'rawda-budget-variance', labelAr: 'ملخص المصاريف وتحليل الموازنة', icon: Coins, tag: 'تقديري/فعلي' },
      ],
    },
    {
      groupTitle: 'حركة الخزينة والسيولة',
      groupEn: 'TREASURY & VAULT',
      items: [
        { id: 'rawda-cash-drawer', labelAr: 'الملخص اليومي للصندوق', icon: Receipt, tag: 'صندوق' },
        { id: 'rawda-cash-handover', labelAr: 'سجل تسليم السيولة والعهد', icon: ArrowLeftRight, tag: 'تسليم' },
      ],
    },
    {
      groupTitle: 'التموين وإطعام الروضة',
      groupEn: 'PROVISIONS & DIETARY',
      items: [
        { id: 'rawda-bread-tracking', labelAr: 'المراقبة اليومية لاستهلاك الخبز', icon: UtensilsCrossed, tag: 'خبز' },
        { id: 'rawda-meat-provisions', labelAr: 'طلبيات اللحوم والتموين الغذائي', icon: Building, tag: 'لحوم' },
      ],
    },
  ];

  // 2. Center Navigation Groups (Section 3)
  const centerNavigationGroups = [
    {
      groupTitle: 'البرامج بنظام الدفعات',
      groupEn: 'INSTALLMENT COURSES',
      items: [
        { id: 'center-support-classes', labelAr: 'دروس الدعم العلمي والأدبي', icon: GraduationCap, tag: 'دعم' },
        { id: 'center-languages', labelAr: 'برنامج اللغات - دورات المستويات', icon: BookOpen, tag: 'لغات' },
        { id: 'center-robotics', labelAr: 'نادي الروبوتيك والذكاء الاصطناعي', icon: Layers, tag: 'STEM' },
        { id: 'center-school-languages', labelAr: 'دعم مناهج اللغات المدرسية', icon: BookOpen, tag: 'مناهج' },
      ],
    },
    {
      groupTitle: 'الأنشطة التخصصية والنوادي',
      groupEn: 'CLUBS & SPECIALTIES',
      items: [
        { id: 'center-soroban', labelAr: 'سجل السوروبان والحساب الذهني', icon: Award, tag: 'سوروبان' },
        { id: 'center-quran', labelAr: 'برنامج تحفيظ القرآن الكريم', icon: BookOpen, tag: 'سداسي' },
        { id: 'center-preparatory', labelAr: 'القسم التحضيري المدرسي (2025)', icon: GraduationCap, tag: 'تحضيري' },
        { id: 'center-summer-camp', labelAr: 'النادي والمخيم الصيفي', icon: Sun, tag: 'دفعتين' },
        { id: 'center-soroban-championships', labelAr: 'سجل بطولات السوروبان', icon: Trophy, tag: 'بطولات' },
        { id: 'center-timetable', labelAr: 'جدول توقيت الأفواج والقاعات', icon: Calendar, tag: 'توقيت' },
      ],
    },
    {
      groupTitle: 'الموارد البشرية والأجور',
      groupEn: 'HR & TRAINERS PAYROLL',
      items: [
        { id: 'center-fixed-payroll', labelAr: 'جدول الرواتب الشهرية الثابتة', icon: Wallet, tag: 'رواتب' },
        { id: 'center-trainer-payroll', labelAr: 'احتساب أجور المدربين (بالحصة)', icon: Coins, tag: 'محاكي' },
      ],
    },
    {
      groupTitle: 'الخزينة، النفقات والأسعار',
      groupEn: 'TREASURY & PRICING',
      items: [
        { id: 'center-daily-expenses', labelAr: 'المصاريف اليومية للمركز', icon: TrendingUp, tag: 'مصاريف' },
        { id: 'center-cash-handover', labelAr: 'سجل تسليم العهدة النقدية', icon: ArrowLeftRight, tag: 'عهدة' },
        { id: 'center-pricing-policy', labelAr: 'دليل الأسعار وسياسة الخصومات', icon: Tag, tag: 'تعريفات' },
      ],
    },
  ];

  const currentGroups = effectiveBranch === 'RAWDA' ? rawdaNavigationGroups : centerNavigationGroups;

  // Collapsed Sidebar rendering
  if (isCollapsed) {
    return (
      <aside className="w-12 border-e border-slate-200 bg-slate-50 flex flex-col items-center py-3 flex-shrink-0 z-30 select-none overflow-y-auto">
        <button
          onClick={onToggleCollapse}
          className="mb-4 hover:scale-105 transition-transform"
          title="توسيع القائمة الجانبية"
        >
          <img
            src="/assets/branding/logo.webp"
            alt="3abaqira"
            className="w-8 h-8 rounded-full border border-blue-300 shadow-2xs object-cover"
          />
        </button>

        {/* 2-State Switcher in Collapsed Mode */}
        <div className="flex flex-col gap-1 w-full items-center pb-3 border-b border-slate-200 mb-2">
          <button
            onClick={() => handleSwitchBranch('RAWDA')}
            className={`w-9 h-9 rounded flex items-center justify-center transition-colors ${
              effectiveBranch === 'RAWDA'
                ? 'bg-pink-900 text-white shadow-2xs'
                : 'text-slate-500 hover:bg-slate-200'
            }`}
            title="روضة أكاديمية الأطفال العباقرة (قسم الحضانة والتعليم المبكر)"
          >
            <Baby className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleSwitchBranch('CENTER')}
            className={`w-9 h-9 rounded flex items-center justify-center transition-colors ${
              effectiveBranch === 'CENTER'
                ? 'bg-blue-900 text-white shadow-2xs'
                : 'text-slate-500 hover:bg-slate-200'
            }`}
            title="المركز الأكاديمي والتعليمي (قسم الدورات واللغات)"
          >
            <GraduationCap className="w-4 h-4" />
          </button>
        </div>

        {/* Collapsed Nav items */}
        <div className="flex flex-col gap-1 w-full items-center flex-1">
          {currentGroups.flatMap((g) => g.items).map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`w-9 h-9 flex items-center justify-center rounded transition-colors ${
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
      {/* 1. Header with System Brand Logo */}
      <div className="p-3 pb-2.5 border-b border-slate-200/80 flex items-center justify-between">
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
              أكاديمية وروضة العباقرة
            </span>
          </div>
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="طي القائمة الجانبية"
        >
          <PanelRightClose className="w-4 h-4" />
        </button>
      </div>

      {/* 2. محول السياق العلوي (Exclusive Fixed 2-State Entity Switcher - Section 1.2) */}
      <div className="p-2.5 border-b border-slate-200 bg-slate-50/80">
        <span className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">
          محول المنظومة والنشاط (CONTEXT SWITCHER)
        </span>
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/80 rounded border border-slate-300">
          {/* Option 1: الروضة والحضانة */}
          <button
            onClick={() => handleSwitchBranch('RAWDA')}
            className={`p-2 flex flex-col items-center justify-center text-center rounded transition-all ${
              effectiveBranch === 'RAWDA'
                ? 'bg-white text-pink-950 shadow-sm border border-pink-300 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
            title="روضة أكاديمية الأطفال العباقرة (قسم الحضانة والتعليم المبكر)"
          >
            <Baby className={`w-4 h-4 mb-0.5 ${effectiveBranch === 'RAWDA' ? 'text-pink-600' : 'text-slate-500'}`} />
            <span className="text-[11px] leading-tight">روضة العباقرة</span>
            <span className="text-[8px] opacity-75 font-normal">الحضانة والتعليم المبكر</span>
          </button>

          {/* Option 2: المركز الأكاديمي */}
          <button
            onClick={() => handleSwitchBranch('CENTER')}
            className={`p-2 flex flex-col items-center justify-center text-center rounded transition-all ${
              effectiveBranch === 'CENTER'
                ? 'bg-blue-900 text-white shadow-sm border border-blue-950 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
            title="المركز الأكاديمي والتعليمي (قسم الدورات، اللغات، والأنشطة المتخصصة)"
          >
            <GraduationCap className={`w-4 h-4 mb-0.5 ${effectiveBranch === 'CENTER' ? 'text-blue-200' : 'text-slate-500'}`} />
            <span className="text-[11px] leading-tight">المركز التعليمي</span>
            <span className="text-[8px] opacity-75 font-normal">الدورات واللغات والسوروبان</span>
          </button>
        </div>
      </div>

      {/* 3. Rebuilt Navigation Groups based on selected entity */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-3.5">
        {currentGroups.map((group, gIdx) => (
          <div key={gIdx}>
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-xs font-bold text-slate-800">
                {group.groupTitle}
              </span>
              <span className="text-[9px] font-mono text-slate-400">
                {group.groupEn}
              </span>
            </div>
            <nav className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectView(item.id)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded transition-colors text-start ${
                      isActive
                        ? 'bg-blue-900 text-white font-bold shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-200' : 'text-slate-500'}`} />
                      <span className="truncate">{item.labelAr}</span>
                    </div>
                    <span
                      className={`text-[9px] font-mono px-1 py-0.2 rounded-[2px] shrink-0 ${
                        isActive
                          ? 'bg-blue-800 text-blue-100'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.tag}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        ))}

        {/* Super Admin Comprehensive Tools Section */}
        {isAdmin && (
          <div className="pt-2 border-t border-slate-200">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 block mb-1">
              الإدارة الشاملة (SUPER ADMIN)
            </span>
            <div className="space-y-0.5">
              <button
                onClick={() => onSelectView('excel-grid')}
                className={`w-full flex items-center justify-between px-2 py-1 text-xs rounded transition-colors ${
                  activeView === 'excel-grid'
                    ? 'bg-blue-900 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Table className="w-3.5 h-3.5 text-blue-600" />
                  <span>جدول البيانات الشامل (Excel Grid)</span>
                </div>
                <span className="text-[9px] font-mono px-1 py-0.2 bg-blue-50 text-blue-800">26 عمود</span>
              </button>

              <button
                onClick={() => onSelectView('analytics')}
                className={`w-full flex items-center justify-between px-2 py-1 text-xs rounded transition-colors ${
                  activeView === 'analytics'
                    ? 'bg-blue-900 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                  <span>التحليلات والإحصائيات العامة</span>
                </div>
                <span className="text-[9px] font-mono px-1 py-0.2 bg-slate-100 text-slate-600">إحصاء</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Active User Account & Switcher Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-slate-500 font-semibold">المستخدم النشط</span>
          <button
            onClick={onOpenLoginModal}
            className="text-[10px] text-blue-900 font-bold hover:underline"
          >
            تبديل الحساب
          </button>
        </div>

        <button
          onClick={onOpenLoginModal}
          className="w-full p-1.5 bg-white hover:bg-blue-50/60 border border-slate-300 flex items-center justify-between text-start transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 bg-blue-950 text-white flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
              {currentUser?.full_name?.split(' ').map((n) => n[0]).join('') || 'U'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-900 leading-tight truncate">
                {currentUser?.full_name || 'محمد بوري'}
              </span>
              <span className="text-[9px] text-slate-500 truncate">
                {currentUser?.role_label_ar || 'مدير عام'}
              </span>
            </div>
          </div>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-blue-50 text-blue-900 border border-blue-200">
            {effectiveBranch === 'CENTER' ? 'المركز' : 'الروضة'}
          </span>
        </button>
      </div>
    </aside>
  );
}
