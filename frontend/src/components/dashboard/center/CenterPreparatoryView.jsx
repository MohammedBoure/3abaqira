import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Users,
  CreditCard,
  Coins,
  Calendar,
  Plus,
  X,
  FileText,
} from 'lucide-react';
import { StandardViewLayout } from '../common/StandardViewLayout';
import { ReceiptVoucherModal } from '../common/ReceiptVoucherModal';
import { MOCK_CENTER_PREPARATORY } from '../../../mock/centerMockData';

export function CenterPreparatoryView() {
  const [children, setChildren] = useState(MOCK_CENTER_PREPARATORY);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  const months9 = [
    { id: 'sep', label: 'سبتمبر' },
    { id: 'oct', label: 'أكتوبر' },
    { id: 'nov', label: 'نوفمبر' },
    { id: 'dec', label: 'ديسمبر' },
    { id: 'jan', label: 'جانفي' },
    { id: 'feb', label: 'فيفري' },
    { id: 'mar', label: 'مارس' },
    { id: 'apr', label: 'أفريل' },
    { id: 'may', label: 'ماي' },
  ];

  const [newChild, setNewChild] = useState({
    fullName: '',
    section: 'القسم التحضيري أ',
    birthDate: '',
    registrationDate: new Date().toISOString().split('T')[0],
    registrationFee: 8000,
    regReceipt: '',
    monthlyDue: 12000,
  });

  // 1. KPI Calculations (Section 3.2.7)
  const totalKids = children.length;
  const totalRegFees = children.reduce((acc, c) => acc + c.registrationFee, 0);
  const totalCollected = children.reduce((acc, c) => acc + c.totalPaid, 0);
  const totalDebts = children.reduce((acc, c) => acc + c.remaining, 0);

  const kpiCards = [
    {
      label: 'إجمالي أطفال التحضيري (2025)',
      value: `${totalKids} أطفال`,
      icon: GraduationCap,
      subtext: 'مقسمين بين القسم أ والقسم ب',
      change: 'طاقة كاملة',
      isPositive: true,
    },
    {
      label: 'إجمالي حقوق التسجيل المحصلة',
      value: `${totalRegFees.toLocaleString()} دج`,
      icon: CreditCard,
      subtext: '8,000 دج رسوم الملف والتأمين',
      change: '100% مسدد',
      isPositive: true,
    },
    {
      label: 'المبالغ المحصلة فعلياً (دج)',
      value: `${totalCollected.toLocaleString()} دج`,
      icon: Coins,
      subtext: 'حقوق التسجيل والشهور المسددة',
      change: 'مقبوض بالخزينة',
      isPositive: true,
    },
    {
      label: 'المتبقيات والديون العالقة',
      value: `${totalDebts.toLocaleString()} دج`,
      icon: Calendar,
      subtext: 'أقساط الأشهر المتبقية (مارس - ماي)',
      change: totalDebts > 0 ? 'متبقي' : '0 دج ✓',
      isPositive: totalDebts === 0,
    },
  ];

  // 2. Filter children
  const filteredChildren = useMemo(() => {
    return children.filter((c) => {
      return (
        c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.section.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [children, searchTerm]);

  // 3. Add Child
  const handleSaveChild = (e) => {
    e.preventDefault();
    if (!newChild.fullName.trim()) return;

    const seq = children.length + 1;
    const regFee = Number(newChild.registrationFee) || 8000;
    const monthly = Number(newChild.monthlyDue) || 12000;
    const totalExpected = regFee + (monthly * 9);

    const entry = {
      id: `PREP-${Date.now()}`,
      fullName: newChild.fullName.trim(),
      section: newChild.section,
      birthDate: newChild.birthDate || '2020-01-01',
      registrationDate: newChild.registrationDate,
      registrationFee: regFee,
      regReceipt: newChild.regReceipt || `REC-PRP-REG-${seq}`,
      monthlyDue: monthly,
      months: {
        sep: { paid: monthly, receipt: `REC-PRP-26-${seq}1` },
        oct: { paid: 0, receipt: '' },
        nov: { paid: 0, receipt: '' },
        dec: { paid: 0, receipt: '' },
        jan: { paid: 0, receipt: '' },
        feb: { paid: 0, receipt: '' },
        mar: { paid: 0, receipt: '' },
        apr: { paid: 0, receipt: '' },
        may: { paid: 0, receipt: '' },
      },
      totalPaid: regFee + monthly,
      remaining: totalExpected - (regFee + monthly),
    };

    setChildren([...children, entry]);
    setIsModalOpen(false);
  };

  const handleOpenVoucher = (child, mData, monthName) => {
    setSelectedVoucher({
      receiptNumber: mData.receipt || child.regReceipt,
      payerName: child.fullName,
      category: `القسم التحضيري المدرسي (${child.section}) - اشتراك ${monthName}`,
      amount: mData.paid || child.registrationFee,
      paymentMethod: 'نقداً (خزينة المركز)',
      branch: 'المركز الأكاديمي والتعليمي',
      notes: `المتبقي على الطفل: ${child.remaining.toLocaleString()} دج`,
    });
  };

  return (
    <StandardViewLayout
      titleAr="القسم التحضيري المدرسي (الموسم 2025)"
      titleEn="Academic Preparatory School Registry (9-Month Cycle)"
      description="متابعة أطفال القسم التحضيري، توثيق حقوق التسجيل المبدئية مع أرقام وصولاتها، وتتبع اشتراكات الأشهر التسعة (من سبتمبر إلى ماي) مع تدقيق وصل السداد لكل شهر."
      entityTag="الأنشطة التخصصية والنوادي"
      branchCode="CENTER"
      kpiCards={kpiCards}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="ابحث باسم طفل التحضيري أو القسم..."
      actionButtonLabel="+ تسجيل طفل تحضيري"
      onActionButtonClick={() => setIsModalOpen(true)}
      exportFileName="center_preparatory_students"
      exportData={filteredChildren.map((c) => ({
        'الاسم واللقب': c.fullName,
        'القسم': c.section,
        'تاريخ الميلاد': c.birthDate,
        'تاريخ التسجيل': c.registrationDate,
        'حقوق التسجيل': c.registrationFee,
        'وصل التسجيل': c.regReceipt,
        'المستحق شهرياً': c.monthlyDue,
        'المحصل الإجمالي': c.totalPaid,
        'المتبقي (الديون)': c.remaining,
      }))}
    >
      <div className="overflow-x-auto max-h-[580px]">
        <table className="w-full text-start text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-300 text-slate-700 font-bold select-none">
            <tr>
              <th className="p-2.5 text-center border-e border-slate-200 w-10">#</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[150px]">الاسم واللقب</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[120px]">الفئة / القسم</th>
              <th className="p-2.5 text-center border-e border-slate-200 min-w-[95px]">تاريخ الميلاد</th>
              <th className="p-2.5 text-center border-e border-slate-200 min-w-[120px] bg-blue-50/70 text-blue-900">
                حقوق التسجيل + الوصل
              </th>
              <th className="p-2.5 text-end border-e border-slate-200 min-w-[105px]">المستحق شهرياً</th>

              {/* 9 Months: Sep to May */}
              {months9.map((m) => (
                <th key={m.id} className="p-2 text-center border-e border-slate-200 min-w-[110px] font-mono text-[11px]">
                  {m.label} (المدفوع + الوصل)
                </th>
              ))}

              <th className="p-2.5 text-end border-e border-slate-200 min-w-[110px] text-emerald-800 bg-slate-50">
                المحصل الإجمالي
              </th>
              <th className="p-2.5 text-end min-w-[100px]">المتبقي (الديون)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {filteredChildren.map((c, index) => (
              <tr key={c.id} className="hover:bg-blue-50/40 transition-colors">
                <td className="p-2 text-center border-e border-slate-200 font-mono text-slate-400 font-bold">
                  {index + 1}
                </td>
                <td className="p-2 border-e border-slate-200 font-bold text-slate-900">
                  {c.fullName}
                </td>
                <td className="p-2 border-e border-slate-200">
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-800 font-semibold border border-slate-200 text-[10px]">
                    {c.section}
                  </span>
                </td>
                <td className="p-2 text-center border-e border-slate-200 font-mono text-slate-600 text-[11px]">
                  {c.birthDate}
                </td>
                <td className="p-2 text-center border-e border-slate-200 bg-blue-50/30">
                  <div className="font-bold text-slate-900 font-mono">{c.registrationFee.toLocaleString()} دج</div>
                  <button
                    onClick={() => handleOpenVoucher(c, { paid: c.registrationFee, receipt: c.regReceipt }, 'حقوق التسجيل')}
                    className="text-[9px] text-blue-800 hover:underline font-bold font-mono block mx-auto"
                  >
                    {c.regReceipt}
                  </button>
                </td>
                <td className="p-2 text-end border-e border-slate-200 font-mono text-slate-700">
                  {c.monthlyDue.toLocaleString()} دج
                </td>

                {/* 9 Months Columns */}
                {months9.map((m) => {
                  const mData = c.months?.[m.id];
                  const hasPaid = mData && mData.paid > 0;
                  return (
                    <td key={m.id} className="p-1.5 text-center border-e border-slate-200 font-mono text-[11px]">
                      {hasPaid ? (
                        <div>
                          <div className="font-bold text-emerald-800">{mData.paid.toLocaleString()} دج</div>
                          {mData.receipt && (
                            <button
                              onClick={() => handleOpenVoucher(c, mData, m.label)}
                              className="text-[9px] text-blue-900 hover:underline font-bold block mx-auto"
                            >
                              {mData.receipt}
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  );
                })}

                <td className="p-2 text-end border-e border-slate-200 font-mono font-bold text-emerald-800 text-sm bg-slate-50/50">
                  {c.totalPaid.toLocaleString()} دج
                </td>
                <td className="p-2 text-end font-mono font-bold">
                  {c.remaining > 0 ? (
                    <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-[2px]">
                      {c.remaining.toLocaleString()} دج
                    </span>
                  ) : (
                    <span className="text-emerald-700">0 دج ✓</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">تسجيل طفل في القسم التحضيري المدرسي</span>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveChild} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">الاسم واللقب الكامل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: يحيى عمراوي"
                  value={newChild.fullName}
                  onChange={(e) => setNewChild({ ...newChild, fullName: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الفئة / القسم *</label>
                  <select
                    value={newChild.section}
                    onChange={(e) => setNewChild({ ...newChild, section: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                  >
                    <option value="القسم التحضيري أ">القسم التحضيري أ</option>
                    <option value="القسم التحضيري ب">القسم التحضيري ب</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">تاريخ الميلاد *</label>
                  <input
                    type="date"
                    required
                    value={newChild.birthDate}
                    onChange={(e) => setNewChild({ ...newChild, birthDate: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">حقوق التسجيل (دج) *</label>
                  <input
                    type="number"
                    value={newChild.registrationFee}
                    onChange={(e) => setNewChild({ ...newChild, registrationFee: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">رقم وصل التسجيل المبدئي</label>
                  <input
                    type="text"
                    placeholder="REC-PRP-REG-..."
                    value={newChild.regReceipt}
                    onChange={(e) => setNewChild({ ...newChild, regReceipt: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">المبلغ المستحق شهرياً (دج) *</label>
                <input
                  type="number"
                  value={newChild.monthlyDue}
                  onChange={(e) => setNewChild({ ...newChild, monthlyDue: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
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
                  حفظ وتسجيل الطفل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      <ReceiptVoucherModal
        isOpen={!!selectedVoucher}
        onClose={() => setSelectedVoucher(null)}
        voucherData={selectedVoucher}
      />
    </StandardViewLayout>
  );
}
