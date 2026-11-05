import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserCheck,
  Send,
  Users,
  Search,
  Filter,
  Printer,
  BellRing,
  ShieldAlert,
  Thermometer,
} from 'lucide-react';
import {
  MOCK_DAILY_ATTENDANCE,
  MOCK_KG_STUDENTS,
  MOCK_KG_AGE_BANDS,
  MOCK_KG_GROUPS,
} from '../../../mock/geniusKindergartenFinanceMockData';

export function DailyAttendanceRegisterView() {
  const [selectedDate, setSelectedDate] = useState('2026-11-05');
  const [selectedBand, setSelectedBand] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState(MOCK_DAILY_ATTENDANCE);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Toggle status for a student
  const handleSetStatus = (studentId, nextStatus) => {
    setAttendanceRecords((prev) =>
      prev.map((rec) => {
        if (rec.studentId === studentId) {
          const nowTime = new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit', hour12: false });
          return {
            ...rec,
            status: nextStatus,
            arrivalTime: nextStatus === 'PRESENT' || nextStatus === 'LATE' ? (rec.arrivalTime && rec.arrivalTime !== '--:--' ? rec.arrivalTime : nowTime) : '--:--',
          };
        }
        return rec;
      })
    );
  };

  // Update arrival time
  const handleTimeChange = (studentId, timeValue) => {
    setAttendanceRecords((prev) =>
      prev.map((rec) => (rec.studentId === studentId ? { ...rec, arrivalTime: timeValue } : rec))
    );
  };

  // Dispatch absence alert
  const handleDispatchAbsenceAlert = (studentId, studentName, guardianPhone) => {
    setAttendanceRecords((prev) =>
      prev.map((rec) => (rec.studentId === studentId ? { ...rec, alertSent: true } : rec))
    );
    triggerToast(`تم إرسال إشعار غياب فوري (SMS + WhatsApp) إلى ولي التلميذ: ${studentName} (${guardianPhone})`);
  };

  const combinedList = MOCK_KG_STUDENTS.map((stu) => {
    const record = attendanceRecords.find((r) => r.studentId === stu.id) || {
      studentId: stu.id,
      date: selectedDate,
      status: 'PRESENT',
      arrivalTime: '08:00',
      departureTime: '',
      accompaniedBy: 'الولي',
      tempCelsius: 36.6,
      notes: '',
      alertSent: false,
    };
    return { ...stu, ...record };
  }).filter((item) => {
    const matchesBand = selectedBand === 'ALL' || item.bandId === selectedBand;
    const matchesSearch =
      item.fullNameAr.includes(searchQuery) ||
      item.fullNameFr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.guardianPhone.includes(searchQuery);
    return matchesBand && matchesSearch;
  });

  const presentCount = combinedList.filter((r) => r.status === 'PRESENT').length;
  const absentCount = combinedList.filter((r) => r.status === 'ABSENT').length;
  const lateCount = combinedList.filter((r) => r.status === 'LATE').length;
  const excusedCount = combinedList.filter((r) => r.status === 'EXCUSED').length;
  const totalCount = combinedList.length;
  const attendanceRate = totalCount > 0 ? Math.round(((presentCount + lateCount) / totalCount) * 100) : 0;

  return (
    <div className="space-y-3 font-arabic text-slate-800">
      {/* 1. Header with Live Telemetry */}
      <div className="bg-white border border-slate-200 p-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 leading-none">
                  سجل الحضور والغياب اليومي (Daily Attendance Register)
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                  ربط فوري بطابور الإشعارات
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                تسجيل فوري لحضور الأطفال، توقيت الدخول، المرافق، وحرارة الجسم مع إرسال إشعارات الغياب الآلية للأولياء.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1">
              <Clock className="w-3.5 h-3.5 text-blue-800" />
              <label className="text-xs font-bold text-slate-700">تاريخ السجل:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-mono font-bold bg-white border border-slate-300 px-1 py-0.5"
              />
            </div>
            <button
              onClick={() => window.print()}
              className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>طباعة ورقة النداء</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <div className="p-2 bg-emerald-50/50 border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-800 block">الحاضرون (Present)</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-emerald-900">{presentCount}</span>
              <span className="text-[10px] text-emerald-700 font-mono font-bold">{attendanceRate}% نسبة الحضور</span>
            </div>
          </div>
          <div className="p-2 bg-amber-50/50 border border-amber-200">
            <span className="text-[10px] font-bold text-amber-800 block">المتأخرون (Late)</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-amber-900">{lateCount}</span>
              <span className="text-[10px] text-amber-700">بعد 08:30</span>
            </div>
          </div>
          <div className="p-2 bg-rose-50/50 border border-rose-200">
            <span className="text-[10px] font-bold text-rose-800 block">الغياب غير المبرر (Absent)</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-rose-900">{absentCount}</span>
              <span className="text-[10px] text-rose-700 font-bold">إشعار تلقائي</span>
            </div>
          </div>
          <div className="p-2 bg-blue-50/50 border border-blue-200">
            <span className="text-[10px] font-bold text-blue-800 block">غياب مبرر (Excused)</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-blue-900">{excusedCount}</span>
              <span className="text-[10px] text-blue-700">إشعار مسبق</span>
            </div>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-slate-600 block">إجمالي الأطفال المسجلين</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-slate-900">{totalCount}</span>
              <span className="text-[10px] text-slate-500 font-mono">طالب مقيد</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filter Ribbon */}
      <div className="bg-white border border-slate-200 p-2 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute start-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم أو هاتف الولي..."
              className="w-full ps-8 pe-2 py-1 text-xs border border-slate-200 rounded-none bg-slate-50/50"
            />
          </div>
          <select
            value={selectedBand}
            onChange={(e) => setSelectedBand(e.target.value)}
            className="text-xs p-1 border border-slate-200 bg-white font-arabic"
          >
            <option value="ALL">كافة الفئات العمرية</option>
            {MOCK_KG_AGE_BANDS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nameAr}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-600"></span> حاضر
          <span className="inline-block w-2 h-2 rounded-full bg-rose-600 ms-1"></span> غائب
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500 ms-1"></span> متأخر
          <span className="inline-block w-2 h-2 rounded-full bg-blue-600 ms-1"></span> مبرر
        </div>
      </div>

      {/* 3. Register Data Grid */}
      <div className="bg-white border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold select-none">
                <th className="py-2 px-2 text-center border-e border-slate-200 w-10">#</th>
                <th className="py-2 px-2.5 text-start border-e border-slate-200">الطفل</th>
                <th className="py-2 px-2 text-start border-e border-slate-200">الفوج</th>
                <th className="py-2 px-2.5 text-center border-e border-slate-200 w-44 bg-slate-50">
                  حالة الحضور السريعة
                </th>
                <th className="py-2 px-2 text-center border-e border-slate-200 w-24">توقيت الدخول</th>
                <th className="py-2 px-2 text-center border-e border-slate-200 w-20">الحرارة °C</th>
                <th className="py-2 px-2.5 text-start border-e border-slate-200">المرافق عند التسليم</th>
                <th className="py-2 px-2.5 text-start border-e border-slate-200">ملاحظة الحضور</th>
                <th className="py-2 px-2 text-center w-28">إشعار الولي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {combinedList.map((item, idx) => {
                const group = MOCK_KG_GROUPS.find((g) => g.id === item.groupId);
                const isAbsent = item.status === 'ABSENT';
                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isAbsent ? 'bg-rose-50/20' : item.status === 'LATE' ? 'bg-amber-50/20' : 'hover:bg-blue-50/30'
                    }`}
                  >
                    <td className="py-1.5 px-2 text-center font-mono text-slate-500 border-e border-slate-200">
                      {idx + 1}
                    </td>
                    <td className="py-1.5 px-2.5 border-e border-slate-200 font-semibold text-slate-900">
                      <div className="flex flex-col">
                        <span>{item.fullNameAr}</span>
                        <span className="text-[10px] font-mono text-slate-500 font-normal">{item.bookNumber}</span>
                      </div>
                    </td>
                    <td className="py-1.5 px-2 text-start border-e border-slate-200 text-[11px] text-slate-600">
                      {group?.nameAr || item.groupId}
                    </td>
                    <td className="py-1.5 px-2 border-e border-slate-200 bg-slate-50/40">
                      <div className="grid grid-cols-4 gap-1">
                        <button
                          type="button"
                          onClick={() => handleSetStatus(item.id, 'PRESENT')}
                          className={`py-1 text-[11px] font-bold border transition-colors ${
                            item.status === 'PRESENT'
                              ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'
                          }`}
                          title="حاضر"
                        >
                          حاضر
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetStatus(item.id, 'LATE')}
                          className={`py-1 text-[11px] font-bold border transition-colors ${
                            item.status === 'LATE'
                              ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50'
                          }`}
                          title="متأخر"
                        >
                          تأخر
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetStatus(item.id, 'ABSENT')}
                          className={`py-1 text-[11px] font-bold border transition-colors ${
                            item.status === 'ABSENT'
                              ? 'bg-rose-700 text-white border-rose-800 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-rose-50'
                          }`}
                          title="غائب بدون عذر"
                        >
                          غائب
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetStatus(item.id, 'EXCUSED')}
                          className={`py-1 text-[11px] font-bold border transition-colors ${
                            item.status === 'EXCUSED'
                              ? 'bg-blue-700 text-white border-blue-800 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50'
                          }`}
                          title="غياب مبرر"
                        >
                          مبرر
                        </button>
                      </div>
                    </td>
                    <td className="py-1.5 px-2 text-center border-e border-slate-200">
                      <input
                        type="text"
                        value={item.arrivalTime || ''}
                        onChange={(e) => handleTimeChange(item.id, e.target.value)}
                        disabled={item.status === 'ABSENT' || item.status === 'EXCUSED'}
                        className="w-16 text-center font-mono text-xs border border-slate-200 py-0.5 bg-white disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </td>
                    <td className="py-1.5 px-2 text-center font-mono border-e border-slate-200">
                      {item.tempCelsius ? (
                        <span
                          className={`px-1 py-0.5 font-bold ${
                            item.tempCelsius > 37.5 ? 'bg-rose-100 text-rose-800' : 'text-slate-700'
                          }`}
                        >
                          {item.tempCelsius}°
                        </span>
                      ) : (
                        <span className="text-slate-300">--</span>
                      )}
                    </td>
                    <td className="py-1.5 px-2.5 border-e border-slate-200 text-slate-700 text-[11px]">
                      {item.accompaniedBy || item.guardianName}
                    </td>
                    <td className="py-1.5 px-2.5 border-e border-slate-200 text-slate-500 text-[11px] truncate max-w-[140px]">
                      {item.notes || '-'}
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      {isAbsent ? (
                        item.alertSent ? (
                          <span className="text-[10px] font-mono text-emerald-700 font-bold flex items-center justify-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            تم التنبيه
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDispatchAbsenceAlert(item.id, item.fullNameAr, item.guardianPhone)}
                            className="px-2 py-0.5 text-[10px] font-bold bg-rose-700 hover:bg-rose-800 text-white flex items-center justify-center gap-1 w-full shadow-2xs"
                          >
                            <BellRing className="w-3 h-3" />
                            إشعار فوري
                          </button>
                        )
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">طبيعي</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-12 end-4 z-50 bg-blue-950 text-white px-3.5 py-2 text-xs shadow-xl border border-blue-800 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <BellRing className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
