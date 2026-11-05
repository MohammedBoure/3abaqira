import React, { useState } from 'react';
import {
  Tag,
  Receipt,
  Banknote,
  Wallet,
  Coins,
  ShieldCheck,
  TrendingDown,
  ArrowLeftRight,
} from 'lucide-react';

import { PricingPlanManagerView } from './PricingPlanManagerView';
import { InvoicesInstallmentsView } from './InvoicesInstallmentsView';
import { CashReceiptCounterView } from './CashReceiptCounterView';
import { DailyCashDrawerView } from './DailyCashDrawerView';

export function TreasuryFinanceDeskView({ initialTab = 'pricing' }) {
  const [activeSubTab, setActiveSubTab] = useState(initialTab);

  const tabs = [
    {
      id: 'pricing',
      labelAr: 'دليل الأسعار والخصومات المعتمدة',
      subtitleAr: 'Pricing & Overrides',
      icon: Tag,
      tag: 'مبررات إجبارية',
    },
    {
      id: 'invoices',
      labelAr: 'الفواتير وجدولة الأقساط',
      subtitleAr: 'Invoices & Installments',
      icon: Receipt,
      tag: 'سداد مجدول',
    },
    {
      id: 'receipts',
      labelAr: 'شباك وصولات القبض النقدي',
      subtitleAr: 'Cash Receipts Counter',
      icon: Banknote,
      tag: 'تسلسل بدون فجوات',
    },
    {
      id: 'drawer',
      labelAr: 'حركة الصندوق وتسليم العهد',
      subtitleAr: 'Cash Drawer & Handovers',
      icon: Wallet,
      tag: 'رصيد لحظي',
    },
  ];

  return (
    <div className="space-y-2.5 font-arabic text-slate-800">
      {/* High-density Finance Navigation Ribbon */}
      <div className="bg-white border border-slate-200 p-1 shadow-2xs">
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-3 py-1.5 flex items-center gap-2 rounded-none border text-start transition-all shrink-0 ${
                  isActive
                    ? 'bg-blue-900 text-white border-blue-950 font-bold shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-200' : 'text-slate-500'}`} />
                <div className="flex flex-col">
                  <span className="text-xs leading-tight">{tab.labelAr}</span>
                  <span
                    className={`text-[9px] font-mono leading-none ${
                      isActive ? 'text-blue-200' : 'text-slate-400'
                    }`}
                  >
                    {tab.subtitleAr}
                  </span>
                </div>
                <span
                  className={`text-[9px] font-mono px-1 py-0.2 border ms-1 ${
                    isActive
                      ? 'bg-blue-800 text-blue-100 border-blue-700'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {tab.tag}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Active Sub-View */}
      {activeSubTab === 'pricing' && <PricingPlanManagerView />}
      {activeSubTab === 'invoices' && <InvoicesInstallmentsView />}
      {activeSubTab === 'receipts' && <CashReceiptCounterView />}
      {activeSubTab === 'drawer' && <DailyCashDrawerView />}
    </div>
  );
}
