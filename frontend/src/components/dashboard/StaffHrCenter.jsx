import React, { useState } from 'react';
import {
  Users,
  Briefcase,
  Building2,
  CalendarCheck2,
  UserCheck,
  UserX,
  Clock,
  Fingerprint,
  Mail,
  Send,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  BadgeCheck,
  Calendar,
  X,
  Phone,
  ArrowRightLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  MOCK_STAFF_ROSTER,
  MOCK_STAFF_DAILY_ATTENDANCE,
  MOCK_JOB_APPLICANTS,
  MOCK_13_BRANCHES,
} from '../../mock/academyHrMockData';

/**
 * StaffHrCenter
 * Enterprise High-Density Staff & HR Management Center:
 * 1. Staff Roster & Profiles with Specific Job Titles (trainers, administration, specialists, cooks, cleaning).
 * 2. Multi-Branch Assignment Table (% allocations across 13 branches).
 * 3. Daily Staff Attendance Register (Biometric Device ready vs Manual Admin entry).
 * 4. Online Job Candidate Pipeline & Interview Invitation Tracker (hr_staff_application).
 * Excel-like technical styling, RTL Cairo font, zero neon bloat.
 */
export function StaffHrCenter({ selectedBranchId }) {
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'assignments' | 'attendance' | 'recruitment'

  // 1. Staff Roster state
  const [staffList, setStaffList] = useState(MOCK_STAFF_ROSTER);
  const [searchTerm, setSearchTerm] = useState('');
  const [jobTitleFilter, setJobTitleFilter] = useState('ALL');

  // 2. Attendance Register state
  const [attendanceRecords, setAttendanceRecords] = useState(MOCK_STAFF_DAILY_ATTENDANCE);
  const [attendanceDate, setAttendanceDate] = useState('2026-11-05');
  const [attendanceSourceFilter, setAttendanceSourceFilter] = useState('ALL');

  // 3. Recruitment Pipeline state
  const [applicants, setApplicants] = useState(MOCK_JOB_APPLICANTS);
  const [pipelineStageFilter, setPipelineStageFilter] = useState('ALL');
  const [inviteModalApplicant, setInviteModalApplicant] = useState(null);
  const [inviteForm, setInviteForm] = useState({
    interviewDate: '2026-11-10 10:00',
    interviewLocation: 'قاعة الاجتماعات - الإدارة العامة بجيجل',
    panelMembers: 'حمزة لموشي + د. سهام بوشنافة',
  });

  // Filter staff roster
  const filteredStaff = staffList.filter((st) => {
    const matchesSearch =
      st.fullNameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.fullNameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.jobTitleLabelAr.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesJob = jobTitleFilter === 'ALL' || st.jobTitle === jobTitleFilter;
    return matchesSearch && matchesJob;
  });

  // Filter attendance
  const filteredAttendance = attendanceRecords.filter((rec) => {
    if (attendanceSourceFilter === 'ALL') return true;
    return rec.source === attendanceSourceFilter;
  });

  // Filter applicants
  const filteredApplicants = applicants.filter((app) => {
    if (pipelineStageFilter === 'ALL') return true;
    return app.pipelineStage === pipelineStageFilter;
  });

  // Handle Send Interview Invitation Submit
  const handleSendInterviewInvitation = (e) => {
    e.preventDefault();
    if (!inviteModalApplicant) return;

    setApplicants((prev) =>
      prev.map((app) =>
        app.appId === inviteModalApplicant.appId
          ? {
              ...app,
              pipelineStage: 'INTERVIEW_INVITED',
              pipelineStageLabelAr: 'مدعو للمقابلة الحضورية',
              interviewScheduledDate: inviteForm.interviewDate,
              interviewLocation: inviteForm.interviewLocation,
              panelMembers: inviteForm.panelMembers,
            }
          : app
      )
    );
    setInviteModalApplicant(null);
  };

  // Toggle staff attendance status
  const handleToggleStaffStatus = (attendanceId, newStatus) => {
    setAttendanceRecords((prev) =>
      prev.map((rec) =>
        rec.attendanceId === attendanceId
          ? {
              ...rec,
              status: newStatus,
              statusLabelAr:
                newStatus === 'PRESENT'
                  ? 'حاضر (منتظم)'
                  : newStatus === 'LATE'
                  ? 'متأخر مبرر'
                  : 'غياب',
            }
          : rec
      )
    );
  };

  return (
    <div className="space-y-3 font-arabic text-slate-800">
      {/* Top Header & Tab Navigation */}
      <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 border border-blue-200 text-blue-900 rounded">
              <Briefcase className="w-5 h-5 text-blue-700" />
            </span>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                مركز الموارد البشرية وشؤون الموظفين (Staff & HR Center)
              </h1>
              <p className="text-xs text-slate-500">
                سجل الكادر الوظيفي، التوزيع متعدد المقرات عبر 13 فرعاً، سجل الحضور والبيومترية، وبوابة التوظيف والمقابلات
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('roster')}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                activeTab === 'roster'
                  ? 'bg-blue-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>دليل الموظفين والوظائف</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('assignments')}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                activeTab === 'assignments'
                  ? 'bg-blue-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>التوزيع متعدد المقرات (% Multi-Branch)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('attendance')}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                activeTab === 'attendance'
                  ? 'bg-blue-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <CalendarCheck2 className="w-3.5 h-3.5" />
              <span>سجل الحضور اليومي والبيومتري</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('recruitment')}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                activeTab === 'recruitment'
                  ? 'bg-blue-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>بوابة المرشحين والمقابلات ({applicants.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: STAFF ROSTER & JOB TITLES                                          */}
      {/* ========================================================================= */}
      {activeTab === 'roster' && (
        <div className="space-y-3">
          {/* Filters Toolbar */}
          <div className="bg-white border border-slate-300 p-2.5 rounded shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
              <div className="relative flex-1 min-w-[180px] max-w-sm">
                <Search className="w-3.5 h-3.5 absolute start-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="بحث باسم الموظف أو المسمى الوظيفي..."
                  className="w-full bg-slate-50 border border-slate-300 rounded ps-8 pe-2 py-1 text-xs focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={jobTitleFilter}
                  onChange={(e) => setJobTitleFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs focus:bg-white focus:border-blue-600 focus:outline-hidden"
                >
                  <option value="ALL">كافة الفئات الوظيفية</option>
                  <option value="TRAINER">المدربون والأساتذة (Trainers)</option>
                  <option value="ADMINISTRATIVE">الإدارة والاستقبال (Admin)</option>
                  <option value="SPECIALIST">أخصائيو الأرطوفونيا (Specialists)</option>
                  <option value="MAINTENANCE_COOK">الإطعام والصيانة (Support Staff)</option>
                </select>
              </div>
            </div>

            <div className="text-[11px] text-slate-500">
              عدد الكوادر المعروضة: <span className="font-bold text-slate-800">{filteredStaff.length}</span>
            </div>
          </div>

          {/* High-Density Roster Table */}
          <div className="bg-white border border-slate-300 rounded shadow-2xs overflow-hidden text-xs">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 text-[11px] font-bold">
                  <th className="p-2 border-e border-slate-300 text-start w-12">#</th>
                  <th className="p-2 border-e border-slate-300 text-start">كود الموظف</th>
                  <th className="p-2 border-e border-slate-300 text-start">الاسم واللقب</th>
                  <th className="p-2 border-e border-slate-300 text-start">المسمى الوظيفي والتخصص</th>
                  <th className="p-2 border-e border-slate-300 text-start">المقر الرئيسي</th>
                  <th className="p-2 border-e border-slate-300 text-start">توزيع المقرات</th>
                  <th className="p-2 border-e border-slate-300 text-start">الاتصال</th>
                  <th className="p-2 border-e border-slate-300 text-center">نوع العقد</th>
                  <th className="p-2 text-center">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredStaff.map((staff, idx) => (
                  <tr key={staff.staffId} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2 border-e border-slate-200 font-mono text-center text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="p-2 border-e border-slate-200 font-mono font-bold text-slate-800">
                      {staff.staffId}
                    </td>
                    <td className="p-2 border-e border-slate-200">
                      <div className="font-bold text-slate-900">{staff.fullNameAr}</div>
                      <div className="text-[10px] text-slate-500 font-sans">{staff.fullNameEn}</div>
                    </td>
                    <td className="p-2 border-e border-slate-200">
                      <div className="font-semibold text-slate-800">{staff.jobTitleLabelAr}</div>
                      <div className="text-[10px] text-slate-400 font-mono">NIN: {staff.nin}</div>
                    </td>
                    <td className="p-2 border-e border-slate-200 font-medium text-slate-700">
                      {staff.primaryBranchNameAr}
                    </td>
                    <td className="p-2 border-e border-slate-200">
                      <div className="flex flex-wrap gap-1">
                        {staff.assignments.map((asg, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-300 font-mono text-[10px]"
                          >
                            {asg.branchNameAr}: {asg.allocationPct}%
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-2 border-e border-slate-200">
                      <div className="font-mono text-blue-700">{staff.phone}</div>
                      <div className="text-[10px] text-slate-400">{staff.email}</div>
                    </td>
                    <td className="p-2 border-e border-slate-200 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                        {staff.employmentType === 'FULL_TIME' ? 'دوام كامل' : 'دوام جزئي'}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        نشط
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MULTI-BRANCH ASSIGNMENTS TABLE                                     */}
      {/* ========================================================================= */}
      {activeTab === 'assignments' && (
        <div className="space-y-3">
          <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
            <h3 className="font-bold text-slate-900 text-xs">
              جدول التوزيع وتعدد المقرات (Multi-Branch Workload Allocations)
            </h3>
            <p className="text-[11px] text-slate-500">
              يسمح نظام المنظومة للمدربين والأخصائيين بالعمل عبر عدة مقرات وفروع من أصل 13 فرعاً بنسب عمل محددة
            </p>
          </div>

          <div className="bg-white border border-slate-300 rounded shadow-2xs overflow-hidden text-xs">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 text-[11px] font-bold">
                  <th className="p-2 border-e border-slate-300 text-start">الموظف والوظيفة</th>
                  <th className="p-2 border-e border-slate-300 text-start">المقر الرئيسي</th>
                  <th className="p-2 border-e border-slate-300 text-start">
                    تفاصيل التوزيع عبر المقرات (Workload Percentage)
                  </th>
                  <th className="p-2 border-e border-slate-300 text-center">إجمالي النسبة</th>
                  <th className="p-2 text-center">تعديل التوزيع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {staffList.map((st) => {
                  const totalPct = st.assignments.reduce((sum, a) => sum + a.allocationPct, 0);
                  return (
                    <tr key={st.staffId} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 border-e border-slate-200">
                        <div className="font-bold text-slate-900">{st.fullNameAr}</div>
                        <div className="text-[10px] text-slate-500">{st.jobTitleLabelAr}</div>
                      </td>
                      <td className="p-2.5 border-e border-slate-200 font-medium text-slate-700">
                        {st.primaryBranchNameAr}
                      </td>
                      <td className="p-2.5 border-e border-slate-200">
                        <div className="space-y-1">
                          {st.assignments.map((asg, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <span className="text-slate-800">
                                • {asg.branchNameAr}{' '}
                                <span className="text-slate-400 text-[10px]">({asg.role})</span>
                              </span>
                              <span className="font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                {asg.allocationPct}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-2.5 border-e border-slate-200 text-center font-mono font-bold">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] ${
                            totalPct === 100
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {totalPct}%
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => alert(`تعديل توزيع المقرات للموظف: ${st.fullNameAr}`)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-[10px] font-semibold"
                        >
                          تعديل التوزيع
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DAILY STAFF ATTENDANCE REGISTER                                    */}
      {/* ========================================================================= */}
      {activeTab === 'attendance' && (
        <div className="space-y-3">
          {/* Controls Bar */}
          <div className="bg-white border border-slate-300 p-2.5 rounded shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 font-bold text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-blue-700" />
                <span>تاريخ السجل:</span>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded px-2 py-0.5 text-xs font-mono"
                />
              </div>

              <div className="flex items-center gap-1">
                <span className="text-slate-500">المصدر:</span>
                <select
                  value={attendanceSourceFilter}
                  onChange={(e) => setAttendanceSourceFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
                >
                  <option value="ALL">كافة المصادر (بيومتري + يدوي)</option>
                  <option value="BIOMETRIC_DEVICE">جهاز البصمة البيومترية فقط</option>
                  <option value="MANUAL_ADMIN">تسجيل يدوي (الإدارة)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold text-xs">
                نسبة الحضور اليومية: 96.2%
              </span>
            </div>
          </div>

          {/* High-Density Attendance Register */}
          <div className="bg-white border border-slate-300 rounded shadow-2xs overflow-hidden text-xs">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 text-[11px] font-bold">
                  <th className="p-2 border-e border-slate-300 text-start w-12">#</th>
                  <th className="p-2 border-e border-slate-300 text-start">الموظف والوظيفة</th>
                  <th className="p-2 border-e border-slate-300 text-start">المقر المحدد</th>
                  <th className="p-2 border-e border-slate-300 text-center">وقت الدخول</th>
                  <th className="p-2 border-e border-slate-300 text-center">وقت الخروج</th>
                  <th className="p-2 border-e border-slate-300 text-center">حالة الحضور</th>
                  <th className="p-2 border-e border-slate-300 text-start">المصدر والتوثيق</th>
                  <th className="p-2 text-center">تحديث الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredAttendance.map((rec, idx) => (
                  <tr key={rec.attendanceId} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2 border-e border-slate-200 font-mono text-center text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="p-2 border-e border-slate-200">
                      <div className="font-bold text-slate-900">{rec.fullNameAr}</div>
                      <div className="text-[10px] text-slate-500">{rec.jobTitleAr}</div>
                    </td>
                    <td className="p-2 border-e border-slate-200 font-medium text-slate-700">
                      {rec.branchNameAr}
                    </td>
                    <td className="p-2 border-e border-slate-200 text-center font-mono font-bold text-emerald-700">
                      {rec.checkinTime}
                    </td>
                    <td className="p-2 border-e border-slate-200 text-center font-mono text-slate-600">
                      {rec.checkoutTime}
                    </td>
                    <td className="p-2 border-e border-slate-200 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rec.status === 'PRESENT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.status === 'LATE'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {rec.statusLabelAr}
                      </span>
                    </td>
                    <td className="p-2 border-e border-slate-200">
                      <div className="flex items-center gap-1 text-[11px] text-slate-700">
                        {rec.source === 'BIOMETRIC_DEVICE' ? (
                          <Fingerprint className="w-3.5 h-3.5 text-blue-700" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                        )}
                        <span>{rec.sourceLabelAr}</span>
                      </div>
                      {rec.notes && (
                        <div className="text-[10px] text-slate-500 italic mt-0.5">{rec.notes}</div>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      <div className="inline-flex rounded border border-slate-300 overflow-hidden text-[10px]">
                        <button
                          type="button"
                          onClick={() => handleToggleStaffStatus(rec.attendanceId, 'PRESENT')}
                          className="px-2 py-1 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 font-semibold"
                        >
                          حاضر
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStaffStatus(rec.attendanceId, 'LATE')}
                          className="px-2 py-1 border-s border-e border-slate-300 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 font-semibold"
                        >
                          تأخر
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStaffStatus(rec.attendanceId, 'ABSENT')}
                          className="px-2 py-1 bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-800 font-semibold"
                        >
                          غياب
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: JOB APPLICANTS PIPELINE & INTERVIEWS (hr_staff_application)        */}
      {/* ========================================================================= */}
      {activeTab === 'recruitment' && (
        <div className="space-y-3">
          {/* Controls Bar */}
          <div className="bg-white border border-slate-300 p-2.5 rounded shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">تصفية مراحل التوظيف:</span>
              <div className="flex flex-wrap gap-1">
                {[
                  { id: 'ALL', label: 'الكل' },
                  { id: 'NEW', label: 'طلبات جديدة' },
                  { id: 'REVIEWED', label: 'تم الفحص' },
                  { id: 'INTERVIEW_INVITED', label: 'مدعوون للمقابلة' },
                  { id: 'HIRED', label: 'تم التوظيف' },
                ].map((stg) => (
                  <button
                    key={stg.id}
                    type="button"
                    onClick={() => setPipelineStageFilter(stg.id)}
                    className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                      pipelineStageFilter === stg.id
                        ? 'bg-blue-800 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {stg.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-slate-500">
              إجمالي طلبات الترشح: <span className="font-bold text-slate-800">{applicants.length}</span>
            </div>
          </div>

          {/* Applicants Table */}
          <div className="bg-white border border-slate-300 rounded shadow-2xs overflow-hidden text-xs">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 text-[11px] font-bold">
                  <th className="p-2 border-e border-slate-300 text-start w-12">#</th>
                  <th className="p-2 border-e border-slate-300 text-start">المرشح والاتصال</th>
                  <th className="p-2 border-e border-slate-300 text-start">المنصب والفرع المطلوب</th>
                  <th className="p-2 border-e border-slate-300 text-start">المؤهلات والخبرة</th>
                  <th className="p-2 border-e border-slate-300 text-center">مرحلة مسار التوظيف</th>
                  <th className="p-2 border-e border-slate-300 text-start">بيانات المقابلة الحضورية</th>
                  <th className="p-2 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredApplicants.map((app, idx) => (
                  <tr key={app.appId} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2 border-e border-slate-200 font-mono text-center text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="p-2 border-e border-slate-200">
                      <div className="font-bold text-slate-900">{app.candidateName}</div>
                      <div className="text-[10px] text-blue-700 font-mono">{app.phone}</div>
                      <div className="text-[10px] text-slate-400">{app.email}</div>
                    </td>
                    <td className="p-2 border-e border-slate-200">
                      <div className="font-semibold text-slate-800">{app.appliedPosition}</div>
                      <div className="text-[10px] text-slate-500">{app.desiredBranchNameAr}</div>
                    </td>
                    <td className="p-2 border-e border-slate-200">
                      <div className="text-slate-800">{app.qualification}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        الخبرة: {app.yearsExperience} سنوات • تاريخ التقديم: {app.applicationDate}
                      </div>
                    </td>
                    <td className="p-2 border-e border-slate-200 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          app.pipelineStage === 'HIRED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : app.pipelineStage === 'INTERVIEW_INVITED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {app.pipelineStageLabelAr}
                      </span>
                    </td>
                    <td className="p-2 border-e border-slate-200">
                      {app.interviewScheduledDate ? (
                        <div>
                          <div className="font-bold font-mono text-blue-900 text-[11px]">
                            {app.interviewScheduledDate}
                          </div>
                          <div className="text-[10px] text-slate-600">{app.interviewLocation}</div>
                          <div className="text-[10px] text-slate-400 font-sans">
                            اللجنة: {app.panelMembers}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">
                          لم تجدول المقابلة بعد
                        </span>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      {app.pipelineStage !== 'HIRED' && (
                        <button
                          type="button"
                          onClick={() => setInviteModalApplicant(app)}
                          className="px-2.5 py-1 rounded bg-blue-700 hover:bg-blue-800 text-white font-bold text-[10px] flex items-center gap-1 mx-auto"
                        >
                          <Send className="w-3 h-3" />
                          <span>إرسال دعوة مقابلة</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SEND INTERVIEW INVITATION                                          */}
      {/* ========================================================================= */}
      {inviteModalApplicant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-3">
          <div className="bg-white border border-slate-300 rounded shadow-2xl w-full max-w-lg overflow-hidden text-xs">
            <div className="bg-slate-100 border-b border-slate-300 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-700" />
                <div>
                  <h3 className="font-bold text-slate-900">
                    دعوة رسمية للمقابلة الشخصية — {inviteModalApplicant.candidateName}
                  </h3>
                  <div className="text-[10px] text-slate-500">
                    المنصب: {inviteModalApplicant.appliedPosition}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInviteModalApplicant(null)}
                className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendInterviewInvitation} className="p-4 space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  تاريخ وتوقيت المقابلة الحضورية:
                </label>
                <input
                  type="text"
                  value={inviteForm.interviewDate}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, interviewDate: e.target.value })
                  }
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  مكان المقابلة والمقر:
                </label>
                <input
                  type="text"
                  value={inviteForm.interviewLocation}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, interviewLocation: e.target.value })
                  }
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  أعضاء لجنة التحكيم والمقابلة:
                </label>
                <input
                  type="text"
                  value={inviteForm.panelMembers}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, panelMembers: e.target.value })
                  }
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 p-2.5 rounded text-[11px] text-blue-900 leading-relaxed">
                📧 سيتم إرسال بريد إلكتروني رسمي للمرشح ({inviteModalApplicant.email}) وتحديث حالة ملفه في مسار التوظيف فوراً.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setInviteModalApplicant(null)}
                  className="px-3 py-1.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-blue-700 hover:bg-blue-800 text-white font-bold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>تأكيد وإرسال الدعوة للمرشح</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
