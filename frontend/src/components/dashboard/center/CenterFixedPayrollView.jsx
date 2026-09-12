import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Users,
  Coins,
  CheckCircle,
  Plus,
  X,
  FileCheck,
  Calendar,
} from 'lucide-react';
import { StandardViewLayout } from '../common/StandardViewLayout';
import { MOCK_CENTER_FIXED_PAYROLL } from '../../../mock/centerMockData';
import { RAWDA_MONTHS } from '../../../mock/rawdaMockData';

export function CenterFixedPayrollView() {
  const [staffList, setStaffList] = useState(MOCK_CENTER_FIXED_PAYROLL);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCurrentMonthOnly, setIsCurrentMonthOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newStaff, setNewStaff] = useState({
    name: '',
    role: 'إدارة وسكرتارية',
    startDate: new Date().toISOString().split('T')[0],
    baseSalary: 40000,
    notes: '',
  });

  // 1. KPI Calculations (Section 3.3.11)
  const totalStaff = staffList.length;
  const totalBaseSalaries = staffList.reduce((acc, s) => acc + s.baseSalary, 0);
  const totalDisbursedAll = staffList.reduce((acc, s) => acc + s.totalDisbursed, 0);
  const currentMonthPayout = staffList.reduce((acc, s) => {
    return acc + (s.months?.feb?.paid ? s.baseSalary : 0);
  }, 0);

  const kpiCards = [
    {
      label: 'إجمالي كتلة الأجور الثابتة شهرياً',
      value: `${totalBaseSalaries.toLocaleString()} دج`,
      icon: Wallet,
      subtext: 'طاقم الإدارة والسكرتارية والتحضيري',
      change: 'شهري',
      isPositive: true,
    },
    {
      label: 'المنصرف للشهر الجاري (فيفري)',
      value: `${currentMonthPayout.toLocaleString()} دج`,
      icon: Coins,
      subtext: `${staffList.filter((s) => s.months?.feb?.paid).length} موظف مستلم للراتب`,
      change: '100% صرف مؤكد',
      isPositive: true,
    },
    {
      label: 'عدد الموظفين الثابتين المعتمدين',
      value: `${totalStaff} موظف`,
      icon: Users,
      subtext: 'عقود عمل سنوية دائمة',
      change: 'منتظم',
      isPositive: true,
    },
    {
      label: 'مجموع الرواتب المنصرفة بالموسم',
      value: `${totalDisbursedAll.toLocaleString()} دج`,
      icon: CheckCircle,
      subtext: 'من سبتمبر 2025 إلى فيفري 2026',
      change: 'موثق بسندات',
      isPositive: true,
    },
  ];

  // 2. Filter
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      return (
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.notes.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [staffList, searchTerm]);

  // 3. Add Staff
  const handleSaveStaff = (e) => {
    e.preventDefault();
    if (!newStaff.name.trim()) return;

    const base = Number(newStaff.baseSalary) || 35000;
    const seq = staffList.length + 1;

    const monthsObj = {};
    RAWDA_MONTHS.forEach((m) => {
      monthsObj[m.id] = { paid: false, date: '-', voucher: '-' };
    });

    const entry = {
      id: `STAFF-${Date.now()}`,
      name: newStaff.name.trim(),
      role: newStaff.role,
      startDate: newStaff.startDate,
      baseSalary: base,
      months: monthsObj,
      totalDisbursed: 0,
      notes: newStaff.notes || 'موظف ثابت جديد',
    };

    setStaffList([...staffList, entry]);
    setIsModalOpen(false);
  };

  return (
    <StandardViewLayout
      titleAr="جدول الرواتب الشهرية الثابتة (طاقم الإدارة والتحضيري)"
      titleEn="Fixed Monthly Staff Payroll & 11-Month Salary Disbursement"
      description="متابعة صرف الرواتب الشهرية الثابتة لطاقم الإدارة المركزية، السكرتارية، وأساتذة الأقسام التحضيرية الثابتين عبر شهور الموسم الـ 11 (من سبتمبر إلى جويلية)."
      entityTag="الموارد البشرية والأجور"
      branchCode="CENTER"
      kpiCards={kpiCards}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="ابحث باسم الموظف أو المسمى الوظيفي..."
      hasMonthToggle={true}
      isCurrentMonthOnly={isCurrentMonthOnly}
      onToggleMonthFilter={() => setIsCurrentMonthOnly(!isCurrentMonthOnly)}
      actionButtonLabel="+ إضافة موظف جديد"
      onActionButtonClick={() => setIsModalOpen(true)}
      exportFileName="center_fixed_payroll"
      exportData={filteredStaff.map((s) => ({
        'الاسم واللقب': s.name,
        'المسمى الوظيفي': s.role,
        'تاريخ البداية': s.startDate,
        'الراتب الأساسي': s.baseSalary,
        'إجمالي المنصرف': s.totalDisbursed,
        'ملاحظات': s.notes,
      }))}
    >
      <div className="overflow-x-auto max-h-[580px]">
        <table className="w-full text-start text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-300 text-slate-700 font-bold select-none">
            <tr>
              <th className="p-2.5 text-center border-e border-slate-200 w-10">#</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[150px]">الاسم واللقب</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[180px]">المسمى الوظيفي</th>
              <th className="p-2.5 text-center border-e border-slate-200 min-w-[95px]">تاريخ البداية</th>
              <th className="p-2.5 text-end border-e border-slate-200 min-w-[120px] bg-slate-50 font-bold text-slate-900">
                الراتب الأساسي المستحق
              </th>

              {/* 11 Months columns or current month */}
              {isCurrentMonthOnly ? (
                <th className="p-2.5 text-center border-e border-slate-200 min-w-[130px] bg-blue-50 text-blue-900">
                  صرف فيفري (الحالي)
                </th>
              ) : (
                RAWDA_MONTHS.map((m) => (
                  <th key={m.id} className="p-2 text-center border-e border-slate-200 min-w-[65px] font-mono text-[11px]">
                    {m.shortAr}
                  </th>
                ))
              )}

              <th className="p-2.5 text-end border-e border-slate-200 min-w-[120px] text-emerald-800 bg-slate-50">
                مجموع المنصرف
              </th>
              <th className="p-2.5 text-start min-w-[180px]">الملاحظات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {filteredStaff.map((s, index) => (
              <tr key={s.id} className="hover:bg-blue-50/40 transition-colors">
                <td className="p-2 text-center border-e border-slate-200 font-mono text-slate-400 font-bold">
                  {index + 1}
                </td>
                <td className="p-2 border-e border-slate-200 font-bold text-slate-900">
                  {s.name}
                </td>
                <td className="p-2 border-e border-slate-200 text-slate-700">
                  {s.role}
                </td>
                <td className="p-2 text-center border-e border-slate-200 font-mono text-slate-500 text-[11px]">
                  {s.startDate}
                </td>
                <td className="p-2 text-end border-e border-slate-200 font-mono font-bold text-slate-900 bg-slate-50/50">
                  {s.baseSalary.toLocaleString()} دج
                </td>

                {/* Months */}
                {isCurrentMonthOnly ? (
                  <td className="p-2 text-center border-e border-slate-200 bg-blue-50/30">
                    {s.months?.feb?.paid ? (
                      <div>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-[2px]">
                          تم الصرف ✓
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono block mt-0.5">{s.months?.feb?.voucher}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[10px]">قيد الصرف</span>
                    )}
                  </td>
                ) : (
                  RAWDA_MONTHS.map((m) => {
                    const mData = s.months?.[m.id];
                    const isPaid = mData?.paid;
                    return (
                      <td key={m.id} className="p-1.5 text-center border-e border-slate-200 font-mono text-[10px]">
                        {isPaid ? (
                          <span className="text-emerald-700 font-bold" title={`تم الصرف: ${mData?.voucher}`}>✓</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    );
                  })
                )}

                <td className="p-2 text-end border-e border-slate-200 font-mono font-bold text-emerald-800 text-sm bg-slate-50/50">
                  {s.totalDisbursed.toLocaleString()} دج
                </td>
                <td className="p-2 text-slate-600">
                  {s.notes}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 font-mono text-xs">
            <tr>
              <td colSpan={4} className="p-2.5 text-start font-sans">
                المجموع العام لكتلة الرواتب الثابتة
              </td>
              <td className="p-2.5 text-end border-e border-slate-200 text-slate-900 font-bold">
                {totalBaseSalaries.toLocaleString()} دج
              </td>
              <td colSpan={isCurrentMonthOnly ? 1 : 11} className="p-2.5 text-center font-sans text-slate-500 text-[11px]">
                11 شهراً دراسياً (سبتمبر - جويلية)
              </td>
              <td className="p-2.5 text-end border-e border-slate-200 text-emerald-800 font-bold text-sm">
                {totalDisbursedAll.toLocaleString()} دج
              </td>
              <td className="p-2.5 font-sans text-slate-500 text-[11px]">
                {staffList.length} موظف معتمد
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
              <span className="font-bold text-slate-900 text-sm">إضافة موظف براتب شهري ثابت</span>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">الاسم واللقب الكامل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: سليمة منصوري"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">المسمى الوظيفي *</label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                >
                  <option value="مديرة إدارية وسكرتارية مركزية">مديرة إدارية وسكرتارية مركزية</option>
                  <option value="أستاذة القسم التحضيري الثابتة">أستاذة القسم التحضيري الثابتة</option>
                  <option value="عون استقبال وأمن المنشأة">عون استقبال وأمن المنشأة</option>
                  <option value="مسؤول النظافة والخدمات">مسؤول النظافة والخدمات</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الراتب الأساسي (دج) *</label>
                  <input
                    type="number"
                    required
                    value={newStaff.baseSalary}
                    onChange={(e) => setNewStaff({ ...newStaff, baseSalary: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">تاريخ بداية العمل *</label>
                  <input
                    type="date"
                    required
                    value={newStaff.startDate}
                    onChange={(e) => setNewStaff({ ...newStaff, startDate: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">الملاحظات</label>
                <input
                  type="text"
                  placeholder="رقم الضمان، تفاصيل العقد..."
                  value={newStaff.notes}
                  onChange={(e) => setNewStaff({ ...newStaff, notes: e.target.value })}
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
                  حفظ وتثبيت الموظف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </StandardViewLayout>
  );
}
