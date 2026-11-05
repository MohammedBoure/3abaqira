import React, { useState } from 'react';
import {
  Tag,
  Coins,
  Percent,
  Search,
  Plus,
  ShieldCheck,
  AlertCircle,
  Building,
  UserCheck,
  Calendar,
  FileSpreadsheet,
  Clock,
  Printer,
  Sliders,
} from 'lucide-react';
import {
  MOCK_FINANCE_PRICING_PLANS,
  MOCK_PRICE_OVERRIDES,
  MOCK_KG_STUDENTS,
} from '../../../mock/geniusKindergartenFinanceMockData';

export function PricingPlanManagerView() {
  const [plans, setPlans] = useState(MOCK_FINANCE_PRICING_PLANS);
  const [overrides, setOverrides] = useState(MOCK_PRICE_OVERRIDES);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('PLANS'); // 'PLANS' or 'OVERRIDES'
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [selectedPlanForOverride, setSelectedPlanForOverride] = useState(MOCK_FINANCE_PRICING_PLANS[0]);
  const [overrideForm, setOverrideForm] = useState({
    studentId: '',
    overridePrice: '',
    mandatoryReason: '',
    staffAuthor: 'محمد بوري (المدير العام)',
  });
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleOpenOverrideModal = (plan) => {
    setSelectedPlanForOverride(plan);
    setOverrideForm({
      studentId: '',
      overridePrice: String(plan.listPrice),
      mandatoryReason: '',
      staffAuthor: 'محمد بوري (المدير العام)',
    });
    setIsOverrideModalOpen(true);
  };

  const handleSubmitOverride = (e) => {
    e.preventDefault();
    const student = MOCK_KG_STUDENTS.find((s) => s.id === overrideForm.studentId);
    if (!student) {
      alert('يرجى اختيار التلميذ');
      return;
    }
    const proposedPrice = parseFloat(overrideForm.overridePrice);
    if (isNaN(proposedPrice) || proposedPrice < 0) {
      alert('يرجى إدخال مبلغ صحيح');
      return;
    }
    if (!overrideForm.mandatoryReason.trim() || overrideForm.mandatoryReason.trim().length < 6) {
      alert('قاعدة النظام الإلزامية: يجب إدخال سبب وتبرير مفصل لخصم السعر (Reason is mandatory).');
      return;
    }

    const discountAmount = selectedPlanForOverride.listPrice - proposedPrice;
    const discountPercentage = Math.round((discountAmount / selectedPlanForOverride.listPrice) * 100);

    const createdOverride = {
      id: `OVR-2026-${String(overrides.length + 44).padStart(4, '0')}`,
      planId: selectedPlanForOverride.id,
      studentId: student.id,
      studentName: student.fullNameAr,
      listPrice: selectedPlanForOverride.listPrice,
      overridePrice: proposedPrice,
      discountAmount,
      discountPercentage,
      mandatoryReason: overrideForm.mandatoryReason,
      staffAuthor: overrideForm.staffAuthor,
      authorizedByRole: 'SUPER_ADMIN',
      createdAt: new Date().toLocaleString('ar-DZ', { hour12: false }),
    };

    setOverrides([createdOverride, ...overrides]);
    setIsOverrideModalOpen(false);
    triggerToast(`تم اعتماد السعر المخصص (${proposedPrice.toLocaleString()} دج) للتلميذ ${student.fullNameAr} وتوثيق السبب الرقابي.`);
    setActiveTab('OVERRIDES');
  };

  const filteredPlans = plans.filter(
    (p) =>
      p.nameAr.includes(searchQuery) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.branchType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-3 font-arabic text-slate-800">
      {/* 1. Header & Live Telemetry */}
      <div className="bg-white border border-slate-200 p-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 leading-none">
                  دليل الأسعار والخصومات المعتمدة (Pricing Plan & Dynamic Override Manager)
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 font-bold">
                  توثيق رقابي إلزامي لسبب التعديل
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                تعريف الخطط السنوية والشهرية، وسياسة تسعير الروضة والأكاديمية مع نافذة الخصم المخصص المقيد بمسؤول الاعتماد وتبرير الخصم.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-0.5 border border-slate-200">
              <button
                onClick={() => setActiveTab('PLANS')}
                className={`px-3 py-1 text-xs font-bold transition-colors ${
                  activeTab === 'PLANS'
                    ? 'bg-blue-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                دليل الخطط والتعريفات ({plans.length})
              </button>
              <button
                onClick={() => setActiveTab('OVERRIDES')}
                className={`px-3 py-1 text-xs font-bold transition-colors ${
                  activeTab === 'OVERRIDES'
                    ? 'bg-blue-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                سجل الخصومات والتعديلات الرقابية ({overrides.length})
              </button>
            </div>
            <button
              onClick={() => window.print()}
              className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>طباعة الدليل</span>
            </button>
          </div>
        </div>

        {/* 4 Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2 bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 block">خطط التسعير النشطة</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-slate-900">{plans.length}</span>
              <span className="text-[10px] text-slate-500 font-mono">روضة + مركز</span>
            </div>
          </div>
          <div className="p-2 bg-pink-50/50 border border-pink-200">
            <span className="text-[10px] font-bold text-pink-800 block">عرض الروضة السنوي الموحد</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-pink-900">121,500 دج</span>
              <span className="text-[10px] text-pink-700 font-bold">خصم 15% (شهر ونصف مجاناً)</span>
            </div>
          </div>
          <div className="p-2 bg-blue-50/50 border border-blue-200">
            <span className="text-[10px] font-bold text-blue-800 block">الاشتراك الشهري القياسي</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-blue-900">14,500 دج</span>
              <span className="text-[10px] text-blue-700">+ 8000 دج تسجيل سنوي</span>
            </div>
          </div>
          <div className="p-2 bg-amber-50/50 border border-amber-200">
            <span className="text-[10px] font-bold text-amber-800 block">الخصومات المخصصة المعتمدة</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-amber-900">{overrides.length}</span>
              <span className="text-[10px] text-amber-700 font-bold">موثقة بالأسباب والمسؤول</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Search Bar */}
      <div className="bg-white border border-slate-200 p-2 flex items-center justify-between gap-2 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute start-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في أسماء الخطط أو الأكواد..."
            className="w-full ps-8 pe-2 py-1 text-xs border border-slate-200 bg-slate-50/50"
          />
        </div>
        <div className="text-xs text-slate-500 font-mono">
          العملة الرسمية: <span className="font-bold text-slate-800">دينار جزائري (DZD)</span>
        </div>
      </div>

      {/* 3. Conditional Content */}
      {activeTab === 'PLANS' ? (
        <div className="bg-white border border-slate-200 overflow-hidden shadow-2xs">
          <table className="w-full text-start border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold select-none">
                <th className="py-2 px-2 text-center border-e border-slate-200 w-10">#</th>
                <th className="py-2 px-2.5 text-start border-e border-slate-200">الخطة والبرنامج التعليمي</th>
                <th className="py-2 px-2 text-center border-e border-slate-200">المقر / الفرع</th>
                <th className="py-2 px-2 text-center border-e border-slate-200">دورة الفوترة</th>
                <th className="py-2 px-2.5 text-end border-e border-slate-200 bg-blue-50/30">
                  السعر الرسمي المعتمد (List Price)
                </th>
                <th className="py-2 px-2.5 text-end border-e border-slate-200">رسوم التسجيل والتأمين</th>
                <th className="py-2 px-2.5 text-start border-e border-slate-200 min-w-[200px]">شروط الخطة والمزايا</th>
                <th className="py-2 px-2 text-center">إجراء الخصم المخصص</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPlans.map((plan, idx) => (
                <tr key={plan.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2 px-2 text-center font-mono text-slate-500 border-e border-slate-200">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-2.5 border-e border-slate-200 font-semibold text-slate-900">
                    <div className="flex flex-col">
                      <span>{plan.nameAr}</span>
                      <span className="text-[10px] font-mono text-slate-500 font-normal">{plan.code}</span>
                    </div>
                  </td>
                  <td className="py-2 px-2 text-center border-e border-slate-200">
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-bold border ${
                        plan.branchType === 'KINDERGARTEN'
                          ? 'bg-pink-50 text-pink-900 border-pink-200'
                          : 'bg-blue-50 text-blue-900 border-blue-200'
                      }`}
                    >
                      {plan.branchType === 'KINDERGARTEN' ? 'روضة الأطفال' : 'المركز الأكاديمي'}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center border-e border-slate-200 font-semibold text-slate-700">
                    {plan.billingCycle === 'YEARLY'
                      ? 'سنوي (11 شهر)'
                      : plan.billingCycle === 'MONTHLY'
                      ? 'شهري'
                      : plan.billingCycle === 'PER_LEVEL'
                      ? 'لكل مستوى'
                      : plan.billingCycle === 'TRIMESTER'
                      ? 'ثلاثي'
                      : 'سنوي لمرة واحدة'}
                  </td>
                  <td className="py-2 px-2.5 text-end border-e border-slate-200 font-mono font-bold text-blue-950 bg-blue-50/20 text-sm">
                    {plan.listPrice.toLocaleString()} دج
                  </td>
                  <td className="py-2 px-2.5 text-end border-e border-slate-200 font-mono text-slate-700">
                    {plan.standardRegistrationFee.toLocaleString()} دج
                  </td>
                  <td className="py-2 px-2.5 border-e border-slate-200 text-slate-600 text-[11px] leading-relaxed">
                    {plan.descriptionAr}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <button
                      onClick={() => handleOpenOverrideModal(plan)}
                      className="px-2.5 py-1 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 flex items-center justify-center gap-1 mx-auto shadow-2xs"
                    >
                      <Sliders className="w-3 h-3 text-amber-700" />
                      <span>خصم مخصص</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Overrides Audit Ledger */
        <div className="bg-white border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-2.5 bg-amber-50/40 border-b border-amber-200 text-xs text-amber-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-800 shrink-0" />
            <span>
              سجل الرقابة المالية: كل سعر مختلف عن التعريفة الرسمية يتطلب إجبارياً تبريراً مكتوباً وهوية الموظف المعتمد (Rule: Price Override Audit).
            </span>
          </div>

          <table className="w-full text-start border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold select-none">
                <th className="py-2 px-2 text-center border-e border-slate-200 w-10">#</th>
                <th className="py-2 px-2 text-center border-e border-slate-200 w-28">كود الخصم</th>
                <th className="py-2 px-2.5 text-start border-e border-slate-200">التلميذ المستفيد</th>
                <th className="py-2 px-2 text-end border-e border-slate-200">السعر الأصلي</th>
                <th className="py-2 px-2.5 text-end border-e border-slate-200 bg-emerald-50/40 text-emerald-950 font-bold">
                  السعر المعتمد (المخفض)
                </th>
                <th className="py-2 px-2 text-center border-e border-slate-200">نسبة الخصم</th>
                <th className="py-2 px-2.5 text-start border-e border-slate-200 min-w-[220px]">
                  السبب الإلزامي للخصم (Mandatory Reason)
                </th>
                <th className="py-2 px-2.5 text-start border-e border-slate-200">الموظف المعتمد للخصم</th>
                <th className="py-2 px-2 text-center font-mono">تاريخ التوثيق</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {overrides.map((ovr, idx) => (
                <tr key={ovr.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2 px-2 text-center font-mono text-slate-500 border-e border-slate-200">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-2 text-center font-mono font-bold text-slate-800 border-e border-slate-200">
                    {ovr.id}
                  </td>
                  <td className="py-2 px-2.5 border-e border-slate-200 font-bold text-slate-900">
                    {ovr.studentName}
                  </td>
                  <td className="py-2 px-2 text-end font-mono text-slate-500 line-through border-e border-slate-200">
                    {ovr.listPrice.toLocaleString()} دج
                  </td>
                  <td className="py-2 px-2.5 text-end font-mono font-bold text-emerald-800 bg-emerald-50/20 border-e border-slate-200 text-sm">
                    {ovr.overridePrice.toLocaleString()} دج
                  </td>
                  <td className="py-2 px-2 text-center border-e border-slate-200">
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      -{ovr.discountPercentage}%
                    </span>
                  </td>
                  <td className="py-2 px-2.5 border-e border-slate-200 font-semibold text-slate-800">
                    {ovr.mandatoryReason}
                  </td>
                  <td className="py-2 px-2.5 border-e border-slate-200 text-slate-700">
                    {ovr.staffAuthor}
                  </td>
                  <td className="py-2 px-2 text-center font-mono text-[10px] text-slate-500">
                    {ovr.createdAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Dynamic Price Override Modal */}
      {isOverrideModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-3">
          <div className="bg-white border border-slate-300 shadow-xl w-full max-w-lg p-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-800" />
                <h3 className="text-sm font-bold text-slate-900">
                  تعديل واعتماد خصم مخصص (Dynamic Price Override)
                </h3>
              </div>
              <button
                onClick={() => setIsOverrideModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitOverride} className="space-y-3 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">الخطة المختارة للتعديل:</span>
                <span className="font-bold text-slate-900 block">{selectedPlanForOverride.nameAr}</span>
                <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-200 text-xs">
                  <span>السعر الرسمي المعتمد:</span>
                  <span className="font-mono font-bold text-blue-900">
                    {selectedPlanForOverride.listPrice.toLocaleString()} دج
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الطفل / المستفيد من الخصم *</label>
                <select
                  value={overrideForm.studentId}
                  onChange={(e) => setOverrideForm({ ...overrideForm, studentId: e.target.value })}
                  className="w-full p-1.5 border border-slate-300 bg-white font-arabic focus:border-amber-800"
                  required
                >
                  <option value="">-- اختر الطفل من القائمة --</option>
                  {MOCK_KG_STUDENTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullNameAr} ({s.bookNumber}) - {s.guardianName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">السعر المخصص الجديد (دج) *</label>
                  <input
                    type="number"
                    value={overrideForm.overridePrice}
                    onChange={(e) => setOverrideForm({ ...overrideForm, overridePrice: e.target.value })}
                    className="w-full p-1.5 border border-slate-300 font-mono font-bold text-emerald-900 focus:border-amber-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الموظف المسؤول عن الاعتماد *</label>
                  <input
                    type="text"
                    value={overrideForm.staffAuthor}
                    onChange={(e) => setOverrideForm({ ...overrideForm, staffAuthor: e.target.value })}
                    className="w-full p-1.5 border border-slate-300 bg-slate-50 text-slate-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-amber-950 mb-1">
                  سبب وتبرير الخصم الإلزامي (Mandatory Reason) *
                </label>
                <textarea
                  rows={2}
                  value={overrideForm.mandatoryReason}
                  onChange={(e) => setOverrideForm({ ...overrideForm, mandatoryReason: e.target.value })}
                  placeholder="مثال: خصم الأخوة المعتمد، اتفاقية مؤسسة، أو حالة اجتماعية خاصة..."
                  className="w-full p-1.5 border border-amber-300 font-arabic focus:border-amber-700 bg-amber-50/20"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  وفق ميثاق الحوكمة: لا يتم تسجيل أي تخفيض بدون تدوين التبرير الصريح في قاعدة البيانات.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOverrideModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  اعتماد وتوثيق الخصم في السجل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-12 end-4 z-50 bg-blue-950 text-white px-3.5 py-2 text-xs shadow-xl border border-blue-800 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
