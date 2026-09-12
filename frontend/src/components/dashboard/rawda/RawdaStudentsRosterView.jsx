import React, { useState, useMemo } from 'react';
import {
  Users,
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle,
  FileText,
  Edit2,
  Trash2,
  Archive,
  Eye,
  Plus,
  X,
  Sparkles,
} from 'lucide-react';
import { StandardViewLayout } from '../common/StandardViewLayout';
import { ReceiptVoucherModal } from '../common/ReceiptVoucherModal';
import { MOCK_RAWDA_STUDENTS, RAWDA_MONTHS } from '../../../mock/rawdaMockData';

export function RawdaStudentsRosterView() {
  const [students, setStudents] = useState(MOCK_RAWDA_STUDENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [ageFilter, setAgeFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [isCurrentMonthOnly, setIsCurrentMonthOnly] = useState(false);

  // Modals state
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [newStudentData, setNewStudentData] = useState({
    fullName: '',
    ageCategory: 'Bébé',
    guardianName: '',
    guardianPhone: '',
    hasAnnualOffer: false,
    registrationFee: 8000,
  });
  const [validationError, setValidationError] = useState('');

  // 1. KPI Calculations (Section 2.1)
  const totalStudents = students.length;
  const totalRegistrationRevenue = students.reduce((acc, s) => acc + (s.registrationFee || 0), 0);
  const currentMonthSubscriptions = students.reduce((acc, s) => {
    const feb = s.months?.feb;
    return acc + (feb && feb.paid ? feb.paid : 0);
  }, 0);
  const totalDebts = students.reduce((acc, s) => acc + (s.remainingBalance || 0), 0);

  const kpiCards = [
    {
      label: 'إجمالي الأطفال المسجلين',
      value: `${totalStudents} طفل`,
      icon: Users,
      subtext: 'موزعين على 10 قاعات وأفواج',
      change: '+6 هذا الموسم',
      isPositive: true,
    },
    {
      label: 'مداخيل حقوق التسجيل المحصلة',
      value: `${totalRegistrationRevenue.toLocaleString()} دج`,
      icon: CreditCard,
      subtext: 'القيمة القياسية: 8,000 دج / طفل',
      change: '100% مسدد',
      isPositive: true,
    },
    {
      label: 'اشتراكات الشهر الجاري (فيفري)',
      value: `${currentMonthSubscriptions.toLocaleString()} دج`,
      icon: Calendar,
      subtext: 'تحصيل الاشتراكات والخدمات الشهرية',
      change: 'منتظم',
      isPositive: true,
    },
    {
      label: 'المتأخرات والديون العالقة',
      value: `${totalDebts.toLocaleString()} دج`,
      icon: AlertCircle,
      subtext: 'اشتراكات غير مسددة قيد المتابعة',
      change: totalDebts > 0 ? 'مستحق' : '0 دج',
      isPositive: totalDebts === 0,
    },
  ];

  // 2. Search & Filter
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.guardianPhone.includes(searchTerm) ||
        (s.id && s.id.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchAge = ageFilter === 'ALL' || s.ageCategory === ageFilter;
      const matchPayment = paymentFilter === 'ALL' || s.paymentStatus === paymentFilter;
      return matchSearch && matchAge && matchPayment;
    });
  }, [students, searchTerm, ageFilter, paymentFilter]);

  // 3. Add Student Handler with Validation
  const handleSaveStudent = (e) => {
    e.preventDefault();
    if (!newStudentData.fullName.trim()) {
      setValidationError('يرجى كتابة الاسم واللقب الكامل للطفل');
      return;
    }

    const regFee = 8000;
    const annualOfferAmount = newStudentData.hasAnnualOffer ? 121500 : 0;
    const monthlyDue = newStudentData.hasAnnualOffer ? 0 : 14500;
    const seq = students.length + 1;
    const newId = `RWD-${String(seq).padStart(3, '0')}`;

    // Auto populate months
    const monthsObj = {};
    RAWDA_MONTHS.forEach((m) => {
      if (newStudentData.hasAnnualOffer) {
        monthsObj[m.id] = { paid: 0, status: 'عرض سنوي', receipt: `REC-RWD-ANN-${seq}` };
      } else {
        monthsObj[m.id] = { paid: 0, status: 'مستحق', receipt: '' };
      }
    });

    const newEntry = {
      id: newId,
      seqNumber: seq,
      ageCategory: newStudentData.ageCategory,
      fullName: newStudentData.fullName,
      registrationFee: regFee,
      annualOffer: annualOfferAmount,
      monthlyDue: monthlyDue,
      paymentStatus: newStudentData.hasAnnualOffer ? 'خالص كلياً' : 'مسدد شهرياً',
      guardianPhone: newStudentData.guardianPhone || '0550 00 00 00',
      guardianName: newStudentData.guardianName || 'ولي الأمر',
      room: newStudentData.ageCategory === 'Bébé' ? 'Bébé' : `${newStudentData.ageCategory} 1`,
      months: monthsObj,
      totalPaid: newStudentData.hasAnnualOffer ? 129500 : 8000,
      remainingBalance: 0,
    };

    setStudents([newEntry, ...students]);
    setIsNewStudentModalOpen(false);
    setNewStudentData({
      fullName: '',
      ageCategory: 'Bébé',
      guardianName: '',
      guardianPhone: '',
      hasAnnualOffer: false,
      registrationFee: 8000,
    });
    setValidationError('');
  };

  const handleOpenVoucher = (student) => {
    setSelectedVoucher({
      receiptNumber: `REC-RWD-26-${String(student.seqNumber).padStart(4, '0')}`,
      payerName: student.fullName,
      category: `روضة العباقرة - ${student.ageCategory}`,
      amount: student.annualOffer > 0 ? 129500 : (student.registrationFee + student.monthlyDue),
      paymentMethod: 'نقداً (صندوق الروضة)',
      branch: 'روضة وحضانة العباقرة',
      notes: student.annualOffer > 0 ? 'سداد العرض السنوي الشامل 2025 مع حقوق التسجيل' : 'سداد حقوق التسجيل واشتراك الشهر الجاري',
    });
  };

  return (
    <StandardViewLayout
      titleAr="سجل الأطفال والتسجيل السنوي والشهري"
      titleEn="Rawda Child Enrolment & 11-Month Subscriptions Registry"
      description="إدارة شاملة لملفات أطفال الحضانة والتعليم المبكر، متابعة سداد حقوق التسجيل (8,000 دج)، اشتراك العرض السنوي (121,500 دج)، وتتبع الأقساط الشهرية (14,500 دج) عبر شهور الموسم الـ 11."
      entityTag="شؤون الأطفال والتمدرس"
      branchCode="RAWDA"
      kpiCards={kpiCards}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="ابحث باسم الطفل، رقم الهاتف أو الرمز..."
      hasMonthToggle={true}
      isCurrentMonthOnly={isCurrentMonthOnly}
      onToggleMonthFilter={() => setIsCurrentMonthOnly(!isCurrentMonthOnly)}
      actionButtonLabel="+ تسجيل طفل جديد"
      onActionButtonClick={() => setIsNewStudentModalOpen(true)}
      exportFileName="rawda_students_roster"
      exportData={filteredStudents.map((s) => ({
        'الرقم': s.seqNumber,
        'فئة العمر': s.ageCategory,
        'الاسم واللقب': s.fullName,
        'حقوق التسجيل': s.registrationFee,
        'العرض السنوي': s.annualOffer,
        'المستحق شهرياً': s.monthlyDue,
        'المحصل الإجمالي': s.totalPaid,
        'الديون': s.remainingBalance,
        'حالة الدفع': s.paymentStatus,
        'الهاتف': s.guardianPhone,
      }))}
      filterSlot={
        <div className="flex items-center gap-1.5">
          <select
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value)}
            className="h-7 px-2 text-xs bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:border-blue-900"
          >
            <option value="ALL">كافة فئات العمر</option>
            <option value="Bébé">Bébé (الرضع)</option>
            <option value="Petit Section">Petit Section (الصغار)</option>
            <option value="Moyen Section">Moyen Section (المتوسطين)</option>
            <option value="Grand Section">Grand Section (الكبار)</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="h-7 px-2 text-xs bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:border-blue-900"
          >
            <option value="ALL">كافة حالات الدفع</option>
            <option value="خالص كلياً">خالص كلياً (عرض سنوي)</option>
            <option value="مسدد شهرياً">مسدد شهرياً (منتظم)</option>
            <option value="توجد ديون">توجد ديون ومتأخرات</option>
          </select>
        </div>
      }
    >
      {/* Interactive Data Table */}
      <div className="overflow-x-auto max-h-[580px]">
        <table className="w-full text-start text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-300 text-slate-700 font-bold select-none">
            <tr>
              <th className="p-2.5 text-center border-e border-slate-200 w-10">#</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[110px]">فئة العمر</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[150px]">الاسم واللقب</th>
              <th className="p-2.5 text-end border-e border-slate-200 min-w-[90px]">حقوق التسجيل</th>
              <th className="p-2.5 text-end border-e border-slate-200 min-w-[105px]">العرض السنوي</th>
              <th className="p-2.5 text-end border-e border-slate-200 min-w-[100px]">المستحق شهرياً</th>

              {/* 11 Months columns or current month */}
              {isCurrentMonthOnly ? (
                <th className="p-2.5 text-center border-e border-slate-200 min-w-[110px] bg-blue-50 text-blue-900">
                  شهر فيفري (الحالي)
                </th>
              ) : (
                RAWDA_MONTHS.map((m) => (
                  <th key={m.id} className="p-2 text-center border-e border-slate-200 min-w-[65px] font-mono text-[11px]">
                    {m.shortAr}
                  </th>
                ))
              )}

              <th className="p-2.5 text-center border-e border-slate-200 min-w-[90px]">حالة الدفع</th>
              <th className="p-2.5 text-end border-e border-slate-200 min-w-[85px]">الديون (دج)</th>
              <th className="p-2.5 text-center min-w-[110px] print:hidden">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800 font-sans">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={isCurrentMonthOnly ? 9 : 19} className="p-8 text-center text-slate-400">
                  لا توجد نتائج مطابقة لمعايير البحث الحالية
                </td>
              </tr>
            ) : (
              filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="p-2 text-center border-e border-slate-200 font-mono text-slate-500 font-bold">
                    {s.seqNumber}
                  </td>
                  <td className="p-2 border-e border-slate-200">
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded-[2px] ${
                        s.ageCategory === 'Bébé'
                          ? 'bg-pink-100 text-pink-800'
                          : s.ageCategory === 'Petit Section'
                          ? 'bg-amber-100 text-amber-800'
                          : s.ageCategory === 'Moyen Section'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {s.ageCategory}
                    </span>
                  </td>
                  <td className="p-2 border-e border-slate-200 font-semibold text-slate-900">
                    <div>{s.fullName}</div>
                    <span className="text-[10px] font-mono text-slate-400 font-normal">{s.guardianPhone}</span>
                  </td>
                  <td className="p-2 text-end border-e border-slate-200 font-mono">
                    {s.registrationFee ? `${s.registrationFee.toLocaleString()} دج` : '-'}
                  </td>
                  <td className="p-2 text-end border-e border-slate-200 font-mono">
                    {s.annualOffer > 0 ? (
                      <span className="text-emerald-700 font-bold">121,500 دج</span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="p-2 text-end border-e border-slate-200 font-mono">
                    {s.monthlyDue > 0 ? `${s.monthlyDue.toLocaleString()} دج` : <span className="text-slate-400">0 دج (سنوي)</span>}
                  </td>

                  {/* Months breakdown */}
                  {isCurrentMonthOnly ? (
                    <td className="p-2 text-center border-e border-slate-200 bg-blue-50/40">
                      {s.annualOffer > 0 ? (
                        <span className="text-[10px] text-emerald-700 font-bold">عرض سنوي ✓</span>
                      ) : s.months?.feb?.status === 'مسدد' ? (
                        <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                          14,500 دج ✓
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 text-[10px] font-bold">
                          غير مسدد
                        </span>
                      )}
                    </td>
                  ) : (
                    RAWDA_MONTHS.map((m) => {
                      const mData = s.months?.[m.id];
                      const isPaid = mData?.status === 'مسدد' || s.annualOffer > 0;
                      return (
                        <td key={m.id} className="p-1.5 text-center border-e border-slate-200 font-mono text-[10px]">
                          {s.annualOffer > 0 ? (
                            <span className="text-emerald-700 font-bold" title="مشمول في العرض السنوي">✓</span>
                          ) : isPaid ? (
                            <span className="text-emerald-700 font-bold" title={`مسدد: ${mData?.paid} دج`}>✓</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      );
                    })
                  )}

                  <td className="p-2 text-center border-e border-slate-200">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold ${
                        s.paymentStatus === 'خالص كلياً'
                          ? 'bg-emerald-100 text-emerald-800'
                          : s.paymentStatus === 'مسدد شهرياً'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {s.paymentStatus}
                    </span>
                  </td>
                  <td className="p-2 text-end border-e border-slate-200 font-mono font-bold">
                    {s.remainingBalance > 0 ? (
                      <span className="text-rose-700">{s.remainingBalance.toLocaleString()} دج</span>
                    ) : (
                      <span className="text-emerald-700">0 دج</span>
                    )}
                  </td>
                  <td className="p-2 text-center print:hidden">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenVoucher(s)}
                        className="px-2 py-1 bg-slate-100 hover:bg-blue-50 text-blue-900 font-medium text-[10px] flex items-center gap-1 border border-slate-200 transition-colors"
                        title="معاينة وطباعة وصل استلام"
                      >
                        <FileText className="w-3 h-3" />
                        <span>وصل</span>
                      </button>
                      <button
                        className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                        title="تعديل السجل"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        className="p-1 hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors"
                        title="أرشفة السجل"
                      >
                        <Archive className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form: تسجيل طفل جديد (Section 4.3) */}
      {isNewStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-3 bg-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-300" />
                <span className="font-bold text-xs tracking-wide">تسجيل طفل جديد في روضة الأطفال</span>
              </div>
              <button
                onClick={() => setIsNewStudentModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-4 space-y-3.5 text-xs">
              {validationError && (
                <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {validationError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">الاسم واللقب الكامل للطفل *</label>
                  <input
                    type="text"
                    required
                    value={newStudentData.fullName}
                    onChange={(e) => setNewStudentData({ ...newStudentData, fullName: e.target.value })}
                    placeholder="مثال: يحيى بن مهيدي"
                    className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">فئة العمر والقسم *</label>
                  <select
                    value={newStudentData.ageCategory}
                    onChange={(e) => setNewStudentData({ ...newStudentData, ageCategory: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                  >
                    <option value="Bébé">Bébé (قسم الرضع)</option>
                    <option value="Petit Section">Petit Section (الصغار)</option>
                    <option value="Moyen Section">Moyen Section (المتوسطين)</option>
                    <option value="Grand Section">Grand Section (الكبار)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">رقم هاتف ولي الأمر *</label>
                  <input
                    type="tel"
                    required
                    value={newStudentData.guardianPhone}
                    onChange={(e) => setNewStudentData({ ...newStudentData, guardianPhone: e.target.value })}
                    placeholder="0550 00 00 00"
                    className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">اسم ولي الأمر</label>
                  <input
                    type="text"
                    value={newStudentData.guardianName}
                    onChange={(e) => setNewStudentData({ ...newStudentData, guardianName: e.target.value })}
                    placeholder="اسم الأب أو الأم"
                    className="w-full h-8 px-2.5 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                  />
                </div>
              </div>

              {/* Financial Auto-calculation Box */}
              <div className="p-3 bg-blue-50/60 border border-blue-200 space-y-2">
                <span className="font-bold text-blue-950 block">البيانات المالية المحتسبة تلقائياً:</span>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="annualOfferCheck"
                    checked={newStudentData.hasAnnualOffer}
                    onChange={(e) => setNewStudentData({ ...newStudentData, hasAnnualOffer: e.target.checked })}
                    className="w-4 h-4 text-blue-900 rounded border-slate-300"
                  />
                  <label htmlFor="annualOfferCheck" className="text-slate-800 font-medium cursor-pointer">
                    تفعيل اشتراك العرض السنوي 2025 (121,500 دج مسبقاً)
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-blue-200/80 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">حقوق التسجيل:</span>
                    <strong className="font-mono text-slate-900">8,000 دج</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">المبلغ المستحق شهرياً:</span>
                    <strong className="font-mono text-blue-900">
                      {newStudentData.hasAnnualOffer ? '0 دج (عرض سنوي)' : '14,500 دج'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">المبلغ الإجمالي الأولي:</span>
                    <strong className="font-mono text-emerald-800 font-bold">
                      {newStudentData.hasAnnualOffer ? '129,500 دج' : '22,500 دج'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewStudentModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
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

      {/* Formal Receipt Voucher Modal */}
      <ReceiptVoucherModal
        isOpen={!!selectedVoucher}
        onClose={() => setSelectedVoucher(null)}
        voucherData={selectedVoucher}
      />
    </StandardViewLayout>
  );
}
