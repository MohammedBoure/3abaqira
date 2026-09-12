import React, { useState } from 'react';
import {
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  FileSpreadsheet,
  Layers,
  GraduationCap,
  CreditCard,
  Building2,
  X,
  Check,
} from 'lucide-react';
import { MOCK_ENROLLMENTS } from '../../mock/mockData';

export function EnrollmentsView() {
  const [enrollments, setEnrollments] = useState(MOCK_ENROLLMENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [form, setForm] = useState({
    student_name: '',
    branch_id: 'CENTER',
    group_name: 'سوروبان الفوج أ1',
    payment_mode: 'INSTALLMENT',
    agreed_total_amount: 34000,
    total_discount_amount: 1500,
  });

  const filtered = enrollments.filter((enr) => {
    const matchesSearch =
      enr.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enr.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(enr.enrollment_id).includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || enr.enrollment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateEnrollment = (e) => {
    e.preventDefault();
    if (!form.student_name) return;

    const newEnr = {
      enrollment_id: Date.now(),
      student_id: Date.now(),
      student_name: form.student_name,
      branch_id: form.branch_id,
      group_name: form.group_name,
      academic_year: '2025-2026',
      enrollment_date: new Date().toISOString().substring(0, 10),
      payment_mode: form.payment_mode,
      agreed_total_amount: Number(form.agreed_total_amount),
      total_discount_amount: Number(form.total_discount_amount),
      enrollment_status: 'ACTIVE',
      invoices_count: 4,
      paid_invoices_count: 1,
    };

    setEnrollments([newEnr, ...enrollments]);
    setIsModalOpen(false);
    setForm({ student_name: '', branch_id: 'CENTER', group_name: 'سوروبان الفوج أ1', payment_mode: 'INSTALLMENT', agreed_total_amount: 34000, total_discount_amount: 1500 });
  };

  return (
    <div className="space-y-3 font-arabic">
      {/* 1. Header */}
      <div className="bg-white border border-slate-300 p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="eyebrow flex items-center gap-1.5 text-blue-900">
            <UserPlus className="w-3.5 h-3.5" />
            <span>سجل الاشتراكات والعقود الطلابية المعتمدة</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold font-serif text-slate-900 mt-0.5">
            سجل تسجيل وترسيم الطلاب (Student Enrollments)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            تسجيل الطلاب في الأفواج والبرامج، توليد جداول الأقساط الآلية، تطبيق اتفاقيات الدفع، وتتبع الحالات الأكاديمية.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="button button-primary text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>ترسيم تسجيل طالب جديد</span>
        </button>
      </div>

      {/* 2. Grid Table */}
      <div className="bg-white border border-slate-300 shadow-xs">
        <div className="p-2.5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث باسم الطالب أو الفوج..."
              className="w-full h-7 px-2 text-xs border border-slate-300 bg-white"
            />
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-500 font-semibold me-1">الحالة:</span>
            {['ALL', 'ACTIVE', 'COMPLETED', 'SUSPENDED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-0.5 text-[10px] font-semibold border ${
                  statusFilter === st
                    ? 'bg-blue-900 text-white border-blue-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {st === 'ALL' ? 'الكل' : st === 'ACTIVE' ? 'نشط' : st === 'COMPLETED' ? 'مكتمل' : 'معلق'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="excel-table text-xs">
            <thead>
              <tr>
                <th className="excel-th p-2 text-center w-16">ID التسجيل</th>
                <th className="excel-th p-2 text-start">اسم الطالب</th>
                <th className="excel-th p-2 text-center">المقر</th>
                <th className="excel-th p-2 text-start">الفوج والمستوى</th>
                <th className="excel-th p-2 text-center">الموسم الدراسي</th>
                <th className="excel-th p-2 text-center">تاريخ التسجيل</th>
                <th className="excel-th p-2 text-center">نمط السداد</th>
                <th className="excel-th p-2 text-center">المبلغ المتفق عليه</th>
                <th className="excel-th p-2 text-center">الأقساط المفوترة</th>
                <th className="excel-th p-2 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((enr) => (
                <tr key={enr.enrollment_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="excel-td p-2 text-center font-mono text-slate-500">
                    #{enr.enrollment_id}
                  </td>
                  <td className="excel-td p-2 font-bold text-slate-900">
                    {enr.student_name}
                  </td>
                  <td className="excel-td p-2 text-center font-semibold text-slate-700">
                    {enr.branch_id}
                  </td>
                  <td className="excel-td p-2 text-slate-800 font-medium">
                    {enr.group_name}
                  </td>
                  <td className="excel-td p-2 text-center font-mono text-slate-600">
                    {enr.academic_year}
                  </td>
                  <td className="excel-td p-2 text-center font-mono text-slate-600">
                    {enr.enrollment_date}
                  </td>
                  <td className="excel-td p-2 text-center">
                    <span className="tag text-[10px] font-mono">
                      {enr.payment_mode}
                    </span>
                  </td>
                  <td className="excel-td p-2 text-center font-mono font-bold text-blue-900">
                    {enr.agreed_total_amount.toLocaleString()} دج
                  </td>
                  <td className="excel-td p-2 text-center font-mono">
                    <span className="text-emerald-700 font-bold">{enr.paid_invoices_count}</span>
                    <span className="text-slate-400"> / {enr.invoices_count}</span>
                  </td>
                  <td className="excel-td p-2 text-center">
                    <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 text-[10px] border border-emerald-300 font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{enr.enrollment_status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="excel-status-bar p-2 text-slate-600 flex items-center justify-between text-[11px]">
          <span>إجمالي التسجيلات المعروضة: <strong>{filtered.length}</strong></span>
          <span className="text-slate-600 font-medium">سجلات انتساب رسمية وموثقة</span>
        </div>
      </div>

      {/* Modal: Add Enrollment */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-3 select-none">
          <div className="bg-white border border-slate-400 max-w-lg w-full shadow-lg">
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-900" />
                <h3 className="font-bold text-sm text-slate-900">
                  ترسيم تسجيل طالب في فوج دراسي
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="icon-button w-6 h-6 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEnrollment} className="p-4 space-y-3">
              <div>
                <label className="eyebrow block mb-1 text-slate-700">اسم الطالب *</label>
                <input
                  type="text"
                  required
                  placeholder="الاسم واللقب..."
                  value={form.student_name}
                  onChange={(e) => setForm({ ...form, student_name: e.target.value })}
                  className="w-full h-8 px-2.5 text-xs border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="eyebrow block mb-1 text-slate-700">المقر</label>
                  <select
                    value={form.branch_id}
                    onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                    className="w-full h-8 px-2 text-xs border border-slate-300 bg-white"
                  >
                    <option value="CENTER">CENTER</option>
                    <option value="RAWDA">RAWDA</option>
                  </select>
                </div>
                <div>
                  <label className="eyebrow block mb-1 text-slate-700">الفوج الدراسي</label>
                  <input
                    type="text"
                    value={form.group_name}
                    onChange={(e) => setForm({ ...form, group_name: e.target.value })}
                    className="w-full h-8 px-2.5 text-xs border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="eyebrow block mb-1 text-slate-700">نمط السداد</label>
                  <select
                    value={form.payment_mode}
                    onChange={(e) => setForm({ ...form, payment_mode: e.target.value })}
                    className="w-full h-8 px-2 text-xs border border-slate-300 bg-white font-mono"
                  >
                    <option value="INSTALLMENT">INSTALLMENT (أقساط دورية)</option>
                    <option value="CASH_UPFRONT">CASH_UPFRONT (دفع مسبق كامل)</option>
                    <option value="MONTHLY">MONTHLY (شهري متجدد)</option>
                  </select>
                </div>

                <div>
                  <label className="eyebrow block mb-1 text-slate-700">المبلغ الإجمالي المتفق عليه (دج)</label>
                  <input
                    type="number"
                    value={form.agreed_total_amount}
                    onChange={(e) => setForm({ ...form, agreed_total_amount: e.target.value })}
                    className="w-full h-8 px-2.5 text-xs border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="button text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="button button-primary text-xs"
                >
                  تأكيد الترسيم وتوليد الفواتير
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
