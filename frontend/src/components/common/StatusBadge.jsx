import React from 'react';

export function StatusBadge({ status, className = '' }) {
  const configs = {
    PAID: {
      labelAr: 'تم السداد بالكامل',
      labelEn: 'Fully Paid',
      style: 'bg-emerald-50 text-emerald-800 border-emerald-200/90 shadow-xs',
      dot: 'bg-emerald-600',
    },
    PARTIAL: {
      labelAr: 'سداد جزئي (أقساط)',
      labelEn: 'Partial Payment',
      style: 'bg-amber-50 text-amber-800 border-amber-200/90 shadow-xs',
      dot: 'bg-amber-600',
    },
    OVERDUE: {
      labelAr: 'مستحق الدفع (متأخر)',
      labelEn: 'Overdue Balance',
      style: 'bg-rose-50 text-rose-800 border-rose-200/90 shadow-xs',
      dot: 'bg-rose-600',
    },
    ACTIVE: {
      labelAr: 'نشط',
      labelEn: 'Active',
      style: 'bg-blue-50 text-blue-800 border-blue-200/90 shadow-xs',
      dot: 'bg-blue-600',
    },
  };

  const config = configs[status] || configs.ACTIVE;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-0.5
        rounded-full text-xs font-semibold
        border select-none
        ${config.style}
        ${className}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.labelAr}</span>
    </span>
  );
}
