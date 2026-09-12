import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Building,
  Users,
  CheckCircle,
  Plus,
  X,
  Layers,
} from 'lucide-react';
import { StandardViewLayout } from '../common/StandardViewLayout';
import { MOCK_CENTER_TIMETABLE } from '../../../mock/centerMockData';

export function CenterTimetableView() {
  const [slots, setSlots] = useState(MOCK_CENTER_TIMETABLE);
  const [selectedDay, setSelectedDay] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newSlot, setNewSlot] = useState({
    day: 'الجمعة',
    timeSlot: '08:30 - 10:30',
    room: 'قاعة القرآن الكريم',
    cohort: '',
    teacher: '',
    capacity: '15 / 15 طالب',
  });

  const daysList = ['الجمعة', 'السبت', 'الثلاثاء (مساءً)'];

  // 1. KPI Calculations (Section 3.2.10)
  const totalSlots = slots.length;
  const weekendSlots = slots.filter((s) => s.day.includes('الجمعة') || s.day.includes('السبت')).length;
  const uniqueRooms = new Set(slots.map((s) => s.room)).size;
  const uniqueTeachers = new Set(slots.map((s) => s.teacher)).size;

  const kpiCards = [
    {
      label: 'إجمالي القاعات المستغلة',
      value: `${uniqueRooms} قاعات`,
      icon: Building,
      subtext: 'القرآن، الروبوتيك، السوروبان، اللغات',
      change: '100% مشغولة',
      isPositive: true,
    },
    {
      label: 'الحصص الأسبوعية المجدولة',
      value: `${totalSlots} حصة/أسبوع`,
      icon: Calendar,
      subtext: 'موزعة حسب الأيام والتوقيت الدقيق',
      change: 'مجدولة',
      isPositive: true,
    },
    {
      label: 'حصص نهاية الأسبوع (الجمعة والسبت)',
      value: `${weekendSlots} حصة مكثفة`,
      icon: Clock,
      subtext: 'ذروة النشاط التربوي والتدريبي',
      change: 'ضغط إشغال مرتفع',
      isPositive: true,
    },
    {
      label: 'المدربون والأساتذة المبرمجون',
      value: `${uniqueTeachers} أساتذة`,
      icon: Users,
      subtext: 'طاقم مؤطر ومعتمد',
      change: 'موزع بالتوقيت',
      isPositive: true,
    },
  ];

  // 2. Filter
  const filteredSlots = useMemo(() => {
    return slots.filter((s) => {
      const matchDay = selectedDay === 'ALL' || s.day === selectedDay;
      const matchSearch =
        s.cohort.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.timeSlot.includes(searchTerm);
      return matchDay && matchSearch;
    });
  }, [slots, selectedDay, searchTerm]);

  // 3. Add Slot
  const handleSaveSlot = (e) => {
    e.preventDefault();
    if (!newSlot.cohort.trim() || !newSlot.teacher.trim()) return;

    const entry = {
      id: `tt-${Date.now()}`,
      day: newSlot.day,
      timeSlot: newSlot.timeSlot,
      room: newSlot.room,
      cohort: newSlot.cohort.trim(),
      teacher: newSlot.teacher.trim(),
      capacity: newSlot.capacity,
    };

    setSlots([...slots, entry]);
    setIsModalOpen(false);
  };

  return (
    <StandardViewLayout
      titleAr="جدول توقيت الأفواج والقاعات (Timetable Matrix)"
      titleEn="Interactive Academic Cohort & Facility Timetable Grid"
      description="الجدول الزمني الشبكي التفاعلي لإدارة الحصص التدريبية وحجوزات القاعات (خاصة عطلات الجمعة والسبت والفترات المسائية) وتفادي التضارب في مواعيد الأفواج والأساتذة."
      entityTag="الأنشطة التخصصية والنوادي"
      branchCode="CENTER"
      kpiCards={kpiCards}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="ابحث باسم الفوج، الأستاذ، القاعة أو التوقيت..."
      actionButtonLabel="+ برمجة حصة جديدة"
      onActionButtonClick={() => setIsModalOpen(true)}
      exportFileName="center_timetable_matrix"
      exportData={filteredSlots.map((s) => ({
        'اليوم': s.day,
        'التوقيت': s.timeSlot,
        'القاعة': s.room,
        'الفوج والبرنامج': s.cohort,
        'الأستاذ المشرف': s.teacher,
        'سعة الفوج': s.capacity,
      }))}
      filterSlot={
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSelectedDay('ALL')}
            className={`h-7 px-2.5 text-xs font-semibold border transition-colors ${
              selectedDay === 'ALL'
                ? 'bg-blue-900 text-white border-blue-900 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            كافة الأيام
          </button>
          {daysList.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`h-7 px-2.5 text-xs font-semibold border transition-colors ${
                selectedDay === d
                  ? 'bg-blue-900 text-white border-blue-900 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-start text-xs border-collapse">
          <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold select-none">
            <tr>
              <th className="p-2.5 text-center border-e border-slate-200 w-12">#</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[130px]">اليوم والفترة</th>
              <th className="p-2.5 text-center border-e border-slate-200 min-w-[130px]">التوقيت (من - إلى)</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[180px] bg-slate-50">القاعة المحددة</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[240px]">الفوج والنشاط التعليمي</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[160px]">الأستاذ / المدرب</th>
              <th className="p-2.5 text-center min-w-[130px]">سعة وإشغال الفوج</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {filteredSlots.map((s, index) => (
              <tr key={s.id} className="hover:bg-blue-50/40 transition-colors">
                <td className="p-2.5 text-center border-e border-slate-200 font-mono text-slate-400 font-bold">
                  {index + 1}
                </td>
                <td className="p-2.5 border-e border-slate-200 font-bold text-slate-900">
                  <span
                    className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold ${
                      s.day.includes('الجمعة')
                        ? 'bg-emerald-100 text-emerald-800'
                        : s.day.includes('السبت')
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {s.day}
                  </span>
                </td>
                <td className="p-2.5 text-center border-e border-slate-200 font-mono font-bold text-slate-800">
                  {s.timeSlot}
                </td>
                <td className="p-2.5 border-e border-slate-200 font-bold text-blue-950 bg-slate-50/50">
                  {s.room}
                </td>
                <td className="p-2.5 border-e border-slate-200 font-semibold text-slate-900">
                  {s.cohort}
                </td>
                <td className="p-2.5 border-e border-slate-200 font-medium text-slate-700">
                  {s.teacher}
                </td>
                <td className="p-2.5 text-center font-mono text-[11px] font-bold">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 rounded-[2px]">
                    {s.capacity}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">برمجة حصة تدريبية وقاعة</span>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">اليوم *</label>
                  <select
                    value={newSlot.day}
                    onChange={(e) => setNewSlot({ ...newSlot, day: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                  >
                    <option value="الجمعة">الجمعة</option>
                    <option value="السبت">السبت</option>
                    <option value="الثلاثاء (مساءً)">الثلاثاء (مساءً)</option>
                    <option value="الأربعاء (مساءً)">الأربعاء (مساءً)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الفترة الزمنية *</label>
                  <select
                    value={newSlot.timeSlot}
                    onChange={(e) => setNewSlot({ ...newSlot, timeSlot: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                  >
                    <option value="08:30 - 10:30">08:30 - 10:30</option>
                    <option value="10:30 - 12:30">10:30 - 12:30</option>
                    <option value="14:00 - 16:00">14:00 - 16:00</option>
                    <option value="16:30 - 18:30">16:30 - 18:30</option>
                    <option value="17:00 - 19:00">17:00 - 19:00</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">القاعة المحددة *</label>
                <select
                  value={newSlot.room}
                  onChange={(e) => setNewSlot({ ...newSlot, room: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                >
                  <option value="قاعة القرآن الكريم">قاعة القرآن الكريم</option>
                  <option value="قاعة الروبوتيك والذكاء الاصطناعي">قاعة الروبوتيك والذكاء الاصطناعي</option>
                  <option value="قاعة السوروبان 1">قاعة السوروبان 1</option>
                  <option value="قاعة اللغات (قاعة 2)">قاعة اللغات (قاعة 2)</option>
                  <option value="قاعة 3 (الدعم العلمي)">قاعة 3 (الدعم العلمي)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">اسم الفوج والنشاط *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: سوروبان فوج السبت صباحاً"
                  value={newSlot.cohort}
                  onChange={(e) => setNewSlot({ ...newSlot, cohort: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الأستاذ / المدرب *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أ. يوسف بن عيسى"
                    value={newSlot.teacher}
                    onChange={(e) => setNewSlot({ ...newSlot, teacher: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">سعة الفوج</label>
                  <input
                    type="text"
                    placeholder="15 / 15 طالب"
                    value={newSlot.capacity}
                    onChange={(e) => setNewSlot({ ...newSlot, capacity: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold"
                >
                  حفظ وبرمجة الحصة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </StandardViewLayout>
  );
}
