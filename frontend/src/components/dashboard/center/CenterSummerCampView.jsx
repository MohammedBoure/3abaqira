import React, { useState, useMemo } from 'react';
import {
  Sun,
  Users,
  Coins,
  CreditCard,
  CheckCircle,
  Plus,
  X,
  FileText,
} from 'lucide-react';
import { StandardViewLayout } from '../common/StandardViewLayout';
import { ReceiptVoucherModal } from '../common/ReceiptVoucherModal';
import { MOCK_CENTER_SUMMER_CAMP } from '../../../mock/centerMockData';

export function CenterSummerCampView() {
  const [participants, setParticipants] = useState(MOCK_CENTER_SUMMER_CAMP);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  const [newParticipant, setNewParticipant] = useState({
    fullName: '',
    activity: 'مخيم المبتكر الصغير + السباحة',
    totalAgreed: 25000,
    inst1: 15000,
    inst1Receipt: '',
    notes: '',
  });

  // 1. KPI Calculations (Section 3.2.8)
  const totalCampers = participants.length;
  const totalAgreedAll = participants.reduce((acc, p) => acc + p.totalAgreed, 0);
  const totalCollected = participants.reduce((acc, p) => acc + p.totalPaid, 0);
  const totalDebts = participants.reduce((acc, p) => acc + p.remaining, 0);

  const kpiCards = [
    {
      label: 'إجمالي منخرطي المخيم والنادي الصيفي',
      value: `${totalCampers} مشارك`,
      icon: Sun,
      subtext: 'مخيمات المبتكر الصغير والسباحة والمسرح',
      change: 'موسم 2025/2026',
      isPositive: true,
    },
    {
      label: 'التكلفة الكلية المستحقة (دج)',
      value: `${totalAgreedAll.toLocaleString()} دج`,
      icon: Coins,
      subtext: 'إجمالي اشتراكات الأنشطة الصيفية',
      change: 'مستحق',
      isPositive: true,
    },
    {
      label: 'المبالغ المحصلة (دفعة 1 و 2)',
      value: `${totalCollected.toLocaleString()} دج`,
      icon: CreditCard,
      subtext: `${totalAgreedAll > 0 ? Math.round((totalCollected / totalAgreedAll) * 100) : 0}% نسبة السداد`,
      change: 'مقبوض بالخزينة',
      isPositive: true,
    },
    {
      label: 'الديون والمتبقيات بالدفعة 2',
      value: `${totalDebts.toLocaleString()} دج`,
      icon: CheckCircle,
      subtext: 'تستحق مع انطلاق الفوج الثاني',
      change: totalDebts > 0 ? 'متبقي' : '0 دج ✓',
      isPositive: totalDebts === 0,
    },
  ];

  // 2. Filter
  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      return (
        p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.activity.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [participants, searchTerm]);

  // 3. Add Participant
  const handleSaveParticipant = (e) => {
    e.preventDefault();
    if (!newParticipant.fullName.trim()) return;

    const seq = participants.length + 1;
    const total = Number(newParticipant.totalAgreed) || 0;
    const i1 = Number(newParticipant.inst1) || 0;

    const entry = {
      id: `CMP-${Date.now()}`,
      seq: seq,
      fullName: newParticipant.fullName.trim(),
      activity: newParticipant.activity,
      totalAgreed: total,
      inst1: { amount: i1, receipt: newParticipant.inst1Receipt || `REC-CMP-26-${seq}` },
      inst2: { amount: 0, receipt: '' },
      totalPaid: i1,
      remaining: total - i1,
      notes: newParticipant.notes || 'تسجيل صيفي جديد',
    };

    setParticipants([...participants, entry]);
    setIsModalOpen(false);
  };

  const handleOpenVoucher = (p, instData, num) => {
    setSelectedVoucher({
      receiptNumber: instData.receipt,
      payerName: p.fullName,
      category: `${p.activity} - الدفعة ${num}`,
      amount: instData.amount,
      paymentMethod: 'نقداً (خزينة المركز)',
      branch: 'المركز الأكاديمي والتعليمي',
      notes: `المتبقي: ${p.remaining.toLocaleString()} دج`,
    });
  };

  return (
    <StandardViewLayout
      titleAr="النادي والمخيم الصيفي (نظام دفعتين)"
      titleEn="Summer Camp & Youth Academy (2-Installment Financial Model)"
      description="متابعة تسجيلات واشتراكات أنشطة المخيم والنادي الصيفي (سباحة، فنون، مهارات، لغات) بنظام الدفعتين الماليتين حصراً، مع تتبع أرقام الوصولات والمتبقيات."
      entityTag="الأنشطة التخصصية والنوادي"
      branchCode="CENTER"
      kpiCards={kpiCards}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="ابحث باسم المشترك في المخيم أو النشاط..."
      actionButtonLabel="+ تسجيل منخرط في المخيم"
      onActionButtonClick={() => setIsModalOpen(true)}
      exportFileName="center_summer_camp"
      exportData={filteredParticipants.map((p) => ({
        'الرقم': p.seq,
        'الاسم واللقب': p.fullName,
        'النشاط / النادي': p.activity,
        'التكلفة الكلية': p.totalAgreed,
        'الدفعة 1': p.inst1.amount,
        'وصل 1': p.inst1.receipt,
        'الدفعة 2': p.inst2.amount,
        'وصل 2': p.inst2.receipt,
        'مجموع الدفعات': p.totalPaid,
        'الباقي': p.remaining,
        'ملاحظات': p.notes,
      }))}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-start text-xs border-collapse">
          <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold select-none">
            <tr>
              <th className="p-2.5 text-center border-e border-slate-200 w-12">#</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[160px]">الاسم واللقب</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[220px]">النشاط / النادي المسجل به</th>
              <th className="p-2.5 text-end border-e border-slate-200 min-w-[130px] bg-slate-50">
                التكلفة الكلية المستحقة
              </th>
              <th className="p-2 text-center border-e border-slate-200 min-w-[140px]">الدفعة الأولى + رقم الوصل</th>
              <th className="p-2 text-center border-e border-slate-200 min-w-[140px]">الدفعة الثانية + رقم الوصل</th>
              <th className="p-2.5 text-end border-e border-slate-200 min-w-[120px] text-emerald-800">
                مجموع الدفعات
              </th>
              <th className="p-2.5 text-end border-e border-slate-200 min-w-[110px]">الباقي (دين)</th>
              <th className="p-2.5 text-start min-w-[200px]">ملاحظات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {filteredParticipants.map((p) => (
              <tr key={p.id} className="hover:bg-blue-50/40 transition-colors">
                <td className="p-2.5 text-center border-e border-slate-200 font-mono text-slate-400 font-bold">
                  {p.seq}
                </td>
                <td className="p-2.5 border-e border-slate-200 font-bold text-slate-900">
                  {p.fullName}
                </td>
                <td className="p-2.5 border-e border-slate-200 font-semibold text-blue-950">
                  {p.activity}
                </td>
                <td className="p-2.5 text-end border-e border-slate-200 font-mono font-bold text-slate-900 bg-slate-50/50">
                  {p.totalAgreed.toLocaleString()} دج
                </td>
                <td className="p-2 text-center border-e border-slate-200 font-mono text-[11px]">
                  <div className="font-bold text-emerald-800">{p.inst1.amount.toLocaleString()} دج</div>
                  {p.inst1.receipt && (
                    <button
                      onClick={() => handleOpenVoucher(p, p.inst1, 1)}
                      className="text-[9px] text-blue-900 hover:underline font-bold block mx-auto"
                    >
                      {p.inst1.receipt}
                    </button>
                  )}
                </td>
                <td className="p-2 text-center border-e border-slate-200 font-mono text-[11px]">
                  <div className={p.inst2.amount > 0 ? 'font-bold text-emerald-800' : 'text-slate-400'}>
                    {p.inst2.amount > 0 ? `${p.inst2.amount.toLocaleString()} دج` : '0 دج'}
                  </div>
                  {p.inst2.receipt ? (
                    <button
                      onClick={() => handleOpenVoucher(p, p.inst2, 2)}
                      className="text-[9px] text-blue-900 hover:underline font-bold block mx-auto"
                    >
                      {p.inst2.receipt}
                    </button>
                  ) : (
                    <span className="text-[9px] text-slate-400 block">-</span>
                  )}
                </td>
                <td className="p-2.5 text-end border-e border-slate-200 font-mono font-bold text-emerald-800 text-sm">
                  {p.totalPaid.toLocaleString()} دج
                </td>
                <td className="p-2.5 text-end border-e border-slate-200 font-mono font-bold">
                  {p.remaining > 0 ? (
                    <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-[2px]">
                      {p.remaining.toLocaleString()} دج
                    </span>
                  ) : (
                    <span className="text-emerald-700">0 دج ✓</span>
                  )}
                </td>
                <td className="p-2.5 text-slate-600">
                  {p.notes}
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
              <span className="font-bold text-slate-900 text-sm">تسجيل منخرط في المخيم الصيفي</span>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveParticipant} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">الاسم واللقب الكامل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: يوسف العسكري"
                  value={newParticipant.fullName}
                  onChange={(e) => setNewParticipant({ ...newParticipant, fullName: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">النشاط أو النادي المسجل به *</label>
                <select
                  value={newParticipant.activity}
                  onChange={(e) => setNewParticipant({ ...newParticipant, activity: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                >
                  <option value="مخيم المبتكر الصغير + السباحة">مخيم المبتكر الصغير + السباحة</option>
                  <option value="نادي الفنون والمسرح والموسيقى">نادي الفنون والمسرح والموسيقى</option>
                  <option value="أولمبياد الحساب الذهني الصيفي">أولمبياد الحساب الذهني الصيفي</option>
                  <option value="نادي الإنجليزية الصيفي للمحادثة">نادي الإنجليزية الصيفي للمحادثة</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">التكلفة الكلية (دج) *</label>
                  <input
                    type="number"
                    required
                    value={newParticipant.totalAgreed}
                    onChange={(e) => setNewParticipant({ ...newParticipant, totalAgreed: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الدفعة الأولى المسددة (دج) *</label>
                  <input
                    type="number"
                    required
                    value={newParticipant.inst1}
                    onChange={(e) => setNewParticipant({ ...newParticipant, inst1: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">رقم وصل الدفعة الأولى</label>
                <input
                  type="text"
                  placeholder="REC-CMP-26-..."
                  value={newParticipant.inst1Receipt}
                  onChange={(e) => setNewParticipant({ ...newParticipant, inst1Receipt: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                />
              </div>

              {/* Auto Remaining Calculation */}
              <div className="p-2 bg-blue-50 border border-blue-200 flex justify-between items-center text-xs">
                <span className="text-slate-600 font-semibold">المبلغ المتبقي للدفعة الثانية:</span>
                <strong className="font-mono text-rose-700 font-bold text-sm">
                  {Math.max(
                    (Number(newParticipant.totalAgreed) || 0) - (Number(newParticipant.inst1) || 0),
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
                  حفظ وتسجيل المشترك
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
