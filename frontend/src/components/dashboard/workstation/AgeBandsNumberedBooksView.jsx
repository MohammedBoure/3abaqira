import React, { useState } from 'react';
import {
  Baby,
  BookOpen,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  AlertCircle,
  Hash,
  Users,
  ShieldCheck,
  Calendar,
  Layers,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react';
import { MOCK_KG_AGE_BANDS, MOCK_KG_GROUPS, MOCK_KG_STUDENTS } from '../../../mock/geniusKindergartenFinanceMockData';

export function AgeBandsNumberedBooksView() {
  const [selectedBandId, setSelectedBandId] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState(MOCK_KG_STUDENTS);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    studentId: '',
    bookNumber: '',
    assignedDate: new Date().toISOString().split('T')[0],
  });

  const filteredStudents = students.filter((stu) => {
    const matchesBand = selectedBandId === 'ALL' || stu.bandId === selectedBandId;
    const matchesSearch =
      stu.fullNameAr.includes(searchQuery) ||
      stu.fullNameFr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stu.bookNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stu.guardianPhone.includes(searchQuery);
    return matchesBand && matchesSearch;
  });

  const totalAssignedBooks = students.filter((s) => s.bookNumber && s.bookStatus === 'ASSIGNED').length;
  const totalBandsCapacity = MOCK_KG_AGE_BANDS.reduce((acc, b) => acc + b.capacity, 0);
  const totalEnrolled = MOCK_KG_AGE_BANDS.reduce((acc, b) => acc + b.enrolledCount, 0);

  const handleAssignBook = (e) => {
    e.preventDefault();
    if (!newAssignment.studentId || !newAssignment.bookNumber) {
      alert('يرجى اختيار التلميذ وإدخال رقم الدفتر الرقمي التسلسلي');
      return;
    }
    setStudents((prev) =>
      prev.map((s) =>
        s.id === newAssignment.studentId
          ? {
              ...s,
              bookNumber: newAssignment.bookNumber,
              bookStatus: 'ASSIGNED',
              assignedDate: newAssignment.assignedDate,
            }
          : s
      )
    );
    setIsAssignModalOpen(false);
    setNewAssignment({ studentId: '', bookNumber: '', assignedDate: new Date().toISOString().split('T')[0] });
  };

  return (
    <div className="space-y-3 font-arabic text-slate-800">
      {/* 1. Header & Summary Metric Strip */}
      <div className="bg-white border border-slate-200 p-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-700">
              <Baby className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 leading-none">
                  سجل الأفواج العمرية والدفاتر المرقمنة (Age Bands & Numbered Books)
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 font-bold">
                  دفاتر إلزامية مرقمة
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                توزيع الأطفال حسب الفئات العمرية الرسمية (Bébé, Petite, Moyenne, Grande) وربط كل طفل بدفتره الرقمي المخصص.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="px-2.5 py-1 text-xs font-bold bg-blue-900 hover:bg-blue-950 text-white flex items-center gap-1.5 border border-blue-950 shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إسناد دفتر لطفل</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-2 py-1 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>طباعة السجل</span>
            </button>
          </div>
        </div>

        {/* 4 Technical KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="p-2 bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 block">إجمالي المقاعد / الطاقة الاستيعابية</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-slate-900">{totalBandsCapacity}</span>
              <span className="text-[10px] text-slate-500 font-mono">طاقة كاملة</span>
            </div>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 block">إجمالي الأطفال المسجلين بالروضة</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-pink-900">{totalEnrolled}</span>
              <span className="text-[10px] text-emerald-700 font-bold font-mono">
                {Math.round((totalEnrolled / totalBandsCapacity) * 100)}% إشغال
              </span>
            </div>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 block">الدفاتر المرقمنة المسندة</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-blue-900">{totalAssignedBooks}</span>
              <span className="text-[10px] text-blue-700 font-mono">دفتر نشط</span>
            </div>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 block">عدد الأفواج / القاعات المجهزة</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-slate-900">{MOCK_KG_GROUPS.length}</span>
              <span className="text-[10px] text-slate-500">4 فئات عمرية</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Age Bands Ribbon (Cohort Selector) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {MOCK_KG_AGE_BANDS.map((band) => {
          const isSelected = selectedBandId === band.id;
          return (
            <div
              key={band.id}
              onClick={() => setSelectedBandId(isSelected ? 'ALL' : band.id)}
              className={`p-2.5 border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-blue-50/70 border-blue-600 shadow-2xs ring-1 ring-blue-600'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900">{band.nameAr}</span>
                <span className="text-[9px] font-mono px-1 py-0.5 bg-slate-100 text-slate-600 border border-slate-200">
                  {band.code}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 flex items-center justify-between mb-1.5">
                <span>{band.ageRange}</span>
                <span className="font-mono font-semibold text-slate-800">
                  {band.enrolledCount}/{band.capacity} طفل
                </span>
              </div>
              {/* Capacity Progress Bar */}
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-1.5">
                <div
                  className="bg-blue-800 h-full transition-all"
                  style={{ width: `${(band.enrolledCount / band.capacity) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>المربية: {band.leadNanny}</span>
                <span className="font-mono text-blue-900 font-bold">{band.bookSeries}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Search and Filter Bar */}
      <div className="bg-white border border-slate-200 p-2 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute start-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم، رقم الدفتر، هاتف الولي..."
              className="w-full ps-8 pe-2.5 py-1 text-xs border border-slate-200 rounded-none focus:outline-none focus:border-blue-700 font-arabic bg-slate-50/50"
            />
          </div>
          {selectedBandId !== 'ALL' && (
            <button
              onClick={() => setSelectedBandId('ALL')}
              className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
            >
              إلغاء تصفية الفئة
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-mono font-bold text-slate-800">{filteredStudents.length}</span> طفل مطابق
        </div>
      </div>

      {/* 4. High-Density Excel Table */}
      <div className="bg-white border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold select-none">
                <th className="py-2 px-2 text-center border-e border-slate-200 w-10">#</th>
                <th className="py-2 px-2.5 text-start border-e border-slate-200">الاسم واللقب (عربي/فرنسي)</th>
                <th className="py-2 px-2 text-center border-e border-slate-200">تاريخ الميلاد</th>
                <th className="py-2 px-2.5 text-start border-e border-slate-200">الفوج والقاعة</th>
                <th className="py-2 px-2.5 text-start border-e border-slate-200 bg-blue-50/40">
                  رقم الدفتر التسلسلي (Book No.)
                </th>
                <th className="py-2 px-2 text-center border-e border-slate-200">تاريخ الإسناد</th>
                <th className="py-2 px-2 text-center border-e border-slate-200">حالة الدفتر</th>
                <th className="py-2 px-2.5 text-start border-e border-slate-200">الولي ورقم الهاتف</th>
                <th className="py-2 px-2 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-slate-400 text-xs">
                    لا توجد بيانات مطابقة لمعايير البحث الحالية.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((child, idx) => {
                  const band = MOCK_KG_AGE_BANDS.find((b) => b.id === child.bandId);
                  const group = MOCK_KG_GROUPS.find((g) => g.id === child.groupId);
                  return (
                    <tr key={child.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-1.5 px-2 text-center font-mono text-slate-500 border-e border-slate-200">
                        {idx + 1}
                      </td>
                      <td className="py-1.5 px-2.5 border-e border-slate-200 font-semibold text-slate-900">
                        <div className="flex flex-col">
                          <span>{child.fullNameAr}</span>
                          <span className="text-[10px] font-mono text-slate-500 font-normal">
                            {child.fullNameFr}
                          </span>
                        </div>
                      </td>
                      <td className="py-1.5 px-2 text-center font-mono text-slate-600 border-e border-slate-200">
                        {child.dob}
                      </td>
                      <td className="py-1.5 px-2.5 border-e border-slate-200">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">{band?.nameAr}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {group?.nameAr} • {group?.roomNumber}
                          </span>
                        </div>
                      </td>
                      <td className="py-1.5 px-2.5 border-e border-slate-200 bg-blue-50/20 font-mono font-bold text-blue-900">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                          <span>{child.bookNumber}</span>
                        </div>
                      </td>
                      <td className="py-1.5 px-2 text-center font-mono text-slate-600 border-e border-slate-200">
                        {child.assignedDate}
                      </td>
                      <td className="py-1.5 px-2 text-center border-e border-slate-200">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          مستلم ومعتمد
                        </span>
                      </td>
                      <td className="py-1.5 px-2.5 border-e border-slate-200">
                        <div className="flex flex-col">
                          <span className="text-slate-800">{child.guardianName}</span>
                          <span className="text-[10px] font-mono text-slate-500">{child.guardianPhone}</span>
                        </div>
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <button
                          onClick={() => {
                            setNewAssignment({
                              studentId: child.id,
                              bookNumber: child.bookNumber,
                              assignedDate: child.assignedDate,
                            });
                            setIsAssignModalOpen(true);
                          }}
                          className="px-2 py-0.5 text-[11px] font-semibold text-blue-800 hover:bg-blue-50 border border-blue-200"
                        >
                          تعديل الدفتر
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Assign / Edit Book Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-3">
          <div className="bg-white border border-slate-300 shadow-xl w-full max-w-md p-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-900" />
                <h3 className="text-sm font-bold text-slate-900">إسناد وتخصيص دفتر رقمي مرقم</h3>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignBook} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اختيار الطفل / التلميذ *</label>
                <select
                  value={newAssignment.studentId}
                  onChange={(e) => setNewAssignment({ ...newAssignment, studentId: e.target.value })}
                  className="w-full p-1.5 border border-slate-300 font-arabic bg-white focus:border-blue-800"
                  required
                >
                  <option value="">-- اختر الطفل من القائمة --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullNameAr} ({s.fullNameFr}) - فوج: {s.groupId}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  الرقم التسلسلي للدفتر (حسب الفئة والمستوى) *
                </label>
                <input
                  type="text"
                  value={newAssignment.bookNumber}
                  onChange={(e) => setNewAssignment({ ...newAssignment, bookNumber: e.target.value })}
                  placeholder="مثال: BK-MOY-2025-0045"
                  className="w-full p-1.5 border border-slate-300 font-mono focus:border-blue-800"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  قاعدة البيانات تفرض رقماً تسلسلياً فريداً لكل كتاب ولا يقبل التكرار.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">تاريخ التسليم والإسناد *</label>
                <input
                  type="date"
                  value={newAssignment.assignedDate}
                  onChange={(e) => setNewAssignment({ ...newAssignment, assignedDate: e.target.value })}
                  className="w-full p-1.5 border border-slate-300 font-mono focus:border-blue-800"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-bold"
                >
                  حفظ وتأكيد الإسناد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
