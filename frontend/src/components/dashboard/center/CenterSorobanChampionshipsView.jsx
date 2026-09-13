import React, { useState, useMemo, useEffect } from 'react';
import {
  Trophy,
  Users,
  Coins,
  Medal,
  Plus,
  X,
  Printer,
  Download,
  Search,
  Info,
  Calendar,
  Filter,
  Check,
  Edit2,
  Trash2,
  Copy,
  FileText,
  TrendingUp,
  Award,
} from 'lucide-react';
import { ReceiptVoucherModal } from '../common/ReceiptVoucherModal';
import { MOCK_CENTER_CHAMPIONSHIPS } from '../../../mock/centerMockData';

const CHAMPIONSHIP_CATEGORIES = [
  'المستوى p1 - البطولة الولائية',
  'المستوى p2 - البطولة الولائية',
  'المستوى p3 - البطولة الولائية',
  'المستوى s1 - البطولة الولائية',
  'المستوى s2 - البطولة الولائية',
  'البطولة الوطنية للعباقرة - الجزائر العاصمة',
  'البطولة الدولية المغاربية للحساب الذهني',
];

export function CenterSorobanChampionshipsView() {
  const [selectedYear, setSelectedYear] = useState('2025-2026');
  const [activeTab, setActiveTab] = useState('table'); // 'table' | 'kpis'
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Contestants Dataset with multi-year support
  const [contestants, setContestants] = useState(() => {
    return MOCK_CENTER_CHAMPIONSHIPS.map((c, idx) => ({
      ...c,
      id: `CHAMP-${idx + 1}`,
      academicYear: '2025-2026',
      receiptNumber: c.receiptNumber || `REC-CHAMP-26-${idx + 1}`,
      status: c.categoryLevel.includes('الوطنية') ? 'مؤهل للبطولة الوطنية' : 'مشارك رسمي',
      notes: c.notes || 'تسجيل معتمد مع إيصال القبض',
    }));
  });

  // UI Modals
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingContestant, setEditingContestant] = useState(null);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  // Inline Cell Editing
  const [inlineEdit, setInlineEdit] = useState(null); // { id, field }
  const [inlineVal, setInlineVal] = useState('');

  // Right-Click Context Menu
  const [contextMenu, setContextMenu] = useState(null);

  // Close context menu on external click
  useEffect(() => {
    const handleWindowClick = () => setContextMenu(null);
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  // Filtered contestants
  const filteredContestants = useMemo(() => {
    return contestants.filter((c) => {
      const matchYear = !c.academicYear || c.academicYear === selectedYear;
      const matchCat = categoryFilter === 'ALL' || c.categoryLevel === categoryFilter;
      const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
      const matchSearch =
        c.contestantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.categoryLevel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.notes.toLowerCase().includes(searchTerm.toLowerCase());
      return matchYear && matchCat && matchStatus && matchSearch;
    });
  }, [contestants, selectedYear, categoryFilter, statusFilter, searchTerm]);

  // KPIs
  const totalContestants = filteredContestants.length;
  const totalFeesAll = filteredContestants.reduce((acc, c) => acc + (c.regFee || 0), 0);
  const totalCollectedAll = filteredContestants.reduce((acc, c) => acc + (c.confirmedPaid || 0), 0);
  const nationalQualifiers = filteredContestants.filter((c) =>
    c.categoryLevel.includes('الوطنية') || c.status.includes('الوطنية')
  ).length;

  // Inline Cell Edit Save
  const handleInlineSave = (id, field) => {
    setContestants((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const updated = { ...c, [field]: inlineVal };
        if (['regFee', 'confirmedPaid'].includes(field)) {
          updated[field] = Number(inlineVal) || 0;
        }
        return updated;
      })
    );
    setInlineEdit(null);
  };

  // Open Context Menu
  const handleContextMenu = (e, contestant) => {
    e.preventDefault();
    e.stopPropagation();
    const x = Math.min(e.clientX, window.innerWidth - 220);
    const y = Math.min(e.clientY, window.innerHeight - 250);
    setContextMenu({ x, y, contestant });
  };

  // Open Voucher Preview
  const handleOpenVoucher = (c) => {
    setSelectedVoucher({
      receiptNumber: c.receiptNumber || 'REC-CHAMP-AUTO',
      payerName: c.contestantName,
      category: `رسوم المشاركة - ${c.categoryLevel}`,
      amount: c.confirmedPaid || c.regFee,
      paymentMethod: 'نقداً (خزينة المركز)',
      branch: 'المركز التعليمي والأكاديمي',
      notes: `البطولات والمسابقات الرسمية - ${c.notes || ''}`,
    });
  };

  // Save Edit
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (editingContestant) {
      setContestants((prev) =>
        prev.map((c) => (c.id === editingContestant.id ? editingContestant : c))
      );
      setEditingContestant(null);
    }
  };

  // Add New Contestant Form
  const [newFormData, setNewFormData] = useState({
    contestantName: '',
    categoryLevel: CHAMPIONSHIP_CATEGORIES[0],
    regFee: 4500,
    confirmedPaid: 4500,
    receiptNumber: '',
    status: 'مشارك رسمي',
    notes: 'تسجيل معتمد بالبطولة',
  });

  const handleAddNewSubmit = (e) => {
    e.preventDefault();
    if (!newFormData.contestantName.trim()) return;

    const seq = contestants.length + 1;
    const newEntry = {
      id: `CHAMP-${Date.now()}`,
      seq,
      academicYear: selectedYear,
      contestantName: newFormData.contestantName.trim(),
      categoryLevel: newFormData.categoryLevel,
      regFee: Number(newFormData.regFee) || 4500,
      confirmedPaid: Number(newFormData.confirmedPaid) || 4500,
      receiptNumber: newFormData.receiptNumber || `REC-CHAMP-26-${seq}`,
      status: newFormData.status,
      notes: newFormData.notes || 'مشارك معتمد',
    };

    setContestants([newEntry, ...contestants]);
    setIsAddModalOpen(false);
    setNewFormData({
      contestantName: '',
      categoryLevel: CHAMPIONSHIP_CATEGORIES[0],
      regFee: 4500,
      confirmedPaid: 4500,
      receiptNumber: '',
      status: 'مشارك رسمي',
      notes: 'تسجيل معتمد بالبطولة',
    });
  };

  // Delete contestant
  const handleDeleteContestant = (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المتسابق من سجل البطولة؟')) {
      setContestants((prev) => prev.filter((c) => c.id !== id));
      setContextMenu(null);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      '#',
      'اسم المتسابق',
      'فئة ومستوى البطولة',
      'رسوم المشاركة (دج)',
      'المبلغ المسدد',
      'رقم الوصل',
      'الحالة',
      'ملاحظات',
    ];
    const rows = filteredContestants.map((c) => [
      c.seq,
      `"${c.contestantName}"`,
      `"${c.categoryLevel}"`,
      c.regFee,
      c.confirmedPaid,
      `"${c.receiptNumber}"`,
      `"${c.status}"`,
      `"${c.notes || ''}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `championships_${selectedYear}.csv`);
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
          <div className="p-1 bg-amber-50 text-amber-700 border border-amber-200">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 text-sm">البطولات (السوربان والحساب الذهني)</span>
              <span className="text-[10px] text-slate-400">|</span>
              <span className="text-[10px] text-slate-500 font-mono">Soroban Championships</span>
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
              aria-label="تحديد الموسم التنافسي للبطولة"
              className="bg-transparent font-bold text-slate-800 text-xs border-none focus:outline-hidden cursor-pointer"
            >
              <option value="2024-2025">موسم 2024 - 2025</option>
              <option value="2025-2026">موسم 2025 - 2026</option>
              <option value="2026-2027">موسم 2026 - 2027</option>
            </select>
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 border border-slate-200">
            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1 text-xs font-bold transition-colors ${
                activeTab === 'table'
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              سجل المتسابقين ({filteredContestants.length})
            </button>
            <button
              onClick={() => setActiveTab('kpis')}
              className={`px-3 py-1 text-xs font-bold flex items-center gap-1 transition-colors ${
                activeTab === 'kpis'
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              مؤشرات الأداء (KPIs)
            </button>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1 border-s border-slate-200 ps-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              title="إضافة متسابق جديد بالبطولة"
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
              title="طباعة السجل"
              className="p-1 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsInfoModalOpen(true)}
              title="معلومات ودليل استخدام سجل البطولات"
              className="p-1 hover:bg-amber-50 text-amber-700 border border-amber-200 transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Filter Bar */}
      {activeTab === 'table' && (
        <div className="flex items-center justify-between px-3 py-1 bg-white border-b border-slate-200 shrink-0 gap-2">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute right-2 top-1.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="بحث باسم المتسابق، فئة البطولة، أو رقم الوصل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-7 pr-7 pl-2 bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:border-blue-900 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="تصفية حسب نوع ومستوى البطولة"
                className="h-7 px-2 bg-slate-50 border border-slate-200 text-[11px] text-slate-700 focus:outline-hidden"
              >
                <option value="ALL">جميع البطولات والمستويات</option>
                {CHAMPIONSHIP_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="تصفية حسب حالة التأهل"
                className="h-7 px-2 bg-slate-50 border border-slate-200 text-[11px] text-slate-700 focus:outline-hidden"
              >
                <option value="ALL">جميع الحالات</option>
                <option value="مشارك رسمي">مشارك رسمي</option>
                <option value="مؤهل للبطولة الوطنية">مؤهل للبطولة الوطنية</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
            <span>
              المتسابقين:{' '}
              <strong className="text-slate-800">{filteredContestants.length}</strong>
            </span>
            <span>
              المؤهلين للوطني:{' '}
              <strong className="text-amber-700">{nationalQualifiers}</strong>
            </span>
            <span>
              المحصل:{' '}
              <strong className="text-emerald-700">{totalCollectedAll.toLocaleString()} دج</strong>
            </span>
          </div>
        </div>
      )}

      {/* 3. Main Workspace Area */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'table' ? (
          <div className="min-w-full inline-block align-middle">
            <table className="w-full text-start text-xs border-collapse select-none">
              <thead className="bg-slate-100 sticky top-0 z-10 border-b border-slate-300 text-slate-700 font-bold text-[11px]">
                <tr>
                  <th className="p-1 text-center border-e border-slate-300 w-10">#</th>
                  <th className="p-1 text-start border-e border-slate-300 min-w-[170px]">
                    اسم المتسابق
                  </th>
                  <th className="p-1 text-start border-e border-slate-300 min-w-[220px]">
                    فئة ومستوى البطولة
                  </th>
                  <th className="p-1 text-end border-e border-slate-300 min-w-[120px] bg-slate-200/50">
                    رسوم المشاركة المقررة
                  </th>
                  <th className="p-1 text-end border-e border-slate-300 min-w-[120px] bg-emerald-50/70 text-emerald-900">
                    المبلغ المسدد
                  </th>
                  <th className="p-1 text-center border-e border-slate-300 min-w-[120px]">
                    رقم وصل القبض
                  </th>
                  <th className="p-1 text-center border-e border-slate-300 min-w-[130px]">
                    حالة التأهل والاعتماد
                  </th>
                  <th className="p-1 text-start min-w-[160px]">ملاحظات</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 text-slate-800 font-mono text-[11px]">
                {filteredContestants.map((c) => {
                  const isNational =
                    c.categoryLevel.includes('الوطنية') || c.status.includes('الوطنية');

                  return (
                    <tr
                      key={c.id}
                      onContextMenu={(e) => handleContextMenu(e, c)}
                      className="h-8 hover:bg-blue-50/40 transition-colors cursor-pointer"
                    >
                      {/* # */}
                      <td className="p-1 text-center border-e border-slate-200 text-slate-400 font-bold">
                        {c.seq}
                      </td>

                      {/* Contestant Name */}
                      <td
                        className="p-1 border-e border-slate-200 font-sans font-bold text-slate-900"
                        onDoubleClick={() => {
                          setInlineEdit({ id: c.id, field: 'contestantName' });
                          setInlineVal(c.contestantName);
                        }}
                      >
                        {inlineEdit?.id === c.id && inlineEdit?.field === 'contestantName' ? (
                          <input
                            autoFocus
                            value={inlineVal}
                            onChange={(e) => setInlineVal(e.target.value)}
                            onBlur={() => handleInlineSave(c.id, 'contestantName')}
                            onKeyDown={(e) =>
                              e.key === 'Enter' && handleInlineSave(c.id, 'contestantName')
                            }
                            className="w-full h-6 px-1 border border-blue-900 text-xs bg-white"
                          />
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {isNational && <Medal className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                            <span>{c.contestantName}</span>
                          </div>
                        )}
                      </td>

                      {/* Category / Level */}
                      <td className="p-1 border-e border-slate-200 font-sans text-slate-800 font-medium">
                        {c.categoryLevel}
                      </td>

                      {/* Reg Fee */}
                      <td className="p-1 text-end border-e border-slate-200 font-bold bg-slate-50/50">
                        {c.regFee.toLocaleString()} دج
                      </td>

                      {/* Confirmed Paid */}
                      <td className="p-1 text-end border-e border-slate-200 font-bold text-emerald-800 bg-emerald-50/30">
                        {c.confirmedPaid.toLocaleString()} دج
                      </td>

                      {/* Receipt */}
                      <td className="p-1 text-center border-e border-slate-200">
                        {c.receiptNumber ? (
                          <button
                            onClick={() => handleOpenVoucher(c)}
                            className="text-[10px] text-blue-800 font-bold hover:underline flex items-center justify-center gap-1 mx-auto"
                            title="معاينة إيصال القبض"
                          >
                            <FileText className="w-2.5 h-2.5" />
                            {c.receiptNumber}
                          </button>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-1 text-center border-e border-slate-200 font-sans text-[10px]">
                        {isNational ? (
                          <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 font-bold">
                            ★ مؤهل للوطني
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-200">
                            مشارك رسمي
                          </span>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="p-1 font-sans text-slate-600 truncate max-w-[160px]">
                        {c.notes}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* 4. KPIs Tab */
          <div className="p-4 space-y-4 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3 bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold">إجمالي المتنافسين</span>
                  <Trophy className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-xl font-bold font-mono text-slate-900">
                  {totalContestants} متسابق
                </div>
                <div className="text-[10px] text-slate-400 mt-1">موسم {selectedYear}</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold">إجمالي الرسوم المقررة</span>
                  <Coins className="w-4 h-4 text-slate-700" />
                </div>
                <div className="text-xl font-bold font-mono text-slate-900">
                  {totalFeesAll.toLocaleString()} دج
                </div>
                <div className="text-[10px] text-slate-400 mt-1">شاملة الميداليات والتنظيم</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold">المبالغ المحصلة</span>
                  <Award className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="text-xl font-bold font-mono text-emerald-700">
                  {totalCollectedAll.toLocaleString()} دج
                </div>
                <div className="text-[10px] text-emerald-600 mt-1">100% نسبة السداد المؤكدة</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold">المؤهلون للنهائي الوطني</span>
                  <Medal className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-xl font-bold font-mono text-amber-600">
                  {nationalQualifiers} بطلاً
                </div>
                <div className="text-[10px] text-amber-700 mt-1">تمثيل ولاية بجاية بالعاصمة</div>
              </div>
            </div>

            {/* Breakdown by Category */}
            <div className="bg-white border border-slate-200 p-3 shadow-2xs">
              <h4 className="font-bold text-xs text-slate-900 mb-2">
                توزيع المشاركين والرسوم حسب فئة البطولة:
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                    <tr>
                      <th className="p-2 text-start">فئة ومستوى البطولة</th>
                      <th className="p-2 text-center">عدد المتسابقين</th>
                      <th className="p-2 text-end">إجمالي الرسوم</th>
                      <th className="p-2 text-end">المحصل الفعلي</th>
                      <th className="p-2 text-center">المؤهلون للوطني</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {CHAMPIONSHIP_CATEGORIES.map((cat) => {
                      const catContestants = filteredContestants.filter(
                        (c) => c.categoryLevel === cat
                      );
                      const catTotal = catContestants.reduce((a, b) => a + b.regFee, 0);
                      const catPaid = catContestants.reduce((a, b) => a + b.confirmedPaid, 0);
                      const catNat = catContestants.filter((c) =>
                        c.status.includes('الوطنية') || c.categoryLevel.includes('الوطنية')
                      ).length;
                      if (catContestants.length === 0) return null;

                      return (
                        <tr key={cat} className="hover:bg-slate-50">
                          <td className="p-2 font-sans font-semibold text-slate-900">{cat}</td>
                          <td className="p-2 text-center">{catContestants.length}</td>
                          <td className="p-2 text-end">{catTotal.toLocaleString()} دج</td>
                          <td className="p-2 text-end text-emerald-700 font-bold">
                            {catPaid.toLocaleString()} دج
                          </td>
                          <td className="p-2 text-center text-amber-700 font-bold">
                            {catNat > 0 ? `${catNat} ★` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right-Click Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white border border-slate-300 shadow-xl py-1 text-xs min-w-[190px] animate-in fade-in"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1 bg-slate-100 border-b border-slate-200 font-bold text-[10px] text-slate-700">
            {contextMenu.contestant.contestantName}
          </div>
          <button
            onClick={() => {
              setEditingContestant(contextMenu.contestant);
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-blue-50 text-slate-800 flex items-center gap-2"
          >
            <Edit2 className="w-3.5 h-3.5 text-blue-800" />
            تعديل بيانات المشارك
          </button>
          <button
            onClick={() => {
              handleOpenVoucher(contextMenu.contestant);
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-blue-50 text-slate-800 flex items-center gap-2"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-700" />
            معاينة وصل الرسوم
          </button>
          <button
            onClick={() => {
              const newStatus =
                contextMenu.contestant.status === 'مؤهل للبطولة الوطنية'
                  ? 'مشارك رسمي'
                  : 'مؤهل للبطولة الوطنية';
              setContestants((prev) =>
                prev.map((c) => (c.id === contextMenu.contestant.id ? { ...c, status: newStatus } : c))
              );
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-blue-50 text-slate-800 flex items-center gap-2"
          >
            <Medal className="w-3.5 h-3.5 text-amber-600" />
            تبديل صفة التأهل للوطني
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `${contextMenu.contestant.contestantName} - ${contextMenu.contestant.categoryLevel} - وصل: ${contextMenu.contestant.receiptNumber}`
              );
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-blue-50 text-slate-800 flex items-center gap-2"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            نسخ ملخص المتسابق
          </button>
          <div className="border-t border-slate-200 my-1" />
          <button
            onClick={() => handleDeleteContestant(contextMenu.contestant.id)}
            className="w-full text-start px-3 py-1.5 hover:bg-rose-50 text-rose-700 flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            حذف المتسابق
          </button>
        </div>
      )}

      {/* Relational Edit Modal */}
      {editingContestant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">
                تعديل بيانات المتسابق في البطولة
              </span>
              <button
                onClick={() => setEditingContestant(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">اسم المتسابق *</label>
                <input
                  type="text"
                  required
                  value={editingContestant.contestantName}
                  onChange={(e) =>
                    setEditingContestant({ ...editingContestant, contestantName: e.target.value })
                  }
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  فئة ومستوى البطولة
                </label>
                <select
                  value={editingContestant.categoryLevel}
                  onChange={(e) =>
                    setEditingContestant({ ...editingContestant, categoryLevel: e.target.value })
                  }
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                >
                  {CHAMPIONSHIP_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    رسوم المشاركة (دج)
                  </label>
                  <input
                    type="number"
                    value={editingContestant.regFee}
                    onChange={(e) =>
                      setEditingContestant({
                        ...editingContestant,
                        regFee: Number(e.target.value),
                      })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المبلغ المسدد</label>
                  <input
                    type="number"
                    value={editingContestant.confirmedPaid}
                    onChange={(e) =>
                      setEditingContestant({
                        ...editingContestant,
                        confirmedPaid: Number(e.target.value),
                      })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">رقم الوصل</label>
                  <input
                    type="text"
                    value={editingContestant.receiptNumber}
                    onChange={(e) =>
                      setEditingContestant({ ...editingContestant, receiptNumber: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">حالة التأهل</label>
                  <select
                    value={editingContestant.status}
                    onChange={(e) =>
                      setEditingContestant({ ...editingContestant, status: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 font-sans"
                  >
                    <option value="مشارك رسمي">مشارك رسمي</option>
                    <option value="مؤهل للبطولة الوطنية">مؤهل للبطولة الوطنية</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ملاحظات</label>
                <textarea
                  rows={2}
                  value={editingContestant.notes}
                  onChange={(e) =>
                    setEditingContestant({ ...editingContestant, notes: e.target.value })
                  }
                  className="w-full p-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingContestant(null)}
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

      {/* Add New Contestant Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">
                تسجيل متسابق جديد في البطولة
              </span>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">اسم المتسابق *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ريان بن حميدوش"
                  value={newFormData.contestantName}
                  onChange={(e) =>
                    setNewFormData({ ...newFormData, contestantName: e.target.value })
                  }
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  فئة ومستوى البطولة
                </label>
                <select
                  value={newFormData.categoryLevel}
                  onChange={(e) =>
                    setNewFormData({ ...newFormData, categoryLevel: e.target.value })
                  }
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                >
                  {CHAMPIONSHIP_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    رسوم المشاركة (دج)
                  </label>
                  <input
                    type="number"
                    value={newFormData.regFee}
                    onChange={(e) =>
                      setNewFormData({ ...newFormData, regFee: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المبلغ المسدد</label>
                  <input
                    type="number"
                    value={newFormData.confirmedPaid}
                    onChange={(e) =>
                      setNewFormData({ ...newFormData, confirmedPaid: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    رقم الوصل (توليد تلقائي)
                  </label>
                  <input
                    type="text"
                    placeholder="REC-CHAMP-..."
                    value={newFormData.receiptNumber}
                    onChange={(e) =>
                      setNewFormData({ ...newFormData, receiptNumber: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">صفة المشاركة</label>
                  <select
                    value={newFormData.status}
                    onChange={(e) =>
                      setNewFormData({ ...newFormData, status: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 font-sans"
                  >
                    <option value="مشارك رسمي">مشارك رسمي</option>
                    <option value="مؤهل للبطولة الوطنية">مؤهل للبطولة الوطنية</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ملاحظات</label>
                <input
                  type="text"
                  value={newFormData.notes}
                  onChange={(e) => setNewFormData({ ...newFormData, notes: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-bold"
                >
                  تسجيل المتسابق
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
                  دليل وإرشادات استخدام سجل البطولات (السوربان والحساب الذهني)
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
                <strong>الهدف من الواجهة:</strong> تسجيل وإدارة مشاركي بطولات السوربان (الولائية،
                الوطنية، والدولية) وتوثيق استلام رسوم التحكيم والتنظيم وإصدار السندات.
              </p>
              <ul className="list-disc list-inside space-y-1 bg-slate-50 p-2.5 border border-slate-200">
                <li>
                  <strong>تأهيل المتسابقين:</strong> يمكن ترقية المتسابق لصفة "مؤهل للبطولة الوطنية"
                  مباشرة عبر زر الفأرة الأيمن أو نافذة التعديل.
                </li>
                <li>
                  <strong>معاينة سند الرسوم:</strong> اضغط على رقم الوصل لمعاينة وصل القبض الرسمي
                  وطباعته.
                </li>
                <li>
                  <strong>تعدد السنوات:</strong> يمكن التنقل بين المواسم التنافسية للأكاديمية بسهولة
                  من القائمة العلوية.
                </li>
                <li>
                  <strong>التعديل السريع:</strong> انقر مرتين على اسم المتسابق لتعديل الاسم مباشرة.
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

      {/* Voucher Modal */}
      {selectedVoucher && (
        <ReceiptVoucherModal
          voucherData={selectedVoucher}
          onClose={() => setSelectedVoucher(null)}
        />
      )}
    </div>
  );
}
