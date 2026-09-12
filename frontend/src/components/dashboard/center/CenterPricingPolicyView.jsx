import React, { useState } from 'react';
import {
  Tag,
  Calculator,
  Gift,
  CheckCircle,
  Coins,
  ArrowRight,
  ShieldCheck,
  Edit2,
  Percent,
} from 'lucide-react';
import { StandardViewLayout } from '../common/StandardViewLayout';
import { MOCK_CENTER_PRICING_POLICY } from '../../../mock/centerMockData';

export function CenterPricingPolicyView() {
  const [tariffs, setTariffs] = useState(MOCK_CENTER_PRICING_POLICY);

  // Interactive Discount Simulator State
  const [selectedCourseIndex, setSelectedCourseIndex] = useState(0);
  const [isCashPayment, setIsCashPayment] = useState(true);
  const [siblingsCount, setSiblingsCount] = useState(1);

  const activeTariff = tariffs[selectedCourseIndex] || tariffs[0];
  const basePrice = activeTariff.installmentPrice;
  const cashDiscountAmount = isCashPayment ? 500 : 0;
  const siblingDiscountAmount = Math.max(siblingsCount, 0) * 500;
  const totalDiscount = cashDiscountAmount + siblingDiscountAmount;
  const finalNetPrice = Math.max(basePrice - totalDiscount, 0);

  // 1. KPI Calculations (Section 3.4.15)
  const totalCourses = tariffs.length;

  const kpiCards = [
    {
      label: 'عدد المسارات والدورات المسعرة',
      value: `${totalCourses} دورات`,
      icon: Tag,
      subtext: 'سوروبان، لغات، روبوتيك، ودعم مدرسي',
      change: 'معتمدة رسمياً',
      isPositive: true,
    },
    {
      label: 'خصم السداد كاش دفعة واحدة',
      value: '500 دج',
      icon: Coins,
      subtext: 'تخفيض مباشر يطبق تلقائياً في الفاتورة',
      change: '-500 دج كاش',
      isPositive: true,
    },
    {
      label: 'خصم الأخوة المسجلين (لكل أخ)',
      value: '500 دج / أخ',
      icon: Gift,
      subtext: 'تشجيع العائلات المتعددة الأبناء',
      change: '-500 دج للأخ',
      isPositive: true,
    },
    {
      label: 'أقصى وفر مباشر للمشترك',
      value: '1,000 دج+',
      icon: CheckCircle,
      subtext: 'عند الدمج بين الدفع كاش وخصم الأخوة',
      change: 'تخفيض تلقائي',
      isPositive: true,
    },
  ];

  return (
    <StandardViewLayout
      titleAr="دليل الأسعار وسياسة الخصومات المعتمدة"
      titleEn="Official Tariff Catalog & Automated Discount Policy Matrix"
      description="لوحة التحكم بالتعرفات المرجعية للبرامج التعليمية وتطبيق الخصومات التلقائية المعتمدة (خصم 500 دج للسداد كاش + خصم 500 دج لكل أخ مسجل) بموجب المعادلات البرمجية الصارمة."
      entityTag="الخزينة والنفقات"
      branchCode="CENTER"
      kpiCards={kpiCards}
      exportFileName="center_pricing_policy"
      exportData={tariffs.map((t) => ({
        'الدورة / المستوى': t.courseName,
        'سعر التقسيط (الأساسي)': t.installmentPrice,
        'خصم الكاش': t.cashDiscount,
        'خصم الأخوة': t.siblingDiscount,
        'السعر كاش': t.netCash,
        'السعر كاش + أخ': t.netCashWithSibling,
        'المدة والوعاء الزمني': t.duration,
      }))}
    >
      {/* 1. Interactive Pricing & Discount Simulator */}
      <div className="p-3 bg-gradient-to-r from-blue-50/70 via-slate-50 to-emerald-50/40 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-900" />
            <h3 className="font-bold text-xs text-blue-950">
              محاكي احتساب السعر الصافي للخصومات التلقائية (Live Discount Engine)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            تطبيق فوري للمعادلة: السعر الصافي = سعر التقسيط - 500 (كاش) - (عدد الإخوة × 500)
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 items-center text-xs">
          {/* Course Selector */}
          <div className="lg:col-span-1">
            <label className="block text-slate-700 font-semibold mb-1">اختر الدورة التعليمية:</label>
            <select
              value={selectedCourseIndex}
              onChange={(e) => setSelectedCourseIndex(Number(e.target.value))}
              className="w-full h-8 px-2 border border-slate-300 bg-white font-semibold text-slate-900"
            >
              {tariffs.map((t, idx) => (
                <option key={idx} value={idx}>
                  {t.courseName.slice(0, 38)}...
                </option>
              ))}
            </select>
          </div>

          {/* Checkboxes & Sibling Counter */}
          <div className="flex items-center gap-4 bg-white p-2 border border-slate-200">
            <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={isCashPayment}
                onChange={(e) => setIsCashPayment(e.target.checked)}
                className="w-4 h-4 text-blue-900 rounded"
              />
              <span>سداد كاش دفعة واحدة (-500 دج)</span>
            </label>

            <div className="flex items-center gap-2 border-s border-slate-200 ps-3">
              <label className="text-slate-600 font-medium">عدد الإخوة:</label>
              <input
                type="number"
                min="0"
                max="5"
                value={siblingsCount}
                onChange={(e) => setSiblingsCount(Math.max(0, Number(e.target.value)))}
                className="w-12 h-6 px-1 text-center font-mono font-bold border border-slate-300 bg-slate-50"
              />
            </div>
          </div>

          {/* Price Breakdown Card */}
          <div className="lg:col-span-2 bg-white p-2.5 border border-blue-200 flex items-center justify-between shadow-2xs">
            <div className="space-y-0.5 text-[11px]">
              <div className="text-slate-500">
                سعر التقسيط الأصلي:{' '}
                <span className="line-through font-mono">{basePrice.toLocaleString()} دج</span>
              </div>
              <div className="text-emerald-700 font-semibold">
                مجموع الخصم المحسوم: -{totalDiscount.toLocaleString()} دج{' '}
                <span className="text-[10px] text-slate-400">
                  ({cashDiscountAmount} دج كاش + {siblingDiscountAmount} دج إخوة)
                </span>
              </div>
            </div>

            <div className="text-end">
              <span className="text-[10px] text-slate-500 block">السعر الصافي المطلوب:</span>
              <strong className="text-lg font-mono font-bold text-blue-950">
                {finalNetPrice.toLocaleString()} دج
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Official Tariffs Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-start text-xs border-collapse">
          <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold select-none">
            <tr>
              <th className="p-2.5 text-center border-e border-slate-200 w-12">#</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[280px]">المستوى / الدورة التعليمية</th>
              <th className="p-2.5 text-end border-e border-slate-200 min-w-[150px] bg-slate-50">
                سعر التقسيط (Installment Price)
              </th>
              <th className="p-2.5 text-center border-e border-slate-200 min-w-[120px]">
                خصم الكاش (Cash Discount)
              </th>
              <th className="p-2.5 text-center border-e border-slate-200 min-w-[120px]">
                خصم الأخوة (Sibling)
              </th>
              <th className="p-2.5 text-end border-e border-slate-200 min-w-[150px] text-blue-900 bg-blue-50/40 font-bold">
                الصافي (سداد كاش)
              </th>
              <th className="p-2.5 text-end border-e border-slate-200 min-w-[150px] text-emerald-800 bg-emerald-50/40 font-bold">
                الصافي (كاش + أخ واحد)
              </th>
              <th className="p-2.5 text-start min-w-[180px]">الوعاء الزمني للدورة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {tariffs.map((t, idx) => (
              <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                <td className="p-2.5 text-center border-e border-slate-200 font-mono text-slate-400 font-bold">
                  {idx + 1}
                </td>
                <td className="p-2.5 border-e border-slate-200 font-bold text-slate-900 text-sm">
                  {t.courseName}
                </td>
                <td className="p-2.5 text-end border-e border-slate-200 font-mono font-bold text-slate-900 bg-slate-50/50">
                  {t.installmentPrice.toLocaleString()} دج
                </td>
                <td className="p-2.5 text-center border-e border-slate-200 font-mono text-rose-700 font-bold">
                  -500 دج
                </td>
                <td className="p-2.5 text-center border-e border-slate-200 font-mono text-rose-700 font-bold">
                  -500 دج
                </td>
                <td className="p-2.5 text-end border-e border-slate-200 font-mono font-bold text-blue-900 bg-blue-50/20 text-sm">
                  {t.netCash.toLocaleString()} دج
                </td>
                <td className="p-2.5 text-end border-e border-slate-200 font-mono font-bold text-emerald-800 bg-emerald-50/20 text-sm">
                  {t.netCashWithSibling.toLocaleString()} دج
                </td>
                <td className="p-2.5 text-slate-600">
                  {t.duration}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 font-sans text-xs">
            <tr>
              <td colSpan={2} className="p-2.5 text-start">
                قواعد التكامل البرمجي للفوترة
              </td>
              <td colSpan={6} className="p-2.5 text-slate-600 font-normal text-[11px]">
                المعادلات تطبق حتمياً في شاشات التسجيل وتوليد الفواتير، ولا يسمح بالخصم اليدوي دون مبرر موثق.
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </StandardViewLayout>
  );
}
