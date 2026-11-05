import React, { useState } from 'react';
import {
  Baby,
  CalendarCheck,
  ClipboardList,
  FileCheck2,
  AlertTriangle,
  HeartPulse,
  UtensilsCrossed,
  BookOpen,
} from 'lucide-react';

import { AgeBandsNumberedBooksView } from './AgeBandsNumberedBooksView';
import { DailyAttendanceRegisterView } from './DailyAttendanceRegisterView';
import { DailyChildLogSheetView } from './DailyChildLogSheetView';
import { MonthlyReportApprovalCenterView } from './MonthlyReportApprovalCenterView';
import { IncidentTrackerLogView } from './IncidentTrackerLogView';
import { OrthophonistObservationPanelView } from './OrthophonistObservationPanelView';
import { ChildHabitMenuPlannerView } from './ChildHabitMenuPlannerView';

export function KindergartenWorkstationView({ initialTab = 'bands-books' }) {
  const [activeSubTab, setActiveSubTab] = useState(initialTab);

  const tabs = [
    {
      id: 'bands-books',
      labelAr: 'الأفواج والدفاتر المرقمنة',
      subtitleAr: 'Age Bands & Books',
      icon: BookOpen,
      tag: 'Bébé/Grande',
    },
    {
      id: 'attendance',
      labelAr: 'سجل الحضور والغياب',
      subtitleAr: 'Attendance Register',
      icon: CalendarCheck,
      tag: 'يومي فوري',
    },
    {
      id: 'daily-log',
      labelAr: 'ورقة التقييم اليومي (A/B/C)',
      subtitleAr: 'Daily Log Sheet',
      icon: ClipboardList,
      tag: 'وجبات/نوم/سلوك',
    },
    {
      id: 'monthly-reports',
      labelAr: 'مركز اعتماد التقارير الشهرية',
      subtitleAr: 'Monthly Approvals',
      icon: FileCheck2,
      tag: 'تأشيرة/طباعة',
    },
    {
      id: 'incidents',
      labelAr: 'سجل الحوادث والوقائع',
      subtitleAr: 'Incident Tracker',
      icon: AlertTriangle,
      tag: 'طوارئ',
    },
    {
      id: 'orthophonist',
      labelAr: 'عيادة الأرطوفونيا والمتابعة',
      subtitleAr: 'Orthophonist Panel',
      icon: HeartPulse,
      tag: 'نطق وتخاطب',
    },
    {
      id: 'habits-menu',
      labelAr: 'بروفايل العادات ومطعم الروضة',
      subtitleAr: 'Habits & Menu',
      icon: UtensilsCrossed,
      tag: 'أسبوعي دوري',
    },
  ];

  return (
    <div className="space-y-2.5 font-arabic text-slate-800">
      {/* High-density Workstation Ribbon Navigation */}
      <div className="bg-white border border-slate-200 p-1 shadow-2xs">
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-3 py-1.5 flex items-center gap-2 rounded-none border text-start transition-all shrink-0 ${
                  isActive
                    ? 'bg-blue-900 text-white border-blue-950 font-bold shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-200' : 'text-slate-500'}`} />
                <div className="flex flex-col">
                  <span className="text-xs leading-tight">{tab.labelAr}</span>
                  <span
                    className={`text-[9px] font-mono leading-none ${
                      isActive ? 'text-blue-200' : 'text-slate-400'
                    }`}
                  >
                    {tab.subtitleAr}
                  </span>
                </div>
                <span
                  className={`text-[9px] font-mono px-1 py-0.2 border ms-1 ${
                    isActive
                      ? 'bg-blue-800 text-blue-100 border-blue-700'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {tab.tag}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Active Sub-View */}
      {activeSubTab === 'bands-books' && <AgeBandsNumberedBooksView />}
      {activeSubTab === 'attendance' && <DailyAttendanceRegisterView />}
      {activeSubTab === 'daily-log' && <DailyChildLogSheetView />}
      {activeSubTab === 'monthly-reports' && <MonthlyReportApprovalCenterView />}
      {activeSubTab === 'incidents' && <IncidentTrackerLogView />}
      {activeSubTab === 'orthophonist' && <OrthophonistObservationPanelView />}
      {activeSubTab === 'habits-menu' && <ChildHabitMenuPlannerView />}
    </div>
  );
}
