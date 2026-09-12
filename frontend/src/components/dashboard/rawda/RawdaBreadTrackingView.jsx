import React, { useState, useMemo } from 'react';
import {
  Utensils,
  ShoppingBag,
  Coins,
  CheckCircle,
  Plus,
  Calendar,
  X,
} from 'lucide-react';
import { StandardViewLayout } from '../common/StandardViewLayout';
import { MOCK_RAWDA_BREAD_TRACKING } from '../../../mock/rawdaMockData';

export function RawdaBreadTrackingView() {
  const [logs, setLogs] = useState(MOCK_RAWDA_BREAD_TRACKING);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newBreadEntry, setNewBreadEntry] = useState({
    week: 1,
    day: 'الأحد',
    meal: 'كسكس تقليدي بالخضر والمرق',
    breadCount: 18,
    unitPrice: 15,
    notes: '',
  });

  // 1. KPI Calculations (Section 2.7)
  const weekLogs = useMemo(() => {
    return logs.filter((l) => l.week === Number(selectedWeek));
  }, [logs, selectedWeek]);

  const totalLoaves = weekLogs.reduce((acc, l) => acc + l.breadCount, 0);
  const totalCost = weekLogs.reduce((acc, l) => acc + l.totalAmount, 0);
  const avgLoavesPerDay = weekLogs.length > 0 ? (totalLoaves / weekLogs.length).toFixed(1) : 0;
  const daysRecorded = weekLogs.length;

  const kpiCards = [
    {
      label: 'إجمالي استهلاك الخبز بالأسبوع',
      value: `${totalLoaves} خبزة`,
      icon: Utensils,
      subtext: `الأسبوع ${selectedWeek} من الشهر الدراسي`,
      change: 'استهلاك منتظم',
      isPositive: true,
    },
    {
      label: 'تكلفة الخبز الأسبوعية الإجمالية',
      value: `${totalCost.toLocaleString()} دج`,
      icon: Coins,
      subtext: 'مفوترة بسعر 15 دج للخبزة',
      change: 'ضمن الموازنة',
      isPositive: true,
    },
    {
      label: 'متوسط الاستهلاك اليومي',
      value: `${avgLoavesPerDay} خبزة/يوم`,
      icon: ShoppingBag,
      subtext: `عبر ${daysRecorded} أيام وجبات دراسية`,
      change: 'معدل صحي',
      isPositive: true,
    },
    {
      label: 'مطابقة الوجبات المبرمجة',
      value: '100% مطابقة',
      icon: CheckCircle,
      subtext: 'كسكس، سباغيتي، بيري، عدس، معكرونة',
      change: 'برنامج غذائي متكامل',
      isPositive: true,
    },
  ];

  // 2. Add Bread Consumption Entry
  const handleSaveEntry = (e) => {
    e.preventDefault();
    const count = Number(newBreadEntry.breadCount) || 0;
    const price = Number(newBreadEntry.unitPrice) || 15;
    const total = count * price;

    const entry = {
      id: `brd-${Date.now()}`,
      week: Number(newBreadEntry.week),
      day: newBreadEntry.day,
      meal: newBreadEntry.meal,
      breadCount: count,
      unitPrice: price,
      totalAmount: total,
      notes: newBreadEntry.notes || 'استهلاك مسجل',
    };

    setLogs([...logs, entry]);
    setIsModalOpen(false);
  };

  return (
    <StandardViewLayout
      titleAr="المراقبة اليومية لاستهلاك الخبز"
      titleEn="Rawda Daily Bread Procurement & Dietary Tracking"
      description="تتبع يومي دقيق لكميات الخبز المستهلكة في وجبات الغداء للأفواج الـ 10 (الأحد إلى الخميس)، وربطها بنوع الوجبة المبرمجة واحتساب التكلفة الإجمالية وفوارق التوريد."
      entityTag="التموين وإطعام الروضة"
      branchCode="RAWDA"
      kpiCards={kpiCards}
      actionButtonLabel="+ تسجيل استهلاك يومي"
      onActionButtonClick={() => setIsModalOpen(true)}
      exportFileName={`rawda_bread_week_${selectedWeek}`}
      exportData={weekLogs.map((l) => ({
        'الأسبوع': `الأسبوع ${l.week}`,
        'اليوم': l.day,
        'الوجبة المبرمجة': l.meal,
        'عدد الخبز': l.breadCount,
        'سعر الوحدة': l.unitPrice,
        'المبلغ الإجمالي (دج)': l.totalAmount,
        'الملاحظات': l.notes,
      }))}
      filterSlot={
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-slate-500 ms-1">اختر الأسبوع:</span>
          {[1, 2, 3, 4, 5].map((w) => (
            <button
              key={w}
              onClick={() => setSelectedWeek(w)}
              className={`h-7 px-3 text-xs font-semibold border transition-colors ${
                selectedWeek === w
                  ? 'bg-blue-900 text-white border-blue-900 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              الأسبوع {w}
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
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[120px]">اليوم الدراسي</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[240px]">الوجبة المبرمجة</th>
              <th className="p-2.5 text-center border-e border-slate-200 min-w-[120px]">عدد الخبز (قطعة)</th>
              <th className="p-2.5 text-center border-e border-slate-200 min-w-[120px]">سعر الوحدة (دج)</th>
              <th className="p-2.5 text-end border-e border-slate-200 min-w-[140px]">المبلغ الإجمالي (العدد × السعر)</th>
              <th className="p-2.5 text-start min-w-[250px]">ملاحظات وفوارق التوريد</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {weekLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  لا توجد قيود استهلاك خبز مسجلة للأسبوع {selectedWeek}
                </td>
              </tr>
            ) : (
              weekLogs.map((l, index) => (
                <tr key={l.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="p-2.5 text-center border-e border-slate-200 font-mono text-slate-400 font-bold">
                    {index + 1}
                  </td>
                  <td className="p-2.5 border-e border-slate-200 font-bold text-slate-900">
                    {l.day}
                  </td>
                  <td className="p-2.5 border-e border-slate-200 font-semibold text-blue-950">
                    {l.meal}
                  </td>
                  <td className="p-2.5 text-center border-e border-slate-200 font-mono font-bold text-slate-900">
                    <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-[2px]">
                      {l.breadCount} خبزة
                    </span>
                  </td>
                  <td className="p-2.5 text-center border-e border-slate-200 font-mono text-slate-600">
                    {l.unitPrice} دج
                  </td>
                  <td className="p-2.5 text-end border-e border-slate-200 font-mono font-bold text-emerald-800 text-sm">
                    {l.totalAmount.toLocaleString()} دج
                  </td>
                  <td className="p-2.5 text-slate-600">
                    {l.notes}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 font-mono">
            <tr>
              <td colSpan={3} className="p-2.5 text-start font-sans text-xs border-e border-slate-200">
                مجموع الأسبوع {selectedWeek}
              </td>
              <td className="p-2.5 text-center border-e border-slate-200 font-bold text-amber-900">
                {totalLoaves} خبزة
              </td>
              <td className="p-2.5 text-center border-e border-slate-200 text-slate-400 font-sans text-[11px]">
                معدل 15 دج
              </td>
              <td className="p-2.5 text-end border-e border-slate-200 text-emerald-800 text-sm font-bold">
                {totalCost.toLocaleString()} دج
              </td>
              <td className="p-2.5 font-sans text-[11px] text-slate-500">
                {weekLogs.length} أيام غذائية موثقة
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">تسجيل استهلاك يومي للخبز</span>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الأسبوع *</label>
                  <select
                    value={newBreadEntry.week}
                    onChange={(e) => setNewBreadEntry({ ...newBreadEntry, week: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                  >
                    <option value="1">الأسبوع 1</option>
                    <option value="2">الأسبوع 2</option>
                    <option value="3">الأسبوع 3</option>
                    <option value="4">الأسبوع 4</option>
                    <option value="5">الأسبوع 5</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">اليوم الدراسي *</label>
                  <select
                    value={newBreadEntry.day}
                    onChange={(e) => setNewBreadEntry({ ...newBreadEntry, day: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                  >
                    <option value="الأحد">الأحد</option>
                    <option value="الإثنين">الإثنين</option>
                    <option value="الثلاثاء">الثلاثاء</option>
                    <option value="الأربعاء">الأربعاء</option>
                    <option value="الخميس">الخميس</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">الوجبة المبرمجة *</label>
                <select
                  value={newBreadEntry.meal}
                  onChange={(e) => setNewBreadEntry({ ...newBreadEntry, meal: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                >
                  <option value="كسكس تقليدي بالخضر والمرق">كسكس تقليدي بالخضر والمرق</option>
                  <option value="سباغيتي بصلصة الطماطم والجبن">سباغيتي بصلصة الطماطم والجبن</option>
                  <option value="بيري (بطاطا مهروسة) مع الدجاج">بيري (بطاطا مهروسة) مع الدجاج</option>
                  <option value="عدس بالخضار واللحم البقري">عدس بالخضار واللحم البقري</option>
                  <option value="معكرونة بالخضار وسلطة">معكرونة بالخضار وسلطة</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">عدد الخبز المستهلك *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newBreadEntry.breadCount}
                    onChange={(e) => setNewBreadEntry({ ...newBreadEntry, breadCount: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">سعر الخبزة (دج) *</label>
                  <select
                    value={newBreadEntry.unitPrice}
                    onChange={(e) => setNewBreadEntry({ ...newBreadEntry, unitPrice: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                  >
                    <option value="15">15 دج (خبز عادي)</option>
                    <option value="10">10 دج (خبز مدعم)</option>
                    <option value="20">20 دج (خبز كامل/شعير)</option>
                  </select>
                </div>
              </div>

              {/* Real-time total preview */}
              <div className="p-2 bg-blue-50 border border-blue-200 flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">المبلغ الإجمالي المحتسب تلقائياً:</span>
                <strong className="font-mono text-emerald-800 font-bold text-sm">
                  {((Number(newBreadEntry.breadCount) || 0) * (Number(newBreadEntry.unitPrice) || 15)).toLocaleString()} دج
                </strong>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ملاحظات التوريد والفائض</label>
                <input
                  type="text"
                  placeholder="أي ملاحظات حول التوريد أو استهلاك الأطفال..."
                  value={newBreadEntry.notes}
                  onChange={(e) => setNewBreadEntry({ ...newBreadEntry, notes: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                />
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
                  حفظ الاستهلاك
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </StandardViewLayout>
  );
}
