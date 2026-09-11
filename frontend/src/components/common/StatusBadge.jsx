import React from 'react';

export function StatusBadge({ status, className = '' }) {
  const configs = {
    PAID: {
      labelAr: 'تم السداد بالكامل',
      labelEn: 'Fully Paid',
      style: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]',
      dot: 'bg-emerald-400',
    },
    PARTIAL: {
      labelAr: 'سداد جزئي (أقساط)',
      labelEn: 'Partial Payment',
      style: 'bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]',
      dot: 'bg-amber-400',
    },
    OVERDUE: {
      labelAr: 'مستحق الدفع (متأخر)',
      labelEn: 'Overdue Balance',
      style: 'bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.2)]',
      dot: 'bg-rose-400 animate-pulse',
    },
    ACTIVE: {
      labelAr: 'نشط',
      labelEn: 'Active',
      style: 'bg-blue-500/15 text-blue-300 border-blue-400/30 shadow-[0_0_12px_rgba(59,130,246,0.2)]',
      dot: 'bg-blue-400',
    },
  };

  const config = configs[status] || configs.ACTIVE;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1
        rounded-full text-xs font-semibold
        border backdrop-blur-md select-none
        ${config.style}
        ${className}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.labelAr}</span>
    </span>
  );
}
