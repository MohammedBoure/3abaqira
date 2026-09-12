import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Download,
  Copy,
  Table as TableIcon,
  Check,
  Edit3,
  Filter,
  Printer,
  X,
  Maximize2,
  Minimize2,
  Plus,
  Calendar,
  DollarSign,
  TrendingDown,
  Tag,
  Receipt,
} from 'lucide-react';
import {
  EXPENSES_MONTHS,
  COMMON_DESIGNATIONS,
  MOCK_EXPENSES_LEDGER,
  computeExpensesLedgerStats,
} from '../../mock/expensesLedgerData';

export function ExpensesLedgerGrid({
  selectedBranch = 'ALL',
  onSelectBranch,
  className = '',
}) {
  // Master expenses ledger state (all 334 days)
  const [ledgerData, setLedgerData] = useState(MOCK_EXPENSES_LEDGER);

  // Active month tab filter ('ALL' or month.id e.g. 'sept-2025')
  const [activeMonthTab, setActiveMonthTab] = useState('ALL');

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Toggle to show only non-zero days or all calendar days
  const [showOnlyNonZero, setShowOnlyNonZero] = useState(false);

  // Active cell coordinates for Excel status bar
  const [activeCell, setActiveCell] = useState({ rowId: null, colKey: null });

  // Fullscreen / Expanded Focus Mode
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Inline cell editing: { rowId, colKey, value }
  const [editingCell, setEditingCell] = useState(null);

  // Quick expense modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);

  // Copy success & toast notification
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
      const matchesNonZero = !showOnlyNonZero || Number(row.amount) > 0;
      const s = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !s ||
        row.dateString.toLowerCase().includes(s) ||
        (row.designation && row.designation.toLowerCase().includes(s));

      return matchesBranch && matchesMonth && matchesNonZero && matchesSearch;
    });
  }, [ledgerData, selectedBranch, activeMonthTab, showOnlyNonZero, searchTerm]);

  // Group filtered rows by month for rendering subtotal rows
  const monthGroups = useMemo(() => {
    const groups = [];
    EXPENSES_MONTHS.forEach((m) => {
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
    return computeExpensesLedgerStats(filteredRows);
  }, [filteredRows]);

  // Peak month calculation
  const peakMonth = useMemo(() => {
    let max = { name: '-', total: 0 };
    EXPENSES_MONTHS.forEach((m) => {
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
    showToast('تم تحديث المصروف في الخلية مباشرة');
  };

  // Quick Modal Submit
  const handleSaveModal = (e) => {
    e.preventDefault();
    if (!editingRow) return;

    setLedgerData((prev) =>
      prev.map((r) => (r.id === editingRow.id ? editingRow : r))
    );
    showToast(`تم حفظ مصروف يوم: ${editingRow.dateString}`);
    setIsModalOpen(false);
    setEditingRow(null);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['التاريخ', 'التعيين', 'المبلغ (دج)', 'المقر'];
    const rows = filteredRows.map((r) => [
      `"${r.dateString}"`,
      `"${r.designation || ''}"`,
      r.amount || 0,
      `"${r.branchId === 'RAWDA' ? 'الروضة' : 'المركز الأكاديمي'}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `3abaqira_daily_expenses_${activeMonthTab}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('تم تصدير سجل المصاريف كملف CSV بنجاح');
  };

  // Copy TSV for Excel paste
  const copyToClipboard = () => {
    const headers = ['التاريخ\tالتعيين\tالمبلغ'];
    const lines = filteredRows.map(
      (r) => `${r.dateString}\t${r.designation || ''}\t${r.amount || 0}`
    );
    const tsvContent = [headers, ...lines].join('\n');
    navigator.clipboard.writeText(tsvContent).then(() => {
      setCopySuccess(true);
      showToast('تم نسخ جدول المصاريف بالكامل بتنسيق Excel/TSV');
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
            <div className="bg-amber-600 text-white font-mono text-xs px-2 py-0.5 rounded font-bold">
              وضع ملء الشاشة
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">جدول المصاريف اليومية التفصيلي (2025 - 2026)</span>
              <span className="text-xs text-slate-400 font-mono">
                (المجموع العام: {stats.grandTotal.toLocaleString('fr-DZ')} دج • {stats.nonZeroCount} يوم صرف)
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

      {/* 2. Top Summary KPI Strip */}
      <div className="p-3 sm:p-4 bg-slate-50/70 border-b border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-2.5 border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5 text-rose-700" />
            <span>إجمالي المصاريف المسجلة</span>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-rose-800 mt-1 tabular-nums">
            {stats.grandTotal.toLocaleString('fr-DZ')} دج
          </div>
        </div>

        <div className="bg-white p-2.5 border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-blue-700" />
            <span>أيام الصرف الموثقة</span>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {stats.nonZeroCount} <span className="text-xs font-normal text-slate-500">من {filteredRows.length} يوم</span>
          </div>
        </div>

        <div className="bg-white p-2.5 border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-amber-700" />
            <span>متوسط المصروف اليومي</span>
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
            <Tag className="w-3.5 h-3.5 text-blue-900" />
            <span>الشهر الأكثر إنفاقاً</span>
          </div>
          <div className="text-sm font-bold text-blue-950 mt-1 truncate">
            {peakMonth.name} ({peakMonth.total.toLocaleString('fr-DZ')} دج)
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
              placeholder="تصفية (التاريخ، التعيين، المبلغ)..."
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
            title="إخفاء الأيام التي لم يسجل بها مصروف"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>أيام المصاريف فقط</span>
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
            title={isFullscreen ? 'تصغير الشاشة (Esc)' : 'تكبير وتوسيع جدول المصاريف'}
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
            title="طباعة جدول المصاريف"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>طباعة</span>
          </button>
        </div>
      </div>

      {/* 4. Primary Excel Expenses Table */}
      <div
        ref={tableContainerRef}
        className={`w-full overflow-x-auto overflow-y-auto ${
          isFullscreen
            ? 'flex-1 border-b border-slate-200/90 relative select-text'
            : 'max-h-[calc(100vh-270px)] border-b border-slate-200/90 relative select-text'
        }`}
      >
        <table className="excel-table text-xs border-collapse w-full">
          {/* Main Excel Header: Heading "المصاريف اليومية" */}
          <thead className="sticky top-0 z-30 bg-slate-100/95 backdrop-blur-xs shadow-xs border-b border-slate-300">
            {/* Super Header Banner */}
            <tr className="bg-slate-900 text-white text-center font-bold tracking-wider">
              <th colSpan={5} className="py-2 px-3 text-sm font-serif">
                المصاريف اليومية (Daily Operational Expenses)
              </th>
            </tr>
            {/* Column Headers: RTL sequence matching user prompt */}
            <tr>
              <th className="excel-th w-12 text-center py-2 px-2 text-slate-600">
                #
              </th>
              <th className="excel-th w-40 text-start py-2 px-3 font-bold text-slate-900 border-s border-slate-200 font-mono">
                التاريخ
              </th>
              <th className="excel-th text-start py-2 px-3 font-bold text-slate-900 border-s border-slate-200">
                التعيين
              </th>
              <th className="excel-th w-44 text-end py-2 px-3 font-bold text-slate-900 border-s border-slate-200 font-mono">
                المبلغ (دج)
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
                        colSpan={5}
                        className="py-1 px-3 text-xs font-bold text-slate-900 flex-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-blue-900" />
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
                      const isEditingThisDesignation =
                        editingCell &&
                        editingCell.rowId === row.id &&
                        editingCell.colKey === 'designation';
                      const isEditingThisAmount =
                        editingCell &&
                        editingCell.rowId === row.id &&
                        editingCell.colKey === 'amount';

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

                          {/* Designation (التعيين) - Double Click Editable */}
                          <td
                            onClick={() => setActiveCell({ rowId: row.id, colKey: 'designation' })}
                            onDoubleClick={() =>
                              setEditingCell({
                                rowId: row.id,
                                colKey: 'designation',
                                value: row.designation || '',
                              })
                            }
                            title="انقر مرتين لتعديل التعيين"
                            className={`excel-td py-2 px-3 text-slate-800 border-e border-slate-200/80 cursor-cell ${
                              activeCell.rowId === row.id && activeCell.colKey === 'designation'
                                ? 'excel-cell-active'
                                : ''
                            }`}
                          >
                            {isEditingThisDesignation ? (
                              <input
                                type="text"
                                autoFocus
                                value={editingCell.value}
                                onChange={(e) =>
                                  setEditingCell({ ...editingCell, value: e.target.value })
                                }
                                onBlur={() =>
                                  handleSaveInlineCell(row.id, 'designation', editingCell.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveInlineCell(row.id, 'designation', editingCell.value);
                                  } else if (e.key === 'Escape') {
                                    setEditingCell(null);
                                  }
                                }}
                                className="w-full h-6 px-1 text-xs border border-blue-600 bg-white outline-none shadow-inner"
                              />
                            ) : (
                              row.designation || <span className="text-slate-300">-</span>
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
                                ? 'font-bold text-rose-800'
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

                          {/* Action Control */}
                          <td className="excel-td py-2 px-2 text-center border-e border-slate-200/80">
                            <button
                              onClick={() => {
                                setEditingRow({ ...row });
                                setIsModalOpen(true);
                              }}
                              className="p-1 hover:bg-rose-100 text-rose-800 rounded text-[11px]"
                              title="تعديل تفاصيل المصروف"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Month Subtotal Row: Exactly matching user prompt (مجموع شهر ...) */}
                    <tr className="bg-rose-50/90 border-y-2 border-rose-300 font-bold text-xs select-none">
                      <td className="excel-td py-2 px-2 text-center text-rose-800 font-mono">
                        ∑
                      </td>
                      <td
                        colSpan={2}
                        className="excel-td py-2 px-3 text-slate-900 font-bold"
                      >
                        {month.subtotalLabel}
                      </td>
                      <td className="excel-td py-2 px-3 text-end font-mono text-rose-950 font-bold text-sm tabular-nums border-s border-rose-200">
                        {group.subtotal.toLocaleString('fr-DZ')} دج
                      </td>
                      <td className="excel-td py-2 px-2 text-center text-rose-600 text-[10px]">
                        مجموع
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="py-12 text-center text-slate-400 font-medium"
                >
                  لا توجد سجلات مصاريف مطابقة لشروط البحث والتصفية المحددة.
                </td>
              </tr>
            )}
          </tbody>

          {/* Sticky Grand Total Footer */}
          <tfoot className="sticky bottom-0 z-30 bg-slate-900 text-white font-bold text-xs border-t-2 border-slate-700 shadow-md select-none">
            <tr>
              <td className="py-2.5 px-2 text-center font-mono text-rose-400 text-sm">
                ∑∑
              </td>
              <td colSpan={2} className="py-2.5 px-3 text-sm">
                المجموع العام للمصاريف اليومية (2025 - 2026)
              </td>
              <td className="py-2.5 px-3 text-end font-mono text-rose-400 text-base font-bold tabular-nums">
                {stats.grandTotal.toLocaleString('fr-DZ')} دج
              </td>
              <td className="py-2.5 px-2 text-center text-xs text-slate-400 font-normal">
                {stats.nonZeroCount} سطر
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 5. Excel Workbook Month Sheet Tabs Bar */}
      <div className="border-t border-slate-300 bg-slate-100 flex items-center justify-between px-2 py-1 select-none overflow-x-auto">
        <div className="flex items-center space-x-reverse space-x-0.5">
          <span className="text-[10px] text-slate-500 font-bold px-2 py-1 font-mono uppercase">
            أشهر المصاريف:
          </span>

          {/* All Months Tab */}
          <button
            onClick={() => setActiveMonthTab('ALL')}
            className={`px-3 py-1 text-xs font-semibold flex items-center gap-1 border-e border-slate-200 transition-colors ${
              activeMonthTab === 'ALL'
                ? 'bg-white text-rose-950 border-t-2 border-t-rose-800 shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-3 h-3 text-rose-800" />
            <span>عرض السنة كاملة (11 شهر)</span>
          </button>

          {/* Individual Month Tabs */}
          {EXPENSES_MONTHS.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveMonthTab(m.id)}
              className={`px-2.5 py-1 text-xs font-semibold flex items-center gap-1 border-e border-slate-200 transition-colors ${
                activeMonthTab === m.id
                  ? 'bg-white text-rose-950 border-t-2 border-t-rose-800 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`}
            >
              <span>{m.nameAr}</span>
            </button>
          ))}
        </div>

        {/* Active Cell Coordinates & Quick Tip */}
        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono hidden lg:flex">
          <span className="bg-white px-2 py-0.5 border border-slate-200 text-rose-900 font-bold tabular-nums">
            {activeCell.rowId
              ? `الخلية: ${activeCell.rowId} (${activeCell.colKey})`
              : 'انقر مرتين لتعديل التعيين أو المبلغ'}
          </span>
        </div>
      </div>

      {/* 6. Modal: Quick Expense Edit / Record */}
      {isModalOpen && editingRow && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-400 w-full max-w-md shadow-2xl rounded p-5 font-arabic">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-900 text-white rounded">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    تعديل مصروف يوم: {editingRow.dateString}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    تحديث تعيين النفقة والمبلغ المقيد
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
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  المبلغ (دج) *
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
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold text-slate-900 focus:border-rose-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  التعيين (بيان وموضوع النفقة) *
                </label>
                <input
                  type="text"
                  list="common-designations-list"
                  required
                  value={editingRow.designation || ''}
                  onChange={(e) =>
                    setEditingRow({ ...editingRow, designation: e.target.value })
                  }
                  placeholder="اكتب التعيين أو اختر من القائمة..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-rose-900 focus:outline-none"
                />
                <datalist id="common-designations-list">
                  {COMMON_DESIGNATIONS.map((des, i) => (
                    <option key={i} value={des} />
                  ))}
                </datalist>
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
                  className="px-4 py-1.5 bg-rose-900 hover:bg-rose-800 text-white rounded font-medium shadow-xs"
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
