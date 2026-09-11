import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRightLeft,
  CalendarRange,
  GraduationCap,
  Users,
  AlertCircle,
  FileSpreadsheet,
  Trash2,
  Edit3,
  Check,
  X,
  History,
} from 'lucide-react';
import { MOCK_ACADEMIC_YEARS } from '../../mock/mockData';

export function AcademicYearsView() {
  const [years, setYears] = useState(MOCK_ACADEMIC_YEARS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'ARCHIVED' | 'UPCOMING'
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedYearForEdit, setSelectedYearForEdit] = useState(null);
  const [confirmActiveModal, setConfirmActiveModal] = useState(null);

  // New Year Form State
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    is_current: false,
    descriptionAr: '',
  });

  const activeYear = years.find((y) => y.is_current) || years[0];

  // Filtered list
  const filteredYears = years.filter((y) => {
    const matchesSearch = y.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'ACTIVE'
        ? y.is_current
        : statusFilter === 'ARCHIVED'
        ? y.status === 'ARCHIVED'
        : y.status === 'UPCOMING';
    return matchesSearch && matchesStatus;
  });

  // Handle Set Current Atomically
  const handleSetCurrent = (yearId) => {
    setYears((prev) =>
      prev.map((y) => ({
        ...y,
        is_current: y.year_id === yearId,
        status: y.year_id === yearId ? 'ACTIVE' : y.status === 'ACTIVE' ? 'ARCHIVED' : y.status,
      }))
    );
    setConfirmActiveModal(null);
  };

  // Handle Create Year
  const handleCreateYear = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.start_date || !formData.end_date) return;

    const newYear = {
      year_id: Date.now(),
      name: formData.name,
      start_date: formData.start_date,
      end_date: formData.end_date,
      is_current: formData.is_current,
      status: formData.is_current ? 'ACTIVE' : 'UPCOMING',
      total_students: 0,
      active_cohorts: 0,
      collection_rate: '0.0%',
      descriptionAr: formData.descriptionAr || 'موسم جديد مضاف للنظام',
    };

    if (formData.is_current) {
      setYears((prev) =>
        prev.map((y) => ({
          ...y,
          is_current: false,
          status: y.is_current ? 'ARCHIVED' : y.status,
        }))
      );
    }

    setYears((prev) => [newYear, ...prev]);
    setIsCreateModalOpen(false);
    setFormData({ name: '', start_date: '', end_date: '', is_current: false, descriptionAr: '' });
  };

  return (
    <div className="space-y-3 font-arabic">
      {/* 1. Header & Quick Actions Toolbar */}
      <div className="bg-white border border-slate-300 p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="eyebrow flex items-center gap-1.5 text-blue-900">
            <CalendarRange className="w-3.5 h-3.5" />
            <span>FISCAL & ACADEMIC CYCLES / backend/apis/academic_years.py</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold font-serif text-slate-900 mt-0.5">
            إدارة المواسم والسنوات الأكاديمية (Academic Years)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            التحكم في النطاقات الزمنية للمواسم، تعيين الموسم النشط فورياً، ومتابعة سجلات الترحيل السنوي.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="button button-primary text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة موسم جديد</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-white border border-slate-300 p-3 border-s-4 border-s-blue-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="eyebrow">ACTIVE FISCAL YEAR</span>
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {activeYear.name}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            من {activeYear.start_date} إلى {activeYear.end_date}
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-3 border-s-4 border-s-slate-700 shadow-xs">
          <span className="eyebrow">REGISTERED CYCLES</span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {years.length} مواسم مسجلة
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {years.filter((y) => y.status === 'ARCHIVED').length} مؤرشف •{' '}
            {years.filter((y) => y.status === 'UPCOMING').length} قادم
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-3 border-s-4 border-s-emerald-700 shadow-xs">
          <span className="eyebrow">ENROLLED IN CURRENT</span>
          <div className="text-xl font-bold font-mono text-emerald-800 mt-1">
            {activeYear.total_students} طالباً
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            موزعين على {activeYear.active_cohorts} أفواج رئيسية
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-3 border-s-4 border-s-amber-600 shadow-xs">
          <span className="eyebrow">TUITION COLLECTION</span>
          <div className="text-xl font-bold font-mono text-amber-800 mt-1">
            {activeYear.collection_rate}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            نسبة الوفاء بالأقساط للموسم الحالي
          </div>
        </div>
      </div>

      {/* 3. Active Season High-Profile Card */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-4 border border-blue-950 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-slate-950">
                الموسم الحالي الفعّال (CURRENT)
              </span>
              <span className="text-xs text-blue-200 font-mono">
                API: /academic-years/current
              </span>
            </div>
            <h3 className="text-lg font-bold font-serif">
              الموسم الأكاديمي والمالي: {activeYear.name}
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              {activeYear.descriptionAr}. ترتبط به كافة قيود الصندوق، اشتراكات الطلاب، جداول المعلمين، وموازين المراجعة الشهرية.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 bg-white/10 p-3 border border-white/15 backdrop-blur-xs">
            <div className="text-center px-3 border-e border-white/20">
              <span className="text-[10px] text-blue-200 block uppercase">تاريخ البدء</span>
              <span className="font-mono text-xs font-bold">{activeYear.start_date}</span>
            </div>
            <div className="text-center px-3 border-e border-white/20">
              <span className="text-[10px] text-blue-200 block uppercase">تاريخ الانتهاء</span>
              <span className="font-mono text-xs font-bold">{activeYear.end_date}</span>
            </div>
            <div className="text-center px-3">
              <span className="text-[10px] text-blue-200 block uppercase">المسجلين</span>
              <span className="font-mono text-xs font-bold text-emerald-300">{activeYear.total_students}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Academic Cycles Data Table */}
      <div className="bg-white border border-slate-300 shadow-xs">
        {/* Table Filter Bar */}
        <div className="p-2.5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث في مسمى الموسم (مثال: 2025)..."
              className="w-full h-7 px-2.5 text-xs border border-slate-300 bg-white focus:outline-none focus:border-blue-900"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 font-semibold me-1">الحالة:</span>
            {['ALL', 'ACTIVE', 'ARCHIVED', 'UPCOMING'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-0.5 text-[10px] font-semibold border ${
                  statusFilter === st
                    ? 'bg-blue-900 text-white border-blue-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {st === 'ALL'
                  ? 'الكل'
                  : st === 'ACTIVE'
                  ? 'النشط حالياً'
                  : st === 'ARCHIVED'
                  ? 'المؤرشف'
                  : 'القادم'}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="excel-table text-xs">
            <thead>
              <tr>
                <th className="excel-th p-2 text-center w-12">#</th>
                <th className="excel-th p-2 text-start">مسمى الموسم الدراسي</th>
                <th className="excel-th p-2 text-center">تاريخ الانطلاق (Start Date)</th>
                <th className="excel-th p-2 text-center">تاريخ الختام (End Date)</th>
                <th className="excel-th p-2 text-center">حالة الموسم (Status)</th>
                <th className="excel-th p-2 text-center">الطلاب المسجلين</th>
                <th className="excel-th p-2 text-center">الأفواج والمسارات</th>
                <th className="excel-th p-2 text-center">نسبة التحصيل</th>
                <th className="excel-th p-2 text-start">ملاحظات تشغيلية</th>
                <th className="excel-th p-2 text-center w-36">التحكم والعمليات</th>
              </tr>
            </thead>
            <tbody>
              {filteredYears.map((year, idx) => (
                <tr
                  key={year.year_id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    year.is_current ? 'bg-blue-50/40 font-medium' : ''
                  }`}
                >
                  <td className="excel-td p-2 text-center font-mono text-slate-500">
                    {idx + 1}
                  </td>
                  <td className="excel-td p-2 font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-blue-900" />
                    <span>{year.name}</span>
                    {year.is_current && (
                      <span className="tag tag-blue text-[9px] py-0 px-1">الحالي</span>
                    )}
                  </td>
                  <td className="excel-td p-2 text-center font-mono text-slate-700">
                    {year.start_date}
                  </td>
                  <td className="excel-td p-2 text-center font-mono text-slate-700">
                    {year.end_date}
                  </td>
                  <td className="excel-td p-2 text-center">
                    {year.is_current ? (
                      <span className="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-100/70 px-2 py-0.5 text-[10px] border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>نشط حالياً</span>
                      </span>
                    ) : year.status === 'ARCHIVED' ? (
                      <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 text-[10px] border border-slate-300">
                        <History className="w-3 h-3 text-slate-400" />
                        <span>مؤرشف ومغلق</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-blue-800 bg-blue-50 px-2 py-0.5 text-[10px] border border-blue-200">
                        <Clock className="w-3 h-3" />
                        <span>قيد التحضير</span>
                      </span>
                    )}
                  </td>
                  <td className="excel-td p-2 text-center font-mono font-bold text-slate-800">
                    {year.total_students}
                  </td>
                  <td className="excel-td p-2 text-center font-mono text-slate-600">
                    {year.active_cohorts}
                  </td>
                  <td className="excel-td p-2 text-center font-mono font-semibold text-slate-800">
                    {year.collection_rate}
                  </td>
                  <td className="excel-td p-2 text-slate-600 truncate max-w-xs text-[11px]">
                    {year.descriptionAr}
                  </td>
                  <td className="excel-td p-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {!year.is_current && (
                        <button
                          onClick={() => setConfirmActiveModal(year)}
                          className="button text-[10px] h-6 px-1.5 bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-600 hover:text-white"
                          title="تعيين كموسم نشط فورياً (/set-current)"
                        >
                          <Check className="w-3 h-3" />
                          <span>تفعيل</span>
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedYearForEdit(year)}
                        className="icon-button w-6 h-6 text-slate-600 hover:text-blue-900"
                        title="تعديل تواريخ الموسم (PUT /{year_id})"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      {!year.is_current && year.total_students === 0 && (
                        <button
                          className="icon-button w-6 h-6 text-rose-600 hover:text-rose-800"
                          title="حذف الموسم الفارغ (DELETE /{year_id})"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer Status */}
        <div className="excel-status-bar p-2 text-slate-600 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span>عدد السجلات المعروضة: <strong>{filteredYears.length}</strong></span>
            <span>•</span>
            <span className="text-blue-900 font-mono">FastAPI Router: /academic-years</span>
          </div>
          <div className="text-[10px] text-slate-400">
            الحماية الأمنية: يتطلب صلاحيات ADMIN أو DIRECTOR لتعديل النطاقات
          </div>
        </div>
      </div>

      {/* 5. Modal: Create New Academic Year */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-3 select-none">
          <div className="bg-white border border-slate-400 max-w-lg w-full shadow-lg">
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-blue-900" />
                <h3 className="font-bold text-sm text-slate-900">
                  إضافة موسم أكاديمي ومالي جديد (POST /academic-years)
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="icon-button w-6 h-6 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateYear} className="p-4 space-y-3">
              <div>
                <label className="eyebrow block mb-1 text-slate-700">
                  مسمى الموسم (Academic Cycle Label) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: 2026-2027"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-8 px-2.5 text-xs border border-slate-300 focus:outline-none focus:border-blue-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="eyebrow block mb-1 text-slate-700">
                    تاريخ الانطلاق (Start Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full h-8 px-2.5 text-xs border border-slate-300 focus:outline-none focus:border-blue-900"
                  />
                </div>
                <div>
                  <label className="eyebrow block mb-1 text-slate-700">
                    تاريخ الختام (End Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full h-8 px-2.5 text-xs border border-slate-300 focus:outline-none focus:border-blue-900"
                  />
                </div>
              </div>

              <div>
                <label className="eyebrow block mb-1 text-slate-700">
                  الوصف والملاحظات الإدارية
                </label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات حول هذا الموسم..."
                  value={formData.descriptionAr}
                  onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-300 focus:outline-none focus:border-blue-900"
                />
              </div>

              <div className="p-2.5 bg-blue-50 border border-blue-200 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isCurrentCheck"
                  checked={formData.is_current}
                  onChange={(e) => setFormData({ ...formData, is_current: e.target.checked })}
                  className="w-3.5 h-3.5 accent-blue-900"
                />
                <label htmlFor="isCurrentCheck" className="text-xs text-blue-950 font-semibold cursor-pointer">
                  تعيين هذا الموسم كـ موسم نشط رئيسي فور إنشائه (Atomically Set Current)
                </label>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="button text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="button button-primary text-xs"
                >
                  حفظ وتسجيل الموسم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal: Confirm Active Cycle Switch */}
      {confirmActiveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-3 select-none">
          <div className="bg-white border border-amber-300 max-w-md w-full shadow-lg">
            <div className="p-3 border-b border-amber-200 bg-amber-50 flex items-center gap-2 text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              <h3 className="font-bold text-sm">
                تأكيد تبديل الموسم النشط (POST /{confirmActiveModal.year_id}/set-current)
              </h3>
            </div>

            <div className="p-4 space-y-2 text-xs text-slate-700">
              <p>
                أنت على وشك تعيين الموسم الدراسي <strong>{confirmActiveModal.name}</strong> كالموسم المالي والتشغيلي الفعّال للنظام.
              </p>
              <p className="text-slate-500 text-[11px]">
                سيتم أرشفة الموسم الحالي تلقائياً وتحويل كافة العمليات اليومية وتدفقات الصندوق إلى النطاق الزمني الجديد.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmActiveModal(null)}
                className="button text-xs"
              >
                تراجع
              </button>
              <button
                onClick={() => handleSetCurrent(confirmActiveModal.year_id)}
                className="button button-primary text-xs bg-emerald-800 hover:bg-emerald-700"
              >
                تأكيد التفعيل الفوري
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
