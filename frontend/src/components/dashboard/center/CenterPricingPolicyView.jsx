import React, { useState, useMemo, useEffect } from 'react';
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
  Plus,
  Trash2,
  Sliders,
  Check,
  X,
  Printer,
  Download,
  Search,
  Info,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Copy,
  TrendingUp,
} from 'lucide-react';
import { MOCK_CENTER_PRICING_POLICY } from '../../../mock/centerMockData';

// Initial configurable discount rules
const INITIAL_DISCOUNT_RULES = [
  {
    id: 'rule-cash',
    name: 'خصم السداد كاش دفعة واحدة',
    type: 'fixed', // 'fixed' | 'percent'
    value: 500,
    unit: 'دج',
    appliesTo: 'all',
    isActive: true,
    description: 'تخفيض فوري يطبق عند تسديد كامل الاشتراك دفعة واحدة',
  },
  {
    id: 'rule-sibling',
    name: 'خصم الأخوة المسجلين (لكل أخ)',
    type: 'per_unit', // 500 DZD per sibling
    value: 500,
    unit: 'دج / أخ',
    appliesTo: 'all',
    isActive: true,
    description: 'تخفيض تراكمي قدره 500 دج عن كل أخ إضافي مسجل بالمركز',
  },
  {
    id: 'rule-bundle',
    name: 'خصم الاشتراك في أكثر من دورة (باقة)',
    type: 'percent',
    value: 10,
    unit: '%',
    appliesTo: 'multiple',
    isActive: true,
    description: 'تخفيض 10% من إجمالي الاشتراك عند التسجيل في دورتين أو أكثر',
  },
  {
    id: 'rule-orphan',
    name: 'إعفاء الأيتام والظروف الخاصة',
    type: 'percent',
    value: 50,
    unit: '%',
    appliesTo: 'special',
    isActive: true,
    description: 'خصم تضامني واجتماعي معتمد من إدارة المركز بنسبة 50%',
  },
];

export function CenterPricingPolicyView() {
  const [selectedYear, setSelectedYear] = useState('2025-2026');
  const [activeTab, setActiveTab] = useState('tariffs'); // 'tariffs' | 'rules' | 'simulator'
  const [searchTerm, setSearchTerm] = useState('');

  // Datasets
  const [tariffs, setTariffs] = useState(() => {
    return MOCK_CENTER_PRICING_POLICY.map((t, idx) => ({
      ...t,
      id: `tariff-${idx + 1}`,
      academicYear: '2025-2026',
    }));
  });

  const [discountRules, setDiscountRules] = useState(INITIAL_DISCOUNT_RULES);

  // Interactive Simulator State
  const [selectedCourseIndex, setSelectedCourseIndex] = useState(0);
  const [isCashPayment, setIsCashPayment] = useState(true);
  const [siblingsCount, setSiblingsCount] = useState(1);
  const [isMultiCourse, setIsMultiCourse] = useState(false);
  const [isSpecialCase, setIsSpecialCase] = useState(false);

  // UI Modals
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isAddTariffOpen, setIsAddTariffOpen] = useState(false);
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
  const [editingTariff, setEditingTariff] = useState(null);
  const [editingRule, setEditingRule] = useState(null);

  // Right-Click Context Menu
  const [contextMenu, setContextMenu] = useState(null);

  // Close context menu on external click
  useEffect(() => {
    const handleWindowClick = () => setContextMenu(null);
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  // Filtered Tariffs
  const filteredTariffs = useMemo(() => {
    return tariffs.filter((t) => {
      const matchYear = !t.academicYear || t.academicYear === selectedYear;
      const matchSearch =
        t.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.duration.toLowerCase().includes(searchTerm.toLowerCase());
      return matchYear && matchSearch;
    });
  }, [tariffs, selectedYear, searchTerm]);

  // Simulator Calculation Engine
  const activeTariff = tariffs[selectedCourseIndex] || tariffs[0] || { installmentPrice: 15000, courseName: '' };
  const basePrice = activeTariff.installmentPrice;

  const simulationBreakdown = useMemo(() => {
    let totalDiscount = 0;
    const deductions = [];

    // Cash Rule
    const cashRule = discountRules.find((r) => r.id === 'rule-cash' && r.isActive);
    if (cashRule && isCashPayment) {
      totalDiscount += cashRule.value;
      deductions.push({ label: cashRule.name, amount: cashRule.value });
    }

    // Sibling Rule
    const siblingRule = discountRules.find((r) => r.id === 'rule-sibling' && r.isActive);
    if (siblingRule && siblingsCount > 0) {
      const amt = siblingsCount * siblingRule.value;
      totalDiscount += amt;
      deductions.push({ label: `${siblingRule.name} (${siblingsCount} إخوة)`, amount: amt });
    }

    // Bundle Rule
    const bundleRule = discountRules.find((r) => r.id === 'rule-bundle' && r.isActive);
    if (bundleRule && isMultiCourse) {
      const amt = Math.round((basePrice * bundleRule.value) / 100);
      totalDiscount += amt;
      deductions.push({ label: `${bundleRule.name} (${bundleRule.value}%)`, amount: amt });
    }

    // Special Case Rule
    const orphanRule = discountRules.find((r) => r.id === 'rule-orphan' && r.isActive);
    if (orphanRule && isSpecialCase) {
      const amt = Math.round((basePrice * orphanRule.value) / 100);
      totalDiscount += amt;
      deductions.push({ label: `${orphanRule.name} (${orphanRule.value}%)`, amount: amt });
    }

    const netPrice = Math.max(0, basePrice - totalDiscount);
    return {
      basePrice,
      totalDiscount,
      deductions,
      netPrice,
    };
  }, [basePrice, discountRules, isCashPayment, siblingsCount, isMultiCourse, isSpecialCase]);

  // Toggle rule active status
  const toggleRuleActive = (ruleId) => {
    setDiscountRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, isActive: !r.isActive } : r))
    );
  };

  // Open Context Menu on Tariff
  const handleTariffContextMenu = (e, tariff) => {
    e.preventDefault();
    e.stopPropagation();
    const x = Math.min(e.clientX, window.innerWidth - 220);
    const y = Math.min(e.clientY, window.innerHeight - 260);
    setContextMenu({ x, y, tariff });
  };

  // Add Tariff Form
  const [newTariffForm, setNewTariffForm] = useState({
    courseName: '',
    installmentPrice: 15000,
    cashDiscount: 500,
    siblingDiscount: 500,
    duration: '3 أشهر (24 ساعة)',
  });

  const handleAddNewTariff = (e) => {
    e.preventDefault();
    if (!newTariffForm.courseName.trim()) return;

    const inst = Number(newTariffForm.installmentPrice) || 15000;
    const cd = Number(newTariffForm.cashDiscount) || 500;
    const sd = Number(newTariffForm.siblingDiscount) || 500;

    const newEntry = {
      id: `tariff-${Date.now()}`,
      academicYear: selectedYear,
      courseName: newTariffForm.courseName.trim(),
      installmentPrice: inst,
      cashDiscount: cd,
      siblingDiscount: sd,
      netCash: inst - cd,
      netCashWithSibling: inst - cd - sd,
      duration: newTariffForm.duration.trim() || 'فصل تدريبي',
    };

    setTariffs([...tariffs, newEntry]);
    setIsAddTariffOpen(false);
  };

  // Save Edit Tariff
  const handleSaveEditTariff = (e) => {
    e.preventDefault();
    if (editingTariff) {
      const inst = Number(editingTariff.installmentPrice) || 0;
      const cd = Number(editingTariff.cashDiscount) || 0;
      const sd = Number(editingTariff.siblingDiscount) || 0;
      const updated = {
        ...editingTariff,
        netCash: inst - cd,
        netCashWithSibling: inst - cd - sd,
      };
      setTariffs((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setEditingTariff(null);
    }
  };

  // Add Rule Form
  const [newRuleForm, setNewRuleForm] = useState({
    name: '',
    type: 'fixed',
    value: 500,
    description: '',
  });

  const handleAddNewRule = (e) => {
    e.preventDefault();
    if (!newRuleForm.name.trim()) return;

    const newEntry = {
      id: `rule-${Date.now()}`,
      name: newRuleForm.name.trim(),
      type: newRuleForm.type,
      value: Number(newRuleForm.value) || 0,
      unit: newRuleForm.type === 'percent' ? '%' : 'دج',
      appliesTo: 'custom',
      isActive: true,
      description: newRuleForm.description || 'قاعدة خصم مخصصة',
    };

    setDiscountRules([...discountRules, newEntry]);
    setIsAddRuleOpen(false);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'الدورة / المسار',
      'سعر التقسيط (الأساسي)',
      'خصم الكاش',
      'خصم الأخوة',
      'السعر كاش الصافي',
      'السعر كاش + أخ',
      'المدة الزمنية',
    ];
    const rows = filteredTariffs.map((t) => [
      `"${t.courseName}"`,
      t.installmentPrice,
      t.cashDiscount,
      t.siblingDiscount,
      t.netCash,
      t.netCashWithSibling,
      `"${t.duration}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pricing_catalog_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 text-xs overflow-hidden">
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-white border-b border-slate-200 shrink-0">
        {/* Title & Badge */}
        <div className="flex items-center gap-2">
          <div className="p-1 bg-blue-50 text-blue-900 border border-blue-200">
            <Tag className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 text-sm">
                دليل الأسعار وسياسة الخصومات المعتمدة (تعريفات)
              </span>
              <span className="text-[10px] text-slate-400">|</span>
              <span className="text-[10px] text-slate-500 font-mono">
                Official Tariffs & Dynamic Discounts
              </span>
            </div>
          </div>
        </div>

        {/* Year Selector & Internal Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              aria-label="تحديد السنة المالية لسياسة الأسعار"
              className="bg-transparent font-bold text-slate-800 text-xs border-none focus:outline-hidden cursor-pointer"
            >
              <option value="2024-2025">موسم 2024 - 2025</option>
              <option value="2025-2026">موسم 2025 - 2026</option>
              <option value="2026-2027">موسم 2026 - 2027</option>
            </select>
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 border border-slate-200">
            <button
              onClick={() => setActiveTab('tariffs')}
              className={`px-3 py-1 text-xs font-bold transition-colors ${
                activeTab === 'tariffs'
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              دليل التعرفات ({filteredTariffs.length})
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-1 text-xs font-bold flex items-center gap-1 transition-colors ${
                activeTab === 'rules'
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3 h-3" />
              تخصيص قواعد الخصم ({discountRules.filter((r) => r.isActive).length})
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-1 text-xs font-bold flex items-center gap-1 transition-colors ${
                activeTab === 'simulator'
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calculator className="w-3 h-3" />
              محاكي الخصومات الحي
            </button>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1 border-s border-slate-200 ps-2">
            <button
              onClick={() => {
                if (activeTab === 'rules') setIsAddRuleOpen(true);
                else setIsAddTariffOpen(true);
              }}
              title="إضافة دورة مسعرة أو قاعدة خصم"
              className="p-1 bg-blue-900 hover:bg-blue-950 text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportCSV}
              title="تصدير CSV"
              className="p-1 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.print()}
              title="طباعة الدليل"
              className="p-1 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsInfoModalOpen(true)}
              title="معلومات ودليل سياسة الأسعار"
              className="p-1 hover:bg-amber-50 text-amber-700 border border-amber-200 transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Workspace Area */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'tariffs' ? (
          /* Tariffs Catalog View */
          <div className="min-w-full inline-block align-middle pb-8">
            <div className="px-3 py-1 bg-white border-b border-slate-200 flex items-center justify-between">
              <div className="relative max-w-xs flex-1">
                <Search className="absolute right-2 top-1.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="بحث باسم الدورة، المستوى، أو الوعاء الزمني..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-7 pr-7 pl-2 bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="text-[11px] font-mono text-slate-500">
                الدورات المسعرة:{' '}
                <strong className="text-slate-800">{filteredTariffs.length}</strong>
              </div>
            </div>

            <table className="w-full text-start text-xs border-collapse select-none">
              <thead className="bg-slate-100 sticky top-0 z-10 border-b border-slate-300 text-slate-700 font-bold text-[11px]">
                <tr>
                  <th className="p-2 text-start border-e border-slate-300 min-w-[200px]">
                    الدورة / المسار التدريبي
                  </th>
                  <th className="p-2 text-end border-e border-slate-300 min-w-[120px] bg-slate-200/50">
                    سعر التقسيط (الأساسي)
                  </th>
                  <th className="p-2 text-end border-e border-slate-300 min-w-[100px] text-blue-900 bg-blue-50/50">
                    خصم الكاش
                  </th>
                  <th className="p-2 text-end border-e border-slate-300 min-w-[100px] text-emerald-900 bg-emerald-50/50">
                    خصم الأخوة
                  </th>
                  <th className="p-2 text-end border-e border-slate-300 min-w-[120px] bg-emerald-100/60 text-emerald-950 font-bold">
                    السعر كاش الصافي
                  </th>
                  <th className="p-2 text-end border-e border-slate-300 min-w-[130px] bg-emerald-200/60 text-emerald-950 font-bold">
                    السعر كاش + أخ
                  </th>
                  <th className="p-2 text-start min-w-[160px]">المدة والوعاء الزمني</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {filteredTariffs.map((t, idx) => (
                  <tr
                    key={t.id}
                    onContextMenu={(e) => handleTariffContextMenu(e, t)}
                    className="h-9 hover:bg-blue-50/40 transition-colors cursor-pointer"
                  >
                    <td className="p-2 border-e border-slate-200 font-sans font-bold text-slate-900">
                      {t.courseName}
                    </td>

                    <td className="p-2 text-end border-e border-slate-200 font-bold bg-slate-50">
                      {t.installmentPrice.toLocaleString()} دج
                    </td>

                    <td className="p-2 text-end border-e border-slate-200 text-blue-900 font-bold bg-blue-50/20">
                      -{t.cashDiscount.toLocaleString()} دج
                    </td>

                    <td className="p-2 text-end border-e border-slate-200 text-emerald-800 font-bold bg-emerald-50/20">
                      -{t.siblingDiscount.toLocaleString()} دج
                    </td>

                    <td className="p-2 text-end border-e border-slate-200 font-bold text-emerald-900 bg-emerald-50/40">
                      {t.netCash.toLocaleString()} دج
                    </td>

                    <td className="p-2 text-end border-e border-slate-200 font-bold text-emerald-900 bg-emerald-100/40">
                      {t.netCashWithSibling.toLocaleString()} دج
                    </td>

                    <td className="p-2 font-sans text-slate-600">{t.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'rules' ? (
          /* Dynamic Discount Rules Manager */
          <div className="p-4 space-y-4 max-w-4xl mx-auto">
            <div className="bg-white border border-slate-200 p-3 shadow-2xs flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-blue-900" />
                  قواعد وسياسات الخصم النشطة بالمركز
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  يمكنك تفعيل، تعطيل، أو إضافة شروط وخصومات مخصصة (تخفيض نسبي مئوي أو مبلغ ثابت
                  بالدينار).
                </p>
              </div>

              <button
                onClick={() => setIsAddRuleOpen(true)}
                className="px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                إضافة قاعدة خصم جديدة
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {discountRules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-3 border transition-all ${
                    rule.isActive
                      ? 'bg-white border-slate-200 shadow-2xs'
                      : 'bg-slate-50/70 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleRuleActive(rule.id)}
                        className="text-slate-600 hover:text-blue-900"
                        title={rule.isActive ? 'تعطيل القاعدة' : 'تفعيل القاعدة'}
                      >
                        {rule.isActive ? (
                          <ToggleRight className="w-6 h-6 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-slate-400" />
                        )}
                      </button>
                      <strong className="text-xs text-slate-900">{rule.name}</strong>
                    </div>

                    <span className="px-2 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 font-mono font-bold text-xs rounded-xs">
                      {rule.value} {rule.unit}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 mb-2 leading-relaxed">
                    {rule.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                    <span>الحالة: {rule.isActive ? 'مفعلة وتطبق آلياً' : 'معطلة مؤقتاً'}</span>
                    <button
                      onClick={() => {
                        if (window.confirm('هل أنت متأكد من حذف هذه القاعدة؟')) {
                          setDiscountRules(discountRules.filter((r) => r.id !== rule.id));
                        }
                      }}
                      className="text-rose-600 hover:underline"
                    >
                      حذف القاعدة
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Interactive Discount Simulator Tab */
          <div className="p-4 space-y-4 max-w-3xl mx-auto">
            <div className="bg-white border border-slate-200 p-4 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-blue-900" />
                  <span className="font-bold text-slate-900 text-sm">
                    محاكي احتساب الخصومات التلقائية المباشر (Live Discount Engine)
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  تطبيق فوري لقواعد الخصم النشطة
                </span>
              </div>

              <div className="space-y-3">
                {/* Course Selection */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    اختر الدورة / المسار المراد تسعيره:
                  </label>
                  <select
                    value={selectedCourseIndex}
                    onChange={(e) => setSelectedCourseIndex(Number(e.target.value))}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 text-xs font-semibold"
                  >
                    {tariffs.map((t, idx) => (
                      <option key={t.id} value={idx}>
                        {t.courseName} — السعر الأساسي: {t.installmentPrice.toLocaleString()} دج (
                        {t.duration})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Discount Switches */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCashPayment}
                      onChange={(e) => setIsCashPayment(e.target.checked)}
                      className="w-4 h-4 accent-blue-900"
                    />
                    <span className="text-xs text-slate-800">
                      سداد كامل الاشتراك نقداً دفعة واحدة (كاش)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isMultiCourse}
                      onChange={(e) => setIsMultiCourse(e.target.checked)}
                      className="w-4 h-4 accent-blue-900"
                    />
                    <span className="text-xs text-slate-800">
                      اشتراك متعدد (باقة دورتين أو أكثر)
                    </span>
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-700">عدد الأخوة المسجلين:</span>
                    <input
                      type="number"
                      min={0}
                      max={6}
                      value={siblingsCount}
                      onChange={(e) => setSiblingsCount(Math.max(0, Number(e.target.value)))}
                      className="w-16 h-7 px-2 border border-slate-300 bg-white font-mono text-center"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSpecialCase}
                      onChange={(e) => setIsSpecialCase(e.target.checked)}
                      className="w-4 h-4 accent-blue-900"
                    />
                    <span className="text-xs text-slate-800">
                      إعفاء اجتماعي / تضامني (أيتام ومعوزين)
                    </span>
                  </label>
                </div>

                {/* Detailed Result Card */}
                <div className="p-4 bg-emerald-50/70 border border-emerald-300 space-y-2">
                  <div className="flex justify-between text-xs text-slate-700">
                    <span>السعر التعاقدي الأساسي (التقسيط):</span>
                    <span className="font-mono font-bold">
                      {simulationBreakdown.basePrice.toLocaleString()} دج
                    </span>
                  </div>

                  {simulationBreakdown.deductions.map((d, i) => (
                    <div
                      key={i}
                      className="flex justify-between text-[11px] text-rose-700 font-semibold ps-2"
                    >
                      <span>- {d.label}:</span>
                      <span className="font-mono">-{d.amount.toLocaleString()} دج</span>
                    </div>
                  ))}

                  <div className="flex justify-between text-xs font-bold text-emerald-900 pt-2 border-t border-emerald-200">
                    <span>إجمالي الوفر والتخفيض الممنوح:</span>
                    <span className="font-mono text-rose-700">
                      -{simulationBreakdown.totalDiscount.toLocaleString()} دج
                    </span>
                  </div>

                  <div className="flex justify-between text-sm font-bold text-emerald-950 pt-2 border-t-2 border-emerald-300">
                    <span>السعر الصافي النهائي المستحق للدفع:</span>
                    <span className="font-mono text-base text-emerald-800 font-extrabold">
                      {simulationBreakdown.netPrice.toLocaleString()} دج
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right-Click Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white border border-slate-300 shadow-xl py-1 text-xs min-w-[200px] animate-in fade-in"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1 bg-slate-100 border-b border-slate-200 font-bold text-[10px] text-slate-700">
            {contextMenu.tariff.courseName}
          </div>
          <button
            onClick={() => {
              setEditingTariff(contextMenu.tariff);
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-blue-50 text-slate-800 flex items-center gap-2"
          >
            <Edit2 className="w-3.5 h-3.5 text-blue-800" />
            تعديل سعر الدورة والخصم
          </button>
          <button
            onClick={() => {
              const idx = tariffs.findIndex((t) => t.id === contextMenu.tariff.id);
              if (idx !== -1) {
                setSelectedCourseIndex(idx);
                setActiveTab('simulator');
              }
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-emerald-50 text-slate-800 flex items-center gap-2"
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-700" />
            محاكاة السعر في الآلة الحاسبة
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `${contextMenu.tariff.courseName} - الأساسي: ${contextMenu.tariff.installmentPrice} دج - كاش: ${contextMenu.tariff.netCash} دج`
              );
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-blue-50 text-slate-800 flex items-center gap-2"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            نسخ تفاصيل التسعيرة
          </button>
          <div className="border-t border-slate-200 my-1" />
          <button
            onClick={() => {
              if (window.confirm('هل أنت متأكد من حذف هذه الدورة من الدليل؟')) {
                setTariffs(tariffs.filter((t) => t.id !== contextMenu.tariff.id));
                setContextMenu(null);
              }
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-rose-50 text-rose-700 flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            حذف الدورة
          </button>
        </div>
      )}

      {/* Edit Tariff Modal */}
      {editingTariff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">
                تعديل تسعيرة الدورة التعليمية
              </span>
              <button
                onClick={() => setEditingTariff(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTariff} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">اسم الدورة *</label>
                <input
                  type="text"
                  required
                  value={editingTariff.courseName}
                  onChange={(e) =>
                    setEditingTariff({ ...editingTariff, courseName: e.target.value })
                  }
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    سعر التقسيط الأساسي (دج)
                  </label>
                  <input
                    type="number"
                    value={editingTariff.installmentPrice}
                    onChange={(e) =>
                      setEditingTariff({
                        ...editingTariff,
                        installmentPrice: Number(e.target.value),
                      })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    خصم الكاش (دج)
                  </label>
                  <input
                    type="number"
                    value={editingTariff.cashDiscount}
                    onChange={(e) =>
                      setEditingTariff({ ...editingTariff, cashDiscount: Number(e.target.value) })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    خصم الأخوة (دج)
                  </label>
                  <input
                    type="number"
                    value={editingTariff.siblingDiscount}
                    onChange={(e) =>
                      setEditingTariff({
                        ...editingTariff,
                        siblingDiscount: Number(e.target.value),
                      })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    المدة والوعاء الزمني
                  </label>
                  <input
                    type="text"
                    value={editingTariff.duration}
                    onChange={(e) =>
                      setEditingTariff({ ...editingTariff, duration: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingTariff(null)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-bold"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Tariff Modal */}
      {isAddTariffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">
                إضافة دورة جديدة لدليل الأسعار
              </span>
              <button
                onClick={() => setIsAddTariffOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewTariff} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">اسم الدورة *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: دورة برمجة بايثون للناشئين"
                  value={newTariffForm.courseName}
                  onChange={(e) =>
                    setNewTariffForm({ ...newTariffForm, courseName: e.target.value })
                  }
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    سعر التقسيط الأساسي (دج)
                  </label>
                  <input
                    type="number"
                    value={newTariffForm.installmentPrice}
                    onChange={(e) =>
                      setNewTariffForm({ ...newTariffForm, installmentPrice: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    خصم الكاش (دج)
                  </label>
                  <input
                    type="number"
                    value={newTariffForm.cashDiscount}
                    onChange={(e) =>
                      setNewTariffForm({ ...newTariffForm, cashDiscount: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    خصم الأخوة (دج)
                  </label>
                  <input
                    type="number"
                    value={newTariffForm.siblingDiscount}
                    onChange={(e) =>
                      setNewTariffForm({ ...newTariffForm, siblingDiscount: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    المدة الزمنية
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: شهران (16 ساعة)"
                    value={newTariffForm.duration}
                    onChange={(e) =>
                      setNewTariffForm({ ...newTariffForm, duration: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddTariffOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-bold"
                >
                  تأكيد الإضافة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Discount Rule Modal */}
      {isAddRuleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">
                إضافة قاعدة خصم مخصصة جديدة
              </span>
              <button
                onClick={() => setIsAddRuleOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewRule} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  اسم أو عنوان قاعدة الخصم *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: خصم التسجيل المبكر (Early Bird)"
                  value={newRuleForm.name}
                  onChange={(e) => setNewRuleForm({ ...newRuleForm, name: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">نوع التخفيض</label>
                  <select
                    value={newRuleForm.type}
                    onChange={(e) => setNewRuleForm({ ...newRuleForm, type: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50"
                  >
                    <option value="fixed">مبلغ ثابت بالدينار (دج)</option>
                    <option value="percent">نسبة مئوية (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    قيمة التخفيض ({newRuleForm.type === 'percent' ? '%' : 'دج'})
                  </label>
                  <input
                    type="number"
                    value={newRuleForm.value}
                    onChange={(e) => setNewRuleForm({ ...newRuleForm, value: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  شرح وشروط تطبيق الخصم
                </label>
                <input
                  type="text"
                  placeholder="شرح موجز لحالة تطبيق هذا الخصم..."
                  value={newRuleForm.description}
                  onChange={(e) =>
                    setNewRuleForm({ ...newRuleForm, description: e.target.value })
                  }
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddRuleOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-bold"
                >
                  اعتماد القاعدة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-lg p-5 text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-slate-900 text-sm">
                  دليل وإرشادات استخدام دليل الأسعار وسياسة الخصومات المعتمدة
                </span>
              </div>
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-slate-700 leading-relaxed">
              <p>
                <strong>الهدف من الواجهة:</strong> ضبط التعرفات المرجعية لجميع دورات وبرامج المركز
                التعليمي، مع إدارة مرنة لقواعد الخصم التلقائية (الكاش، الأخوة، الباقات، والإعفاءات).
              </p>
              <ul className="list-disc list-inside space-y-1 bg-slate-50 p-2.5 border border-slate-200">
                <li>
                  <strong>محاكي الخصم الحي:</strong> يمكنك محاكاة السعر الصافي لأي دورة وفق الشروط
                  المختارة مع تفصيل البنود المقتطعة بدقة.
                </li>
                <li>
                  <strong>تخصيص القواعد:</strong> تبويب "تخصيص قواعد الخصم" يمكنك من تشغيل أو إيقاف
                  أي قاعدة أو إضافة قواعد خصم جديدة بالشكل الذي يراه المركز مناسباً.
                </li>
                <li>
                  <strong>الزر الأيمن للفأرة:</strong> يتيح تعديل سعر الدورة، نقل الدورة فورياً
                  للمحاكي، أو نسخ تفاصيل التسعيرة.
                </li>
              </ul>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-black text-white font-bold"
              >
                إغلاق الدليل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
