import React, { useState, useMemo } from 'react';
import {
  TrendingDown,
  DollarSign,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  PieChart,
  Tag,
  X,
  UtensilsCrossed,
  ArrowUpRight,
  RefreshCw,
  Copy,
  Printer,
  Filter,
} from 'lucide-react';
import { ContextMenu } from '../common/ContextMenu';
import {
  MOCK_EXPENSES_LIST,
  MOCK_EXPENSE_CATEGORIES,
  MOCK_BUDGET_VARIANCES,
} from '../../mock/mockData';

export function BudgetsExpensesView({ selectedBranch = 'ALL' }) {
  const [expenses, setExpenses] = useState(MOCK_EXPENSES_LIST);
  const [categories, setCategories] = useState(MOCK_EXPENSE_CATEGORIES);
  const [variances, setVariances] = useState(MOCK_BUDGET_VARIANCES);
  const [subTab, setSubTab] = useState('expenses'); // 'expenses' | 'budgets' | 'categories'
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Right-Click Context Menu State
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    x: 0,
    y: 0,
    expense: null,
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  // New Expense Form
  const [expenseForm, setExpenseForm] = useState({
    category_id: 1,
    branch_id: selectedBranch === 'RAWDA' ? 'RAWDA' : 'CENTER',
    description: '',
    amount: '',
    paid_to: '',
    payment_method: 'CASH',
  });

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchesBranch = selectedBranch === 'ALL' || exp.branch_id === selectedBranch;
      const matchesSearch =
        !searchTerm ||
        exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.voucher_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.paid_to.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.category_name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesBranch && matchesSearch;
    });
  }, [expenses, selectedBranch, searchTerm]);

  const totalSpent = filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0);
  const totalBudget = categories.reduce((acc, cat) => acc + (cat.budget_monthly || 0), 0);

  const contextMenuItems = useMemo(() => {
    if (!contextMenu.expense) return [];
    const exp = contextMenu.expense;

    return [
      { type: 'header', label: `سند صرف: ${exp.voucher_number}` },
      {
        label: `نسخ رقم السند (${exp.voucher_number})`,
        icon: Copy,
        onClick: () => {
          navigator.clipboard.writeText(exp.voucher_number);
          showToast(`تم نسخ رقم السند: ${exp.voucher_number}`);
        },
      },
      {
        label: `نسخ المبلغ (${exp.amount.toLocaleString()} دج)`,
        icon: Copy,
        onClick: () => {
          navigator.clipboard.writeText(String(exp.amount));
          showToast(`تم نسخ المبلغ: ${exp.amount} دج`);
        },
      },
      {
        label: `نسخ سطر النفقة كـ TSV`,
        icon: FileSpreadsheet,
        onClick: () => {
          const rowStr = `${exp.voucher_number}\t${exp.branch_id}\t${exp.category_name}\t${exp.description}\t${exp.amount}\t${exp.expense_date}\t${exp.paid_to}\t${exp.authorized_by}`;
          navigator.clipboard.writeText(rowStr);
          showToast(`تم نسخ سطر السند كـ TSV`);
        },
      },
      { type: 'divider' },
      {
        label: `تصفية الجدول حسب البند (${exp.category_name})`,
        icon: Filter,
        onClick: () => {
          setSearchTerm(exp.category_name);
          showToast(`تمت التصفية حسب: ${exp.category_name}`);
        },
      },
      {
        label: `تصفية الجدول حسب المستفيد (${exp.paid_to})`,
        icon: Filter,
        onClick: () => {
          setSearchTerm(exp.paid_to);
          showToast(`تمت التصفية حسب: ${exp.paid_to}`);
        },
      },
      {
        label: 'طباعة سند الصرف المعتمد',
        icon: Printer,
        onClick: () => window.print(),
      },
    ];
  }, [contextMenu.expense]);

  const handleCreateExpense = (e) => {
    e.preventDefault();
    const amt = parseFloat(expenseForm.amount) || 0;
    if (amt <= 0 || !expenseForm.description) return;

    const cat = categories.find((c) => c.category_id === parseInt(expenseForm.category_id, 10));

    const newExpense = {
      expense_id: Date.now(),
      voucher_number: `EXP-${expenseForm.branch_id}-2026-${Date.now().toString().slice(-5)}`,
      branch_id: expenseForm.branch_id,
      category_id: cat ? cat.category_id : 1,
      category_name: cat ? cat.name_ar : 'عام',
      description: expenseForm.description,
      amount: amt,
      expense_date: new Date().toISOString().substring(0, 10),
      payment_method: expenseForm.payment_method,
      paid_to: expenseForm.paid_to || 'مورد محلي',
      authorized_by: 'محمد بوري (المدير العام)',
    };

    setExpenses([newExpense, ...expenses]);
    setIsExpenseModalOpen(false);
    setExpenseForm({ category_id: 1, branch_id: 'CENTER', description: '', amount: '', paid_to: '', payment_method: 'CASH' });
  };

  return (
    <div className="space-y-3 font-arabic">
      {/* 1. Header */}
      <div className="bg-white border border-slate-300 p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="eyebrow flex items-center gap-1.5 text-blue-900">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>OPERATIONAL EXPENSES & BUDGET VARIANCES / backend/apis/expenses.py & budgets.py</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold font-serif text-slate-900 mt-0.5">
            سجل النفقات التشغيلية والموازنات التقديرية (Expenses & Budgets)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            متابعة بنود الصرف اليومية، تصنيفات المشتريات والتموين الغذائي، ومقارنة الموازنة التقديرية مع المنصرف الفعلي (Variance Analysis).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="view-switch text-xs">
            <button
              onClick={() => setSubTab('expenses')}
              className={subTab === 'expenses' ? 'active' : ''}
            >
              <DollarSign className="w-3 h-3" />
              <span>أوامر الصرف اليومية</span>
            </button>
            <button
              onClick={() => setSubTab('budgets')}
              className={subTab === 'budgets' ? 'active' : ''}
            >
              <PieChart className="w-3 h-3" />
              <span>مقارنة الموازنة (Variance)</span>
            </button>
            <button
              onClick={() => setSubTab('categories')}
              className={subTab === 'categories' ? 'active' : ''}
            >
              <Tag className="w-3 h-3" />
              <span>بنود المصاريف ({categories.length})</span>
            </button>
          </div>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="button button-primary text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>تسجيل سند صرف (POST /expenses)</span>
          </button>
        </div>
      </div>

      {/* 2. Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-white border border-slate-300 p-3 border-s-4 border-s-rose-700 shadow-xs">
          <span className="eyebrow">MONTHLY ACTUAL SPENT</span>
          <div className="text-xl font-bold font-mono text-rose-800 mt-1">
            {totalSpent.toLocaleString()} دج
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            إجمالي المنصرف خلال الشهر الحالي
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-3 border-s-4 border-s-blue-900 shadow-xs">
          <span className="eyebrow">BUDGET ALLOCATED</span>
          <div className="text-xl font-bold font-mono text-blue-950 mt-1">
            {totalBudget.toLocaleString()} دج
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            المخصص المالي الشهري لجميع الأبواب
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-3 border-s-4 border-s-emerald-700 shadow-xs">
          <span className="eyebrow">BUDGET EFFICIENCY</span>
          <div className="text-xl font-bold font-mono text-emerald-800 mt-1">
            {Math.round(((totalBudget - totalSpent) / (totalBudget || 1)) * 100)}% وفر
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            فائض الموازنة المتبقي للصرف
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-3 border-s-4 border-s-amber-600 shadow-xs">
          <span className="eyebrow">CAFETERIA RATIO</span>
          <div className="text-xl font-bold font-mono text-amber-800 mt-1">
            48.2%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            حصة المطبخ والوجبات من نفقات الروضة
          </div>
        </div>
      </div>

      {/* 3. Sub-Tab Content */}
      {subTab === 'expenses' && (
        <div className="bg-white border border-slate-300 shadow-xs">
          <div className="overflow-x-auto">
            <table className="excel-table text-xs">
              <thead>
                <tr>
                  <th className="excel-th p-2 text-center w-36">رقم السند (Voucher)</th>
                  <th className="excel-th p-2 text-center">المقر</th>
                  <th className="excel-th p-2 text-start">بند المصروف (Category)</th>
                  <th className="excel-th p-2 text-start">التعيين وتفاصيل الشراء</th>
                  <th className="excel-th p-2 text-center">المبلغ (دج)</th>
                  <th className="excel-th p-2 text-center">التاريخ</th>
                  <th className="excel-th p-2 text-start">المستفيد / المورد</th>
                  <th className="excel-th p-2 text-start">المصادقة الإدارية</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((exp) => (
                  <tr
                    key={exp.expense_id}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({
                        isOpen: true,
                        x: e.clientX,
                        y: e.clientY,
                        expense: exp,
                      });
                    }}
                    className="hover:bg-slate-50/80 transition-colors cursor-context-menu"
                  >
                    <td className="excel-td p-2 text-center font-mono font-bold text-blue-900">
                      {exp.voucher_number}
                    </td>
                    <td className="excel-td p-2 text-center font-semibold text-slate-700">
                      {exp.branch_id}
                    </td>
                    <td className="excel-td p-2 font-semibold text-slate-800">
                      <span className="tag text-[10px]">{exp.category_name}</span>
                    </td>
                    <td className="excel-td p-2 text-slate-900 font-medium">
                      {exp.description}
                    </td>
                    <td className="excel-td p-2 text-center font-mono font-bold text-rose-700">
                      {exp.amount.toLocaleString()} دج
                    </td>
                    <td className="excel-td p-2 text-center font-mono text-slate-600">
                      {exp.expense_date}
                    </td>
                    <td className="excel-td p-2 text-slate-700">
                      {exp.paid_to}
                    </td>
                    <td className="excel-td p-2 text-slate-500 text-[11px]">
                      {exp.authorized_by}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="excel-status-bar p-2 text-slate-600 flex items-center justify-between text-[11px]">
            <span>إجمالي النفقات المعروضة: <strong>{filteredExpenses.length} سند</strong> (انقر بالزر الأيمن للمزيد من الإجراءات)</span>
            <span className="text-blue-900 font-mono">FastAPI: /expenses</span>
          </div>
        </div>
      )}

      {subTab === 'budgets' && (
        <div className="bg-white border border-slate-300 shadow-xs">
          <div className="p-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="font-bold text-xs text-slate-900">
              تحليل انحرافات الموازنة التقديرية عن المنصرف الفعلي (Budget Variance Analysis)
            </span>
            <span className="text-xs text-slate-500 font-mono">Month: 2026-02</span>
          </div>

          <div className="overflow-x-auto">
            <table className="excel-table text-xs">
              <thead>
                <tr>
                  <th className="excel-th p-2 text-start">باب المصروف</th>
                  <th className="excel-th p-2 text-center">المخصص المالي (Budget)</th>
                  <th className="excel-th p-2 text-center">المنصرف الفعلي (Actual)</th>
                  <th className="excel-th p-2 text-center">الانحراف (Variance)</th>
                  <th className="excel-th p-2 text-center">المتغير (Units)</th>
                  <th className="excel-th p-2 text-center">حالة الالتزام</th>
                </tr>
              </thead>
              <tbody>
                {variances.map((v) => (
                  <tr key={v.category_code} className="hover:bg-slate-50/80 transition-colors">
                    <td className="excel-td p-2 font-bold text-slate-900">
                      {v.category_name} ({v.category_code})
                    </td>
                    <td className="excel-td p-2 text-center font-mono font-bold text-blue-900">
                      {v.budgeted_amount.toLocaleString()} دج
                    </td>
                    <td className="excel-td p-2 text-center font-mono font-bold text-slate-900">
                      {v.actual_spent.toLocaleString()} دج
                    </td>
                    <td className="excel-td p-2 text-center font-mono font-bold">
                      <span className={v.variance <= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                        {v.variance > 0 ? `+${v.variance.toLocaleString()}` : v.variance.toLocaleString()} دج
                      </span>
                    </td>
                    <td className="excel-td p-2 text-center font-mono text-slate-600">
                      {v.variable_factor}
                    </td>
                    <td className="excel-td p-2 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 border ${
                          v.status === 'FAVORABLE'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}
                      >
                        {v.status === 'FAVORABLE' ? 'وفر مالي (إيجابي)' : 'تجاوز للمخصص'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'categories' && (
        <div className="bg-white border border-slate-300 p-4 shadow-xs space-y-3">
          <div className="border-b border-slate-200 pb-2">
            <h4 className="font-bold text-sm text-slate-900">
              دليل تصنيفات وأبواب المصاريف الرسمية (ملخص المصاريف)
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {categories.map((c) => (
              <div key={c.category_id} className="p-3 border border-slate-200 bg-slate-50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-blue-900">{c.code}</span>
                    {c.is_cafeteria && (
                      <span className="tag text-[9px] bg-amber-100 text-amber-800 border-amber-300">
                        إطعام ومطبخ
                      </span>
                    )}
                  </div>
                  <h5 className="font-bold text-xs text-slate-900 mt-1">{c.name_ar}</h5>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">المخصص الشهري:</span>
                  <span className="font-bold text-slate-900">{c.budget_monthly.toLocaleString()} دج</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Record Expense */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-3 select-none">
          <div className="bg-white border border-slate-400 max-w-md w-full shadow-lg">
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-700" />
                <h3 className="font-bold text-sm text-slate-900">
                  تسجيل سند صرف ونفقة تشغيلية (POST /expenses)
                </h3>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="icon-button w-6 h-6 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="eyebrow block mb-1 text-slate-700">المقر التشغيلي</label>
                  <select
                    value={expenseForm.branch_id}
                    onChange={(e) => setExpenseForm({ ...expenseForm, branch_id: e.target.value })}
                    className="w-full h-8 px-2 text-xs border border-slate-300 bg-white"
                  >
                    <option value="CENTER">CENTER (المركز الأكاديمي)</option>
                    <option value="RAWDA">RAWDA (الروضة)</option>
                  </select>
                </div>
                <div>
                  <label className="eyebrow block mb-1 text-slate-700">باب المصروف</label>
                  <select
                    value={expenseForm.category_id}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category_id: e.target.value })}
                    className="w-full h-8 px-2 text-xs border border-slate-300 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.name_ar}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="eyebrow block mb-1 text-slate-700">التعيين وبيان النفقة *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شراء حبر طابعات + مستلزمات نظافة..."
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full h-8 px-2.5 text-xs border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="eyebrow block mb-1 text-slate-700">المبلغ المنصرف (دج) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full h-8 px-2.5 text-xs border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="eyebrow block mb-1 text-slate-700">المستفيد / اسم المورد</label>
                  <input
                    type="text"
                    placeholder="اسم المحل أو المورد..."
                    value={expenseForm.paid_to}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paid_to: e.target.value })}
                    className="w-full h-8 px-2.5 text-xs border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="button text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="button button-primary text-xs"
                >
                  إصدار سند الصرف وخصم المبلغ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-4 end-4 z-50 bg-slate-900 text-white px-3 py-2 text-xs rounded shadow-lg border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Interactive Right-Click Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={{ x: contextMenu.x, y: contextMenu.y }}
        onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
        title={contextMenu.expense ? `سند صرف: ${contextMenu.expense.voucher_number}` : 'إجراءات النفقات'}
        subtitle={
          contextMenu.expense
            ? `${contextMenu.expense.category_name} • ${contextMenu.expense.amount?.toLocaleString()} دج`
            : ''
        }
        items={contextMenuItems}
      />
    </div>
  );
}
