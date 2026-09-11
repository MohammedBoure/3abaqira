import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Shield, Clock, PlusCircle } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { MOCK_CASH_DRAWER_TRANSACTIONS } from '../../mock/mockData';

export function CashDrawerOverview({ onOpenVoucherModal }) {
  return (
    <GlassCard className="h-full flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                حركة الصندوق اليومي النشط (الخزينة)
              </h3>
              <p className="text-xs text-slate-500">
                تسجيل المداخيل، المصاريف، وتسليم السيولة للإدارة
              </p>
            </div>
          </div>

          <GlassButton
            onClick={onOpenVoucherModal}
            variant="secondary"
            size="sm"
            icon={PlusCircle}
          >
            تسجيل حركة
          </GlassButton>
        </div>

        {/* Transaction Stream */}
        <div className="mt-4 space-y-3">
          {MOCK_CASH_DRAWER_TRANSACTIONS.map((tx) => {
            const isIncome = tx.type === 'INCOME';
            return (
              <div
                key={tx.id}
                className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/90 flex items-center justify-between hover:bg-slate-100/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg border ${
                      isIncome
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 line-clamp-1">
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
                    isIncome ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {tx.amount}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drawer Bottom Balance Summary */}
      <div className="mt-6 pt-4 border-t border-slate-200 bg-slate-50 -mx-6 -mb-6 p-4 px-6 rounded-b-2xl flex items-center justify-between">
        <div>
          <span className="text-[11px] text-slate-600 font-medium">
            السيولة الجاهزة للتسليم (التسليم الإداري):
          </span>
          <div className="font-mono font-extrabold text-base text-blue-700">
            142,500 دج
          </div>
        </div>
        <GlassButton variant="secondary" size="sm">
          توليد كشف التسليم
        </GlassButton>
      </div>
    </GlassCard>
  );
}
