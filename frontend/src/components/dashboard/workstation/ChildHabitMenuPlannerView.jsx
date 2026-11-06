import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Heart,
  AlertCircle,
  Search,
  Calendar,
  Save,
  Printer,
  Edit2,
  CheckCircle,
  Apple,
  Coffee,
  ShieldAlert,
  User,
} from 'lucide-react';
import {
  MOCK_KG_STUDENTS,
  MOCK_WEEKLY_CAFETERIA_MENU,
} from '../../../mock/geniusKindergartenFinanceMockData';

export function ChildHabitMenuPlannerView() {
  const [activeTab, setActiveTab] = useState('HABITS'); // 'HABITS' or 'MENU'
  const [students, setStudents] = useState(MOCK_KG_STUDENTS);
  const [selectedStudent, setSelectedStudent] = useState(MOCK_KG_STUDENTS[0]);
  const [weeklyMenu, setWeeklyMenu] = useState(MOCK_WEEKLY_CAFETERIA_MENU);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingHabits, setIsEditingHabits] = useState(false);
  const [habitForm, setHabitForm] = useState(MOCK_KG_STUDENTS[0]);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSelectStudent = (stu) => {
    setSelectedStudent(stu);
    setHabitForm(stu);
    setIsEditingHabits(false);
  };

  const handleSaveHabits = (e) => {
    e.preventDefault();
    setStudents((prev) =>
      prev.map((s) => (s.id === habitForm.id ? { ...habitForm } : s))
    );
    setSelectedStudent(habitForm);
    setIsEditingHabits(false);
    triggerToast(`تم تحديث بروفايل العادات والرعاية الصحية للطفل: ${habitForm.fullNameAr}`);
  };

  const filteredStudents = students.filter(
    (s) =>
      s.fullNameAr.includes(searchQuery) ||
      s.bookNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.allergies.includes(searchQuery)
  );

  return (
    <div className="space-y-3 font-arabic text-slate-800">
      {/* 1. Header */}
      <div className="bg-white border border-slate-200 p-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 leading-none">
                  بروفايل عادات الأطفال وجدول المطعم الأسبوعي (Child Habit & Cafeteria Planner)
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 font-bold">
                  تغذية صحية ورقابة حساسية
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                متابعة عادات النوم، الحساسيات الغذائية، التهدئة لكل طفل بالتكامل مع قائمة الوجبات الأسبوعية الدورية بالمطعم.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-0.5 border border-slate-200">
              <button
                onClick={() => setActiveTab('HABITS')}
                className={`px-3 py-1 text-xs font-bold transition-colors ${
                  activeTab === 'HABITS'
                    ? 'bg-blue-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                بروفايل عادات ورعاية الأطفال
              </button>
              <button
                onClick={() => setActiveTab('MENU')}
                className={`px-3 py-1 text-xs font-bold transition-colors ${
                  activeTab === 'MENU'
                    ? 'bg-blue-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                جدول وجبات المطعم الأسبوعي
              </button>
            </div>
            <button
              onClick={() => window.print()}
              className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>طباعة</span>
            </button>
          </div>
        </div>

        {/* 4 Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2 bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 block">بروفايلات الأطفال المكتملة</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-slate-900">{students.length}</span>
              <span className="text-[10px] text-emerald-700 font-bold">100% مسجل</span>
            </div>
          </div>
          <div className="p-2 bg-rose-50/50 border border-rose-200">
            <span className="text-[10px] font-bold text-rose-800 block">تنبيهات حساسية غذائية</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-rose-900">
                {students.filter((s) => s.allergies && !s.allergies.includes('لا توجد')).length}
              </span>
              <span className="text-[10px] text-rose-700 font-bold">إشعار للمطبخ</span>
            </div>
          </div>
          <div className="p-2 bg-amber-50/50 border border-amber-200">
            <span className="text-[10px] font-bold text-amber-800 block">نظام وجبات المطعم</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-amber-900">3 وجبات</span>
              <span className="text-[10px] text-amber-700">فطور، غداء، لمجة</span>
            </div>
          </div>
          <div className="p-2 bg-blue-50/50 border border-blue-200">
            <span className="text-[10px] font-bold text-blue-800 block">دورة المطعم</span>
            <div className="mt-1 text-[11px] font-bold text-slate-800">
              أسبوعية دورية (الأحد - الخميس)
            </div>
          </div>
        </div>
      </div>

      {/* 2. TAB: HABITS PROFILE */}
      {activeTab === 'HABITS' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Children List (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-slate-200 shadow-2xs flex flex-col">
            <div className="p-2 border-b border-slate-200 bg-slate-50">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute start-2 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث بالأطفال أو نوع الحساسية..."
                  className="w-full ps-7 pe-2 py-0.5 text-xs border border-slate-200 bg-white"
                />
              </div>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[500px]">
              {filteredStudents.map((child) => {
                const isSelected = selectedStudent.id === child.id;
                const hasAllergy = child.allergies && !child.allergies.includes('لا توجد');
                return (
                  <div
                    key={child.id}
                    onClick={() => handleSelectStudent(child)}
                    className={`p-2.5 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/70 border-s-4 border-blue-900' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900">{child.fullNameAr}</span>
                      <span className="text-[10px] font-mono text-slate-500">{child.bookNumber}</span>
                    </div>
                    {hasAllergy ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-1 py-0.2 border border-rose-200">
                        <AlertCircle className="w-3 h-3 text-rose-600" />
                        حساسية: {child.allergies}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">لا توجد حساسيات مسجلة</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Habit Details Dossier (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-slate-200 shadow-2xs p-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3">
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">
                  ملف الرعاية: {selectedStudent.id} • {selectedStudent.bookNumber}
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedStudent.fullNameAr}
                </h3>
              </div>
              <button
                onClick={() => setIsEditingHabits(!isEditingHabits)}
                className="px-2.5 py-1 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" />
                <span>{isEditingHabits ? 'إلغاء التعديل' : 'تعديل البيانات'}</span>
              </button>
            </div>

            {isEditingHabits ? (
              <form onSubmit={handleSaveHabits} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-rose-800 mb-1">
                    الحساسيات الغذائية والأطعمة الممنوعة (Allergies) *
                  </label>
                  <input
                    type="text"
                    value={habitForm.allergies}
                    onChange={(e) => setHabitForm({ ...habitForm, allergies: e.target.value })}
                    className="w-full p-1.5 border border-rose-300 font-arabic bg-rose-50/30 focus:border-rose-700"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    عادات النوم والقيلولة (Sleep Routine) *
                  </label>
                  <textarea
                    rows={2}
                    value={habitForm.sleepHabits}
                    onChange={(e) => setHabitForm({ ...habitForm, sleepHabits: e.target.value })}
                    className="w-full p-1.5 border border-slate-300 font-arabic"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ملاحظات الملابس والنظافة والراحة (Clothing & Comfort) *
                  </label>
                  <textarea
                    rows={2}
                    value={habitForm.clothingNotes}
                    onChange={(e) => setHabitForm({ ...habitForm, clothingNotes: e.target.value })}
                    className="w-full p-1.5 border border-slate-300 font-arabic"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    المزاج، التهدئة، ومحفزات البكاء (Temperament & Soothing) *
                  </label>
                  <textarea
                    rows={2}
                    value={habitForm.temperament}
                    onChange={(e) => setHabitForm({ ...habitForm, temperament: e.target.value })}
                    className="w-full p-1.5 border border-slate-300 font-arabic"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    السوابق المرضية والاحتياطات الطبية (Medical Alerts) *
                  </label>
                  <input
                    type="text"
                    value={habitForm.medicalAlert}
                    onChange={(e) => setHabitForm({ ...habitForm, medicalAlert: e.target.value })}
                    className="w-full p-1.5 border border-slate-300 font-arabic"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditingHabits(false)}
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 font-semibold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-900 text-white font-bold"
                  >
                    حفظ التحديثات
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 text-xs">
                {/* Allergy Box */}
                <div className="p-3 bg-rose-50 border border-rose-200">
                  <div className="flex items-center gap-1.5 font-bold text-rose-900 mb-1">
                    <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
                    <span>تنبيه الحساسية الغذائية والطبية:</span>
                  </div>
                  <p className="text-rose-950 font-semibold ps-5">{selectedStudent.allergies}</p>
                </div>

                {/* Sleep habits */}
                <div className="p-3 bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-1">
                    طريقة النوم والقيلولة المفضلة:
                  </span>
                  <p className="text-slate-700 ps-1">{selectedStudent.sleepHabits}</p>
                </div>

                {/* Clothing habits */}
                <div className="p-3 bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-1">
                    الملابس والنظافة الشخصية:
                  </span>
                  <p className="text-slate-700 ps-1">{selectedStudent.clothingNotes}</p>
                </div>

                {/* Temperament */}
                <div className="p-3 bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-1">
                    المزاج وأسلوب التهدئة في حالات البكاء:
                  </span>
                  <p className="text-slate-700 ps-1">{selectedStudent.temperament}</p>
                </div>

                {/* Emergency Contact */}
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-blue-50/30 border border-blue-200">
                  <div>
                    <span className="text-[10px] text-slate-500 block">جهة الاتصال في الطوارئ:</span>
                    <span className="font-bold text-blue-950">{selectedStudent.emergencyContact}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">السوابق المرضية:</span>
                    <span className="font-semibold text-slate-800">{selectedStudent.medicalAlert}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 3. TAB: WEEKLY CAFETERIA MENU */
        <div className="bg-white border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold select-none">
                  <th className="py-2.5 px-3 text-start border-e border-slate-200 w-24">اليوم</th>
                  <th className="py-2.5 px-3 text-start border-e border-slate-200 bg-amber-50/40 w-48">
                    فطور الصباح (08:30)
                  </th>
                  <th className="py-2.5 px-3 text-start border-e border-slate-200 min-w-[220px]">
                    الوجبة الرئيسية (الغداء 11:45)
                  </th>
                  <th className="py-2.5 px-3 text-start border-e border-slate-200 min-w-[160px]">
                    المقبلات / الحساء
                  </th>
                  <th className="py-2.5 px-3 text-start border-e border-slate-200 w-36">التحلية / الفاكهة</th>
                  <th className="py-2.5 px-3 text-start border-e border-slate-200 bg-amber-50/40 w-44">
                    اللمجة المسائية (15:30)
                  </th>
                  <th className="py-2.5 px-3 text-start w-48">تنبيه مسببات الحساسية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {weeklyMenu.map((item) => (
                  <tr key={item.dayId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 border-e border-slate-200 font-bold text-blue-950 bg-slate-50">
                      {item.dayNameAr}
                    </td>
                    <td className="py-3 px-3 border-e border-slate-200 bg-amber-50/20 text-slate-700 leading-relaxed">
                      {item.breakfast}
                    </td>
                    <td className="py-3 px-3 border-e border-slate-200 font-semibold text-slate-900 leading-relaxed">
                      {item.lunchMain}
                    </td>
                    <td className="py-3 px-3 border-e border-slate-200 text-slate-600 leading-relaxed">
                      {item.lunchSide}
                    </td>
                    <td className="py-3 px-3 border-e border-slate-200 text-emerald-800 font-semibold">
                      {item.lunchDessert}
                    </td>
                    <td className="py-3 px-3 border-e border-slate-200 bg-amber-50/20 text-slate-700 leading-relaxed">
                      {item.snack}
                    </td>
                    <td className="py-3 px-3 text-[11px] text-rose-800 font-semibold">
                      {item.allergens}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-12 end-4 z-50 bg-blue-950 text-white px-3.5 py-2 text-xs shadow-xl border border-blue-800 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
