/**
 * ==============================================================================
 * 3ABAQIRA ENTERPRISE MOCK DATASETS (VISUAL PROTOTYPE SCOPE)
 * ==============================================================================
 * These datasets power the non-practical visual UI model.
 * Zero backend connections or API bindings are executed in this phase.
 * ==============================================================================
 */

export const MOCK_BRANCHES = [
  { id: 'CENTER', nameAr: 'أكاديمية الأطفال العباقرة - المركز', nameEn: '3abaqira Academy - Center', code: 'CENTER' },
  { id: 'RAWDA', nameAr: 'روضة وحضانة الأطفال العباقرة', nameEn: '3abaqira Kindergarten & Daycare', code: 'RAWDA' },
];

export const MOCK_METRICS = {
  totalStudents: {
    value: 273,
    labelAr: 'إجمالي الطلاب المسجلين',
    labelEn: 'Total Enrolled Students',
    change: '+12.4%',
    isPositive: true,
    subtextAr: 'موزعين بين الأكاديمية والروضة',
  },
  liveCashDrawer: {
    value: '142,500 دج',
    labelAr: 'رصيد الصندوق اليومي النشط',
    labelEn: 'Daily Cash Register Balance',
    change: '+8,000 دج اليوم',
    isPositive: true,
    subtextAr: 'مطابق ومغلق مع وصل الخزينة',
  },
  activePrograms: {
    value: 9,
    labelAr: 'البرامج التعليمية النشطة',
    labelEn: 'Active Educational Programs',
    change: '8 مركز + 1 روضة',
    isPositive: true,
    subtextAr: 'السوروبان، الروبوتيك، القرآن...',
  },
  kitchenSupplyStatus: {
    value: '100% تم التموين',
    labelAr: 'حالة تموين المطبخ والمخبزة',
    labelEn: 'Cafeteria Procurement Status',
    change: 'مستقر',
    isPositive: true,
    subtextAr: 'سجل الخبز والمشتريات الأسبوعية',
  },
};

export const MOCK_STUDENTS_ROSTER = [
  {
    id: 1,
    studentCode: 'STD-2026-0001',
    fullNameAr: 'محمد بلقاسم',
    fullNameFr: 'Belkacem Mohammed',
    branchId: 'CENTER',
    program: 'الحساب الذهني (السوروبان)',
    level: 'المستوى الثاني (p2)',
    paymentStatus: 'PAID',
    amountDue: '12,000 دج',
    amountPaid: '12,000 دج',
    enrollmentDate: '2026-09-01',
    coachName: 'أستاذ يوسف بن عيسى',
  },
  {
    id: 2,
    studentCode: 'STD-2026-0002',
    fullNameAr: 'فاطمة الزهراء بن صالح',
    fullNameFr: 'Bensaleh Fatima Zohra',
    branchId: 'RAWDA',
    program: 'الروضة والحضانة (Grand Section)',
    level: 'الفوج الأول (GS-1)',
    paymentStatus: 'PARTIAL',
    amountDue: '14,000 دج',
    amountPaid: '7,000 دج',
    enrollmentDate: '2026-09-02',
    coachName: 'المربية مريم قاسمي',
  },
  {
    id: 3,
    studentCode: 'STD-2026-0003',
    fullNameAr: 'ياسين بوعبد الله',
    fullNameFr: 'Bouabdallah Yassine',
    branchId: 'CENTER',
    program: 'الروبوتيك والذكاء الاصطناعي',
    level: 'المستوى المتقدم (Robo-3)',
    paymentStatus: 'PAID',
    amountDue: '16,000 دج',
    amountPaid: '16,000 دج',
    enrollmentDate: '2026-09-03',
    coachName: 'المهندس كريم علام',
  },
  {
    id: 4,
    studentCode: 'STD-2026-0004',
    fullNameAr: 'خديجة منصور',
    fullNameFr: 'Mansour Khadidja',
    branchId: 'CENTER',
    program: 'تحفيظ القرآن الكريم',
    level: 'فوج حفظ جزء عم',
    paymentStatus: 'OVERDUE',
    amountDue: '4,000 دج',
    amountPaid: '0 دج',
    enrollmentDate: '2026-09-05',
    coachName: 'الشيخ عبد الرحمن',
  },
  {
    id: 5,
    studentCode: 'STD-2026-0005',
    fullNameAr: 'أمين طاهري',
    fullNameFr: 'Taheri Amine',
    branchId: 'RAWDA',
    program: 'الحضانة اليومية (Bébé Section)',
    level: 'قسم الرضع والأطفال',
    paymentStatus: 'PAID',
    amountDue: '15,000 دج',
    amountPaid: '15,000 دج',
    enrollmentDate: '2026-09-06',
    coachName: 'المربية سهام',
  },
  {
    id: 6,
    studentCode: 'STD-2026-0006',
    fullNameAr: 'سارة شريف',
    fullNameFr: 'Cherif Sara',
    branchId: 'CENTER',
    program: 'اللغات الحية (Français Niveau A2)',
    level: 'الفوج ب (A2-B)',
    paymentStatus: 'PARTIAL',
    amountDue: '13,500 دج',
    amountPaid: '9,000 دج',
    enrollmentDate: '2026-09-08',
    coachName: 'أستاذة صونية حمدي',
  },
];

export const MOCK_PROGRAMS = [
  { id: 'SOROBAN', nameAr: 'الحساب الذهني (السوروبان)', category: 'Academy', levelsCount: 6, studentsCount: 94, color: '#3b82f6' },
  { id: 'DAYCARE', nameAr: 'الروضة والحضانة اليومية', category: 'Daycare', levelsCount: 4, studentsCount: 82, color: '#06b6d4' },
  { id: 'ROBOTICS', nameAr: 'الروبوتيك والذكاء الاصطناعي', category: 'Academy', levelsCount: 3, studentsCount: 38, color: '#60a5fa' },
  { id: 'QURAN', nameAr: 'تحفيظ القرآن الكريم', category: 'Academy', levelsCount: 2, studentsCount: 45, color: '#2563eb' },
  { id: 'LANGUAGES', nameAr: 'اللغات الأجنبية (مستويات ودعم)', category: 'Academy', levelsCount: 5, studentsCount: 51, color: '#1d4ed8' },
];

export const MOCK_CASH_DRAWER_TRANSACTIONS = [
  { id: 1, type: 'INCOME', descAr: 'وصل تسجيل طالب: محمد بلقاسم (سوروبان)', voucherNo: 'REC-CTR-2026-0012', amount: '+12,000 دج', time: '09:15' },
  { id: 2, type: 'INCOME', descAr: 'دفعة قسط روضة: فاطمة الزهراء بن صالح', voucherNo: 'REC-RWD-2026-0008', amount: '+7,000 دج', time: '10:30' },
  { id: 3, type: 'EXPENSE', descAr: 'فاتورة مخبزة النور (شراء 80 خبزة للمطعم)', voucherNo: 'EXP-RWD-2026-0004', amount: '-1,200 دج', time: '11:45' },
  { id: 4, type: 'INCOME', descAr: 'تسجيل ورشة روبوتيك: ياسين بوعبد الله', voucherNo: 'REC-CTR-2026-0013', amount: '+16,000 دج', time: '14:20' },
  { id: 5, type: 'EXPENSE', descAr: 'مواد تنظيف ولوازم مكتبية مستعجلة', voucherNo: 'EXP-CTR-2026-0005', amount: '-2,500 دج', time: '16:00' },
];
