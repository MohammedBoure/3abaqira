import React, { useState, useMemo, useEffect } from 'react';
import {
  ShoppingBag,
  Beef,
  Droplets,
  Coins,
  CheckCircle,
  Plus,
  Calendar,
  X,
  Printer,
  Download,
  Search,
  Info,
  Edit2,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Filter,
  Egg,
} from 'lucide-react';
import { RAWDA_MONTHS } from '../../../mock/rawdaMockData';

// 6 Approved Monitored Commodities
const COMMODITY_CATALOG = [
  {
    item: 'اللحم البقري الطازج',
    defaultQty: 12,
    unit: 'كغ',
    defaultPrice: 2200,
    defaultSupplier: 'قصابة الأمانة - بجاية',
    icon: Beef,
  },
  {
    item: 'الدجاج الكامل المنظف',
    defaultQty: 16,
    unit: 'كغ',
    defaultPrice: 480,
    defaultSupplier: 'مداجن الهضاب',
    icon: Beef,
  },
  {
    item: 'سكالوب دجاج مرحي',
    defaultQty: 8,
    unit: 'كغ',
    defaultPrice: 1100,
    defaultSupplier: 'قصابة الأمانة - بجاية',
    icon: Beef,
  },
  {
    item: 'ماء معدني عبوة 5 لتر',
    defaultQty: 24,
    unit: 'عبوة',
    defaultPrice: 150,
    defaultSupplier: 'مؤسسة إفريقيا للتوزيع',
    icon: Droplets,
  },
  {
    item: 'بيض طازج استهلاك غذائي',
    defaultQty: 4,
    unit: 'صينية (30 بيضة)',
    defaultPrice: 580,
    defaultSupplier: 'مزرعة الخيرات',
    icon: Egg,
  },
  {
    item: 'جبن طري مخصص للأطفال',
    defaultQty: 15,
    unit: 'علبة (24 قطعة)',
    defaultPrice: 320,
    defaultSupplier: 'مؤسسة إفريقيا للتوزيع',
    icon: ShoppingBag,
  },
];

const APPROVED_SUPPLIERS = [
  'قصابة الأمانة - بجاية',
  'مداجن الهضاب',
  'مؤسسة إفريقيا للتوزيع',
  'مزرعة الخيرات',
  'تعاونية مطاحن الصومام',
];

export function RawdaMeatProvisionsView() {
  const [selectedYear, setSelectedYear] = useState('2025-2026');
  const [selectedMonth, setSelectedMonth] = useState('feb');
  const [selectedWeek, setSelectedWeek] = useState('1'); // '1' to '5' or 'ALL'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Comprehensive multi-year, multi-month provisions data store
  const [provisions, setProvisions] = useState(() => {
    const data = [];
    const years = ['2024-2025', '2025-2026', '2026-2027'];

    years.forEach((yr) => {
      RAWDA_MONTHS.forEach((m) => {
        for (let week = 1; week <= 5; week++) {
          COMMODITY_CATALOG.forEach((cat, cIdx) => {
            const qty = cat.defaultQty + (week % 2 === 0 ? (cIdx % 2 === 0 ? 1 : -1) : 0);
            const price = cat.defaultPrice;
            data.push({
              id: `prv-${yr}-${m.id}-w${week}-${cIdx + 1}`,
              academicYear: yr,
              month: m.id,
              week,
              item: cat.item,
              quantity: qty,
              unit: cat.unit,
              unitPrice: price,
              totalAmount: qty * price,
              supplier: cat.defaultSupplier,
              notes: 'توريد أسبوعي مطابق لشروط النظافة والصحة',
            });
          });
        }
      });
    });
    return data;
  });

  // UI Modals State
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  // Weekly Provision Plan Configuration State (Helper Tool)
  const [planConfig, setPlanConfig] = useState({
    targetScope: 'month', // 'week', 'month', 'year'
    targetWeek: '1',
    beefQty: 12,
    poultryQty: 16,
    scallopQty: 8,
    waterQty: 24,
    eggQty: 4,
    cheeseQty: 15,
  });

  // Inline Cell Editing State
  const [inlineEdit, setInlineEdit] = useState(null); // { id, field }
  const [inlineVal, setInlineVal] = useState('');

  // Right-Click Context Menu State
  const [contextMenu, setContextMenu] = useState(null); // { x, y, order }

  // New Order Form State
  const [orderForm, setOrderForm] = useState({
    week: 1,
    item: COMMODITY_CATALOG[0].item,
    quantity: 12,
    unit: 'كغ',
    unitPrice: 2200,
    supplier: 'قصابة الأمانة - بجاية',
    notes: '',
  });

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = () => setContextMenu(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Filter provisions list
  const filteredList = useMemo(() => {
    return provisions.filter((p) => {
      const matchYear = p.academicYear === selectedYear;
      const matchMonth = selectedMonth === 'ALL' || p.month === selectedMonth;
      const matchWeek = selectedWeek === 'ALL' || p.week === Number(selectedWeek);
      const matchCat = selectedCategory === 'ALL' || p.item === selectedCategory;
      const matchSearch =
        !searchTerm ||
        p.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.notes && p.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchYear && matchMonth && matchWeek && matchCat && matchSearch;
    });
  }, [provisions, selectedYear, selectedMonth, selectedWeek, selectedCategory, searchTerm]);

  // KPIs Calculations
  const totalCost = filteredList.reduce((acc, p) => acc + Number(p.totalAmount || 0), 0);
  const totalMeatKg = filteredList
    .filter((p) => p.item.includes('اللحم') || p.item.includes('الدجاج') || p.item.includes('سكالوب'))
    .reduce((acc, p) => acc + Number(p.quantity || 0), 0);
  const totalWaterUnits = filteredList
    .filter((p) => p.item.includes('ماء'))
    .reduce((acc, p) => acc + Number(p.quantity || 0), 0);
  const ordersCount = filteredList.length;

  const currentMonthObj = RAWDA_MONTHS.find((m) => m.id === selectedMonth);
  const currentMonthName = currentMonthObj ? currentMonthObj.nameAr : 'كافة الشهور';

  const kpiCards = [
    {
      label: 'إجمالي قيمة التموين والطلبيات',
      value: `${totalCost.toLocaleString()} دج`,
      icon: Coins,
      subtext: `${selectedWeek === 'ALL' ? 'كامل أسابيع الشهر' : `الأسبوع ${selectedWeek}`} (${currentMonthName} - ${selectedYear})`,
      change: 'مضبوط بفواتير ✓',
      isPositive: true,
    },
    {
      label: 'كمية اللحوم والدواجن الموردة',
      value: `${totalMeatKg.toLocaleString()} كغ`,
      icon: Beef,
      subtext: 'بقري طازج، دجاج كامل، وسكالوب مرحي',
      change: 'طازج أسبوعياً',
      isPositive: true,
    },
    {
      label: 'مخزون الماء المعدني (5 لتر)',
      value: `${totalWaterUnits.toLocaleString()} عبوة`,
      icon: Droplets,
      subtext: 'مياه شرب وطهي نقية للأطفال',
      change: 'كافي ومطابق',
      isPositive: true,
    },
    {
      label: 'عدد طلبيات التوريد المعتمدة',
      value: `${ordersCount} طلبيات`,
      icon: ShoppingBag,
      subtext: 'موردين محليين معتمدين ومطابقين للشروط',
      change: '100% مستلمة',
      isPositive: true,
    },
  ];

  // Inline Editing
  const startInlineEdit = (id, field, currentVal) => {
    setInlineEdit({ id, field });
    setInlineVal(String(currentVal ?? ''));
  };

  const commitInlineEdit = () => {
    if (!inlineEdit) return;
    const { id, field } = inlineEdit;

    setProvisions((prev) =>
      prev.map((order) => {
        if (order.id === id) {
          let updatedQty = order.quantity;
          let updatedPrice = order.unitPrice;
          let updatedSupplier = order.supplier;
          let updatedNotes = order.notes;

          if (field === 'quantity') updatedQty = Math.max(0, Number(inlineVal) || 0);
          if (field === 'unitPrice') updatedPrice = Math.max(0, Number(inlineVal) || 0);
          if (field === 'supplier') updatedSupplier = inlineVal;
          if (field === 'notes') updatedNotes = inlineVal;

          return {
            ...order,
            quantity: updatedQty,
            unitPrice: updatedPrice,
            totalAmount: updatedQty * updatedPrice,
            supplier: updatedSupplier,
            notes: updatedNotes,
          };
        }
        return order;
      })
    );
    setInlineEdit(null);
  };

  // Open Full Edit Modal
  const handleOpenEdit = (order) => {
    setEditingOrder(order);
    setOrderForm({
      week: order.week,
      item: order.item,
      quantity: order.quantity,
      unit: order.unit,
      unitPrice: order.unitPrice,
      supplier: order.supplier,
      notes: order.notes || '',
    });
    setIsAddModalOpen(true);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingOrder(null);
    setOrderForm({
      week: selectedWeek === 'ALL' ? 1 : Number(selectedWeek),
      item: COMMODITY_CATALOG[0].item,
      quantity: 12,
      unit: 'كغ',
      unitPrice: 2200,
      supplier: 'قصابة الأمانة - بجاية',
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  // Handle Commodity Change in Add/Edit Form
  const handleItemSelectChange = (itemTitle) => {
    const found = COMMODITY_CATALOG.find((c) => c.item === itemTitle);
    if (found) {
      setOrderForm({
        ...orderForm,
        item: found.item,
        unit: found.unit,
        unitPrice: found.defaultPrice,
        supplier: found.defaultSupplier,
        quantity: found.defaultQty,
      });
    } else {
      setOrderForm({ ...orderForm, item: itemTitle });
    }
  };

  // Save Order
  const handleSaveOrder = (e) => {
    e.preventDefault();
    const qty = Number(orderForm.quantity) || 0;
    const price = Number(orderForm.unitPrice) || 0;

    if (editingOrder) {
      setProvisions((prev) =>
        prev.map((p) =>
          p.id === editingOrder.id
            ? {
                ...p,
                week: Number(orderForm.week),
                item: orderForm.item,
                quantity: qty,
                unit: orderForm.unit,
                unitPrice: price,
                totalAmount: qty * price,
                supplier: orderForm.supplier,
                notes: orderForm.notes,
              }
            : p
        )
      );
    } else {
      const newEntry = {
        id: `prv-${selectedYear}-${Date.now()}`,
        academicYear: selectedYear,
        month: selectedMonth === 'ALL' ? 'feb' : selectedMonth,
        week: Number(orderForm.week),
        item: orderForm.item,
        quantity: qty,
        unit: orderForm.unit,
        unitPrice: price,
        totalAmount: qty * price,
        supplier: orderForm.supplier,
        notes: orderForm.notes || 'توريد معتمد',
      };
      setProvisions((prev) => [...prev, newEntry]);
    }

    setIsAddModalOpen(false);
  };

  // Delete Order
  const handleDeleteOrder = (id) => {
    if (window.confirm('هل أنت متأكد من حذف طلبية التموين هذه من السجل؟')) {
      setProvisions((prev) => prev.filter((p) => p.id !== id));
    }
  };

  // Context Menu Trigger
  const handleContextMenu = (e, order) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      order,
    });
  };

  // Apply Weekly Plan Configuration Helper Tool
  const handleApplyPlanConfig = () => {
    const qtyMap = {
      'اللحم البقري الطازج': Number(planConfig.beefQty),
      'الدجاج الكامل المنظف': Number(planConfig.poultryQty),
      'سكالوب دجاج مرحي': Number(planConfig.scallopQty),
      'ماء معدني عبوة 5 لتر': Number(planConfig.waterQty),
      'بيض طازج استهلاك غذائي': Number(planConfig.eggQty),
      'جبن طري مخصص للأطفال': Number(planConfig.cheeseQty),
    };

    setProvisions((prev) =>
      prev.map((order) => {
        let shouldApply = false;
        if (planConfig.targetScope === 'year') {
          shouldApply = order.academicYear === selectedYear;
        } else if (planConfig.targetScope === 'month') {
          shouldApply = order.academicYear === selectedYear && order.month === selectedMonth;
        } else if (planConfig.targetScope === 'week') {
          shouldApply =
            order.academicYear === selectedYear &&
            order.month === selectedMonth &&
            order.week === Number(planConfig.targetWeek);
        }

        if (shouldApply && qtyMap[order.item] !== undefined) {
          const newQty = qtyMap[order.item];
          return {
            ...order,
            quantity: newQty,
            totalAmount: newQty * order.unitPrice,
          };
        }
        return order;
      })
    );

    setIsPlanModalOpen(false);
    alert('تم ضبط وتطبيق خطة التموين الغذائي بنجاح!');
  };

  // Quick Supplier Changer from Context Menu
  const handleQuickChangeSupplier = (orderId, newSupplier) => {
    setProvisions((prev) =>
      prev.map((p) => (p.id === orderId ? { ...p, supplier: newSupplier } : p))
    );
    setContextMenu(null);
  };

  // Copy row to clipboard as TSV
  const handleCopyTSV = (order) => {
    const tsv = `${order.academicYear}\t${order.month}\tالأسبوع ${order.week}\t${order.item}\t${order.quantity} ${order.unit}\t${order.unitPrice}\t${order.totalAmount}\t${order.supplier}\t${order.notes || ''}`;
    navigator.clipboard.writeText(tsv);
    alert('تم نسخ بيانات الطلبية إلى الحافظة بنجاح');
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['الموسم', 'الشهر', 'الأسبوع', 'المادة الغذائية', 'الكمية', 'الوحدة', 'السعر للوحدة (دج)', 'المبلغ الإجمالي (دج)', 'المورد', 'الملاحظات'];
    const rows = filteredList.map((p) => [
      p.academicYear,
      p.month,
      `الأسبوع ${p.week}`,
      `"${p.item}"`,
      p.quantity,
      p.unit,
      p.unitPrice,
      p.totalAmount,
      `"${p.supplier}"`,
      `"${(p.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rawda_meat_provisions_${selectedYear}_${selectedMonth}_week_${selectedWeek}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Group provisions by week for ALL view
  const groupedByWeek = useMemo(() => {
    if (selectedWeek !== 'ALL') {
      return [{ weekNum: Number(selectedWeek), list: filteredList }];
    }
    return [1, 2, 3, 4, 5].map((w) => {
      const list = filteredList.filter((p) => p.week === w);
      return { weekNum: w, list };
    }).filter((g) => g.list.length > 0);
  }, [filteredList, selectedWeek]);

  return (
    <div className="space-y-3 p-3 bg-slate-50 min-h-screen text-slate-800 font-sans" dir="rtl">
      {/* 1. TOP COMPACT HEADER (Replacing bulky sub-header banner) */}
      <div className="bg-white border border-slate-200 px-3 py-2 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        {/* Right side: Title & Info Button */}
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-blue-900 text-white font-bold text-[11px] rounded-xs">
            روضة وحضانة الأطفال العباقرة
          </span>
          <span className="text-slate-300">|</span>
          <h1 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Beef className="w-4 h-4 text-blue-900" />
            طلبيات اللحوم والتموين الغذائي الأسبوعي
          </h1>
          <span className="text-[11px] text-slate-500 hidden md:inline font-sans">
            (Rawda Weekly Provisions, Poultry, Meat & Dietary Supplies)
          </span>

          {/* Info Modal Button */}
          <button
            onClick={() => setIsInfoModalOpen(true)}
            title="معلومات وتفاصيل الواجهة"
            className="p-1 text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-xs transition-colors flex items-center gap-0.5 text-xs font-semibold cursor-pointer"
          >
            <Info className="w-4 h-4 text-blue-700" />
            <span className="text-[11px] underline">دليل الواجهة</span>
          </button>
        </div>

        {/* Left side: Year Selector, Search & Action Icons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Year selector */}
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[11px] font-semibold text-slate-600">الموسم:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent font-mono text-xs font-bold text-blue-950 focus:outline-hidden cursor-pointer"
            >
              <option value="2024-2025">2024-2025</option>
              <option value="2025-2026">2025-2026</option>
              <option value="2026-2027">2026-2027</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث بالمادة، المورد..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-7 w-40 ps-7 pe-2 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-900 transition-colors"
            />
          </div>

          {/* Weekly Commodity Plan Helper Button */}
          <button
            onClick={() => setIsPlanModalOpen(true)}
            title="تخصيص وتعديل خطة التموين الأسبوعية المعتمدة"
            className="h-7 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>خطة التموين الأسبوعية</span>
          </button>

          {/* Icon-Only Action Buttons */}
          <button
            onClick={() => window.print()}
            title="طباعة السجل الحالي"
            className="h-7 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1 text-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-700" />
          </button>

          <button
            onClick={handleExportCSV}
            title="تصدير كملف CSV"
            className="h-7 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1 text-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-700" />
          </button>

          <button
            onClick={handleOpenAdd}
            title="تسجيل طلبية تموين جديدة"
            className="h-7 px-2.5 bg-blue-900 hover:bg-blue-950 text-white font-semibold flex items-center gap-1 text-xs shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>طلبية جديدة</span>
          </button>
        </div>
      </div>

      {/* 2. 11-MONTH NAVIGATION TABS */}
      <div className="bg-white border border-slate-200 p-1.5 shadow-2xs flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setSelectedMonth('ALL')}
          className={`h-7 px-2.5 text-xs font-bold shrink-0 transition-colors border ${
            selectedMonth === 'ALL'
              ? 'bg-blue-900 text-white border-blue-900 shadow-2xs'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          كافة الشهور (الموسم كاملاً)
        </button>
        <span className="w-px h-4 bg-slate-200 shrink-0 mx-0.5" />

        {RAWDA_MONTHS.map((m) => {
          const isSelected = selectedMonth === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setSelectedMonth(m.id)}
              className={`h-7 px-2.5 text-xs font-semibold shrink-0 transition-colors border ${
                isSelected
                  ? 'bg-blue-900 text-white border-blue-900 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>{m.nameAr}</span>
            </button>
          );
        })}
      </div>

      {/* 3. WEEK & COMMODITY CATEGORY FILTER SUB-BAR */}
      <div className="bg-white border border-slate-200 px-3 py-1.5 shadow-2xs flex items-center justify-between gap-2 flex-wrap text-xs">
        {/* Weeks Filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-slate-600 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-blue-900" />
            الأسابيع:
          </span>
          <button
            onClick={() => setSelectedWeek('ALL')}
            className={`h-6 px-2 text-xs font-semibold border transition-colors ${
              selectedWeek === 'ALL'
                ? 'bg-blue-900 text-white border-blue-900'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            كافة الأسابيع (1 - 5)
          </button>
          {[1, 2, 3, 4, 5].map((w) => (
            <button
              key={w}
              onClick={() => setSelectedWeek(String(w))}
              className={`h-6 px-2.5 text-xs font-semibold border transition-colors ${
                selectedWeek === String(w)
                  ? 'bg-blue-900 text-white border-blue-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              الأسبوع {w}
            </button>
          ))}
        </div>

        {/* Commodity Category Dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500">فئة المادة:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-6 px-2 border border-slate-300 bg-slate-50 text-xs font-semibold focus:bg-white focus:border-blue-900"
          >
            <option value="ALL">كافة الفئات (6 فئات)</option>
            {COMMODITY_CATALOG.map((c, cIdx) => (
              <option key={cIdx} value={c.item}>
                {c.item}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. KPI METRICS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white border border-slate-200 p-2.5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-semibold">{kpi.label}</span>
                <div className="p-1 bg-slate-50 rounded-xs text-blue-900 border border-slate-100">
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <div className="text-base font-bold font-mono text-slate-900 leading-tight">
                  {kpi.value}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
                  <span>{kpi.subtext}</span>
                  <span className="text-emerald-700 font-bold font-mono">{kpi.change}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. INTERACTIVE PROVISIONS TABLE */}
      <div className="bg-white border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-3 py-1.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">سجل فواتير وطلبيات التموين الغذائي للأطفال</span>
            <span className="text-slate-400 font-mono text-[11px]">
              ({filteredList.length} طلبية مسجلة)
            </span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-2">
            <span className="bg-amber-50 border border-amber-200 text-amber-900 px-1.5 py-0.5 rounded-xs">
              💡 انقر نقراً مزدوجاً أو بالزر الأيمن لتعديل الكمية والسعر والمورد
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs border-collapse">
            <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold select-none">
              <tr>
                <th className="p-2 text-center border-e border-slate-200 w-10">#</th>
                <th className="p-2 text-center border-e border-slate-200 min-w-[80px]">الأسبوع</th>
                <th className="p-2 text-start border-e border-slate-200 min-w-[200px]">المادة التموينية</th>
                <th className="p-2 text-center border-e border-slate-200 min-w-[110px]">الكمية المستلمة</th>
                <th className="p-2 text-center border-e border-slate-200 min-w-[110px]">سعر الوحدة (دج)</th>
                <th className="p-2 text-end border-e border-slate-200 min-w-[130px]">المبلغ الإجمالي (دج)</th>
                <th className="p-2 text-start border-e border-slate-200 min-w-[180px]">المورد المعتمد</th>
                <th className="p-2 text-start border-e border-slate-200 min-w-[240px]">الملاحظات وتفاصيل الاستلام</th>
                <th className="p-2 text-center min-w-[90px] print:hidden">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {groupedByWeek.map((grp) => {
                const weekTotal = grp.list.reduce((acc, p) => acc + Number(p.totalAmount || 0), 0);

                return (
                  <React.Fragment key={grp.weekNum}>
                    {/* Week Sub-Header when viewing ALL weeks */}
                    {selectedWeek === 'ALL' && (
                      <tr className="bg-slate-200/70 border-y border-slate-300 font-bold text-slate-800">
                        <td colSpan={9} className="p-1.5 px-3">
                          <div className="flex items-center justify-between">
                            <span className="text-blue-900 font-bold">الأسبوع {grp.weekNum}</span>
                            <span className="font-mono text-slate-600 text-[11px]">
                              {grp.list.length} طلبيات | {weekTotal.toLocaleString()} دج
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}

                    {grp.list.map((order, idx) => {
                      const isEditingQty = inlineEdit?.id === order.id && inlineEdit?.field === 'quantity';
                      const isEditingPrice = inlineEdit?.id === order.id && inlineEdit?.field === 'unitPrice';
                      const isEditingSupplier = inlineEdit?.id === order.id && inlineEdit?.field === 'supplier';
                      const isEditingNotes = inlineEdit?.id === order.id && inlineEdit?.field === 'notes';

                      return (
                        <tr
                          key={order.id}
                          onContextMenu={(e) => handleContextMenu(e, order)}
                          className="hover:bg-blue-50/40 transition-colors h-8 text-[11px]"
                        >
                          {/* Row Number */}
                          <td className="p-1 text-center border-e border-slate-200 font-mono text-slate-400 font-bold">
                            {idx + 1}
                          </td>

                          {/* Week */}
                          <td className="p-1 text-center border-e border-slate-200 font-semibold text-slate-700">
                            الأسبوع {order.week}
                          </td>

                          {/* Item Name */}
                          <td className="p-1 border-e border-slate-200 font-bold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-900 shrink-0" />
                              <span>{order.item}</span>
                            </div>
                          </td>

                          {/* Quantity */}
                          <td
                            onDoubleClick={() => startInlineEdit(order.id, 'quantity', order.quantity)}
                            className="p-1 text-center border-e border-slate-200 font-mono font-bold text-blue-900 cursor-pointer"
                          >
                            {isEditingQty ? (
                              <input
                                type="number"
                                autoFocus
                                value={inlineVal}
                                onChange={(e) => setInlineVal(e.target.value)}
                                onBlur={commitInlineEdit}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') commitInlineEdit();
                                  if (e.key === 'Escape') setInlineEdit(null);
                                }}
                                className="w-16 h-6 px-1 text-center text-xs border border-blue-600 bg-white font-mono font-bold mx-auto block"
                              />
                            ) : (
                              <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-xs">
                                {order.quantity} {order.unit}
                              </span>
                            )}
                          </td>

                          {/* Unit Price */}
                          <td
                            onDoubleClick={() => startInlineEdit(order.id, 'unitPrice', order.unitPrice)}
                            className="p-1 text-center border-e border-slate-200 font-mono text-slate-700 cursor-pointer"
                          >
                            {isEditingPrice ? (
                              <input
                                type="number"
                                autoFocus
                                value={inlineVal}
                                onChange={(e) => setInlineVal(e.target.value)}
                                onBlur={commitInlineEdit}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') commitInlineEdit();
                                  if (e.key === 'Escape') setInlineEdit(null);
                                }}
                                className="w-20 h-6 px-1 text-center text-xs border border-blue-600 bg-white font-mono mx-auto block"
                              />
                            ) : (
                              <span>{order.unitPrice.toLocaleString()} دج</span>
                            )}
                          </td>

                          {/* Total Amount */}
                          <td className="p-1 text-end border-e border-slate-200 font-mono font-bold text-emerald-800 text-xs">
                            {Number(order.totalAmount || 0).toLocaleString()} دج
                          </td>

                          {/* Supplier */}
                          <td
                            onDoubleClick={() => startInlineEdit(order.id, 'supplier', order.supplier)}
                            className="p-1 border-e border-slate-200 font-semibold text-slate-800 cursor-pointer"
                          >
                            {isEditingSupplier ? (
                              <select
                                autoFocus
                                value={inlineVal}
                                onChange={(e) => setInlineVal(e.target.value)}
                                onBlur={commitInlineEdit}
                                className="w-full h-6 px-1 text-xs border border-blue-600 bg-white font-semibold"
                              >
                                {APPROVED_SUPPLIERS.map((s, sIdx) => (
                                  <option key={sIdx} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span>{order.supplier}</span>
                            )}
                          </td>

                          {/* Notes */}
                          <td
                            onDoubleClick={() => startInlineEdit(order.id, 'notes', order.notes)}
                            className="p-1 border-e border-slate-200 text-slate-600 cursor-pointer truncate max-w-[240px]"
                            title={order.notes}
                          >
                            {isEditingNotes ? (
                              <input
                                type="text"
                                autoFocus
                                value={inlineVal}
                                onChange={(e) => setInlineVal(e.target.value)}
                                onBlur={commitInlineEdit}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') commitInlineEdit();
                                  if (e.key === 'Escape') setInlineEdit(null);
                                }}
                                className="w-full h-6 px-1 text-xs border border-blue-600 bg-white"
                              />
                            ) : (
                              <span>{order.notes || '-'}</span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="p-1 text-center print:hidden">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(order)}
                                title="تعديل الطلبية"
                                className="p-1 bg-slate-100 hover:bg-amber-50 text-amber-700 border border-slate-200 rounded-xs transition-colors"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteOrder(order.id)}
                                title="حذف الطلبية"
                                className="p-1 bg-slate-100 hover:bg-rose-50 text-rose-700 border border-slate-200 rounded-xs transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Weekly Subtotal Row */}
                    <tr className="bg-slate-100/90 font-bold border-y border-slate-300 font-mono text-[11px]">
                      <td colSpan={5} className="p-1.5 px-3 text-start font-sans text-slate-700 border-e border-slate-200">
                        مجموع فواتير طلبيات الأسبوع {grp.weekNum}
                      </td>
                      <td className="p-1.5 text-end border-e border-slate-200 text-emerald-800 font-bold">
                        {weekTotal.toLocaleString()} دج
                      </td>
                      <td colSpan={3} className="p-1.5 px-3 text-start font-sans text-slate-500 text-[10px]">
                        {grp.list.length} مواد تموينية مستلمة
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>

            {/* GRAND TOTAL ROW */}
            <tfoot className="bg-slate-200 font-bold border-t-2 border-slate-400 font-mono text-xs">
              <tr>
                <td colSpan={5} className="p-2 px-3 text-start font-sans text-slate-900 border-e border-slate-300">
                  المجموع الإجمالي ({selectedWeek === 'ALL' ? 'كامل الشهر' : `الأسبوع ${selectedWeek}`} - {currentMonthName})
                </td>
                <td className="p-2 text-end border-e border-slate-300 text-emerald-900 text-sm font-bold">
                  {totalCost.toLocaleString()} دج
                </td>
                <td colSpan={3} className="p-2 px-3 text-start font-sans text-xs text-slate-600">
                  {filteredList.length} طلبيات تموين رسمية مسجلة
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 6. RIGHT-CLICK CONTEXT MENU */}
      {contextMenu && (
        <div
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 bg-white border border-slate-300 shadow-xl py-1 text-xs w-60 divide-y divide-slate-100 animate-in fade-in zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1 font-bold text-slate-700 bg-slate-50 text-[11px] flex items-center justify-between">
            <span>{contextMenu.order.item}</span>
            <span className="text-emerald-700 font-mono font-bold">
              {Number(contextMenu.order.totalAmount).toLocaleString()} دج
            </span>
          </div>

          {/* Quick Supplier Picker Submenu */}
          <div className="p-1">
            <div className="text-[10px] text-slate-400 px-2 py-0.5 font-bold">تغيير المورد المعتمد:</div>
            <div className="max-h-28 overflow-y-auto space-y-0.5">
              {APPROVED_SUPPLIERS.map((sup, sIdx) => (
                <button
                  key={sIdx}
                  onClick={() => handleQuickChangeSupplier(contextMenu.order.id, sup)}
                  className={`w-full text-start px-2 py-1 text-[11px] rounded-xs truncate hover:bg-blue-50 ${
                    contextMenu.order.supplier === sup ? 'text-blue-900 font-bold bg-blue-50/60' : 'text-slate-700'
                  }`}
                >
                  • {sup}
                </button>
              ))}
            </div>
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                handleOpenEdit(contextMenu.order);
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-start hover:bg-blue-50 flex items-center gap-2 text-slate-700"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-700" />
              <span>تعديل الطلبية بالكامل</span>
            </button>
            <button
              onClick={() => {
                startInlineEdit(contextMenu.order.id, 'quantity', contextMenu.order.quantity);
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-start hover:bg-blue-50 flex items-center gap-2 text-slate-700"
            >
              <Edit2 className="w-3.5 h-3.5 text-blue-600" />
              <span>تعديل الكمية مباشرة</span>
            </button>
            <button
              onClick={() => {
                handleCopyTSV(contextMenu.order);
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-start hover:bg-blue-50 flex items-center gap-2 text-slate-700"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>نسخ بيانات الطلبية (TSV)</span>
            </button>
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                handleDeleteOrder(contextMenu.order.id);
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-start hover:bg-rose-50 text-rose-700 flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>حذف الطلبية من السجل</span>
            </button>
          </div>
        </div>
      )}

      {/* 7. WEEKLY PROVISION PLAN CONFIGURATION HELPER MODAL */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-lg p-5 text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 text-amber-900 rounded-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    أداة تخصيص خطة التموين الأسبوعي المعتمدة
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    تعديل كميات الحصص الغذائية القياسية وتطبيقها دفعة واحدة
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scope Selection */}
            <div className="bg-slate-50 p-2 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 block text-[11px]">نطاق تطبيق الخطة:</span>
              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="planScope"
                    value="month"
                    checked={planConfig.targetScope === 'month'}
                    onChange={(e) => setPlanConfig({ ...planConfig, targetScope: e.target.value })}
                  />
                  <span>كامل شهر {currentMonthName}</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="planScope"
                    value="week"
                    checked={planConfig.targetScope === 'week'}
                    onChange={(e) => setPlanConfig({ ...planConfig, targetScope: e.target.value })}
                  />
                  <span>أسبوع محدد:</span>
                  <select
                    value={planConfig.targetWeek}
                    onChange={(e) => setPlanConfig({ ...planConfig, targetWeek: e.target.value })}
                    disabled={planConfig.targetScope !== 'week'}
                    className="h-6 px-1 border border-slate-300 bg-white text-xs ms-1"
                  >
                    {[1, 2, 3, 4, 5].map((w) => (
                      <option key={w} value={w}>
                        الأسبوع {w}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="planScope"
                    value="year"
                    checked={planConfig.targetScope === 'year'}
                    onChange={(e) => setPlanConfig({ ...planConfig, targetScope: e.target.value })}
                  />
                  <span>كامل الموسم الدراسي ({selectedYear})</span>
                </label>
              </div>
            </div>

            {/* Commodities Standard Quantities Form */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-slate-50 border border-slate-200">
                <label className="block font-bold text-slate-800 mb-1">اللحم البقري الطازج (كغ)</label>
                <input
                  type="number"
                  min="0"
                  value={planConfig.beefQty}
                  onChange={(e) => setPlanConfig({ ...planConfig, beefQty: e.target.value })}
                  className="w-full h-7 px-2 border border-slate-300 bg-white font-mono font-bold"
                />
              </div>

              <div className="p-2 bg-slate-50 border border-slate-200">
                <label className="block font-bold text-slate-800 mb-1">الدجاج الكامل (كغ)</label>
                <input
                  type="number"
                  min="0"
                  value={planConfig.poultryQty}
                  onChange={(e) => setPlanConfig({ ...planConfig, poultryQty: e.target.value })}
                  className="w-full h-7 px-2 border border-slate-300 bg-white font-mono font-bold"
                />
              </div>

              <div className="p-2 bg-slate-50 border border-slate-200">
                <label className="block font-bold text-slate-800 mb-1">سكالوب دجاج مرحي (كغ)</label>
                <input
                  type="number"
                  min="0"
                  value={planConfig.scallopQty}
                  onChange={(e) => setPlanConfig({ ...planConfig, scallopQty: e.target.value })}
                  className="w-full h-7 px-2 border border-slate-300 bg-white font-mono font-bold"
                />
              </div>

              <div className="p-2 bg-slate-50 border border-slate-200">
                <label className="block font-bold text-slate-800 mb-1">ماء معدني 5 لتر (عبوة)</label>
                <input
                  type="number"
                  min="0"
                  value={planConfig.waterQty}
                  onChange={(e) => setPlanConfig({ ...planConfig, waterQty: e.target.value })}
                  className="w-full h-7 px-2 border border-slate-300 bg-white font-mono font-bold"
                />
              </div>

              <div className="p-2 bg-slate-50 border border-slate-200">
                <label className="block font-bold text-slate-800 mb-1">بيض طازج (صينية 30)</label>
                <input
                  type="number"
                  min="0"
                  value={planConfig.eggQty}
                  onChange={(e) => setPlanConfig({ ...planConfig, eggQty: e.target.value })}
                  className="w-full h-7 px-2 border border-slate-300 bg-white font-mono font-bold"
                />
              </div>

              <div className="p-2 bg-slate-50 border border-slate-200">
                <label className="block font-bold text-slate-800 mb-1">جبن طري (علبة 24)</label>
                <input
                  type="number"
                  min="0"
                  value={planConfig.cheeseQty}
                  onChange={(e) => setPlanConfig({ ...planConfig, cheeseQty: e.target.value })}
                  className="w-full h-7 px-2 border border-slate-300 bg-white font-mono font-bold"
                />
              </div>
            </div>

            <div className="border-t pt-3 flex justify-between items-center">
              <span className="text-[11px] text-slate-500">
                سيتم تحديث كميات المواد وحساب المبالغ الإجمالية فورياً.
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleApplyPlanConfig}
                  className="px-4 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>تطبيق الخطة</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. INFO MODAL (REPLACING OLD BULKY BANNER) */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-lg p-5 text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 text-blue-900 rounded-xs">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    دليل واجهة: طلبيات اللحوم والتموين الغذائي الأسبوعي (1.9)
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Rawda Weekly Provisions, Poultry, Meat & Dietary Supplies
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-slate-700 leading-relaxed">
              <div className="p-2.5 bg-blue-50 border-s-4 border-blue-900 text-blue-950">
                <p className="font-semibold mb-1">الهدف والمفهوم التشغيلي:</p>
                <p className="text-[11px]">
                  مراقبة ومتابعة التموين الغذائي الأسبوعي لفئات الروضة الستة المعتمدة (لحم بقري، دجاج،
                  سكالوب، ماء 5 لتر، بيض، جبن) مع احتساب إجمالي الفواتير وفحص الموردين المعتمدين،
                  لضمان سلامة الوجبات الغذائية المقدمة للأطفال والتحكم في النفقات.
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="font-bold text-slate-800">ميزات الواجهة المحدثة:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                  <li>
                    <strong>دعم متعدد السنوات والأشهر:</strong> إمكانية التنقل بين المواسم الدراسية
                    (2024-2025، 2025-2026، 2026-2027) وشهور الموسم الـ 11.
                  </li>
                  <li>
                    <strong>أداة تخصيص خطة التموين:</strong> إمكانية تعديل حصص المواد الغذائية الستة
                    لكل أسبوع أو شهر أو موسم كامل مع توفير أدوات مساعدة سريعة.
                  </li>
                  <li>
                    <strong>التعديل المباشر بالماوس:</strong> انقر نقراً مزدوجاً على خانة الكمية أو
                    السعر أو المورد لتعديلها فوراً أو انقر بالزر الأيمن لفتح القائمة السريعة.
                  </li>
                  <li>
                    <strong>المجاميع الأسبوعية والكلية:</strong> احتساب فوري لتكلفة التموين وكميات
                    اللحوم والمياه المستلمة.
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t pt-3 flex justify-end">
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="px-4 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-semibold text-xs shadow-2xs cursor-pointer"
              >
                فهمت ذلك، إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. ADD / EDIT PROVISION ORDER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">
                {editingOrder ? 'تعديل طلبية تموين غذائي' : 'تسجيل طلبية تموين جديدة'}
              </span>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOrder} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الأسبوع *</label>
                  <select
                    value={orderForm.week}
                    onChange={(e) => setOrderForm({ ...orderForm, week: Number(e.target.value) })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-semibold"
                  >
                    {[1, 2, 3, 4, 5].map((w) => (
                      <option key={w} value={w}>
                        الأسبوع {w}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المادة التموينية *</label>
                  <select
                    value={orderForm.item}
                    onChange={(e) => handleItemSelectChange(e.target.value)}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-semibold"
                  >
                    {COMMODITY_CATALOG.map((c, cIdx) => (
                      <option key={cIdx} value={c.item}>
                        {c.item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الكمية *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={orderForm.quantity}
                    onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono font-bold text-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الوحدة *</label>
                  <input
                    type="text"
                    required
                    value={orderForm.unit}
                    onChange={(e) => setOrderForm({ ...orderForm, unit: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">سعر الوحدة (دج) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={orderForm.unitPrice}
                    onChange={(e) => setOrderForm({ ...orderForm, unitPrice: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                  />
                </div>
              </div>

              <div className="p-2 bg-slate-100 border border-slate-200 text-xs flex justify-between items-center font-mono">
                <span className="text-slate-600 font-sans">المبلغ الإجمالي المحتسب:</span>
                <span className="font-bold text-emerald-800">
                  {((Number(orderForm.quantity) || 0) * (Number(orderForm.unitPrice) || 0)).toLocaleString()} دج
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">المورد المعتمد *</label>
                <select
                  value={orderForm.supplier}
                  onChange={(e) => setOrderForm({ ...orderForm, supplier: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-semibold"
                >
                  {APPROVED_SUPPLIERS.map((s, sIdx) => (
                    <option key={sIdx} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">الملاحظات وتفاصيل الاستلام</label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات الجودة، شهادة الذبح الحلال، معاينة الصلاحية..."
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                  className="w-full p-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-semibold flex items-center gap-1 shadow-2xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingOrder ? 'تحديث الطلبية' : 'حفظ الطلبية'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
