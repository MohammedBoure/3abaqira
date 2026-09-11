import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Download,
  Calendar,
  Truck,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { StatusBadge } from '../common/StatusBadge';
import { MOCK_PROVISIONS_DATA } from '../../mock/mockData';

export function ProvisionsOverview() {
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'BREAD' | 'MEAT'

  const filteredProvisions = MOCK_PROVISIONS_DATA.filter((item) => {
    if (activeTab === 'BREAD') return item.itemCategory.includes('خبز');
    if (activeTab === 'MEAT') return item.itemCategory.includes('لحم') || item.itemCategory.includes('دجاج');
    return true;
  });

  const totalCost = filteredProvisions.reduce((acc, cur) => acc + cur.totalCost, 0);

  return (
    <div className="w-full bg-white border border-slate-300 shadow-xs flex flex-col space-y-4 p-4">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-300">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-blue-900" />
            <h2 className="text-base font-bold font-display text-slate-900">
              سجل تموين مطعم الروضة والحضانة (Cafeteria & Provisions Sheet)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            تتبع يومي لاستهلاك الخبز، اللحوم، وجبات الأطفال، والموردين المعتمدين (قالب عمل جاهز)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="flex items-center border border-slate-300 bg-white">
            {[
              { id: 'ALL', label: 'كافة المشتريات' },
              { id: 'BREAD', label: 'سجل الخبز اليومي' },
              { id: 'MEAT', label: 'اللحوم والبروتينات' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                  activeTab === t.id
                    ? 'bg-blue-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <GlassButton variant="primary" size="sm" icon={Download} className="h-7 text-xs">
            تصدير سجل التموين
          </GlassButton>
        </div>
      </div>

      {/* Excel Table Layout for Provisions */}
      <div className="overflow-x-auto border border-slate-300">
        <table className="excel-table text-xs text-slate-800">
          <thead>
            <tr className="bg-slate-100 text-slate-700">
              <th className="excel-th py-2 px-3 text-start">البيان ومادة التموين</th>
              <th className="excel-th py-2 px-3 text-start">اليوم / الفترة</th>
              <th className="excel-th py-2 px-3 text-start">الوجبة المقررة</th>
              <th className="excel-th py-2 px-3 text-center">الكمية / الحصص</th>
              <th className="excel-th py-2 px-3 text-end">سعر الوحدة</th>
              <th className="excel-th py-2 px-3 text-end">المبلغ الإجمالي</th>
              <th className="excel-th py-2 px-3 text-start">المورد / المخبزة</th>
              <th className="excel-th py-2 px-3 text-center">حالة الاستلام</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredProvisions.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="excel-td py-2 px-3 font-bold text-slate-900">
                  {item.itemCategory}
                </td>
                <td className="excel-td py-2 px-3 text-slate-700">
                  {item.scheduledDay}
                </td>
                <td className="excel-td py-2 px-3 text-slate-600">
                  {item.menuMeal}
                </td>
                <td className="excel-td py-2 px-3 text-center font-mono font-bold">
                  {item.loafCount}
                </td>
                <td className="excel-td py-2 px-3 text-end font-mono">
                  {item.unitPrice.toLocaleString('fr-DZ')} دج
                </td>
                <td className="excel-td py-2 px-3 text-end font-mono font-extrabold text-blue-900 bg-blue-50/30">
                  {item.totalCost.toLocaleString('fr-DZ')} دج
                </td>
                <td className="excel-td py-2 px-3 text-slate-700">
                  {item.supplier}
                </td>
                <td className="excel-td py-2 px-3 text-center">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                    <CheckCircle className="w-3 h-3 text-emerald-700" />
                    تم التوريد
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Aggregate Provisions Ribbon */}
      <div className="excel-status-bar p-2.5 px-3 flex flex-wrap items-center justify-between text-slate-700">
        <span>
          عدد الفواتير والطلبيات المعتمدة: <strong className="text-slate-900 font-mono">{filteredProvisions.length}</strong>
        </span>
        <div className="flex items-center gap-3">
          <span>
            إجمالي مصاريف التموين الحالية (Total Provisions Spend):{' '}
            <strong className="text-blue-900 font-mono text-sm">
              {totalCost.toLocaleString('fr-DZ')} دج
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}
