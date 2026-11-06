import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  Calendar,
  Clock,
  Briefcase,
  Search,
  Filter,
  Plus,
  Building2,
  Mail,
  Phone,
  Fingerprint,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  UserPlus,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { MOCK_PAYROLL_DATA } from '../../mock/mockData';

export function StaffHrView({ selectedBranch = 'ALL' }) {
  const [activeTab, setActiveTab] = useState('staff-roster'); // 'staff-roster' | 'daily-attendance' | 'recruitment'
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [attendanceSource, setAttendanceSource] = useState('MANUAL'); // 'MANUAL' | 'BIOMETRIC'

  // Staff Directory Mock Data
  const [staffMembers, setStaffMembers] = useState([
    {
      id: 1,
      staffCode: 'EMP-JIJ-001',
      fullNameAr: 'أسمـاء بوشامة',
      fullNameFr: 'Bouchama Asma',
      jobTitleAr: 'مربية رئيسية ومسؤولة بيداغوجية',
      department: 'KINDERGARTEN',
      branchId: 'RAWDA',
      branchNameAr: 'روضة الأطفال العباقرة - جيجل',
      phone: '0555 12 34 56',
      email: 'asma.b@3abaqira.dz',
      hireDate: '2023-09-01',
      status: 'ACTIVE',
      attendanceToday: 'PRESENT',
      checkInTime: '07:45',
      salaryType: 'FIXED_MONTHLY',
    },
    {
      id: 2,
      staffCode: 'EMP-JIJ-002',
      fullNameAr: 'أحمد بن علي',
      fullNameFr: 'Benali Ahmed',
      jobTitleAr: 'مدرب سوروبان وحساب ذهني معتمد',
      department: 'ACADEMY',
      branchId: 'CENTER',
      branchNameAr: 'أكاديمية العباقرة - المركز الرئيسي',
      phone: '0661 88 99 00',
      email: 'ahmed.b@3abaqira.dz',
      hireDate: '2022-10-15',
      status: 'ACTIVE',
      attendanceToday: 'PRESENT',
      checkInTime: '08:15',
      salaryType: 'PER_SESSION',
    },
    {
      id: 3,
      staffCode: 'EMP-JIJ-003',
      fullNameAr: 'د. سارة بوداود',
      fullNameFr: 'Boudaoud Sara',
      jobTitleAr: 'أخصائية أرطوفونيا وتعديل النطق',
      department: 'SPECIALISTS',
      branchId: 'ALL',
      branchNameAr: 'كافة المقرات والفروع',
      phone: '0770 33 44 55',
      email: 'sara.ortho@3abaqira.dz',
      hireDate: '2024-01-10',
      status: 'ACTIVE',
      attendanceToday: 'PRESENT',
      checkInTime: '08:30',
      salaryType: 'FIXED_MONTHLY',
    },
    {
      id: 4,
      staffCode: 'EMP-JIJ-004',
      fullNameAr: 'فاطمة الزهراء بن شيخ',
      fullNameFr: 'Bencheikh Fatima',
      jobTitleAr: 'طاهية ومسؤولة المطبخ المدرسي',
      department: 'SERVICES',
      branchId: 'RAWDA',
      branchNameAr: 'روضة الأطفال العباقرة - جيجل',
      phone: '0552 77 88 99',
      email: 'fatima.cook@3abaqira.dz',
      hireDate: '2023-09-15',
      status: 'ACTIVE',
      attendanceToday: 'PRESENT',
      checkInTime: '06:50',
      salaryType: 'FIXED_MONTHLY',
    },
    {
      id: 5,
      staffCode: 'EMP-JIJ-005',
      fullNameAr: 'كريم علام',
      fullNameFr: 'Allam Karim',
      jobTitleAr: 'مدرب روبوتيك وبرمجة الذكاء الاصطناعي',
      department: 'ACADEMY',
      branchId: 'CENTER',
      branchNameAr: 'أكاديمية العباقرة - المركز الرئيسي',
      phone: '0662 44 55 66',
      email: 'karim.robo@3abaqira.dz',
      hireDate: '2023-11-01',
      status: 'ACTIVE',
      attendanceToday: 'ABSENT',
      checkInTime: '-',
      salaryType: 'PER_SESSION',
    },
    {
      id: 6,
      staffCode: 'EMP-JIJ-006',
      fullNameAr: 'عمار خياري',
      fullNameFr: 'Khiari Amar',
      jobTitleAr: 'مسؤول الصيانة والخدمات العامة',
      department: 'SERVICES',
      branchId: 'ALL',
      branchNameAr: 'المقرات المركزية',
      phone: '0560 11 22 33',
      email: 'amar.k@3abaqira.dz',
      hireDate: '2022-09-01',
      status: 'ACTIVE',
      attendanceToday: 'PRESENT',
      checkInTime: '07:30',
      salaryType: 'FIXED_MONTHLY',
    },
  ]);

  // Online Applications Mock Data (Module 4 Requirement)
  const [applications, setApplications] = useState([
    {
      id: 101,
      applicantNameAr: 'إيناس مرواني',
      jobAppliedAr: 'مربية أطفال للتعليم المبكر',
      branchApplied: 'فرع الميلية - الروضة',
      applicationDate: '2026-11-02',
      qualification: 'ليسانس علم نفس تربوي',
      experienceYears: '3 سنوات',
      status: 'INTERVIEW_SCHEDULED',
      interviewDate: '2026-11-08 10:30',
      interviewer: 'إدارة الموارد البشرية',
    },
    {
      id: 102,
      applicantNameAr: 'ياسين بلخير',
      jobAppliedAr: 'أستاذ دعم رياضيات وفيزياء',
      branchApplied: 'أكاديمية العباقرة - فرع الطاهير',
      applicationDate: '2026-11-03',
      qualification: 'ماستر رياضيات تطبيقية',
      experienceYears: '4 سنوات',
      status: 'UNDER_REVIEW',
      interviewDate: '-',
      interviewer: '-',
    },
    {
      id: 103,
      applicantNameAr: 'ريم بلحاج',
      jobAppliedAr: 'أخصائية أرطوفونيا وتخاطب',
      branchApplied: 'المركز الرئيسي - جيجل',
      applicationDate: '2026-10-29',
      qualification: 'شهادة كفاءة أرطوفونية',
      experienceYears: 'سنتين',
      status: 'ACCEPTED',
      interviewDate: '2026-11-01 14:00',
      interviewer: 'د. سارة بوداود',
    },
  ]);

  const filteredStaff = staffMembers.filter((m) => {
    const matchSearch =
      m.fullNameAr.includes(searchTerm) ||
      m.fullNameFr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.staffCode.includes(searchTerm) ||
      m.jobTitleAr.includes(searchTerm);
    const matchRole = roleFilter === 'ALL' || m.department === roleFilter;
    const matchBranch =
      selectedBranch === 'ALL' || m.branchId === 'ALL' || m.branchId === selectedBranch;
    return matchSearch && matchRole && matchBranch;
  });

  const presentCount = staffMembers.filter((s) => s.attendanceToday === 'PRESENT').length;
  const absentCount = staffMembers.length - presentCount;

  return (
    <div className="space-y-3 font-arabic text-xs">
      {/* Top Banner & Statistics */}
      <div className="bg-white border border-slate-300 p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-900 text-white">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 font-display">
                منظومة الموارد البشرية وشؤون الموظفين
              </h2>
              <p className="text-[11px] text-slate-500">
                سجل الموظفين والمربيات، الحضور اليومي، وبوابة التوظيف والمقابلات
              </p>
            </div>
          </div>
        </div>

        {/* Live Attendance Metric */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span className="font-semibold">حضور اليوم: {presentCount}</span>
          </div>
          <div className="px-3 py-1 bg-rose-50 border border-rose-300 text-rose-900 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
            <span className="font-semibold">غياب: {absentCount}</span>
          </div>
          <div className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-950 font-bold font-mono">
            {staffMembers.length} موظف نشط
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-300 bg-white px-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('staff-roster')}
            className={`px-3 py-2 font-bold text-xs border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'staff-roster'
                ? 'border-blue-900 text-blue-900 bg-blue-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>سجل الكادر الوظيفي ({staffMembers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('daily-attendance')}
            className={`px-3 py-2 font-bold text-xs border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'daily-attendance'
                ? 'border-blue-900 text-blue-900 bg-blue-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>تسجيل الحضور اليومي للموظفين</span>
          </button>

          <button
            onClick={() => setActiveTab('recruitment')}
            className={`px-3 py-2 font-bold text-xs border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'recruitment'
                ? 'border-blue-900 text-blue-900 bg-blue-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>بوابة التوظيف الإلكتروني والمقابلات ({applications.length})</span>
          </button>
        </div>

        {/* Source Toggle for Attendance */}
        {activeTab === 'daily-attendance' && (
          <div className="flex items-center gap-2 py-1">
            <span className="text-[11px] text-slate-500 font-medium">مصدر التسجيل:</span>
            <div className="flex border border-slate-300 bg-slate-100 p-0.5">
              <button
                onClick={() => setAttendanceSource('MANUAL')}
                className={`px-2 py-0.5 text-[10px] font-bold ${
                  attendanceSource === 'MANUAL'
                    ? 'bg-white text-blue-900 shadow-2xs'
                    : 'text-slate-600'
                }`}
              >
                تأشير يدوي إداري
              </button>
              <button
                onClick={() => setAttendanceSource('BIOMETRIC')}
                className={`px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 ${
                  attendanceSource === 'BIOMETRIC'
                    ? 'bg-blue-900 text-white shadow-2xs'
                    : 'text-slate-600'
                }`}
              >
                <Fingerprint className="w-3 h-3" />
                <span>جهاز البصمة (Biometric API)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tab 1: Staff Roster */}
      {activeTab === 'staff-roster' && (
        <div className="space-y-3">
          {/* Controls */}
          <div className="bg-white border border-slate-300 p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 absolute inset-y-0 start-2.5 my-auto text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="بحث باسم الموظف، الصفة، أو الكود..."
                  className="w-full h-7 ps-7 pe-2 text-xs border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-7 px-2 border border-slate-300 bg-slate-50 text-xs"
              >
                <option value="ALL">جميع الأقسام والوظائف</option>
                <option value="KINDERGARTEN">مربيات الروضة</option>
                <option value="ACADEMY">مدربو الأكاديمية</option>
                <option value="SPECIALISTS">أخصائيو الأرطوفونيا</option>
                <option value="SERVICES">الخدمات والصيانة والإطعام</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-300 overflow-x-auto shadow-2xs">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                  <th className="p-2.5 text-start">كود الموظف</th>
                  <th className="p-2.5 text-start">الاسم واللقب</th>
                  <th className="p-2.5 text-start">الوظيفة والمسؤولية</th>
                  <th className="p-2.5 text-start">المقر والفرع</th>
                  <th className="p-2.5 text-start">معلومات الاتصال</th>
                  <th className="p-2.5 text-center">نظام الراتب</th>
                  <th className="p-2.5 text-center">حالة الحضور اليوم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="p-2.5 font-mono font-bold text-slate-700">{staff.staffCode}</td>
                    <td className="p-2.5">
                      <span className="font-bold text-slate-900 block">{staff.fullNameAr}</span>
                      <span className="text-[10px] text-slate-500 font-latin">{staff.fullNameFr}</span>
                    </td>
                    <td className="p-2.5">
                      <span className="font-semibold text-blue-950 block">{staff.jobTitleAr}</span>
                      <span className="text-[10px] text-slate-500">منذ {staff.hireDate}</span>
                    </td>
                    <td className="p-2.5 text-slate-700">{staff.branchNameAr}</td>
                    <td className="p-2.5 font-mono text-slate-600">
                      <div>{staff.phone}</div>
                      <div className="text-[10px] text-slate-400 font-latin">{staff.email}</div>
                    </td>
                    <td className="p-2.5 text-center">
                      <span className="px-2 py-0.5 border border-slate-300 bg-slate-100 font-semibold text-[10px]">
                        {staff.salaryType === 'FIXED_MONTHLY' ? 'راتب شهري ثابت' : 'احتساب بالحصة'}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`px-2 py-0.5 font-bold text-[10px] border ${
                          staff.attendanceToday === 'PRESENT'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}
                      >
                        {staff.attendanceToday === 'PRESENT'
                          ? `حاضر (${staff.checkInTime})`
                          : 'غائب'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Daily Attendance */}
      {activeTab === 'daily-attendance' && (
        <div className="bg-white border border-slate-300 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                تسجيل الحضور والانصراف اليومي للكادر الإداري والتربوي
              </h3>
              <p className="text-[11px] text-slate-500">
                تأشير يومي موحد يغذي جدول الأجور والرواتب تلقائياً وفق التقرير الفني
              </p>
            </div>
            <div className="text-end">
              <span className="font-mono font-bold text-blue-900 text-xs">
                {new Date().toISOString().split('T')[0]}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border border-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <th className="p-2 text-start">الموظف</th>
                  <th className="p-2 text-start">الصفة والمقر</th>
                  <th className="p-2 text-center w-28">الحالة</th>
                  <th className="p-2 text-center w-24">وقت الدخول</th>
                  <th className="p-2 text-start">ملاحظات والتبرير</th>
                  <th className="p-2 text-center w-24">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {staffMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50">
                    <td className="p-2 font-bold text-slate-900">{member.fullNameAr}</td>
                    <td className="p-2 text-slate-600">
                      <div>{member.jobTitleAr}</div>
                      <div className="text-[10px] text-slate-400">{member.branchNameAr}</div>
                    </td>
                    <td className="p-2 text-center">
                      <span
                        className={`px-2 py-0.5 font-bold text-[10px] border ${
                          member.attendanceToday === 'PRESENT'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-400'
                            : 'bg-rose-100 text-rose-800 border-rose-400'
                        }`}
                      >
                        {member.attendanceToday === 'PRESENT' ? 'حاضر' : 'غائب'}
                      </span>
                    </td>
                    <td className="p-2 text-center font-mono">{member.checkInTime}</td>
                    <td className="p-2 text-slate-500 text-[11px]">
                      {member.attendanceToday === 'PRESENT'
                        ? 'حضور في الموعد المحدد'
                        : 'غياب مبرر بشهادة طبية'}
                    </td>
                    <td className="p-2 text-center">
                      <button className="px-2 py-0.5 border border-slate-300 hover:bg-slate-100 text-slate-700 text-[10px]">
                        تعديل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Recruitment & Interviews */}
      {activeTab === 'recruitment' && (
        <div className="bg-white border border-slate-300 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                طلبات التوظيف الإلكتروني وجدولة المقابلات (Online Recruitment Pipeline)
              </h3>
              <p className="text-[11px] text-slate-500">
                المترشحون يتقدمون عبر البوابة، وتتم دعوتهم للمقابلة تلقائياً عبر البريد الإلكتروني
              </p>
            </div>
            <button className="px-3 py-1 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs">
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة مرشح يدوياً</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border border-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <th className="p-2 text-start">اسم المترشح</th>
                  <th className="p-2 text-start">الوظيفة المتقدم لها</th>
                  <th className="p-2 text-start">الفرع المطلوب</th>
                  <th className="p-2 text-start">المؤهل والخبرة</th>
                  <th className="p-2 text-center">حالة الطلب</th>
                  <th className="p-2 text-start">تاريخ المقابلة</th>
                  <th className="p-2 text-center">إرسال دعوة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50">
                    <td className="p-2 font-bold text-slate-900">{app.applicantNameAr}</td>
                    <td className="p-2 font-semibold text-blue-950">{app.jobAppliedAr}</td>
                    <td className="p-2 text-slate-700">{app.branchApplied}</td>
                    <td className="p-2 text-slate-600">
                      <div>{app.qualification}</div>
                      <div className="text-[10px] text-slate-400">الخبرة: {app.experienceYears}</div>
                    </td>
                    <td className="p-2 text-center">
                      <span
                        className={`px-2 py-0.5 font-bold text-[10px] border ${
                          app.status === 'ACCEPTED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : app.status === 'INTERVIEW_SCHEDULED'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        {app.status === 'ACCEPTED'
                          ? 'مقبول نهائياً'
                          : app.status === 'INTERVIEW_SCHEDULED'
                          ? 'مجدول للمقابلة'
                          : 'قيد الفرز'}
                      </span>
                    </td>
                    <td className="p-2 font-mono text-slate-800">{app.interviewDate}</td>
                    <td className="p-2 text-center">
                      <button className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 text-[10px] font-semibold flex items-center gap-1 mx-auto">
                        <Mail className="w-3 h-3" />
                        <span>دعوة بريد</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
