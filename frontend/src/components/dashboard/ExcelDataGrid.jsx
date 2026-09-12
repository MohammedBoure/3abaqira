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
  Edit3,
  Filter,
  FileSpreadsheet,
  Trash2,
  Share2,
  X,
  CreditCard,
  UserCheck,
  Building2,
  ArrowRight,
  ExternalLink,
  Maximize2,
  Minimize2,
  Plus,
  ArrowLeftRight,
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { GlassButton } from '../common/GlassButton';
import { ContextMenu } from '../common/ContextMenu';
import { MOCK_STUDENTS_ROSTER } from '../../mock/mockData';

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

export function ExcelDataGrid({ selectedBranch = 'ALL', onSelectBranch }) {
  const [studentsList, setStudentsList] = useState(MOCK_STUDENTS_ROSTER);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  const [activeCell, setActiveCell] = useState({ rowIndex: 0, colIndex: 2 });
  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Right-Click Context Menu State
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    x: 0,
    y: 0,
    row: null,
    column: null,
    cellValue: null,
  });

  // Modal Dialogs triggered from Context Menu
  const [inspectStudent, setInspectStudent] = useState(null);
  const [editStudent, setEditStudent] = useState(null);
  const [receiptStudent, setReceiptStudent] = useState(null);

  // Column Presets
  const [visibleColIds, setVisibleColIds] = useState(
    new Set(ALL_COLUMNS.map((c) => c.id))
  );

  // Fullscreen & Focus View State
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Inline Cell Editing State: { rowId: string, colId: string, value: string } | null
  const [editingCell, setEditingCell] = useState(null);

  // Quick Payment Transaction Modal State
  const [paymentTransactionStudent, setPaymentTransactionStudent] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReceiptNumber, setPaymentReceiptNumber] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  // Add New Student Modal State
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({
    fullNameAr: '',
    fullNameFr: '',
    branchId: 'CENTER',
    program: 'الحساب الذهني (السوربان)',
    level: 'المستوى الأول',
    cohort: 'الفوج A (السبت 09:00 - 11:00)',
    coachName: 'أ. مريم بلقاسم',
    birthDate: '2016-04-12',
    gender: 'ذكر',
    guardianName: '',
    guardianPhone: '',
    agreedAmount: 18000,
    registrationFee: 2000,
    installment1: 6000,
    receipt1: 'REC-2026-0150',
    notes: 'تسجيل جديد',
  });

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
        if (paymentTransactionStudent) {
          setPaymentTransactionStudent(null);
          return;
        }
        if (isAddStudentOpen) {
          setIsAddStudentOpen(false);
          return;
        }
        if (inspectStudent) {
          setInspectStudent(null);
          return;
        }
        if (editStudent) {
          setEditStudent(null);
          return;
        }
        if (receiptStudent) {
          setReceiptStudent(null);
          return;
        }
        if (isColumnPickerOpen) {
          setIsColumnPickerOpen(false);
          return;
        }
        if (isFullscreen) {
          setIsFullscreen(false);
          showToast('تم الخروج من وضع ملء الشاشة للجدول');
          return;
        }
      }

      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'SELECT' || document.activeElement?.tagName === 'TEXTAREA') {
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
  }, [editingCell, paymentTransactionStudent, isAddStudentOpen, inspectStudent, editStudent, receiptStudent, isColumnPickerOpen, isFullscreen, filteredData.length, visibleColumns.length]);

  // Filter Data based on selectedBranch, payment status and search term
  const filteredData = useMemo(() => {
    return studentsList.filter((item) => {
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
        item.coachName?.includes(searchTerm) ||
        item.guardianName?.includes(searchTerm) ||
        item.guardianPhone?.includes(searchTerm);

      return matchesBranch && matchesStatus && matchesSearch;
    });
  }, [studentsList, selectedBranch, statusFilter, searchTerm]);

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

  // Row selection handlers
  const toggleSelectRow = (id) => {
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

  // Statistics calculation for the bottom ribbon
  const stats = useMemo(() => {
    const target = selectedRowIds.size > 0
      ? filteredData.filter((d) => selectedRowIds.has(d.id))
      : filteredData;

    const count = target.length;
    const sumAgreed = target.reduce((acc, curr) => acc + (curr.agreedAmount || 0), 0);
    const sumPaid = target.reduce((acc, curr) => acc + (curr.totalPaid || 0), 0);
    const sumRemaining = target.reduce((acc, curr) => acc + (curr.remainingBalance || 0), 0);
    const collectionRate = sumAgreed > 0 ? Math.round((sumPaid / sumAgreed) * 100) : 0;

    return { count, sumAgreed, sumPaid, sumRemaining, collectionRate };
  }, [filteredData, selectedRowIds]);

  // Export CSV
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
    link.setAttribute('download', `3abaqira_export_${selectedBranch}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('تم تصدير ملف CSV بنجاح');
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
      showToast('تم نسخ بيانات الجدول بالكامل بتنسيق Excel/TSV');
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  // Right-Click Context Menu Trigger
  const handleContextMenu = (e, row, column, cellValue) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      row,
      column,
      cellValue,
    });
  };

  // Context Menu Actions
  const handleCopyCellValue = () => {
    if (contextMenu.cellValue !== undefined && contextMenu.cellValue !== null) {
      navigator.clipboard.writeText(String(contextMenu.cellValue));
      showToast(`تم نسخ القيمة: "${contextMenu.cellValue}"`);
    }
  };

  const handleCopyRowTSV = () => {
    if (contextMenu.row) {
      const rowTSV = visibleColumns.map((col) => contextMenu.row[col.id] ?? '').join('\t');
      navigator.clipboard.writeText(rowTSV);
      showToast(`تم نسخ سطر الطالب [${contextMenu.row.fullNameAr}] كـ TSV`);
    }
  };

  const handleCopyRowJSON = () => {
    if (contextMenu.row) {
      navigator.clipboard.writeText(JSON.stringify(contextMenu.row, null, 2));
      showToast(`تم نسخ بيانات السجل كـ JSON`);
    }
  };

  const handleQuickFilterByValue = () => {
    if (contextMenu.cellValue) {
      setSearchTerm(String(contextMenu.cellValue));
      showToast(`تمت التصفية حسب: "${contextMenu.cellValue}"`);
    }
  };

  const handleDeleteRow = () => {
    if (contextMenu.row) {
      const targetId = contextMenu.row.id;
      setStudentsList((prev) => prev.filter((s) => s.id !== targetId));
      showToast(`تم حذف / أرشفة سجل الطالب: ${contextMenu.row.fullNameAr}`);
    }
  };

  const handleSaveEditStudent = (e) => {
    e.preventDefault();
    if (!editStudent) return;
    setStudentsList((prev) =>
      prev.map((item) => (item.id === editStudent.id ? editStudent : item))
    );
    showToast(`تم تحديث بيانات الطالب: ${editStudent.fullNameAr}`);
    setEditStudent(null);
  };

  // Inline Cell Editing commit handler
  const handleSaveInlineCell = (rowId, colId, newValue) => {
    setStudentsList((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;

        const updated = { ...row };
        const colDef = ALL_COLUMNS.find((c) => c.id === colId);

        if (colDef?.isCurrency) {
          const num = parseFloat(newValue) || 0;
          updated[colId] = num;

          // Recompute totalPaid and remaining if installments changed
          if (['installment1', 'installment2', 'installment3', 'installment4', 'registrationFee'].includes(colId)) {
            const paid = (updated.installment1 || 0) + (updated.installment2 || 0) + (updated.installment3 || 0) + (updated.installment4 || 0);
            updated.totalPaid = paid;
            updated.remainingBalance = Math.max(0, (updated.agreedAmount || 0) - paid);
            updated.paymentStatus = updated.remainingBalance === 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'OVERDUE';
          } else if (colId === 'agreedAmount') {
            updated.remainingBalance = Math.max(0, num - (updated.totalPaid || 0));
            updated.paymentStatus = updated.remainingBalance === 0 ? 'PAID' : (updated.totalPaid || 0) > 0 ? 'PARTIAL' : 'OVERDUE';
          } else if (colId === 'totalPaid') {
            updated.remainingBalance = Math.max(0, (updated.agreedAmount || 0) - num);
            updated.paymentStatus = updated.remainingBalance === 0 ? 'PAID' : num > 0 ? 'PARTIAL' : 'OVERDUE';
          }
        } else {
          updated[colId] = newValue;
        }

        return updated;
      })
    );
    setEditingCell(null);
    showToast('تم حفظ التعديل في الخلية مباشرة');
  };

  // Quick Payment Transaction Submit
  const handleSavePaymentTransaction = (e) => {
    e.preventDefault();
    if (!paymentTransactionStudent) return;

    const amount = parseFloat(paymentAmount) || 0;
    if (amount <= 0) {
      showToast('يرجى إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }

    const studentId = paymentTransactionStudent.id;
    const rcCode = paymentReceiptNumber.trim() || `REC-${Date.now().toString().slice(-6)}`;

    setStudentsList((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;

        const nextPaid = (s.totalPaid || 0) + amount;
        const nextRemaining = Math.max(0, (s.agreedAmount || 0) - nextPaid);
        const nextStatus = nextRemaining === 0 ? 'PAID' : 'PARTIAL';

        // Assign to first empty installment slot
        let inst1 = s.installment1;
        let rc1 = s.receipt1;
        let inst2 = s.installment2;
        let rc2 = s.receipt2;
        let inst3 = s.installment3;
        let rc3 = s.receipt3;
        let inst4 = s.installment4;
        let rc4 = s.receipt4;

        if (!inst1 || inst1 === 0) {
          inst1 = amount;
          rc1 = rcCode;
        } else if (!inst2 || inst2 === 0) {
          inst2 = amount;
          rc2 = rcCode;
        } else if (!inst3 || inst3 === 0) {
          inst3 = amount;
          rc3 = rcCode;
        } else {
          inst4 = (inst4 || 0) + amount;
          rc4 = rcCode;
        }

        return {
          ...s,
          installment1: inst1,
          receipt1: rc1,
          installment2: inst2,
          receipt2: rc2,
          installment3: inst3,
          receipt3: rc3,
          installment4: inst4,
          receipt4: rc4,
          totalPaid: nextPaid,
          remainingBalance: nextRemaining,
          paymentStatus: nextStatus,
          notes: paymentNote ? `${s.notes || ''} | ${paymentNote}`.trim() : s.notes,
        };
      })
    );

    showToast(`تم تسجيل دفعة بقيمة ${amount.toLocaleString()} دج للطالب: ${paymentTransactionStudent.fullNameAr}`);
    setPaymentTransactionStudent(null);
    setPaymentAmount('');
    setPaymentReceiptNumber('');
    setPaymentNote('');
  };

  // Add New Student To Grid
  const handleAddNewStudent = (e) => {
    e.preventDefault();
    if (!newStudentForm.fullNameAr.trim()) {
      showToast('يرجى كتابة اسم التلميذ بالعربية');
      return;
    }

    const nextSeq = studentsList.length + 1;
    const newCode = `STD-${newStudentForm.branchId === 'RAWDA' ? 'RWD' : 'CTR'}-2026-${String(nextSeq).padStart(4, '0')}`;
    const paid = Number(newStudentForm.installment1) || 0;
    const agreed = Number(newStudentForm.agreedAmount) || 0;
    const remaining = Math.max(0, agreed - paid);

    const newStudent = {
      id: `std-custom-${Date.now()}`,
      seqNumber: nextSeq,
      studentCode: newCode,
      fullNameAr: newStudentForm.fullNameAr,
      fullNameFr: newStudentForm.fullNameFr || 'Eleve Nouveau',
      branchId: newStudentForm.branchId,
      branchNameAr: newStudentForm.branchId === 'RAWDA' ? 'روضة وحضانة العباقرة' : 'المركز الأكاديمي الرئيسي',
      program: newStudentForm.program,
      level: newStudentForm.level,
      cohort: newStudentForm.cohort,
      coachName: newStudentForm.coachName,
      birthDate: newStudentForm.birthDate,
      gender: newStudentForm.gender,
      guardianName: newStudentForm.guardianName || 'ولي الأمر',
      guardianPhone: newStudentForm.guardianPhone || '0550000000',
      agreedAmount: agreed,
      registrationFee: Number(newStudentForm.registrationFee) || 0,
      installment1: paid,
      receipt1: newStudentForm.receipt1 || `REC-2026-${String(nextSeq).padStart(4, '0')}`,
      installment2: 0,
      receipt2: '-',
      installment3: 0,
      receipt3: '-',
      installment4: 0,
      receipt4: '-',
      totalPaid: paid,
      remainingBalance: remaining,
      paymentStatus: remaining === 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'OVERDUE',
      enrollmentDate: new Date().toISOString().split('T')[0],
      notes: newStudentForm.notes,
    };

    setStudentsList((prev) => [newStudent, ...prev]);
    showToast(`تم قيد التلميذ بنجاح: ${newStudent.fullNameAr}`);
    setIsAddStudentOpen(false);
    setNewStudentForm({
      fullNameAr: '',
      fullNameFr: '',
      branchId: 'CENTER',
      program: 'الحساب الذهني (السوربان)',
      level: 'المستوى الأول',
      cohort: 'الفوج A (السبت 09:00 - 11:00)',
      coachName: 'أ. مريم بلقاسم',
      birthDate: '2016-04-12',
      gender: 'ذكر',
      guardianName: '',
      guardianPhone: '',
      agreedAmount: 18000,
      registrationFee: 2000,
      installment1: 6000,
      receipt1: `REC-2026-${String(nextSeq + 1).padStart(4, '0')}`,
      notes: 'تسجيل جديد',
    });
  };

  // Build Context Menu Items
  const contextMenuItems = useMemo(() => {
    if (!contextMenu.row) {
      return [
        {
          label: 'تصدير الجدول بالكامل كـ CSV',
          icon: Download,
          onClick: exportToCSV,
        },
        {
          label: 'نسخ الجدول بالكامل (Excel/TSV)',
          icon: Copy,
          onClick: copyToClipboard,
        },
      ];
    }

    const r = contextMenu.row;
    const col = contextMenu.column;

    return [
      { type: 'header', label: 'النسخ والبيانات' },
      {
        label: `نسخ محتوى الخلية (${col?.labelAr || 'الخلية'})`,
        icon: Copy,
        onClick: handleCopyCellValue,
        shortcut: 'Ctrl+C',
      },
      {
        label: 'نسخ السطر بالكامل (Excel / TSV)',
        icon: FileSpreadsheet,
        onClick: handleCopyRowTSV,
      },
      {
        label: 'نسخ بيانات السجل كـ JSON',
        icon: Share2,
        onClick: handleCopyRowJSON,
      },
      { type: 'divider' },
      { type: 'header', label: 'إجراءات السجل' },
      {
        label: 'معاينة بطاقة الطالب والتفاصيل',
        icon: Eye,
        onClick: () => setInspectStudent(r),
      },
      {
        label: 'تسجيل دفعة / قبض مالي فوري',
        icon: CreditCard,
        onClick: () => {
          setPaymentTransactionStudent(r);
          setPaymentAmount(r.remainingBalance > 0 ? String(r.remainingBalance) : '5000');
          setPaymentReceiptNumber(`REC-2026-${String(Date.now()).slice(-5)}`);
        },
      },
      {
        label: 'تعديل السجل سريعاً',
        icon: Edit3,
        onClick: () => setEditStudent(r),
      },
      {
        label: selectedRowIds.has(r.id) ? 'إلغاء تحديد هذا السطر' : 'تحديد هذا السطر',
        icon: CheckSquare,
        onClick: () => toggleSelectRow(r.id),
      },
      {
        label: `تصفية الجدول حسب (${contextMenu.cellValue || r.fullNameAr})`,
        icon: Filter,
        onClick: handleQuickFilterByValue,
      },
      { type: 'divider' },
      { type: 'header', label: 'المعاملات والإيصالات' },
      {
        label: 'طباعة إيصال السداد المعتمد',
        icon: Printer,
        onClick: () => setReceiptStudent(r),
      },
      { type: 'divider' },
      {
        label: 'حذف أو أرشفة السجل',
        icon: Trash2,
        danger: true,
        onClick: handleDeleteRow,
      },
    ];
  }, [contextMenu, selectedRowIds]);

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 bg-white flex flex-col h-screen w-screen font-arabic select-text overflow-hidden'
          : 'w-full bg-white border border-slate-300 shadow-xs flex flex-col font-arabic relative'
      }
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 end-4 z-50 bg-slate-900 text-white px-3 py-2 text-xs rounded shadow-lg border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Fullscreen Dedicated Header Bar */}
      {isFullscreen && (
        <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-800 shadow-md">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white font-mono text-xs px-2 py-0.5 rounded font-bold">
              وضع ملء الشاشة المتكامل
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">جدول بيانات الطلاب والمعاملات المالية الموسع</span>
              <span className="text-xs text-slate-400 font-mono">
                ({filteredData.length} تلميذ مقيد • {stats.sumAgreed.toLocaleString('fr-DZ')} دج مستحقات)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddStudentOpen(true)}
              className="h-7 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>تسجيل قيد جديد</span>
            </button>

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
        </div>
      )}

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
                        className="rounded-none border-slate-300 text-blue-900 focus:ring-0"
                      />
                      <span>{col.labelAr}</span>
                      <span className="text-[10px] text-slate-400 ms-auto font-latin">{col.labelEn}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Technical Export & Operational Actions */}
        <div className="flex items-center gap-1.5">
          {/* Quick Add Record Button */}
          <button
            onClick={() => setIsAddStudentOpen(true)}
            className="h-7 px-2.5 flex items-center gap-1.5 text-xs bg-blue-900 hover:bg-blue-800 text-white font-medium shadow-xs"
            title="إضافة تسجيل طالب جديد"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>تسجيل قيد جديد</span>
          </button>

          {/* Fullscreen / Focus Mode Toggle Button */}
          <button
            onClick={() => {
              const next = !isFullscreen;
              setIsFullscreen(next);
              showToast(next ? 'تم تفعيل وضع ملء الشاشة الموسع للجدول' : 'تم الخروج من وضع ملء الشاشة');
            }}
            className={`h-7 px-2.5 flex items-center gap-1.5 text-xs transition-colors ${
              isFullscreen
                ? 'bg-blue-700 text-white border border-blue-800'
                : 'sharp-btn-secondary text-slate-700'
            }`}
            title={isFullscreen ? 'تصغير الشاشة (Esc)' : 'تكبير وتوسيع الجدول بملء الشاشة'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-white" />
                <span>تصغير</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
                <span>توسيع الجدول</span>
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
        </div>
      </div>

      {/* 2. Primary Excel Spreadsheet Table View - Comfortable Density & Soft Borders */}
      <div
        ref={tableContainerRef}
        className={`w-full overflow-x-auto overflow-y-auto ${
          isFullscreen ? 'flex-1 border-b border-slate-200/90 relative select-text' : 'max-h-[calc(100vh-230px)] border-b border-slate-200/90 relative select-text'
        }`}
      >
        <table className="excel-table text-xs border-collapse w-full">
          {/* Sticky Header Row */}
          <thead className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-xs shadow-xs border-b border-slate-200/90">
            <tr>
              {/* Select All Checkbox */}
              <th className="excel-th w-10 text-center sticky start-0 z-30 bg-slate-100/95 border-e border-slate-200 py-2.5 sm:py-3 px-2">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center justify-center w-full"
                >
                  {selectedRowIds.size === filteredData.length && filteredData.length > 0 ? (
                    <CheckSquare className="w-3.5 h-3.5 text-blue-900" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
              </th>

              {/* Dynamic Visible Columns */}
              {visibleColumns.map((col, cIndex) => {
                const isPinned = col.pinned;
                return (
                  <th
                    key={col.id}
                    onContextMenu={(e) => handleContextMenu(e, null, col, col.labelAr)}
                    className={`excel-th py-2.5 sm:py-3 px-3 ${col.width} ${
                      isPinned ? 'sticky z-20 bg-slate-100/95 border-e border-slate-200' : ''
                    }`}
                    style={
                      isPinned && cIndex === 1
                        ? { insetInlineStart: '2.5rem' }
                        : isPinned && cIndex === 2
                        ? { insetInlineStart: '9.5rem' }
                        : {}
                    }
                  >
                    <div className="flex flex-col text-start leading-tight">
                      <span className="font-semibold text-slate-800 text-xs">{col.labelAr}</span>
                      <span className="text-[9px] text-slate-400 font-latin font-normal">
                        {col.labelEn}
                      </span>
                    </div>
                  </th>
                );
              })}

              {/* Action Column */}
              <th className="excel-th w-28 text-center sticky end-0 z-20 bg-slate-100/95 border-s border-slate-200 py-2.5 sm:py-3 px-2">
                إجراءات ومعاملات
              </th>
            </tr>
          </thead>

          {/* Table Body with Comfortable Dense Padding & Soft Separators */}
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((row, rIndex) => {
                const isSelected = selectedRowIds.has(row.id);
                return (
                  <tr
                    key={row.id}
                    onContextMenu={(e) => handleContextMenu(e, row, visibleColumns[0], row.fullNameAr)}
                    className={`
                      ${isSelected ? 'bg-blue-100/60' : rIndex % 2 === 0 ? 'bg-white' : 'even:bg-slate-50/40'}
                      hover:bg-blue-50/70 transition-colors
                    `}
                  >
                    {/* Row Selector Checkbox */}
                    <td className="excel-td text-center sticky start-0 z-20 bg-inherit border-e border-slate-200/80 py-2.5 sm:py-3 px-2">
                      <button
                        onClick={() => toggleSelectRow(row.id)}
                        className="flex items-center justify-center w-full"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-3.5 h-3.5 text-blue-900" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500" />
                        )}
                      </button>
                    </td>

                    {/* Column Cells with Inline Editing & Double Click Support */}
                    {visibleColumns.map((col, cIndex) => {
                      const isPinned = col.pinned;
                      const rawValue = row[col.id];
                      let displayVal = rawValue;

                      if (col.isCurrency && typeof rawValue === 'number') {
                        displayVal = rawValue.toLocaleString('fr-DZ');
                      }

                      const isCurrentCell =
                        activeCell.rowIndex === rIndex && activeCell.colIndex === cIndex;
                      const isEditingThisCell =
                        editingCell && editingCell.rowId === row.id && editingCell.colId === col.id;

                      // Check if column is editable directly
                      const isEditable = !['seqNumber', 'studentCode'].includes(col.id);

                      return (
                        <td
                          key={col.id}
                          onClick={() => setActiveCell({ rowIndex: rIndex, colIndex: cIndex })}
                          onDoubleClick={() => {
                            if (isEditable) {
                              setEditingCell({
                                rowId: row.id,
                                colId: col.id,
                                value: rawValue !== undefined && rawValue !== null ? String(rawValue) : '',
                              });
                            }
                          }}
                          onContextMenu={(e) => handleContextMenu(e, row, col, rawValue)}
                          title={isEditable ? 'انقر مرتين للتعديل المباشر' : undefined}
                          className={`
                            excel-td py-2.5 sm:py-3 px-3 ${col.width}
                            ${isPinned ? 'sticky z-10 bg-inherit border-e border-slate-200/80' : ''}
                            ${isCurrentCell ? 'excel-cell-active' : ''}
                            ${isEditable ? 'cursor-cell' : ''}
                          `}
                          style={
                            isPinned && cIndex === 1
                              ? { insetInlineStart: '2.5rem' }
                              : isPinned && cIndex === 2
                              ? { insetInlineStart: '9.5rem' }
                              : {}
                          }
                        >
                          {isEditingThisCell ? (
                            <input
                              type={col.isCurrency ? 'number' : 'text'}
                              autoFocus
                              value={editingCell.value}
                              onChange={(e) =>
                                setEditingCell({ ...editingCell, value: e.target.value })
                              }
                              onBlur={() =>
                                handleSaveInlineCell(row.id, col.id, editingCell.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveInlineCell(row.id, col.id, editingCell.value);
                                } else if (e.key === 'Escape') {
                                  e.stopPropagation();
                                  setEditingCell(null);
                                }
                              }}
                              className="w-full h-7 px-1.5 py-0.5 text-xs border border-blue-600 bg-white font-mono shadow-inner outline-none"
                            />
                          ) : col.id === 'fullNameAr' ? (
                            <div className="flex flex-col text-start leading-tight">
                              <span className="text-sm font-semibold text-slate-900 leading-snug">
                                {row.fullNameAr}
                              </span>
                              <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                                {row.studentCode}
                              </span>
                            </div>
                          ) : col.isStatus ? (
                            <StatusBadge status={rawValue} />
                          ) : (
                            <span className={col.isCurrency ? 'font-mono font-bold text-slate-900 tabular-nums' : 'text-xs text-slate-800'}>
                              {displayVal ?? '-'}
                            </span>
                          )}
                        </td>
                      );
                    })}

                    {/* Action Controls & Direct Transactions */}
                    <td className="excel-td py-2 px-1.5 text-center sticky end-0 z-10 bg-inherit border-s border-slate-200/80">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setPaymentTransactionStudent(row);
                            setPaymentAmount(row.remainingBalance > 0 ? String(row.remainingBalance) : '5000');
                            setPaymentReceiptNumber(`REC-2026-${String(Date.now()).slice(-5)}`);
                          }}
                          title="تسجيل دفعة / قبض مالي سريع"
                          className="p-1 hover:bg-blue-100 text-blue-800 rounded flex items-center gap-0.5 text-[11px] font-medium"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-blue-700" />
                        </button>
                        <button
                          onClick={() => setInspectStudent(row)}
                          title="معاينة بطاقة الطالب"
                          className="p-1 hover:bg-slate-200 text-slate-600 hover:text-blue-900 rounded"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setReceiptStudent(row)}
                          title="طباعة إيصال السداد"
                          className="p-1 hover:bg-slate-200 text-slate-600 hover:text-blue-900 rounded"
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
                  لا توجد سجلات مطابقة لنطاق المقر المحدد ({selectedBranch === 'CENTER' ? 'المركز الأكاديمي' : selectedBranch === 'RAWDA' ? 'الروضة' : 'كافة الفروع'}) أو شروط البحث والتصفية.
                </td>
              </tr>
            )}
          </tbody>

          {/* Sticky Table Footer: Live Aggregations & Financial Totals */}
          <tfoot className="sticky bottom-0 z-30 bg-slate-100/95 backdrop-blur-xs border-t-2 border-slate-300 text-xs font-semibold shadow-xs select-none">
            <tr>
              {/* Checkbox Column Count */}
              <td className="excel-td py-2 px-2 text-center sticky start-0 z-30 bg-slate-100 border-e border-slate-200 font-mono text-[11px] text-slate-600 tabular-nums">
                {filteredData.length}
              </td>

              {/* Column-by-column totals matching column alignments */}
              {visibleColumns.map((col, cIndex) => {
                const isPinned = col.pinned;
                let cellTotal = null;

                if (col.id === 'fullNameAr') {
                  cellTotal = (
                    <span className="font-bold text-slate-900 text-xs">
                      المجموع ({stats.count} طالب)
                    </span>
                  );
                } else if (col.id === 'agreedFee') {
                  cellTotal = (
                    <span className="font-bold font-mono text-slate-900 tabular-nums">
                      {stats.sumAgreed.toLocaleString('fr-DZ')} دج
                    </span>
                  );
                } else if (col.id === 'totalPaid') {
                  cellTotal = (
                    <span className="font-bold font-mono text-emerald-800 tabular-nums">
                      {stats.sumPaid.toLocaleString('fr-DZ')} دج
                    </span>
                  );
                } else if (col.id === 'remainingBalance') {
                  cellTotal = (
                    <span className="font-bold font-mono text-rose-800 tabular-nums">
                      {stats.sumRemaining.toLocaleString('fr-DZ')} دج
                    </span>
                  );
                } else if (col.id === 'paymentStatus') {
                  cellTotal = (
                    <span className="text-[11px] font-mono font-bold text-blue-900 tabular-nums">
                      تحصيل: {stats.collectionRate}%
                    </span>
                  );
                }

                return (
                  <td
                    key={`foot-${col.id}`}
                    className={`
                      excel-td py-2 px-3 text-xs ${col.width}
                      ${isPinned ? 'sticky z-20 bg-slate-100 border-e border-slate-200' : ''}
                    `}
                    style={
                      isPinned && cIndex === 1
                        ? { insetInlineStart: '2.5rem' }
                        : isPinned && cIndex === 2
                        ? { insetInlineStart: '9.5rem' }
                        : {}
                    }
                  >
                    {cellTotal}
                  </td>
                );
              })}

              {/* Action Column Footer */}
              <td className="excel-td py-2 px-2 text-center sticky end-0 z-20 bg-slate-100 border-s border-slate-200">
                -
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 3. Excel Workbook Sheet Tabs Bar (Just like Microsoft Excel) */}
      <div className="border-t border-slate-200/90 bg-slate-100/90 flex items-center justify-between px-2.5 py-1 select-none overflow-x-auto">
        <div className="flex items-center">
          <span className="text-[10px] text-slate-500 font-bold px-2 py-1 font-mono uppercase">
            WORKBOOK SHEETS:
          </span>

          <button
            onClick={() => onSelectBranch?.('ALL')}
            className={`px-3 py-1 text-xs font-semibold flex items-center gap-1.5 border-e border-slate-200 transition-colors ${
              selectedBranch === 'ALL'
                ? 'bg-white text-blue-950 border-t-2 border-t-blue-900 shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-3 h-3 text-blue-900" />
            <span>all_students.xlsx (كافة الفروع)</span>
          </button>

          <button
            onClick={() => onSelectBranch?.('CENTER')}
            className={`px-3 py-1 text-xs font-semibold flex items-center gap-1.5 border-e border-slate-200 transition-colors ${
              selectedBranch === 'CENTER'
                ? 'bg-white text-blue-950 border-t-2 border-t-blue-900 shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3 h-3 text-blue-800" />
            <span>center.xlsx (المركز الأكاديمي)</span>
          </button>

          <button
            onClick={() => onSelectBranch?.('RAWDA')}
            className={`px-3 py-1 text-xs font-semibold flex items-center gap-1.5 border-e border-slate-200 transition-colors ${
              selectedBranch === 'RAWDA'
                ? 'bg-white text-blue-950 border-t-2 border-t-blue-900 shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3 h-3 text-blue-800" />
            <span>rawda.xlsx (الروضة والحضانة)</span>
          </button>
        </div>

        {/* Active Cell Coordinates & Quick Tip */}
        <div className="flex items-center gap-2.5 text-xs text-slate-500 font-mono hidden md:flex">
          <span className="bg-white px-2 py-0.5 border border-slate-200 text-blue-900 font-bold tabular-nums shadow-2xs">
            الخلية: R{activeCell.rowIndex + 1}C{activeCell.colIndex + 1}
          </span>
          <span className="text-[11px] text-slate-500">
            انقر بالزر الأيمن للقائمة التفاعلية
          </span>
        </div>
      </div>

      {/* 5. Rich Right-Click Interactive Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={{ x: contextMenu.x, y: contextMenu.y }}
        onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
        title={contextMenu.row ? `[${contextMenu.row.studentCode}] ${contextMenu.row.fullNameAr}` : 'جدول بيانات الطلاب'}
        subtitle={contextMenu.column ? `${contextMenu.column.labelAr}: ${contextMenu.cellValue ?? '-'}` : 'إجراءات السجل'}
        items={contextMenuItems}
      />

      {/* 6. Modal: Inspect Student Profile Details */}
      {inspectStudent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-400 w-full max-w-xl shadow-2xl rounded p-5 font-arabic">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-blue-900 text-white flex items-center justify-center font-bold text-xs">
                  {inspectStudent.seqNumber}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {inspectStudent.fullNameAr} ({inspectStudent.fullNameFr})
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500">
                    كود الطالب: {inspectStudent.studentCode} • المقر: {inspectStudent.branchNameAr}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectStudent(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs">
              {/* Academic Details Card */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="font-bold text-blue-950 mb-2 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-800" />
                  <span>البيانات البيداغوجية والأكاديمية</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-700">
                  <div>البرنامج: <strong className="text-slate-900">{inspectStudent.program}</strong></div>
                  <div>المستوى: <strong className="text-slate-900">{inspectStudent.level}</strong></div>
                  <div>الفوج: <strong className="text-slate-900">{inspectStudent.cohort}</strong></div>
                  <div>المؤطر: <strong className="text-slate-900">{inspectStudent.coachName}</strong></div>
                  <div>تاريخ القيد: <strong className="font-mono text-slate-900">{inspectStudent.enrollmentDate}</strong></div>
                  <div>الجنس: <strong className="text-slate-900">{inspectStudent.gender}</strong></div>
                </div>
              </div>

              {/* Guardian & Contact */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="font-bold text-blue-950 mb-2 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-800" />
                  <span>بيانات ولي الأمر والاتصال</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>ولي الأمر: <strong className="text-slate-900">{inspectStudent.guardianName}</strong></div>
                  <div>الهاتف: <strong className="font-mono text-blue-900">{inspectStudent.guardianPhone}</strong></div>
                  <div className="col-span-2">الملاحظات: <span className="text-slate-600">{inspectStudent.notes}</span></div>
                </div>
              </div>

              {/* Financial Status & Installments */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="font-bold text-blue-950 mb-2 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-800" />
                  <span>المستحقات المالية وجدول الدفعات</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div className="p-2 bg-white border border-slate-200 rounded text-center">
                    <span className="text-slate-500 block text-[10px]">المبلغ المتفق عليه</span>
                    <strong className="text-slate-900 font-mono text-sm">{inspectStudent.agreedAmount?.toLocaleString()} دج</strong>
                  </div>
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-center">
                    <span className="text-emerald-700 block text-[10px]">المبلغ المسدد</span>
                    <strong className="text-emerald-800 font-mono text-sm">{inspectStudent.totalPaid?.toLocaleString()} دج</strong>
                  </div>
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded text-center">
                    <span className="text-rose-700 block text-[10px]">المبلغ المتبقي</span>
                    <strong className="text-rose-800 font-mono text-sm">{inspectStudent.remainingBalance?.toLocaleString()} دج</strong>
                  </div>
                </div>

                <div className="border border-slate-200 rounded bg-white overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <th className="p-1.5 text-right">الدفعة</th>
                        <th className="p-1.5 text-right">المبلغ</th>
                        <th className="p-1.5 text-right">رقم الوصل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-1.5">الدفعة 1</td>
                        <td className="p-1.5 font-mono">{inspectStudent.installment1?.toLocaleString()} دج</td>
                        <td className="p-1.5 font-mono text-blue-900">{inspectStudent.receipt1}</td>
                      </tr>
                      {inspectStudent.installment2 > 0 && (
                        <tr>
                          <td className="p-1.5">الدفعة 2</td>
                          <td className="p-1.5 font-mono">{inspectStudent.installment2?.toLocaleString()} دج</td>
                          <td className="p-1.5 font-mono text-blue-900">{inspectStudent.receipt2}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => {
                  setInspectStudent(null);
                  setReceiptStudent(inspectStudent);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs rounded flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة الوصل</span>
              </button>
              <button
                onClick={() => setInspectStudent(null)}
                className="px-3 py-1.5 bg-blue-900 text-white text-xs rounded hover:bg-blue-800"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal: Quick Edit Student Record */}
      {editStudent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-300 w-full max-w-md shadow-2xl rounded p-4 font-arabic">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-1.5 text-blue-950 font-bold text-sm">
                <Edit3 className="w-4 h-4 text-blue-800" />
                <span>تعديل سجل الطالب: {editStudent.studentCode}</span>
              </div>
              <button
                onClick={() => setEditStudent(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditStudent} className="space-y-3 mt-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">الاسم واللقب (عربي)</label>
                <input
                  type="text"
                  required
                  value={editStudent.fullNameAr}
                  onChange={(e) => setEditStudent({ ...editStudent, fullNameAr: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">هاتف ولي الأمر</label>
                  <input
                    type="tel"
                    value={editStudent.guardianPhone}
                    onChange={(e) => setEditStudent({ ...editStudent, guardianPhone: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">حالة السداد</label>
                  <select
                    value={editStudent.paymentStatus}
                    onChange={(e) => setEditStudent({ ...editStudent, paymentStatus: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none"
                  >
                    <option value="PAID">مسدد بالكامل (PAID)</option>
                    <option value="PARTIAL">تسديد جزئي (PARTIAL)</option>
                    <option value="OVERDUE">متأخر (OVERDUE)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">المستحق المتفق عليه (دج)</label>
                  <input
                    type="number"
                    value={editStudent.agreedAmount}
                    onChange={(e) => {
                      const agreed = parseFloat(e.target.value) || 0;
                      const remaining = Math.max(0, agreed - editStudent.totalPaid);
                      setEditStudent({
                        ...editStudent,
                        agreedAmount: agreed,
                        remainingBalance: remaining,
                      });
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">المحصل الفعلي (دج)</label>
                  <input
                    type="number"
                    value={editStudent.totalPaid}
                    onChange={(e) => {
                      const paid = parseFloat(e.target.value) || 0;
                      const remaining = Math.max(0, editStudent.agreedAmount - paid);
                      setEditStudent({
                        ...editStudent,
                        totalPaid: paid,
                        remainingBalance: remaining,
                        paymentStatus: remaining === 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'OVERDUE',
                      });
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">ملاحظات إدارية</label>
                <textarea
                  rows="2"
                  value={editStudent.notes || ''}
                  onChange={(e) => setEditStudent({ ...editStudent, notes: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditStudent(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded font-medium shadow-xs"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Modal: Printable Receipt Voucher */}
      {receiptStudent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-400 w-full max-w-md shadow-2xl rounded p-5 font-arabic">
            <div className="flex items-center justify-between border-b border-slate-300 pb-3">
              <div>
                <h3 className="font-serif font-bold text-slate-900 text-sm">أكاديمية وروضة الأطفال العباقرة</h3>
                <p className="text-[10px] text-slate-500 font-mono">OFFICIAL PAYMENT RECEIPT VOUCHER</p>
              </div>
              <button
                onClick={() => setReceiptStudent(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 p-3 bg-slate-50 border border-dashed border-slate-300 rounded space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>رقم الوصل:</span>
                <span className="font-mono font-bold text-blue-950">{receiptStudent.receipt1 || 'REC-2026-0001'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>اسم التلميذ:</span>
                <span className="font-bold text-slate-900">{receiptStudent.fullNameAr}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>رمز القيد:</span>
                <span className="font-mono text-slate-900">{receiptStudent.studentCode}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>المقر والبرنامج:</span>
                <span className="text-slate-900">{receiptStudent.branchNameAr} • {receiptStudent.program}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                <span className="font-bold text-slate-900">المبلغ المسدد نقداً:</span>
                <span className="text-sm font-mono font-bold text-emerald-700">
                  {receiptStudent.totalPaid?.toLocaleString()} دج
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-500 text-[11px]">
                <span>المتبقي:</span>
                <span className="font-mono text-rose-700 font-bold">{receiptStudent.remainingBalance?.toLocaleString()} دج</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200 pt-3">
              <span>خاتم وتوقيع أمين الصندوق المعتمد</span>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-blue-900 text-white rounded flex items-center gap-1 font-medium hover:bg-blue-800"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة الوصل الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Interactive Right-Click Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={{ x: contextMenu.x, y: contextMenu.y }}
        onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
        title={contextMenu.row ? contextMenu.row.fullNameAr : 'جدول الطلاب والمنتسبين'}
        subtitle={
          contextMenu.row
            ? `${contextMenu.row.studentCode} • ${contextMenu.row.branchNameAr}`
            : 'Excel Data Grid Actions'
        }
        items={contextMenuItems}
      />

      {/* 10. Modal: Quick Financial Payment Transaction ("تسجيل دفعة / قبض مالي") */}
      {paymentTransactionStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-400 w-full max-w-lg shadow-2xl rounded p-5 font-arabic">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    تسجيل دفعة وقبض مالي فوري
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {paymentTransactionStudent.fullNameAr} ({paymentTransactionStudent.studentCode})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPaymentTransactionStudent(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Financial Overview Summary */}
            <div className="grid grid-cols-3 gap-2 my-3 p-3 bg-slate-50 border border-slate-200 rounded text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">إجمالي المستحق</span>
                <strong className="text-slate-900 font-mono">
                  {paymentTransactionStudent.agreedAmount?.toLocaleString('fr-DZ')} دج
                </strong>
              </div>
              <div>
                <span className="text-emerald-700 block text-[10px]">المسدد حتى الآن</span>
                <strong className="text-emerald-800 font-mono">
                  {paymentTransactionStudent.totalPaid?.toLocaleString('fr-DZ')} دج
                </strong>
              </div>
              <div>
                <span className="text-rose-700 block text-[10px]">المبلغ المتبقي</span>
                <strong className="text-rose-800 font-mono">
                  {paymentTransactionStudent.remainingBalance?.toLocaleString('fr-DZ')} دج
                </strong>
              </div>
            </div>

            <form onSubmit={handleSavePaymentTransaction} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    المبلغ المقبوض نقدًا (دج) *
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    autoFocus
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="مثال: 6000"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold text-slate-900 focus:border-blue-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    رقم وصل القبض المالي *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentReceiptNumber}
                    onChange={(e) => setPaymentReceiptNumber(e.target.value)}
                    placeholder="REC-2026-XXXX"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono focus:border-blue-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ملاحظة أو بيان الدفعة
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="مثال: قسط الفصل الثاني نقداً مع الولي"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPaymentTransactionStudent(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-medium shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>تأكيد وتسجيل القبض</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 11. Modal: Add New Student Record ("تسجيل قيد جديد") */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-400 w-full max-w-2xl shadow-2xl rounded p-5 font-arabic max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-900 text-white rounded">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    إضافة قيد تلميذ جديد للجدول مباشرة
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    تسجيل أكاديمي ومالي مع التحديث الفوري لإجماليات الجدول
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddStudentOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewStudent} className="space-y-3 mt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    الاسم واللقب (عربي) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newStudentForm.fullNameAr}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, fullNameAr: e.target.value })}
                    placeholder="مثال: يوسف عبد الرحمان بن علي"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Nom et Prénom (الاسم بالفرنسية)
                  </label>
                  <input
                    type="text"
                    value={newStudentForm.fullNameFr}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, fullNameFr: e.target.value })}
                    placeholder="Ex: Benali Youcef"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none font-latin"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    المقر / الفرع *
                  </label>
                  <select
                    value={newStudentForm.branchId}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, branchId: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none"
                  >
                    <option value="CENTER">المركز الأكاديمي الرئيسي</option>
                    <option value="RAWDA">روضة وحضانة العباقرة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    البرنامج التعليمي *
                  </label>
                  <select
                    value={newStudentForm.program}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, program: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none"
                  >
                    <option value="الحساب الذهني (السوربان)">الحساب الذهني (السوربان)</option>
                    <option value="رعاية الطفولة المبكرة">رعاية الطفولة المبكرة</option>
                    <option value="تحفيظ القرآن الكريم">تحفيظ القرآن الكريم</option>
                    <option value="اللغة الإنجليزية التأسيسية">اللغة الإنجليزية التأسيسية</option>
                    <option value="الروبوتيك والبرمجة للصغار">الروبوتيك والبرمجة للصغار</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    المستوى والفوج
                  </label>
                  <input
                    type="text"
                    value={newStudentForm.cohort}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, cohort: e.target.value })}
                    placeholder="الفوج A (السبت)"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    اسم ولي الأمر
                  </label>
                  <input
                    type="text"
                    value={newStudentForm.guardianName}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, guardianName: e.target.value })}
                    placeholder="ولي الأمر"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    رقم هاتف ولي الأمر
                  </label>
                  <input
                    type="tel"
                    value={newStudentForm.guardianPhone}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, guardianPhone: e.target.value })}
                    placeholder="0550123456"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono focus:border-blue-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    الجنس
                  </label>
                  <select
                    value={newStudentForm.gender}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, gender: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none"
                  >
                    <option value="ذكر">ذكر</option>
                    <option value="أنثى">أنثى</option>
                  </select>
                </div>
              </div>

              {/* Financial Plan Fields */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
                <div className="font-semibold text-slate-800 text-xs">
                  الخطة المالية والتحصيل الأولى
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      إجمالي المستحق المتفق عليه (دج)
                    </label>
                    <input
                      type="number"
                      value={newStudentForm.agreedAmount}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, agreedAmount: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono focus:border-blue-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      الدفعة الأولى المدفوعة (دج)
                    </label>
                    <input
                      type="number"
                      value={newStudentForm.installment1}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, installment1: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono focus:border-blue-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      رقم وصل الدفعة الأولى
                    </label>
                    <input
                      type="text"
                      value={newStudentForm.receipt1}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, receipt1: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono focus:border-blue-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded font-medium shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة التلميذ للجدول</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
