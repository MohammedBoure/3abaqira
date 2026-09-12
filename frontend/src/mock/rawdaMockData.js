/**
 * ==============================================================================
 * RAWDA (KINDERGARTEN & DAYCARE) MOCK DATASET
 * Aligned with docs/frontend.md specification & legacy rawda.xlsx
 * ==============================================================================
 */

export const RAWDA_MONTHS = [
  { id: 'sep', nameAr: 'سبتمبر', shortAr: 'سبت' },
  { id: 'oct', nameAr: 'أكتوبر', shortAr: 'أكت' },
  { id: 'nov', nameAr: 'نوفمبر', shortAr: 'نوف' },
  { id: 'dec', nameAr: 'ديسمبر', shortAr: 'ديس' },
  { id: 'jan', nameAr: 'جانفي', shortAr: 'جان' },
  { id: 'feb', nameAr: 'فيفري', shortAr: 'فيف' },
  { id: 'mar', nameAr: 'مارس', shortAr: 'مار' },
  { id: 'apr', nameAr: 'أفريل', shortAr: 'أفر' },
  { id: 'may', nameAr: 'ماي', shortAr: 'ماي' },
  { id: 'jun', nameAr: 'جوان', shortAr: 'جوا' },
  { id: 'jul', nameAr: 'جويلية', shortAr: 'جوي' },
];

/**
 * 1. سجل الأطفال والتسجيل السنوي والشهري
 * Standard Registration Fee: 8,000 DA
 * Annual Offer (2025): 121,500 DA (monthly fee becomes 0)
 * Standard Monthly Fee: 14,500 DA
 */
export const MOCK_RAWDA_STUDENTS = [
  {
    id: 'RWD-001',
    seqNumber: 1,
    ageCategory: 'Bébé',
    fullName: 'آدم بلقاسم',
    registrationFee: 8000,
    annualOffer: 121500,
    monthlyDue: 0,
    paymentStatus: 'خالص كلياً',
    guardianPhone: '0550 11 22 33',
    guardianName: 'أحمد بلقاسم',
    room: 'Bébé',
    months: {
      sep: { paid: 0, status: 'عرض سنوي', receipt: 'REC-RWD-ANN-01' },
      oct: { paid: 0, status: 'عرض سنوي', receipt: 'REC-RWD-ANN-01' },
      nov: { paid: 0, status: 'عرض سنوي', receipt: 'REC-RWD-ANN-01' },
      dec: { paid: 0, status: 'عرض سنوي', receipt: 'REC-RWD-ANN-01' },
      jan: { paid: 0, status: 'عرض سنوي', receipt: 'REC-RWD-ANN-01' },
      feb: { paid: 0, status: 'عرض سنوي', receipt: 'REC-RWD-ANN-01' },
      mar: { paid: 0, status: 'عرض سنوي', receipt: 'REC-RWD-ANN-01' },
      apr: { paid: 0, status: 'عرض سنوي', receipt: 'REC-RWD-ANN-01' },
      may: { paid: 0, status: 'عرض سنوي', receipt: 'REC-RWD-ANN-01' },
      jun: { paid: 0, status: 'عرض سنوي', receipt: 'REC-RWD-ANN-01' },
      jul: { paid: 0, status: 'عرض سنوي', receipt: 'REC-RWD-ANN-01' },
    },
    totalPaid: 129500,
    remainingBalance: 0,
  },
  {
    id: 'RWD-002',
    seqNumber: 2,
    ageCategory: 'Petit Section',
    fullName: 'سيلين بن عيسى',
    registrationFee: 8000,
    annualOffer: 0,
    monthlyDue: 14500,
    paymentStatus: 'مسدد شهرياً',
    guardianPhone: '0661 44 55 66',
    guardianName: 'كريم بن عيسى',
    room: 'Petit Section 1',
    months: {
      sep: { paid: 14500, status: 'مسدد', receipt: 'REC-RWD-26-002' },
      oct: { paid: 14500, status: 'مسدد', receipt: 'REC-RWD-26-045' },
      nov: { paid: 14500, status: 'مسدد', receipt: 'REC-RWD-26-089' },
      dec: { paid: 14500, status: 'مسدد', receipt: 'REC-RWD-26-112' },
      jan: { paid: 14500, status: 'مسدد', receipt: 'REC-RWD-26-140' },
      feb: { paid: 14500, status: 'مسدد', receipt: 'REC-RWD-26-198' },
      mar: { paid: 0, status: 'مستحق', receipt: '' },
      apr: { paid: 0, status: 'مستحق', receipt: '' },
      may: { paid: 0, status: 'مستحق', receipt: '' },
      jun: { paid: 0, status: 'مستحق', receipt: '' },
      jul: { paid: 0, status: 'مستحق', receipt: '' },
    },
    totalPaid: 95000,
    remainingBalance: 0,
  },
  {
    id: 'RWD-003',
    seqNumber: 3,
    ageCategory: 'Moyen Section',
    fullName: 'أيوب عمراوي',
    registrationFee: 8000,
    annualOffer: 0,
    monthlyDue: 14500,
    paymentStatus: 'توجد ديون',
    guardianPhone: '0770 77 88 99',
    guardianName: 'فريد عمراوي',
    room: 'Moyen Section - 1',
    months: {
      sep: { paid: 14500, status: 'مسدد', receipt: 'REC-RWD-26-003' },
      oct: { paid: 14500, status: 'مسدد', receipt: 'REC-RWD-26-046' },
      nov: { paid: 7000, status: 'جزئي', receipt: 'REC-RWD-26-090' },
      dec: { paid: 0, status: 'متأخر', receipt: '' },
      jan: { paid: 0, status: 'متأخر', receipt: '' },
      feb: { paid: 0, status: 'متأخر', receipt: '' },
      mar: { paid: 0, status: 'مستحق', receipt: '' },
      apr: { paid: 0, status: 'مستحق', receipt: '' },
      may: { paid: 0, status: 'مستحق', receipt: '' },
      jun: { paid: 0, status: 'مستحق', receipt: '' },
      jul: { paid: 0, status: 'مستحق', receipt: '' },
    },
    totalPaid: 44000,
    remainingBalance: 22000,
  },
  {
    id: 'RWD-004',
    seqNumber: 4,
    ageCategory: 'Grand Section',
    fullName: 'ياسمين قندوز',
    registrationFee: 8000,
    annualOffer: 121500,
    monthlyDue: 0,
    paymentStatus: 'خالص كلياً',
    guardianPhone: '0555 99 88 77',
    guardianName: 'رشيد قندوز',
    room: 'Grand Section - 1',
    months: {
      sep: { paid: 0, status: 'عرض سنوي', receipt: 'REC-RWD-ANN-02' },
      oct: { paid: 0, status: 'عرض سنوي', receipt: 'REC-RWD-ANN-02' },
      nov: { paid: 0, status: 'عرض سنوي', receipt: 'REC-RWD-ANN-02' },
      dec: { paid: 0, status: 'عرض سنوي', receipt: 'REC-RWD-ANN-02' },
      jan: { paid: 0, status: 'عرض سنوي', receipt: 'REC-RWD-ANN-02' },
      feb: { paid: 0, status: 'عرض سنوي', receipt: 'REC-RWD-ANN-02' },
      mar: { paid: 0, status: 'عرض سنوي', receipt: 'REC-RWD-ANN-02' },
      apr: { paid: 0, status: 'عرض سنوي', receipt: 'REC-RWD-ANN-02' },
      may: { paid: 0, status: 'عرض سنوي', receipt: 'REC-RWD-ANN-02' },
      jun: { paid: 0, status: 'عرض سنوي', receipt: 'REC-RWD-ANN-02' },
      jul: { paid: 0, status: 'عرض سنوي', receipt: 'REC-RWD-ANN-02' },
    },
    totalPaid: 129500,
    remainingBalance: 0,
  },
  {
    id: 'RWD-005',
    seqNumber: 5,
    ageCategory: 'Petit Section',
    fullName: 'إلياس مزياني',
    registrationFee: 8000,
    annualOffer: 0,
    monthlyDue: 14500,
    paymentStatus: 'مسدد شهرياً',
    guardianPhone: '0662 12 34 56',
    guardianName: 'طاهر مزياني',
    room: 'Petit Section 1-1',
    months: {
      sep: { paid: 14500, status: 'مسدد', receipt: 'REC-RWD-26-005' },
      oct: { paid: 14500, status: 'مسدد', receipt: 'REC-RWD-26-048' },
      nov: { paid: 14500, status: 'مسدد', receipt: 'REC-RWD-26-092' },
      dec: { paid: 14500, status: 'مسدد', receipt: 'REC-RWD-26-115' },
      jan: { paid: 14500, status: 'مسدد', receipt: 'REC-RWD-26-144' },
      feb: { paid: 14500, status: 'مسدد', receipt: 'REC-RWD-26-202' },
      mar: { paid: 0, status: 'مستحق', receipt: '' },
      apr: { paid: 0, status: 'مستحق', receipt: '' },
      may: { paid: 0, status: 'مستحق', receipt: '' },
      jun: { paid: 0, status: 'مستحق', receipt: '' },
      jul: { paid: 0, status: 'مستحق', receipt: '' },
    },
    totalPaid: 95000,
    remainingBalance: 0,
  },
  {
    id: 'RWD-006',
    seqNumber: 6,
    ageCategory: 'Moyen Section',
    fullName: 'ملاك بوحفص',
    registrationFee: 8000,
    annualOffer: 0,
    monthlyDue: 14500,
    paymentStatus: 'توجد ديون',
    guardianPhone: '0772 33 44 55',
    guardianName: 'سفيان بوحفص',
    room: 'Moyen Section - 2',
    months: {
      sep: { paid: 14500, status: 'مسدد', receipt: 'REC-RWD-26-006' },
      oct: { paid: 14500, status: 'مسدد', receipt: 'REC-RWD-26-049' },
      nov: { paid: 14500, status: 'مسدد', receipt: 'REC-RWD-26-093' },
      dec: { paid: 0, status: 'متأخر', receipt: '' },
      jan: { paid: 0, status: 'متأخر', receipt: '' },
      feb: { paid: 0, status: 'متأخر', receipt: '' },
      mar: { paid: 0, status: 'مستحق', receipt: '' },
      apr: { paid: 0, status: 'مستحق', receipt: '' },
      may: { paid: 0, status: 'مستحق', receipt: '' },
      jun: { paid: 0, status: 'مستحق', receipt: '' },
      jul: { paid: 0, status: 'مستحق', receipt: '' },
    },
    totalPaid: 51500,
    remainingBalance: 43500,
  },
  {
    id: 'RWD-007',
    seqNumber: 7,
    ageCategory: 'Grand Section',
    fullName: 'محمد الأمين زروقي',
    registrationFee: 8000,
    annualOffer: 0,
    monthlyDue: 14500,
    paymentStatus: 'مسدد شهرياً',
    guardianPhone: '0558 11 22 44',
    guardianName: 'عادل زروقي',
    room: 'Grand Section - 2',
    months: {
      sep: { paid: 14500, status: 'مسدد', receipt: 'REC-RWD-26-007' },
      oct: { paid: 14500, status: 'مسدد', receipt: 'REC-RWD-26-050' },
      nov: { paid: 14500, status: 'مسدد', receipt: 'REC-RWD-26-094' },
      dec: { paid: 14500, status: 'مسدد', receipt: 'REC-RWD-26-116' },
      jan: { paid: 14500, status: 'مسدد', receipt: 'REC-RWD-26-145' },
      feb: { paid: 14500, status: 'مسدد', receipt: 'REC-RWD-26-203' },
      mar: { paid: 0, status: 'مستحق', receipt: '' },
      apr: { paid: 0, status: 'مستحق', receipt: '' },
      may: { paid: 0, status: 'مستحق', receipt: '' },
      jun: { paid: 0, status: 'مستحق', receipt: '' },
      jul: { paid: 0, status: 'مستحق', receipt: '' },
    },
    totalPaid: 95000,
    remainingBalance: 0,
  },
  {
    id: 'RWD-008',
    seqNumber: 8,
    ageCategory: 'Bébé',
    fullName: 'ريتال شريفي',
    registrationFee: 8000,
    annualOffer: 0,
    monthlyDue: 14500,
    paymentStatus: 'مسدد شهرياً',
    guardianPhone: '0663 88 77 66',
    guardianName: 'مراد شريفي',
    room: 'Bébé',
    months: {
      sep: { paid: 14500, status: 'مسدد', receipt: 'REC-RWD-26-008' },
      oct: { paid: 14500, status: 'مسدد', receipt: 'REC-RWD-26-051' },
      nov: { paid: 14500, status: 'مسدد', receipt: 'REC-RWD-26-095' },
      dec: { paid: 14500, status: 'مسدد', receipt: 'REC-RWD-26-117' },
      jan: { paid: 14500, status: 'مسدد', receipt: 'REC-RWD-26-146' },
      feb: { paid: 14500, status: 'مسدد', receipt: 'REC-RWD-26-204' },
      mar: { paid: 0, status: 'مستحق', receipt: '' },
      apr: { paid: 0, status: 'مستحق', receipt: '' },
      may: { paid: 0, status: 'مستحق', receipt: '' },
      jun: { paid: 0, status: 'مستحق', receipt: '' },
      jul: { paid: 0, status: 'مستحق', receipt: '' },
    },
    totalPaid: 95000,
    remainingBalance: 0,
  },
];

/**
 * 2. تنظيم وقاعات الأفواج (10 Rooms Kanban)
 */
export const MOCK_RAWDA_ROOMS = [
  {
    id: 'bebe',
    name: 'Bébé',
    category: 'Bébé',
    educator: 'مريم قاسمي',
    maxCapacity: 10,
    color: 'border-pink-300 bg-pink-50/40',
    children: [
      { id: 'c1', name: 'آدم بلقاسم', birthDate: '2023-11-14', gender: 'ذكر', contact: '0550 11 22 33' },
      { id: 'c2', name: 'ريتال شريفي', birthDate: '2024-02-05', gender: 'أنثى', contact: '0663 88 77 66' },
      { id: 'c3', name: 'كنان بوعكاز', birthDate: '2023-10-20', gender: 'ذكر', contact: '0770 12 34 56' },
    ],
  },
  {
    id: 'ps-1',
    name: 'Petit Section 1',
    category: 'Petit Section',
    educator: 'فاطمة قدور',
    maxCapacity: 15,
    color: 'border-amber-300 bg-amber-50/40',
    children: [
      { id: 'c4', name: 'سيلين بن عيسى', birthDate: '2022-04-12', gender: 'أنثى', contact: '0661 44 55 66' },
      { id: 'c5', name: 'جاد دراجي', birthDate: '2022-07-19', gender: 'ذكر', contact: '0551 22 33 44' },
      { id: 'c6', name: 'مروى زروال', birthDate: '2022-03-30', gender: 'أنثى', contact: '0771 55 66 77' },
    ],
  },
  {
    id: 'ps-1-1',
    name: 'Petit Section 1-1',
    category: 'Petit Section',
    educator: 'نورة بلحاج',
    maxCapacity: 15,
    color: 'border-amber-300 bg-amber-50/40',
    children: [
      { id: 'c7', name: 'إلياس مزياني', birthDate: '2022-05-18', gender: 'ذكر', contact: '0662 12 34 56' },
      { id: 'c8', name: 'سارة حداد', birthDate: '2022-09-02', gender: 'أنثى', contact: '0552 33 44 55' },
    ],
  },
  {
    id: 'ps-1-2',
    name: 'Petit Section 1-2',
    category: 'Petit Section',
    educator: 'سهام رحموني',
    maxCapacity: 15,
    color: 'border-amber-300 bg-amber-50/40',
    children: [
      { id: 'c9', name: 'أنس حملاوي', birthDate: '2022-01-25', gender: 'ذكر', contact: '0772 44 55 66' },
      { id: 'c10', name: 'لانا قاضي', birthDate: '2022-08-11', gender: 'أنثى', contact: '0663 55 66 77' },
    ],
  },
  {
    id: 'ms-1',
    name: 'Moyen Section - 1',
    category: 'Moyen Section',
    educator: 'خديجة علالي',
    maxCapacity: 18,
    color: 'border-blue-300 bg-blue-50/40',
    children: [
      { id: 'c11', name: 'أيوب عمراوي', birthDate: '2021-06-14', gender: 'ذكر', contact: '0770 77 88 99' },
      { id: 'c12', name: 'ندى مسعودي', birthDate: '2021-09-22', gender: 'أنثى', contact: '0553 66 77 88' },
    ],
  },
  {
    id: 'ms-2',
    name: 'Moyen Section - 2',
    category: 'Moyen Section',
    educator: 'كريمة بن سعيد',
    maxCapacity: 18,
    color: 'border-blue-300 bg-blue-50/40',
    children: [
      { id: 'c13', name: 'ملاك بوحفص', birthDate: '2021-03-08', gender: 'أنثى', contact: '0772 33 44 55' },
      { id: 'c14', name: 'وسيم طاهر', birthDate: '2021-11-17', gender: 'ذكر', contact: '0664 77 88 99' },
    ],
  },
  {
    id: 'ms-3',
    name: 'Moyen Section - 3',
    category: 'Moyen Section',
    educator: 'إيمان بن عيسى',
    maxCapacity: 18,
    color: 'border-blue-300 bg-blue-50/40',
    children: [
      { id: 'c15', name: 'ريان شلبي', birthDate: '2021-05-29', gender: 'ذكر', contact: '0554 88 99 00' },
      { id: 'c16', name: 'رنيم بلقاضي', birthDate: '2021-12-04', gender: 'أنثى', contact: '0773 99 00 11' },
    ],
  },
  {
    id: 'gs-1',
    name: 'Grand Section - 1',
    category: 'Grand Section',
    educator: 'حسيبة ميموني',
    maxCapacity: 20,
    color: 'border-emerald-300 bg-emerald-50/40',
    children: [
      { id: 'c17', name: 'ياسمين قندوز', birthDate: '2020-04-16', gender: 'أنثى', contact: '0555 99 88 77' },
      { id: 'c18', name: 'أكرم بوعزة', birthDate: '2020-07-23', gender: 'ذكر', contact: '0665 00 11 22' },
    ],
  },
  {
    id: 'gs-2',
    name: 'Grand Section - 2',
    category: 'Grand Section',
    educator: 'أسماء حميدي',
    maxCapacity: 20,
    color: 'border-emerald-300 bg-emerald-50/40',
    children: [
      { id: 'c19', name: 'محمد الأمين زروقي', birthDate: '2020-02-19', gender: 'ذكر', contact: '0558 11 22 44' },
      { id: 'c20', name: 'سيرين كمال', birthDate: '2020-10-09', gender: 'أنثى', contact: '0556 11 22 33' },
    ],
  },
  {
    id: 'gs-3',
    name: 'Grand Section - 3',
    category: 'Grand Section',
    educator: 'ليلى طاهري',
    maxCapacity: 20,
    color: 'border-emerald-300 bg-emerald-50/40',
    children: [
      { id: 'c21', name: 'هيثم بن جدو', birthDate: '2020-06-30', gender: 'ذكر', contact: '0774 22 33 44' },
      { id: 'c22', name: 'آية لعريبي', birthDate: '2020-08-14', gender: 'أنثى', contact: '0666 33 44 55' },
    ],
  },
];

/**
 * 3. سجل المصاريف اليومية
 */
export const MOCK_RAWDA_DAILY_EXPENSES = [
  { id: 'exp-1', date: '2026-02-01', month: 'feb', description: 'شراء مواد تنظيف ومعقمات صحية', amount: 4800, paymentMethod: 'نقداً (صندوق)', voucher: 'VCH-EXP-01' },
  { id: 'exp-2', date: '2026-02-02', month: 'feb', description: 'شراء خضر وفواكه طازجة للمطبخ', amount: 6500, paymentMethod: 'نقداً (صندوق)', voucher: 'VCH-EXP-02' },
  { id: 'exp-3', date: '2026-02-03', month: 'feb', description: 'توريد حفاضات ومناديل مبللة للرضع', amount: 8200, paymentMethod: 'نقداً (صندوق)', voucher: 'VCH-EXP-03' },
  { id: 'exp-4', date: '2026-02-04', month: 'feb', description: 'شراء لحم بقري ودجاج بلدي للأسبوع', amount: 14200, paymentMethod: 'نقداً (صندوق)', voucher: 'VCH-EXP-04' },
  { id: 'exp-5', date: '2026-02-05', month: 'feb', description: 'فاتورة توريد الخبز اليومي (الأسبوع 1)', amount: 2400, paymentMethod: 'نقداً (صندوق)', voucher: 'VCH-EXP-05' },
  { id: 'exp-6', date: '2026-02-08', month: 'feb', description: 'شراء ألبان وياوغورت للأطفال', amount: 5300, paymentMethod: 'نقداً (صندوق)', voucher: 'VCH-EXP-06' },
  { id: 'exp-7', date: '2026-02-10', month: 'feb', description: 'صيانة سخان المياه وقفل القاعة 3', amount: 3500, paymentMethod: 'نقداً (صندوق)', voucher: 'VCH-EXP-07' },
  { id: 'exp-8', date: '2026-02-12', month: 'feb', description: 'شراء أدوات رسم، ألوان وصلصال تربوي', amount: 7600, paymentMethod: 'نقداً (صندوق)', voucher: 'VCH-EXP-08' },
  { id: 'exp-9', date: '2026-02-15', month: 'feb', description: 'شراء مواد جافة (سكر، حليب، أرز، عجائن)', amount: 9800, paymentMethod: 'نقداً (صندوق)', voucher: 'VCH-EXP-09' },
  { id: 'exp-10', date: '2026-02-18', month: 'feb', description: 'توريد عبوات ماء معدني 5 لتر (20 عبوة)', amount: 3600, paymentMethod: 'نقداً (صندوق)', voucher: 'VCH-EXP-10' },
];

/**
 * 4. ملخص المصاريف وتحليل الموازنة (Variance Analysis)
 * The 7 approved categories:
 * (حفاظات ومواد تنظيف | المصروف اليومي | مواد جافة | الخبز | خضر وفواكه | ياوغورت وألبان | اللحم والدجاج)
 */
export const MOCK_RAWDA_BUDGET_VARIANCE = [
  {
    category: 'حفاظات ومواد تنظيف',
    unitQuantity: 'شهري / 25 كرتون',
    estimatedBudget: 35000,
    actualSpent: 32400,
  },
  {
    category: 'المصروف اليومي',
    unitQuantity: 'مشتريات طارئة ونثريات',
    estimatedBudget: 20000,
    actualSpent: 18200,
  },
  {
    category: 'مواد جافة',
    unitQuantity: 'حبوب، عجائن، بقالة',
    estimatedBudget: 40000,
    actualSpent: 42500,
  },
  {
    category: 'الخبز',
    unitQuantity: '22 يوم دراسي × 18 خبزة',
    estimatedBudget: 5940,
    actualSpent: 5500,
  },
  {
    category: 'خضر وفواكه',
    unitQuantity: 'توريد أسبوعي طازج',
    estimatedBudget: 28000,
    actualSpent: 26000,
  },
  {
    category: 'ياوغورت وألبان',
    unitQuantity: 'وجبة اللمجة اليومية',
    estimatedBudget: 24000,
    actualSpent: 22800,
  },
  {
    category: 'اللحم والدجاج',
    unitQuantity: 'لحم بقري ودجاج طازج',
    estimatedBudget: 60000,
    actualSpent: 64000,
  },
];

/**
 * 5. الملخص اليومي للصندوق
 * Formula: الباقي في الصندوق = رصيد الافتتاح + المداخيل - المصاريف - المسلّم
 */
export const MOCK_RAWDA_CASH_DRAWER = [
  { id: 'drw-1', date: '2026-02-15', openingBalance: 25000, income: 43500, expenses: 9800, delivered: 40000, finalBalance: 18700 },
  { id: 'drw-2', date: '2026-02-16', openingBalance: 18700, income: 37000, expenses: 5400, delivered: 35000, finalBalance: 15300 },
  { id: 'drw-3', date: '2026-02-17', openingBalance: 15300, income: 52000, expenses: 14200, delivered: 35000, finalBalance: 18100 },
  { id: 'drw-4', date: '2026-02-18', openingBalance: 18100, income: 29000, expenses: 3600, delivered: 30000, finalBalance: 13500 },
  { id: 'drw-5', date: '2026-02-19', openingBalance: 13500, income: 48500, expenses: 7600, delivered: 40000, finalBalance: 14400 },
];

/**
 * 6. سجل تسليم السيولة والعهد
 */
export const MOCK_RAWDA_CASH_HANDOVER = [
  { id: 'hnd-1', date: '2026-02-15', receiptNumber: 'REC-HDV-RWD-01', amount: 40000, receiverName: 'محمد بوري (المدير العام)', notes: 'إيداع إيرادات التسجيلات بالخزينة المركزية' },
  { id: 'hnd-2', date: '2026-02-16', receiptNumber: 'REC-HDV-RWD-02', amount: 35000, receiverName: 'محمد بوري (المدير العام)', notes: 'تسليم سيولة الاشتراكات اليومية' },
  { id: 'hnd-3', date: '2026-02-17', receiptNumber: 'REC-HDV-RWD-03', amount: 35000, receiverName: 'صلاح الدين (المسؤول المالي)', notes: 'تحويل عهدة للمصرف' },
  { id: 'hnd-4', date: '2026-02-18', receiptNumber: 'REC-HDV-RWD-04', amount: 30000, receiverName: 'محمد بوري (المدير العام)', notes: 'تسليم نقدي مباشر بعد الإغلاق' },
  { id: 'hnd-5', date: '2026-02-19', receiptNumber: 'REC-HDV-RWD-05', amount: 40000, receiverName: 'صلاح الدين (المسؤول المالي)', notes: 'تسليم سيولة نهاية الأسبوع' },
];

/**
 * 7. المراقبة اليومية لاستهلاك الخبز
 * Week 1 to 5, Days: الأحد إلى الخميس, Meals: كسكس, سباغيتي, بيري, عدس, معكرونة
 */
export const MOCK_RAWDA_BREAD_TRACKING = [
  { id: 'brd-1', week: 1, day: 'الأحد', meal: 'عدس بالخضار واللحم', breadCount: 20, unitPrice: 15, totalAmount: 300, notes: 'استهلاك منتظم، لا يوجد فائض' },
  { id: 'brd-2', week: 1, day: 'الإثنين', meal: 'سباغيتي بصلصة الطماطم والجبن', breadCount: 15, unitPrice: 15, totalAmount: 225, notes: 'وجبة خفيفة مع سلطة' },
  { id: 'brd-3', week: 1, day: 'الثلاثاء', meal: 'بيري (بطاطا مهروسة) مع الدجاج', breadCount: 18, unitPrice: 15, totalAmount: 270, notes: 'استهلاك طبيعي' },
  { id: 'brd-4', week: 1, day: 'الأربعاء', meal: 'كسكس تقليدي بالخضر والمرق', breadCount: 12, unitPrice: 15, totalAmount: 180, notes: 'انخفاض في استهلاك الخبز مع الكسكس' },
  { id: 'brd-5', week: 1, day: 'الخميس', meal: 'معكرونة بالخضار وسلطة الفواكه', breadCount: 18, unitPrice: 15, totalAmount: 270, notes: 'وجبة نهاية الأسبوع' },

  { id: 'brd-6', week: 2, day: 'الأحد', meal: 'لوبيا بيضاء باللحم البقري', breadCount: 22, unitPrice: 15, totalAmount: 330, notes: 'استهلاك كامل مع حساء شتوي' },
  { id: 'brd-7', week: 2, day: 'الإثنين', meal: 'بطاطا كوشة مع سكالوب مرحي', breadCount: 18, unitPrice: 15, totalAmount: 270, notes: 'استهلاك منتظم' },
  { id: 'brd-8', week: 2, day: 'الثلاثاء', meal: 'أرز مفور بالخضر والدجاج', breadCount: 14, unitPrice: 15, totalAmount: 210, notes: 'وفر خبز بمعدل 4 خبزات' },
  { id: 'brd-9', week: 2, day: 'الأربعاء', meal: 'بيري مع بيض مغلي وسلطة خضراء', breadCount: 17, unitPrice: 15, totalAmount: 255, notes: 'مطابق للبرمجة' },
  { id: 'brd-10', week: 2, day: 'الخميس', meal: 'كسكس بلحم البقر والقرع الأحمر', breadCount: 12, unitPrice: 15, totalAmount: 180, notes: 'وجبة يوم الخميس' },
];

/**
 * 8. طلبيات اللحوم والتموين الغذائي الأسبوعي
 * Categories: (اللحم البقري | الدجاج الكامل | سكالوب مرحي | الماء المعدني 5 لتر | البيض | الجبن)
 */
export const MOCK_RAWDA_MEAT_PROVISIONS = [
  { id: 'prv-1', week: 1, item: 'اللحم البقري الطازج', quantity: 12, unit: 'كغ', unitPrice: 2200, totalAmount: 26400, supplier: 'قصابة الأمانة - بحاية', notes: 'لحم هبرة طازج للوجبات الأسبوعية' },
  { id: 'prv-2', week: 1, item: 'الدجاج الكامل المنظف', quantity: 16, unit: 'كغ', unitPrice: 480, totalAmount: 7680, supplier: 'مداجن الهضاب', notes: 'دجاج مخصص لحساء الخضر والكسكس' },
  { id: 'prv-3', week: 1, item: 'سكالوب دجاج مرحي', quantity: 8, unit: 'كغ', unitPrice: 1100, totalAmount: 8800, supplier: 'قصابة الأمانة - بحاية', notes: 'مخصص لكريات اللحم للأفواج الصغار' },
  { id: 'prv-4', week: 1, item: 'ماء معدني عبوة 5 لتر', quantity: 24, unit: 'عبوة', unitPrice: 150, totalAmount: 3600, supplier: 'مؤسسة إفريقيا للتوزيع', notes: 'مخزون الشرب والطهي الصحي للأطفال' },
  { id: 'prv-5', week: 1, item: 'بيض طازج استهلاك غذائي', quantity: 4, unit: 'صينية (30 بيضة)', unitPrice: 580, totalAmount: 2320, supplier: 'مزرعة الخيرات', notes: 'لمجة الصباح وسلطة الظهر' },
  { id: 'prv-6', week: 1, item: 'جبن طري مخصص للأطفال', quantity: 15, unit: 'علبة (24 قطعة)', unitPrice: 320, totalAmount: 4800, supplier: 'مؤسسة إفريقيا للتوزيع', notes: 'وجبة اللمجة المسائية' },

  { id: 'prv-7', week: 2, item: 'اللحم البقري الطازج', quantity: 10, unit: 'كغ', unitPrice: 2200, totalAmount: 22000, supplier: 'قصابة الأمانة - بحاية', notes: 'استلام الأحد صباحاً' },
  { id: 'prv-8', week: 2, item: 'الدجاج الكامل المنظف', quantity: 14, unit: 'كغ', unitPrice: 480, totalAmount: 6720, supplier: 'مداجن الهضاب', notes: 'فحص الجودة والسلامة الصحية' },
  { id: 'prv-9', week: 2, item: 'سكالوب دجاج مرحي', quantity: 6, unit: 'كغ', unitPrice: 1100, totalAmount: 6600, supplier: 'قصابة الأمانة - بحاية', notes: 'مطابق للطلبية' },
  { id: 'prv-10', week: 2, item: 'ماء معدني عبوة 5 لتر', quantity: 20, unit: 'عبوة', unitPrice: 150, totalAmount: 3000, supplier: 'مؤسسة إفريقيا للتوزيع', notes: 'مخزون الأسبوع الثاني' },
];
