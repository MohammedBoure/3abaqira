import React, { useState } from 'react';
import { Search, Eye, Printer, ChevronRight, ChevronLeft } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { StatusBadge } from '../common/StatusBadge';
import { MOCK_STUDENTS_ROSTER } from '../../mock/mockData';

export function MockDataGrid({ selectedBranch = 'ALL' }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Filter mock roster
  const filteredStudents = MOCK_STUDENTS_ROSTER.filter((s) => {
    const matchesBranch = selectedBranch === 'ALL' || s.branchId === selectedBranch;
    const matchesStatus = statusFilter === 'ALL' || s.paymentStatus === statusFilter;
    const matchesSearch =
      searchTerm === '' ||
      s.fullNameAr.includes(searchTerm) ||
      s.fullNameFr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.program.includes(searchTerm);
    return matchesBranch && matchesStatus && matchesSearch;
  });

  return (
    <GlassCard className="p-0 overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold font-display text-slate-900">
            سجل الطلاب والاشتراكات الموحد
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            عرض حي لقوائم المسجلين بالأكاديمية والروضة مع تتبع الأقساط والوضعيات المالية
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200">
            {['ALL', 'PAID', 'PARTIAL', 'OVERDUE'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`
                  px-2.5 py-1 text-xs font-semibold rounded-lg transition-all
                  ${statusFilter === st
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}
                `}
              >
                {st === 'ALL' ? 'الكل' : st === 'PAID' ? 'مسدد' : st === 'PARTIAL' ? 'جزئي' : 'متأخر'}
              </button>
            ))}
          </div>

          {/* Table Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute inset-y-0 start-2.5 my-auto text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="تصفية بالاسم أو الرمز..."
              className="h-8 ps-8 pe-3 text-xs rounded-lg glass-input text-slate-900 placeholder-slate-400 w-44 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-start text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
              <th className="py-3.5 px-4 text-start font-mono">الرمز (Code)</th>
              <th className="py-3.5 px-4 text-start">اسم التلميذ / الطالب</th>
              <th className="py-3.5 px-4 text-start">البرنامج والفوج</th>
              <th className="py-3.5 px-4 text-start">المدرب / المربية</th>
              <th className="py-3.5 px-4 text-start">المدفوع / المستحق</th>
              <th className="py-3.5 px-4 text-center">حالة السداد</th>
              <th className="py-3.5 px-4 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((st) => (
                <tr
                  key={st.id}
                  className="hover:bg-blue-50/40 transition-colors group"
                >
                  <td className="py-3 px-4 font-mono text-blue-700 font-semibold">
                    {st.studentCode}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      {st.fullNameAr}
                    </div>
                    <div className="text-[11px] text-slate-500 font-latin">
                      {st.fullNameFr}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-800">{st.program}</div>
                    <div className="text-[11px] text-slate-500">{st.level}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {st.coachName}
                  </td>
                  <td className="py-3 px-4 font-mono">
                    <span className="text-emerald-700 font-bold">{st.amountPaid}</span>
                    <span className="text-slate-400 text-xs"> / {st.amountDue}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <StatusBadge status={st.paymentStatus} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        title="معاينة الملف"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        title="طباعة الوصل"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="py-12 text-center text-slate-400 font-medium">
                  لا توجد نتائج مطابقة لخيارات التصفية المحددة.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Pagination Footer */}
      <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50">
        <div>
          عرض <span className="font-bold text-slate-900">{filteredStudents.length}</span> من أصل{' '}
          <span className="font-bold text-slate-900">{MOCK_STUDENTS_ROSTER.length}</span> طالب مسجل
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40">
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="px-2 py-0.5 font-mono text-blue-700 bg-white rounded border border-slate-200 font-semibold">
            1 / 1
          </span>
          <button className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40">
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
