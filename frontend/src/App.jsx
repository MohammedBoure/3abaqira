import React, { useState, useEffect } from 'react';
import { InteractiveBackground } from './components/3d/InteractiveBackground';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { HeroBanner } from './components/dashboard/HeroBanner';
import { MetricGrid } from './components/dashboard/MetricGrid';
import { ExcelDataGrid } from './components/dashboard/ExcelDataGrid';
import { AnalyticsDashboard } from './components/dashboard/AnalyticsDashboard';
import { CashDrawerOverview } from './components/dashboard/CashDrawerOverview';
import { ProgramsOverview } from './components/dashboard/ProgramsOverview';
import { PayrollOverview } from './components/dashboard/PayrollOverview';
import { ProvisionsOverview } from './components/dashboard/ProvisionsOverview';
import { StudentRegistrationModal, CashDrawerModal } from './components/dashboard/PreviewModals';
import { Database, Cpu, Table, BarChart3, Coins, Users, UtensilsCrossed, GraduationCap } from 'lucide-react';

export function App() {
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [activeView, setActiveView] = useState('excel-grid'); // 'excel-grid' | 'analytics' | 'treasury' | 'programs' | 'payroll' | 'provisions'
  const [currentLang, setCurrentLang] = useState('ar');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isDrawerModalOpen, setIsDrawerModalOpen] = useState(false);

  // Toggle Language / Direction
  const toggleLanguage = () => {
    const nextLang = currentLang === 'ar' ? 'fr' : 'ar';
    setCurrentLang(nextLang);
    document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = nextLang;
  };

  useEffect(() => {
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
  }, [currentLang]);

  const viewHeaders = {
    'excel-grid': {
      title: 'سجل جداول البيانات الموحد (Master Spreadsheet Ledger)',
      eyebrow: 'SPREADSHEET SYSTEM / EXCEL ENGINE',
    },
    'analytics': {
      title: 'منظومة الإحصائيات والتحليلات القيادية (Executive Analytics)',
      eyebrow: 'BUSINESS INTELLIGENCE / CHARTS',
    },
    'treasury': {
      title: 'حركة الصندوق والخزينة اليومية (Treasury & Cash Flow)',
      eyebrow: 'FINANCIAL LEDGER / CASH DESK',
    },
    'programs': {
      title: 'دليل البرامج والمستويات الأكاديمية (Academic Programs)',
      eyebrow: 'CURRICULUM & COHORTS',
    },
    'payroll': {
      title: 'سجل الأجور والرواتب المستحقة (Payroll & Staff Compensation)',
      eyebrow: 'HUMAN RESOURCES / SALARIES',
    },
    'provisions': {
      title: 'تموين ومطعم الروضة (Provisions & Kitchen Supplies)',
      eyebrow: 'LOGISTICS & INVENTORY',
    },
  };

  return (
    <div className="relative h-screen w-screen text-slate-800 flex font-arabic bg-[#f8fafc] overflow-hidden">
      {/* 1. Ambient Understated 3D Background */}
      <InteractiveBackground />

      {/* 2. Spatial Knowledge Workspace Sidebar (Collapsible) */}
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        selectedBranch={selectedBranch}
        onSelectBranch={setSelectedBranch}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* 3. Main Workspace Shell: 100% Full Width Exploitation (Zero Wasted Margin) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Sharp Top Navigation Bar */}
        <Navbar
          selectedBranch={selectedBranch}
          onSelectBranch={setSelectedBranch}
          currentLang={currentLang}
          onToggleLang={toggleLanguage}
          activeView={activeView}
          onSelectView={setActiveView}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onOpenStudentModal={() => setIsStudentModalOpen(true)}
          onOpenDrawerModal={() => setIsDrawerModalOpen(true)}
        />

        {/* Board Heading with Margin View Switcher */}
        <div className="px-3 sm:px-4 pt-2.5 pb-2 border-b border-slate-200/80 bg-white/70 backdrop-blur-xs flex flex-col md:flex-row md:items-center justify-between gap-2 flex-shrink-0 z-10 select-none">
          <div>
            <div className="eyebrow flex items-center gap-1.5">
              <span>3ABAQIRA SPATIAL</span>
              <span>/</span>
              <span className="text-blue-900 font-bold">{viewHeaders[activeView]?.eyebrow || 'MODULE'}</span>
            </div>
            <h1 className="text-sm sm:text-base font-bold font-serif text-slate-900 tracking-tight mt-0.5">
              {viewHeaders[activeView]?.title || 'منظومة إدارة العباقرة'}
            </h1>
          </div>

          <div className="view-switch overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveView('excel-grid')}
              className={activeView === 'excel-grid' ? 'active' : ''}
            >
              <Table className="w-3.5 h-3.5" />
              <span>جداول البيانات (Excel)</span>
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={activeView === 'analytics' ? 'active' : ''}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>التحليلات</span>
            </button>
            <button
              onClick={() => setActiveView('treasury')}
              className={activeView === 'treasury' ? 'active' : ''}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>الخزينة</span>
            </button>
            <button
              onClick={() => setActiveView('programs')}
              className={activeView === 'programs' ? 'active' : ''}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>البرامج</span>
            </button>
            <button
              onClick={() => setActiveView('payroll')}
              className={activeView === 'payroll' ? 'active' : ''}
            >
              <Users className="w-3.5 h-3.5" />
              <span>الأجور</span>
            </button>
            <button
              onClick={() => setActiveView('provisions')}
              className={activeView === 'provisions' ? 'active' : ''}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>التموين</span>
            </button>
          </div>
        </div>

        {/* Scrollable Workspace Body */}
        <main className="flex-1 overflow-y-auto px-2.5 sm:px-4 py-3 space-y-3 min-w-0">
          {/* View 1: Excel Data Grid (Primary Spreadsheet Interface) */}
          {activeView === 'excel-grid' && (
            <div className="space-y-3">
              <HeroBanner
                onOpenStudentModal={() => setIsStudentModalOpen(true)}
                onOpenDrawerModal={() => setIsDrawerModalOpen(true)}
              />
              <MetricGrid />
              <ExcelDataGrid selectedBranch={selectedBranch} />
            </div>
          )}

          {/* View 2: Professional Analytics & Executive Statistics */}
          {activeView === 'analytics' && (
            <AnalyticsDashboard selectedBranch={selectedBranch} />
          )}

          {/* View 3: Daily Treasury & Cash Register Ledger */}
          {activeView === 'treasury' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
                <div className="lg:col-span-2">
                  <CashDrawerOverview
                    onOpenVoucherModal={() => setIsDrawerModalOpen(true)}
                  />
                </div>
                <div>
                  <ProgramsOverview />
                </div>
              </div>
            </div>
          )}

          {/* View 4: Academic Programs & Cohorts */}
          {activeView === 'programs' && (
            <div className="space-y-3">
              <ProgramsOverview />
            </div>
          )}

          {/* View 5: HR & Staff Payroll Template */}
          {activeView === 'payroll' && (
            <PayrollOverview />
          )}

          {/* View 6: Kitchen & Provisions Template */}
          {activeView === 'provisions' && (
            <ProvisionsOverview />
          )}
        </main>

        {/* Spatial Knowledge Workspace Blue Status Footer */}
        <footer className="workspace-status select-none">
          <div className="flex items-center gap-2">
            <span className="status-dot" />
            <span className="font-semibold text-slate-800">قاعدة البيانات: MySQL (abaqira)</span>
            <span className="status-separator">•</span>
            <span className="hidden sm:inline">نظام التخزين المحلي المتزامن</span>
            <span className="status-separator hidden sm:inline">•</span>
            <span className="text-blue-900 font-mono text-[10px]">3abaqira Spatial Blue v2.4</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[10px]">
            <span className="flex items-center gap-1 text-slate-700">
              <Table className="w-3 h-3 text-blue-900" />
              Excel Engine: 26 cols
            </span>
            <span className="status-separator hidden md:inline">•</span>
            <span className="hidden md:flex items-center gap-1 text-slate-600">
              <Cpu className="w-3 h-3 text-blue-900" />
              WebGL Canvas: Active
            </span>
            <span className="status-separator">•</span>
            <span className="text-emerald-700 font-semibold">100% Full Width</span>
          </div>
        </footer>
      </div>

      {/* 4. Interactive Dialog Modals */}
      <StudentRegistrationModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
      />
      <CashDrawerModal
        isOpen={isDrawerModalOpen}
        onClose={() => setIsDrawerModalOpen(false)}
      />
    </div>
  );
}

export default App;

