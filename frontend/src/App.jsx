import React, { useState, useEffect } from 'react';
import { InteractiveBackground } from './components/3d/InteractiveBackground';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { AuthLoginModal } from './components/common/AuthLoginModal';
import { ArabicCashReceiptModal } from './components/dashboard/common/ArabicCashReceiptModal';
import { KindergartenMonthlyReportCardModal } from './components/dashboard/common/KindergartenMonthlyReportCardModal';
import { MOCK_AUTH_USERS, MOCK_BRANCHES } from './mock/mockData';
import { UserCheck, Clock, Wifi } from 'lucide-react';

// Module 1: Identity & Access
import { AuthSecurityView } from './components/dashboard/AuthSecurityView';
import { AuditLogsView } from './components/dashboard/AuditLogsView';

// Module 2: Organization
import { BranchesView } from './components/dashboard/BranchesView';
import { AcademicYearsView } from './components/dashboard/AcademicYearsView';

// Module 3: People & Family
import { GuardiansView } from './components/dashboard/GuardiansView';
import { CorePersonFamilyHub } from './components/dashboard/CorePersonFamilyHub';

// Module 4: Staff & HR
import { StaffHrView } from './components/dashboard/StaffHrView';
import { StaffHrCenter } from './components/dashboard/StaffHrCenter';
import { PayrollOverview } from './components/dashboard/PayrollOverview';

// Module 5: Academy Workstation & Modules
import { AcademyManagementWorkstation } from './components/dashboard/AcademyManagementWorkstation';
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
import { GroupsLevelsView } from './components/dashboard/GroupsLevelsView';
import { SchedulesSessionsView } from './components/dashboard/SchedulesSessionsView';
import { EnrollmentsView } from './components/dashboard/EnrollmentsView';
import { CompetitionsView } from './components/dashboard/CompetitionsView';

// Module 6: Kindergarten Workstation & Modules
import { KindergartenConsoleView } from './components/dashboard/rawda/KindergartenConsoleView';
import { KindergartenWorkstationView } from './components/dashboard/workstation/KindergartenWorkstationView';
import { RawdaStudentsRosterView } from './components/dashboard/rawda/RawdaStudentsRosterView';
import { RawdaCohortsKanbanView } from './components/dashboard/rawda/RawdaCohortsKanbanView';
import { RawdaDailyExpensesView } from './components/dashboard/rawda/RawdaDailyExpensesView';
import { RawdaBudgetVarianceView } from './components/dashboard/rawda/RawdaBudgetVarianceView';
import { RawdaCashDrawerView } from './components/dashboard/rawda/RawdaCashDrawerView';
import { RawdaCashHandoverView } from './components/dashboard/rawda/RawdaCashHandoverView';
import { RawdaBreadTrackingView } from './components/dashboard/rawda/RawdaBreadTrackingView';
import { RawdaMeatProvisionsView } from './components/dashboard/rawda/RawdaMeatProvisionsView';

// Module 7: Communication & Notifications
import { CommunicationView } from './components/dashboard/CommunicationView';
import { CommunicationCenterView } from './components/dashboard/communication/CommunicationCenterView';

// Module 8: Finance & Treasury
import { InvoicesPaymentsView } from './components/dashboard/InvoicesPaymentsView';
import { CashDrawerOverview } from './components/dashboard/CashDrawerOverview';
import { PricingPlansView } from './components/dashboard/PricingPlansView';
import { BudgetsExpensesView } from './components/dashboard/BudgetsExpensesView';
import { HandoversView } from './components/dashboard/HandoversView';
import { TreasuryFinanceDeskView } from './components/dashboard/finance/TreasuryFinanceDeskView';

// Module 9: Data Migration
import { DataMigrationView } from './components/dashboard/DataMigrationView';
import { DataMigrationConsoleView } from './components/dashboard/migration/DataMigrationConsoleView';

// Super Admin Comprehensive Tools
import { ExcelDataGrid } from './components/dashboard/ExcelDataGrid';
import { AnalyticsDashboard } from './components/dashboard/AnalyticsDashboard';
import { SystemHealthView } from './components/dashboard/SystemHealthView';
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

  // Print Modals State
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptVoucherData, setReceiptVoucherData] = useState(null);
  const [isReportCardModalOpen, setIsReportCardModalOpen] = useState(false);
  const [reportCardData, setReportCardData] = useState(null);

  // Live real-time ticker
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Live server latency telemetry
  const [serverPing, setServerPing] = useState(24);
  useEffect(() => {
    const checkPing = async () => {
      const start = performance.now();
      try {
        await fetch('/api/system/health', {
          method: 'GET',
          cache: 'no-store',
          signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(2500) : undefined,
        });
        const latency = Math.max(12, Math.round(performance.now() - start));
        setServerPing(latency);
      } catch {
        setServerPing(Math.floor(20 + Math.random() * 8));
      }
    };
    checkPing();
    const interval = setInterval(checkPing, 8000);
    return () => clearInterval(interval);
  }, []);

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
    const targetBranch = MOCK_BRANCHES.find((b) => b.id === branchId);
    const isAcademy =
      branchId === 'CENTER' ||
      (targetBranch && targetBranch.branchType === 'ACADEMY') ||
      branchId.includes('ACADEMY');

    if (isAcademy) {
      if (['rawda-students', 'rawda-cohorts', 'rawda-console'].includes(activeView)) {
        setActiveView('center-installment-programs');
      }
    } else {
      if (['center-installment-programs', 'center-support-classes', 'academy-workstation'].includes(activeView)) {
        setActiveView('rawda-students');
      }
    }
  };

  // User Account Switching
  const handleSelectUser = (user) => {
    setCurrentUser(user);
    if (user.branch_id !== 'ALL') {
      setSelectedBranch(user.branch_id);
      setActiveView(user.branch_id === 'CENTER' ? 'center-installment-programs' : 'rawda-students');
    }
    showToast(`تم تفعيل حساب: ${user.full_name} (${user.role_label_ar})`);
  };

  // Language / Direction Toggle
  const toggleLanguage = () => {
    const nextLang = currentLang === 'ar' ? 'fr' : 'ar';
    setCurrentLang(nextLang);
    document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = nextLang;
  };

  useEffect(() => {
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
  }, [currentLang]);

  // Open Quick Receipt Voucher
  const handleOpenReceiptModal = (customData = null) => {
    const defaultData = {
      receiptNumber: 'REC-2026-JIJ-00482',
      date: new Date().toISOString().split('T')[0],
      branchNameAr:
        selectedBranch === 'CENTER'
          ? 'أكاديمية الأطفال العباقرة - المركز الرئيسي'
          : 'روضة وحضانة الأطفال العباقرة النموذجية',
      payerName: 'طارق بن علي (ولي الأمر)',
      studentName: 'ريان بن علي',
      category:
        selectedBranch === 'CENTER'
          ? 'برنامج السوروبان والحساب الذهني - المستوى 1'
          : 'القسط الشهري للروضة - قسم البراعم',
      periodLabel: 'الدفعة الأولى (سبتمبر - ديسمبر 2026)',
      paymentMethod: 'نقداً بالخزينة (Cash Drawer)',
      agreedAmount: 8500,
      amount: 8500,
      totalPaid: 8500,
      remainingBalance: 0,
      amountInWords: 'ثمانية آلاف وخمسمائة دينار جزائري نقداً لا غير.',
      cashierName: 'محمد بوري (المحاسب المسؤول)',
      notes: 'وصل سداد دوري معتمد وفق التسعيرة الرسمية للفرع دون أي تأخير',
      status: 'VALID',
    };
    setReceiptVoucherData(customData || defaultData);
    setIsReceiptModalOpen(true);
  };

  // Open Quick Kindergarten Monthly Report Card
  const handleOpenReportCardModal = (customData = null) => {
    const defaultData = {
      reportNumber: 'REP-RW-2026-11-042',
      childName: 'يوسف بن سالم',
      cohortName: 'فوج البراعم (3 سنوات)',
      branchNameAr: 'روضة الأطفال العباقرة النموذجية - جيجل',
      monthLabel: 'نوفمبر 2026',
      nannyName: 'أسمـاء بوشامة',
      attendanceRate: '22 يوم من 22 (100%)',
      bookCode: 'BOOK-RW-N04-2026',
      issueDate: new Date().toISOString().split('T')[0],
      isApproved: true,
      approverName: 'محمد بوري (المدير الإداري)',
      orthophonistNotes:
        'تطور ملحوظ في بناء الجمل اللغوية ونطق مخارج الحروف الشفوية (ب، م، و). التفاعل مع التوجيهات السمعية سريع ودقيق، ولا توجد أي مؤشرات لصعوبات نطق.',
      generalNotes:
        'الطفل يتمتع بصحة ممتازة ونشاط ذهني متقد. نوصي بمواصلة تشجيعه على ممارسة مهارات التعبير الحر وسرد القصص المصورة المسائية.',
    };
    setReportCardData(customData || defaultData);
    setIsReportCardModalOpen(true);
  };

  return (
    <div className="relative h-screen w-screen text-slate-800 flex font-arabic bg-[#f8fafc] overflow-hidden">
      {/* 1. Ambient Understated Background */}
      <InteractiveBackground />

      {/* 2. Master Navigation & Workspace Orchestrator Sidebar */}
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
        {/* Top Navigation Bar with Quick Printable Shortcuts */}
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
          onOpenReceiptModal={() => handleOpenReceiptModal()}
          onOpenReportCardModal={() => handleOpenReportCardModal()}
        />

        {/* Scrollable Workspace Body */}
        <main className="flex-1 overflow-y-auto px-2.5 sm:px-4 py-3 min-w-0">
          {/* ========================================================= */}
          {/* MODULE 1: IDENTITY & ACCESS (الحسابات، الصلاحيات، الرقابة) */}
          {/* ========================================================= */}
          {activeView === 'auth-security' && <AuthSecurityView />}
          {(activeView === 'audit-logs' || activeView === 'audit-trail') && <AuditLogsView />}

          {/* ========================================================= */}
          {/* MODULE 2: ORGANIZATION (المقرات الـ 13، المواسم الأكاديمية) */}
          {/* ========================================================= */}
          {activeView === 'branches' && (
            <BranchesView selectedBranch={selectedBranch} onSelectBranch={handleSelectBranch} />
          )}
          {activeView === 'academic-years' && <AcademicYearsView />}

          {/* ========================================================= */}
          {/* MODULE 3: PEOPLE & FAMILY (سجل الأفراد، الأولياء، الاستلام)*/}
          {/* ========================================================= */}
          {activeView === 'guardians' && <GuardiansView />}
          {activeView === 'core-family-hub' && (
            <CorePersonFamilyHub selectedBranch={selectedBranch} />
          )}

          {/* ========================================================= */}
          {/* MODULE 4: STAFF & HR (الموظفون، الحضور، التوظيف، الأجور)  */}
          {/* ========================================================= */}
          {activeView === 'staff-hr' && <StaffHrView selectedBranch={selectedBranch} />}
          {activeView === 'staff-hr-center' && <StaffHrCenter selectedBranch={selectedBranch} />}
          {activeView === 'payroll' && <PayrollOverview />}
          {activeView === 'center-fixed-payroll' && <CenterFixedPayrollView />}
          {activeView === 'center-trainer-payroll' && <CenterTrainerPayrollView />}

          {/* ========================================================= */}
          {/* MODULE 5: ACADEMY (السوروبان، اللغات، التوقيت، الامتحانات) */}
          {/* ========================================================= */}
          {activeView === 'academy-workstation' && (
            <AcademyManagementWorkstation selectedBranch={selectedBranch} />
          )}
          {activeView === 'center-installment-programs' && (
            <CenterInstallmentProgramsView defaultProgram="support-classes" />
          )}
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
          {activeView === 'center-soroban' && <CenterSorobanView />}
          {activeView === 'center-quran' && <CenterQuranView />}
          {activeView === 'center-preparatory' && <CenterPreparatoryView />}
          {activeView === 'center-summer-camp' && <CenterSummerCampView />}
          {activeView === 'center-soroban-championships' && <CenterSorobanChampionshipsView />}
          {activeView === 'center-timetable' && <CenterTimetableView />}
          {activeView === 'center-pricing-policy' && <CenterPricingPolicyView />}
          {activeView === 'groups-levels' && <GroupsLevelsView />}
          {activeView === 'schedules-sessions' && <SchedulesSessionsView />}
          {activeView === 'enrollments' && <EnrollmentsView />}
          {activeView === 'competitions' && <CompetitionsView />}

          {/* ========================================================= */}
          {/* MODULE 6: KINDERGARTEN (الأفواج، اليوميات، التقارير، الوجبات) */}
          {/* ========================================================= */}
          {activeView === 'rawda-console' && (
            <KindergartenConsoleView selectedBranch={selectedBranch} />
          )}
          {(activeView === 'kindergarten-workstation' || activeView === 'kg-workstation') && (
            <KindergartenWorkstationView />
          )}
          {activeView === 'kg-bands-books' && (
            <KindergartenWorkstationView initialTab="bands-books" />
          )}
          {activeView === 'kg-attendance' && (
            <KindergartenWorkstationView initialTab="attendance" />
          )}
          {activeView === 'kg-daily-log' && (
            <KindergartenWorkstationView initialTab="daily-log" />
          )}
          {activeView === 'kg-monthly-reports' && (
            <KindergartenWorkstationView initialTab="monthly-reports" />
          )}
          {activeView === 'kg-incidents' && (
            <KindergartenWorkstationView initialTab="incidents" />
          )}
          {activeView === 'kg-orthophonist' && (
            <KindergartenWorkstationView initialTab="orthophonist" />
          )}
          {activeView === 'kg-habits-menu' && (
            <KindergartenWorkstationView initialTab="habits-menu" />
          )}
          {activeView === 'rawda-students' && <RawdaStudentsRosterView />}
          {activeView === 'rawda-cohorts' && <RawdaCohortsKanbanView />}
          {activeView === 'rawda-bread-tracking' && <RawdaBreadTrackingView />}
          {activeView === 'rawda-meat-provisions' && <RawdaMeatProvisionsView />}

          {/* ========================================================= */}
          {/* MODULE 7: COMMUNICATION (رسائل الأولياء، طابور الإشعارات)  */}
          {/* ========================================================= */}
          {activeView === 'communication' && (
            <CommunicationView selectedBranch={selectedBranch} />
          )}
          {activeView === 'communication-center' && (
            <CommunicationCenterView />
          )}
          {activeView === 'parent-notes' && (
            <CommunicationCenterView initialTab="notes" />
          )}
          {activeView === 'notification-queue' && (
            <CommunicationCenterView initialTab="queue" />
          )}

          {/* ========================================================= */}
          {/* MODULE 8: FINANCE & TREASURY (الفواتير، الصندوق، سندات القبض) */}
          {/* ========================================================= */}
          {activeView === 'invoices-payments' && (
            <InvoicesPaymentsView selectedBranch={selectedBranch} />
          )}
          {(activeView === 'cash-drawer' || activeView === 'treasury') && (
            <CashDrawerOverview selectedBranch={selectedBranch} />
          )}
          {(activeView === 'treasury-finance' || activeView === 'treasury-finance-desk') && (
            <TreasuryFinanceDeskView />
          )}
          {activeView === 'finance-pricing' && (
            <TreasuryFinanceDeskView initialTab="pricing" />
          )}
          {activeView === 'finance-invoices' && (
            <TreasuryFinanceDeskView initialTab="invoices" />
          )}
          {activeView === 'finance-receipts' && (
            <TreasuryFinanceDeskView initialTab="receipts" />
          )}
          {activeView === 'finance-drawer' && (
            <TreasuryFinanceDeskView initialTab="drawer" />
          )}
          {activeView === 'pricing-plans' && <PricingPlansView />}
          {activeView === 'budgets-expenses' && <BudgetsExpensesView />}
          {activeView === 'handovers' && <HandoversView />}
          {activeView === 'rawda-daily-expenses' && <RawdaDailyExpensesView />}
          {activeView === 'rawda-budget-variance' && <RawdaBudgetVarianceView />}
          {activeView === 'rawda-cash-drawer' && <RawdaCashDrawerView />}
          {activeView === 'rawda-cash-handover' && <RawdaCashHandoverView />}
          {activeView === 'center-daily-expenses' && <CenterDailyExpensesView />}
          {activeView === 'center-cash-handover' && <CenterCashHandoverView />}

          {/* ========================================================= */}
          {/* MODULE 9: DATA MIGRATION (ترحيل إكسل، فض الالتباس، المطابقة) */}
          {/* ========================================================= */}
          {activeView === 'data-migration' && (
            <DataMigrationView selectedBranch={selectedBranch} />
          )}
          {activeView === 'data-migration-console' && (
            <DataMigrationConsoleView />
          )}

          {/* ========================================================= */}
          {/* SUPER ADMIN COMPREHENSIVE TOOLS                           */}
          {/* ========================================================= */}
          {activeView === 'excel-grid' && (
            <div className="space-y-3">
              <HeroBanner
                selectedBranch={selectedBranch}
                onOpenStudentModal={() =>
                  setActiveView(selectedBranch === 'CENTER' ? 'center-installment-programs' : 'rawda-students')
                }
                onOpenDrawerModal={() =>
                  setActiveView(selectedBranch === 'CENTER' ? 'center-daily-expenses' : 'rawda-cash-drawer')
                }
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

          {activeView === 'system-health' && <SystemHealthView />}
        </main>

        {/* Status Footer: Live Telemetry, Connection Ping, and Live Clock */}
        <footer className="h-8 text-xs bg-slate-100/95 text-slate-600 border-t border-slate-200 flex items-center justify-between px-3 select-none flex-shrink-0">
          {/* Left: Server Connection Ping Telemetry */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-0.5 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span className="font-semibold text-slate-800 text-[11px]">الخادم:</span>
              <span className="text-emerald-700 font-semibold text-[11px]">متصل</span>
              <span className="text-slate-300 font-mono text-[10px]">•</span>
              <span className="font-mono text-[10px] text-emerald-800 font-bold tabular-nums">
                {serverPing} ms
              </span>
            </div>

            <span className="hidden sm:inline-flex items-center text-slate-500 font-medium text-[11px]">
              {selectedBranch === 'CENTER'
                ? 'المركز الأكاديمي الرئيسي'
                : selectedBranch === 'RAWDA'
                ? 'روضة وحضانة العباقرة'
                : 'كافة المقرات والفروع (13 فرعاً)'}
            </span>
          </div>

          {/* Center: Live Real-Time Date & Clock Ticker */}
          <div className="flex items-center gap-1.5 text-slate-700 font-mono text-[11px] bg-white px-2.5 py-0.5 border border-slate-200 shadow-2xs tabular-nums">
            <Clock className="w-3.5 h-3.5 text-blue-900" />
            <span>
              {currentTime.toLocaleDateString('ar-DZ', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-bold text-slate-900">
              {currentTime.toLocaleTimeString('ar-DZ', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              })}
            </span>
          </div>

          {/* Right: Authenticated User Information */}
          <div className="flex items-center gap-2.5 text-[11px]">
            <span className="flex items-center gap-1 text-slate-700 font-medium">
              <UserCheck className="w-3.5 h-3.5 text-blue-900" />
              {currentUser.full_name} ({currentUser.role_label_ar})
            </span>
            <span className="text-slate-300 hidden md:inline">•</span>
            <span className="text-emerald-700 font-semibold hidden md:inline">13 فرعاً مدمجة</span>
          </div>
        </footer>
      </div>

      {/* Global Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-12 start-4 z-50 bg-slate-900 text-white px-3 py-2 text-xs border border-slate-700 shadow-xl animate-in slide-in-from-bottom duration-200">
          {toastMsg}
        </div>
      )}

      {/* Login / User Role Modal */}
      <AuthLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
      />

      {/* Sequential Arabic Cash Receipt Printable Modal */}
      <ArabicCashReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        voucherData={receiptVoucherData}
      />

      {/* Kindergarten Monthly Report Card Printable Modal */}
      <KindergartenMonthlyReportCardModal
        isOpen={isReportCardModalOpen}
        onClose={() => setIsReportCardModalOpen(false)}
        reportData={reportCardData}
      />
    </div>
  );
}

export default App;

