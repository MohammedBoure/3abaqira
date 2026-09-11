import React, { useState } from 'react';
import {
  Coins,
  Calculator,
  Plus,
  Edit3,
  Check,
  X,
  Sparkles,
  Layers,
  Percent,
  Tag,
  Building2,
} from 'lucide-react';
import { MOCK_PRICING_PLANS } from '../../mock/mockData';

export function PricingPlansView() {
  const [plans, setPlans] = useState(MOCK_PRICING_PLANS);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Simulator Calculator State
  const [calcPlanId, setCalcPlanId] = useState(1);
  const [calcIsCash, setCalcIsCash] = useState(false);
  const [calcHasSibling, setCalcHasSibling] = useState(false);
  const [calcHasAnnual, setCalcHasAnnual] = useState(false);

  // New Plan Form State
  const [form, setForm] = useState({
    plan_name: '',
    branch_id: 'CENTER',
    program_name: 'السوروبان',
    standard_installment_price: 8000,
    installments_count: 4,
    registration_fee: 2000,
    cash_discount: 1000,
    sibling_discount: 1000,
    annual_prepaid_discount: 2000,
  });

  const selectedCalcPlan = plans.find((p) => p.plan_id === Number(calcPlanId)) || plans[0];

  // Calculate Net Tuition
  const baseTuition = selectedCalcPlan.standard_installment_price * selectedCalcPlan.installments_count;
  let totalDiscounts = 0;
  if (calcIsCash) totalDiscounts += selectedCalcPlan.cash_discount;
  if (calcHasSibling) totalDiscounts += selectedCalcPlan.sibling_discount;
  if (calcHasAnnual) totalDiscounts += selectedCalcPlan.annual_prepaid_discount;
  const netAgreed = Math.max(0, baseTuition - totalDiscounts + selectedCalcPlan.registration_fee);

  const handleCreatePlan = (e) => {
    e.preventDefault();
    if (!form.plan_name) return;

    const newP = {
      plan_id: Date.now(),
      plan_name: form.plan_name,
      branch_id: form.branch_id,
      program_name: form.program_name,
      standard_installment_price: Number(form.standard_installment_price),
      installments_count: Number(form.installments_count),
      registration_fee: Number(form.registration_fee),
      cash_discount: Number(form.cash_discount),
      sibling_discount: Number(form.sibling_discount),
      annual_prepaid_discount: Number(form.annual_prepaid_discount),
      total_annual_value: Number(form.standard_installment_price) * Number(form.installments_count),
      is_active: true,
    };

    setPlans([...plans, newP]);
    setIsModalOpen(false);
    setForm({ plan_name: '', branch_id: 'CENTER', program_name: 'السوروبان', standard_installment_price: 8000, installments_count: 4, registration_fee: 2000, cash_discount: 1000, sibling_discount: 1000, annual_prepaid_discount: 2000 });
  };

  return (
    <div className="space-y-3 font-arabic">
      {/* 1. Header */}
      <div className="bg-white border border-slate-300 p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="eyebrow flex items-center gap-1.5 text-blue-900">
            <Coins className="w-3.5 h-3.5" />
            <span>PRICING MATRICES & TUITION PLANS / backend/apis/pricing_plans.py</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold font-serif text-slate-900 mt-0.5">
            خطط التسعير ومصفوفة الخصومات (Pricing Plans & Tuition Matrices)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            هيكلة أقساط البرامج الأكاديمية والروضة، حزم الاشتراكات السنوية، تخفيضات الإخوة والدفع الكاش المسبق.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="button button-primary text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>إضافة خطة تسعير جديدة (POST /pricing-plans)</span>
        </button>
      </div>

      {/* 2. Interactive Tuition Simulation Calculator */}
      <div className="bg-white border border-slate-300 p-4 shadow-xs">
        <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-slate-200">
          <Calculator className="w-4 h-4 text-blue-900" />
          <h3 className="font-bold text-xs sm:text-sm text-slate-900">
            محاكي احتساب الرسوم ومستحقات التسجيل (Fee Simulation Calculator)
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div>
            <label className="eyebrow block mb-1 text-slate-700">اختر خطة التسعير</label>
            <select
              value={calcPlanId}
              onChange={(e) => setCalcPlanId(Number(e.target.value))}
              className="w-full h-8 px-2 text-xs border border-slate-300 bg-white"
            >
              {plans.map((p) => (
                <option key={p.plan_id} value={p.plan_id}>
                  {p.plan_name} ({p.branch_id})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="eyebrow block text-slate-700">تطبيق الخصومات والحوافز</label>
            <div className="flex flex-col gap-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={calcIsCash}
                  onChange={(e) => setCalcIsCash(e.target.checked)}
                  className="w-3.5 h-3.5 accent-blue-900"
                />
                <span>خصم الدفع المسبق كاش (-{selectedCalcPlan.cash_discount} دج)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={calcHasSibling}
                  onChange={(e) => setCalcHasSibling(e.target.checked)}
                  className="w-3.5 h-3.5 accent-blue-900"
                />
                <span>تخفيض الإخوة المسجلين (-{selectedCalcPlan.sibling_discount} دج)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={calcHasAnnual}
                  onChange={(e) => setCalcHasAnnual(e.target.checked)}
                  className="w-3.5 h-3.5 accent-blue-900"
                />
                <span>حزمة العام الكامل (-{selectedCalcPlan.annual_prepaid_discount} دج)</span>
              </label>
            </div>
          </div>

          <div className="bg-slate-50 p-3 border border-slate-200 text-xs space-y-1 font-mono">
            <div className="flex items-center justify-between text-slate-600">
              <span>السعر الأساسي:</span>
              <span>{baseTuition.toLocaleString()} دج</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>حقوق التسجيل:</span>
              <span>+{selectedCalcPlan.registration_fee.toLocaleString()} دج</span>
            </div>
            <div className="flex items-center justify-between text-rose-700">
              <span>إجمالي الخصم:</span>
              <span>-{totalDiscounts.toLocaleString()} دج</span>
            </div>
          </div>

          <div className="bg-blue-900 text-white p-3 border border-blue-950 flex flex-col justify-between">
            <span className="eyebrow text-blue-300">NET AGREED TUITION</span>
            <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">
              {netAgreed.toLocaleString()} دج
            </div>
            <div className="text-[10px] text-blue-200 mt-1 font-mono">
              مقسمة على {selectedCalcPlan.installments_count} أقساط بمعدل{' '}
              {Math.round(netAgreed / selectedCalcPlan.installments_count).toLocaleString()} دج / قسط
            </div>
          </div>
        </div>
      </div>

      {/* 3. Plans Grid Table */}
      <div className="bg-white border border-slate-300 shadow-xs">
        <div className="overflow-x-auto">
          <table className="excel-table text-xs">
            <thead>
              <tr>
                <th className="excel-th p-2 text-start">مسمى خطة التسعير</th>
                <th className="excel-th p-2 text-center">المقر</th>
                <th className="excel-th p-2 text-start">البرنامج المرتبط</th>
                <th className="excel-th p-2 text-center">قيمة القسط</th>
                <th className="excel-th p-2 text-center">عدد الأقساط</th>
                <th className="excel-th p-2 text-center">رسوم التسجيل</th>
                <th className="excel-th p-2 text-center">خصم الكاش</th>
                <th className="excel-th p-2 text-center">خصم الإخوة</th>
                <th className="excel-th p-2 text-center">إجمالي الخطة</th>
                <th className="excel-th p-2 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.plan_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="excel-td p-2 font-bold text-slate-900">
                    {p.plan_name}
                  </td>
                  <td className="excel-td p-2 text-center font-semibold text-slate-600">
                    {p.branch_id}
                  </td>
                  <td className="excel-td p-2 text-slate-700">
                    {p.program_name}
                  </td>
                  <td className="excel-td p-2 text-center font-mono font-bold text-blue-900">
                    {p.standard_installment_price.toLocaleString()} دج
                  </td>
                  <td className="excel-td p-2 text-center font-mono font-bold text-slate-800">
                    {p.installments_count}
                  </td>
                  <td className="excel-td p-2 text-center font-mono text-slate-600">
                    {p.registration_fee.toLocaleString()} دج
                  </td>
                  <td className="excel-td p-2 text-center font-mono text-emerald-700">
                    {p.cash_discount.toLocaleString()} دج
                  </td>
                  <td className="excel-td p-2 text-center font-mono text-emerald-700">
                    {p.sibling_discount.toLocaleString()} دج
                  </td>
                  <td className="excel-td p-2 text-center font-mono font-bold text-slate-900">
                    {p.total_annual_value.toLocaleString()} دج
                  </td>
                  <td className="excel-td p-2 text-center">
                    <span className="tag tag-blue text-[10px]">مفعلة</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="excel-status-bar p-2 text-slate-600 flex items-center justify-between text-[11px]">
          <span>إجمالي خطط التسعير: <strong>{plans.length} خطط</strong></span>
          <span className="text-blue-900 font-mono">FastAPI: /pricing-plans</span>
        </div>
      </div>

      {/* Modal: New Plan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-3 select-none">
          <div className="bg-white border border-slate-400 max-w-lg w-full shadow-lg">
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-blue-900" />
                <h3 className="font-bold text-sm text-slate-900">
                  إضافة خطة تسعير جديدة (POST /pricing-plans)
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="icon-button w-6 h-6 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="p-4 space-y-3">
              <div>
                <label className="eyebrow block mb-1 text-slate-700">مسمى خطة التسعير *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: خطة السوروبان 2026 - 4 دفعات"
                  value={form.plan_name}
                  onChange={(e) => setForm({ ...form, plan_name: e.target.value })}
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
                  <label className="eyebrow block mb-1 text-slate-700">البرنامج</label>
                  <input
                    type="text"
                    value={form.program_name}
                    onChange={(e) => setForm({ ...form, program_name: e.target.value })}
                    className="w-full h-8 px-2.5 text-xs border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="eyebrow block mb-1 text-slate-700">سعر القسط (دج)</label>
                  <input
                    type="number"
                    value={form.standard_installment_price}
                    onChange={(e) => setForm({ ...form, standard_installment_price: e.target.value })}
                    className="w-full h-8 px-2.5 text-xs border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="eyebrow block mb-1 text-slate-700">عدد الأقساط</label>
                  <input
                    type="number"
                    value={form.installments_count}
                    onChange={(e) => setForm({ ...form, installments_count: e.target.value })}
                    className="w-full h-8 px-2.5 text-xs border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="eyebrow block mb-1 text-slate-700">خصم الكاش</label>
                  <input
                    type="number"
                    value={form.cash_discount}
                    onChange={(e) => setForm({ ...form, cash_discount: e.target.value })}
                    className="w-full h-8 px-2 text-xs border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="eyebrow block mb-1 text-slate-700">خصم الإخوة</label>
                  <input
                    type="number"
                    value={form.sibling_discount}
                    onChange={(e) => setForm({ ...form, sibling_discount: e.target.value })}
                    className="w-full h-8 px-2 text-xs border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="eyebrow block mb-1 text-slate-700">رسوم التسجيل</label>
                  <input
                    type="number"
                    value={form.registration_fee}
                    onChange={(e) => setForm({ ...form, registration_fee: e.target.value })}
                    className="w-full h-8 px-2 text-xs border border-slate-300 font-mono"
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
                  حفظ الخطة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
