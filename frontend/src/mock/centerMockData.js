/**
 * ==============================================================================
 * CENTER (ACADEMIC CENTER & BEJAIA BRANCH) MOCK DATASET
 * Aligned with docs/frontend.md specification & legacy center.xlsx
 * ==============================================================================
 */

/**
 * 1. البرامج والدورات بنظام الدفعات (Installment Programs)
 * Shared schema for:
 * - support-classes: دروس الدعم العلمي والأدبي
 * - languages: برنامج اللغات الأجنبية - دورات المستويات
 * - robotics: نادي الروبوتيك والذكاء الاصطناعي
 * - school-languages: دروس دعم مناهج اللغات المدرسية
 */
export const MOCK_CENTER_PROGRAMS = {
  'support-classes': {
    titleAr: 'دروس الدعم العلمي والأدبي (رياضيات، علوم، لغات أساسية)',
    titleEn: 'Academic Tutoring & Core Sciences (Math, Sciences, Arabic)',
    students: [
      {
        id: 'STD-SUP-01',
        seq: 1,
        fullName: 'أيمن بوقرة',
        level: '4AM (رابعة متوسط)',
        coach: 'أ. عبد القادر مرابط',
        agreedFee: 18000,
        inst1: { amount: 5000, receipt: 'REC-SUP-26-01' },
        inst2: { amount: 5000, dueDate: '2026-01-15', receipt: 'REC-SUP-26-44' },
        inst3: { amount: 5000, dueDate: '2026-03-15', receipt: 'REC-SUP-26-88' },
        inst4: { amount: 3000, dueDate: '2026-05-15', receipt: 'REC-SUP-26-120' },
        totalPaid: 18000,
        remaining: 0,
        notes: 'دفعة كاملة منتظمة',
      },
      {
        id: 'STD-SUP-02',
        seq: 2,
        fullName: 'سيرين حيدوسي',
        level: '1AS (أولى ثانوي علمي)',
        coach: 'أ. كمال بن ناصر',
        agreedFee: 20000,
        inst1: { amount: 6000, receipt: 'REC-SUP-26-02' },
        inst2: { amount: 6000, dueDate: '2026-01-15', receipt: 'REC-SUP-26-45' },
        inst3: { amount: 0, dueDate: '2026-03-15', receipt: '' },
        inst4: { amount: 0, dueDate: '2026-05-15', receipt: '' },
        totalPaid: 12000,
        remaining: 8000,
        notes: 'الدفعة الثالثة مستحقة في مارس',
      },
      {
        id: 'STD-SUP-03',
        seq: 3,
        fullName: 'بلال غربي',
        level: '3AS (بكالوريا رياضيات)',
        coach: 'أ. عبد القادر مرابط',
        agreedFee: 24000,
        inst1: { amount: 6000, receipt: 'REC-SUP-26-03' },
        inst2: { amount: 6000, dueDate: '2026-01-15', receipt: 'REC-SUP-26-46' },
        inst3: { amount: 6000, dueDate: '2026-03-15', receipt: 'REC-SUP-26-89' },
        inst4: { amount: 0, dueDate: '2026-05-15', receipt: '' },
        totalPaid: 18000,
        remaining: 6000,
        notes: 'استفاد من تخفيض الأخوة',
      },
      {
        id: 'STD-SUP-04',
        seq: 4,
        fullName: 'نورهان دريد',
        level: '3AM (ثالثة متوسط)',
        coach: 'أ. نادية سعيدي',
        agreedFee: 16000,
        inst1: { amount: 4000, receipt: 'REC-SUP-26-04' },
        inst2: { amount: 4000, dueDate: '2026-01-15', receipt: 'REC-SUP-26-47' },
        inst3: { amount: 4000, dueDate: '2026-03-15', receipt: 'REC-SUP-26-90' },
        inst4: { amount: 4000, dueDate: '2026-05-15', receipt: 'REC-SUP-26-121' },
        totalPaid: 16000,
        remaining: 0,
        notes: 'خالص كلياً',
      },
    ],
  },
  'languages': {
    titleAr: 'برنامج اللغات الأجنبية - دورات المستويات (فرنسية، إنجليزية)',
    titleEn: 'Foreign Languages Mastery Courses (French, English CEFR Levels)',
    students: [
      {
        id: 'STD-LNG-01',
        seq: 1,
        fullName: 'خالد بن زينة',
        level: 'B1 - إنجليزية تواصل',
        coach: 'أ. إسلام عماري',
        agreedFee: 22000,
        inst1: { amount: 6000, receipt: 'REC-LNG-26-01' },
        inst2: { amount: 6000, dueDate: '2026-01-20', receipt: 'REC-LNG-26-15' },
        inst3: { amount: 5000, dueDate: '2026-03-20', receipt: 'REC-LNG-26-30' },
        inst4: { amount: 5000, dueDate: '2026-05-20', receipt: 'REC-LNG-26-45' },
        totalPaid: 22000,
        remaining: 0,
        notes: 'مسدد كلياً مع شهادة المستوى',
      },
      {
        id: 'STD-LNG-02',
        seq: 2,
        fullName: 'أميرة لوكيل',
        level: 'A2 - فرنسية عامة',
        coach: 'أ. صابرينا بن طيب',
        agreedFee: 18000,
        inst1: { amount: 5000, receipt: 'REC-LNG-26-02' },
        inst2: { amount: 5000, dueDate: '2026-01-20', receipt: 'REC-LNG-26-16' },
        inst3: { amount: 0, dueDate: '2026-03-20', receipt: '' },
        inst4: { amount: 0, dueDate: '2026-05-20', receipt: '' },
        totalPaid: 10000,
        remaining: 8000,
        notes: 'باقي قسطين',
      },
      {
        id: 'STD-LNG-03',
        seq: 3,
        fullName: 'طارق حمودي',
        level: 'B2 - Business English',
        coach: 'أ. إسلام عماري',
        agreedFee: 25000,
        inst1: { amount: 7000, receipt: 'REC-LNG-26-03' },
        inst2: { amount: 6000, dueDate: '2026-01-20', receipt: 'REC-LNG-26-17' },
        inst3: { amount: 6000, dueDate: '2026-03-20', receipt: 'REC-LNG-26-31' },
        inst4: { amount: 6000, dueDate: '2026-05-20', receipt: 'REC-LNG-26-46' },
        totalPaid: 25000,
        remaining: 0,
        notes: 'تسديد مكتمل',
      },
    ],
  },
  'robotics': {
    titleAr: 'نادي الروبوتيك والذكاء الاصطناعي',
    titleEn: 'Robotics & STEM AI Club (Hardware, Microbit, Python)',
    students: [
      {
        id: 'STD-ROB-01',
        seq: 1,
        fullName: 'ريان بن خليفة',
        level: 'Arduino Level 1',
        coach: 'م. حسام الدين شريف',
        agreedFee: 24000,
        inst1: { amount: 6000, receipt: 'REC-ROB-26-01' },
        inst2: { amount: 6000, dueDate: '2026-01-10', receipt: 'REC-ROB-26-12' },
        inst3: { amount: 6000, dueDate: '2026-03-10', receipt: 'REC-ROB-26-25' },
        inst4: { amount: 6000, dueDate: '2026-05-10', receipt: 'REC-ROB-26-38' },
        totalPaid: 24000,
        remaining: 0,
        notes: 'مشترك بالحقيبة الإلكترونية الرسمية',
      },
      {
        id: 'STD-ROB-02',
        seq: 2,
        fullName: 'إكرام عياشي',
        level: 'Lego Spike Prime',
        coach: 'م. حسام الدين شريف',
        agreedFee: 22000,
        inst1: { amount: 6000, receipt: 'REC-ROB-26-02' },
        inst2: { amount: 6000, dueDate: '2026-01-10', receipt: 'REC-ROB-26-13' },
        inst3: { amount: 0, dueDate: '2026-03-10', receipt: '' },
        inst4: { amount: 0, dueDate: '2026-05-10', receipt: '' },
        totalPaid: 12000,
        remaining: 10000,
        notes: 'تأخر في الدفعة الثالثة',
      },
      {
        id: 'STD-ROB-03',
        seq: 3,
        fullName: 'يانيس بوجمعة',
        level: 'AI & Python Junior',
        coach: 'م. حسام الدين شريف',
        agreedFee: 26000,
        inst1: { amount: 7000, receipt: 'REC-ROB-26-03' },
        inst2: { amount: 7000, dueDate: '2026-01-10', receipt: 'REC-ROB-26-14' },
        inst3: { amount: 6000, dueDate: '2026-03-10', receipt: 'REC-ROB-26-26' },
        inst4: { amount: 6000, dueDate: '2026-05-10', receipt: 'REC-ROB-26-39' },
        totalPaid: 26000,
        remaining: 0,
        notes: 'مشروع التخرج جاهز',
      },
    ],
  },
  'school-languages': {
    titleAr: 'دروس دعم مناهج اللغات المدرسية',
    titleEn: 'Curriculum School Languages Support (French & English)',
    students: [
      {
        id: 'STD-SKL-01',
        seq: 1,
        fullName: 'منال قاسي',
        level: 'BEM Prep - فرنسية',
        coach: 'أ. فتيحة بوزيد',
        agreedFee: 15000,
        inst1: { amount: 4000, receipt: 'REC-SKL-26-01' },
        inst2: { amount: 4000, dueDate: '2026-01-15', receipt: 'REC-SKL-26-10' },
        inst3: { amount: 4000, dueDate: '2026-03-15', receipt: 'REC-SKL-26-20' },
        inst4: { amount: 3000, dueDate: '2026-05-15', receipt: 'REC-SKL-26-30' },
        totalPaid: 15000,
        remaining: 0,
        notes: 'التزام تام بالمواعيد',
      },
      {
        id: 'STD-SKL-02',
        seq: 2,
        fullName: 'وليد مجاني',
        level: 'BAC Prep - إنجليزية',
        coach: 'أ. فتيحة بوزيد',
        agreedFee: 16000,
        inst1: { amount: 4000, receipt: 'REC-SKL-26-02' },
        inst2: { amount: 4000, dueDate: '2026-01-15', receipt: 'REC-SKL-26-11' },
        inst3: { amount: 4000, dueDate: '2026-03-15', receipt: 'REC-SKL-26-21' },
        inst4: { amount: 0, dueDate: '2026-05-15', receipt: '' },
        totalPaid: 12000,
        remaining: 4000,
        notes: 'الدفعة الرابعة مع نهاية ماي',
      },
    ],
  },
};

/**
 * 5. سجل برنامج السوروبان والحساب الذهني (Soroban Mental Math)
 * Bilingual search (Arabic and Latin/French), Belt and Level badges
 * Belts: أخضر، أحمر، أزرق، أصفر
 * Levels: p1, p2, p5, j2, s6
 */
export const MOCK_CENTER_SOROBAN = [
  {
    id: 'SRB-01',
    seq: 1,
    nameAr: 'محمد بلقاسم',
    nameFr: 'Belkacem Mohammed',
    coach: 'يوسف بن عيسى',
    belt: 'أخضر',
    beltColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    levelCode: 'p2',
    totalFee: 14000,
    inst1: { amount: 4000, receipt: 'REC-SRB-26-01' },
    inst2: { amount: 4000, receipt: 'REC-SRB-26-20' },
    inst3: { amount: 3000, receipt: 'REC-SRB-26-45' },
    inst4: { amount: 3000, receipt: 'REC-SRB-26-70' },
    totalPaid: 14000,
    remaining: 0,
    phone: '0550 12 34 56',
  },
  {
    id: 'SRB-02',
    seq: 2,
    nameAr: 'إياد قروي',
    nameFr: 'Karoui Iyad',
    coach: 'يوسف بن عيسى',
    belt: 'أحمر',
    beltColor: 'bg-rose-100 text-rose-800 border-rose-300',
    levelCode: 'p5',
    totalFee: 16000,
    inst1: { amount: 4000, receipt: 'REC-SRB-26-02' },
    inst2: { amount: 4000, receipt: 'REC-SRB-26-21' },
    inst3: { amount: 4000, receipt: 'REC-SRB-26-46' },
    inst4: { amount: 0, receipt: '' },
    totalPaid: 12000,
    remaining: 4000,
    phone: '0661 77 88 99',
  },
  {
    id: 'SRB-03',
    seq: 3,
    nameAr: 'لينا زروقي',
    nameFr: 'Zerrouki Lina',
    coach: 'سميحة بوعبد الله',
    belt: 'أزرق',
    beltColor: 'bg-blue-100 text-blue-800 border-blue-300',
    levelCode: 'j2',
    totalFee: 15000,
    inst1: { amount: 5000, receipt: 'REC-SRB-26-03' },
    inst2: { amount: 5000, receipt: 'REC-SRB-26-22' },
    inst3: { amount: 5000, receipt: 'REC-SRB-26-47' },
    inst4: { amount: 0, receipt: '' },
    totalPaid: 15000,
    remaining: 0,
    phone: '0770 33 44 55',
  },
  {
    id: 'SRB-04',
    seq: 4,
    nameAr: 'أنس حميدي',
    nameFr: 'Hamidi Anes',
    coach: 'يوسف بن عيسى',
    belt: 'أصفر',
    beltColor: 'bg-amber-100 text-amber-800 border-amber-300',
    levelCode: 'p1',
    totalFee: 12000,
    inst1: { amount: 3000, receipt: 'REC-SRB-26-04' },
    inst2: { amount: 3000, receipt: 'REC-SRB-26-23' },
    inst3: { amount: 3000, receipt: 'REC-SRB-26-48' },
    inst4: { amount: 3000, receipt: 'REC-SRB-26-71' },
    totalPaid: 12000,
    remaining: 0,
    phone: '0552 44 55 66',
  },
  {
    id: 'SRB-05',
    seq: 5,
    nameAr: 'مهدي صاولي',
    nameFr: 'Saouli Mehdi',
    coach: 'سميحة بوعبد الله',
    belt: 'أخضر',
    beltColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    levelCode: 's6',
    totalFee: 18000,
    inst1: { amount: 5000, receipt: 'REC-SRB-26-05' },
    inst2: { amount: 5000, receipt: 'REC-SRB-26-24' },
    inst3: { amount: 0, receipt: '' },
    inst4: { amount: 0, receipt: '' },
    totalPaid: 10000,
    remaining: 8000,
    phone: '0663 11 22 33',
  },
];

/**
 * 6. برنامج تحفيظ القرآن الكريم (Quran Memorization)
 * Semester Jan to June (6 months: جانفي، فيفري، مارس، أفريل، ماي، جوان)
 * Each month: { paid: number, receipt: string }
 */
export const MOCK_CENTER_QURAN = [
  {
    id: 'QRN-01',
    seq: 1,
    fullName: 'عبد الرحمن بن علي',
    teacher: 'الشيخ الطاهر مقلاتي',
    cohort: 'فوج الجمعة والسبت صباحاً',
    monthlyFee: 2500,
    months: {
      jan: { paid: 2500, receipt: 'REC-QRN-26-01' },
      feb: { paid: 2500, receipt: 'REC-QRN-26-15' },
      mar: { paid: 2500, receipt: 'REC-QRN-26-30' },
      apr: { paid: 0, receipt: '' },
      may: { paid: 0, receipt: '' },
      jun: { paid: 0, receipt: '' },
    },
    totalPaid: 7500,
  },
  {
    id: 'QRN-02',
    seq: 2,
    fullName: 'فاطمة الزهراء شريفي',
    teacher: 'الشيخة عائشة قديد',
    cohort: 'فوج الجمعة مساءً',
    monthlyFee: 2500,
    months: {
      jan: { paid: 2500, receipt: 'REC-QRN-26-02' },
      feb: { paid: 2500, receipt: 'REC-QRN-26-16' },
      mar: { paid: 2500, receipt: 'REC-QRN-26-31' },
      apr: { paid: 2500, receipt: 'REC-QRN-26-45' },
      may: { paid: 0, receipt: '' },
      jun: { paid: 0, receipt: '' },
    },
    totalPaid: 10000,
  },
  {
    id: 'QRN-03',
    seq: 3,
    fullName: 'يحيى بوزيان',
    teacher: 'الشيخ الطاهر مقلاتي',
    cohort: 'فوج السبت مساءً',
    monthlyFee: 2500,
    months: {
      jan: { paid: 2500, receipt: 'REC-QRN-26-03' },
      feb: { paid: 2500, receipt: 'REC-QRN-26-17' },
      mar: { paid: 0, receipt: '' },
      apr: { paid: 0, receipt: '' },
      may: { paid: 0, receipt: '' },
      jun: { paid: 0, receipt: '' },
    },
    totalPaid: 5000,
  },
  {
    id: 'QRN-04',
    seq: 4,
    fullName: 'خولة مداني',
    teacher: 'الشيخة عائشة قديد',
    cohort: 'فوج الجمعة صباحاً',
    monthlyFee: 2500,
    months: {
      jan: { paid: 2500, receipt: 'REC-QRN-26-04' },
      feb: { paid: 2500, receipt: 'REC-QRN-26-18' },
      mar: { paid: 2500, receipt: 'REC-QRN-26-32' },
      apr: { paid: 0, receipt: '' },
      may: { paid: 0, receipt: '' },
      jun: { paid: 0, receipt: '' },
    },
    totalPaid: 7500,
  },
];

/**
 * 7. القسم التحضيري المدرسي (Preparatory Class 2025)
 * 9 months (September to May), each month has amount + receipt
 */
export const MOCK_CENTER_PREPARATORY = [
  {
    id: 'PREP-01',
    fullName: 'إيناس حداد',
    section: 'القسم التحضيري أ',
    birthDate: '2020-05-12',
    registrationDate: '2025-09-02',
    registrationFee: 8000,
    regReceipt: 'REC-PRP-REG-01',
    monthlyDue: 12000,
    months: {
      sep: { paid: 12000, receipt: 'REC-PRP-26-01' },
      oct: { paid: 12000, receipt: 'REC-PRP-26-21' },
      nov: { paid: 12000, receipt: 'REC-PRP-26-41' },
      dec: { paid: 12000, receipt: 'REC-PRP-26-61' },
      jan: { paid: 12000, receipt: 'REC-PRP-26-81' },
      feb: { paid: 12000, receipt: 'REC-PRP-26-101' },
      mar: { paid: 0, receipt: '' },
      apr: { paid: 0, receipt: '' },
      may: { paid: 0, receipt: '' },
    },
    totalPaid: 80000,
    remaining: 36000,
  },
  {
    id: 'PREP-02',
    fullName: 'أمين طاهير',
    section: 'القسم التحضيري ب',
    birthDate: '2020-08-23',
    registrationDate: '2025-09-04',
    registrationFee: 8000,
    regReceipt: 'REC-PRP-REG-02',
    monthlyDue: 12000,
    months: {
      sep: { paid: 12000, receipt: 'REC-PRP-26-02' },
      oct: { paid: 12000, receipt: 'REC-PRP-26-22' },
      nov: { paid: 12000, receipt: 'REC-PRP-26-42' },
      dec: { paid: 12000, receipt: 'REC-PRP-26-62' },
      jan: { paid: 12000, receipt: 'REC-PRP-26-82' },
      feb: { paid: 12000, receipt: 'REC-PRP-26-102' },
      mar: { paid: 0, receipt: '' },
      apr: { paid: 0, receipt: '' },
      may: { paid: 0, receipt: '' },
    },
    totalPaid: 80000,
    remaining: 36000,
  },
  {
    id: 'PREP-03',
    fullName: 'سجى بلال',
    section: 'القسم التحضيري أ',
    birthDate: '2020-03-17',
    registrationDate: '2025-09-05',
    registrationFee: 8000,
    regReceipt: 'REC-PRP-REG-03',
    monthlyDue: 12000,
    months: {
      sep: { paid: 12000, receipt: 'REC-PRP-26-03' },
      oct: { paid: 12000, receipt: 'REC-PRP-26-23' },
      nov: { paid: 6000, receipt: 'REC-PRP-26-43' },
      dec: { paid: 0, receipt: '' },
      jan: { paid: 0, receipt: '' },
      feb: { paid: 0, receipt: '' },
      mar: { paid: 0, receipt: '' },
      apr: { paid: 0, receipt: '' },
      may: { paid: 0, receipt: '' },
    },
    totalPaid: 38000,
    remaining: 78000,
  },
];

/**
 * 8. النادي والمخيم الصيفي (Summer Camp & Club)
 * 2 installments structure only
 */
export const MOCK_CENTER_SUMMER_CAMP = [
  {
    id: 'CMP-01',
    seq: 1,
    fullName: 'يوسف العسكري',
    activity: 'مخيم المبتكر الصغير + السباحة',
    totalAgreed: 28000,
    inst1: { amount: 15000, receipt: 'REC-CMP-26-01' },
    inst2: { amount: 13000, receipt: 'REC-CMP-26-15' },
    totalPaid: 28000,
    remaining: 0,
    notes: 'تسديد كامل مع استلام الزي الرياضي',
  },
  {
    id: 'CMP-02',
    seq: 2,
    fullName: 'هند قريشي',
    activity: 'نادي الفنون والمسرح والموسيقى',
    totalAgreed: 22000,
    inst1: { amount: 12000, receipt: 'REC-CMP-26-02' },
    inst2: { amount: 0, receipt: '' },
    totalPaid: 12000,
    remaining: 10000,
    notes: 'الدفعة الثانية تستحق عند انطلاق الفوج الثاني',
  },
  {
    id: 'CMP-03',
    seq: 3,
    fullName: 'معاذ طيبي',
    activity: 'أولمبياد الحساب الذهني الصيفي',
    totalAgreed: 25000,
    inst1: { amount: 15000, receipt: 'REC-CMP-26-03' },
    inst2: { amount: 10000, receipt: 'REC-CMP-26-16' },
    totalPaid: 25000,
    remaining: 0,
    notes: 'مسدد بالكامل',
  },
];

/**
 * 9. سجل بطولات السوروبان (البطولة الولائية والبطولة الوطنية)
 */
export const MOCK_CENTER_CHAMPIONSHIPS = [
  {
    seq: 1,
    contestantName: 'محمد بلقاسم',
    categoryLevel: 'المستوى p2 - البطولة الولائية',
    regFee: 4500,
    receiptNumber: 'REC-CHAMP-26-01',
    confirmedPaid: 4500,
    notes: 'تأهل إلى الدور النهائي الولائي - المرتبة الأولى',
  },
  {
    seq: 2,
    contestantName: 'لينا زروقي',
    categoryLevel: 'المستوى j2 - البطولة الوطنية (الجزائر)',
    regFee: 6500,
    receiptNumber: 'REC-CHAMP-26-02',
    confirmedPaid: 6500,
    notes: 'تم تأكيد السفر والمشاركة باسم الأكاديمية',
  },
  {
    seq: 3,
    contestantName: 'إياد قروي',
    categoryLevel: 'المستوى p5 - البطولة الولائية',
    regFee: 4500,
    receiptNumber: 'REC-CHAMP-26-03',
    confirmedPaid: 4500,
    notes: 'ميدالية تشجيعية وتكريم خاص',
  },
  {
    seq: 4,
    contestantName: 'أنس حميدي',
    categoryLevel: 'المستوى p1 - بطولة البراعم',
    regFee: 4000,
    receiptNumber: 'REC-CHAMP-26-04',
    confirmedPaid: 4000,
    notes: 'شهادة مشاركة ودرع التميز',
  },
];

/**
 * 10. جدول توقيت الأفواج والقاعات (Timetable Matrix)
 * Special focus on Friday, Saturday, and evening sessions
 */
export const MOCK_CENTER_TIMETABLE = [
  {
    id: 'tt-1',
    day: 'الجمعة',
    timeSlot: '08:30 - 10:30',
    room: 'قاعة القرآن الكريم',
    cohort: 'تحفيظ القرآن - فوج النخبة 1',
    teacher: 'الشيخ الطاهر مقلاتي',
    capacity: '16 / 20 طالب',
  },
  {
    id: 'tt-2',
    day: 'الجمعة',
    timeSlot: '10:30 - 12:30',
    room: 'قاعة الروبوتيك والذكاء الاصطناعي',
    cohort: 'برمجة المايكروبت والأردوينو (A1)',
    teacher: 'م. حسام الدين شريف',
    capacity: '12 / 12 طالب (مكتمل)',
  },
  {
    id: 'tt-3',
    day: 'الجمعة',
    timeSlot: '14:30 - 16:30',
    room: 'قاعة السوروبان 1',
    cohort: 'الحساب الذهني المستوى المتقدم (s6)',
    teacher: 'أ. يوسف بن عيسى',
    capacity: '14 / 15 طالب',
  },
  {
    id: 'tt-4',
    day: 'الجمعة',
    timeSlot: '16:30 - 18:30',
    room: 'قاعة اللغات (قاعة 2)',
    cohort: 'English Communication Club B1',
    teacher: 'أ. إسلام عماري',
    capacity: '15 / 18 طالب',
  },
  {
    id: 'tt-5',
    day: 'السبت',
    timeSlot: '08:30 - 10:30',
    room: 'قاعة السوروبان 1',
    cohort: 'السوروبان - المستوى التأسيسي (p1)',
    teacher: 'أ. سميحة بوعبد الله',
    capacity: '15 / 15 طالب (مكتمل)',
  },
  {
    id: 'tt-6',
    day: 'السبت',
    timeSlot: '10:30 - 12:30',
    room: 'قاعة 3 (الدعم العلمي)',
    cohort: 'رياضيات 4 متوسط (مراجعة مكثفة)',
    teacher: 'أ. عبد القادر مرابط',
    capacity: '18 / 20 طالب',
  },
  {
    id: 'tt-7',
    day: 'السبت',
    timeSlot: '14:00 - 16:00',
    room: 'قاعة الروبوتيك',
    cohort: 'Lego Spike Prime Juniors',
    teacher: 'م. حسام الدين شريف',
    capacity: '10 / 12 طالب',
  },
  {
    id: 'tt-8',
    day: 'الثلاثاء (مساءً)',
    timeSlot: '17:00 - 19:00',
    room: 'قاعة اللغات (قاعة 2)',
    cohort: 'فرنسية دعم مدرسي (3 ثانوي)',
    teacher: 'أ. فتيحة بوزيد',
    capacity: '16 / 18 طالب',
  },
];

/**
 * 11. جدول الرواتب الشهرية الثابتة (Fixed Staff Payroll)
 * Admin, Secretarial, and Prep Teachers across 11 months (Sep to Jul)
 */
export const MOCK_CENTER_FIXED_PAYROLL = [
  {
    id: 'STAFF-01',
    name: 'سليمة منصوري',
    role: 'مديرة إدارية وسكرتارية مركزية',
    startDate: '2023-09-01',
    baseSalary: 45000,
    months: {
      sep: { paid: true, date: '2025-09-30', voucher: 'PAY-FIX-25-01' },
      oct: { paid: true, date: '2025-10-31', voucher: 'PAY-FIX-25-02' },
      nov: { paid: true, date: '2025-11-30', voucher: 'PAY-FIX-25-03' },
      dec: { paid: true, date: '2025-12-31', voucher: 'PAY-FIX-25-04' },
      jan: { paid: true, date: '2026-01-31', voucher: 'PAY-FIX-26-01' },
      feb: { paid: true, date: '2026-02-28', voucher: 'PAY-FIX-26-02' },
      mar: { paid: false, date: '-', voucher: '-' },
      apr: { paid: false, date: '-', voucher: '-' },
      may: { paid: false, date: '-', voucher: '-' },
      jun: { paid: false, date: '-', voucher: '-' },
      jul: { paid: false, date: '-', voucher: '-' },
    },
    totalDisbursed: 270000,
    notes: 'صرف منتظم مع اقتطاع الضمان الاجتماعي',
  },
  {
    id: 'STAFF-02',
    name: 'حنان شايبي',
    role: 'أستاذة القسم التحضيري الثابتة',
    startDate: '2024-09-01',
    baseSalary: 38000,
    months: {
      sep: { paid: true, date: '2025-09-30', voucher: 'PAY-FIX-25-05' },
      oct: { paid: true, date: '2025-10-31', voucher: 'PAY-FIX-25-06' },
      nov: { paid: true, date: '2025-11-30', voucher: 'PAY-FIX-25-07' },
      dec: { paid: true, date: '2025-12-31', voucher: 'PAY-FIX-25-08' },
      jan: { paid: true, date: '2026-01-31', voucher: 'PAY-FIX-26-03' },
      feb: { paid: true, date: '2026-02-28', voucher: 'PAY-FIX-26-04' },
      mar: { paid: false, date: '-', voucher: '-' },
      apr: { paid: false, date: '-', voucher: '-' },
      may: { paid: false, date: '-', voucher: '-' },
      jun: { paid: false, date: '-', voucher: '-' },
      jul: { paid: false, date: '-', voucher: '-' },
    },
    totalDisbursed: 228000,
    notes: 'القسم التحضيري المدمج بالمركز',
  },
  {
    id: 'STAFF-03',
    name: 'حمزة بوعلام',
    role: 'عون استقبال وأمن المنشأة',
    startDate: '2024-10-01',
    baseSalary: 30000,
    months: {
      sep: { paid: false, date: '-', voucher: '-' },
      oct: { paid: true, date: '2025-10-31', voucher: 'PAY-FIX-25-09' },
      nov: { paid: true, date: '2025-11-30', voucher: 'PAY-FIX-25-10' },
      dec: { paid: true, date: '2025-12-31', voucher: 'PAY-FIX-25-11' },
      jan: { paid: true, date: '2026-01-31', voucher: 'PAY-FIX-26-05' },
      feb: { paid: true, date: '2026-02-28', voucher: 'PAY-FIX-26-06' },
      mar: { paid: false, date: '-', voucher: '-' },
      apr: { paid: false, date: '-', voucher: '-' },
      may: { paid: false, date: '-', voucher: '-' },
      jun: { paid: false, date: '-', voucher: '-' },
      jul: { paid: false, date: '-', voucher: '-' },
    },
    totalDisbursed: 150000,
    notes: 'مكافأة حسن انضباط 3,000 دج في جانفي',
  },
];

/**
 * 12. وحدة احتساب أجور المدربين والأساتذة (Trainer Variable Payroll)
 * Sub-tabs:
 * 1. Soroban: (عدد الأطفال المسجلين × المعامل المالي المحدد للمستوى)
 * 2. Quran: (الحصص المؤداة: جمعة ص/م، سبت ص/م)
 * 3. Languages & Support: (عدد الحصص المنجزة شهرياً × قيمة الحصة/الساعة التعاقدية)
 */
export const MOCK_CENTER_TRAINERS = {
  soroban: [
    { id: 'tr-s1', name: 'أ. يوسف بن عيسى', cohort: 'فوج السبت ص (p2)', studentCount: 16, coefficient: 1200, calculatedWage: 19200, notes: '16 طفل × 1,200 دج' },
    { id: 'tr-s2', name: 'أ. يوسف بن عيسى', cohort: 'فوج الجمعة م (s6)', studentCount: 14, coefficient: 1500, calculatedWage: 21000, notes: '14 طفل × 1,500 دج (مستوى متقدم)' },
    { id: 'tr-s3', name: 'أ. سميحة بوعبد الله', cohort: 'فوج السبت ص (p1)', studentCount: 15, coefficient: 1000, calculatedWage: 15000, notes: '15 طفل × 1,000 دج (تأسيسي)' },
    { id: 'tr-s4', name: 'أ. سميحة بوعبد الله', cohort: 'فوج الأربعاء م (j2)', studentCount: 12, coefficient: 1300, calculatedWage: 15600, notes: '12 طفل × 1,300 دج' },
  ],
  quran: [
    { id: 'tr-q1', name: 'الشيخ الطاهر مقلاتي', sessionSlot: 'الجمعة صباحاً + السبت صباحاً', sessionsCount: 8, sessionRate: 2500, calculatedWage: 20000, notes: '8 حصص شهرياً × 2,500 دج' },
    { id: 'tr-q2', name: 'الشيخة عائشة قديد', sessionSlot: 'الجمعة مساءً + السبت مساءً', sessionsCount: 8, sessionRate: 2500, calculatedWage: 20000, notes: '8 حصص شهرياً × 2,500 دج' },
  ],
  languages: [
    { id: 'tr-l1', name: 'أ. إسلام عماري', subject: 'اللغة الإنجليزية (مستويات ومحادثة)', sessionsCount: 16, hourlyRate: 1800, calculatedWage: 28800, notes: '16 ساعة تدريسية × 1,800 دج' },
    { id: 'tr-l2', name: 'أ. صابرينا بن طيب', subject: 'اللغة الفرنسية العامة A2/B1', sessionsCount: 12, hourlyRate: 1800, calculatedWage: 21600, notes: '12 ساعة تدريسية × 1,800 دج' },
    { id: 'tr-l3', name: 'أ. عبد القادر مرابط', subject: 'دعم الرياضيات (BEM و BAC)', sessionsCount: 20, hourlyRate: 2200, calculatedWage: 44000, notes: '20 حصة مراجعة مكثفة × 2,200 دج' },
    { id: 'tr-l4', name: 'م. حسام الدين شريف', subject: 'نادي الروبوتيك والذكاء الاصطناعي', sessionsCount: 14, hourlyRate: 2000, calculatedWage: 28000, notes: '14 حصة تطبيقية × 2,000 دج' },
  ],
};

/**
 * 13. المصاريف اليومية للمركز (Center Daily Expenses)
 */
export const MOCK_CENTER_DAILY_EXPENSES = [
  { id: 'cd-exp-1', date: '2026-02-02', description: 'شراء أقلام سبورة وأوراق طابعة A4', amount: 3800, voucher: 'CTR-VCH-01', category: 'أدوات مكتبية' },
  { id: 'cd-exp-2', date: '2026-02-05', description: 'تجديد اشتراك الإنترنت عالي السرعة (ألياف بصرية)', amount: 6500, voucher: 'CTR-VCH-02', category: 'اتصالات وإنترنت' },
  { id: 'cd-exp-3', date: '2026-02-09', description: 'صيانة مكيف القاعة 2 وقفل الباب الخارجي', amount: 4200, voucher: 'CTR-VCH-03', category: 'صيانة وتشغيل' },
  { id: 'cd-exp-4', date: '2026-02-14', description: 'شراء قطع إلكترونية ومجسات لمختبر الروبوتيك', amount: 12500, voucher: 'CTR-VCH-04', category: 'مستلزمات تعليمية' },
  { id: 'cd-exp-5', date: '2026-02-18', description: 'طباعة وتجليد دفاتر المتابعة وشهادات التقدير', amount: 8400, voucher: 'CTR-VCH-05', category: 'طباعة ونشر' },
];

/**
 * 14. سجل تسليم العهدة النقدية (Center Cash Handover)
 */
export const MOCK_CENTER_CASH_HANDOVER = [
  { id: 'ctr-hd-1', date: '2026-02-07', receiptNumber: 'CTR-HDV-26-01', amount: 65000, receiverName: 'محمد بوري (المدير العام)', notes: 'توريد إيرادات أقساط السوروبان واللغات' },
  { id: 'ctr-hd-2', date: '2026-02-14', receiptNumber: 'CTR-HDV-26-02', amount: 58000, receiverName: 'صلاح الدين (المسؤول المالي)', notes: 'تسليم سيولة نهاية الأسبوع' },
  { id: 'ctr-hd-3', date: '2026-02-21', receiptNumber: 'CTR-HDV-26-03', amount: 72000, receiverName: 'محمد بوري (المدير العام)', notes: 'إيداع نقدي مباشر بالخزينة' },
];

/**
 * 15. دليل الأسعار وسياسة الخصومات المعتمدة (Pricing & Discount Policy)
 * Cash discount: 500 DA
 * Sibling discount: 500 DA
 * Net cash = Price - 500
 * Net cash + sibling = Price - 500 - 500
 */
export const MOCK_CENTER_PRICING_POLICY = [
  {
    courseName: 'برنامج الحساب الذهني والسوروبان (المستويات الأولية)',
    installmentPrice: 12000,
    cashDiscount: 500,
    siblingDiscount: 500,
    netCash: 11500,
    netCashWithSibling: 11000,
    duration: 'فصل دراسي (3 أشهر)',
  },
  {
    courseName: 'برنامج الحساب الذهني والسوروبان (المستويات المتقدمة)',
    installmentPrice: 15000,
    cashDiscount: 500,
    siblingDiscount: 500,
    netCash: 14500,
    netCashWithSibling: 14000,
    duration: 'فصل دراسي (3 أشهر)',
  },
  {
    courseName: 'برنامج اللغات الأجنبية - دورات المستويات (فرنسية / إنجليزية)',
    installmentPrice: 18000,
    cashDiscount: 500,
    siblingDiscount: 500,
    netCash: 17500,
    netCashWithSibling: 17000,
    duration: 'دورة 40 ساعة معتمدة',
  },
  {
    courseName: 'نادي الروبوتيك والذكاء الاصطناعي (Arduino & Microbit)',
    installmentPrice: 24000,
    cashDiscount: 500,
    siblingDiscount: 500,
    netCash: 23500,
    netCashWithSibling: 23000,
    duration: 'دورة كاملة + حقيبة إلكترونية',
  },
  {
    courseName: 'دروس الدعم للطور المتوسط (رياضيات + علوم فيزيائية)',
    installmentPrice: 16000,
    cashDiscount: 500,
    siblingDiscount: 500,
    netCash: 15500,
    netCashWithSibling: 15000,
    duration: 'فصل دراسي تحضيري لشهادة BEM',
  },
  {
    courseName: 'دروس الدعم للطور الثانوي (رياضيات + فيزياء بكالوريا)',
    installmentPrice: 20000,
    cashDiscount: 500,
    siblingDiscount: 500,
    netCash: 19500,
    netCashWithSibling: 19000,
    duration: 'فصل دراسي مكثف لشهادة BAC',
  },
];
