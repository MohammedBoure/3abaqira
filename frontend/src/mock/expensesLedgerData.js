/**
 * Expenses Ledger Data Model & Generator (سجل المصاريف اليومية السنوي)
 * Covers the complete academic & fiscal cycle from September 2025 to July 2026.
 * Formatted and grouped with daily dates, designations (التعيين), amounts (المبلغ), and monthly subtotals.
 */

export const EXPENSES_MONTHS = [
  {
    id: 'sept-2025',
    nameAr: 'سبتمبر 2025',
    nameFr: 'Septembre 2025',
    subtotalLabel: 'مجموع شهر سبثمبر',
    days: 30,
    formatDate: (d) => `${d}-9-2025`,
    year: 2025,
    monthNum: 9,
  },
  {
    id: 'oct-2025',
    nameAr: 'أكتوبر 2025',
    nameFr: 'Octobre 2025',
    subtotalLabel: 'مجموع شهر أكثوبر',
    days: 31,
    formatDate: (d) => `${d}-10-2025`,
    year: 2025,
    monthNum: 10,
  },
  {
    id: 'nov-2025',
    nameAr: 'نوفمبر 2025',
    nameFr: 'Novembre 2025',
    subtotalLabel: 'مجموع شهر نوفمبر',
    days: 30,
    formatDate: (d) => `${d}-11-2025`,
    year: 2025,
    monthNum: 11,
  },
  {
    id: 'dec-2025',
    nameAr: 'ديسمبر 2025',
    nameFr: 'Décembre 2025',
    subtotalLabel: 'مجموع شهر ديسمبر',
    days: 31,
    formatDate: (d) => `${d}-12-2025`,
    year: 2025,
    monthNum: 12,
  },
  {
    id: 'jan-2026',
    nameAr: 'جانفي 2026',
    nameFr: 'Janvier 2026',
    subtotalLabel: 'مجموع شهر جانفي',
    days: 31,
    formatDate: (d) => `${d}-1-2026`,
    year: 2026,
    monthNum: 1,
  },
  {
    id: 'feb-2026',
    nameAr: 'فيفري 2026',
    nameFr: 'Février 2026',
    subtotalLabel: 'مجموع شهر فيفري',
    days: 28,
    formatDate: (d) => `${d}-2-2026`,
    year: 2026,
    monthNum: 2,
  },
  {
    id: 'mar-2026',
    nameAr: 'مارس 2026',
    nameFr: 'Mars 2026',
    subtotalLabel: 'مجموع شهر مارس',
    days: 31,
    formatDate: (d) => `${d}-3-2026`,
    year: 2026,
    monthNum: 3,
  },
  {
    id: 'apr-2026',
    nameAr: 'أفريل 2026',
    nameFr: 'Avril 2026',
    subtotalLabel: 'مجموع شهر افريل',
    days: 30,
    formatDate: (d) => `4/${d}/2026`,
    year: 2026,
    monthNum: 4,
  },
  {
    id: 'may-2026',
    nameAr: 'ماي 2026',
    nameFr: 'Mai 2026',
    subtotalLabel: 'مجموع شهر ماي',
    days: 31,
    formatDate: (d) => `5/${d}/2026`,
    year: 2026,
    monthNum: 5,
  },
  {
    id: 'jun-2026',
    nameAr: 'جوان 2026',
    nameFr: 'Juin 2026',
    subtotalLabel: 'مجموع شهر جوان',
    days: 30,
    formatDate: (d) => `6/${d}/2026`,
    year: 2026,
    monthNum: 6,
  },
  {
    id: 'jul-2026',
    nameAr: 'جويلية 2026',
    nameFr: 'Juillet 2026',
    subtotalLabel: 'مجموع شهر جويلية',
    days: 31,
    formatDate: (d) => `7/${d}/2026`,
    year: 2026,
    monthNum: 7,
  },
];

// Common recurring expense categories & designations (التعيين)
export const COMMON_DESIGNATIONS = [
  'شراء مستلزمات مكتبية وأوراق طباعة',
  'صيانة مكيفات ومرافق القاعات',
  'فواتير الإنترنت والهاتف الثابت',
  'مواد تنظيف وتعقيم صحية',
  'شراء معدادات وكتب سوربان وحساب ذهني',
  'مقتنيات مطعم الروضة وتموين الأطفال',
  'مستحقات نقل وإيصال معلمين ومدربين',
  'ضيافة أولياء الأمور وفعاليات الاستقبال',
  'أدوات وعتاد روبوتيك وبرمجة للصغار',
  'إصلاحات سباكة وكهرباء عامة',
];

/**
 * Generate initial daily rows for all 11 months (334 days)
 * Populated with realistic operational school expenses on operational days, and 0 for others
 */
export function generateInitialExpensesLedger() {
  const rows = [];

  EXPENSES_MONTHS.forEach((month) => {
    for (let d = 1; d <= month.days; d++) {
      const dateStr = month.formatDate(d);
      const rowId = `exp-${month.year}-${String(month.monthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      let amount = 0;
      let designation = '';
      let branchId = (d % 3 === 0) ? 'RAWDA' : 'CENTER';

      // Example pattern: realistic expense entries for past months
      const isExpenseDay = (d % 3 === 1 && d <= 26) || (d === 15 || d === 28);

      if (month.year === 2025 || (month.year === 2026 && month.monthNum <= 2)) {
        if (isExpenseDay) {
          amount = (3 + ((d * 5) % 18)) * 1000; // e.g. 3,000 to 20,000 DZD
          designation = COMMON_DESIGNATIONS[(d + month.monthNum) % COMMON_DESIGNATIONS.length];
        }
      }

      rows.push({
        id: rowId,
        monthId: month.id,
        day: d,
        dateString: dateStr,
        designation: designation,
        amount: amount,
        branchId: branchId,
      });
    }
  });

  return rows;
}

/**
 * Compute monthly subtotals and grand total
 */
export function computeExpensesLedgerStats(rows) {
  const monthlyTotals = {};
  let grandTotal = 0;
  let nonZeroCount = 0;

  EXPENSES_MONTHS.forEach((m) => {
    monthlyTotals[m.id] = 0;
  });

  rows.forEach((r) => {
    const amt = Number(r.amount) || 0;
    if (monthlyTotals[r.monthId] !== undefined) {
      monthlyTotals[r.monthId] += amt;
    }
    grandTotal += amt;
    if (amt > 0) nonZeroCount++;
  });

  return {
    monthlyTotals,
    grandTotal,
    nonZeroCount,
    totalDays: rows.length,
  };
}

export const MOCK_EXPENSES_LEDGER = generateInitialExpensesLedger();
