import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Search,
  Award,
  Users,
  Coins,
  CreditCard,
  AlertCircle,
  FileText,
  Plus,
  X,
  Languages,
} from 'lucide-react';
import { StandardViewLayout } from '../common/StandardViewLayout';
import { ReceiptVoucherModal } from '../common/ReceiptVoucherModal';
import { MOCK_CENTER_SOROBAN } from '../../../mock/centerMockData';

export function CenterSorobanView() {
  const [students, setStudents] = useState(MOCK_CENTER_SOROBAN);
  const [searchTerm, setSearchTerm] = useState('');
  const [beltFilter, setBeltFilter] = useState('ALL');
  const [levelFilter, setLevelFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [newStudent, setNewStudent] = useState({
    nameAr: '',
    nameFr: '',
    coach: 'يوسف بن عيسى',
    belt: 'أخضر',
    levelCode: 'p2',
    totalFee: 14000,
    inst1Amount: 4000,
    receipt1: '',
    phone: '',
  });

  // 1. KPI Calculations (Section 3.2.5)
  const totalStudents = students.length;
  const totalFees = students.reduce((acc, s) => acc + s.totalFee, 0);
  const totalCollected = students.reduce((acc, s) => acc + s.totalPaid, 0);
  const totalDebts = students.reduce((acc, s) => acc + s.remaining, 0);

  const kpiCards = [
    {
      label: 'إجمالي أبطال السوروبان المسجلين',
      value: `${totalStudents} بطل`,
      icon: Award,
      subtext: 'موزعين عبر مستويات p1 إلى s6',
      change: '+8 هذا الموسم',
      isPositive: true,
    },
    {
      label: 'مجموع الرسوم المستحقة (دج)',
      value: `${totalFees.toLocaleString()} دج`,
      icon: Coins,
      subtext: 'شامل الكتب والمعداد والشهادات',
      change: 'مستحق',
      isPositive: true,
    },
    {
      label: 'المبالغ المحصلة فعلياً (دج)',
      value: `${totalCollected.toLocaleString()} دج`,
      icon: CreditCard,
      subtext: `${totalFees > 0 ? Math.round((totalCollected / totalFees) * 100) : 0}% نسبة التحصيل`,
      change: 'محصل',
      isPositive: true,
    },
    {
      label: 'المتأخرات والديون العالقة',
      value: `${totalDebts.toLocaleString()} دج`,
      icon: AlertCircle,
      subtext: 'أقساط دورية قيد المتابعة',
      change: totalDebts > 0 ? 'متبقي' : '0 دج ✓',
      isPositive: totalDebts === 0,
    },
  ];

  // 2. Bilingual Search & Filter (Section 3.2.5)
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const term = searchTerm.toLowerCase();
      // Bilingual search: Arabic or Latin/French
      const matchSearch =
        s.nameAr.toLowerCase().includes(term) ||
        s.nameFr.toLowerCase().includes(term) ||
        s.coach.toLowerCase().includes(term) ||
        s.levelCode.toLowerCase().includes(term) ||
        (s.phone && s.phone.includes(term));
      const matchBelt = beltFilter === 'ALL' || s.belt === beltFilter;
      const matchLevel = levelFilter === 'ALL' || s.levelCode === levelFilter;
      return matchSearch && matchBelt && matchLevel;
    });
  }, [students, searchTerm, beltFilter, levelFilter]);

  // 3. Add Student
  const handleSaveStudent = (e) => {
    e.preventDefault();
    if (!newStudent.nameAr.trim() || !newStudent.nameFr.trim()) return;

    const total = Number(newStudent.totalFee) || 14000;
    const inst1 = Number(newStudent.inst1Amount) || 0;
    const seq = students.length + 1;

    let beltColorClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (newStudent.belt === 'أحمر') beltColorClass = 'bg-rose-100 text-rose-800 border-rose-300';
    if (newStudent.belt === 'أزرق') beltColorClass = 'bg-blue-100 text-blue-800 border-blue-300';
    if (newStudent.belt === 'أصفر') beltColorClass = 'bg-amber-100 text-amber-800 border-amber-300';

    const entry = {
      id: `SRB-${Date.now()}`,
      seq: seq,
      nameAr: newStudent.nameAr.trim(),
      nameFr: newStudent.nameFr.trim(),
      coach: newStudent.coach,
      belt: newStudent.belt,
      beltColor: beltColorClass,
      levelCode: newStudent.levelCode,
      totalFee: total,
      inst1: { amount: inst1, receipt: newStudent.receipt1 || `REC-SRB-26-${seq}` },
      inst2: { amount: 0, receipt: '' },
      inst3: { amount: 0, receipt: '' },
      inst4: { amount: 0, receipt: '' },
      totalPaid: inst1,
      remaining: total - inst1,
      phone: newStudent.phone || '0550 00 00 00',
    };

    setStudents([entry, ...students]);
    setIsModalOpen(false);
  };

  const handleOpenVoucher = (student, inst, num) => {
    setSelectedVoucher({
      receiptNumber: inst.receipt || `REC-SRB-26-${student.seq}`,
      payerName: `${student.nameAr} (${student.nameFr})`,
      category: `برنامج السوروبان والحساب الذهني - المستوى (${student.levelCode}) الحزام ${student.belt} - الدفعة ${num}`,
      amount: inst.amount,
      paymentMethod: 'نقداً (خزينة المركز)',
      branch: 'المركز الأكاديمي والتعليمي',
      notes: `المتبقي: ${student.remaining.toLocaleString()} دج`,
    });
  };

  return (
    <StandardViewLayout
      titleAr="سجل برنامج السوروبان والحساب الذهني"
      titleEn="Soroban Mental Math Registry, Belt Levels & Bilingual System"
      description="إدارة أبطال الحساب الذهني والسوروبان، محرك بحث فوري ثنائي اللغة (عربي / فرنسي) لإصدار الشهادات الرسمية، وتصنيف الأحزمة والمستويات (p1 إلى s6) ونظام الدفعات الـ 4."
      entityTag="الأنشطة التخصصية والنوادي"
      branchCode="CENTER"
      kpiCards={kpiCards}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="ابحث بالاسم العربي أو الاسم اللاتيني (Nom Français) أو الحزام..."
      actionButtonLabel="+ تسجيل مشترك سوروبان"
      onActionButtonClick={() => setIsModalOpen(true)}
      exportFileName="center_soroban_students"
      exportData={filteredStudents.map((s) => ({
        'الرقم': s.seq,
        'الاسم بالعربية': s.nameAr,
        'Nom Latin': s.nameFr,
        'المدرب': s.coach,
        'الحزام': s.belt,
        'المستوى': s.levelCode,
        'الرسوم الكلية': s.totalFee,
        'الدفعة 1': s.inst1.amount,
        'وصل 1': s.inst1.receipt,
        'الدفعة 2': s.inst2.amount,
        'وصل 2': s.inst2.receipt,
        'الدفعة 3': s.inst3.amount,
        'وصل 3': s.inst3.receipt,
        'الدفعة 4': s.inst4.amount,
        'وصل 4': s.inst4.receipt,
        'المحصل': s.totalPaid,
        'الباقي': s.remaining,
      }))}
      filterSlot={
        <div className="flex items-center gap-1.5">
          <select
            value={beltFilter}
            onChange={(e) => setBeltFilter(e.target.value)}
            className="h-7 px-2 text-xs bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:border-blue-900"
          >
            <option value="ALL">كافة الأحزمة</option>
            <option value="أخضر">الحزام الأخضر</option>
            <option value="أحمر">الحزام الأحمر</option>
            <option value="أزرق">الحزام الأزرق</option>
            <option value="أصفر">الحزام الأصفر</option>
          </select>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="h-7 px-2 text-xs bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:border-blue-900"
          >
            <option value="ALL">كافة المستويات (p1 - s6)</option>
            <option value="p1">المستوى p1</option>
            <option value="p2">المستوى p2</option>
            <option value="p5">المستوى p5</option>
            <option value="j2">المستوى j2</option>
            <option value="s6">المستوى s6</option>
          </select>
        </div>
      }
    >
      <div className="overflow-x-auto max-h-[580px]">
        <table className="w-full text-start text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-300 text-slate-700 font-bold select-none">
            <tr>
              <th className="p-2.5 text-center border-e border-slate-200 w-10">#</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[140px]">الاسم بالعربية</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[150px] font-sans">
                Nom Latin (فرنسي)
              </th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[130px]">المدرب المشرف</th>
              <th className="p-2.5 text-center border-e border-slate-200 min-w-[120px]">المستوى والحزام</th>
              <th className="p-2.5 text-end border-e border-slate-200 min-w-[110px] bg-slate-50">الرسوم الكلية</th>
              <th className="p-2 text-center border-e border-slate-200 min-w-[110px]">الدفعة 1 + الوصل</th>
              <th className="p-2 text-center border-e border-slate-200 min-w-[110px]">الدفعة 2 + الوصل</th>
              <th className="p-2 text-center border-e border-slate-200 min-w-[110px]">الدفعة 3 + الوصل</th>
              <th className="p-2 text-center border-e border-slate-200 min-w-[110px]">الدفعة 4 + الوصل</th>
              <th className="p-2.5 text-end border-e border-slate-200 min-w-[110px] text-emerald-800">مجموع المسدد</th>
              <th className="p-2.5 text-end min-w-[100px]">الباقي (الديون)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={12} className="p-8 text-center text-slate-400">
                  لا توجد نتائج مطابقة لبحث السوروبان
                </td>
              </tr>
            ) : (
              filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="p-2 text-center border-e border-slate-200 font-mono text-slate-400 font-bold">
                    {s.seq}
                  </td>
                  <td className="p-2 border-e border-slate-200 font-bold text-slate-900">
                    {s.nameAr}
                  </td>
                  <td className="p-2 border-e border-slate-200 font-sans text-slate-700 font-medium">
                    {s.nameFr}
                  </td>
                  <td className="p-2 border-e border-slate-200 text-slate-700">
                    {s.coach}
                  </td>
                  <td className="p-2 text-center border-e border-slate-200">
                    <div className="flex items-center justify-center gap-1">
                      <span className={`px-2 py-0.5 text-[10px] font-bold border ${s.beltColor}`}>
                        {s.belt}
                      </span>
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 font-mono font-bold text-[10px] border border-slate-200">
                        {s.levelCode}
                      </span>
                    </div>
                  </td>
                  <td className="p-2 text-end border-e border-slate-200 font-mono font-bold text-slate-900 bg-slate-50/50">
                    {s.totalFee.toLocaleString()} دج
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
                    {s.inst2.receipt && (
                      <button
                        onClick={() => handleOpenVoucher(s, s.inst2, 2)}
                        className="text-[9px] text-blue-800 hover:underline font-bold block mx-auto"
                      >
                        {s.inst2.receipt}
                      </button>
                    )}
                  </td>

                  {/* Inst 3 */}
                  <td className="p-1.5 text-center border-e border-slate-200 font-mono text-[11px]">
                    <div className={s.inst3.amount > 0 ? 'font-bold text-emerald-800' : 'text-slate-400'}>
                      {s.inst3.amount > 0 ? `${s.inst3.amount.toLocaleString()} دج` : '0 دج'}
                    </div>
                    {s.inst3.receipt && (
                      <button
                        onClick={() => handleOpenVoucher(s, s.inst3, 3)}
                        className="text-[9px] text-blue-800 hover:underline font-bold block mx-auto"
                      >
                        {s.inst3.receipt}
                      </button>
                    )}
                  </td>

                  {/* Inst 4 */}
                  <td className="p-1.5 text-center border-e border-slate-200 font-mono text-[11px]">
                    <div className={s.inst4.amount > 0 ? 'font-bold text-emerald-800' : 'text-slate-400'}>
                      {s.inst4.amount > 0 ? `${s.inst4.amount.toLocaleString()} دج` : '0 دج'}
                    </div>
                    {s.inst4.receipt && (
                      <button
                        onClick={() => handleOpenVoucher(s, s.inst4, 4)}
                        className="text-[9px] text-blue-800 hover:underline font-bold block mx-auto"
                      >
                        {s.inst4.receipt}
                      </button>
                    )}
                  </td>

                  {/* Total Paid */}
                  <td className="p-2 text-end border-e border-slate-200 font-mono font-bold text-emerald-800">
                    {s.totalPaid.toLocaleString()} دج
                  </td>

                  {/* Remaining */}
                  <td className="p-2 text-end font-mono font-bold">
                    {s.remaining > 0 ? (
                      <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-[2px]">
                        {s.remaining.toLocaleString()} دج
                      </span>
                    ) : (
                      <span className="text-emerald-700">0 دج ✓</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Soroban Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">تسجيل بطل جديد في السوروبان</span>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الاسم واللقب بالعربية *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: يوسف بن عيسى"
                    value={newStudent.nameAr}
                    onChange={(e) => setNewStudent({ ...newStudent, nameAr: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nom et Prénom (Latin) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Benissa Youcef"
                    value={newStudent.nameFr}
                    onChange={(e) => setNewStudent({ ...newStudent, nameFr: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الحزام *</label>
                  <select
                    value={newStudent.belt}
                    onChange={(e) => setNewStudent({ ...newStudent, belt: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                  >
                    <option value="أخضر">أخضر</option>
                    <option value="أحمر">أحمر</option>
                    <option value="أزرق">أزرق</option>
                    <option value="أصفر">أصفر</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">رمز المستوى *</label>
                  <select
                    value={newStudent.levelCode}
                    onChange={(e) => setNewStudent({ ...newStudent, levelCode: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                  >
                    <option value="p1">p1</option>
                    <option value="p2">p2</option>
                    <option value="p5">p5</option>
                    <option value="j2">j2</option>
                    <option value="s6">s6</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المدرب *</label>
                  <select
                    value={newStudent.coach}
                    onChange={(e) => setNewStudent({ ...newStudent, coach: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                  >
                    <option value="يوسف بن عيسى">يوسف بن عيسى</option>
                    <option value="سميحة بوعبد الله">سميحة بوعبد الله</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">إجمالي الرسوم (دج) *</label>
                  <input
                    type="number"
                    required
                    value={newStudent.totalFee}
                    onChange={(e) => setNewStudent({ ...newStudent, totalFee: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المبلغ المسدد (الدفعة 1) *</label>
                  <input
                    type="number"
                    required
                    value={newStudent.inst1Amount}
                    onChange={(e) => setNewStudent({ ...newStudent, inst1Amount: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">رقم وصل الدفعة 1</label>
                  <input
                    type="text"
                    placeholder="REC-SRB-26-..."
                    value={newStudent.receipt1}
                    onChange={(e) => setNewStudent({ ...newStudent, receipt1: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">رقم هاتف ولي الأمر</label>
                  <input
                    type="tel"
                    placeholder="0550 00 00 00"
                    value={newStudent.phone}
                    onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                  />
                </div>
              </div>

              {/* Automatic Calculation Preview */}
              <div className="p-2 bg-blue-50 border border-blue-200 flex justify-between items-center text-xs">
                <span className="text-slate-600 font-semibold">المتبقي دين على المشترك:</span>
                <strong className="font-mono text-rose-700 font-bold text-sm">
                  {Math.max(
                    (Number(newStudent.totalFee) || 0) - (Number(newStudent.inst1Amount) || 0),
                    0
                  ).toLocaleString()}{' '}
                  دج
                </strong>
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
                  حفظ المشترك
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
