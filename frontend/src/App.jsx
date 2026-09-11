import React, { useState, useEffect } from 'react';
import { InteractiveBackground } from './components/3d/InteractiveBackground';
import { Navbar } from './components/layout/Navbar';
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

  return (
    <div className="relative min-h-screen text-slate-800 flex flex-col font-arabic bg-slate-100/60">
      {/* 1. Ambient Understated 3D Background */}
      <InteractiveBackground />

      {/* 2. Sharp Full-Width Top Navigation Bar */}
      <Navbar
        selectedBranch={selectedBranch}
        onSelectBranch={setSelectedBranch}
        currentLang={currentLang}
        onToggleLang={toggleLanguage}
        activeView={activeView}
        onSelectView={setActiveView}
      />

      {/* 3. Main Workspace Container: 100% Full Width Exploitation (Zero Wasted Side Margins) */}
      <main className="flex-1 w-full px-2 sm:px-3 py-2 space-y-2.5">
        {/* View 1: Excel Data Grid (Primary Spreadsheet Interface) */}
        {activeView === 'excel-grid' && (
          <div className="space-y-2.5">
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
          <div className="space-y-2.5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 items-start">
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
          <div className="space-y-2.5">
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

      {/* 4. Interactive Dialog Modals */}
      <StudentRegistrationModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
      />
      <CashDrawerModal
        isOpen={isDrawerModalOpen}
        onClose={() => setIsDrawerModalOpen(false)}
      />

      {/* 5. Sharp Architectural Footer (Full Screen Width) */}
      <footer className="w-full border-t border-slate-300 bg-white py-2 px-3 text-[11px] text-slate-600 mt-4 select-none">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-900" />
            <span className="font-bold text-slate-900">
              منظومة 3abaqira Enterprise
            </span>
            <span>—</span>
            <span>واجهة تشغيلية عالية الكثافة بنمط Excel وخطوط معمارية حادة</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[10px]">
            <span className="flex items-center gap-1 text-emerald-800 font-semibold">
              <Database className="w-3 h-3" />
              MySQL: abaqira
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-700">
              <Table className="w-3 h-3" />
              Excel Engine: Active
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-blue-900 font-semibold">
              <Cpu className="w-3 h-3" />
              WebGL Ambient: Active
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

