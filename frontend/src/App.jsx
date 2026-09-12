import React, { useState, useEffect } from 'react';
import { InteractiveBackground } from './components/3d/InteractiveBackground';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { AuthLoginModal } from './components/common/AuthLoginModal';
import { MOCK_AUTH_USERS } from './mock/mockData';
import { UserCheck } from 'lucide-react';

// Rawda Components (docs/frontend.md Section 2)
import { RawdaStudentsRosterView } from './components/dashboard/rawda/RawdaStudentsRosterView';
import { RawdaCohortsKanbanView } from './components/dashboard/rawda/RawdaCohortsKanbanView';
import { RawdaDailyExpensesView } from './components/dashboard/rawda/RawdaDailyExpensesView';
import { RawdaBudgetVarianceView } from './components/dashboard/rawda/RawdaBudgetVarianceView';
import { RawdaCashDrawerView } from './components/dashboard/rawda/RawdaCashDrawerView';
import { RawdaCashHandoverView } from './components/dashboard/rawda/RawdaCashHandoverView';
import { RawdaBreadTrackingView } from './components/dashboard/rawda/RawdaBreadTrackingView';
import { RawdaMeatProvisionsView } from './components/dashboard/rawda/RawdaMeatProvisionsView';

// Center Components (docs/frontend.md Section 3)
import { CenterInstallmentProgramsView } from './components/dashboard/center/CenterInstallmentProgramsView';
import { CenterSorobanView } from './components/dashboard/center/CenterSorobanView';
import { CenterQuranView } from './components/dashboard/center/CenterQuranView';
import { CenterPreparatoryView } from './components/dashboard/center/CenterPreparatoryView';
import { CenterSummerCampView } from './components/dashboard/center/CenterSummerCampView';
import { CenterSorobanChampionshipsView } from './components/dashboard/center/CenterSorobanChampionshipsView';
import { CenterTimetableView } from './components/dashboard/center/CenterTimetableView';
import { CenterFixedPayrollView } from './components/dashboard/center/CenterFixedPayrollView';
import { CenterTrainerPayrollView } from './components/dashboard/center/CenterTrainerPayrollView';
import { CenterDailyExpensesView } from './components/dashboard/center/CenterDailyExpensesView';
import { CenterCashHandoverView } from './components/dashboard/center/CenterCashHandoverView';
import { CenterPricingPolicyView } from './components/dashboard/center/CenterPricingPolicyView';

// Super Admin Comprehensive Workspace Views
import { ExcelDataGrid } from './components/dashboard/ExcelDataGrid';
import { AnalyticsDashboard } from './components/dashboard/AnalyticsDashboard';
import { HeroBanner } from './components/dashboard/HeroBanner';
import { MetricGrid } from './components/dashboard/MetricGrid';

export function App() {
  const [currentUser, setCurrentUser] = useState(MOCK_AUTH_USERS[0]); // mohammed_admin (SUPER_ADMIN)
  const [selectedBranch, setSelectedBranch] = useState('RAWDA');
  const [activeView, setActiveView] = useState('rawda-students');
  const [currentLang, setCurrentLang] = useState('ar');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Branch Selection with Role-Based Authority Enforcement
  const handleSelectBranch = (branchId) => {
    const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.branch_id === 'ALL';
    if (!isAdmin && currentUser.branch_id !== branchId) {
      showToast(
        `عذراً، حسابك الحالي (${currentUser.full_name}) مقيد بمقر [${currentUser.branch_name_ar}].`
      );
      return;
    }
    setSelectedBranch(branchId);
  };

  // Account Switching
  const handleSelectUser = (user) => {
    setCurrentUser(user);
    if (user.branch_id !== 'ALL') {
      setSelectedBranch(user.branch_id);
      setActiveView(user.branch_id === 'CENTER' ? 'center-support-classes' : 'rawda-students');
    }
    showToast(`تم تفعيل حساب: ${user.full_name} (${user.role_label_ar})`);
  };

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
    <div className="relative h-screen w-screen text-slate-800 flex font-arabic bg-[#f8fafc] overflow-hidden">
      {/* 1. Ambient Understated 3D Background */}
      <InteractiveBackground />

      {/* 2. Spatial Knowledge Workspace Sidebar (Collapsible with 2-State Context Switcher) */}
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        selectedBranch={selectedBranch}
        onSelectBranch={handleSelectBranch}
        currentUser={currentUser}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* 3. Main Workspace Shell: 100% Full Width Exploitation */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Navigation Bar */}
        <Navbar
          selectedBranch={selectedBranch}
          onSelectBranch={handleSelectBranch}
          currentLang={currentLang}
          onToggleLang={toggleLanguage}
          activeView={activeView}
          onSelectView={setActiveView}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          currentUser={currentUser}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
        />

        {/* Scrollable Workspace Body */}
        <main className="flex-1 overflow-y-auto px-2.5 sm:px-4 py-3 min-w-0">
          {/* ========================================================= */}
          {/* RAWDA VIEWS (Section 2 of docs/frontend.md)              */}
          {/* ========================================================= */}
          {/* Group 1: التمدرس وشؤون الأطفال */}
          {activeView === 'rawda-students' && <RawdaStudentsRosterView />}
          {activeView === 'rawda-cohorts' && <RawdaCohortsKanbanView />}

          {/* Group 2: المالية والمصاريف التشغيلية */}
          {activeView === 'rawda-daily-expenses' && <RawdaDailyExpensesView />}
          {activeView === 'rawda-budget-variance' && <RawdaBudgetVarianceView />}

          {/* Group 3: حركة الخزينة والسيولة */}
          {activeView === 'rawda-cash-drawer' && <RawdaCashDrawerView />}
          {activeView === 'rawda-cash-handover' && <RawdaCashHandoverView />}

          {/* Group 4: التموين وإطعام الروضة */}
          {activeView === 'rawda-bread-tracking' && <RawdaBreadTrackingView />}
          {activeView === 'rawda-meat-provisions' && <RawdaMeatProvisionsView />}

          {/* ========================================================= */}
          {/* CENTER VIEWS (Section 3 of docs/frontend.md)             */}
          {/* ========================================================= */}
          {/* Group 1: البرامج بنظام الدفعات */}
          {activeView === 'center-support-classes' && (
            <CenterInstallmentProgramsView defaultProgram="support-classes" />
          )}
          {activeView === 'center-languages' && (
            <CenterInstallmentProgramsView defaultProgram="languages" />
          )}
          {activeView === 'center-robotics' && (
            <CenterInstallmentProgramsView defaultProgram="robotics" />
          )}
          {activeView === 'center-school-languages' && (
            <CenterInstallmentProgramsView defaultProgram="school-languages" />
          )}

          {/* Group 2: الأنشطة التخصصية والنوادي */}
          {activeView === 'center-soroban' && <CenterSorobanView />}
          {activeView === 'center-quran' && <CenterQuranView />}
          {activeView === 'center-preparatory' && <CenterPreparatoryView />}
          {activeView === 'center-summer-camp' && <CenterSummerCampView />}
          {activeView === 'center-soroban-championships' && <CenterSorobanChampionshipsView />}
          {activeView === 'center-timetable' && <CenterTimetableView />}

          {/* Group 3: الموارد البشرية والأجور */}
          {activeView === 'center-fixed-payroll' && <CenterFixedPayrollView />}
          {activeView === 'center-trainer-payroll' && <CenterTrainerPayrollView />}

          {/* Group 4: الخزينة، النفقات ودليل الأسعار */}
          {activeView === 'center-daily-expenses' && <CenterDailyExpensesView />}
          {activeView === 'center-cash-handover' && <CenterCashHandoverView />}
          {activeView === 'center-pricing-policy' && <CenterPricingPolicyView />}

          {/* ========================================================= */}
          {/* SUPER ADMIN COMPREHENSIVE TOOLS                           */}
          {/* ========================================================= */}
          {activeView === 'excel-grid' && (
            <div className="space-y-3">
              <HeroBanner
                selectedBranch={selectedBranch}
                onOpenStudentModal={() => setActiveView(selectedBranch === 'CENTER' ? 'center-support-classes' : 'rawda-students')}
                onOpenDrawerModal={() => setActiveView(selectedBranch === 'CENTER' ? 'center-daily-expenses' : 'rawda-cash-drawer')}
              />
              <MetricGrid selectedBranch={selectedBranch} />
              <ExcelDataGrid
                selectedBranch={selectedBranch}
                onSelectBranch={setSelectedBranch}
                onSelectView={setActiveView}
              />
            </div>
          )}

          {activeView === 'analytics' && (
            <AnalyticsDashboard selectedBranch={selectedBranch} />
          )}
        </main>

        {/* Status Footer */}
        <footer className="h-7 text-xs bg-slate-100/90 text-slate-600 border-t border-slate-200 flex items-center justify-between px-3 select-none flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 flex-shrink-0" />
            <span className="font-semibold text-slate-800">قاعدة البيانات: متزامنة ومطابقة لمواصفات 3abaqira</span>
            <span className="text-slate-300">•</span>
            <span className="hidden sm:inline text-slate-600">
              {selectedBranch === 'CENTER' ? 'المركز الأكاديمي والتعليمي (بحاية)' : 'روضة وحضانة الأطفال العباقرة'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-[11px]">
            <span className="flex items-center gap-1 text-slate-700 font-medium">
              <UserCheck className="w-3.5 h-3.5 text-blue-900" />
              {currentUser.full_name} ({currentUser.role_label_ar})
            </span>
            <span className="text-slate-300 hidden md:inline">•</span>
            <span className="text-emerald-700 font-semibold hidden md:inline">مصادق عليه</span>
          </div>
        </footer>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-12 end-4 z-50 bg-blue-950 text-white px-3.5 py-2.5 text-xs shadow-xl border border-blue-800 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Auth Modal */}
      <AuthLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
      />
    </div>
  );
}

export default App;
