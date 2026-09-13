import React, { useState, useMemo, useEffect } from 'react';
import {
  Sun,
  Users,
  Coins,
  CreditCard,
  CheckCircle,
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
  Eye,
  Sliders,
  TrendingUp,
  Award,
} from 'lucide-react';
import { ReceiptVoucherModal } from '../common/ReceiptVoucherModal';
import { MOCK_CENTER_SUMMER_CAMP } from '../../../mock/centerMockData';

const CAMP_ACTIVITIES = [
  'مخيم المبتكر الصغير + السباحة',
  'نادي الفنون والمسرح الصيفي',
  'دورة الروبوتيك والذكاء الاصطناعي الصيفية',
  'دورة الإنجليزية المكثفة للأطفال',
  'أكاديمية السباحة الصيفية',
  'برنامج القرآن والسيرة الصيفي',
];

export function CenterSummerCampView() {
  const [selectedYear, setSelectedYear] = useState('2025-2026');
  const [activeTab, setActiveTab] = useState('table'); // 'table' | 'kpis'
  const [searchTerm, setSearchTerm] = useState('');
  const [activityFilter, setActivityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Participants Dataset with multi-year support
  const [participants, setParticipants] = useState(() => {
    return MOCK_CENTER_SUMMER_CAMP.map((p, idx) => ({
      ...p,
      academicYear: '2025-2026',
      status: p.remaining === 0 ? 'مسدد كلياً' : 'توجد ديون',
      inst1Amount: p.inst1?.amount ?? 15000,
      inst1Receipt: p.inst1?.receipt ?? `REC-CMP-26-${idx + 1}A`,
      inst2Amount: p.inst2?.amount ?? (p.totalPaid > 15000 ? p.totalPaid - 15000 : 0),
      inst2Receipt: p.inst2?.receipt ?? (p.inst2?.amount > 0 ? `REC-CMP-26-${idx + 1}B` : ''),
      notes: p.notes || 'تسجيل صيفي مؤكد',
    }));
  });

  // UI Modals
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState(null);
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

  // Filtered by Year, Activity, Status & Search
  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      const matchYear = !p.academicYear || p.academicYear === selectedYear;
      const matchActivity = activityFilter === 'ALL' || p.activity === activityFilter;
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PAID' && p.remaining === 0) ||
        (statusFilter === 'DEBT' && p.remaining > 0);
      const matchSearch =
        p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.inst1Receipt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.inst2Receipt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.notes.toLowerCase().includes(searchTerm.toLowerCase());
      return matchYear && matchActivity && matchStatus && matchSearch;
    });
  }, [participants, selectedYear, activityFilter, statusFilter, searchTerm]);

  // KPIs
  const totalCampers = filteredParticipants.length;
  const totalAgreedAll = filteredParticipants.reduce((acc, p) => acc + (p.totalAgreed || 0), 0);
  const totalCollectedAll = filteredParticipants.reduce(
    (acc, p) => acc + (p.inst1Amount || 0) + (p.inst2Amount || 0),
    0
  );
  const totalRemainingAll = filteredParticipants.reduce((acc, p) => acc + (p.remaining || 0), 0);
  const fullyPaidCampers = filteredParticipants.filter((p) => p.remaining === 0).length;

  // Recalculate totals for participant
  const recalculateParticipant = (item) => {
    const paid = (Number(item.inst1Amount) || 0) + (Number(item.inst2Amount) || 0);
    const agreed = Number(item.totalAgreed) || 0;
    const remaining = Math.max(0, agreed - paid);
    return {
      ...item,
      totalPaid: paid,
      remaining: remaining,
      status: remaining === 0 ? 'مسدد كلياً' : 'توجد ديون',
    };
  };

  // Inline Cell Edit Save
  const handleInlineSave = (id, field) => {
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, [field]: inlineVal };
        if (['totalAgreed', 'inst1Amount', 'inst2Amount'].includes(field)) {
          updated[field] = Number(inlineVal) || 0;
        }
        return recalculateParticipant(updated);
      })
    );
    setInlineEdit(null);
  };

  // Open Context Menu
  const handleContextMenu = (e, participant) => {
    e.preventDefault();
    e.stopPropagation();
    const x = Math.min(e.clientX, window.innerWidth - 220);
    const y = Math.min(e.clientY, window.innerHeight - 260);
    setContextMenu({ x, y, participant });
  };

  // Open Voucher Preview
  const handleOpenVoucher = (p, instNum) => {
    const receiptNo = instNum === 1 ? p.inst1Receipt : p.inst2Receipt;
    const amount = instNum === 1 ? p.inst1Amount : p.inst2Amount;
    if (!receiptNo && !amount) return;

    setSelectedVoucher({
      receiptNumber: receiptNo || `REC-CMP-AUTO`,
      payerName: p.fullName,
      category: `${p.activity} - الدفعة ${instNum}`,
      amount: amount || 0,
      paymentMethod: 'نقداً (خزينة المركز)',
      branch: 'المركز التعليمي والأكاديمي',
      notes: `المتبقي بذمته: ${p.remaining.toLocaleString()} دج`,
    });
  };

  // Save Add / Edit
  const handleSaveParticipant = (e) => {
    e.preventDefault();
    if (editingParticipant) {
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === editingParticipant.id ? recalculateParticipant(editingParticipant) : p
        )
      );
      setEditingParticipant(null);
    }
  };

  // Add New Participant
  const [newFormData, setNewFormData] = useState({
    fullName: '',
    activity: CAMP_ACTIVITIES[0],
    totalAgreed: 25000,
    inst1Amount: 15000,
    inst1Receipt: '',
    inst2Amount: 0,
    inst2Receipt: '',
    notes: 'تسجيل صيفي جديد',
  });

  const handleAddNewSubmit = (e) => {
    e.preventDefault();
    if (!newFormData.fullName.trim()) return;

    const seq = participants.length + 1;
    const newEntry = recalculateParticipant({
      id: `CMP-${Date.now()}`,
      seq,
      academicYear: selectedYear,
      fullName: newFormData.fullName.trim(),
      activity: newFormData.activity,
      totalAgreed: Number(newFormData.totalAgreed) || 25000,
      inst1Amount: Number(newFormData.inst1Amount) || 0,
      inst1Receipt: newFormData.inst1Receipt || `REC-CMP-26-${seq}A`,
      inst2Amount: Number(newFormData.inst2Amount) || 0,
      inst2Receipt: newFormData.inst2Receipt || '',
      notes: newFormData.notes || 'تسجيل صيفي جديد',
    });

    setParticipants([newEntry, ...participants]);
    setIsAddModalOpen(false);
    setNewFormData({
      fullName: '',
      activity: CAMP_ACTIVITIES[0],
      totalAgreed: 25000,
      inst1Amount: 15000,
      inst1Receipt: '',
      inst2Amount: 0,
      inst2Receipt: '',
      notes: 'تسجيل صيفي جديد',
    });
  };

  // Delete participant
  const handleDeleteParticipant = (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المشارك وسجل دفعاته؟')) {
      setParticipants((prev) => prev.filter((p) => p.id !== id));
      setContextMenu(null);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      '#',
      'الاسم واللقب',
      'النشاط / النادي',
      'التكلفة الكلية',
      'الدفعة 1',
      'وصل 1',
      'الدفعة 2',
      'وصل 2',
      'مجموع الدفعات',
      'الباقي',
      'الوضعية',
      'ملاحظات',
    ];
    const rows = filteredParticipants.map((p) => [
      p.seq,
      `"${p.fullName}"`,
      `"${p.activity}"`,
      p.totalAgreed,
      p.inst1Amount,
      `"${p.inst1Receipt}"`,
      p.inst2Amount,
      `"${p.inst2Receipt}"`,
      p.totalPaid,
      p.remaining,
      `"${p.status}"`,
      `"${p.notes || ''}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `summer_camp_${selectedYear}.csv`);
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
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 text-sm">النادي والمخيم الصيفي (نظام دفعتين)</span>
              <span className="text-[10px] text-slate-400">|</span>
              <span className="text-[10px] text-slate-500 font-mono">Summer Camp 2-Installments</span>
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
              aria-label="تحديد السنة الدراسية للمخيم الصيفي"
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
              سجل المشتركين ({filteredParticipants.length})
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
              title="تسجيل منخرط جديد بالمخيم"
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
              title="معلومات ودليل استخدام الواجهة"
              className="p-1 hover:bg-amber-50 text-amber-700 border border-amber-200 transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Filter Bar (Always visible for Table view) */}
      {activeTab === 'table' && (
        <div className="flex items-center justify-between px-3 py-1 bg-white border-b border-slate-200 shrink-0 gap-2">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute right-2 top-1.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="بحث باسم المشارك، النشاط، أو رقم الوصل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-7 pr-7 pl-2 bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:border-blue-900 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" />
              <select
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
                aria-label="تصفية حسب نوع النشاط الصيفي"
                className="h-7 px-2 bg-slate-50 border border-slate-200 text-[11px] text-slate-700 focus:outline-hidden"
              >
                <option value="ALL">جميع الأنشطة الصيفية</option>
                {CAMP_ACTIVITIES.map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="تصفية حسب حالة السداد"
                className="h-7 px-2 bg-slate-50 border border-slate-200 text-[11px] text-slate-700 focus:outline-hidden"
              >
                <option value="ALL">جميع الحالات</option>
                <option value="PAID">مسدد كلياً (0 دج)</option>
                <option value="DEBT">توجد ديون متبقية</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
            <span>
              المشاركين:{' '}
              <strong className="text-slate-800">{filteredParticipants.length}</strong>
            </span>
            <span>
              المحصل:{' '}
              <strong className="text-emerald-700">{totalCollectedAll.toLocaleString()} دج</strong>
            </span>
            <span>
              الديون:{' '}
              <strong className="text-rose-700">{totalRemainingAll.toLocaleString()} دج</strong>
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
                  <th className="p-1 text-center border-e border-slate-300 w-9">#</th>
                  <th className="p-1 text-start border-e border-slate-300 min-w-[150px]">
                    الاسم واللقب
                  </th>
                  <th className="p-1 text-start border-e border-slate-300 min-w-[180px]">
                    النشاط / الفوج الصيفي
                  </th>
                  <th className="p-1 text-end border-e border-slate-300 min-w-[100px] bg-slate-200/50">
                    التكلفة الكلية
                  </th>

                  {/* Paired Columns Group 1: الدفعة 1 + الوصل 1 */}
                  <th className="p-1 text-center border-e border-blue-300 min-w-[95px] bg-blue-50/70 text-blue-950 font-extrabold">
                    الدفعة 1
                  </th>
                  <th className="p-1 text-center border-e border-slate-300 min-w-[95px] bg-blue-50/40 text-blue-900">
                    وصل 1
                  </th>

                  {/* Paired Columns Group 2: الدفعة 2 + الوصل 2 */}
                  <th className="p-1 text-center border-e border-purple-300 min-w-[95px] bg-purple-50/70 text-purple-950 font-extrabold">
                    الدفعة 2
                  </th>
                  <th className="p-1 text-center border-e border-slate-300 min-w-[95px] bg-purple-50/40 text-purple-900">
                    وصل 2
                  </th>

                  <th className="p-1 text-end border-e border-slate-300 min-w-[105px] bg-emerald-50/70 text-emerald-900">
                    مجموع الدفعات
                  </th>
                  <th className="p-1 text-end border-e border-slate-300 min-w-[95px] bg-rose-50/70 text-rose-900">
                    الباقي (دين)
                  </th>
                  <th className="p-1 text-center border-e border-slate-300 min-w-[90px]">
                    الوضعية
                  </th>
                  <th className="p-1 text-start min-w-[140px]">ملاحظات</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 text-slate-800 font-mono text-[11px]">
                {filteredParticipants.map((p) => {
                  const isInst1Paid = (p.inst1Amount || 0) > 0;
                  const isInst2Paid = (p.inst2Amount || 0) > 0;
                  const hasDebt = (p.remaining || 0) > 0;

                  return (
                    <tr
                      key={p.id}
                      onContextMenu={(e) => handleContextMenu(e, p)}
                      className="h-8 hover:bg-blue-50/40 transition-colors cursor-pointer"
                    >
                      {/* # */}
                      <td className="p-1 text-center border-e border-slate-200 text-slate-400 font-bold">
                        {p.seq}
                      </td>

                      {/* Name */}
                      <td
                        className="p-1 border-e border-slate-200 font-sans font-bold text-slate-900"
                        onDoubleClick={() => {
                          setInlineEdit({ id: p.id, field: 'fullName' });
                          setInlineVal(p.fullName);
                        }}
                      >
                        {inlineEdit?.id === p.id && inlineEdit?.field === 'fullName' ? (
                          <input
                            autoFocus
                            value={inlineVal}
                            onChange={(e) => setInlineVal(e.target.value)}
                            onBlur={() => handleInlineSave(p.id, 'fullName')}
                            onKeyDown={(e) =>
                              e.key === 'Enter' && handleInlineSave(p.id, 'fullName')
                            }
                            className="w-full h-6 px-1 border border-blue-900 text-xs bg-white"
                          />
                        ) : (
                          p.fullName
                        )}
                      </td>

                      {/* Activity */}
                      <td className="p-1 border-e border-slate-200 font-sans text-slate-700">
                        {p.activity}
                      </td>

                      {/* Total Agreed */}
                      <td className="p-1 text-end border-e border-slate-200 font-bold bg-slate-50/50">
                        {p.totalAgreed.toLocaleString()} دج
                      </td>

                      {/* Inst 1 (Paired) */}
                      <td className="p-1 text-end border-e border-blue-200 bg-blue-50/20 font-bold text-emerald-800">
                        {isInst1Paid ? `${p.inst1Amount.toLocaleString()} دج` : '-'}
                      </td>

                      {/* Receipt 1 (Paired) */}
                      <td className="p-1 text-center border-e border-slate-200 bg-blue-50/10">
                        {p.inst1Receipt ? (
                          <button
                            onClick={() => handleOpenVoucher(p, 1)}
                            className="text-[10px] text-blue-800 font-bold hover:underline flex items-center justify-center gap-1 mx-auto"
                            title="معاينة إيصال القبض"
                          >
                            <FileText className="w-2.5 h-2.5" />
                            {p.inst1Receipt}
                          </button>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Inst 2 (Paired) */}
                      <td className="p-1 text-end border-e border-purple-200 bg-purple-50/20 font-bold text-emerald-800">
                        {isInst2Paid ? `${p.inst2Amount.toLocaleString()} دج` : '-'}
                      </td>

                      {/* Receipt 2 (Paired) */}
                      <td className="p-1 text-center border-e border-slate-200 bg-purple-50/10">
                        {p.inst2Receipt ? (
                          <button
                            onClick={() => handleOpenVoucher(p, 2)}
                            className="text-[10px] text-purple-800 font-bold hover:underline flex items-center justify-center gap-1 mx-auto"
                            title="معاينة إيصال القبض"
                          >
                            <FileText className="w-2.5 h-2.5" />
                            {p.inst2Receipt}
                          </button>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Total Paid */}
                      <td className="p-1 text-end border-e border-slate-200 font-bold text-emerald-800 bg-emerald-50/30">
                        {p.totalPaid.toLocaleString()} دج
                      </td>

                      {/* Remaining (Debt) */}
                      <td className="p-1 text-end border-e border-slate-200 font-bold">
                        {hasDebt ? (
                          <span className="text-rose-700 bg-rose-50 px-1 py-0.5 border border-rose-200">
                            {p.remaining.toLocaleString()} دج
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-bold">0 دج ✓</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-1 text-center border-e border-slate-200 font-sans text-[10px]">
                        {hasDebt ? (
                          <span className="px-1 py-0.5 bg-amber-50 text-amber-800 border border-amber-200">
                            توجد ديون
                          </span>
                        ) : (
                          <span className="px-1 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200">
                            مسدد كلياً
                          </span>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="p-1 font-sans text-slate-600 truncate max-w-[150px]">
                        {p.notes}
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
                  <span className="text-[11px] font-bold">إجمالي المنخرطين</span>
                  <Users className="w-4 h-4 text-blue-900" />
                </div>
                <div className="text-xl font-bold font-mono text-slate-900">
                  {totalCampers} مشارك
                </div>
                <div className="text-[10px] text-slate-400 mt-1">موسم {selectedYear}</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold">التكلفة الكلية المستحقة</span>
                  <Coins className="w-4 h-4 text-slate-700" />
                </div>
                <div className="text-xl font-bold font-mono text-slate-900">
                  {totalAgreedAll.toLocaleString()} دج
                </div>
                <div className="text-[10px] text-slate-400 mt-1">إجمالي الاشتراكات المتفق عليها</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold">المحصل (الدفعتين)</span>
                  <CreditCard className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="text-xl font-bold font-mono text-emerald-700">
                  {totalCollectedAll.toLocaleString()} دج
                </div>
                <div className="text-[10px] text-emerald-600 mt-1">
                  {totalAgreedAll > 0
                    ? Math.round((totalCollectedAll / totalAgreedAll) * 100)
                    : 0}
                  % نسبة التحصيل
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold">الديون المتبقية</span>
                  <CheckCircle className="w-4 h-4 text-rose-700" />
                </div>
                <div className="text-xl font-bold font-mono text-rose-700">
                  {totalRemainingAll.toLocaleString()} دج
                </div>
                <div className="text-[10px] text-rose-600 mt-1">
                  {totalCampers - fullyPaidCampers} مشارك عليهم متبقيات
                </div>
              </div>
            </div>

            {/* Program Breakdown Table */}
            <div className="bg-white border border-slate-200 p-3 shadow-2xs">
              <h4 className="font-bold text-xs text-slate-900 mb-2">
                توزيع المشاركين ومداخيل المخيم حسب نوع النشاط الصيفي:
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                    <tr>
                      <th className="p-2 text-start">النشاط الصيفي</th>
                      <th className="p-2 text-center">عدد المشاركين</th>
                      <th className="p-2 text-end">التكلفة الإجمالية</th>
                      <th className="p-2 text-end">المحصل</th>
                      <th className="p-2 text-end">المتبقي</th>
                      <th className="p-2 text-center">نسبة التحصيل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {CAMP_ACTIVITIES.map((act) => {
                      const actCampers = filteredParticipants.filter((p) => p.activity === act);
                      const actTotal = actCampers.reduce((a, b) => a + b.totalAgreed, 0);
                      const actPaid = actCampers.reduce(
                        (a, b) => a + (b.inst1Amount || 0) + (b.inst2Amount || 0),
                        0
                      );
                      const actRem = actCampers.reduce((a, b) => a + b.remaining, 0);
                      if (actCampers.length === 0) return null;

                      return (
                        <tr key={act} className="hover:bg-slate-50">
                          <td className="p-2 font-sans font-semibold text-slate-900">{act}</td>
                          <td className="p-2 text-center">{actCampers.length}</td>
                          <td className="p-2 text-end">{actTotal.toLocaleString()} دج</td>
                          <td className="p-2 text-end text-emerald-700 font-bold">
                            {actPaid.toLocaleString()} دج
                          </td>
                          <td className="p-2 text-end text-rose-700">
                            {actRem.toLocaleString()} دج
                          </td>
                          <td className="p-2 text-center">
                            {actTotal > 0 ? Math.round((actPaid / actTotal) * 100) : 0}%
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
            {contextMenu.participant.fullName}
          </div>
          <button
            onClick={() => {
              setEditingParticipant(contextMenu.participant);
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-blue-50 text-slate-800 flex items-center gap-2"
          >
            <Edit2 className="w-3.5 h-3.5 text-blue-800" />
            تعديل البيانات والدفعات
          </button>
          <button
            onClick={() => {
              handleOpenVoucher(contextMenu.participant, 1);
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-blue-50 text-slate-800 flex items-center gap-2"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-700" />
            معاينة وصل الدفعة 1
          </button>
          {contextMenu.participant.inst2Amount > 0 && (
            <button
              onClick={() => {
                handleOpenVoucher(contextMenu.participant, 2);
                setContextMenu(null);
              }}
              className="w-full text-start px-3 py-1.5 hover:bg-blue-50 text-slate-800 flex items-center gap-2"
            >
              <FileText className="w-3.5 h-3.5 text-purple-700" />
              معاينة وصل الدفعة 2
            </button>
          )}
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `${contextMenu.participant.fullName} - ${contextMenu.participant.activity} - مسدد: ${contextMenu.participant.totalPaid} دج - باقي: ${contextMenu.participant.remaining} دج`
              );
              setContextMenu(null);
            }}
            className="w-full text-start px-3 py-1.5 hover:bg-blue-50 text-slate-800 flex items-center gap-2"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            نسخ ملخص المشترك
          </button>
          <div className="border-t border-slate-200 my-1" />
          <button
            onClick={() => handleDeleteParticipant(contextMenu.participant.id)}
            className="w-full text-start px-3 py-1.5 hover:bg-rose-50 text-rose-700 flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            حذف المشارك
          </button>
        </div>
      )}

      {/* Relational Edit Modal */}
      {editingParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-lg p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">
                تعديل بيانات مشترك المخيم الصيفي
              </span>
              <button
                onClick={() => setEditingParticipant(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveParticipant} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الاسم واللقب</label>
                  <input
                    type="text"
                    required
                    value={editingParticipant.fullName}
                    onChange={(e) =>
                      setEditingParticipant({ ...editingParticipant, fullName: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">النشاط الصيفي</label>
                  <select
                    value={editingParticipant.activity}
                    onChange={(e) =>
                      setEditingParticipant({ ...editingParticipant, activity: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                  >
                    {CAMP_ACTIVITIES.map((act) => (
                      <option key={act} value={act}>
                        {act}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  التكلفة الكلية المتفق عليها (دج)
                </label>
                <input
                  type="number"
                  value={editingParticipant.totalAgreed}
                  onChange={(e) =>
                    setEditingParticipant({
                      ...editingParticipant,
                      totalAgreed: Number(e.target.value),
                    })
                  }
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                />
              </div>

              {/* Group 1: Inst 1 + Receipt 1 */}
              <div className="p-2.5 bg-blue-50/50 border border-blue-200 space-y-2">
                <span className="font-bold text-blue-950 text-[11px] block">
                  الدفعة الأولى والوصل المرتبط بها
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-600 text-[10px] mb-0.5">المبلغ (دج)</label>
                    <input
                      type="number"
                      value={editingParticipant.inst1Amount}
                      onChange={(e) =>
                        setEditingParticipant({
                          ...editingParticipant,
                          inst1Amount: Number(e.target.value),
                        })
                      }
                      className="w-full h-7 px-2 border border-blue-300 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-[10px] mb-0.5">رقم الوصل</label>
                    <input
                      type="text"
                      value={editingParticipant.inst1Receipt}
                      onChange={(e) =>
                        setEditingParticipant({
                          ...editingParticipant,
                          inst1Receipt: e.target.value,
                        })
                      }
                      className="w-full h-7 px-2 border border-blue-300 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Group 2: Inst 2 + Receipt 2 */}
              <div className="p-2.5 bg-purple-50/50 border border-purple-200 space-y-2">
                <span className="font-bold text-purple-950 text-[11px] block">
                  الدفعة الثانية والوصل المرتبط بها
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-600 text-[10px] mb-0.5">المبلغ (دج)</label>
                    <input
                      type="number"
                      value={editingParticipant.inst2Amount}
                      onChange={(e) =>
                        setEditingParticipant({
                          ...editingParticipant,
                          inst2Amount: Number(e.target.value),
                        })
                      }
                      className="w-full h-7 px-2 border border-purple-300 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-[10px] mb-0.5">رقم الوصل</label>
                    <input
                      type="text"
                      value={editingParticipant.inst2Receipt}
                      onChange={(e) =>
                        setEditingParticipant({
                          ...editingParticipant,
                          inst2Receipt: e.target.value,
                        })
                      }
                      className="w-full h-7 px-2 border border-purple-300 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ملاحظات</label>
                <textarea
                  rows={2}
                  value={editingParticipant.notes}
                  onChange={(e) =>
                    setEditingParticipant({ ...editingParticipant, notes: e.target.value })
                  }
                  className="w-full p-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingParticipant(null)}
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

      {/* Add New Participant Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-lg p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">
                تسجيل منخرط جديد في المخيم الصيفي
              </span>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الاسم واللقب *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: يوسف العسكري"
                    value={newFormData.fullName}
                    onChange={(e) =>
                      setNewFormData({ ...newFormData, fullName: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">النشاط الصيفي</label>
                  <select
                    value={newFormData.activity}
                    onChange={(e) =>
                      setNewFormData({ ...newFormData, activity: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                  >
                    {CAMP_ACTIVITIES.map((act) => (
                      <option key={act} value={act}>
                        {act}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  التكلفة الكلية (دج)
                </label>
                <input
                  type="number"
                  value={newFormData.totalAgreed}
                  onChange={(e) =>
                    setNewFormData({ ...newFormData, totalAgreed: e.target.value })
                  }
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 font-mono"
                />
              </div>

              {/* Group 1 */}
              <div className="p-2.5 bg-blue-50/50 border border-blue-200 space-y-2">
                <span className="font-bold text-blue-950 text-[11px] block">
                  الدفعة الأولى وسند القبض
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-600 text-[10px] mb-0.5">المبلغ (دج)</label>
                    <input
                      type="number"
                      value={newFormData.inst1Amount}
                      onChange={(e) =>
                        setNewFormData({ ...newFormData, inst1Amount: e.target.value })
                      }
                      className="w-full h-7 px-2 border border-blue-300 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-[10px] mb-0.5">
                      رقم الوصل (اتركه فارغاً للتوليد الآلي)
                    </label>
                    <input
                      type="text"
                      placeholder="توليد تلقائي"
                      value={newFormData.inst1Receipt}
                      onChange={(e) =>
                        setNewFormData({ ...newFormData, inst1Receipt: e.target.value })
                      }
                      className="w-full h-7 px-2 border border-blue-300 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Group 2 */}
              <div className="p-2.5 bg-purple-50/50 border border-purple-200 space-y-2">
                <span className="font-bold text-purple-950 text-[11px] block">
                  الدفعة الثانية وسند القبض (اختياري)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-600 text-[10px] mb-0.5">المبلغ (دج)</label>
                    <input
                      type="number"
                      value={newFormData.inst2Amount}
                      onChange={(e) =>
                        setNewFormData({ ...newFormData, inst2Amount: e.target.value })
                      }
                      className="w-full h-7 px-2 border border-purple-300 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-[10px] mb-0.5">رقم الوصل</label>
                    <input
                      type="text"
                      placeholder="REC-CMP-..."
                      value={newFormData.inst2Receipt}
                      onChange={(e) =>
                        setNewFormData({ ...newFormData, inst2Receipt: e.target.value })
                      }
                      className="w-full h-7 px-2 border border-purple-300 bg-white font-mono"
                    />
                  </div>
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
                  تأكيد وحفظ المشترك
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
                  دليل وإرشادات استخدام سجل المخيم الصيفي (نظام دفعتين)
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
                <strong>الهدف من الواجهة:</strong> إدارة اشتراكات أنشطة ومخيمات العطلة الصيفية بنظام
                الدفعتين الماليتين المقرونة بوصولات قبض مستقلة.
              </p>
              <ul className="list-disc list-inside space-y-1 bg-slate-50 p-2.5 border border-slate-200">
                <li>
                  <strong>اقتران الدفعة بالوصل:</strong> كل دفعة (الدفعة 1 و الدفعة 2) تمتلك عموداً
                  مخصصاً لوصل القبض الخاص بها لضمان دقة الرقابة المالية.
                </li>
                <li>
                  <strong>معاينة الوصل وطباعته:</strong> اضغط مباشرة على رقم الوصل لفتح سند القبض
                  الرسمي مع إمكانية الطباعة الفورية.
                </li>
                <li>
                  <strong>الزر الأيمن للفأرة:</strong> يوفر خيارات التعديل الشامل، معاينة وصولات
                  الدفع، نسخ البيانات، أو حذف السجل.
                </li>
                <li>
                  <strong>التعديل السريع:</strong> انقر نقراً مزدوجاً على اسم الطالب لتعديله مباشرة داخل
                  الجدول.
                </li>
                <li>
                  <strong>تعدد السنوات:</strong> يمكنك التبديل بين المواسم الدراسية من القائمة العلوية
                  بسهولة.
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
