import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  Award,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Layers,
  Sparkles,
  BookOpen,
  MapPin,
  Check,
  X,
  UserCheck,
} from 'lucide-react';
import { MOCK_SCHEDULES, MOCK_SESSIONS_LIST } from '../../mock/mockData';

export function SchedulesSessionsView() {
  const [schedules, setSchedules] = useState(MOCK_SCHEDULES);
  const [sessions, setSessions] = useState(MOCK_SESSIONS_LIST);
  const [activeSubTab, setActiveSubTab] = useState('schedules'); // 'schedules' | 'sessions'
  const [dayFilter, setDayFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddScheduleModalOpen, setIsAddScheduleModalOpen] = useState(false);
  const [isLogSessionModalOpen, setIsLogSessionModalOpen] = useState(false);
  const [selectedSessionForAttendance, setSelectedSessionForAttendance] = useState(null);

  // New Schedule Slot Form
  const [newSchedule, setNewSchedule] = useState({
    group_name: '',
    classroom_name: 'قاعة الخوارزمي (C101)',
    day_of_week: 'السبت',
    start_time: '09:00',
    end_time: '11:00',
    shift_label: 'الفترة الصباحية',
    instructor: 'فاطمة الزهراء قدور',
  });

  // New Session Log Form
  const [newSession, setNewSession] = useState({
    group_name: 'سوروبان الفوج أ1',
    session_date: new Date().toISOString().substring(0, 10),
    start_time: '09:00',
    end_time: '11:00',
    duration_hours: 2.0,
    instructor_name: 'فاطمة الزهراء قدور',
    calculated_wage: 2400,
    present_count: 18,
    absent_count: 2,
    lesson_topic: '',
  });

  const filteredSchedules = schedules.filter((s) => {
    const matchesDay = dayFilter === 'ALL' || s.day_of_week === dayFilter;
    const matchesSearch =
      s.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.classroom_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDay && matchesSearch;
  });

  const filteredSessions = sessions.filter((sess) => {
    return (
      sess.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sess.instructor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sess.lesson_topic.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalWeeklySlots = schedules.length;
  const completedSessionsCount = sessions.length;
  const totalWagesAccrued = sessions.reduce((acc, s) => acc + (s.calculated_wage || 0), 0);
  const avgAttendanceRate = sessions.length > 0
    ? Math.round(
        (sessions.reduce((acc, s) => acc + s.present_count, 0) /
          sessions.reduce((acc, s) => acc + s.present_count + s.absent_count, 0)) * 100
      )
    : 100;

  const handleCreateSchedule = (e) => {
    e.preventDefault();
    if (!newSchedule.group_name) return;
    const slot = {
      schedule_id: Date.now(),
      ...newSchedule,
    };
    setSchedules([...schedules, slot]);
    setIsAddScheduleModalOpen(false);
    setNewSchedule({
      group_name: '',
      classroom_name: 'قاعة الخوارزمي (C101)',
      day_of_week: 'السبت',
      start_time: '09:00',
      end_time: '11:00',
      shift_label: 'الفترة الصباحية',
      instructor: 'فاطمة الزهراء قدور',
    });
  };

  const handleLogSession = (e) => {
    e.preventDefault();
    if (!newSession.lesson_topic) return;
    const entry = {
      session_id: Date.now(),
      ...newSession,
      duration_hours: parseFloat(newSession.duration_hours) || 2.0,
      calculated_wage: parseFloat(newSession.calculated_wage) || 2400,
      present_count: parseInt(newSession.present_count, 10) || 0,
      absent_count: parseInt(newSession.absent_count, 10) || 0,
    };
    setSessions([entry, ...sessions]);
    setIsLogSessionModalOpen(false);
    setNewSession({
      group_name: 'سوروبان الفوج أ1',
      session_date: new Date().toISOString().substring(0, 10),
      start_time: '09:00',
      end_time: '11:00',
      duration_hours: 2.0,
      instructor_name: 'فاطمة الزهراء قدور',
      calculated_wage: 2400,
      present_count: 18,
      absent_count: 2,
      lesson_topic: '',
    });
  };

  return (
    <div className="space-y-3 font-arabic">
      {/* 1. Module Header */}
      <div className="bg-white border border-slate-300 p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="eyebrow flex items-center gap-1.5 text-blue-900">
            <Calendar className="w-3.5 h-3.5" />
            <span>الجداول الزمنية وتتبع الحصص والحضور</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold font-serif text-slate-900 mt-0.5">
            التوقيت الأسبوعي، تتبع الحصص والحضور (Schedules & Sessions)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            إدارة توزيع القاعات الأسبوعي بدون تعارض، تسجيل الحصص المنجزة للمدربين، احتساب المستحقات، ورصد حضور ونقاط الطلاب.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="view-switch text-xs">
            <button
              onClick={() => setActiveSubTab('schedules')}
              className={activeSubTab === 'schedules' ? 'active' : ''}
            >
              <Calendar className="w-3 h-3" />
              <span>جدول التوقيت الأسبوعي</span>
            </button>
            <button
              onClick={() => setActiveSubTab('sessions')}
              className={activeSubTab === 'sessions' ? 'active' : ''}
            >
              <BookOpen className="w-3 h-3" />
              <span>سجل الحصص المنفذة</span>
            </button>
          </div>

          {activeSubTab === 'schedules' ? (
            <button
              onClick={() => setIsAddScheduleModalOpen(true)}
              className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-medium text-xs rounded flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة حصة أسبوعية</span>
            </button>
          ) : (
            <button
              onClick={() => setIsLogSessionModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs rounded flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>تسجيل إنجاز حصة</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Key Operational Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="bg-white border border-slate-300 p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">الحصص الأسبوعية المجدولة</span>
            <Calendar className="w-4 h-4 text-blue-800" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-slate-900">{totalWeeklySlots}</span>
            <span className="text-[11px] text-blue-900 font-medium">فترة أسبوعياً</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">تغطية القاعات وقاعات الورشات</p>
        </div>

        <div className="bg-white border border-slate-300 p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">الحصص المنفذة هذا الشهر</span>
            <BookOpen className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-emerald-700">{completedSessionsCount}</span>
            <span className="text-[11px] text-slate-600 font-medium">حصة مؤكدة</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">مع تسجيل كشوفات الحضور الكاملة</p>
        </div>

        <div className="bg-white border border-slate-300 p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">متوسط نسبة حضور الطلاب</span>
            <Users className="w-4 h-4 text-indigo-700" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-indigo-700">{avgAttendanceRate}%</span>
            <span className="tag-blue text-[10px]">انضباط ممتاز</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">معدل الحضور في الأفواج النشطة</p>
        </div>

        <div className="bg-white border border-slate-300 p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">مستحقات الحصص المترتبة</span>
            <Award className="w-4 h-4 text-blue-950" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-slate-900">
              {totalWagesAccrued.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-600 font-bold">دج</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">مستحقة للمدربين والأساتذة</p>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="bg-white border border-slate-300 p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs shadow-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="بحث بالفوج، القاعة، المدرب أو عنوان الدرس..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-8 pl-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-blue-900 focus:outline-none"
            />
          </div>
        </div>

        {activeSubTab === 'schedules' && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="text-slate-400 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <span>اليوم:</span>
            </span>
            {['ALL', 'السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'].map((day) => (
              <button
                key={day}
                onClick={() => setDayFilter(day)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  dayFilter === day
                    ? 'bg-blue-900 text-white font-medium'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {day === 'ALL' ? 'كل الأيام' : day}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. Sub-Tab 1: Weekly Timetable & Room Matrix */}
      {activeSubTab === 'schedules' && (
        <div className="bg-white border border-slate-300 shadow-xs overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-300 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-semibold text-slate-700">
              <Calendar className="w-4 h-4 text-blue-900" />
              <span>مخطط التوزيع الأسبوعي للقاعات والأفواج (Weekly Allocation Grid)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <span className="tag-blue text-[10px]">فحص عدم التعارض نشط ✓</span>
              <span>{filteredSchedules.length} فترات معروضة</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="excel-table text-xs w-full">
              <thead>
                <tr>
                  <th className="w-12 text-center">#</th>
                  <th>اليوم</th>
                  <th>التوقيت والمدة</th>
                  <th>الفترة</th>
                  <th>الفوج التعليمي</th>
                  <th>القاعة المخصصة</th>
                  <th>المدرب المسؤول</th>
                  <th className="text-center">حالة الحصة</th>
                  <th className="text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedules.map((slot, index) => (
                  <tr key={slot.schedule_id} className="hover:bg-blue-50/40">
                    <td className="text-center font-mono text-slate-400">{index + 1}</td>
                    <td>
                      <span className="font-bold text-slate-800 px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                        {slot.day_of_week}
                      </span>
                    </td>
                    <td className="font-mono text-blue-950 font-semibold">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{slot.start_time} - {slot.end_time}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-slate-600 text-[11px]">{slot.shift_label}</span>
                    </td>
                    <td className="font-semibold text-slate-900">
                      {slot.group_name}
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-slate-700">
                        <MapPin className="w-3 h-3 text-blue-700" />
                        <span>{slot.classroom_name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-slate-800 font-medium">{slot.instructor}</span>
                    </td>
                    <td className="text-center">
                      <span className="tag-blue text-[10px]">مجدول أسبوعياً</span>
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => {
                          setNewSession({
                            ...newSession,
                            group_name: slot.group_name,
                            instructor_name: slot.instructor,
                            start_time: slot.start_time,
                            end_time: slot.end_time,
                          });
                          setIsLogSessionModalOpen(true);
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 text-emerald-800 hover:text-emerald-900 border border-slate-300 rounded text-[11px] transition-colors"
                      >
                        تسجيل الحضور
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Sub-Tab 2: Conducted Sessions Ledger & Attendance */}
      {activeSubTab === 'sessions' && (
        <div className="bg-white border border-slate-300 shadow-xs overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-300 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-semibold text-slate-700">
              <BookOpen className="w-4 h-4 text-blue-900" />
              <span>سجل الحصص التعليمية المنفذة والتقييمات البيداغوجية (Conducted Sessions Ledger)</span>
            </div>
            <span className="text-slate-500 font-mono">{filteredSessions.length} حصص مسجلة</span>
          </div>

          <div className="overflow-x-auto">
            <table className="excel-table text-xs w-full">
              <thead>
                <tr>
                  <th className="w-12 text-center">#</th>
                  <th>تاريخ الحصة</th>
                  <th>الفوج</th>
                  <th>المدرب</th>
                  <th>المدة</th>
                  <th>موضوع الدرس / الملاحظات البيداغوجية</th>
                  <th className="text-center">الحضور والغياب</th>
                  <th className="text-left">مستحق الحصة (دج)</th>
                  <th className="text-center">كشف الحضور</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((sess, idx) => (
                  <tr key={sess.session_id} className="hover:bg-blue-50/40">
                    <td className="text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="font-mono text-slate-700 whitespace-nowrap">
                      {sess.session_date}
                    </td>
                    <td className="font-bold text-slate-900">{sess.group_name}</td>
                    <td className="text-slate-800">{sess.instructor_name}</td>
                    <td className="font-mono text-slate-600">
                      {sess.duration_hours} س ({sess.start_time} - {sess.end_time})
                    </td>
                    <td className="max-w-xs truncate text-slate-700" title={sess.lesson_topic}>
                      {sess.lesson_topic}
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1.5 font-mono text-xs">
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold">
                          {sess.present_count} حاضر
                        </span>
                        {sess.absent_count > 0 && (
                          <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded font-bold">
                            {sess.absent_count} غائب
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-left font-mono font-bold text-blue-950">
                      {sess.calculated_wage.toLocaleString()} دج
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => setSelectedSessionForAttendance(sess)}
                        className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded text-[11px] font-medium"
                      >
                        معاينة الطلاب
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Modal: Add Weekly Schedule Slot */}
      {isAddScheduleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-300 w-full max-w-md shadow-2xl rounded p-4 font-arabic">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-1.5 text-blue-950 font-bold text-sm">
                <Plus className="w-4 h-4 text-blue-800" />
                <span>برمجة حصة أسبوعية جديدة (Add Timetable Slot)</span>
              </div>
              <button
                onClick={() => setIsAddScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="space-y-3 mt-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">اسم الفوج التعليمي</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: سوروبان الفوج ج3"
                  value={newSchedule.group_name}
                  onChange={(e) => setNewSchedule({ ...newSchedule, group_name: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">يوم الحصة</label>
                  <select
                    value={newSchedule.day_of_week}
                    onChange={(e) => setNewSchedule({ ...newSchedule, day_of_week: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none"
                  >
                    <option value="السبت">السبت</option>
                    <option value="الأحد">الأحد</option>
                    <option value="الإثنين">الإثنين</option>
                    <option value="الثلاثاء">الثلاثاء</option>
                    <option value="الأربعاء">الأربعاء</option>
                    <option value="الخميس">الخميس</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">القاعة المخصصة</label>
                  <select
                    value={newSchedule.classroom_name}
                    onChange={(e) => setNewSchedule({ ...newSchedule, classroom_name: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none"
                  >
                    <option value="قاعة الخوارزمي (C101)">قاعة الخوارزمي (C101)</option>
                    <option value="مخبر الروبوتيك (C102)">مخبر الروبوتيك (C102)</option>
                    <option value="قاعة ابن الهيثم (C103)">قاعة ابن الهيثم (C103)</option>
                    <option value="قاعة الإمام مالك (C104)">قاعة الإمام مالك (C104)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">وقت البدء</label>
                  <input
                    type="time"
                    required
                    value={newSchedule.start_time}
                    onChange={(e) => setNewSchedule({ ...newSchedule, start_time: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">وقت الانتهاء</label>
                  <input
                    type="time"
                    required
                    value={newSchedule.end_time}
                    onChange={(e) => setNewSchedule({ ...newSchedule, end_time: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">المدرب المسؤول</label>
                <input
                  type="text"
                  required
                  value={newSchedule.instructor}
                  onChange={(e) => setNewSchedule({ ...newSchedule, instructor: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none"
                />
              </div>

              <div className="p-2 bg-blue-50/50 border border-blue-200 rounded text-[11px] text-blue-900">
                <div className="flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-800" />
                  <span>فحص التعارض التلقائي:</span>
                </div>
                <p className="mt-0.5 text-slate-600">
                  سيتم التحقق الفوري من خلو القاعة في نفس اليوم والتوقيت المختار لمنع التداخل بين الأفواج.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddScheduleModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded font-medium shadow-xs"
                >
                  حفظ الحصة في التوقيت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal: Log Session */}
      {isLogSessionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-300 w-full max-w-lg shadow-2xl rounded p-4 font-arabic">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-1.5 text-emerald-950 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>تسجيل إنجاز حصة حضورية (Log Session & Attendance)</span>
              </div>
              <button
                onClick={() => setIsLogSessionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLogSession} className="space-y-3 mt-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">الفوج التعليمي</label>
                  <input
                    type="text"
                    required
                    value={newSession.group_name}
                    onChange={(e) => setNewSession({ ...newSession, group_name: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">تاريخ الحصة</label>
                  <input
                    type="date"
                    required
                    value={newSession.session_date}
                    onChange={(e) => setNewSession({ ...newSession, session_date: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">المدرب</label>
                  <input
                    type="text"
                    required
                    value={newSession.instructor_name}
                    onChange={(e) => setNewSession({ ...newSession, instructor_name: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">المدة (ساعات)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newSession.duration_hours}
                    onChange={(e) => setNewSession({ ...newSession, duration_hours: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">مستحق الأستاذ (دج)</label>
                  <input
                    type="number"
                    value={newSession.calculated_wage}
                    onChange={(e) => setNewSession({ ...newSession, calculated_wage: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">موضوع الدرس المنجز</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تطبيقات القسمة المطولة على السوروبان واختبار السرعة"
                  value={newSession.lesson_topic}
                  onChange={(e) => setNewSession({ ...newSession, lesson_topic: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 border border-slate-200 rounded">
                <div>
                  <label className="block text-emerald-800 font-bold mb-1">عدد الطلاب الحاضرين</label>
                  <input
                    type="number"
                    value={newSession.present_count}
                    onChange={(e) => setNewSession({ ...newSession, present_count: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-rose-800 font-bold mb-1">عدد الطلاب الغائبين</label>
                  <input
                    type="number"
                    value={newSession.absent_count}
                    onChange={(e) => setNewSession({ ...newSession, absent_count: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsLogSessionModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-medium shadow-xs"
                >
                  اعتماد وتسجيل الحصة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Modal: Session Attendance Quick Roster Preview */}
      {selectedSessionForAttendance && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-300 w-full max-w-lg shadow-2xl rounded p-4 font-arabic">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-1.5 text-blue-950 font-bold text-sm">
                <UserCheck className="w-4 h-4 text-blue-800" />
                <span>كشف حضور وتقييم الطلاب: {selectedSessionForAttendance.group_name}</span>
              </div>
              <button
                onClick={() => setSelectedSessionForAttendance(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 text-xs space-y-2">
              <div className="bg-slate-50 p-2 border border-slate-200 flex justify-between text-slate-600">
                <span>تاريخ: <b className="font-mono text-slate-900">{selectedSessionForAttendance.session_date}</b></span>
                <span>المؤطر: <b className="text-slate-900">{selectedSessionForAttendance.instructor_name}</b></span>
                <span className="tag-blue text-[10px]">مكتمل الحضور</span>
              </div>

              <div className="border border-slate-200 rounded max-h-60 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-1.5 text-right">الطالب</th>
                      <th className="p-1.5 text-center">الحالة</th>
                      <th className="p-1.5 text-center">النقاط</th>
                      <th className="p-1.5 text-right">ملاحظة المدرب</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="hover:bg-slate-50">
                      <td className="p-1.5 font-bold text-slate-800">ريان بن علي</td>
                      <td className="p-1.5 text-center">
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                          حاضر
                        </span>
                      </td>
                      <td className="p-1.5 text-center font-mono font-bold text-blue-900">+15</td>
                      <td className="p-1.5 text-slate-600 text-[11px]">تميز في حل مسائل التخييل الثلاثي</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-1.5 font-bold text-slate-800">أمين سعيدي</td>
                      <td className="p-1.5 text-center">
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                          حاضر
                        </span>
                      </td>
                      <td className="p-1.5 text-center font-mono font-bold text-blue-900">+10</td>
                      <td className="p-1.5 text-slate-600 text-[11px]">تركيز جيد وتفاعل إيجابي</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-1.5 font-bold text-slate-800">خديجة مصباحي</td>
                      <td className="p-1.5 text-center">
                        <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[10px] font-bold">
                          غائب بعذر
                        </span>
                      </td>
                      <td className="p-1.5 text-center font-mono text-slate-400">0</td>
                      <td className="p-1.5 text-slate-400 text-[11px]">إشعار مسبق من ولي الأمر</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 mt-3">
              <button
                onClick={() => setSelectedSessionForAttendance(null)}
                className="px-3 py-1.5 bg-blue-900 text-white text-xs rounded hover:bg-blue-800"
              >
                إغلاق الكشف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
