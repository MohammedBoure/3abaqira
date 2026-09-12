import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Plus,
  Edit2,
  X,
} from 'lucide-react';
import { StandardViewLayout } from '../common/StandardViewLayout';
import { MOCK_RAWDA_BUDGET_VARIANCE } from '../../../mock/rawdaMockData';

export function RawdaBudgetVarianceView() {
  const [items, setItems] = useState(MOCK_RAWDA_BUDGET_VARIANCE);
  const [editingItem, setEditingItem] = useState(null);

  // 1. KPI Calculations (Section 2.4)
  const totalBudget = items.reduce((acc, i) => acc + i.estimatedBudget, 0);
  const totalActual = items.reduce((acc, i) => acc + i.actualSpent, 0);
  const netVariance = totalBudget - totalActual; // Positive = savings (وفر), Negative = deficit (عجز)
  const savingsRate = totalBudget > 0 ? ((netVariance / totalBudget) * 100).toFixed(1) : 0;

  const kpiCards = [
    {
      label: 'الموازنة التقديرية المعتمدة',
      value: `${totalBudget.toLocaleString()} دج`,
      icon: PieChart,
      subtext: 'مجموع بنود النفقات الـ 7 المعتمدة',
      change: 'مخطط',
      isPositive: true,
    },
    {
      label: 'المصروف الحقيقي الفعلي',
      value: `${totalActual.toLocaleString()} دج`,
      icon: TrendingUp,
      subtext: 'إجمالي الفواتير والمشتريات المسجلة',
      change: `${totalActual > totalBudget ? 'تجاوز' : 'ضمن الحدود'}`,
      isPositive: totalActual <= totalBudget,
    },
    {
      label: 'صافي الفارق (وفر / عجز)',
      value: `${Math.abs(netVariance).toLocaleString()} دج`,
      icon: netVariance >= 0 ? CheckCircle : AlertTriangle,
      subtext: netVariance >= 0 ? 'وفر مالي محقق لصالح الخزينة' : 'عجز في النفقات يتطلب مراجعة',
      change: netVariance >= 0 ? `+${savingsRate}% وفر` : `${savingsRate}% عجز`,
      isPositive: netVariance >= 0,
    },
    {
      label: 'معدل الالتزام بالموازنة',
      value: `${Math.round((totalActual / totalBudget) * 100)}%`,
      icon: TrendingDown,
      subtext: 'نسبة التنفيذ من السقف المالي',
      change: 'مراقب بدقة',
      isPositive: totalActual <= totalBudget,
    },
  ];

  const handleUpdateItem = (e) => {
    e.preventDefault();
    if (!editingItem) return;

    setItems((prev) =>
      prev.map((i) =>
        i.category === editingItem.category
          ? {
              ...i,
              estimatedBudget: Number(editingItem.estimatedBudget),
              actualSpent: Number(editingItem.actualSpent),
              unitQuantity: editingItem.unitQuantity,
            }
          : i
      )
    );

    setEditingItem(null);
  };

  return (
    <StandardViewLayout
      titleAr="ملخص المصاريف وتحليل الموازنة (Variance Analysis)"
      titleEn="Rawda Operating Budget & Expense Variance Analysis"
      description="مقارنة محاسبية تحليلية بين الموازنة التقديرية المخططة والمصاريف الحقيقية المنفذة لبنود الروضة السبعة المعتمدة، مع احتساب فوارق الوفر والعجز تلقائياً."
      entityTag="الرقابة والموازنة"
      branchCode="RAWDA"
      kpiCards={kpiCards}
      exportFileName="rawda_budget_variance"
      exportData={items.map((i) => {
        const diff = i.estimatedBudget - i.actualSpent;
        return {
          'بند النفقة': i.category,
          'المتغير / الكمية': i.unitQuantity,
          'الموازنة التقديرية (دج)': i.estimatedBudget,
          'المصروف الحقيقي (دج)': i.actualSpent,
          'الفارق (دج)': diff,
          'الوضعية': diff >= 0 ? 'وفر' : 'عجز',
        };
      })}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-start text-xs border-collapse">
          <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold select-none">
            <tr>
              <th className="p-2.5 text-center border-e border-slate-200 w-12">#</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[200px]">بند النفقة المعتمد</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[180px]">المتغير / حجم الاستهلاك</th>
              <th className="p-2.5 text-end border-e border-slate-200 min-w-[150px]">
                المبلغ المستحق (الموازنة التقديرية)
              </th>
              <th className="p-2.5 text-end border-e border-slate-200 min-w-[150px]">المبلغ الحقيقي الفعلي</th>
              <th className="p-2.5 text-end border-e border-slate-200 min-w-[150px]">
                الباقي (الفارق = التقديري - الحقيقي)
              </th>
              <th className="p-2.5 text-center border-e border-slate-200 min-w-[100px]">حالة البند</th>
              <th className="p-2.5 text-center min-w-[80px] print:hidden">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {items.map((i, index) => {
              const variance = i.estimatedBudget - i.actualSpent;
              const isSavings = variance >= 0;

              return (
                <tr key={i.category} className="hover:bg-blue-50/40 transition-colors">
                  <td className="p-2.5 text-center border-e border-slate-200 font-mono text-slate-400 font-bold">
                    {index + 1}
                  </td>
                  <td className="p-2.5 border-e border-slate-200 font-bold text-slate-900 text-sm">
                    {i.category}
                  </td>
                  <td className="p-2.5 border-e border-slate-200 text-slate-600">
                    {i.unitQuantity}
                  </td>
                  <td className="p-2.5 text-end border-e border-slate-200 font-mono font-medium">
                    {i.estimatedBudget.toLocaleString()} دج
                  </td>
                  <td className="p-2.5 text-end border-e border-slate-200 font-mono font-bold text-slate-900">
                    {i.actualSpent.toLocaleString()} دج
                  </td>
                  <td className="p-2.5 text-end border-e border-slate-200 font-mono font-bold text-sm">
                    <span
                      className={`px-2 py-0.5 rounded-[2px] ${
                        isSavings
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {isSavings ? '+' : ''}
                      {variance.toLocaleString()} دج
                    </span>
                  </td>
                  <td className="p-2.5 text-center border-e border-slate-200">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold ${
                        isSavings
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isSavings ? 'وفر محقق ✓' : 'عجز مالي ⚠'}
                    </span>
                  </td>
                  <td className="p-2.5 text-center print:hidden">
                    <button
                      onClick={() => setEditingItem({ ...i })}
                      className="text-slate-400 hover:text-blue-900 p-1"
                      title="تعديل الموازنة التقديرية أو الفاتورة الفعلية"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
            <tr>
              <td colSpan={3} className="p-2.5 text-start border-e border-slate-200">
                المجموع العام لكافة بنود المصاريف المعتمدة
              </td>
              <td className="p-2.5 text-end border-e border-slate-200 font-mono text-sm text-slate-700">
                {totalBudget.toLocaleString()} دج
              </td>
              <td className="p-2.5 text-end border-e border-slate-200 font-mono text-sm text-slate-900">
                {totalActual.toLocaleString()} دج
              </td>
              <td className="p-2.5 text-end border-e border-slate-200 font-mono text-base font-bold">
                <span className={netVariance >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                  {netVariance >= 0 ? '+' : ''}
                  {netVariance.toLocaleString()} دج
                </span>
              </td>
              <td colSpan={2} className="p-2.5 text-center text-xs text-slate-600">
                {netVariance >= 0 ? 'وفر إجمالي في الموازنة' : 'عجز إجمالي يتطلب تغطية'}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-sm p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">تحديث موازنة البند</span>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-slate-600">
              البند: <strong className="text-slate-900">{editingItem.category}</strong>
            </p>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">المتغير / حجم الاستهلاك:</label>
              <input
                type="text"
                value={editingItem.unitQuantity}
                onChange={(e) => setEditingItem({ ...editingItem, unitQuantity: e.target.value })}
                className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">المبلغ التقديري المخطط (دج):</label>
              <input
                type="number"
                value={editingItem.estimatedBudget}
                onChange={(e) => setEditingItem({ ...editingItem, estimatedBudget: e.target.value })}
                className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">المبلغ الحقيقي الفعلي (دج):</label>
              <input
                type="number"
                value={editingItem.actualSpent}
                onChange={(e) => setEditingItem({ ...editingItem, actualSpent: e.target.value })}
                className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleUpdateItem}
                className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold"
              >
                تحديث البند
              </button>
            </div>
          </div>
        </div>
      )}
    </StandardViewLayout>
  );
}
