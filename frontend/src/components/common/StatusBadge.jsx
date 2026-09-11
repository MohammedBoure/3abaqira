import React from 'react';

export function StatusBadge({ status, className = '' }) {
  const configs = {
    PAID: {
      labelAr: 'مسدد بالكامل',
      labelEn: 'Fully Paid',
      style: 'bg-emerald-50 text-emerald-900 border-emerald-300',
      dot: 'bg-emerald-700',
    },
    PARTIAL: {
      labelAr: 'سداد جزئي',
      labelEn: 'Partial',
      style: 'bg-amber-50 text-amber-900 border-amber-300',
      dot: 'bg-amber-700',
    },
    OVERDUE: {
      labelAr: 'مستحق متأخر',
      labelEn: 'Overdue',
      style: 'bg-rose-50 text-rose-900 border-rose-300',
      dot: 'bg-rose-700',
    },
    ACTIVE: {
      labelAr: 'نشط',
      labelEn: 'Active',
      style: 'bg-blue-50 text-blue-900 border-blue-300',
      dot: 'bg-blue-700',
    },
    APPROVED: {
      labelAr: 'معتمد',
      labelEn: 'Approved',
      style: 'bg-emerald-50 text-emerald-900 border-emerald-300',
      dot: 'bg-emerald-700',
    },
    PENDING: {
      labelAr: 'قيد التدقيق',
      labelEn: 'Pending',
      style: 'bg-slate-100 text-slate-800 border-slate-300',
      dot: 'bg-slate-600',
    },
  };

  const config = configs[status] || configs.ACTIVE;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2 py-0.5
        rounded-none text-[11px] font-semibold tracking-wide
        border select-none
        ${config.style}
        ${className}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-none ${config.dot}`} />
      <span>{config.labelAr}</span>
    </span>
  );
}

