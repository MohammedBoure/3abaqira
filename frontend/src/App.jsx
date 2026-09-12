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
import { AcademicYearsView } from './components/dashboard/AcademicYearsView';
import { BranchesView } from './components/dashboard/BranchesView';
import { AuditLogsView } from './components/dashboard/AuditLogsView';
import { AuthSecurityView } from './components/dashboard/AuthSecurityView';
import { InvoicesPaymentsView } from './components/dashboard/InvoicesPaymentsView';
import { BudgetsExpensesView } from './components/dashboard/BudgetsExpensesView';
import { HandoversView } from './components/dashboard/HandoversView';
import { PricingPlansView } from './components/dashboard/PricingPlansView';
import { EnrollmentsView } from './components/dashboard/EnrollmentsView';
import { GroupsLevelsView } from './components/dashboard/GroupsLevelsView';
import { SchedulesSessionsView } from './components/dashboard/SchedulesSessionsView';
import { CompetitionsView } from './components/dashboard/CompetitionsView';
import { GuardiansView } from './components/dashboard/GuardiansView';
import { SystemHealthView } from './components/dashboard/SystemHealthView';
import { StudentRegistrationModal, CashDrawerModal } from './components/dashboard/PreviewModals';
import { AuthLoginModal } from './components/common/AuthLoginModal';
import { MOCK_AUTH_USERS } from './mock/mockData';
import { UserCheck } from 'lucide-react';


export function App() {
  const [currentUser, setCurrentUser] = useState(MOCK_AUTH_USERS[0]); // mohammed_admin (SUPER_ADMIN)
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [activeView, setActiveView] = useState('excel-grid');
  const [currentLang, setCurrentLang] = useState('ar');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isDrawerModalOpen, setIsDrawerModalOpen] = useState(false);
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
        `عذراً، حسابك الحالي (${currentUser.full_name}) مقيد بمقر [${currentUser.branch_name_ar}]. صلاحية التنقل بين المقرات مقتصرة على الإدارة العامة.`
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

      {/* 2. Spatial Knowledge Workspace Sidebar (Collapsible) */}
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

      {/* 3. Main Workspace Shell: 100% Full Width Exploitation (Zero Wasted Margin) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Sharp Top Navigation Bar */}
        <Navbar
          selectedBranch={selectedBranch}
          onSelectBranch={handleSelectBranch}
          currentLang={currentLang}
          onToggleLang={toggleLanguage}
          activeView={activeView}
          onSelectView={setActiveView}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onOpenStudentModal={() => setIsStudentModalOpen(true)}
          onOpenDrawerModal={() => setIsDrawerModalOpen(true)}
          currentUser={currentUser}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
        />



        {/* Scrollable Workspace Body */}
        <main className="flex-1 overflow-y-auto px-2.5 sm:px-4 py-3 space-y-3 min-w-0">
          {/* View 1: Excel Data Grid (Primary Spreadsheet Interface) */}
          {activeView === 'excel-grid' && (
            <div className="space-y-3">
              <HeroBanner
                selectedBranch={selectedBranch}
                onOpenStudentModal={() => setIsStudentModalOpen(true)}
                onOpenDrawerModal={() => setIsDrawerModalOpen(true)}
              />
              <MetricGrid selectedBranch={selectedBranch} />
              <ExcelDataGrid
                selectedBranch={selectedBranch}
                onSelectBranch={setSelectedBranch}
              />
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
                    selectedBranch={selectedBranch}
                    onOpenVoucherModal={() => setIsDrawerModalOpen(true)}
                  />
                </div>
                <div>
                  <ProgramsOverview selectedBranch={selectedBranch} />
                </div>
              </div>
            </div>
          )}

          {/* View 4: Academic Programs & Cohorts */}
          {activeView === 'programs' && (
            <div className="space-y-3">
              <ProgramsOverview selectedBranch={selectedBranch} />
            </div>
          )}

          {/* View 5: HR & Staff Payroll Template */}
          {activeView === 'payroll' && (
            <PayrollOverview selectedBranch={selectedBranch} />
          )}

          {/* View 6: Kitchen & Provisions Template */}
          {activeView === 'provisions' && (
            <ProvisionsOverview selectedBranch={selectedBranch} />
          )}

          {/* View 7: Academic Cycles & Years (backend/apis/academic_years.py) */}
          {activeView === 'academic-years' && (
            <AcademicYearsView selectedBranch={selectedBranch} />
          )}

          {/* View 8: Multi-Tenant Branches & Facilities (backend/apis/branches.py) */}
          {activeView === 'branches' && (
            <BranchesView
              selectedBranch={selectedBranch}
              onSelectBranch={setSelectedBranch}
            />
          )}

          {/* View 9: System Audit Trail & Diffs (backend/apis/audit.py) */}
          {activeView === 'audit-trail' && (
            <AuditLogsView selectedBranch={selectedBranch} />
          )}

          {/* View 10: Authentication & Security (backend/apis/auth.py) */}
          {activeView === 'auth-security' && (
            <AuthSecurityView selectedBranch={selectedBranch} />
          )}

          {/* View 11: Invoices & Payments (backend/apis/invoices.py & payments.py) */}
          {activeView === 'invoices-payments' && (
            <InvoicesPaymentsView selectedBranch={selectedBranch} />
          )}

          {/* View 12: Budgets & Expenses (backend/apis/budgets.py & expenses.py) */}
          {activeView === 'budgets-expenses' && (
            <BudgetsExpensesView selectedBranch={selectedBranch} />
          )}

          {/* View 13: Cash Handovers & Registers (backend/apis/handovers.py & registers.py) */}
          {activeView === 'handovers' && (
            <HandoversView selectedBranch={selectedBranch} />
          )}

          {/* View 14: Pricing Plans & Tariffs (backend/apis/pricing_plans.py) */}
          {activeView === 'pricing-plans' && (
            <PricingPlansView selectedBranch={selectedBranch} />
          )}

          {/* View 15: Enrollments & Student Commitments (backend/apis/enrollments.py) */}
          {activeView === 'enrollments' && (
            <EnrollmentsView selectedBranch={selectedBranch} />
          )}

          {/* View 16: Groups, Levels & Classrooms (backend/apis/groups.py, levels.py & classrooms.py) */}
          {activeView === 'groups-levels' && (
            <GroupsLevelsView selectedBranch={selectedBranch} />
          )}

          {/* View 17: Schedules & Sessions Attendance (backend/apis/schedules.py & sessions.py) */}
          {activeView === 'schedules-sessions' && (
            <SchedulesSessionsView selectedBranch={selectedBranch} />
          )}

          {/* View 18: Competitions & Tournaments (backend/apis/competitions.py) */}
          {activeView === 'competitions' && (
            <CompetitionsView selectedBranch={selectedBranch} />
          )}

          {/* View 19: Guardians & Parents (backend/apis/guardians.py) */}
          {activeView === 'guardians' && (
            <GuardiansView selectedBranch={selectedBranch} />
          )}

          {/* View 20: System Health & Metadata (backend/apis/system.py) */}
          {activeView === 'system-health' && (
            <SystemHealthView selectedBranch={selectedBranch} />
          )}
        </main>

        {/* Spatial Knowledge Workspace Blue Status Footer */}
        <footer className="workspace-status select-none">
          <div className="flex items-center gap-2">
            <span className="status-dot" />
            <span className="font-semibold text-slate-800">قاعدة البيانات: نشطة ومتزامنة</span>
            <span className="status-separator">•</span>
            <span className="hidden sm:inline">منظومة الإدارة المركزية لأكاديمية وروضة الأطفال العباقرة</span>
            <span className="status-separator hidden sm:inline">•</span>
            <span className="text-blue-900 font-semibold text-[11px]">
              المقر: {selectedBranch === 'CENTER' ? 'المركز الأكاديمي' : selectedBranch === 'RAWDA' ? 'الروضة والحضانة' : 'كافة الفروع'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-slate-700">
              <UserCheck className="w-3.5 h-3.5 text-blue-900" />
              {currentUser.full_name} ({currentUser.role_label_ar})
            </span>
            <span className="status-separator hidden md:inline">•</span>
            <span className="text-emerald-700 font-semibold">حالة الحساب: مصادق عليه</span>
          </div>
        </footer>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-12 end-4 z-50 bg-blue-950 text-white px-3.5 py-2.5 text-xs shadow-xl border border-blue-800 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 4. Interactive Dialog Modals */}
      <StudentRegistrationModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
      />
      <CashDrawerModal
        isOpen={isDrawerModalOpen}
        onClose={() => setIsDrawerModalOpen(false)}
      />
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
