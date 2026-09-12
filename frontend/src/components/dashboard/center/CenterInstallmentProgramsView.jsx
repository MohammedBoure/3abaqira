import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Users,
  Coins,
  CreditCard,
  AlertCircle,
  CheckCircle,
  FileText,
  Edit2,
  Plus,
  X,
} from 'lucide-react';
import { StandardViewLayout } from '../common/StandardViewLayout';
import { ReceiptVoucherModal } from '../common/ReceiptVoucherModal';
import { MOCK_CENTER_PROGRAMS } from '../../../mock/centerMockData';

export function CenterInstallmentProgramsView({ defaultProgram = 'support-classes' }) {
  const [activeProgram, setActiveProgram] = useState(defaultProgram);
  const [programsData, setProgramsData] = useState(MOCK_CENTER_PROGRAMS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [newStudent, setNewStudent] = useState({
    fullName: '',
    level: '',
    coach: '',
    agreedFee: '',
    inst1: '',
    inst1Receipt: '',
    notes: '',
  });

  const currentProgram = programsData[activeProgram] || programsData['support-classes'];
  const studentsList = currentProgram.students || [];

  // 1. KPI Calculations (Section 3.1)
  const totalStudents = studentsList.length;
  const totalDue = studentsList.reduce((acc, s) => acc + (s.agreedFee || 0), 0);
  const totalCollected = studentsList.reduce((acc, s) => acc + (s.totalPaid || 0), 0);
  const totalDebts = studentsList.reduce((acc, s) => acc + (s.remaining || 0), 0);

  const kpiCards = [
    {
      label: 'إجمالي الطلاب المسجلين بالبرنامج',
      value: `${totalStudents} طالب`,
      icon: Users,
      subtext: currentProgram.titleAr.split('(')[0],
      change: 'نشط',
      isPositive: true,
    },
    {
      label: 'مجموع المستحقات الكلية (دج)',
      value: `${totalDue.toLocaleString()} دج`,
      icon: Coins,
      subtext: 'إجمالي قيمة عقود التدريب المتفق عليها',
      change: 'مستحق',
      isPositive: true,
    },
    {
      label: 'المبالغ المحصلة فعلياً (دج)',
      value: `${totalCollected.toLocaleString()} دج`,
      icon: CreditCard,
      subtext: `${totalDue > 0 ? Math.round((totalCollected / totalDue) * 100) : 0}% نسبة التحصيل`,
      change: 'محصل بالخزينة',
      isPositive: true,
    },
    {
      label: 'الديون والمتبقيات غير المسددة',
      value: `${totalDebts.toLocaleString()} دج`,
      icon: AlertCircle,
      subtext: 'أقساط مجدولة قيد التحصيل',
      change: totalDebts > 0 ? 'متبقي' : '0 دج ✓',
      isPositive: totalDebts === 0,
    },
  ];

  // 2. Filter students
  const filteredStudents = useMemo(() => {
    return studentsList.filter((s) => {
      const matchSearch =
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.level.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.coach.toLowerCase().includes(searchTerm.toLowerCase());
      const hasDebt = s.remaining > 0;
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PAID' && !hasDebt) ||
        (statusFilter === 'DEBT' && hasDebt);
      return matchSearch && matchStatus;
    });
  }, [studentsList, searchTerm, statusFilter]);

  // 3. Save Student Handler
  const handleSaveStudent = (e) => {
    e.preventDefault();
    if (!newStudent.fullName.trim()) return;

    const fee = Number(newStudent.agreedFee) || 0;
    const i1 = Number(newStudent.inst1) || 0;
    const paid = i1;
    const rem = fee - paid;
    const seq = studentsList.length + 1;

    const entry = {
      id: `STD-PROG-${Date.now()}`,
      seq: seq,
      fullName: newStudent.fullName.trim(),
      level: newStudent.level || 'المستوى 1',
      coach: newStudent.coach || 'أستاذ الدورة',
      agreedFee: fee,
      inst1: { amount: i1, receipt: newStudent.inst1Receipt || `REC-CTR-${seq}` },
      inst2: { amount: 0, dueDate: '2026-02-15', receipt: '' },
      inst3: { amount: 0, dueDate: '2026-03-15', receipt: '' },
      inst4: { amount: 0, dueDate: '2026-05-15', receipt: '' },
      totalPaid: paid,
      remaining: rem,
      notes: newStudent.notes || 'تسجيل جديد',
    };

    setProgramsData({
      ...programsData,
      [activeProgram]: {
        ...currentProgram,
        students: [entry, ...studentsList],
      },
    });

    setIsModalOpen(false);
    setNewStudent({
      fullName: '',
      level: '',
      coach: '',
      agreedFee: '',
      inst1: '',
      inst1Receipt: '',
      notes: '',
    });
  };

  const handleOpenVoucher = (student, inst, instNumber) => {
    setSelectedVoucher({
      receiptNumber: inst.receipt || `REC-CTR-INST-${student.seq}`,
      payerName: student.fullName,
      category: `${currentProgram.titleAr} (${student.level}) - الدفعة ${instNumber}`,
      amount: inst.amount,
      paymentMethod: 'نقداً (خزينة المركز)',
      branch: 'المركز الأكاديمي والتعليمي',
      notes: `المتبقي على الطالب: ${student.remaining.toLocaleString()} دج`,
    });
  };

  return (
    <StandardViewLayout
      titleAr={currentProgram.titleAr}
      titleEn={currentProgram.titleEn}
      description="نظام إدارة ومتابعة البرامج التعليمية بنظام الـ 4 دفعات مجدولة (Installment Programs)، تتبع إجمالي المستحقات، تواريخ استحقاق الدفعات، وأرقام وصولات القبض المالي."
      entityTag="برامج الدورات بنظام الدفعات"
      branchCode="CENTER"
      kpiCards={kpiCards}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="ابحث باسم الطالب، المستوى الدراسي أو الأستاذ..."
      actionButtonLabel="+ تسجيل طالب جديد"
      onActionButtonClick={() => setIsModalOpen(true)}
      exportFileName={`center_${activeProgram}`}
      exportData={filteredStudents.map((s) => ({
        'الرقم': s.seq,
        'الاسم واللقب': s.fullName,
        'المستوى': s.level,
        'المدرب / الأستاذ': s.coach,
        'الوضعية (المستحق)': s.agreedFee,
        'الدفعة 1': s.inst1.amount,
        'وصل 1': s.inst1.receipt,
        'الدفعة 2': s.inst2.amount,
        'وصل 2': s.inst2.receipt,
        'الدفعة 3': s.inst3.amount,
        'وصل 3': s.inst3.receipt,
        'الدفعة 4': s.inst4.amount,
        'وصل 4': s.inst4.receipt,
        'مجموع المحصل': s.totalPaid,
        'الباقي (الديون)': s.remaining,
        'ملاحظات': s.notes,
      }))}
      filterSlot={
        <div className="flex items-center gap-1.5">
          {/* Sub-Program switcher tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 border border-slate-200">
            {[
              { id: 'support-classes', label: 'دروس الدعم' },
              { id: 'languages', label: 'اللغات الأجنبية' },
              { id: 'robotics', label: 'الروبوتيك و AI' },
              { id: 'school-languages', label: 'دعم مناهج اللغات' },
            ].map((prog) => (
              <button
                key={prog.id}
                onClick={() => setActiveProgram(prog.id)}
                className={`h-6 px-2 text-xs font-semibold transition-colors ${
                  activeProgram === prog.id
                    ? 'bg-blue-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {prog.label}
              </button>
            ))}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-7 px-2 text-xs bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:border-blue-900"
          >
            <option value="ALL">كافة الوضعيات</option>
            <option value="PAID">مسدد كلياً (خالص)</option>
            <option value="DEBT">توجد ديون ومتبقيات</option>
          </select>
        </div>
      }
    >
      <div className="overflow-x-auto max-h-[580px]">
        <table className="w-full text-start text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-300 text-slate-700 font-bold select-none">
            <tr>
              <th className="p-2.5 text-center border-e border-slate-200 w-10">#</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[150px]">الاسم واللقب</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[130px]">المستوى</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[130px]">المدرب / الأستاذ</th>
              <th className="p-2.5 text-end border-e border-slate-200 min-w-[110px] bg-slate-50">
                الوضعية (المستحق)
              </th>

              {/* 4 Installments Columns */}
              <th className="p-2 text-center border-e border-slate-200 min-w-[110px]">الدفعة 1 + الوصل</th>
              <th className="p-2 text-center border-e border-slate-200 min-w-[125px]">الدفعة 2 + الاستحقاق</th>
              <th className="p-2 text-center border-e border-slate-200 min-w-[125px]">الدفعة 3 + الاستحقاق</th>
              <th className="p-2 text-center border-e border-slate-200 min-w-[125px]">الدفعة 4 + الاستحقاق</th>

              <th className="p-2.5 text-end border-e border-slate-200 min-w-[110px] text-emerald-800">
                مجموع الدفعات
              </th>
              <th className="p-2.5 text-end border-e border-slate-200 min-w-[110px]">الباقي (الديون)</th>
              <th className="p-2.5 text-start min-w-[160px]">ملاحظات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800 font-sans">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={12} className="p-8 text-center text-slate-400">
                  لا توجد سجلات مطابقة لمعايير البحث في هذا البرنامج
                </td>
              </tr>
            ) : (
              filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="p-2 text-center border-e border-slate-200 font-mono text-slate-400 font-bold">
                    {s.seq}
                  </td>
                  <td className="p-2 border-e border-slate-200 font-bold text-slate-900">
                    {s.fullName}
                  </td>
                  <td className="p-2 border-e border-slate-200">
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 text-[10px] font-semibold">
                      {s.level}
                    </span>
                  </td>
                  <td className="p-2 border-e border-slate-200 text-slate-700">
                    {s.coach}
                  </td>
                  <td className="p-2 text-end border-e border-slate-200 font-mono font-bold text-slate-900 bg-slate-50/50">
                    {s.agreedFee.toLocaleString()} دج
                  </td>

                  {/* Inst 1 */}
                  <td className="p-1.5 text-center border-e border-slate-200 font-mono text-[11px]">
                    <div className="font-bold text-emerald-800">{s.inst1.amount.toLocaleString()} دج</div>
                    {s.inst1.receipt && (
                      <button
                        onClick={() => handleOpenVoucher(s, s.inst1, 1)}
                        className="text-[9px] text-blue-800 hover:underline font-bold block mx-auto"
                      >
                        {s.inst1.receipt}
                      </button>
                    )}
                  </td>

                  {/* Inst 2 */}
                  <td className="p-1.5 text-center border-e border-slate-200 font-mono text-[11px]">
                    <div className={s.inst2.amount > 0 ? 'font-bold text-emerald-800' : 'text-slate-400'}>
                      {s.inst2.amount > 0 ? `${s.inst2.amount.toLocaleString()} دج` : '0 دج'}
                    </div>
                    {s.inst2.receipt ? (
                      <button
                        onClick={() => handleOpenVoucher(s, s.inst2, 2)}
                        className="text-[9px] text-blue-800 hover:underline font-bold block mx-auto"
                      >
                        {s.inst2.receipt}
                      </button>
                    ) : (
                      <span className="text-[9px] text-slate-400 block">{s.inst2.dueDate || '-'}</span>
                    )}
                  </td>

                  {/* Inst 3 */}
                  <td className="p-1.5 text-center border-e border-slate-200 font-mono text-[11px]">
                    <div className={s.inst3.amount > 0 ? 'font-bold text-emerald-800' : 'text-slate-400'}>
                      {s.inst3.amount > 0 ? `${s.inst3.amount.toLocaleString()} دج` : '0 دج'}
                    </div>
                    {s.inst3.receipt ? (
                      <button
                        onClick={() => handleOpenVoucher(s, s.inst3, 3)}
                        className="text-[9px] text-blue-800 hover:underline font-bold block mx-auto"
                      >
                        {s.inst3.receipt}
                      </button>
                    ) : (
                      <span className="text-[9px] text-slate-400 block">{s.inst3.dueDate || '-'}</span>
                    )}
                  </td>

                  {/* Inst 4 */}
                  <td className="p-1.5 text-center border-e border-slate-200 font-mono text-[11px]">
                    <div className={s.inst4.amount > 0 ? 'font-bold text-emerald-800' : 'text-slate-400'}>
                      {s.inst4.amount > 0 ? `${s.inst4.amount.toLocaleString()} دج` : '0 دج'}
                    </div>
                    {s.inst4.receipt ? (
                      <button
                        onClick={() => handleOpenVoucher(s, s.inst4, 4)}
                        className="text-[9px] text-blue-800 hover:underline font-bold block mx-auto"
                      >
                        {s.inst4.receipt}
                      </button>
                    ) : (
                      <span className="text-[9px] text-slate-400 block">{s.inst4.dueDate || '-'}</span>
                    )}
                  </td>

                  {/* Total Paid */}
                  <td className="p-2 text-end border-e border-slate-200 font-mono font-bold text-emerald-800">
                    {s.totalPaid.toLocaleString()} دج
                  </td>

                  {/* Remaining (Highlighted Red if debt) */}
                  <td className="p-2 text-end border-e border-slate-200 font-mono font-bold">
                    {s.remaining > 0 ? (
                      <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-[2px]">
                        {s.remaining.toLocaleString()} دج
                      </span>
                    ) : (
                      <span className="text-emerald-700">0 دج ✓</span>
                    )}
                  </td>

                  <td className="p-2 text-slate-600 truncate max-w-[180px]">
                    {s.notes}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 font-mono text-xs">
            <tr>
              <td colSpan={4} className="p-2.5 text-start font-sans">
                المجموع العام لبرنامج ({currentProgram.titleAr.split('(')[0]})
              </td>
              <td className="p-2.5 text-end border-e border-slate-200 text-slate-900">
                {totalDue.toLocaleString()} دج
              </td>
              <td colSpan={4} className="p-2.5 text-center font-sans text-slate-500">
                نظام 4 دفعات مجدولة
              </td>
              <td className="p-2.5 text-end border-e border-slate-200 text-emerald-800 font-bold text-sm">
                {totalCollected.toLocaleString()} دج
              </td>
              <td className="p-2.5 text-end border-e border-slate-200 text-rose-700 font-bold text-sm">
                {totalDebts.toLocaleString()} دج
              </td>
              <td className="p-2.5 font-sans text-slate-500 text-[11px]">
                {studentsList.length} مشترك
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Add Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">
                تسجيل طالب جديد في {currentProgram.titleAr.split('(')[0]}
              </span>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">الاسم واللقب الكامل للطالب *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ياسمين بن زينة"
                  value={newStudent.fullName}
                  onChange={(e) => setNewStudent({ ...newStudent, fullName: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المستوى أو الصف *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 4AM أو B1"
                    value={newStudent.level}
                    onChange={(e) => setNewStudent({ ...newStudent, level: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الأستاذ / المدرب المشرف *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أ. عبد القادر"
                    value={newStudent.coach}
                    onChange={(e) => setNewStudent({ ...newStudent, coach: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">إجمالي الرسوم المستحقة (الوضعية) *</label>
                  <input
                    type="number"
                    required
                    placeholder="20000"
                    value={newStudent.agreedFee}
                    onChange={(e) => setNewStudent({ ...newStudent, agreedFee: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المبلغ المسدد (الدفعة 1) *</label>
                  <input
                    type="number"
                    required
                    placeholder="5000"
                    value={newStudent.inst1}
                    onChange={(e) => setNewStudent({ ...newStudent, inst1: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">رقم وصل سداد الدفعة 1</label>
                <input
                  type="text"
                  placeholder="REC-CTR-..."
                  value={newStudent.inst1Receipt}
                  onChange={(e) => setNewStudent({ ...newStudent, inst1Receipt: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                />
              </div>

              {/* Automatic Calculation Preview */}
              <div className="p-2.5 bg-blue-50 border border-blue-200 space-y-1">
                <span className="text-[10px] text-slate-500 block font-semibold">الحسابات الآلية المطبقة:</span>
                <div className="flex justify-between items-center text-xs">
                  <span>المبلغ المتبقي دين على الطالب:</span>
                  <strong className="font-mono text-rose-700 font-bold text-sm">
                    {Math.max(
                      (Number(newStudent.agreedFee) || 0) - (Number(newStudent.inst1) || 0),
                      0
                    ).toLocaleString()}{' '}
                    دج
                  </strong>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ملاحظات وشروط خاصة</label>
                <input
                  type="text"
                  placeholder="خصومات، شروط أو مواعيد..."
                  value={newStudent.notes}
                  onChange={(e) => setNewStudent({ ...newStudent, notes: e.target.value })}
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
                  حفظ وتسجيل المشترك
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Voucher Modal */}
      <ReceiptVoucherModal
        isOpen={!!selectedVoucher}
        onClose={() => setSelectedVoucher(null)}
        voucherData={selectedVoucher}
      />
    </StandardViewLayout>
  );
}
