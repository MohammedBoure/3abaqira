import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  HeartPulse,
  Phone,
  FileText,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Plus,
  ArrowRight,
  X,
  BadgeAlert,
  BadgeCheck,
  Car,
  Calendar,
  Lock,
  Unlock,
  Building2,
  Stethoscope,
  Info,
} from 'lucide-react';
import { MOCK_CORE_STUDENTS, MOCK_13_BRANCHES } from '../../mock/academyHrMockData';

/**
 * CorePersonFamilyHub
 * Enterprise High-Density Person & Family Hub:
 * 1. Bilingual Student Directory (Arabic & Latin names, birth date, grade, branch).
 * 2. Guardian Linkages (Father, Mother, Legal Guardian, Custody flags, Emergency contacts).
 * 3. Authorized Pickup List with Receptionist Verification Check (photo/ID verification).
 * 4. Medical Profile Drawer (special needs, allergies, chronic conditions, blood type).
 * 5. Account Activation Badge & Fee Payment Gate Indicator (Registration + First-Level fee checks).
 * Excel-like technical styling, RTL Cairo font, zero neon bloat.
 */
export function CorePersonFamilyHub({ selectedBranchId }) {
  const [students, setStudents] = useState(MOCK_CORE_STUDENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState(selectedBranchId || 'ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVATED' | 'PENDING_PAYMENT'

  // Modals & Drawers state
  const [selectedStudentForGuardians, setSelectedStudentForGuardians] = useState(null);
  const [selectedStudentForPickups, setSelectedStudentForPickups] = useState(null);
  const [selectedStudentForMedical, setSelectedStudentForMedical] = useState(null);
  const [selectedStudentForPaymentGate, setSelectedStudentForPaymentGate] = useState(null);

  // Reception Desk Verification Tool state
  const [verificationNinInput, setVerificationNinInput] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nameLatin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.schoolGrade.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBranch =
      branchFilter === 'ALL' || s.branchId === branchFilter;

    const matchesStatus =
      statusFilter === 'ALL' || s.accountStatus === statusFilter;

    return matchesSearch && matchesBranch && matchesStatus;
  });

  // Handle Account Activation Gate Payment Settle
  const handleSettleFeeAndActivate = (studentId) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.personId === studentId) {
          return {
            ...s,
            accountStatus: 'ACTIVATED',
            firstLevelFeePaid: true,
            firstLevelReceiptNo: `REC-26-LVL-${Math.floor(100 + Math.random() * 900)}`,
          };
        }
        return s;
      })
    );
    setSelectedStudentForPaymentGate(null);
  };

  // Reception verification check runner
  const handleCheckPickupAuthorization = (student) => {
    if (!verificationNinInput.trim()) {
      setVerificationResult({
        status: 'ERROR',
        message: 'يرجى إدخال رقم التعريف الوطني (NIN) للتحقق.',
      });
      return;
    }
    const cleanInput = verificationNinInput.trim();
    const authorizedPerson = student.authorizedPickups.find(
      (p) => p.nin === cleanInput || p.phone.replace(/\s+/g, '') === cleanInput.replace(/\s+/g, '')
    );

    if (authorizedPerson) {
      setVerificationResult({
        status: 'VERIFIED',
        person: authorizedPerson,
        message: `تم التحقق بنجاح: الشخص مصرح له بالاستلام (${authorizedPerson.nameAr} - ${authorizedPerson.relationAr}).`,
      });
    } else {
      setVerificationResult({
        status: 'UNAUTHORIZED',
        message: 'تحذير أمني: رقم الهوية غير مسجل في قائمة الأشخاص المصرح لهم باستلام الطفل!',
      });
    }
  };

  return (
    <div className="space-y-3 font-arabic text-slate-800">
      {/* Top Header & Metrics Banner */}
      <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-50 border border-blue-200 text-blue-900 rounded">
                <Users className="w-5 h-5 text-blue-700" />
              </span>
              <div>
                <h1 className="text-base font-bold text-slate-900 leading-tight">
                  سجل الأفراد وإدارة العائلة والأولياء (Core Person & Family Hub)
                </h1>
                <p className="text-xs text-slate-500">
                  سجل مركزي موحد: التلاميذ، شبكة الأولياء والوصاية، تراخيص الاستلام، الملف الطبي وبوابة تفعيل الحسابات
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2 text-xs">
            <div className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded">
              <span className="text-slate-500">إجمالي السجلات:</span>{' '}
              <span className="font-bold text-slate-800 font-mono">{students.length}</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded text-emerald-900">
              <span className="text-emerald-700">مفعل ونشط:</span>{' '}
              <span className="font-bold font-mono">
                {students.filter((s) => s.accountStatus === 'ACTIVATED').length}
              </span>
            </div>
            <div className="bg-amber-50 border border-amber-200 px-2.5 py-1 rounded text-amber-900">
              <span className="text-amber-700">معلق (بانتظار الرسوم):</span>{' '}
              <span className="font-bold font-mono">
                {students.filter((s) => s.accountStatus === 'PENDING_PAYMENT').length}
              </span>
            </div>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="w-3.5 h-3.5 absolute start-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث بالاسم العربي، اللاتيني، رقم القيد أو المستوى..."
                className="w-full bg-slate-50 border border-slate-300 rounded ps-8 pe-2.5 py-1 text-xs focus:outline-hidden focus:border-blue-600 focus:bg-white"
              />
            </div>

            {/* Branch Filter */}
            <div className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs focus:outline-hidden focus:border-blue-600"
              >
                <option value="ALL">جميع الفروع الـ 13</option>
                {MOCK_13_BRANCHES.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nameAr} ({b.typeLabelAr})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs focus:outline-hidden focus:border-blue-600"
              >
                <option value="ALL">جميع حالات الحساب</option>
                <option value="ACTIVATED">حسابات مفعلة فقط</option>
                <option value="PENDING_PAYMENT">معلقة - قيد سداد الرسوم</option>
              </select>
            </div>
          </div>

          <div className="text-[11px] text-slate-500">
            عرض <span className="font-bold text-slate-800 font-mono">{filteredStudents.length}</span> من أصل{' '}
            <span className="font-mono">{students.length}</span>
          </div>
        </div>
      </div>

      {/* High-Density Bilingual Student Roster Table */}
      <div className="bg-white border border-slate-300 rounded shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 text-[11px] font-bold">
                <th className="p-2 border-e border-slate-300 text-start w-12">#</th>
                <th className="p-2 border-e border-slate-300 text-start">رقم القيد</th>
                <th className="p-2 border-e border-slate-300 text-start min-w-[170px]">
                  الاسم بالعربية / Nom en Latin
                </th>
                <th className="p-2 border-e border-slate-300 text-start">المستوى الدراسي والمدرسة السابقة</th>
                <th className="p-2 border-e border-slate-300 text-start">المقر المسجل به</th>
                <th className="p-2 border-e border-slate-300 text-center">شبكة الأولياء</th>
                <th className="p-2 border-e border-slate-300 text-center">تراخيص الاستلام</th>
                <th className="p-2 border-e border-slate-300 text-center">الملف الطبي</th>
                <th className="p-2 border-e border-slate-300 text-center">بوابة الرسوم والحساب</th>
                <th className="p-2 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-slate-500">
                    لا توجد سجلات تطابق معايير البحث الحالية.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const isActivated = student.accountStatus === 'ACTIVATED';
                  return (
                    <tr
                      key={student.personId}
                      className="hover:bg-slate-50 transition-colors even:bg-slate-50/40"
                    >
                      {/* Seq */}
                      <td className="p-2 border-e border-slate-200 font-mono text-slate-500 text-center">
                        {idx + 1}
                      </td>

                      {/* Student Code */}
                      <td className="p-2 border-e border-slate-200 font-mono font-bold text-slate-800">
                        {student.studentCode}
                      </td>

                      {/* Bilingual Name */}
                      <td className="p-2 border-e border-slate-200">
                        <div className="font-bold text-slate-900">{student.nameAr}</div>
                        <div className="text-[11px] text-slate-500 font-sans tracking-wide">
                          {student.nameLatin}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          تاريخ الميلاد: {student.birthDate} ({student.gender})
                        </div>
                      </td>

                      {/* Grade & School */}
                      <td className="p-2 border-e border-slate-200">
                        <div className="font-medium text-slate-800">{student.schoolGrade}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[180px]">
                          {student.previousSchool}
                        </div>
                      </td>

                      {/* Branch */}
                      <td className="p-2 border-e border-slate-200">
                        <span className="font-medium text-slate-700">{student.branchNameAr}</span>
                      </td>

                      {/* Guardians Column */}
                      <td className="p-2 border-e border-slate-200 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedStudentForGuardians(student)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-medium transition-colors"
                          title="عرض شبكة الأولياء والوصاية"
                        >
                          <Users className="w-3.5 h-3.5 text-blue-700" />
                          <span>{student.guardians.length} أولياء</span>
                        </button>
                      </td>

                      {/* Pickup Authorization Column */}
                      <td className="p-2 border-e border-slate-200 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudentForPickups(student);
                            setVerificationNinInput('');
                            setVerificationResult(null);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-300 font-medium transition-colors"
                          title="إدارة تراخيص الاستلام والتحقق الأمني"
                        >
                          <Car className="w-3.5 h-3.5 text-sky-700" />
                          <span>{student.authorizedPickups.length} مصرح</span>
                        </button>
                      </td>

                      {/* Medical Drawer Column */}
                      <td className="p-2 border-e border-slate-200 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedStudentForMedical(student)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded font-medium border transition-colors ${
                            student.medical.allergies.length > 0 || student.medical.hasSpecialNeeds
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-300'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                          }`}
                          title="عرض الملف الطبي والتحسس"
                        >
                          <HeartPulse
                            className={`w-3.5 h-3.5 ${
                              student.medical.allergies.length > 0 ? 'text-rose-600' : 'text-slate-500'
                            }`}
                          />
                          <span>
                            {student.medical.allergies.length > 0 ? 'تنبيه طبي' : 'سليم'}
                          </span>
                        </button>
                      </td>

                      {/* Account Activation Badge & Fee Gate */}
                      <td className="p-2 border-e border-slate-200 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedStudentForPaymentGate(student)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-bold border transition-colors ${
                            isActivated
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 animate-pulse'
                          }`}
                          title="عرض بوابة الدفع وتفعيل الحساب"
                        >
                          {isActivated ? (
                            <>
                              <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>مفعل</span>
                            </>
                          ) : (
                            <>
                              <BadgeAlert className="w-3.5 h-3.5 text-amber-600" />
                              <span>معلق الرسوم</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedStudentForGuardians(student)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-600 hover:text-slate-900"
                            title="عرض بطاقة التلميذ التفصيلية"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. GUARDIAN LINKAGE MODAL                                                 */}
      {/* ========================================================================= */}
      {selectedStudentForGuardians && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-3">
          <div className="bg-white border border-slate-300 rounded shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-xs">
            {/* Modal Header */}
            <div className="bg-slate-100 border-b border-slate-300 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-700" />
                <div>
                  <h3 className="font-bold text-slate-900">
                    شبكة الأولياء والوصاية القانونية — {selectedStudentForGuardians.nameAr}
                  </h3>
                  <div className="text-[11px] text-slate-500 font-sans">
                    {selectedStudentForGuardians.nameLatin} ({selectedStudentForGuardians.studentCode})
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForGuardians(null)}
                className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4 overflow-y-auto">
              <div className="bg-blue-50/60 border border-blue-200 p-2.5 rounded text-[11px] text-blue-900 leading-relaxed">
                وفق سياسة المنظومة: يرتبط كل تلميذ بسجل ولي شرعي (أب/أم/وصي قانوني) مع تحديد صفة الحضانة القانونية وحالة الطوارئ.
              </div>

              <div className="space-y-3">
                {selectedStudentForGuardians.guardians.map((guardian) => (
                  <div
                    key={guardian.id}
                    className="border border-slate-300 rounded p-3 bg-slate-50/50 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-[10px]">
                          {guardian.typeLabelAr}
                        </span>
                        <span className="font-bold text-slate-900 text-sm">
                          {guardian.nameAr}
                        </span>
                        <span className="text-slate-500 font-sans text-xs">
                          ({guardian.nameLatin})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {guardian.hasLegalCustody && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                            <ShieldCheck className="w-3 h-3 text-emerald-700" />
                            حضانة قانونية
                          </span>
                        )}
                        {guardian.isEmergencyContact && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold text-[10px]">
                            <Phone className="w-3 h-3 text-rose-700" />
                            جهة اتصال طوارئ
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                      <div>
                        <span className="text-slate-500">رقم التعريف الوطني (NIN):</span>
                        <div className="font-mono font-bold text-slate-800">{guardian.nin}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">الهاتف الرئيسي:</span>
                        <div className="font-mono font-bold text-blue-700 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {guardian.phonePrimary}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">المهنة / الوظيفة:</span>
                        <div className="text-slate-800 font-medium">{guardian.jobTitle}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 border-t border-slate-300 p-2.5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudentForGuardians(null)}
                className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-medium"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. AUTHORIZED PICKUP MANAGER & RECEPTION VERIFICATION MODAL               */}
      {/* ========================================================================= */}
      {selectedStudentForPickups && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-3">
          <div className="bg-white border border-slate-300 rounded shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-xs">
            {/* Header */}
            <div className="bg-slate-100 border-b border-slate-300 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-sky-700" />
                <div>
                  <h3 className="font-bold text-slate-900">
                    قائمة الأشخاص المصرح لهم بالاستلام — {selectedStudentForPickups.nameAr}
                  </h3>
                  <div className="text-[11px] text-slate-500">
                    تتحقق إدارة الاستقبال من بطاقة الهوية عند الباب (دون حفظ سجل يومي)
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForPickups(null)}
                className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4 overflow-y-auto">
              {/* Live Reception Desk Verification Box */}
              <div className="bg-sky-50 border border-sky-300 rounded p-3 space-y-2">
                <div className="font-bold text-sky-950 flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4 text-sky-700" />
                  أداة مكتب الاستقبال: التحقق الفوري من هوية الشخص الحاضر للاستلام
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={verificationNinInput}
                    onChange={(e) => setVerificationNinInput(e.target.value)}
                    placeholder="أدخل رقم التعريف الوطني NIN أو رقم هاتف الشخص..."
                    className="flex-1 bg-white border border-sky-300 rounded px-2.5 py-1.5 text-xs font-mono focus:outline-hidden focus:border-sky-600"
                  />
                  <button
                    type="button"
                    onClick={() => handleCheckPickupAuthorization(selectedStudentForPickups)}
                    className="px-3 py-1.5 rounded bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs"
                  >
                    مطابقة الهوية
                  </button>
                </div>

                {/* Verification Outcome Alert */}
                {verificationResult && (
                  <div
                    className={`p-2.5 rounded border text-xs font-medium flex items-start gap-2 ${
                      verificationResult.status === 'VERIFIED'
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                        : verificationResult.status === 'UNAUTHORIZED'
                        ? 'bg-rose-100 border-rose-300 text-rose-900'
                        : 'bg-amber-100 border-amber-300 text-amber-900'
                    }`}
                  >
                    {verificationResult.status === 'VERIFIED' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-700 flex-shrink-0 mt-0.5" />
                    )}
                    <div>{verificationResult.message}</div>
                  </div>
                )}
              </div>

              {/* Authorized Persons List */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-xs">
                  الأشخاص المعتمدون مسبقاً من طرف الولي ({selectedStudentForPickups.authorizedPickups.length}):
                </h4>
                <div className="divide-y divide-slate-200 border border-slate-300 rounded overflow-hidden">
                  {selectedStudentForPickups.authorizedPickups.map((pickup) => (
                    <div
                      key={pickup.id}
                      className="p-3 bg-white hover:bg-slate-50 flex flex-wrap items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {pickup.nameAr}
                          </span>
                          <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 border border-slate-300 rounded text-[10px] font-semibold">
                            {pickup.relationAr}
                          </span>
                          {pickup.isOneOff && (
                            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded text-[10px]">
                              ترخيص استثنائي مؤقت
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          رقم التعريف (NIN): <span className="font-bold text-slate-700">{pickup.nin}</span> | الهاتف: {pickup.phone}
                        </div>
                        {pickup.notes && (
                          <div className="text-[10px] text-slate-500 italic mt-0.5">
                            ملاحظة: {pickup.notes}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          مطابق بالاستقبال
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setVerificationNinInput(pickup.nin);
                            handleCheckPickupAuthorization(selectedStudentForPickups);
                          }}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-[10px]"
                        >
                          اختبار المطابقة
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-100 border-t border-slate-300 p-2.5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudentForPickups(null)}
                className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-medium"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MEDICAL PROFILE DRAWER / MODAL                                         */}
      {/* ========================================================================= */}
      {selectedStudentForMedical && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-3">
          <div className="bg-white border border-slate-300 rounded shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden text-xs">
            {/* Header */}
            <div className="bg-slate-100 border-b border-slate-300 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                <div>
                  <h3 className="font-bold text-slate-900">
                    الملف الصحي والطبي الوقائي — {selectedStudentForMedical.nameAr}
                  </h3>
                  <div className="text-[11px] text-slate-500 font-mono">
                    فصيلة الدم: {selectedStudentForMedical.medical.bloodType} | القيد:{' '}
                    {selectedStudentForMedical.studentCode}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForMedical(null)}
                className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4 overflow-y-auto">
              {/* Blood Type & Special Needs Banner */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-300 p-2.5 rounded">
                  <span className="text-slate-500 text-[10px]">فصيلة الدم المعتمدة:</span>
                  <div className="text-lg font-bold font-mono text-rose-700">
                    {selectedStudentForMedical.medical.bloodType}
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-300 p-2.5 rounded">
                  <span className="text-slate-500 text-[10px]">حالة الاحتياجات الخاصة:</span>
                  <div className="text-sm font-bold text-slate-800">
                    {selectedStudentForMedical.medical.hasSpecialNeeds ? (
                      <span className="text-amber-700">نعم (تتطلب رعاية بيداغوجية خاصة)</span>
                    ) : (
                      <span className="text-emerald-700">لا توجد احتياجات خاصة</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Allergies Box */}
              <div className="border border-slate-300 rounded p-3 bg-white space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  الحساسيات والتحسس الغذائي والدوائي:
                </div>
                {selectedStudentForMedical.medical.allergies.length === 0 ? (
                  <p className="text-slate-500 italic text-[11px]">لا توجد حساسيات مسجلة.</p>
                ) : (
                  <div className="space-y-1">
                    {selectedStudentForMedical.medical.allergies.map((allergy, i) => (
                      <div
                        key={i}
                        className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold"
                      >
                        ⚠️ {allergy}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Chronic Conditions */}
              <div className="border border-slate-300 rounded p-3 bg-white space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                  الأمراض المزمنة والملاحظات السريرية:
                </div>
                {selectedStudentForMedical.medical.chronicConditions.length === 0 ? (
                  <p className="text-slate-500 italic text-[11px]">لا توجد أمراض مزمنة مصرح بها.</p>
                ) : (
                  <ul className="list-disc list-inside text-slate-700 space-y-0.5 text-xs">
                    {selectedStudentForMedical.medical.chronicConditions.map((cond, i) => (
                      <li key={i}>{cond}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Pediatrician & Emergency Protocol */}
              <div className="bg-slate-50 border border-slate-300 rounded p-3 space-y-2">
                <div className="font-bold text-slate-800 text-xs">
                  الطبيب المتابع وبروتوكول الطوارئ:
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500">الطبيب المعالج:</span>
                    <div className="font-medium text-slate-900">
                      {selectedStudentForMedical.medical.pediatricianName}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">هاتف الطوارئ الطبي:</span>
                    <div className="font-mono font-bold text-blue-700">
                      {selectedStudentForMedical.medical.pediatricianPhone}
                    </div>
                  </div>
                </div>
                <div className="pt-1 text-[11px] text-slate-600 border-t border-slate-200">
                  <span className="font-semibold text-slate-700">توجيهات الإسعاف: </span>
                  {selectedStudentForMedical.medical.emergencyMedicalNotes}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-100 border-t border-slate-300 p-2.5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudentForMedical(null)}
                className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-medium"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ACCOUNT ACTIVATION & FEE PAYMENT GATE MODAL                            */}
      {/* ========================================================================= */}
      {selectedStudentForPaymentGate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-3">
          <div className="bg-white border border-slate-300 rounded shadow-2xl w-full max-w-lg overflow-hidden text-xs">
            {/* Header */}
            <div className="bg-slate-100 border-b border-slate-300 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-700" />
                <div>
                  <h3 className="font-bold text-slate-900">
                    بوابة تفعيل الحساب وسداد الرسوم — {selectedStudentForPaymentGate.nameAr}
                  </h3>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {selectedStudentForPaymentGate.studentCode} ({selectedStudentForPaymentGate.branchNameAr})
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForPaymentGate(null)}
                className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
              {/* Rule reminder */}
              <div className="bg-slate-50 border border-slate-300 p-2.5 rounded text-[11px] text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900">قاعدة المنظومة الصارمة (System Rule):</span>{' '}
                يبقى حساب التلميذ والولي في حالة <span className="text-amber-800 font-bold">معلق (Pending)</span>{' '}
                حتى يتم سداد رسوم التسجيل السنوية + رسوم المستوى الأول نقداً وتوثيق الإيصال بالخزينة.
              </div>

              {/* Fee Breakdown Checklist */}
              <div className="border border-slate-300 rounded overflow-hidden divide-y divide-slate-200">
                {/* 1. Registration Fee */}
                <div className="p-3 bg-white flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-900">
                      1. رسوم التسجيل وإعادة التسجيل السنوية
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      المبلغ المستحق: {selectedStudentForPaymentGate.registrationFeeAmount} دج
                    </div>
                    {selectedStudentForPaymentGate.registrationFeePaid && (
                      <div className="text-[10px] text-emerald-700 font-mono">
                        رقم الإيصال: {selectedStudentForPaymentGate.registrationReceiptNo}
                      </div>
                    )}
                  </div>
                  <div>
                    {selectedStudentForPaymentGate.registrationFeePaid ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        تم السداد
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
                        <XCircle className="w-3 h-3 text-rose-700" />
                        غير مسدد
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. First Level Course Fee */}
                <div className="p-3 bg-white flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-900">
                      2. مستحقات المستوى الأول (First-Level Fees)
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      المبلغ المستحق: {selectedStudentForPaymentGate.firstLevelFeeAmount} دج
                    </div>
                    {selectedStudentForPaymentGate.firstLevelFeePaid ? (
                      <div className="text-[10px] text-emerald-700 font-mono">
                        رقم الإيصال: {selectedStudentForPaymentGate.firstLevelReceiptNo}
                      </div>
                    ) : (
                      <div className="text-[10px] text-amber-700 font-semibold">
                        مطلوب لتحرير الكتب والواجبات وتفعيل الدخول
                      </div>
                    )}
                  </div>
                  <div>
                    {selectedStudentForPaymentGate.firstLevelFeePaid ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        تم السداد
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                        <Clock className="w-3 h-3 text-amber-700" />
                        معلق
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Outcome */}
              <div
                className={`p-3 rounded border flex items-center justify-between ${
                  selectedStudentForPaymentGate.accountStatus === 'ACTIVATED'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-amber-50 border-amber-300 text-amber-950'
                }`}
              >
                <div>
                  <span className="font-bold">حالة الحساب في المنظومة:</span>{' '}
                  <span className="font-bold">
                    {selectedStudentForPaymentGate.accountStatus === 'ACTIVATED'
                      ? 'نشط ومفعل كلياً (ACTIVATED)'
                      : 'قيد انتظار تسوية الرسوم (PENDING_PAYMENT)'}
                  </span>
                </div>
                <div>
                  {selectedStudentForPaymentGate.accountStatus === 'ACTIVATED' ? (
                    <Unlock className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <Lock className="w-4 h-4 text-amber-700" />
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-100 border-t border-slate-300 p-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedStudentForPaymentGate(null)}
                className="px-3 py-1.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium"
              >
                إلغاء
              </button>

              {selectedStudentForPaymentGate.accountStatus !== 'ACTIVATED' && (
                <button
                  type="button"
                  onClick={() =>
                    handleSettleFeeAndActivate(selectedStudentForPaymentGate.personId)
                  }
                  className="px-4 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1.5 shadow-2xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  تسجيل السداد النقدي وتفعيل الحساب فوراً
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Clock(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
