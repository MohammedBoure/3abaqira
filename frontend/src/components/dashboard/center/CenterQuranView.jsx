import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Users,
  Coins,
  CreditCard,
  CheckCircle,
  FileText,
  Plus,
  X,
} from 'lucide-react';
import { StandardViewLayout } from '../common/StandardViewLayout';
import { ReceiptVoucherModal } from '../common/ReceiptVoucherModal';
import { MOCK_CENTER_QURAN } from '../../../mock/centerMockData';

export function CenterQuranView() {
  const [students, setStudents] = useState(MOCK_CENTER_QURAN);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  const monthsKeys = [
    { id: 'jan', label: 'جانفي' },
    { id: 'feb', label: 'فيفري' },
    { id: 'mar', label: 'مارس' },
    { id: 'apr', label: 'أفريل' },
    { id: 'may', label: 'ماي' },
    { id: 'jun', label: 'جوان' },
  ];

  const [newEntry, setNewEntry] = useState({
    fullName: '',
    teacher: 'الشيخ الطاهر مقلاتي',
    cohort: 'فوج الجمعة والسبت صباحاً',
    monthlyFee: 2500,
    janPaid: 2500,
    janReceipt: '',
  });

  // 1. KPI Calculations (Section 3.2.6)
  const totalStudents = students.length;
  const totalCollected = students.reduce((acc, s) => acc + s.totalPaid, 0);
  const febCollected = students.reduce((acc, s) => acc + (s.months?.feb?.paid || 0), 0);
  const vouchersCount = students.reduce((acc, s) => {
    let count = 0;
    monthsKeys.forEach((m) => {
      if (s.months?.[m.id]?.receipt) count++;
    });
    return acc + count;
  }, 0);

  const kpiCards = [
    {
      label: 'إجمالي حفظة القرآن المسجلين',
      value: `${totalStudents} طالب`,
      icon: BookOpen,
      subtext: 'موزعين عبر فترات الجمعة والسبت',
      change: 'منتظم',
      isPositive: true,
    },
    {
      label: 'المحصل الإجمالي للفصل (جانفي - جوان)',
      value: `${totalCollected.toLocaleString()} دج`,
      icon: Coins,
      subtext: 'تجميع آلي لمداخيل الاشتراكات',
      change: 'مقبوض بالخزينة',
      isPositive: true,
    },
    {
      label: 'تحصيل الشهر الجاري (فيفري)',
      value: `${febCollected.toLocaleString()} دج`,
      icon: CreditCard,
      subtext: 'اشتراك شهري محدد بـ 2,500 دج',
      change: '100% نسبة الالتزام',
      isPositive: true,
    },
    {
      label: 'وصولات السداد المصدرة المعتمدة',
      value: `${vouchersCount} وصل`,
      icon: CheckCircle,
      subtext: 'إيصالات رسمية صادرة لأولياء الأمور',
      change: 'موثقة بدقة',
      isPositive: true,
    },
  ];

  // 2. Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      return (
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.cohort.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [students, searchTerm]);

  // 3. Add Student
  const handleSaveStudent = (e) => {
    e.preventDefault();
    if (!newEntry.fullName.trim()) return;

    const seq = students.length + 1;
    const janAmount = Number(newEntry.janPaid) || 0;

    const entry = {
      id: `QRN-${Date.now()}`,
      seq: seq,
      fullName: newEntry.fullName.trim(),
      teacher: newEntry.teacher,
      cohort: newEntry.cohort,
      monthlyFee: Number(newEntry.monthlyFee) || 2500,
      months: {
        jan: { paid: janAmount, receipt: newEntry.janReceipt || `REC-QRN-26-${seq}` },
        feb: { paid: 0, receipt: '' },
        mar: { paid: 0, receipt: '' },
        apr: { paid: 0, receipt: '' },
        may: { paid: 0, receipt: '' },
        jun: { paid: 0, receipt: '' },
      },
      totalPaid: janAmount,
    };

    setStudents([...students, entry]);
    setIsModalOpen(false);
  };

  const handleOpenVoucher = (student, mData, monthName) => {
    setSelectedVoucher({
      receiptNumber: mData.receipt,
      payerName: student.fullName,
      category: `تحفيظ القرآن الكريم - اشتراك شهر ${monthName}`,
      amount: mData.paid,
      paymentMethod: 'نقداً (خزينة المركز)',
      branch: 'المركز الأكاديمي والتعليمي',
      notes: `المؤطر: ${student.teacher} - ${student.cohort}`,
    });
  };

  return (
    <StandardViewLayout
      titleAr="برنامج تحفيظ القرآن الكريم (الفصل السداسي)"
      titleEn="Quran Memorization Semester Registry (Jan - Jun Tracking)"
      description="متابعة اشتراكات حفظة القرآن الكريم للفترة السداسية (جانفي إلى جوان)، مع خانة مخصصة للمبلغ المقبوض ورقم وصل السداد لكل شهر، وتجميع آلي للمداخيل."
      entityTag="الأنشطة التخصصية والنوادي"
      branchCode="CENTER"
      kpiCards={kpiCards}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="ابحث باسم الحافظ، الأستاذ أو الفوج..."
      actionButtonLabel="+ تسجيل مشترك في القرآن"
      onActionButtonClick={() => setIsModalOpen(true)}
      exportFileName="center_quran_students"
      exportData={filteredStudents.map((s) => ({
        'الرقم': s.seq,
        'الاسم واللقب': s.fullName,
        'المعلم': s.teacher,
        'الفوج': s.cohort,
        'جانفي': `${s.months?.jan?.paid || 0} دج (${s.months?.jan?.receipt || '-'})`,
        'فيفري': `${s.months?.feb?.paid || 0} دج (${s.months?.feb?.receipt || '-'})`,
        'مارس': `${s.months?.mar?.paid || 0} دج (${s.months?.mar?.receipt || '-'})`,
        'أفريل': `${s.months?.apr?.paid || 0} دج (${s.months?.apr?.receipt || '-'})`,
        'ماي': `${s.months?.may?.paid || 0} دج (${s.months?.may?.receipt || '-'})`,
        'جوان': `${s.months?.jun?.paid || 0} دج (${s.months?.jun?.receipt || '-'})`,
        'مجموع المحصل': s.totalPaid,
      }))}
    >
      <div className="overflow-x-auto max-h-[580px]">
        <table className="w-full text-start text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-300 text-slate-700 font-bold select-none">
            <tr>
              <th className="p-2.5 text-center border-e border-slate-200 w-10">#</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[150px]">الاسم واللقب</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[140px]">المعلم والمشرف</th>

              {/* 6 Months (Jan - Jun): Each month has 2 sub-columns (Amount + Receipt) */}
              {monthsKeys.map((m) => (
                <th key={m.id} className="p-2 text-center border-e border-slate-200 min-w-[125px]">
                  {m.label} (المبلغ + الوصل)
                </th>
              ))}

              <th className="p-2.5 text-end min-w-[120px] text-emerald-800 bg-slate-50">
                مجموع المحصل (تجميع آلي)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {filteredStudents.map((s) => (
              <tr key={s.id} className="hover:bg-blue-50/40 transition-colors">
                <td className="p-2.5 text-center border-e border-slate-200 font-mono text-slate-400 font-bold">
                  {s.seq}
                </td>
                <td className="p-2.5 border-e border-slate-200 font-bold text-slate-900">
                  {s.fullName}
                  <span className="text-[10px] text-slate-500 font-normal block">{s.cohort}</span>
                </td>
                <td className="p-2.5 border-e border-slate-200 text-slate-700 font-medium">
                  {s.teacher}
                </td>

                {/* 6 Months */}
                {monthsKeys.map((m) => {
                  const mData = s.months?.[m.id];
                  const hasPaid = mData && mData.paid > 0;
                  return (
                    <td key={m.id} className="p-2 text-center border-e border-slate-200 font-mono text-[11px]">
                      {hasPaid ? (
                        <div>
                          <div className="font-bold text-emerald-800">{mData.paid.toLocaleString()} دج</div>
                          <button
                            onClick={() => handleOpenVoucher(s, mData, m.label)}
                            className="text-[9px] text-blue-900 hover:underline font-bold block mx-auto"
                            title="معاينة وطباعة الوصل"
                          >
                            {mData.receipt}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  );
                })}

                {/* Auto Calculated Sum */}
                <td className="p-2.5 text-end font-mono font-bold text-emerald-800 text-sm bg-slate-50/50">
                  {s.totalPaid.toLocaleString()} دج
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 font-mono text-xs">
            <tr>
              <td colSpan={3} className="p-2.5 text-start font-sans">
                المجموع العام لكافة حفظة القرآن الكريم
              </td>
              <td colSpan={6} className="p-2.5 text-center font-sans text-slate-500 text-[11px]">
                متابعة الأشهر الستة للفصل السداسي
              </td>
              <td className="p-2.5 text-end text-emerald-800 text-sm font-bold">
                {totalCollected.toLocaleString()} دج
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
              <span className="font-bold text-slate-900 text-sm">تسجيل حافظ جديد بالبرنامج القرآني</span>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">الاسم واللقب الكامل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: يحيى بوزيان"
                  value={newEntry.fullName}
                  onChange={(e) => setNewEntry({ ...newEntry, fullName: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المعلم المشرف *</label>
                  <select
                    value={newEntry.teacher}
                    onChange={(e) => setNewEntry({ ...newEntry, teacher: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                  >
                    <option value="الشيخ الطاهر مقلاتي">الشيخ الطاهر مقلاتي</option>
                    <option value="الشيخة عائشة قديد">الشيخة عائشة قديد</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الفوج والتوقيت *</label>
                  <input
                    type="text"
                    value={newEntry.cohort}
                    onChange={(e) => setNewEntry({ ...newEntry, cohort: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">مبلغ السداد الأولي (دج)</label>
                  <input
                    type="number"
                    value={newEntry.janPaid}
                    onChange={(e) => setNewEntry({ ...newEntry, janPaid: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono font-bold text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">رقم وصل السداد</label>
                  <input
                    type="text"
                    placeholder="REC-QRN-26-..."
                    value={newEntry.janReceipt}
                    onChange={(e) => setNewEntry({ ...newEntry, janReceipt: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                  />
                </div>
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
