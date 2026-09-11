import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Download,
  Copy,
  SlidersHorizontal,
  CheckSquare,
  Square,
  ChevronDown,
  Eye,
  Printer,
  Table as TableIcon,
  Check,
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { GlassButton } from '../common/GlassButton';
import {
  MOCK_STUDENTS_ROSTER,
} from '../../mock/mockData';

// Full column definition catalog (26 columns)
const ALL_COLUMNS = [
  { id: 'seqNumber', labelAr: '#', labelEn: 'Seq', width: 'w-12 text-center', category: 'core', pinned: true },
  { id: 'studentCode', labelAr: 'الرمز', labelEn: 'Code', width: 'w-28 font-mono', category: 'core', pinned: true },
  { id: 'fullNameAr', labelAr: 'الاسم واللقب (عربي)', labelEn: 'Full Name (Ar)', width: 'w-44 font-bold', category: 'core', pinned: true },
  { id: 'fullNameFr', labelAr: 'Nom et Prénom', labelEn: 'Full Name (Fr)', width: 'w-44 font-latin text-slate-600', category: 'personal' },
  { id: 'branchNameAr', labelAr: 'المقر / الفرع', labelEn: 'Branch', width: 'w-36', category: 'academic' },
  { id: 'program', labelAr: 'البرنامج التعليمي', labelEn: 'Program', width: 'w-48 font-medium', category: 'academic' },
  { id: 'level', labelAr: 'المستوى الدراسي', labelEn: 'Level', width: 'w-40 text-slate-600', category: 'academic' },
  { id: 'cohort', labelAr: 'الفوج والتوقيت', labelEn: 'Cohort', width: 'w-44 text-slate-600', category: 'academic' },
  { id: 'coachName', labelAr: 'الأستاذ / المدرب', labelEn: 'Coach', width: 'w-36', category: 'academic' },
  { id: 'birthDate', labelAr: 'تاريخ الميلاد', labelEn: 'Birth Date', width: 'w-28 font-mono text-slate-600', category: 'personal' },
  { id: 'gender', labelAr: 'الجنس', labelEn: 'Gender', width: 'w-20 text-center', category: 'personal' },
  { id: 'guardianName', labelAr: 'ولي الأمر', labelEn: 'Guardian', width: 'w-36', category: 'personal' },
  { id: 'guardianPhone', labelAr: 'رقم الهاتف', labelEn: 'Phone', width: 'w-32 font-mono', category: 'personal' },
  { id: 'agreedAmount', labelAr: 'المستحق (دج)', labelEn: 'Agreed Fee', width: 'w-28 font-mono text-end', category: 'financial', isCurrency: true },
  { id: 'registrationFee', labelAr: 'ح.التسجيل', labelEn: 'Reg Fee', width: 'w-24 font-mono text-end', category: 'financial', isCurrency: true },
  { id: 'installment1', labelAr: 'الدفعة 1', labelEn: 'Inst 1', width: 'w-24 font-mono text-end', category: 'installments', isCurrency: true },
  { id: 'receipt1', labelAr: 'وصل 1', labelEn: 'Rec 1', width: 'w-28 font-mono text-center text-[11px]', category: 'installments' },
  { id: 'installment2', labelAr: 'الدفعة 2', labelEn: 'Inst 2', width: 'w-24 font-mono text-end', category: 'installments', isCurrency: true },
  { id: 'receipt2', labelAr: 'وصل 2', labelEn: 'Rec 2', width: 'w-28 font-mono text-center text-[11px]', category: 'installments' },
  { id: 'installment3', labelAr: 'الدفعة 3', labelEn: 'Inst 3', width: 'w-24 font-mono text-end', category: 'installments', isCurrency: true },
  { id: 'receipt3', labelAr: 'وصل 3', labelEn: 'Rec 3', width: 'w-28 font-mono text-center text-[11px]', category: 'installments' },
  { id: 'installment4', labelAr: 'الدفعة 4', labelEn: 'Inst 4', width: 'w-24 font-mono text-end', category: 'installments', isCurrency: true },
  { id: 'receipt4', labelAr: 'وصل 4', labelEn: 'Rec 4', width: 'w-28 font-mono text-center text-[11px]', category: 'installments' },
  { id: 'totalPaid', labelAr: 'المحصل (دج)', labelEn: 'Total Paid', width: 'w-28 font-mono text-end font-bold text-emerald-800', category: 'financial', isCurrency: true },
  { id: 'remainingBalance', labelAr: 'الباقي (دج)', labelEn: 'Remaining', width: 'w-28 font-mono text-end font-bold text-rose-800', category: 'financial', isCurrency: true },
  { id: 'paymentStatus', labelAr: 'حالة السداد', labelEn: 'Status', width: 'w-32 text-center', category: 'financial', isStatus: true },
  { id: 'enrollmentDate', labelAr: 'تاريخ القيد', labelEn: 'Enroll Date', width: 'w-28 font-mono text-slate-600', category: 'academic' },
  { id: 'notes', labelAr: 'ملاحظات إدارية', labelEn: 'Notes', width: 'w-56 text-slate-600 truncate', category: 'personal' },
];

export function ExcelDataGrid({ selectedBranch = 'ALL' }) {
  const [activeSheet, setActiveSheet] = useState('STUDENTS_CENTER'); // 'STUDENTS_CENTER' | 'STUDENTS_RAWDA'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  const [activeCell, setActiveCell] = useState({ rowIndex: 0, colIndex: 2 });
  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Column Presets
  const [visibleColIds, setVisibleColIds] = useState(
    new Set(ALL_COLUMNS.map((c) => c.id))
  );

  const tableContainerRef = useRef(null);

  // Keyboard navigation for active Excel cell
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'SELECT') {
        return;
      }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        setActiveCell((prev) => {
          let nextRow = prev.rowIndex;
          let nextCol = prev.colIndex;
          const maxRows = filteredData.length;
          const maxCols = visibleColumns.length;

          if (e.key === 'ArrowUp') nextRow = Math.max(0, nextRow - 1);
          if (e.key === 'ArrowDown') nextRow = Math.min(maxRows - 1, nextRow + 1);
          if (e.key === 'ArrowLeft') nextCol = Math.min(maxCols - 1, nextCol + 1);
          if (e.key === 'ArrowRight') nextCol = Math.max(0, nextCol - 1);

          return { rowIndex: nextRow, colIndex: nextCol };
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter Data based on Active Sheet and Search
  const filteredData = useMemo(() => {
    let source = MOCK_STUDENTS_ROSTER;
    if (activeSheet === 'STUDENTS_CENTER') {
      source = MOCK_STUDENTS_ROSTER.filter((s) => s.branchId === 'CENTER');
    } else if (activeSheet === 'STUDENTS_RAWDA') {
      source = MOCK_STUDENTS_ROSTER.filter((s) => s.branchId === 'RAWDA');
    }

    return source.filter((item) => {
      const matchesBranch =
        selectedBranch === 'ALL' || item.branchId === selectedBranch;
      const matchesStatus =
        statusFilter === 'ALL' || item.paymentStatus === statusFilter;
      const matchesSearch =
        searchTerm === '' ||
        item.fullNameAr?.includes(searchTerm) ||
        item.fullNameFr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.studentCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.program?.includes(searchTerm) ||
        item.coachName?.includes(searchTerm);

      return matchesBranch && matchesStatus && matchesSearch;
    });
  }, [activeSheet, selectedBranch, statusFilter, searchTerm]);

  // Visible columns array
  const visibleColumns = useMemo(() => {
    return ALL_COLUMNS.filter((c) => visibleColIds.has(c.id));
  }, [visibleColIds]);

  // Preset switchers
  const applyPreset = (presetType) => {
    if (presetType === 'ALL') {
      setVisibleColIds(new Set(ALL_COLUMNS.map((c) => c.id)));
    } else if (presetType === 'ACADEMIC') {
      const ids = ['seqNumber', 'studentCode', 'fullNameAr', 'fullNameFr', 'branchNameAr', 'program', 'level', 'cohort', 'coachName'];
      setVisibleColIds(new Set(ids));
    } else if (presetType === 'FINANCIAL') {
      const ids = ['seqNumber', 'studentCode', 'fullNameAr', 'agreedAmount', 'registrationFee', 'installment1', 'receipt1', 'installment2', 'receipt2', 'installment3', 'receipt3', 'totalPaid', 'remainingBalance', 'paymentStatus'];
      setVisibleColIds(new Set(ids));
    } else if (presetType === 'GUARDIANS') {
      const ids = ['seqNumber', 'studentCode', 'fullNameAr', 'birthDate', 'gender', 'guardianName', 'guardianPhone', 'notes'];
      setVisibleColIds(new Set(ids));
    }
  };

  const toggleColumn = (colId) => {
    const next = new Set(visibleColIds);
    if (next.has(colId)) {
      if (next.size > 2) next.delete(colId);
    } else {
      next.add(colId);
    }
    setVisibleColIds(next);
  };

  // Toggle row selection
  const toggleRowSelect = (id) => {
    const next = new Set(selectedRowIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRowIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedRowIds.size === filteredData.length) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(filteredData.map((d) => d.id)));
    }
  };

  // Live Formula Bar calculations (Excel Aggregates)
  const stats = useMemo(() => {
    const targetRows = selectedRowIds.size > 0
      ? filteredData.filter((d) => selectedRowIds.has(d.id))
      : filteredData;

    const count = targetRows.length;
    const sumAgreed = targetRows.reduce((acc, cur) => acc + (cur.agreedAmount || 0), 0);
    const sumPaid = targetRows.reduce((acc, cur) => acc + (cur.totalPaid || 0), 0);
    const sumRemaining = targetRows.reduce((acc, cur) => acc + (cur.remainingBalance || 0), 0);
    const collectionRate = sumAgreed > 0 ? ((sumPaid / sumAgreed) * 100).toFixed(1) : '0.0';

    return { count, sumAgreed, sumPaid, sumRemaining, collectionRate };
  }, [filteredData, selectedRowIds]);

  // Export to clean CSV (UTF-8 BOM for Arabic support in Excel)
  const exportToCSV = () => {
    const headers = visibleColumns.map((c) => `"${c.labelAr}"`).join(',');
    const rows = filteredData.map((row) => {
      return visibleColumns.map((col) => {
        let val = row[col.id] ?? '';
        if (typeof val === 'string') val = val.replace(/"/g, '""');
        return `"${val}"`;
      }).join(',');
    });

    const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `3abaqira_export_${activeSheet}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy TSV to clipboard (Direct paste into Excel / Sheets)
  const copyToClipboard = () => {
    const headers = visibleColumns.map((c) => c.labelAr).join('\t');
    const rows = filteredData.map((row) => {
      return visibleColumns.map((col) => row[col.id] ?? '').join('\t');
    });
    const tsvContent = [headers, ...rows].join('\n');
    navigator.clipboard.writeText(tsvContent).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  return (
    <div className="w-full bg-white border border-slate-300 shadow-xs flex flex-col">
      {/* 1. Technical Utility Toolbar (Density & Purposeful Controls) */}
      <div className="p-2 sm:p-2.5 border-b border-slate-300 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
        {/* Left: Search & Filter Segment */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Filter Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute inset-y-0 start-2.5 my-auto text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="تصفية فورية (الاسم، الرمز، الأستاذ)..."
              className="h-7 ps-7 pe-2 text-xs sharp-input w-48 sm:w-64"
            />
          </div>

          {/* Payment Status Segmented Control */}
          <div className="flex items-center border border-slate-300 bg-white">
            {[
              { id: 'ALL', label: 'الكل' },
              { id: 'PAID', label: 'مسدد' },
              { id: 'PARTIAL', label: 'جزئي' },
              { id: 'OVERDUE', label: 'متأخر' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-blue-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Column Presets Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsColumnPickerOpen(!isColumnPickerOpen)}
              className="h-7 px-2.5 flex items-center gap-1.5 text-xs sharp-btn-secondary"
              title="تخصيص الأعمدة المعروضة"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
              <span>الأعمدة ({visibleColumns.length})</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Column Picker Modal / Popover */}
            {isColumnPickerOpen && (
              <div className="absolute top-8 start-0 z-50 w-72 bg-white border border-slate-300 shadow-xl p-3 text-xs">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-900">تخصيص الأعمدة ({ALL_COLUMNS.length})</span>
                  <button
                    onClick={() => setIsColumnPickerOpen(false)}
                    className="text-slate-400 hover:text-slate-800 font-bold"
                  >
                    ✕
                  </button>
                </div>

                {/* Presets */}
                <div className="mb-2 pb-2 border-b border-slate-100 flex flex-wrap gap-1">
                  <button
                    onClick={() => applyPreset('ALL')}
                    className="px-1.5 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
                  >
                    الكل (26)
                  </button>
                  <button
                    onClick={() => applyPreset('ACADEMIC')}
                    className="px-1.5 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
                  >
                    أكاديمي
                  </button>
                  <button
                    onClick={() => applyPreset('FINANCIAL')}
                    className="px-1.5 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
                  >
                    أقساط ومالية
                  </button>
                  <button
                    onClick={() => applyPreset('GUARDIANS')}
                    className="px-1.5 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
                  >
                    أولياء الأمور
                  </button>
                </div>

                {/* Columns List */}
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {ALL_COLUMNS.map((col) => (
                    <label
                      key={col.id}
                      className="flex items-center gap-2 p-1 hover:bg-slate-50 cursor-pointer text-slate-800 select-none"
                    >
                      <input
                        type="checkbox"
                        checked={visibleColIds.has(col.id)}
                        onChange={() => toggleColumn(col.id)}
                        className="rounded-none text-blue-900 focus:ring-0"
                      />
                      <span className="font-medium truncate">{col.labelAr}</span>
                      <span className="text-[10px] text-slate-400 ms-auto font-mono">{col.labelEn}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Operational Transfer & Export Actions */}
        <div className="flex items-center gap-1.5">
          <GlassButton
            onClick={copyToClipboard}
            variant="secondary"
            size="sm"
            icon={copySuccess ? Check : Copy}
            className="h-7 text-xs"
            title="نسخ الجدول بتنسيق Excel إلى الحافظة (Ctrl+C)"
          >
            {copySuccess ? 'تم النسخ بنجاح' : 'نسخ للحافظة (TSV)'}
          </GlassButton>

          <GlassButton
            onClick={exportToCSV}
            variant="primary"
            size="sm"
            icon={Download}
            className="h-7 text-xs"
            title="تنزيل جدول البيانات بتنسيق Excel (.CSV)"
          >
            تصدير إلى Excel (.CSV)
          </GlassButton>
        </div>
      </div>

      {/* 2. Workbook Sheet Switcher Tabs (Excel-like Sheet Tabs at Top) */}
      <div className="flex items-center border-b border-slate-300 bg-slate-200/70 overflow-x-auto text-xs select-none">
        <button
          onClick={() => setActiveSheet('STUDENTS_CENTER')}
          className={`flex items-center gap-1.5 px-4 py-2 border-r border-slate-300 font-semibold transition-colors ${
            activeSheet === 'STUDENTS_CENTER'
              ? 'bg-white text-blue-900 border-b-2 border-b-blue-900 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <TableIcon className="w-3.5 h-3.5 text-blue-700" />
          <span>سجل طلاب الأكاديمية (المركز)</span>
          <span className="text-[10px] font-mono px-1 py-0.2 bg-slate-100 text-slate-700 border border-slate-200">
            {MOCK_STUDENTS_ROSTER.filter((s) => s.branchId === 'CENTER').length}
          </span>
        </button>

        <button
          onClick={() => setActiveSheet('STUDENTS_RAWDA')}
          className={`flex items-center gap-1.5 px-4 py-2 border-r border-slate-300 font-semibold transition-colors ${
            activeSheet === 'STUDENTS_RAWDA'
              ? 'bg-white text-blue-900 border-b-2 border-b-blue-900 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <TableIcon className="w-3.5 h-3.5 text-blue-700" />
          <span>سجل أطفال الروضة والحضانة</span>
          <span className="text-[10px] font-mono px-1 py-0.2 bg-slate-100 text-slate-700 border border-slate-200">
            {MOCK_STUDENTS_ROSTER.filter((s) => s.branchId === 'RAWDA').length}
          </span>
        </button>
      </div>

      {/* 3. Multi-Column Excel Data Table Container (Freeze Panes & Overflow Handling) */}
      <div
        ref={tableContainerRef}
        className="w-full overflow-x-auto overflow-y-auto max-h-[580px] relative border-b border-slate-300"
      >
        <table className="excel-table text-xs text-slate-800">
          <thead>
            <tr className="bg-slate-100 text-slate-700 sticky top-0 z-20 shadow-xs">
              {/* Select All Checkbox Column */}
              <th className="excel-th py-2 px-2 w-8 text-center sticky start-0 z-30 bg-slate-100 border-r-2 border-r-slate-400">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center justify-center w-full text-slate-600 hover:text-slate-900"
                >
                  {selectedRowIds.size > 0 && selectedRowIds.size === filteredData.length ? (
                    <CheckSquare className="w-3.5 h-3.5 text-blue-900" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
              </th>

              {/* Dynamic Headers with Excel Letter indicators */}
              {visibleColumns.map((col, idx) => {
                const excelColLetter = String.fromCharCode(65 + (idx % 26));
                const isPinned = col.pinned;
                return (
                  <th
                    key={col.id}
                    className={`
                      excel-th py-2 px-3 text-start ${col.width}
                      ${isPinned ? 'sticky z-25 bg-slate-100 border-r border-slate-300' : ''}
                    `}
                    style={
                      isPinned && idx === 1
                        ? { insetInlineStart: '2rem' }
                        : isPinned && idx === 2
                        ? { insetInlineStart: '9rem' }
                        : {}
                    }
                  >
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-mono font-normal">
                        {excelColLetter}
                      </span>
                      <span className="font-semibold text-slate-900">{col.labelAr}</span>
                    </div>
                  </th>
                );
              })}

              {/* Actions Header */}
              <th className="excel-th py-2 px-3 w-20 text-center sticky end-0 z-25 bg-slate-100 border-l border-slate-300">
                الإجراءات
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {filteredData.length > 0 ? (
              filteredData.map((row, rIndex) => {
                const isSelected = selectedRowIds.has(row.id);
                return (
                  <tr
                    key={row.id}
                    className={`
                      transition-colors
                      ${isSelected ? 'excel-row-selected' : rIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                      hover:bg-blue-50/80
                    `}
                  >
                    {/* Row Select Box */}
                    <td className="excel-td py-1.5 px-2 text-center sticky start-0 z-10 bg-inherit border-r-2 border-r-slate-400">
                      <button
                        onClick={() => toggleRowSelect(row.id)}
                        className="flex items-center justify-center w-full text-slate-500 hover:text-blue-900"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-3.5 h-3.5 text-blue-900" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-300" />
                        )}
                      </button>
                    </td>

                    {/* Column Cells */}
                    {visibleColumns.map((col, cIndex) => {
                      const isCellActive =
                        activeCell.rowIndex === rIndex && activeCell.colIndex === cIndex;
                      const rawValue = row[col.id];
                      let displayVal = rawValue;

                      if (col.isCurrency && typeof rawValue === 'number') {
                        displayVal = rawValue.toLocaleString('fr-DZ') + ' دج';
                      }

                      const isPinned = col.pinned;

                      return (
                        <td
                          key={col.id}
                          onClick={() => setActiveCell({ rowIndex: rIndex, colIndex: cIndex })}
                          className={`
                            excel-td py-1.5 px-3 ${col.width}
                            ${isCellActive ? 'excel-cell-active' : ''}
                            ${isPinned ? 'sticky z-10 bg-inherit' : ''}
                          `}
                          style={
                            isPinned && cIndex === 1
                              ? { insetInlineStart: '2rem' }
                              : isPinned && cIndex === 2
                              ? { insetInlineStart: '9rem' }
                              : {}
                          }
                        >
                          {col.isStatus ? (
                            <StatusBadge status={rawValue} />
                          ) : (
                            <span>{displayVal ?? '-'}</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Action Controls */}
                    <td className="excel-td py-1.5 px-2 text-center sticky end-0 z-10 bg-inherit border-l border-slate-300">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          title="معاينة السجل"
                          className="p-1 hover:bg-slate-200 text-slate-600 hover:text-blue-900"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          title="طباعة إيصال السداد"
                          className="p-1 hover:bg-slate-200 text-slate-600 hover:text-blue-900"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={visibleColumns.length + 2}
                  className="py-12 text-center text-slate-400 font-medium"
                >
                  لا توجد سجلات مطابقة لشروط البحث والتصفية المحددة.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Live Formula & Aggregation Status Ribbon (Excel Bottom Bar) */}
      <div className="excel-status-bar p-2 px-3 flex flex-wrap items-center justify-between gap-3 text-slate-700 select-none">
        {/* Active Cell Coordinates */}
        <div className="flex items-center gap-3">
          <span className="bg-white px-2 py-0.5 border border-slate-300 font-bold text-blue-900">
            الخلية: R{activeCell.rowIndex + 1}C{activeCell.colIndex + 1}
          </span>
          <span>
            السجلات: <strong className="text-slate-900">{stats.count}</strong>
            {selectedRowIds.size > 0 && ` (محدد: ${selectedRowIds.size})`}
          </span>
        </div>

        {/* Real-time Financial Calculations */}
        <div className="flex items-center gap-4 flex-wrap text-xs">
          <span>
            إجمالي المستحق (SUM Due):{' '}
            <strong className="text-slate-900 font-mono">
              {stats.sumAgreed.toLocaleString('fr-DZ')} دج
            </strong>
          </span>
          <span className="text-slate-300">|</span>
          <span>
            المبالغ المحصلة (SUM Paid):{' '}
            <strong className="text-emerald-800 font-mono">
              {stats.sumPaid.toLocaleString('fr-DZ')} دج
            </strong>
          </span>
          <span className="text-slate-300">|</span>
          <span>
            المستحقات المتأخرة (Remaining):{' '}
            <strong className="text-rose-800 font-mono">
              {stats.sumRemaining.toLocaleString('fr-DZ')} دج
            </strong>
          </span>
          <span className="text-slate-300">|</span>
          <span>
            نسبة التحصيل (Collection Rate):{' '}
            <strong className="text-blue-900 font-mono">
              {stats.collectionRate}%
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}
