/**
 * Delivery Ledger Data Model & Generator (سجل التسليم والعهدة السنوي)
 * Covers the complete academic & fiscal cycle from September 2025 to July 2026.
 * Formatted and grouped with daily dates, receipts, amounts, recipients, and remarks.
 */

export const DELIVERY_MONTHS = [
  {
    id: 'sept-2025',
    nameAr: 'سبتمبر 2025',
    nameFr: 'Septembre 2025',
    subtotalLabel: 'مجموع شهر سبثمبر',
    days: 30,
    monthPrefix: 'sept.',
    year: 2025,
    monthNum: 9,
  },
  {
    id: 'oct-2025',
    nameAr: 'أكتوبر 2025',
    nameFr: 'Octobre 2025',
    subtotalLabel: 'مجموع شهر اكثوبر',
    days: 31,
    monthPrefix: 'oct.',
    year: 2025,
    monthNum: 10,
  },
  {
    id: 'nov-2025',
    nameAr: 'نوفمبر 2025',
    nameFr: 'Novembre 2025',
    subtotalLabel: 'مجموع شهر نوفمبر',
    days: 30,
    monthPrefix: 'nov.',
    year: 2025,
    monthNum: 11,
  },
  {
    id: 'dec-2025',
    nameAr: 'ديسمبر 2025',
    nameFr: 'Décembre 2025',
    subtotalLabel: 'مجموع شهر ديسمبر',
    days: 31,
    monthPrefix: 'déc.',
    year: 2025,
    monthNum: 12,
  },
  {
    id: 'jan-2026',
    nameAr: 'جانفي 2026',
    nameFr: 'Janvier 2026',
    subtotalLabel: 'مجموع شهر جانفي',
    days: 31,
    monthPrefix: 'janv.',
    year: 2026,
    monthNum: 1,
  },
  {
    id: 'feb-2026',
    nameAr: 'فيفري 2026',
    nameFr: 'Février 2026',
    subtotalLabel: 'مجموع شهر فيفري',
    days: 28,
    monthPrefix: 'févr.',
    year: 2026,
    monthNum: 2,
  },
  {
    id: 'mar-2026',
    nameAr: 'مارس 2026',
    nameFr: 'Mars 2026',
    subtotalLabel: 'مجموع شهر مارس',
    days: 31,
    monthPrefix: 'mars',
    year: 2026,
    monthNum: 3,
  },
  {
    id: 'apr-2026',
    nameAr: 'أفريل 2026',
    nameFr: 'Avril 2026',
    subtotalLabel: 'مجموع شهر افريل',
    days: 30,
    monthPrefix: 'avr.',
    year: 2026,
    monthNum: 4,
  },
  {
    id: 'may-2026',
    nameAr: 'ماي 2026',
    nameFr: 'Mai 2026',
    subtotalLabel: 'مجموع شهر ماي',
    days: 31,
    monthPrefix: 'mai',
    year: 2026,
    monthNum: 5,
  },
  {
    id: 'jun-2026',
    nameAr: 'جوان 2026',
    nameFr: 'Juin 2026',
    subtotalLabel: 'مجموع شهر جوان',
    days: 30,
    monthPrefix: 'juin',
    year: 2026,
    monthNum: 6,
  },
  {
    id: 'jul-2026',
    nameAr: 'جويلية 2026',
    nameFr: 'Juillet 2026',
    subtotalLabel: 'مجموع شهر جويلية',
    days: 31,
    monthPrefix: 'juil.',
    year: 2026,
    monthNum: 7,
  },
];

// Default recipients list for quick assignment
export const DEFAULT_RECIPIENTS = [
  'محمد بوري (الخزينة المركزية)',
  'سارة منصوري (أمينة الصندوق)',
  'إبراهيم بن عيسى (مسؤول الحسابات)',
  'أمين صندوق المركز',
  'أمين صندوق الروضة',
];

/**
 * Generate initial daily rows for all 11 months (334 days)
 * Populated with realistic school remittance figures for weekdays, and 0 for off-days
 */
export function generateInitialDeliveryLedger() {
  const rows = [];

  DELIVERY_MONTHS.forEach((month) => {
    for (let d = 1; d <= month.days; d++) {
      const dateStr = `${d}-${month.monthPrefix}-${month.year}`;
      const rowId = `del-${month.year}-${String(month.monthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      // Determine if this day has a sample delivery
      // Seed some realistic data for Sept, Oct, Nov, Dec, Jan, Feb
      let amount = 0;
      let receipt = '';
      let recipient = '';
      let notes = '';
      let branchId = (d % 3 === 0) ? 'RAWDA' : 'CENTER';

      // Example pattern: every few days has registered handovers
      const isHandoverDay = (d % 2 === 1 && d <= 25) || (d === 28 || d === 30);
      
      if (month.year === 2025 || (month.year === 2026 && month.monthNum <= 2)) {
        if (isHandoverDay) {
          // Realistic Algerian Dinar daily cash drawer remittance
          amount = (20 + ((d * 7) % 35)) * 1000; // e.g. 20,000 to 55,000 DZD
          receipt = `REC-${month.year}-${String(month.monthNum).padStart(2, '0')}${String(d).padStart(2, '0')}`;
          recipient = (d % 2 === 0) ? 'سارة منصوري (الخزينة)' : 'محمد بوري (الخزينة المركزية)';
          notes = d % 5 === 0 
            ? 'تسليم إيرادات أقساط سوربان وحضانة' 
            : d % 3 === 0 
            ? 'ترحيل سيولة نقدية نهاية الدوام' 
            : 'مقبوضات رسوم التسجيل والاشتراكات';
        }
      }

      rows.push({
        id: rowId,
        monthId: month.id,
        day: d,
        dateString: dateStr,
        receipt: receipt,
        amount: amount,
        recipient: recipient,
        notes: notes,
        branchId: branchId,
      });
    }
  });

  return rows;
}

/**
 * Calculate totals for each month and grand total
 */
export function computeDeliveryLedgerStats(rows) {
  const monthlyTotals = {};
  let grandTotal = 0;
  let nonZeroCount = 0;

  DELIVERY_MONTHS.forEach((m) => {
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

export const MOCK_DELIVERY_LEDGER = generateInitialDeliveryLedger();
