import React, { useState } from 'react';
import {
  Users,
  Download,
  Plus,
  Printer,
  CheckCircle2,
  Clock,
  Search,
  DollarSign,
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { StatusBadge } from '../common/StatusBadge';
import { MOCK_PAYROLL_DATA } from '../../mock/mockData';

export function PayrollOverview() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPayroll = MOCK_PAYROLL_DATA.filter((p) =>
    p.nameAr.includes(searchTerm) || p.roleAr.includes(searchTerm) || p.staffCode.includes(searchTerm)
  );

  const totalPayout = filteredPayroll.reduce((acc, cur) => acc + cur.netPayout, 0);

  return (
    <div className="w-full bg-white border border-slate-300 shadow-xs flex flex-col space-y-4 p-4">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-300">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-blue-900" />
            <h2 className="text-base font-bold font-display text-slate-900">
              سجل أجور ورواتب الطاقم والمدربين (HR & Payroll Master Sheet)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            مسودة نموذجية جاهزة للربط مع جداول الحصص المنجزة ومضاعف نصيب الأستاذ (قالب عمل جاهز)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute inset-y-0 start-2.5 my-auto text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث بالاسم أو الصفة..."
              className="h-7 ps-7 pe-2 text-xs sharp-input w-48 sm:w-60"
            />
          </div>

          <GlassButton variant="primary" size="sm" icon={Download} className="h-7 text-xs">
            تصدير كشف الرواتب
          </GlassButton>
        </div>
      </div>

      {/* Excel Table Layout for Payroll */}
      <div className="overflow-x-auto border border-slate-300">
        <table className="excel-table text-xs text-slate-800">
          <thead>
            <tr className="bg-slate-100 text-slate-700">
              <th className="excel-th py-2 px-3 text-start">الرمز</th>
              <th className="excel-th py-2 px-3 text-start">الاسم واللقب</th>
              <th className="excel-th py-2 px-3 text-start">الصفة الوظيفية</th>
              <th className="excel-th py-2 px-3 text-end">الراتب القاعدي</th>
              <th className="excel-th py-2 px-3 text-center">الحصص المنجزة</th>
              <th className="excel-th py-2 px-3 text-end">سعر الحصة</th>
              <th className="excel-th py-2 px-3 text-center">الطلاب المكفولين</th>
              <th className="excel-th py-2 px-3 text-end">إجمالي المستحق</th>
              <th className="excel-th py-2 px-3 text-end">الخصومات</th>
              <th className="excel-th py-2 px-3 text-end">الصافي للدفع</th>
              <th className="excel-th py-2 px-3 text-center">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredPayroll.map((emp) => (
              <tr key={emp.id} className="hover:bg-slate-50">
                <td className="excel-td py-2 px-3 font-mono font-semibold text-blue-900">
                  {emp.staffCode}
                </td>
                <td className="excel-td py-2 px-3 font-bold text-slate-900">
                  {emp.nameAr}
                </td>
                <td className="excel-td py-2 px-3 text-slate-700">
                  {emp.roleAr}
                </td>
                <td className="excel-td py-2 px-3 text-end font-mono">
                  {emp.baseSalary.toLocaleString('fr-DZ')} دج
                </td>
                <td className="excel-td py-2 px-3 text-center font-mono">
                  {emp.completedSessions} حصة
                </td>
                <td className="excel-td py-2 px-3 text-end font-mono">
                  {emp.sessionRate > 0 ? `${emp.sessionRate.toLocaleString('fr-DZ')} دج` : '—'}
                </td>
                <td className="excel-td py-2 px-3 text-center font-mono font-semibold">
                  {emp.studentHeadcount}
                </td>
                <td className="excel-td py-2 px-3 text-end font-mono font-bold">
                  {emp.grossWages.toLocaleString('fr-DZ')} دج
                </td>
                <td className="excel-td py-2 px-3 text-end font-mono text-rose-700">
                  {emp.deductions > 0 ? `-${emp.deductions.toLocaleString('fr-DZ')} دج` : '0 دج'}
                </td>
                <td className="excel-td py-2 px-3 text-end font-mono font-extrabold text-blue-900 bg-blue-50/40">
                  {emp.netPayout.toLocaleString('fr-DZ')} دج
                </td>
                <td className="excel-td py-2 px-3 text-center">
                  <StatusBadge status={emp.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Aggregate Payroll Ribbon */}
      <div className="excel-status-bar p-2.5 px-3 flex flex-wrap items-center justify-between text-slate-700">
        <span>
          عدد أفراد الطاقم: <strong className="text-slate-900 font-mono">{filteredPayroll.length}</strong>
        </span>
        <div className="flex items-center gap-3">
          <span>
            إجمالي كتلة الأجور الصافية المستحقة (Net Payroll Total):{' '}
            <strong className="text-blue-900 font-mono text-sm">
              {totalPayout.toLocaleString('fr-DZ')} دج
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}
