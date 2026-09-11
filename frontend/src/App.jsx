import React, { useState, useEffect } from 'react';
import { InteractiveBackground } from './components/3d/InteractiveBackground';
import { Navbar } from './components/layout/Navbar';
import { HeroBanner } from './components/dashboard/HeroBanner';
import { MetricGrid } from './components/dashboard/MetricGrid';
import { MockDataGrid } from './components/dashboard/MockDataGrid';
import { CashDrawerOverview } from './components/dashboard/CashDrawerOverview';
import { ProgramsOverview } from './components/dashboard/ProgramsOverview';
import { StudentRegistrationModal, CashDrawerModal } from './components/dashboard/PreviewModals';
import { Database, Cpu } from 'lucide-react';

export function App() {
  const [selectedBranch, setSelectedBranch] = useState('CENTER');
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
    <div className="relative min-h-screen text-slate-800 flex flex-col font-arabic">
      {/* 1. Subtle Ambient 3D WebGL Background Engine */}
      <InteractiveBackground />

      {/* 2. Top Navigation Bar */}
      <Navbar
        selectedBranch={selectedBranch}
        onSelectBranch={setSelectedBranch}
        currentLang={currentLang}
        onToggleLang={toggleLanguage}
        onOpenNewStudent={() => setIsStudentModalOpen(true)}
      />

      {/* 3. Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Welcome Banner */}
        <HeroBanner
          onOpenStudentModal={() => setIsStudentModalOpen(true)}
          onOpenDrawerModal={() => setIsDrawerModalOpen(true)}
        />

        {/* Analytic KPI Metrics Grid */}
        <MetricGrid />

        {/* Primary Data Grid & Secondary Analytics Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main 2-Column Wide: Student Roster Grid */}
          <div className="lg:col-span-2 space-y-8">
            <MockDataGrid selectedBranch={selectedBranch} />
          </div>

          {/* Right Side Column: Cashbox & Academic Programs Showcase */}
          <div className="space-y-8">
            <CashDrawerOverview
              onOpenVoucherModal={() => setIsDrawerModalOpen(true)}
            />
            <ProgramsOverview />
          </div>
        </div>
      </main>

      {/* 4. Interactive Modals (Visual Previews) */}
      <StudentRegistrationModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
      />
      <CashDrawerModal
        isOpen={isDrawerModalOpen}
        onClose={() => setIsDrawerModalOpen(false)}
      />

      {/* 5. Professional Classic Footer */}
      <footer className="border-t border-slate-200 bg-white/80 backdrop-blur-md mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            <span className="font-semibold text-slate-800">
              منصة إدارة العباقرة الموحدة (3abaqira Enterprise)
            </span>
            <span>—</span>
            <span>النموذج المرئي المهني الكلاسيكي</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <Database className="w-3.5 h-3.5" />
              MySQL Engine (abaqira)
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-blue-700 font-medium">
              <Cpu className="w-3.5 h-3.5" />
              Three.js WebGL Ambient
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default App;
