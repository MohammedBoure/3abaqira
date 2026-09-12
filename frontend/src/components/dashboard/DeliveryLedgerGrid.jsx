import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Download,
  Copy,
  Table as TableIcon,
  Check,
  Edit3,
  Filter,
  FileSpreadsheet,
  Printer,
  X,
  Maximize2,
  Minimize2,
  Plus,
  ArrowRightLeft,
  Calendar,
  Building2,
  ChevronDown,
  TrendingUp,
  Receipt,
  Wallet,
  CheckCircle2,
} from 'lucide-react';
import {
  DELIVERY_MONTHS,
  DEFAULT_RECIPIENTS,
  MOCK_DELIVERY_LEDGER,
  computeDeliveryLedgerStats,
} from '../../mock/deliveryLedgerData';

export function DeliveryLedgerGrid({
  selectedBranch = 'ALL',
  onSelectBranch,
  className = '',
}) {
  // Master delivery ledger state (all 334 days)
  const [ledgerData, setLedgerData] = useState(MOCK_DELIVERY_LEDGER);

  // Active month tab filter ('ALL' or month.id e.g. 'sept-2025')
  const [activeMonthTab, setActiveMonthTab] = useState('ALL');

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Toggle to show only non-zero days or all calendar days
  const [showOnlyNonZero, setShowOnlyNonZero] = useState(false);

  // Active cell coordinates for Excel-like status bar
  const [activeCell, setActiveCell] = useState({ rowId: null, colKey: null });

  // Fullscreen / Expanded Focus Mode
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Inline cell editing: { rowId, colKey, value }
  const [editingCell, setEditingCell] = useState(null);

  // Quick delivery modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);

  // Copy success & toast message
  const [copySuccess, setCopySuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const tableContainerRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Keyboard navigation & Escape key handling (Exit fullscreen, cancel edit)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (editingCell) {
          setEditingCell(null);
          return;
        }
        if (isModalOpen) {
          setIsModalOpen(false);
          return;
        }
        if (isFullscreen) {
          setIsFullscreen(false);
          showToast('تم الخروج من وضع ملء الشاشة');
          return;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingCell, isModalOpen, isFullscreen]);

  // Filtered rows based on branch, active month tab, search term, and non-zero toggle
  const filteredRows = useMemo(() => {
    return ledgerData.filter((row) => {
      const matchesBranch =
        selectedBranch === 'ALL' || row.branchId === selectedBranch;
      const matchesMonth =
        activeMonthTab === 'ALL' || row.monthId === activeMonthTab;
      const matchesNonZero = !showOnlyNonZero || (Number(row.amount) > 0);
      const s = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !s ||
        row.dateString.toLowerCase().includes(s) ||
        (row.receipt && row.receipt.toLowerCase().includes(s)) ||
        (row.recipient && row.recipient.toLowerCase().includes(s)) ||
        (row.notes && row.notes.toLowerCase().includes(s));

      return matchesBranch && matchesMonth && matchesNonZero && matchesSearch;
    });
  }, [ledgerData, selectedBranch, activeMonthTab, showOnlyNonZero, searchTerm]);

  // Group filtered rows by month for rendering subtotal rows
  const monthGroups = useMemo(() => {
    const groups = [];
    DELIVERY_MONTHS.forEach((m) => {
      if (activeMonthTab !== 'ALL' && activeMonthTab !== m.id) {
        return;
      }
      const rowsInMonth = filteredRows.filter((r) => r.monthId === m.id);
      if (rowsInMonth.length > 0) {
        const monthSubtotal = rowsInMonth.reduce(
          (sum, r) => sum + (Number(r.amount) || 0),
          0
        );
        groups.push({
          month: m,
          rows: rowsInMonth,
          subtotal: monthSubtotal,
        });
      }
    });
    return groups;
  }, [filteredRows, activeMonthTab]);

  // Overall statistics
  const stats = useMemo(() => {
    return computeDeliveryLedgerStats(filteredRows);
  }, [filteredRows]);

  // Highest month calculation
  const highestMonth = useMemo(() => {
    let max = { name: '-', total: 0 };
    DELIVERY_MONTHS.forEach((m) => {
      const monthRows = ledgerData.filter((r) => r.monthId === m.id);
      const total = monthRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      if (total > max.total) {
        max = { name: m.nameAr, total };
      }
    });
    return max;
  }, [ledgerData]);

  // Save inline cell change
  const handleSaveInlineCell = (rowId, colKey, newValue) => {
    setLedgerData((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        const updated = { ...row };
        if (colKey === 'amount') {
          updated.amount = Math.max(0, parseFloat(newValue) || 0);
        } else {
          updated[colKey] = newValue;
        }
        return updated;
      })
    );
    setEditingCell(null);
    showToast('تم تحديث بيانات التسليم في الخلية مباشرة');
  };

  // Quick Modal Submit
  const handleSaveModal = (e) => {
    e.preventDefault();
    if (!editingRow) return;

    setLedgerData((prev) =>
      prev.map((r) => (r.id === editingRow.id ? editingRow : r))
    );
    showToast(`تم حفظ تسليم يوم: ${editingRow.dateString}`);
    setIsModalOpen(false);
    setEditingRow(null);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['التاريخ', 'الوصل', 'المبلغ (دج)', 'المستلم', 'ملاحظات', 'المقر'];
    const rows = filteredRows.map((r) => [
      `"${r.dateString}"`,
      `"${r.receipt || ''}"`,
      r.amount || 0,
      `"${r.recipient || ''}"`,
      `"${r.notes || ''}"`,
      `"${r.branchId === 'RAWDA' ? 'الروضة' : 'المركز الرئيسي'}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `3abaqira_delivery_ledger_${activeMonthTab}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('تم تصدير سجل التسليم كملف CSV بنجاح');
  };

  // Copy TSV for direct paste into Excel
  const copyToClipboard = () => {
    const headers = ['التاريخ\tالوصل\tالمبلغ\tالمستلم\tملاحظات'];
    const lines = filteredRows.map(
      (r) => `${r.dateString}\t${r.receipt || ''}\t${r.amount || 0}\t${r.recipient || ''}\t${r.notes || ''}`
    );
    const tsvContent = [headers, ...lines].join('\n');
    navigator.clipboard.writeText(tsvContent).then(() => {
      setCopySuccess(true);
      showToast('تم نسخ جدول التسليم بالكامل بتنسيق Excel/TSV');
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  return (
    <div
      className={`font-arabic ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-white flex flex-col h-screen w-screen overflow-hidden'
          : `w-full bg-white border border-slate-300 shadow-xs flex flex-col ${className}`
      }`}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 end-4 z-50 bg-slate-900 text-white px-3 py-2 text-xs rounded shadow-lg border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Fullscreen Focus Header Bar */}
      {isFullscreen && (
        <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between border-b border-slate-800 shadow-md">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 text-white font-mono text-xs px-2 py-0.5 rounded font-bold">
              وضع ملء الشاشة
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">سجل التسليم وترحيل السيولة النقدية (2025 - 2026)</span>
              <span className="text-xs text-slate-400 font-mono">
                (المجموع العام: {stats.grandTotal.toLocaleString('fr-DZ')} دج • {stats.nonZeroCount} يوم تسليم)
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              setIsFullscreen(false);
              showToast('تم الخروج من وضع ملء الشاشة');
            }}
            className="h-7 px-3 bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors shadow-xs"
            title="خروج من وضع ملء الشاشة (Escape)"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>تصغير الشاشة (Esc)</span>
          </button>
        </div>
      )}

      {/* 2. Top Executive KPI Summary Strip */}
      <div className="p-3 sm:p-4 bg-slate-50/70 border-b border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-2.5 border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-emerald-700" />
            <span>إجمالي المبالغ المسلمة</span>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-emerald-800 mt-1 tabular-nums">
            {stats.grandTotal.toLocaleString('fr-DZ')} دج
          </div>
        </div>

        <div className="bg-white p-2.5 border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
            <span>أيام التسليم الموثقة</span>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {stats.nonZeroCount} <span className="text-xs font-normal text-slate-500">من {filteredRows.length} يوم</span>
          </div>
        </div>

        <div className="bg-white p-2.5 border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
            <span>متوسط التسليم اليومي</span>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-slate-800 mt-1 tabular-nums">
            {stats.nonZeroCount > 0
              ? Math.round(stats.grandTotal / stats.nonZeroCount).toLocaleString('fr-DZ')
              : 0}{' '}
            دج
          </div>
        </div>

        <div className="bg-white p-2.5 border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-blue-900" />
            <span>الشهر الأعلى تسليماً</span>
          </div>
          <div className="text-sm font-bold text-blue-950 mt-1 truncate">
            {highestMonth.name} ({highestMonth.total.toLocaleString('fr-DZ')} دج)
          </div>
        </div>
      </div>

      {/* 3. Excel Utility Toolbar */}
      <div className="p-2 sm:p-2.5 border-b border-slate-300 bg-white flex flex-wrap items-center justify-between gap-2">
        {/* Left: Search & Filter Segment */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Filter Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute inset-y-0 start-2.5 my-auto text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="تصفية (التاريخ، الوصل، المستلم، البيان)..."
              className="h-7 ps-7 pe-2 text-xs sharp-input w-48 sm:w-60"
            />
          </div>

          {/* Non-zero toggle filter */}
          <button
            onClick={() => setShowOnlyNonZero(!showOnlyNonZero)}
            className={`h-7 px-2.5 flex items-center gap-1.5 text-xs border transition-colors ${
              showOnlyNonZero
                ? 'bg-blue-900 text-white border-blue-900 font-semibold'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
            title="إخفاء الأيام التي لم يسجل بها مبلغ"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>الأيام النشطة فقط</span>
          </button>
        </div>

        {/* Right: Technical Export & Operational Actions */}
        <div className="flex items-center gap-1.5">
          {/* Fullscreen / Focus Mode Toggle */}
          <button
            onClick={() => {
              const next = !isFullscreen;
              setIsFullscreen(next);
              showToast(next ? 'تم تفعيل وضع ملء الشاشة' : 'تم الخروج من وضع ملء الشاشة');
            }}
            className={`h-7 px-2.5 flex items-center gap-1.5 text-xs transition-colors ${
              isFullscreen
                ? 'bg-blue-700 text-white border border-blue-800'
                : 'sharp-btn-secondary text-slate-700'
            }`}
            title={isFullscreen ? 'تصغير الشاشة (Esc)' : 'تكبير وتوسيع جدول التسليم'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-white" />
                <span>تصغير</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
                <span>ملء الشاشة</span>
              </>
            )}
          </button>

          <button
            onClick={copyToClipboard}
            className="h-7 px-2.5 flex items-center gap-1.5 text-xs sharp-btn-secondary"
            title="نسخ الجدول بتنسيق Excel"
          >
            {copySuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-600" />
            )}
            <span>{copySuccess ? 'تم النسخ!' : 'نسخ Excel'}</span>
          </button>

          <button
            onClick={exportToCSV}
            className="h-7 px-2.5 flex items-center gap-1.5 text-xs sharp-btn-secondary"
            title="تصدير ملف CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>تصدير CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="h-7 px-2.5 flex items-center gap-1.5 text-xs sharp-btn-secondary"
            title="طباعة جدول التسليم"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>طباعة</span>
          </button>
        </div>
      </div>

      {/* 4. Primary Excel Delivery Table */}
      <div
        ref={tableContainerRef}
        className={`w-full overflow-x-auto overflow-y-auto ${
          isFullscreen
            ? 'flex-1 border-b border-slate-200/90 relative select-text'
            : 'max-h-[calc(100vh-270px)] border-b border-slate-200/90 relative select-text'
        }`}
      >
        <table className="excel-table text-xs border-collapse w-full">
          {/* Main Excel Header: Heading "التسليم" */}
          <thead className="sticky top-0 z-30 bg-slate-100/95 backdrop-blur-xs shadow-xs border-b border-slate-300">
            {/* Super Header Banner */}
            <tr className="bg-blue-950 text-white text-center font-bold tracking-wider">
              <th colSpan={7} className="py-2 px-3 text-sm font-serif">
                التسليم (سجل تسليم وترحيل العهدة والسيولة اليومية)
              </th>
            </tr>
            {/* Column Headers: RTL sequence matching user prompt */}
            <tr>
              <th className="excel-th w-12 text-center py-2 px-2 text-slate-600">
                #
              </th>
              <th className="excel-th w-36 text-start py-2 px-3 font-bold text-slate-900 border-s border-slate-200">
                التاريخ
              </th>
              <th className="excel-th w-36 text-start py-2 px-3 font-bold text-slate-900 border-s border-slate-200 font-mono">
                الوصل
              </th>
              <th className="excel-th w-36 text-end py-2 px-3 font-bold text-slate-900 border-s border-slate-200 font-mono">
                المبلغ (دج)
              </th>
              <th className="excel-th w-56 text-start py-2 px-3 font-bold text-slate-900 border-s border-slate-200">
                المستلم
              </th>
              <th className="excel-th text-start py-2 px-3 font-bold text-slate-900 border-s border-slate-200">
                ملاحظات
              </th>
              <th className="excel-th w-20 text-center py-2 px-2 text-slate-600 border-s border-slate-200">
                إجراء
              </th>
            </tr>
          </thead>

          {/* Table Body: Month by Month with Monthly Subtotals */}
          <tbody>
            {monthGroups.length > 0 ? (
              monthGroups.map((group) => {
                const month = group.month;
                return (
                  <React.Fragment key={month.id}>
                    {/* Month Section Sticky Divider */}
                    <tr className="bg-slate-200/70 border-y border-slate-300 select-none">
                      <td
                        colSpan={7}
                        className="py-1 px-3 text-xs font-bold text-blue-950 flex-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-blue-800" />
                            <span>{month.nameAr}</span>
                            <span className="text-[10px] text-slate-500 font-latin font-normal">
                              ({month.nameFr})
                            </span>
                          </span>
                          <span className="font-mono text-xs text-slate-700 font-semibold">
                            {group.rows.length} يوم مسجل
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Daily Rows */}
                    {group.rows.map((row, rIndex) => {
                      const isAmountActive = row.amount > 0;
                      const isEditingThisAmount =
                        editingCell &&
                        editingCell.rowId === row.id &&
                        editingCell.colKey === 'amount';
                      const isEditingThisReceipt =
                        editingCell &&
                        editingCell.rowId === row.id &&
                        editingCell.colKey === 'receipt';
                      const isEditingThisRecipient =
                        editingCell &&
                        editingCell.rowId === row.id &&
                        editingCell.colKey === 'recipient';
                      const isEditingThisNotes =
                        editingCell &&
                        editingCell.rowId === row.id &&
                        editingCell.colKey === 'notes';

                      return (
                        <tr
                          key={row.id}
                          className={`hover:bg-blue-50/70 transition-colors ${
                            isAmountActive ? 'bg-white' : 'bg-slate-50/30'
                          } ${
                            activeCell.rowId === row.id
                              ? 'bg-blue-50/50'
                              : rIndex % 2 === 0
                              ? 'bg-white'
                              : 'bg-slate-50/40'
                          }`}
                        >
                          {/* Row Sequence */}
                          <td className="excel-td text-center text-slate-400 font-mono text-[11px] py-2 px-1 border-e border-slate-200/80">
                            {row.day}
                          </td>

                          {/* Date (التاريخ) */}
                          <td
                            onClick={() => setActiveCell({ rowId: row.id, colKey: 'dateString' })}
                            className="excel-td py-2 px-3 font-mono font-medium text-slate-800 border-e border-slate-200/80"
                          >
                            {row.dateString}
                          </td>

                          {/* Voucher Receipt (الوصل) - Double Click Editable */}
                          <td
                            onClick={() => setActiveCell({ rowId: row.id, colKey: 'receipt' })}
                            onDoubleClick={() =>
                              setEditingCell({
                                rowId: row.id,
                                colKey: 'receipt',
                                value: row.receipt || '',
                              })
                            }
                            title="انقر مرتين للتعديل"
                            className={`excel-td py-2 px-3 font-mono text-slate-700 border-e border-slate-200/80 cursor-cell ${
                              activeCell.rowId === row.id && activeCell.colKey === 'receipt'
                                ? 'excel-cell-active'
                                : ''
                            }`}
                          >
                            {isEditingThisReceipt ? (
                              <input
                                type="text"
                                autoFocus
                                value={editingCell.value}
                                onChange={(e) =>
                                  setEditingCell({ ...editingCell, value: e.target.value })
                                }
                                onBlur={() =>
                                  handleSaveInlineCell(row.id, 'receipt', editingCell.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveInlineCell(row.id, 'receipt', editingCell.value);
                                  } else if (e.key === 'Escape') {
                                    setEditingCell(null);
                                  }
                                }}
                                className="w-full h-6 px-1 text-xs border border-blue-600 bg-white font-mono outline-none shadow-inner"
                              />
                            ) : (
                              row.receipt || <span className="text-slate-300">-</span>
                            )}
                          </td>

                          {/* Amount (المبلغ) - Double Click Editable with Realtime Recalculation */}
                          <td
                            onClick={() => setActiveCell({ rowId: row.id, colKey: 'amount' })}
                            onDoubleClick={() =>
                              setEditingCell({
                                rowId: row.id,
                                colKey: 'amount',
                                value: row.amount ? String(row.amount) : '',
                              })
                            }
                            title="انقر مرتين لتعديل المبلغ"
                            className={`excel-td py-2 px-3 text-end font-mono border-e border-slate-200/80 cursor-cell tabular-nums ${
                              isAmountActive
                                ? 'font-bold text-emerald-800'
                                : 'text-slate-400'
                            } ${
                              activeCell.rowId === row.id && activeCell.colKey === 'amount'
                                ? 'excel-cell-active'
                                : ''
                            }`}
                          >
                            {isEditingThisAmount ? (
                              <input
                                type="number"
                                autoFocus
                                value={editingCell.value}
                                onChange={(e) =>
                                  setEditingCell({ ...editingCell, value: e.target.value })
                                }
                                onBlur={() =>
                                  handleSaveInlineCell(row.id, 'amount', editingCell.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveInlineCell(row.id, 'amount', editingCell.value);
                                  } else if (e.key === 'Escape') {
                                    setEditingCell(null);
                                  }
                                }}
                                className="w-full h-6 px-1 text-xs text-end border border-blue-600 bg-white font-mono font-bold outline-none shadow-inner"
                              />
                            ) : isAmountActive ? (
                              `${row.amount.toLocaleString('fr-DZ')} دج`
                            ) : (
                              '0'
                            )}
                          </td>

                          {/* Recipient (المستلم) - Double Click Editable */}
                          <td
                            onClick={() => setActiveCell({ rowId: row.id, colKey: 'recipient' })}
                            onDoubleClick={() =>
                              setEditingCell({
                                rowId: row.id,
                                colKey: 'recipient',
                                value: row.recipient || '',
                              })
                            }
                            title="انقر مرتين للتعديل"
                            className={`excel-td py-2 px-3 text-slate-800 border-e border-slate-200/80 cursor-cell ${
                              activeCell.rowId === row.id && activeCell.colKey === 'recipient'
                                ? 'excel-cell-active'
                                : ''
                            }`}
                          >
                            {isEditingThisRecipient ? (
                              <input
                                type="text"
                                autoFocus
                                value={editingCell.value}
                                onChange={(e) =>
                                  setEditingCell({ ...editingCell, value: e.target.value })
                                }
                                onBlur={() =>
                                  handleSaveInlineCell(row.id, 'recipient', editingCell.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveInlineCell(row.id, 'recipient', editingCell.value);
                                  } else if (e.key === 'Escape') {
                                    setEditingCell(null);
                                  }
                                }}
                                className="w-full h-6 px-1 text-xs border border-blue-600 bg-white outline-none shadow-inner"
                              />
                            ) : (
                              row.recipient || <span className="text-slate-300">-</span>
                            )}
                          </td>

                          {/* Notes (ملاحظات) - Double Click Editable */}
                          <td
                            onClick={() => setActiveCell({ rowId: row.id, colKey: 'notes' })}
                            onDoubleClick={() =>
                              setEditingCell({
                                rowId: row.id,
                                colKey: 'notes',
                                value: row.notes || '',
                              })
                            }
                            title="انقر مرتين للتعديل"
                            className={`excel-td py-2 px-3 text-slate-600 border-e border-slate-200/80 cursor-cell ${
                              activeCell.rowId === row.id && activeCell.colKey === 'notes'
                                ? 'excel-cell-active'
                                : ''
                            }`}
                          >
                            {isEditingThisNotes ? (
                              <input
                                type="text"
                                autoFocus
                                value={editingCell.value}
                                onChange={(e) =>
                                  setEditingCell({ ...editingCell, value: e.target.value })
                                }
                                onBlur={() =>
                                  handleSaveInlineCell(row.id, 'notes', editingCell.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveInlineCell(row.id, 'notes', editingCell.value);
                                  } else if (e.key === 'Escape') {
                                    setEditingCell(null);
                                  }
                                }}
                                className="w-full h-6 px-1 text-xs border border-blue-600 bg-white outline-none shadow-inner"
                              />
                            ) : (
                              row.notes || <span className="text-slate-300">-</span>
                            )}
                          </td>

                          {/* Action Control */}
                          <td className="excel-td py-2 px-2 text-center border-e border-slate-200/80">
                            <button
                              onClick={() => {
                                setEditingRow({ ...row });
                                setIsModalOpen(true);
                              }}
                              className="p-1 hover:bg-blue-100 text-blue-900 rounded text-[11px]"
                              title="تعديل تفاصيل التسليم"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Month Subtotal Row: Exactly matching user format (مجموع شهر ...) */}
                    <tr className="bg-emerald-50/90 border-y-2 border-emerald-300 font-bold text-xs select-none">
                      <td className="excel-td py-2 px-2 text-center text-emerald-800 font-mono">
                        ∑
                      </td>
                      <td
                        colSpan={2}
                        className="excel-td py-2 px-3 text-slate-900 font-bold"
                      >
                        {month.subtotalLabel}
                      </td>
                      <td className="excel-td py-2 px-3 text-end font-mono text-emerald-950 font-bold text-sm tabular-nums border-s border-emerald-200">
                        {group.subtotal.toLocaleString('fr-DZ')} دج
                      </td>
                      <td
                        colSpan={3}
                        className="excel-td py-2 px-3 text-slate-600 text-[11px]"
                      >
                        إجمالي سيولة شهر {month.nameAr} المحولة والمستلمة
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="py-12 text-center text-slate-400 font-medium"
                >
                  لا توجد سجلات تسليم مطابقة لشروط البحث والتصفية المحددة.
                </td>
              </tr>
            )}
          </tbody>

          {/* Sticky Grand Total Footer */}
          <tfoot className="sticky bottom-0 z-30 bg-slate-900 text-white font-bold text-xs border-t-2 border-slate-700 shadow-md select-none">
            <tr>
              <td className="py-2.5 px-2 text-center font-mono text-emerald-400 text-sm">
                ∑∑
              </td>
              <td colSpan={2} className="py-2.5 px-3 text-sm">
                المجموع العام لتسليم السيولة (2025 - 2026)
              </td>
              <td className="py-2.5 px-3 text-end font-mono text-emerald-400 text-base font-bold tabular-nums">
                {stats.grandTotal.toLocaleString('fr-DZ')} دج
              </td>
              <td colSpan={3} className="py-2.5 px-3 text-xs text-slate-300 font-normal">
                {stats.nonZeroCount} عملية تسليم مسجلة عبر كامل الدورة السنوية
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 5. Excel Workbook Month Sheet Tabs Bar */}
      <div className="border-t border-slate-300 bg-slate-100 flex items-center justify-between px-2 py-1 select-none overflow-x-auto">
        <div className="flex items-center space-x-reverse space-x-0.5">
          <span className="text-[10px] text-slate-500 font-bold px-2 py-1 font-mono uppercase">
            أشهر التسليم:
          </span>

          {/* All Months Tab */}
          <button
            onClick={() => setActiveMonthTab('ALL')}
            className={`px-3 py-1 text-xs font-semibold flex items-center gap-1 border-e border-slate-200 transition-colors ${
              activeMonthTab === 'ALL'
                ? 'bg-white text-blue-950 border-t-2 border-t-blue-900 shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-3 h-3 text-blue-900" />
            <span>عرض السنة كاملة (11 شهر)</span>
          </button>

          {/* Individual Month Tabs */}
          {DELIVERY_MONTHS.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveMonthTab(m.id)}
              className={`px-2.5 py-1 text-xs font-semibold flex items-center gap-1 border-e border-slate-200 transition-colors ${
                activeMonthTab === m.id
                  ? 'bg-white text-blue-950 border-t-2 border-t-blue-900 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`}
            >
              <span>{m.nameAr}</span>
            </button>
          ))}
        </div>

        {/* Active Cell Coordinates & Quick Tip */}
        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono hidden lg:flex">
          <span className="bg-white px-2 py-0.5 border border-slate-200 text-blue-900 font-bold tabular-nums">
            {activeCell.rowId
              ? `الخلية: ${activeCell.rowId} (${activeCell.colKey})`
              : 'انقر مرتين لتعديل أي خلية'}
          </span>
        </div>
      </div>

      {/* 6. Modal: Quick Delivery Record / Edit */}
      {isModalOpen && editingRow && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-400 w-full max-w-md shadow-2xl rounded p-5 font-arabic">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-900 text-white rounded">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    تعديل تسليم يوم: {editingRow.dateString}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    تحديث بيانات الوصل والمبلغ والمستلم والبيان
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    المبلغ المسلم (دج) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    autoFocus
                    required
                    value={editingRow.amount}
                    onChange={(e) =>
                      setEditingRow({
                        ...editingRow,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold text-slate-900 focus:border-blue-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    رقم الوصل
                  </label>
                  <input
                    type="text"
                    value={editingRow.receipt || ''}
                    onChange={(e) =>
                      setEditingRow({ ...editingRow, receipt: e.target.value })
                    }
                    placeholder="REC-2025-XXXX"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono focus:border-blue-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  اسم المستلم (الخزينة)
                </label>
                <input
                  type="text"
                  list="recipients-list"
                  value={editingRow.recipient || ''}
                  onChange={(e) =>
                    setEditingRow({ ...editingRow, recipient: e.target.value })
                  }
                  placeholder="اختر أو اكتب اسم المستلم..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none"
                />
                <datalist id="recipients-list">
                  {DEFAULT_RECIPIENTS.map((rec, i) => (
                    <option key={i} value={rec} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ملاحظات أو بيان التسليم
                </label>
                <textarea
                  rows="2"
                  value={editingRow.notes || ''}
                  onChange={(e) =>
                    setEditingRow({ ...editingRow, notes: e.target.value })
                  }
                  placeholder="ملاحظات توثيقية إضافية..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded font-medium shadow-xs"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
