import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Shield, Clock, PlusCircle } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { MOCK_CASH_DRAWER_TRANSACTIONS } from '../../mock/mockData';

export function CashDrawerOverview({ onOpenVoucherModal }) {
  return (
    <GlassCard className="h-full flex flex-col justify-between rounded-none shadow-xs">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-300">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 border border-blue-200 text-blue-900">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-display">
                حركة الصندوق والخزينة اليومية (Daily Cash Drawer)
              </h3>
              <p className="text-[11px] text-slate-500">
                تسجيل المقبوضات والنفقات النقدية ومطابقة الرصيد
              </p>
            </div>
          </div>

          <GlassButton
            onClick={onOpenVoucherModal}
            variant="secondary"
            size="sm"
            icon={PlusCircle}
            className="h-7 text-xs"
          >
            حركة جديدة
          </GlassButton>
        </div>

        {/* Transaction Stream */}
        <div className="mt-3 space-y-2">
          {MOCK_CASH_DRAWER_TRANSACTIONS.map((tx) => {
            const isIncome = tx.type === 'INCOME';
            return (
              <div
                key={tx.id}
                className="p-2.5 bg-slate-50 border border-slate-200 flex items-center justify-between hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-1.5 border ${
                      isIncome
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-rose-50 text-rose-800 border-rose-300'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 line-clamp-1">
                      {tx.descAr}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 font-mono">
                      <span>{tx.voucherNo}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {tx.time}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className={`font-mono font-bold text-xs ${
                    isIncome ? 'text-emerald-800' : 'text-rose-800'
                  }`}
                >
                  {isIncome ? `+${tx.amount.toLocaleString('fr-DZ')} دج` : `-${tx.amount.toLocaleString('fr-DZ')} دج`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drawer Bottom Balance Summary */}
      <div className="mt-4 pt-3 border-t border-slate-300 bg-slate-50 -mx-5 -mb-5 p-3 px-5 flex items-center justify-between">
        <div>
          <span className="text-[11px] text-slate-600 block">
            السيولة الجاهزة للتسليم الإداري:
          </span>
          <div className="font-mono font-extrabold text-base text-blue-950">
            184,500 دج
          </div>
        </div>
        <GlassButton variant="primary" size="sm" className="h-7 text-xs">
          توليد كشف الإيداع
        </GlassButton>
      </div>
    </GlassCard>
  );
}

