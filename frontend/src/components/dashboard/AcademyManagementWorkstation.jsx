import React, { useState } from 'react';
import {
  GraduationCap,
  Layers,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  PhoneCall,
  UserCheck,
  UserX,
  BookOpen,
  Download,
  FileCheck,
  Award,
  ShieldCheck,
  FileText,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Filter,
  Search,
  Plus,
  X,
  Eye,
  Check,
  Lock,
  Unlock,
  AlertOctagon,
  Building2,
  CalendarDays,
  Sliders,
  CheckSquare,
} from 'lucide-react';
import {
  MOCK_ACADEMY_WORKSHOPS,
  MOCK_TIMETABLE_SLOTS,
  MOCK_SESSION_ATTENDANCE,
  MOCK_MAKEUP_QUEUE,
  MOCK_EVALUATION_SHEETS,
  MOCK_COURSE_MATERIALS,
  MOCK_13_BRANCHES,
} from '../../mock/academyHrMockData';

/**
 * AcademyManagementWorkstation
 * Enterprise High-Density Workstation for Academy Branches:
 * 1. Workshops & Level Sequences with Dynamic Pass Rule Builder (Soroban 3 tests 80/100, Oral right/wrong, Project rubric 75%, Challenge milestones).
 * 2. Timetable Grid with Visual Clash Warnings (Room conflict, Trainer conflict, Capacity).
 * 3. Session Attendance Sheet with Absence Logging & Live Telephone Justification Modal.
 * 4. Make-up Sessions Queue (acad_makeup - Absences & Failed test retakes).
 * 5. Dynamic Evaluation Studio with Double-Blind Reviewer Approval Workflow.
 * 6. Student Homework & Course Book Downloads with Active Enrollment Gate.
 * Excel-like technical styling, RTL Cairo font, zero neon bloat.
 */
export function AcademyManagementWorkstation({ selectedBranchId }) {
  const [activeTab, setActiveTab] = useState('workshops'); // 'workshops' | 'timetable' | 'attendance' | 'makeup' | 'evaluation' | 'materials'

  // 1. Workshops state
  const [workshops, setWorkshops] = useState(MOCK_ACADEMY_WORKSHOPS);
  const [selectedWorkshop, setSelectedWorkshop] = useState(MOCK_ACADEMY_WORKSHOPS[0]);
  const [selectedLevel, setSelectedLevel] = useState(MOCK_ACADEMY_WORKSHOPS[0].levels[0]);
  const [isPassRuleEditorOpen, setIsPassRuleEditorOpen] = useState(false);

  // 2. Timetable state
  const [timetableSlots, setTimetableSlots] = useState(MOCK_TIMETABLE_SLOTS);
  const [selectedDay, setSelectedDay] = useState('ALL'); // 'ALL' | 'السبت' | 'الثلاثاء' | 'الأربعاء'

  // 3. Session Attendance & Telephone Justification state
  const [attendanceSession, setAttendanceSession] = useState(MOCK_SESSION_ATTENDANCE);
  const [justificationModalStudent, setJustificationModalStudent] = useState(null);
  const [justificationForm, setJustificationForm] = useState({
    contactedPerson: '',
    phoneDialed: '',
    callOutcome: 'JUSTIFIED',
    justificationReasonAr: '',
  });

  // 4. Make-up Queue state
  const [makeupQueue, setMakeupQueue] = useState(MOCK_MAKEUP_QUEUE);
  const [schedulingModalItem, setSchedulingModalItem] = useState(null);
  const [schedulingForm, setSchedulingForm] = useState({
    scheduledDate: '',
    scheduledTime: '',
    assignedRoom: '',
    assignedTrainer: '',
  });

  // 5. Dynamic Evaluation Studio state
  const [evaluationSheets, setEvaluationSheets] = useState(MOCK_EVALUATION_SHEETS);
  const [selectedEvalSheet, setSelectedEvalSheet] = useState(null);
  const [reviewerDecisionNotes, setReviewerDecisionNotes] = useState('');

  // 6. Course Materials state
  const [materials, setMaterials] = useState(MOCK_COURSE_MATERIALS);

  // --------------------------------------------------------------------------
  // Handlers for Session Attendance & Phone Justification
  // --------------------------------------------------------------------------
  const handleToggleAttendance = (studentId, newStatus) => {
    setAttendanceSession((prev) => ({
      ...prev,
      students: prev.students.map((st) =>
        st.studentId === studentId
          ? {
              ...st,
              attendanceStatus: newStatus,
              checkinTime: newStatus === 'PRESENT' ? '08:30' : newStatus === 'LATE' ? '08:50' : '',
            }
          : st
      ),
    }));
  };

  const handleOpenJustificationModal = (student) => {
    setJustificationModalStudent(student);
    setJustificationForm({
      contactedPerson: student.telephoneLog?.contactedPerson || 'الولي الشرعي',
      phoneDialed: student.telephoneLog?.phoneDialed || '0550 00 00 00',
      callOutcome: student.telephoneLog?.callOutcome || 'JUSTIFIED',
      justificationReasonAr: student.telephoneLog?.justificationReasonAr || '',
    });
  };

  const handleSaveJustification = (e) => {
    e.preventDefault();
    if (!justificationModalStudent) return;

    const updatedLog = {
      called: true,
      calledAt: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }),
      contactedPerson: justificationForm.contactedPerson,
      callerStaff: 'مكتب الاستقبال المركزي',
      phoneDialed: justificationForm.phoneDialed,
      callOutcome: justificationForm.callOutcome,
      justificationReasonAr: justificationForm.justificationReasonAr,
      makeupSessionTriggered: true,
    };

    setAttendanceSession((prev) => ({
      ...prev,
      students: prev.students.map((st) =>
        st.studentId === justificationModalStudent.studentId
          ? { ...st, telephoneLog: updatedLog }
          : st
      ),
    }));

    // Auto-enqueue into make-up queue if justified or absence
    const newMakeupItem = {
      makeupId: `MKP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      studentId: justificationModalStudent.studentId,
      studentNameAr: justificationModalStudent.nameAr,
      studentCode: justificationModalStudent.studentCode,
      branchId: attendanceSession.branchId,
      branchNameAr: attendanceSession.branchNameAr,
      workshopTitleAr: attendanceSession.workshopTitleAr,
      originType: 'ABSENCE',
      originTypeLabelAr: 'غياب مبرر هاتفياً عبر الاستقبال',
      originalDate: attendanceSession.sessionDate,
      reasonAr: justificationForm.justificationReasonAr || 'تم التبرير هاتفياً',
      scheduledDate: '',
      scheduledTime: '',
      assignedRoom: '',
      assignedTrainer: '',
      status: 'PENDING',
      statusLabelAr: 'قيد انتظار الجدولة',
    };

    setMakeupQueue((prev) => [newMakeupItem, ...prev]);
    setJustificationModalStudent(null);
  };

  // --------------------------------------------------------------------------
  // Handlers for Make-up Scheduling
  // --------------------------------------------------------------------------
  const handleSaveMakeupSchedule = (e) => {
    e.preventDefault();
    if (!schedulingModalItem) return;

    setMakeupQueue((prev) =>
      prev.map((item) =>
        item.makeupId === schedulingModalItem.makeupId
          ? {
              ...item,
              scheduledDate: schedulingForm.scheduledDate || '2026-11-15',
              scheduledTime: schedulingForm.scheduledTime || '15:00 - 16:30',
              assignedRoom: schedulingForm.assignedRoom || 'قاعة الأنشطة (C106)',
              assignedTrainer: schedulingForm.assignedTrainer || 'مدرب المناوبة المعتمد',
              status: 'SCHEDULED',
              statusLabelAr: 'مجدولة رسمياً',
            }
          : item
      )
    );
    setSchedulingModalItem(null);
  };

  // --------------------------------------------------------------------------
  // Handlers for Double-Blind Reviewer Approval Workflow
  // --------------------------------------------------------------------------
  const handleReviewerDecision = (evalId, decision) => {
    // decision: 'APPROVE' | 'REJECT'
    setEvaluationSheets((prev) =>
      prev.map((sheet) => {
        if (sheet.evalId === evalId) {
          const isApproved = decision === 'APPROVE';
          return {
            ...sheet,
            status: isApproved ? 'APPROVED_PUBLISHED' : 'REJECTED',
            statusLabelAr: isApproved
              ? 'معتمد ومنشور للولي والتلميذ (ترقية المستوى)'
              : 'راسب - يتطلب حصة تداركية لإعادة الاختبار',
            reviewerNotes:
              reviewerDecisionNotes ||
              (isApproved
                ? 'تمت المراجعة المستقلة واعتماد النتائج دون تحفظ.'
                : 'الدرجة غير كافية، يتطلب إعادة الاختبار في الحصة التداركية.'),
            canPassToNextBook: isApproved,
          };
        }
        return sheet;
      })
    );
    setSelectedEvalSheet(null);
    setReviewerDecisionNotes('');
  };

  return (
    <div className="space-y-3 font-arabic text-slate-800">
      {/* Top Banner & Tab Navigation */}
      <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 border border-blue-200 text-blue-900 rounded">
              <GraduationCap className="w-5 h-5 text-blue-700" />
            </span>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                محطة إدارة الأكاديمية (Academy Management Workstation)
              </h1>
              <p className="text-xs text-slate-500">
                منظومة الورشات، المستويات، جداول التوقيت والتعارض، الحضور والمبررات الهاتفية، التقييم المزدوج والكتب
              </p>
            </div>
          </div>

          {/* Tab buttons */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('workshops')}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                activeTab === 'workshops'
                  ? 'bg-blue-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>الورشات وقواعد النجاح</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('timetable')}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                activeTab === 'timetable'
                  ? 'bg-blue-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>جدول التوقيت والتعارض</span>
              {timetableSlots.some((s) => s.clashType !== 'NONE') && (
                <span className="inline-block w-2 h-2 rounded-full bg-rose-500"></span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('attendance')}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                activeTab === 'attendance'
                  ? 'bg-blue-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>الحضور والمبررات الهاتفية</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('makeup')}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                activeTab === 'makeup'
                  ? 'bg-blue-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>طابور الحصص التعويضية ({makeupQueue.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('evaluation')}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                activeTab === 'evaluation'
                  ? 'bg-blue-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>استوديو التقييم المزدوج</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('materials')}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                activeTab === 'materials'
                  ? 'bg-blue-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>الكتب والواجبات</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: WORKSHOPS & LEVEL SEQUENCES WITH PASS RULE BUILDER                  */}
      {/* ========================================================================= */}
      {activeTab === 'workshops' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Workshops List */}
          <div className="bg-white border border-slate-300 rounded shadow-2xs overflow-hidden">
            <div className="bg-slate-100 p-2.5 border-b border-slate-300 font-bold text-slate-800 text-xs flex items-center justify-between">
              <span>الورشات المعتمدة ({workshops.length})</span>
              <span className="text-[10px] text-slate-500">تسلسل خطي للمستويات</span>
            </div>
            <div className="divide-y divide-slate-100">
              {workshops.map((wks) => {
                const isSelected = wks.workshopId === selectedWorkshop.workshopId;
                return (
                  <button
                    key={wks.workshopId}
                    type="button"
                    onClick={() => {
                      setSelectedWorkshop(wks);
                      setSelectedLevel(wks.levels[0]);
                    }}
                    className={`w-full text-start p-3 hover:bg-slate-50 transition-colors flex items-center justify-between ${
                      isSelected ? 'bg-blue-50/80 border-s-4 border-blue-700' : ''
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{wks.titleAr}</div>
                      <div className="text-[10px] text-slate-500 font-sans">{wks.titleEn}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {wks.levelsCount} مستويات متسلسلة • نمط التقييم: {wks.evaluationType}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Level Sequence & Pass Rule Details */}
          <div className="lg:col-span-2 space-y-3">
            {/* Strict Progression Warning Box */}
            <div className="bg-amber-50/70 border border-amber-300 rounded p-2.5 text-[11px] text-amber-950 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">قواعد الانتقال والتسلسل الأكاديمي الصارمة:</span>
                <span className="text-amber-900 block mt-0.5">
                  1. لا يمكن تخطي أي كتاب أو مستوى • 2. يمنع فتح كتابين لنفس الورشة في نفس الوقت • 3. يعيد التلميذ دراسة المستوى والكتاب في حال عدم استيفاء قاعدة النجاح.
                </span>
              </div>
            </div>

            {/* Levels Carousel / Steps */}
            <div className="bg-white border border-slate-300 rounded shadow-2xs p-3 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-xs">
                    مستويات: {selectedWorkshop.titleAr}
                  </h3>
                  <div className="text-[11px] text-slate-500">
                    حدد المستوى لعرض شروط ومعايير النجاح (Pass Rules)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPassRuleEditorOpen(true)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-700 text-xs font-semibold flex items-center gap-1"
                >
                  <Sliders className="w-3.5 h-3.5 text-blue-700" />
                  <span>تعديل معايير قاعدة النجاح</span>
                </button>
              </div>

              {/* Levels pills */}
              <div className="flex flex-wrap gap-2">
                {selectedWorkshop.levels.map((lvl) => {
                  const isLvlSelected = lvl.levelId === selectedLevel?.levelId;
                  return (
                    <button
                      key={lvl.levelId}
                      type="button"
                      onClick={() => setSelectedLevel(lvl)}
                      className={`px-3 py-1.5 rounded text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                        isLvlSelected
                          ? 'bg-blue-800 text-white border-blue-900 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span>المستوى {lvl.sequenceOrder}</span>
                      <span className="text-[10px] opacity-75 font-mono">({lvl.priceDzd} دج)</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Level Card */}
              {selectedLevel && (
                <div className="border border-slate-300 rounded p-3 bg-slate-50/60 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-blue-950">
                        {selectedLevel.titleAr}
                      </div>
                      <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                        📖 الكتاب المعتمد:{' '}
                        <span className="font-bold text-slate-800">{selectedLevel.bookTitle}</span>
                      </div>
                    </div>
                    <div className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-slate-800">
                      السعر المعتمد: {selectedLevel.priceDzd} دج
                    </div>
                  </div>

                  {/* Pass Rule Builder Card */}
                  <div className="bg-white border border-slate-300 rounded p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-emerald-700" />
                        منطق وقاعدة النجاح والترقية للمستوى التالي (Pass Rule):
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded font-mono text-[10px] font-bold">
                        {selectedLevel.passRule.type}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed bg-emerald-50/50 p-2 rounded border border-emerald-200">
                      {selectedLevel.passRule.descriptionAr}
                    </p>

                    {/* Soroban 3 Tests 80/100 Breakdown */}
                    {selectedLevel.passRule.tests && (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[11px] font-bold text-slate-700">
                          تفاصيل الاختبارات الثلاثة الإلزامية (عتبة النجاح 80/100 في كل اختبار):
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {selectedLevel.passRule.tests.map((t, idx) => (
                            <div
                              key={t.id}
                              className="border border-slate-200 bg-slate-50 p-2 rounded text-xs space-y-0.5"
                            >
                              <div className="font-bold text-slate-800">
                                {idx + 1}. {t.name}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                المدة: {t.durationMinutes} دقائق | الأسئلة: {t.totalQuestions}
                              </div>
                              <div className="text-[10px] font-bold text-emerald-700 font-mono">
                                علامة النجاح: {t.passMark} / 100
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Robotics Rubric Breakdown */}
                    {selectedLevel.passRule.criteria && (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[11px] font-bold text-slate-700">
                          سلم تنقيط المشروع التطبيقي (Project Rubric - الحد الأدنى 75%):
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedLevel.passRule.criteria.map((c, i) => (
                            <div
                              key={i}
                              className="border border-slate-200 bg-slate-50 p-2 rounded text-xs flex justify-between items-center"
                            >
                              <span className="text-slate-800 font-medium">{c.name}</span>
                              <span className="font-bold font-mono text-blue-700">{c.weight}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Oral Right/Wrong Benchmark */}
                    {selectedLevel.passRule.totalItems && (
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded text-xs flex justify-between items-center">
                        <span className="text-slate-800 font-medium">
                          العتبة الشفوية: {selectedLevel.passRule.minRightItems} إجابة صحيحة من أصل{' '}
                          {selectedLevel.passRule.totalItems} سؤالاً
                        </span>
                        <span className="font-bold font-mono text-emerald-700">
                          {selectedLevel.passRule.passPercentage}% نجاح
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TIMETABLE SCHEDULER & VISUAL CLASH WARNINGS                        */}
      {/* ========================================================================= */}
      {activeTab === 'timetable' && (
        <div className="space-y-3">
          {/* Controls Bar */}
          <div className="bg-white border border-slate-300 p-2.5 rounded shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">تصفية حسب اليوم:</span>
              <div className="flex gap-1">
                {['ALL', 'السبت', 'الثلاثاء', 'الأربعاء'].map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={`px-2 py-1 rounded font-semibold text-xs transition-colors ${
                      selectedDay === day
                        ? 'bg-blue-800 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {day === 'ALL' ? 'كافة الأيام' : day}
                  </button>
                ))}
              </div>
            </div>

            {/* Clash Summary Badge */}
            <div className="flex items-center gap-2">
              {timetableSlots.some((s) => s.clashType !== 'NONE') ? (
                <div className="px-2.5 py-1 rounded bg-rose-50 border border-rose-300 text-rose-900 font-bold text-xs flex items-center gap-1.5 animate-pulse">
                  <AlertOctagon className="w-4 h-4 text-rose-700" />
                  <span>
                    تم رصد تعارضات في التوقيت (
                    {timetableSlots.filter((s) => s.clashType !== 'NONE').length} تعارض نشط)
                  </span>
                </div>
              ) : (
                <div className="px-2.5 py-1 rounded bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold text-xs flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-700" />
                  <span>الجدول سليم وخالٍ من التعارضات</span>
                </div>
              )}
            </div>
          </div>

          {/* Timetable Slots High-Density Grid */}
          <div className="bg-white border border-slate-300 rounded shadow-2xs overflow-hidden text-xs">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 text-[11px] font-bold">
                  <th className="p-2 border-e border-slate-300 text-start">اليوم والتوقيت</th>
                  <th className="p-2 border-e border-slate-300 text-start">الفرع والمقر</th>
                  <th className="p-2 border-e border-slate-300 text-start">القاعة والتجهيزات</th>
                  <th className="p-2 border-e border-slate-300 text-start">الفوج والورشة</th>
                  <th className="p-2 border-e border-slate-300 text-start">المدرب المسؤول</th>
                  <th className="p-2 border-e border-slate-300 text-center">الاستيعاب</th>
                  <th className="p-2 border-e border-slate-300 text-start">
                    فحص التعارض (Clash Warning)
                  </th>
                  <th className="p-2 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {timetableSlots
                  .filter((s) => selectedDay === 'ALL' || s.dayOfWeekAr === selectedDay)
                  .map((slot) => {
                    const hasClash = slot.clashType !== 'NONE';
                    return (
                      <tr
                        key={slot.slotId}
                        className={`transition-colors ${
                          hasClash ? 'bg-rose-50/70 hover:bg-rose-100/50' : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Day & Time */}
                        <td className="p-2 border-e border-slate-200">
                          <div className="font-bold text-slate-900">{slot.dayOfWeekAr}</div>
                          <div className="text-[11px] font-mono text-blue-800">
                            {slot.timeStart} - {slot.timeEnd}
                          </div>
                        </td>

                        {/* Branch */}
                        <td className="p-2 border-e border-slate-200 font-medium text-slate-700">
                          {slot.branchNameAr}
                        </td>

                        {/* Room */}
                        <td className="p-2 border-e border-slate-200">
                          <div className="font-bold text-slate-800">{slot.roomNameAr}</div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: {slot.roomId}</div>
                        </td>

                        {/* Workshop & Group */}
                        <td className="p-2 border-e border-slate-200">
                          <div className="font-bold text-slate-900">{slot.workshopTitleAr}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            كود الفوج: {slot.groupCode}
                          </div>
                        </td>

                        {/* Trainer */}
                        <td className="p-2 border-e border-slate-200 font-semibold text-slate-800">
                          {slot.trainerNameAr}
                        </td>

                        {/* Capacity */}
                        <td className="p-2 border-e border-slate-200 text-center font-mono">
                          <span
                            className={
                              slot.enrolledCount > slot.capacity
                                ? 'text-rose-700 font-bold'
                                : 'text-slate-700'
                            }
                          >
                            {slot.enrolledCount} / {slot.capacity}
                          </span>
                        </td>

                        {/* Clash Warning Column */}
                        <td className="p-2 border-e border-slate-200">
                          {hasClash ? (
                            <div className="p-1.5 rounded bg-rose-100 border border-rose-300 text-rose-900 text-[11px] font-bold flex items-start gap-1">
                              <AlertOctagon className="w-3.5 h-3.5 text-rose-700 flex-shrink-0 mt-0.5" />
                              <span>{slot.clashMessage}</span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-[11px]">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              حجز متناسق وغير متعارض
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="p-2 text-center">
                          {hasClash ? (
                            <button
                              type="button"
                              onClick={() => {
                                // Resolve clash by auto-reassigning slot or clear
                                setTimetableSlots((prev) =>
                                  prev.map((s) =>
                                    s.slotId === slot.slotId
                                      ? {
                                          ...s,
                                          roomId: 'C105',
                                          roomNameAr: 'قاعة الدعم البديلة (C105)',
                                          trainerId: 'TRN-04',
                                          trainerNameAr: 'طارق مزيان',
                                          clashType: 'NONE',
                                          clashMessage: '',
                                        }
                                      : s
                                  )
                                );
                              }}
                              className="px-2 py-1 rounded bg-rose-700 hover:bg-rose-800 text-white font-bold text-[10px]"
                            >
                              معالجة التعارض
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-[10px]"
                            >
                              تعديل الحصة
                            </button>
                          )}
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
      {/* TAB 3: SESSION ATTENDANCE SHEET & TELEPHONE JUSTIFICATIONS                */}
      {/* ========================================================================= */}
      {activeTab === 'attendance' && (
        <div className="space-y-3">
          {/* Active Session Card */}
          <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-[10px]">
                  جلسة تدريبية نشطة
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  {attendanceSession.workshopTitleAr}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5">
                  <span>📅 التاريخ: {attendanceSession.sessionDate}</span>
                  <span>⏰ التوقيت: {attendanceSession.timeSlot}</span>
                  <span>📍 القاعة: {attendanceSession.roomNameAr}</span>
                  <span>👤 المدرب: {attendanceSession.trainerNameAr}</span>
                </div>
              </div>

              {/* Attendance Quick Stats */}
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded font-semibold">
                  حاضر:{' '}
                  {
                    attendanceSession.students.filter(
                      (s) => s.attendanceStatus === 'PRESENT' || s.attendanceStatus === 'LATE'
                    ).length
                  }
                </span>
                <span className="px-2 py-1 bg-rose-50 text-rose-900 border border-rose-200 rounded font-semibold">
                  غائب:{' '}
                  {
                    attendanceSession.students.filter((s) => s.attendanceStatus === 'ABSENT')
                      .length
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white border border-slate-300 rounded shadow-2xs overflow-hidden text-xs">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 text-[11px] font-bold">
                  <th className="p-2 border-e border-slate-300 text-start w-12">#</th>
                  <th className="p-2 border-e border-slate-300 text-start">كود التلميذ</th>
                  <th className="p-2 border-e border-slate-300 text-start">الاسم واللقب</th>
                  <th className="p-2 border-e border-slate-300 text-center">حالة الحضور</th>
                  <th className="p-2 border-e border-slate-300 text-start">وقت الدخول</th>
                  <th className="p-2 border-e border-slate-300 text-start">
                    سجل الاتصال الهاتفي والمبرر (Absence Phone Call)
                  </th>
                  <th className="p-2 text-center">إجراءات المتابعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {attendanceSession.students.map((student, idx) => {
                  const isAbsent = student.attendanceStatus === 'ABSENT';
                  const isLate = student.attendanceStatus === 'LATE';
                  const isPresent = student.attendanceStatus === 'PRESENT';

                  return (
                    <tr
                      key={student.studentId}
                      className={`hover:bg-slate-50 transition-colors ${
                        isAbsent ? 'bg-rose-50/30' : isLate ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="p-2 border-e border-slate-200 font-mono text-center text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="p-2 border-e border-slate-200 font-mono font-bold text-slate-800">
                        {student.studentCode}
                      </td>
                      <td className="p-2 border-e border-slate-200">
                        <div className="font-bold text-slate-900">{student.nameAr}</div>
                        <div className="text-[10px] text-slate-400 font-sans">
                          {student.nameLatin}
                        </div>
                      </td>

                      {/* Status Toggle Buttons */}
                      <td className="p-2 border-e border-slate-200 text-center">
                        <div className="inline-flex rounded border border-slate-300 overflow-hidden text-[10px] font-bold">
                          <button
                            type="button"
                            onClick={() => handleToggleAttendance(student.studentId, 'PRESENT')}
                            className={`px-2 py-1 ${
                              isPresent
                                ? 'bg-emerald-700 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            حاضر
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleAttendance(student.studentId, 'LATE')}
                            className={`px-2 py-1 border-s border-e border-slate-300 ${
                              isLate
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            متأخر
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleAttendance(student.studentId, 'ABSENT')}
                            className={`px-2 py-1 ${
                              isAbsent
                                ? 'bg-rose-700 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            غائب
                          </button>
                        </div>
                      </td>

                      {/* Checkin Time */}
                      <td className="p-2 border-e border-slate-200 font-mono text-slate-700">
                        {student.checkinTime || '—'}
                      </td>

                      {/* Telephone Call Log Box */}
                      <td className="p-2 border-e border-slate-200">
                        {student.telephoneLog ? (
                          <div className="p-1.5 rounded bg-slate-50 border border-slate-200 space-y-0.5 text-[11px]">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold text-blue-800 flex items-center gap-1">
                                <PhoneCall className="w-3 h-3 text-blue-600" />
                                {student.telephoneLog.contactedPerson}
                              </span>
                              <span className="font-mono text-slate-400">
                                {student.telephoneLog.calledAt}
                              </span>
                            </div>
                            <div className="text-slate-700">
                              {student.telephoneLog.justificationReasonAr}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              الموظف المسجل: {student.telephoneLog.callerStaff}
                            </div>
                          </div>
                        ) : isAbsent ? (
                          <span className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            بانتظار إجراء المكالمة الهاتفية من مكتب الاستقبال
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="p-2 text-center">
                        {isAbsent || isLate ? (
                          <button
                            type="button"
                            onClick={() => handleOpenJustificationModal(student)}
                            className="px-2.5 py-1 rounded bg-blue-700 hover:bg-blue-800 text-white font-bold text-[10px] flex items-center gap-1 mx-auto"
                          >
                            <PhoneCall className="w-3 h-3" />
                            <span>تسجيل مكالمة التبرير</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-700 font-semibold">
                            لا يتطلب إجراء
                          </span>
                        )}
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
      {/* TAB 4: MAKE-UP SESSIONS QUEUE (acad_makeup)                                */}
      {/* ========================================================================= */}
      {activeTab === 'makeup' && (
        <div className="space-y-3">
          <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-xs">
                طابور الحصص التعويضية وحصص التدارك للاختبارات الراسبة
              </h3>
              <p className="text-[11px] text-slate-500">
                تسجيل آلي لتعويض الغيابات المبررة وإعادة الاختبارات التقييمية غير المجتازة
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-300 rounded text-[11px] font-mono">
                إجمالي الطابور: {makeupQueue.length}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-300 rounded shadow-2xs overflow-hidden text-xs">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 text-[11px] font-bold">
                  <th className="p-2 border-e border-slate-300 text-start">رقم التعويض</th>
                  <th className="p-2 border-e border-slate-300 text-start">التلميذ والمقر</th>
                  <th className="p-2 border-e border-slate-300 text-start">الورشة والمستوى</th>
                  <th className="p-2 border-e border-slate-300 text-start">نوع المصدر وسبب الاستحقاق</th>
                  <th className="p-2 border-e border-slate-300 text-start">تاريخ الجلسة الأصلية</th>
                  <th className="p-2 border-e border-slate-300 text-start">الموعد والقاعة المجدولة</th>
                  <th className="p-2 border-e border-slate-300 text-center">الحالة</th>
                  <th className="p-2 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {makeupQueue.map((item) => (
                  <tr key={item.makeupId} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2 border-e border-slate-200 font-mono font-bold text-slate-800">
                      {item.makeupId}
                    </td>
                    <td className="p-2 border-e border-slate-200">
                      <div className="font-bold text-slate-900">{item.studentNameAr}</div>
                      <div className="text-[10px] text-slate-500">{item.branchNameAr}</div>
                    </td>
                    <td className="p-2 border-e border-slate-200 font-medium text-slate-800">
                      {item.workshopTitleAr}
                    </td>
                    <td className="p-2 border-e border-slate-200">
                      <span
                        className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          item.originType === 'ABSENCE'
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-rose-100 text-rose-900'
                        }`}
                      >
                        {item.originTypeLabelAr}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-0.5">{item.reasonAr}</div>
                    </td>
                    <td className="p-2 border-e border-slate-200 font-mono text-slate-600">
                      {item.originalDate}
                    </td>
                    <td className="p-2 border-e border-slate-200">
                      {item.scheduledDate ? (
                        <div>
                          <div className="font-bold text-slate-800 font-mono">
                            {item.scheduledDate} ({item.scheduledTime})
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {item.assignedRoom} • {item.assignedTrainer}
                          </div>
                        </div>
                      ) : (
                        <span className="text-amber-700 italic text-[11px]">غير مجدولة بعد</span>
                      )}
                    </td>
                    <td className="p-2 border-e border-slate-200 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === 'SCHEDULED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.statusLabelAr}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSchedulingModalItem(item);
                          setSchedulingForm({
                            scheduledDate: item.scheduledDate || '2026-11-12',
                            scheduledTime: item.scheduledTime || '16:00 - 17:30',
                            assignedRoom: item.assignedRoom || 'قاعة الأنشطة (C106)',
                            assignedTrainer: item.assignedTrainer || 'ياسين بوعريشة',
                          });
                        }}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-[10px] font-medium"
                      >
                        جدولة الحصة
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: DYNAMIC EVALUATION STUDIO (DOUBLE-BLIND REVIEWER APPROVAL)         */}
      {/* ========================================================================= */}
      {activeTab === 'evaluation' && (
        <div className="space-y-3">
          {/* Double-Blind DB Constraint Rule Warning */}
          <div className="bg-blue-50 border border-blue-200 rounded p-2.5 text-xs text-blue-950 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">قيد المراجعة المزدوجة الصارم (Double-Blind Workflow):</span>
              <span className="text-blue-900 block mt-0.5">
                وفق قواعد قاعدة البيانات: لا يمكن للأستاذ المصحح اعتماد ونشر نتيجته بنفسه. يشترط تعيين مراجع مزدوج مستقل من الإدارة البيداغوجية لمراجعة الدرجات واعتماد ترقية التلميذ للكتاب الموالي.
              </span>
            </div>
          </div>

          {/* Evaluations High-Density Table */}
          <div className="bg-white border border-slate-300 rounded shadow-2xs overflow-hidden text-xs">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 text-[11px] font-bold">
                  <th className="p-2 border-e border-slate-300 text-start">رقم التقييم</th>
                  <th className="p-2 border-e border-slate-300 text-start">التلميذ</th>
                  <th className="p-2 border-e border-slate-300 text-start">الورشة والاختبار</th>
                  <th className="p-2 border-e border-slate-300 text-start">الأستاذ المصحح</th>
                  <th className="p-2 border-e border-slate-300 text-start">المراجع المزدوج المستقل</th>
                  <th className="p-2 border-e border-slate-300 text-center">المعدل العام</th>
                  <th className="p-2 border-e border-slate-300 text-center">حالة الاعتماد</th>
                  <th className="p-2 text-center">إجراءات المراجعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {evaluationSheets.map((sheet) => (
                  <tr key={sheet.evalId} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2 border-e border-slate-200 font-mono font-bold text-slate-800">
                      {sheet.evalId}
                    </td>
                    <td className="p-2 border-e border-slate-200">
                      <div className="font-bold text-slate-900">{sheet.studentNameAr}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {sheet.studentCode}
                      </div>
                    </td>
                    <td className="p-2 border-e border-slate-200">
                      <div className="font-semibold text-slate-800">{sheet.workshopTitleAr}</div>
                      <div className="text-[10px] text-slate-500">{sheet.evalTitleAr}</div>
                    </td>
                    <td className="p-2 border-e border-slate-200 text-slate-700">
                      {sheet.correctorNameAr}
                    </td>
                    <td className="p-2 border-e border-slate-200 text-slate-700 font-medium">
                      {sheet.reviewerNameAr}
                    </td>
                    <td className="p-2 border-e border-slate-200 text-center font-mono font-bold text-sm">
                      <span
                        className={
                          sheet.averageScore >= 80 ? 'text-emerald-700' : 'text-rose-700'
                        }
                      >
                        {sheet.averageScore}%
                      </span>
                    </td>
                    <td className="p-2 border-e border-slate-200 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sheet.status === 'APPROVED_PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : sheet.status === 'PENDING_REVIEW'
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {sheet.statusLabelAr}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEvalSheet(sheet);
                          setReviewerDecisionNotes(sheet.reviewerNotes);
                        }}
                        className="px-2.5 py-1 rounded bg-blue-700 hover:bg-blue-800 text-white font-bold text-[10px]"
                      >
                        فحص ومصادقة
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: STUDENT HOMEWORK & COURSE BOOK DOWNLOADS                           */}
      {/* ========================================================================= */}
      {activeTab === 'materials' && (
        <div className="space-y-3">
          <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
            <h3 className="font-bold text-slate-900 text-xs">
              مركز تحميل الكتب الدراسية والواجبات المنزلية (Student Course Materials Gate)
            </h3>
            <p className="text-[11px] text-slate-500">
              وفق ضوابط المنظومة: يسمح للتلميذ بتحميل الكتب والواجبات فقط للمستويات المسجل بها والتي تم سداد رسومها وتفعيل الحساب بها
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {materials.map((mat) => (
              <div
                key={mat.materialId}
                className="bg-white border border-slate-300 rounded shadow-2xs p-3 space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold border border-slate-300">
                      {mat.fileType} • {mat.fileSizeBytes}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {mat.pagesCount} صفحات
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-xs mt-1.5 leading-snug">
                    {mat.titleAr}
                  </h4>
                  <div className="text-[10px] text-slate-500 font-sans">{mat.titleEn}</div>

                  <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-700">شرط الصلاحية: </span>
                    {mat.restrictionNoteAr}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  {mat.isAllowedForAymen ? (
                    <button
                      type="button"
                      onClick={() => alert(`جاري تنزيل الملف: ${mat.titleAr}`)}
                      className="w-full py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تحميل الكتاب / الواجب (متاح ومفعل)</span>
                    </button>
                  ) : (
                    <div className="w-full py-1.5 rounded bg-slate-100 text-slate-400 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed">
                      <Lock className="w-3.5 h-3.5" />
                      <span>التحميل مقيد (يتطلب التسجيل والسداد)</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TELEPHONE JUSTIFICATION CAPTURE                                     */}
      {/* ========================================================================= */}
      {justificationModalStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-3">
          <div className="bg-white border border-slate-300 rounded shadow-2xl w-full max-w-lg overflow-hidden text-xs">
            <div className="bg-slate-100 border-b border-slate-300 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-blue-700" />
                <div>
                  <h3 className="font-bold text-slate-900">
                    تسجيل تبرير هاتفي للغياب — {justificationModalStudent.nameAr}
                  </h3>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {justificationModalStudent.studentCode} ({attendanceSession.sessionDate})
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setJustificationModalStudent(null)}
                className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveJustification} className="p-4 space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  الشخص الذي تم الاتصال به:
                </label>
                <input
                  type="text"
                  value={justificationForm.contactedPerson}
                  onChange={(e) =>
                    setJustificationForm({ ...justificationForm, contactedPerson: e.target.value })
                  }
                  required
                  placeholder="مثال: الأب (رشيد بلقاسم) أو الأم"
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  رقم الهاتف الذي تم الاتصال به:
                </label>
                <input
                  type="text"
                  value={justificationForm.phoneDialed}
                  onChange={(e) =>
                    setJustificationForm({ ...justificationForm, phoneDialed: e.target.value })
                  }
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  نتيجة المكالمة الهاتفية:
                </label>
                <select
                  value={justificationForm.callOutcome}
                  onChange={(e) =>
                    setJustificationForm({ ...justificationForm, callOutcome: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:bg-white focus:border-blue-600 focus:outline-hidden"
                >
                  <option value="JUSTIFIED">تم الرد وقبول التبرير (وعكة صحية / ظرف طارئ)</option>
                  <option value="NO_ANSWER">الرقم يرن ولا أحد يجيب</option>
                  <option value="UNJUSTIFIED">تم الرد دون تقديم عذر مقبول</option>
                  <option value="SWITCHED_OFF">الهاتف مغلق أو خارج نطاق التغطية</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  نص التبرير وملاحظات الاستقبال:
                </label>
                <textarea
                  rows={3}
                  value={justificationForm.justificationReasonAr}
                  onChange={(e) =>
                    setJustificationForm({
                      ...justificationForm,
                      justificationReasonAr: e.target.value,
                    })
                  }
                  required
                  placeholder="اكتب سبب الغياب المصرح به وتأكيد إحالة التلميذ لطابور الحصة التعويضية..."
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 p-2 rounded text-[11px] text-blue-900">
                ⚡ بمجرد الحفظ، يتم إنشاء تذكرة تعويض آلياً في طابور الحصص التعويضية (Make-up Queue).
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setJustificationModalStudent(null)}
                  className="px-3 py-1.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-blue-700 hover:bg-blue-800 text-white font-bold"
                >
                  حفظ التبرير وجدولة التعويض
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DOUBLE-BLIND REVIEWER APPROVAL                                     */}
      {/* ========================================================================= */}
      {selectedEvalSheet && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-3">
          <div className="bg-white border border-slate-300 rounded shadow-2xl w-full max-w-xl overflow-hidden text-xs">
            <div className="bg-slate-100 border-b border-slate-300 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <div>
                  <h3 className="font-bold text-slate-900">
                    بوابة المراجعة المزدوجة المستقلة — {selectedEvalSheet.studentNameAr}
                  </h3>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {selectedEvalSheet.evalTitleAr} ({selectedEvalSheet.workshopTitleAr})
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvalSheet(null)}
                className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 border border-slate-200 p-2.5 rounded">
                <div>
                  <span className="text-slate-500">المصحح الأولي:</span>
                  <div className="font-bold text-slate-800">{selectedEvalSheet.correctorNameAr}</div>
                </div>
                <div>
                  <span className="text-slate-500">المراجع المزدوج المستقل:</span>
                  <div className="font-bold text-blue-800">{selectedEvalSheet.reviewerNameAr}</div>
                </div>
              </div>

              {/* Test scores breakdown */}
              <div className="border border-slate-300 rounded overflow-hidden divide-y divide-slate-200">
                {selectedEvalSheet.testResults.map((t, i) => (
                  <div key={i} className="p-2.5 bg-white flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-800">{t.testName}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {t.score} / {t.maxScore}{' '}
                      <span className="text-[10px] text-slate-400">(عتبة: {t.passMark})</span>
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center p-2.5 bg-slate-100 rounded border border-slate-300 font-bold">
                <span>المعدل العام للتقييم:</span>
                <span className="font-mono text-base text-blue-900">
                  {selectedEvalSheet.averageScore}%
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ملاحظات وقرار المراجع المستقل:
                </label>
                <textarea
                  rows={2}
                  value={reviewerDecisionNotes}
                  onChange={(e) => setReviewerDecisionNotes(e.target.value)}
                  placeholder="اكتب ملاحظات التدقيق البيداغوجي قبل النشر والترقية..."
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedEvalSheet(null)}
                  className="px-3 py-1.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewerDecision(selectedEvalSheet.evalId, 'REJECT')}
                  className="px-3 py-1.5 rounded bg-rose-700 hover:bg-rose-800 text-white font-bold"
                >
                  رفض وإحالة للتدارك
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewerDecision(selectedEvalSheet.evalId, 'APPROVE')}
                  className="px-4 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-2xs"
                >
                  اعتماد ونشر النتيجة (ترقية الكتاب)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
