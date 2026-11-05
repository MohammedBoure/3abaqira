import React, { useState } from 'react';
import {
  FileText,
  Utensils,
  Moon,
  BookOpen,
  Smile,
  Frown,
  Shirt,
  Save,
  CheckCircle2,
  Printer,
  Search,
  Filter,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  MOCK_DAILY_CHILD_LOGS,
  MOCK_KG_STUDENTS,
  MOCK_KG_AGE_BANDS,
  MOCK_KG_GROUPS,
} from '../../../mock/geniusKindergartenFinanceMockData';

// Rating button component for fast A/B/C entry
function QuickRatingGroup({ value, onChange, fieldLabel }) {
  return (
    <div className="inline-flex rounded border border-slate-300 p-0.5 bg-slate-100 shadow-2xs">
      <button
        type="button"
        onClick={() => onChange('A')}
        className={`px-2 py-0.5 text-[11px] font-bold font-mono transition-all ${
          value === 'A'
            ? 'bg-emerald-700 text-white shadow-2xs scale-105'
            : 'text-slate-600 hover:bg-emerald-100 hover:text-emerald-900'
        }`}
        title={`${fieldLabel}: A (ممتاز / أكل كامل / نوم هادئ)`}
      >
        A
      </button>
      <button
        type="button"
        onClick={() => onChange('B')}
        className={`px-2 py-0.5 text-[11px] font-bold font-mono transition-all ${
          value === 'B'
            ? 'bg-amber-600 text-white shadow-2xs scale-105'
            : 'text-slate-600 hover:bg-amber-100 hover:text-amber-900'
        }`}
        title={`${fieldLabel}: B (متوسط / نصف الوجبة / نوم متقطع)`}
      >
        B
      </button>
      <button
        type="button"
        onClick={() => onChange('C')}
        className={`px-2 py-0.5 text-[11px] font-bold font-mono transition-all ${
          value === 'C'
            ? 'bg-rose-700 text-white shadow-2xs scale-105'
            : 'text-slate-600 hover:bg-rose-100 hover:text-rose-900'
        }`}
        title={`${fieldLabel}: C (ضعيف / رفض الطعام / بكاء مستمر)`}
      >
        C
      </button>
    </div>
  );
}

export function DailyChildLogSheetView() {
  const [selectedDate, setSelectedDate] = useState('2026-11-05');
  const [selectedBand, setSelectedBand] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [logs, setLogs] = useState(MOCK_DAILY_CHILD_LOGS);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleUpdateField = (studentId, field, nextVal) => {
    setLogs((prev) =>
      prev.map((l) => (l.studentId === studentId ? { ...l, [field]: nextVal } : l))
    );
  };

  const handleSaveAll = () => {
    triggerToast('تم حفظ تقارير المتابعة اليومية وإرسال التحديثات لمنظومة الأولياء بنجاح.');
  };

  // Combine students with logs
  const combinedData = MOCK_KG_STUDENTS.map((stu) => {
    const existingLog = logs.find((l) => l.studentId === stu.id) || {
      id: `LOG-${selectedDate}-${stu.id}`,
      studentId: stu.id,
      date: selectedDate,
      mealBreakfast: 'A',
      mealLunch: 'A',
      mealSnack: 'A',
      sleepQuality: 'A',
      studyActivity: 'A',
      socialInteraction: 'A',
      cryingLevel: 'A',
      clothesChange: 'A',
      staffNote: '',
      recordedBy: 'المربية المناوبة',
      recordedAt: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }),
    };
    return { ...stu, ...existingLog };
  }).filter((item) => {
    const matchesBand = selectedBand === 'ALL' || item.bandId === selectedBand;
    const matchesSearch =
      item.fullNameAr.includes(searchQuery) ||
      item.bookNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBand && matchesSearch;
  });

  const totalChildren = combinedData.length;
  const excellentCount = combinedData.filter(
    (c) => c.mealLunch === 'A' && c.studyActivity === 'A' && c.cryingLevel === 'A'
  ).length;
  const needingAttentionCount = combinedData.filter(
    (c) =>
      c.mealBreakfast === 'C' ||
      c.mealLunch === 'C' ||
      c.sleepQuality === 'C' ||
      c.cryingLevel === 'C'
  ).length;

  return (
    <div className="space-y-3 font-arabic text-slate-800">
      {/* 1. Header & Live Metric Bar */}
      <div className="bg-white border border-slate-200 p-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-700">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 leading-none">
                  ورقة التقييم والمتابعة اليومية للطفل (Daily Child Log Sheet)
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                  تقييم سريع A / B / C
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                رصد دقيق ومباشر لوجبات اليوم (فطور، غداء، لمجة)، النوم، التعلم، التفاعل، البكاء، وتبديل الملابس مع الملاحظات.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-mono font-bold bg-white border border-slate-300 px-2 py-1"
            />
            <button
              onClick={handleSaveAll}
              className="px-3 py-1 text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white flex items-center gap-1.5 border border-emerald-900 shadow-2xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>حفظ واعتماد اليومية</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>طباعة الورقة</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2 bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 block">إجمالي تقارير اليوم</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-slate-900">{totalChildren}</span>
              <span className="text-[10px] text-slate-500 font-mono">طالب مقيّد</span>
            </div>
          </div>
          <div className="p-2 bg-emerald-50/50 border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-800 block">أداء يومي ممتاز (كل العلامات A)</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-emerald-900">{excellentCount}</span>
              <span className="text-[10px] text-emerald-700 font-bold">
                {Math.round((excellentCount / (totalChildren || 1)) * 100)}% من الفوج
              </span>
            </div>
          </div>
          <div className="p-2 bg-rose-50/50 border border-rose-200">
            <span className="text-[10px] font-bold text-rose-800 block">حالات تتطلب متابعة (علامة C)</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-rose-900">{needingAttentionCount}</span>
              <span className="text-[10px] text-rose-700 font-bold">رفض طعام أو بكاء</span>
            </div>
          </div>
          <div className="p-2 bg-blue-50/50 border border-blue-200">
            <span className="text-[10px] font-bold text-blue-800 block">مفتاح التقييم المعتمد</span>
            <div className="flex items-center gap-2 mt-1 text-[11px] font-bold">
              <span className="text-emerald-700">A = ممتاز</span>
              <span className="text-amber-700">B = متوسط</span>
              <span className="text-rose-700">C = ضعيف</span>
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
              placeholder="تصفية بالاسم، رقم الدفتر..."
              className="w-full ps-8 pe-2.5 py-1 text-xs border border-slate-200 bg-slate-50/50"
            />
          </div>
          <select
            value={selectedBand}
            onChange={(e) => setSelectedBand(e.target.value)}
            className="text-xs p-1 border border-slate-200 bg-white font-arabic"
          >
            <option value="ALL">كافة الفئات والأفواج</option>
            {MOCK_KG_AGE_BANDS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nameAr}
              </option>
            ))}
          </select>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-blue-600" />
          <span>انقر مباشرة على الحرف لتغيير التقييم فورياً بنقرة واحدة</span>
        </div>
      </div>

      {/* 3. High-Density Excel-Like Data Table */}
      <div className="bg-white border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold select-none">
                <th className="py-2 px-2 text-center border-e border-slate-200 w-10">#</th>
                <th className="py-2 px-2.5 text-start border-e border-slate-200 w-44">الطفل والدفتر</th>
                <th className="py-2 px-2 text-center border-e border-slate-200 bg-amber-50/30">فطور الصباح</th>
                <th className="py-2 px-2 text-center border-e border-slate-200 bg-amber-50/30">الغداء</th>
                <th className="py-2 px-2 text-center border-e border-slate-200 bg-amber-50/30">اللمجة (Goûter)</th>
                <th className="py-2 px-2 text-center border-e border-slate-200 bg-indigo-50/30">النوم والقيلولة</th>
                <th className="py-2 px-2 text-center border-e border-slate-200 bg-blue-50/30">التعلم والدراسة</th>
                <th className="py-2 px-2 text-center border-e border-slate-200 bg-emerald-50/30">التفاعل الاجتماعي</th>
                <th className="py-2 px-2 text-center border-e border-slate-200 bg-rose-50/30">البكاء والمزاج</th>
                <th className="py-2 px-2 text-center border-e border-slate-200 bg-cyan-50/30">تبديل الملابس</th>
                <th className="py-2 px-2.5 text-start border-e border-slate-200 min-w-[200px]">
                  ملاحظة المربية الحرة (Free Note)
                </th>
                <th className="py-2 px-2 text-center w-24">المسؤول</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {combinedData.map((row, idx) => {
                const group = MOCK_KG_GROUPS.find((g) => g.id === row.groupId);
                const hasAlert =
                  row.mealBreakfast === 'C' ||
                  row.mealLunch === 'C' ||
                  row.sleepQuality === 'C' ||
                  row.cryingLevel === 'C';

                return (
                  <tr
                    key={row.id}
                    className={`transition-colors ${
                      hasAlert ? 'bg-rose-50/20' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-1.5 px-2 text-center font-mono text-slate-500 border-e border-slate-200">
                      {idx + 1}
                    </td>
                    <td className="py-1.5 px-2.5 border-e border-slate-200 font-semibold text-slate-900">
                      <div className="flex flex-col">
                        <span>{row.fullNameAr}</span>
                        <span className="text-[10px] font-mono text-slate-500 font-normal">
                          {group?.nameAr} • {row.bookNumber}
                        </span>
                      </div>
                    </td>

                    {/* Meal Breakfast */}
                    <td className="py-1.5 px-2 text-center border-e border-slate-200 bg-amber-50/10">
                      <QuickRatingGroup
                        value={row.mealBreakfast}
                        onChange={(val) => handleUpdateField(row.studentId, 'mealBreakfast', val)}
                        fieldLabel="فطور الصباح"
                      />
                    </td>

                    {/* Meal Lunch */}
                    <td className="py-1.5 px-2 text-center border-e border-slate-200 bg-amber-50/10">
                      <QuickRatingGroup
                        value={row.mealLunch}
                        onChange={(val) => handleUpdateField(row.studentId, 'mealLunch', val)}
                        fieldLabel="الغداء"
                      />
                    </td>

                    {/* Meal Snack */}
                    <td className="py-1.5 px-2 text-center border-e border-slate-200 bg-amber-50/10">
                      <QuickRatingGroup
                        value={row.mealSnack}
                        onChange={(val) => handleUpdateField(row.studentId, 'mealSnack', val)}
                        fieldLabel="اللمجة"
                      />
                    </td>

                    {/* Sleep */}
                    <td className="py-1.5 px-2 text-center border-e border-slate-200 bg-indigo-50/10">
                      <QuickRatingGroup
                        value={row.sleepQuality}
                        onChange={(val) => handleUpdateField(row.studentId, 'sleepQuality', val)}
                        fieldLabel="النوم"
                      />
                    </td>

                    {/* Study */}
                    <td className="py-1.5 px-2 text-center border-e border-slate-200 bg-blue-50/10">
                      <QuickRatingGroup
                        value={row.studyActivity}
                        onChange={(val) => handleUpdateField(row.studentId, 'studyActivity', val)}
                        fieldLabel="التعلم والدراسة"
                      />
                    </td>

                    {/* Interaction */}
                    <td className="py-1.5 px-2 text-center border-e border-slate-200 bg-emerald-50/10">
                      <QuickRatingGroup
                        value={row.socialInteraction}
                        onChange={(val) => handleUpdateField(row.studentId, 'socialInteraction', val)}
                        fieldLabel="التفاعل"
                      />
                    </td>

                    {/* Crying */}
                    <td className="py-1.5 px-2 text-center border-e border-slate-200 bg-rose-50/10">
                      <QuickRatingGroup
                        value={row.cryingLevel}
                        onChange={(val) => handleUpdateField(row.studentId, 'cryingLevel', val)}
                        fieldLabel="البكاء"
                      />
                    </td>

                    {/* Clothes change */}
                    <td className="py-1.5 px-2 text-center border-e border-slate-200 bg-cyan-50/10">
                      <QuickRatingGroup
                        value={row.clothesChange}
                        onChange={(val) => handleUpdateField(row.studentId, 'clothesChange', val)}
                        fieldLabel="تبديل الملابس"
                      />
                    </td>

                    {/* Free note */}
                    <td className="py-1.5 px-2.5 border-e border-slate-200">
                      <input
                        type="text"
                        value={row.staffNote || ''}
                        onChange={(e) => handleUpdateField(row.studentId, 'staffNote', e.target.value)}
                        placeholder="اكتب ملاحظة مختصرة للولي..."
                        className="w-full text-xs border border-slate-200 px-2 py-0.5 bg-white font-arabic focus:outline-none focus:border-blue-700"
                      />
                    </td>

                    {/* Recorded By */}
                    <td className="py-1.5 px-2 text-center text-[10px] text-slate-500 font-mono">
                      {row.recordedBy?.split(' ')[1] || 'المربية'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-12 end-4 z-50 bg-blue-950 text-white px-3.5 py-2 text-xs shadow-xl border border-blue-800 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
