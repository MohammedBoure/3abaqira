import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Users,
  Coins,
  Medal,
  Plus,
  X,
  FileText,
} from 'lucide-react';
import { StandardViewLayout } from '../common/StandardViewLayout';
import { ReceiptVoucherModal } from '../common/ReceiptVoucherModal';
import { MOCK_CENTER_CHAMPIONSHIPS } from '../../../mock/centerMockData';

export function CenterSorobanChampionshipsView() {
  const [contestants, setContestants] = useState(MOCK_CENTER_CHAMPIONSHIPS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  const [newContestant, setNewContestant] = useState({
    contestantName: '',
    categoryLevel: 'المستوى p2 - البطولة الولائية',
    regFee: 4500,
    receiptNumber: '',
    confirmedPaid: 4500,
    notes: '',
  });

  // 1. KPI Calculations (Section 3.2.9)
  const totalContestants = contestants.length;
  const totalFees = contestants.reduce((acc, c) => acc + c.regFee, 0);
  const totalCollected = contestants.reduce((acc, c) => acc + c.confirmedPaid, 0);
  const nationalQualifiers = contestants.filter((c) => c.categoryLevel.includes('الوطنية')).length;

  const kpiCards = [
    {
      label: 'عدد المتنافسين المسجلين بالبطولات',
      value: `${totalContestants} متسابق`,
      icon: Trophy,
      subtext: 'البطولة الولائية والبطولة الوطنية',
      change: 'مشاركات رسمية',
      isPositive: true,
    },
    {
      label: 'إجمالي رسوم البطولة المستحقة',
      value: `${totalFees.toLocaleString()} دج`,
      icon: Coins,
      subtext: 'شاملة حقوق التحكيم والميداليات',
      change: 'مستحق',
      isPositive: true,
    },
    {
      label: 'المبالغ المحصلة والمؤكدة (دج)',
      value: `${totalCollected.toLocaleString()} دج`,
      icon: Medal,
      subtext: 'مربوطة بوصولات قبض رسمية',
      change: '100% محصل',
      isPositive: true,
    },
    {
      label: 'المؤهلون للبطولة الوطنية بالجزائر',
      value: `${nationalQualifiers} أبطال`,
      icon: Users,
      subtext: 'تمثيل الأكاديمية على المستوى الوطني',
      change: 'مؤهل رسمي',
      isPositive: true,
    },
  ];

  // 2. Filter
  const filteredContestants = useMemo(() => {
    return contestants.filter((c) => {
      return (
        c.contestantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.categoryLevel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.notes.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [contestants, searchTerm]);

  // 3. Add Contestant
  const handleSaveContestant = (e) => {
    e.preventDefault();
    if (!newContestant.contestantName.trim()) return;

    const seq = contestants.length + 1;
    const entry = {
      seq: seq,
      contestantName: newContestant.contestantName.trim(),
      categoryLevel: newContestant.categoryLevel,
      regFee: Number(newContestant.regFee) || 4500,
      receiptNumber: newContestant.receiptNumber || `REC-CHAMP-26-${seq}`,
      confirmedPaid: Number(newContestant.confirmedPaid) || 4500,
      notes: newContestant.notes || 'مشارك مؤكد',
    };

    setContestants([...contestants, entry]);
    setIsModalOpen(false);
  };

  const handleOpenVoucher = (c) => {
    setSelectedVoucher({
      receiptNumber: c.receiptNumber,
      payerName: c.contestantName,
      category: `بطولة السوروبان والحساب الذهني (${c.categoryLevel})`,
      amount: c.confirmedPaid,
      paymentMethod: 'نقداً (خزينة المركز)',
      branch: 'المركز الأكاديمي والتعليمي',
      notes: c.notes,
    });
  };

  return (
    <StandardViewLayout
      titleAr="سجل بطولات السوروبان (البطولة الولائية والبطولة الوطنية)"
      titleEn="Soroban Competitions, Provincial & National Championships"
      description="إدارة ومتابعة قيد المتنافسين في البطولات الرسمية للحساب الذهني (ولائياً ووطنياً)، توثيق رسوم المشاركة وتأكيد وصولات القبض المالي وملاحظات التتويج والتكريم."
      entityTag="الأنشطة التخصصية والنوادي"
      branchCode="CENTER"
      kpiCards={kpiCards}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="ابحث باسم المتسابق، الفئة أو البطولة..."
      actionButtonLabel="+ قيد متسابق في البطولة"
      onActionButtonClick={() => setIsModalOpen(true)}
      exportFileName="center_soroban_championships"
      exportData={filteredContestants.map((c) => ({
        'الرقم التسلسلي': c.seq,
        'اسم المتسابق': c.contestantName,
        'الفئة والمستوى': c.categoryLevel,
        'رسوم التسجيل': c.regFee,
        'رقم الوصل': c.receiptNumber,
        'المبلغ المحصل': c.confirmedPaid,
        'ملاحظات': c.notes,
      }))}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-start text-xs border-collapse">
          <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold select-none">
            <tr>
              <th className="p-2.5 text-center border-e border-slate-200 w-12">#</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[160px]">اسم المتسابق البطل</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[200px]">الفئة والمستوى التنافسي</th>
              <th className="p-2.5 text-end border-e border-slate-200 min-w-[130px] bg-slate-50">
                رسوم التسجيل المستحقة
              </th>
              <th className="p-2.5 text-center border-e border-slate-200 min-w-[140px]">رقم الوصل المالي</th>
              <th className="p-2.5 text-end border-e border-slate-200 min-w-[130px] text-emerald-800">
                المبلغ المحصل المؤكد
              </th>
              <th className="p-2.5 text-start min-w-[260px]">ملاحظات التكريم والمشاركة</th>
              <th className="p-2.5 text-center min-w-[80px] print:hidden">وصل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {filteredContestants.map((c) => (
              <tr key={c.seq} className="hover:bg-blue-50/40 transition-colors">
                <td className="p-2.5 text-center border-e border-slate-200 font-mono text-slate-400 font-bold">
                  {c.seq}
                </td>
                <td className="p-2.5 border-e border-slate-200 font-bold text-slate-900 text-sm">
                  {c.contestantName}
                </td>
                <td className="p-2.5 border-e border-slate-200 font-semibold text-blue-950">
                  {c.categoryLevel}
                </td>
                <td className="p-2.5 text-end border-e border-slate-200 font-mono font-bold text-slate-900 bg-slate-50/50">
                  {c.regFee.toLocaleString()} دج
                </td>
                <td className="p-2.5 text-center border-e border-slate-200 font-mono font-bold text-blue-900">
                  <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-[2px]">
                    {c.receiptNumber}
                  </span>
                </td>
                <td className="p-2.5 text-end border-e border-slate-200 font-mono font-bold text-emerald-800 text-sm">
                  {c.confirmedPaid.toLocaleString()} دج
                </td>
                <td className="p-2.5 border-e border-slate-200 text-slate-600">
                  {c.notes}
                </td>
                <td className="p-2.5 text-center print:hidden">
                  <button
                    onClick={() => handleOpenVoucher(c)}
                    className="px-2 py-1 bg-slate-100 hover:bg-blue-50 text-blue-900 font-medium text-[10px] flex items-center gap-1 border border-slate-200 transition-colors mx-auto"
                  >
                    <FileText className="w-3 h-3" />
                    <span>سند</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 font-mono">
            <tr>
              <td colSpan={3} className="p-2.5 text-start font-sans text-xs border-e border-slate-200">
                المجموع العام لرسوم البطولات
              </td>
              <td className="p-2.5 text-end border-e border-slate-200 text-slate-900">
                {totalFees.toLocaleString()} دج
              </td>
              <td className="p-2.5 text-center font-sans text-slate-500 text-[11px] border-e border-slate-200">
                مؤكدة الوصولات
              </td>
              <td className="p-2.5 text-end border-e border-slate-200 text-emerald-800 text-sm font-bold">
                {totalCollected.toLocaleString()} دج
              </td>
              <td colSpan={2} className="p-2.5 font-sans text-[11px] text-slate-500">
                {contestants.length} متسابقين مؤهلين رسمياً
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
              <span className="font-bold text-slate-900 text-sm">قيد متسابق في بطولة السوروبان</span>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveContestant} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">اسم المتسابق البطل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: محمد بلقاسم"
                  value={newContestant.contestantName}
                  onChange={(e) => setNewContestant({ ...newContestant, contestantName: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">الفئة والمستوى التنافسي *</label>
                <select
                  value={newContestant.categoryLevel}
                  onChange={(e) => setNewContestant({ ...newContestant, categoryLevel: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                >
                  <option value="المستوى p1 - بطولة البراعم">المستوى p1 - بطولة البراعم</option>
                  <option value="المستوى p2 - البطولة الولائية">المستوى p2 - البطولة الولائية</option>
                  <option value="المستوى p5 - البطولة الولائية">المستوى p5 - البطولة الولائية</option>
                  <option value="المستوى j2 - البطولة الوطنية (الجزائر)">المستوى j2 - البطولة الوطنية (الجزائر)</option>
                  <option value="المستوى s6 - البطولة الوطنية الكبرى">المستوى s6 - البطولة الوطنية الكبرى</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">رسوم التسجيل المستحقة (دج) *</label>
                  <input
                    type="number"
                    required
                    value={newContestant.regFee}
                    onChange={(e) => setNewContestant({ ...newContestant, regFee: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المبلغ المحصل المؤكد (دج) *</label>
                  <input
                    type="number"
                    required
                    value={newContestant.confirmedPaid}
                    onChange={(e) => setNewContestant({ ...newContestant, confirmedPaid: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">رقم الوصل المالي</label>
                <input
                  type="text"
                  placeholder="REC-CHAMP-26-..."
                  value={newContestant.receiptNumber}
                  onChange={(e) => setNewContestant({ ...newContestant, receiptNumber: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ملاحظات المشاركة والتتويج</label>
                <input
                  type="text"
                  placeholder="تأهل، تكريم أو رتبة..."
                  value={newContestant.notes}
                  onChange={(e) => setNewContestant({ ...newContestant, notes: e.target.value })}
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
                  حفظ المتسابق
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
