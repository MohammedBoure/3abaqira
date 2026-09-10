# Center Workbook Structure (`center.xlsx`)
**Source File:** `docs/excel_files/center.xlsx`  
**Domain:** Training Center & Academy Operations (أكاديمية الأطفال العباقرة / المركز)  
**Purpose:** Technical and structural reference of all worksheets, data columns, formulas, and operational workflows for migrating from Excel to a relational database.

---

## 1. Executive Summary & Domain Overview

The `center.xlsx` workbook contains **30 worksheets** governing the educational and operational processes of the Academy. The operations span:
1. **Academic Programs & Course Registrations:** Specialized tracks (Soroban, Robotics, Quran Memorization, Foreign Languages [Levels], Foreign Languages [School Support], School Academic Support, Preparatory 2025, Summer Club).
2. **Competitions & Events:** National Championship (البطولة الوطنية) and Wilaya Championship (البطولة الولائية).
3. **Fee & Discount Structure:** Multi-tier installment tracking (up to 4 installments), sibling discounts, and cash discounts.
4. **Human Resources & Payroll:** Monthly salary sheets, per-child coaching compensation, per-session rates, and Quran teacher allowances.
5. **Treasury & Accounting:** Daily operational expense logging, cash receipts, and cash remittance/handover records.

---

## 2. Master Sheet Catalog & Classification

| Sheet # | Sheet Name (Excel) | English Semantic Name | Category | Primary Purpose | Key Entities |
|---------|--------------------|-----------------------|----------|-----------------|--------------|
| 1 | `الأفواج ` | Group & Room Schedule | Operations | Room and timetable allocation across days and rooms | Classrooms, Groups, TimeSlots |
| 2 | `القران ` | Quran Program | Student Registry | Quran student registration and monthly payments (Jan–Jun) | Students, Quran Payments |
| 3 | `تحضيري 2025` | Preparatory 2025 | Student Registry | Pre-school enrollment, registration fee, and monthly tuition (Sep–May) | Students, Prep Payments |
| 4 | `دروس الدعم ر ع ` | Academic Support (Sci/Lit) | Student Registry | Academic support courses with 4-part installment tracking | Students, Support Enrollments |
| 5 | ` اللغات-مستويات` | Foreign Languages (Levels) | Student Registry | Multi-level language courses (Fr, En) with 4-part installments | Students, Language Enrollments |
| 6 | `الروبوتيك` | Robotics | Student Registry | Robotics workshop registrations and 4-part installments | Students, Robotics Enrollments |
| 7 | `اللغات-دعم` | Languages (School Support) | Student Registry | School curriculum language tutoring with 4-part installments | Students, Language Support |
| 8 | `النادي الصيفي` | Summer Club | Student Registry | Summer camp registrations and 2-part installment tracking | Students, Summer Camp Enrollments |
| 9 | `البطولة الوطنية` | National Championship | Event Registry | Competitor registrations, fees, and receipt tracking | Events, Participants, Receipts |
| 10 | `البطولة الولائية` | Wilaya Championship | Event Registry | Regional championship registrations and receipts | Events, Participants, Receipts |
| 11 | `Feuil1 (2)` | Coach Wages Draft Matrix | Payroll / Calc | Working sheet calculating Soroban coach wages per group & session count | Coaches, Group Wages |
| 12 | ` NOM FRANCAIS SOROBAN` | Soroban French Names | Reference | Lookup mapping for Soroban students in Latin/French characters | Student Name Mappings |
| 13 | `Feuil6` | Bilingual Soroban Roster | Reference | Working reference linking Latin names with Arabic student names | Student Name Mappings |
| 14 | `Feuil4` | Soroban Indexed Roster | Reference | Cross-referencing student numbers, Latin, and Arabic names | Student Master Reference |
| 15 | `Feuil8` | Language Group Rosters | Operations | Student rosters distributed by language and level (Fr 1–3, En 1–3, En 7) | Groups, Student Allocations |
| 16 | `FEILLE` | Soroban Master Registry | Student Registry | Master active database of 307 Soroban students with full installment records | Students, Soroban Enrollments, Receipts |
| 17 | `السروبان` | Soroban Interactive Lookup | Operations | Form/lookup view query interface over `FEILLE` using Excel formulas | UI / Query View |
| 18 | `Feuil9` | Soroban Belt / Level Colors | Reference | Soroban student distribution by belt/cap color (Green, Red, Blue, Yellow, etc.) | Levels, Belts |
| 19 | `Feuil5` | Draft Group Allocation | Reference | Preliminary group and trainer assignment sheet | Groups, Trainers |
| 20 | `Feuil3` | Soroban Scoring / Attendance | Operations | Student point tracking and attendance index | Student Scores |
| 21 | `Feuil1` | Program Revenue Summary | Financial | Aggregate revenue calculation across Soroban, Prep, and Languages | Financial Summaries |
| 22 | `الرواتب الشهرية` | Monthly Staff Payroll | Payroll | Monthly base and net salary disbursement for administrative staff & teachers | Employees, Monthly Salaries |
| 23 | `اجور السوروبان` | Soroban Coach Compensation | Payroll | Calculated compensation for Soroban coaches based on enrolled children (Part 1 & 2) | Coaches, Compensation |
| 24 | `اجور اللغات-مستويات` | Language Coach Compensation | Payroll | Compensation for language coaches based on student headcount | Coaches, Compensation |
| 25 | `اجور اللغات -دعم` | Language Support Compensation| Payroll | Monthly wages for school support language teachers per session count | Teachers, Session Wages |
| 26 | `أجور القرآن` | Quran Teacher Compensation | Payroll | Compensation for Quran instructors based on Friday/Saturday session attendance | Teachers, Quran Sessions |
| 27 | `المصاريف` | Daily Academy Expenses | Financial | Operational daily expense log with date and description | Daily Expenses |
| 28 | `التسليم` | Cash Handover / Remittance | Financial | Formal cash remittance from drawer to management/treasury with receipts | Cash Remittances |
| 29 | `Feuil2` | Group Session Wage Breakdown | Payroll / Calc | Detailed multiplier calculation (Sessions × Rate × Students) per coach | Coach Rates, Session Calculations |
| 30 | `الأسعار` | Pricing & Discount Rules | Configuration | Base tuition pricing per level, cash discounts, and sibling discounts | Pricing Matrix, Discounts |

---

## 3. Detailed Worksheet Technical Specifications

### 3.1. Sheet: `FEILLE` (Master Soroban Registry)
*This is the core operational table for the mental arithmetic (Soroban) program containing 307 active student records.*

- **Excel Range:** `A1:Z961` (307 populated rows)
- **Table Definition:**

| Column | Arabic Header | Normalized Field Name | Data Type | Nullable | Constraints & Description |
|--------|---------------|-----------------------|-----------|----------|---------------------------|
| `Q` | الرقم | `student_seq_number` | INTEGER | No | Sequence index (1, 2, 3...) |
| `P` | الإسم و اللقب | `student_full_name` | VARCHAR(150) | No | Student full Arabic name |
| `N` | المدرب | `coach_name` | VARCHAR(100) | Yes | Assigned Soroban coach |
| `M` | المستوى | `level_code` | VARCHAR(20) | Yes | Level code (e.g., `p1`, `j2`, `s6`) |
| `L` | الوضعية | `total_fee_due` | DECIMAL(10,2) | No | Total agreed tuition fee (e.g., 12000, 13000) |
| `K` | الدفعة1 | `installment_1_amount`| DECIMAL(10,2) | Yes | Amount paid in 1st installment |
| `J` | الوصل | `installment_1_receipt`| VARCHAR(50) | Yes | Receipt/voucher number for 1st installment |
| `I` | الدفعة 2 | `installment_2_amount`| DECIMAL(10,2) | Yes | Amount paid in 2nd installment |
| `H` | الوصل | `installment_2_receipt`| VARCHAR(50) | Yes | Receipt/voucher number for 2nd installment |
| `G` | الدفعة3 | `installment_3_amount`| DECIMAL(10,2) | Yes | Amount paid in 3rd installment |
| `F` | الوصل | `installment_3_receipt`| VARCHAR(50) | Yes | Receipt/voucher number for 3rd installment |
| `E` | الدفعة 4 | `installment_4_amount`| DECIMAL(10,2) | Yes | Amount paid in 4th installment |
| `D` | الوصل | `installment_4_receipt`| VARCHAR(50) | Yes | Receipt/voucher number for 4th installment |
| `C` | مجموع الدفعات | `total_paid` | DECIMAL(10,2) | No | Formula: `=SUM(K_i, I_i, G_i, E_i)` |
| `B` | الباقي | `remaining_balance` | DECIMAL(10,2) | No | Formula: `=L_i - C_i` (Due - Total Paid) |
| `A` | ملاحظة | `notes` | TEXT | Yes | Special notes (e.g., discounts, siblings) |

---

### 3.2. Sheets: ` اللغات-مستويات`, `دروس الدعم ر ع `, `الروبوتيك`, `اللغات-دعم`
*These 4 sheets share an identical standardized 4-part installment tracking architecture with planned due dates.*

- **Excel Range:** `A1:AB981` (103 populated rows each)
- **Table Definition:**

| Column | Arabic Header | Normalized Field Name | Data Type | Nullable | Constraints & Description |
|--------|---------------|-----------------------|-----------|----------|---------------------------|
| `T` | الرقم | `seq_number` | INTEGER | No | Sequence identifier |
| `S` | الإسم و اللقب | `student_full_name` | VARCHAR(150) | No | Student full name |
| `R` | المستوى | `level` | VARCHAR(50) | Yes | Course level or grade (e.g., A1, 4AM) |
| `Q` | المدرب | `teacher_name` | VARCHAR(100) | Yes | Assigned instructor |
| `P` | الوضعية | `total_fee_due` | DECIMAL(10,2) | No | Full tuition fee |
| `O` | الدفعة1 | `installment_1_amount`| DECIMAL(10,2) | Yes | 1st installment payment |
| `N` | الدفعة 2 | `installment_2_amount`| DECIMAL(10,2) | Yes | 2nd installment payment |
| `M` | التاريخ المقترح | `installment_2_due_date`| DATE | Yes | Scheduled due date for 2nd installment |
| `L` | الوصل | `installment_2_receipt`| VARCHAR(50) | Yes | Receipt voucher number |
| `K` | الدفعة3 | `installment_3_amount`| DECIMAL(10,2) | Yes | 3rd installment payment |
| `J` | التاريخ المقترح | `installment_3_due_date`| DATE | Yes | Scheduled due date for 3rd installment |
| `I` | الوصل | `installment_3_receipt`| VARCHAR(50) | Yes | Receipt voucher number |
| `H` | الدفعة4 | `installment_4_amount`| DECIMAL(10,2) | Yes | 4th installment payment |
| `G` | التاريخ المقترح | `installment_4_due_date`| DATE | Yes | Scheduled due date for 4th installment |
| `F` | الوصل | `installment_4_receipt`| VARCHAR(50) | Yes | Receipt voucher number |
| `E` | مجموع الدفعات | `total_paid` | DECIMAL(10,2) | No | Sum of installments paid |
| `D` | الباقي | `remaining_balance` | DECIMAL(10,2) | No | `=P_i - E_i` |
| `C` | ملاحظة | `notes` | TEXT | Yes | Operational notes |

---

### 3.3. Sheet: `تحضيري 2025` (Preparatory / Kindergarten Academic 2025)
*Annual enrollment and month-by-month fee tracking for preparatory classes.*

- **Excel Range:** `A1:Z964`
- **Table Definition:**

| Column | Arabic Header | Normalized Field Name | Data Type | Nullable | Constraints & Description |
|--------|---------------|-----------------------|-----------|----------|---------------------------|
| `Z` | الرقم | `seq_number` | INTEGER | No | Sequence index |
| `Y` | الاسم واللقب | `student_full_name` | VARCHAR(150) | No | Student full name |
| `X` | الفئة | `age_category` | VARCHAR(50) | Yes | Age group / Class section |
| `W` | ح,تسجيل | `registration_fee` | DECIMAL(10,2) | Yes | One-time registration fee |
| `V` | الوصل | `registration_receipt`| VARCHAR(50) | Yes | Registration receipt voucher |
| `U` | تاريخ الميلاد | `birth_date` | DATE | Yes | Student birth date |
| `T` | تاريخ الدفع | `payment_date` | DATE | Yes | Initial enrollment payment date |
| `S` | المبلغ المستحق | `monthly_due_amount` | DECIMAL(10,2) | No | Standard monthly fee |
| `R` | سبثمبر | `september_amount` | DECIMAL(10,2) | Yes | September payment |
| `Q` | رقم الوصل | `september_receipt` | VARCHAR(50) | Yes | September receipt number |
| `P` | أكثوبر | `october_amount` | DECIMAL(10,2) | Yes | October payment |
| `O` | رقم الوصل | `october_receipt` | VARCHAR(50) | Yes | October receipt number |
| `N` | نوفمبر | `november_amount` | DECIMAL(10,2) | Yes | November payment |
| `M` | رقم الوصل | `november_receipt` | VARCHAR(50) | Yes | November receipt number |
| `L` | ديسمبر | `december_amount` | DECIMAL(10,2) | Yes | December payment |
| `K` | رقم الوصل | `december_receipt` | VARCHAR(50) | Yes | December receipt number |
| `J` | جانفي | `january_amount` | DECIMAL(10,2) | Yes | January payment |
| `I` | الوصل | `january_receipt` | VARCHAR(50) | Yes | January receipt number |
| `H` | فيفيري | `february_amount` | DECIMAL(10,2) | Yes | February payment |
| `G` | الوصل | `february_receipt` | VARCHAR(50) | Yes | February receipt number |
| `F` | مارس | `march_amount` | DECIMAL(10,2) | Yes | March payment |
| `E` | الوصل | `march_receipt` | VARCHAR(50) | Yes | March receipt number |
| `D` | أفريل | `april_amount` | DECIMAL(10,2) | Yes | April payment |
| `C` | الوصل | `april_receipt` | VARCHAR(50) | Yes | April receipt number |
| `B` | ماي | `may_amount` | DECIMAL(10,2) | Yes | May payment |
| `A` | الوصل | `may_receipt` | VARCHAR(50) | Yes | May receipt number |

---

### 3.4. Sheet: `القران ` (Quran Memorization Program)
*Semester-based Quran student attendance and monthly fee tracking.*

- **Excel Range:** `A1:N961`
- **Table Definition:**

| Column | Arabic Header | Normalized Field Name | Data Type | Nullable | Description |
|--------|---------------|-----------------------|-----------|----------|-------------|
| `N` | الرقم | `seq_number` | INTEGER | No | Sequence index |
| `M` | الإسم و اللقب | `student_full_name` | VARCHAR(150) | No | Student full name |
| `L` | جانفي | `january_amount` | DECIMAL(10,2) | Yes | January fee payment |
| `K` | رقم الوصل | `january_receipt` | VARCHAR(50) | Yes | Receipt voucher |
| `J` | فيفري | `february_amount` | DECIMAL(10,2) | Yes | February fee payment |
| `I` | رقم الوصل | `february_receipt` | VARCHAR(50) | Yes | Receipt voucher |
| `H` | مارس | `march_amount` | DECIMAL(10,2) | Yes | March fee payment |
| `G` | رقم الوصل | `march_receipt` | VARCHAR(50) | Yes | Receipt voucher |
| `F` | افريل | `april_amount` | DECIMAL(10,2) | Yes | April fee payment |
| `E` | رقم الوصل | `april_receipt` | VARCHAR(50) | Yes | Receipt voucher |
| `D` | ماي | `may_amount` | DECIMAL(10,2) | Yes | May fee payment |
| `C` | رقم الوصل | `may_receipt` | VARCHAR(50) | Yes | Receipt voucher |
| `B` | جوان | `june_amount` | DECIMAL(10,2) | Yes | June fee payment |
| `A` | رقم الوصل | `june_receipt` | VARCHAR(50) | Yes | Receipt voucher |

---

### 3.5. Sheet: `النادي الصيفي` (Summer Club Camp)
*Summer club registration with 2 installment tranches.*

- **Excel Range:** `A1:K457`
- **Table Definition:**

| Column | Arabic Header | Normalized Field Name | Data Type | Nullable | Description |
|--------|---------------|-----------------------|-----------|----------|-------------|
| `K` | الرقم | `seq_number` | INTEGER | No | Sequence index |
| `J` | الإسم و اللقب | `student_full_name` | VARCHAR(150) | No | Student full name |
| `I` | النادي | `club_name` | VARCHAR(100) | Yes | Activity / Club branch |
| `H` | الوضعية | `total_due` | DECIMAL(10,2) | No | Total required fee |
| `G` | الدفعة1 | `installment_1_amount`| DECIMAL(10,2) | Yes | First installment |
| `F` | الوصل | `installment_1_receipt`| VARCHAR(50) | Yes | First installment receipt |
| `E` | الدفعة 2 | `installment_2_amount`| DECIMAL(10,2) | Yes | Second installment |
| `D` | الوصل | `installment_2_receipt`| VARCHAR(50) | Yes | Second installment receipt |
| `C` | مجموع الدفعات | `total_paid` | DECIMAL(10,2) | No | `=SUM(G_i, E_i)` |
| `B` | الباقي | `balance` | DECIMAL(10,2) | No | `=H_i - C_i` |
| `A` | ملاحظة | `notes` | TEXT | Yes | Notes |

---

### 3.6. Sheets: `البطولة الوطنية` & `البطولة الولائية` (Championship Competitions)
*Event fee collection for national and regional Soroban tournaments.*

- **Excel Range:** `B1:H304`
- **Table Definition:**

| Column | Arabic Header | Normalized Field Name | Data Type | Nullable | Description |
|--------|---------------|-----------------------|-----------|----------|-------------|
| `H` | الرقم | `seq_number` | INTEGER | No | Sequence identifier |
| `G` | الإسم و اللقب | `competitor_name` | VARCHAR(150) | No | Competitor full name |
| `F` | المستوى | `competition_level` | VARCHAR(50) | Yes | Competitor division / category |
| `E` | المستحقات | `fee_amount` | DECIMAL(10,2) | No | Mandatory registration fee |
| `D` | رقم الوصل | `receipt_number` | VARCHAR(50) | Yes | Official fee payment receipt |
| `C` | المجموع | `total_paid` | DECIMAL(10,2) | No | Total amount confirmed |
| `B` | ملاحظات | `notes` | TEXT | Yes | Competition remarks |

---

### 3.7. Sheet: `الأسعار` (Official Pricing & Discount Policy)
*Defined Excel Table: `Table_1`.*

- **Excel Range:** `E6:H16`
- **Table Definition:**

| Column | Arabic Header | Normalized Field Name | Data Type | Sample Value | Description |
|--------|---------------|-----------------------|-----------|--------------|-------------|
| `H` | المستوى | `level_name` | VARCHAR(50) | المستوى الأول | Academic level |
| `G` | الدفع بالتقسيط | `installment_price` | DECIMAL(10,2) | 15,000.00 DZD | Base price when paying via installments |
| `F` | الدفع كاش | `cash_discount` | DECIMAL(10,2) | -500.00 DZD | Discount applied for upfront single payment |
| `E` | في حالة إخوة | `sibling_discount` | DECIMAL(10,2) | -500.00 DZD | Additional discount applied per sibling |

*Business Logic Derived:*
$$\text{Net Price (Cash)} = \text{installment\_price} + \text{cash\_discount}$$
$$\text{Net Price (Cash + Sibling)} = \text{installment\_price} + \text{cash\_discount} + \text{sibling\_discount}$$

---

### 3.8. Sheet: `الرواتب الشهرية` (Staff & Teacher Payroll)
*Salaries for administrative staff, preschool teachers, and base instructors.*

- **Excel Range:** `A1:O1003`
- **Sections:**
  - Rows 3–10: `أجور الإدارة` (Administration Staff)
  - Rows 19–27: `أجور أساتذة التحضيري` (Preparatory School Teachers)
  - Rows 28–36: `اجور مدربي اللغات مستويات` (Language Instructors)

- **Table Definition:**

| Column | Arabic Header | Normalized Field Name | Data Type | Nullable | Description |
|--------|---------------|-----------------------|-----------|----------|-------------|
| `A` | الاسم واللقب / المدرب | `employee_name` | VARCHAR(150) | No | Employee / Teacher full name |
| `B` | المبلغ المستحق / عدد الاطفال | `base_rate_or_count` | DECIMAL(10,2) | Yes | Base agreed wage or student headcount |
| `C` | شهر سبثمبر | `september_salary` | DECIMAL(10,2) | Yes | September payout |
| `D` | شهر أكثوبر | `october_salary` | DECIMAL(10,2) | Yes | October payout |
| `E` | شهر نوفمبر | `november_salary` | DECIMAL(10,2) | Yes | November payout |
| `F` | شهر ديسمبر | `december_salary` | DECIMAL(10,2) | Yes | December payout |
| `G` | شهر جانفي | `january_salary` | DECIMAL(10,2) | Yes | January payout |
| `H` | شهر فيفري | `february_salary` | DECIMAL(10,2) | Yes | February payout |
| `I` | شهر مارس | `march_salary` | DECIMAL(10,2) | Yes | March payout |
| `J` | شهر افريل | `april_salary` | DECIMAL(10,2) | Yes | April payout |
| `K` | شهر ماي | `may_salary` | DECIMAL(10,2) | Yes | May payout |
| `L` | شهر جوان | `june_salary` | DECIMAL(10,2) | Yes | June payout |
| `M` | شهر جويلية | `july_salary` | DECIMAL(10,2) | Yes | July payout |
| `N` | تاريخ بداية العمل / الدخول| `hire_date` | DATE | Yes | Employment / start date |
| `O` | ملاحظات | `notes` | TEXT | Yes | Payroll notes |

---

### 3.9. Sheets: `اجور السوروبان`, `اجور اللغات-مستويات`, `اجور اللغات -دعم`, `أجور القرآن`
*Compensation calculation models per instructor category:*
- **Soroban Coaches (`اجور السوروبان`):** Computed in 2 parts (الجزء الاول, الجزء الثاني) based on the assigned groups and number of children per group multiplied by fixed student coefficients (e.g., 700 DZD, 550 DZD, 405 DZD, 270 DZD, or 135 DZD per child depending on level/duration).
- **Language Support (`اجور اللغات -دعم`):** Calculated by counting completed sessions per month multiplied by the hourly/session rate.
- **Quran Teachers (`أجور القرآن`):** Tracked across 4 specific weekly slots: الجمعة صباحا (Friday AM), الجمعة مساءا (Friday PM), السبت صباحا (Saturday AM), السبت مساءا (Saturday PM).

---

### 3.10. Sheet: `المصاريف` (Daily Center Expenses)
*Daily operational expense ledger.*

- **Excel Range:** `B1:D1136` (347 populated rows)
- **Table Definition:**

| Column | Arabic Header | Normalized Field Name | Data Type | Nullable | Description |
|--------|---------------|-----------------------|-----------|----------|-------------|
| `D` | التاريخ | `expense_date` | DATE | No | Date of expenditure |
| `C` | التعيين | `expense_description` | VARCHAR(255) | No | Purpose / Vendor / Item purchased |
| `B` | المبلغ | `amount` | DECIMAL(10,2) | No | Expense monetary amount |

---

### 3.11. Sheet: `التسليم` (Cash Remittance / Vault Handover)
*Formal transfer of cash collected from front desk to the safe or center management.*

- **Excel Range:** `B1:F1167` (347 populated rows)
- **Table Definition:**

| Column | Arabic Header | Normalized Field Name | Data Type | Nullable | Description |
|--------|---------------|-----------------------|-----------|----------|-------------|
| `F` | التاريخ | `transfer_date` | DATE | No | Handover date |
| `E` | الوصل | `voucher_number` | VARCHAR(50) | Yes | Cash handover receipt voucher number |
| `D` | المبلغ | `amount_handed_over` | DECIMAL(10,2) | No | Delivered cash amount |
| `C` | المستلم | `recipient_name` | VARCHAR(100) | No | Person receiving custody of funds |
| `B` | ملاحظات | `notes` | TEXT | Yes | Discrepancies or transfer details |

---

## 4. Key Business Logic & Validation Constraints

1. **Receipt Uniqueness:** Every receipt voucher number (`الوصل`) should be unique within a fiscal academic year.
2. **Installment Sum Integrity:** 
   $$\text{total\_paid} = \sum_{k=1}^4 \text{installment\_k\_amount}$$
3. **Balance Integrity:**
   $$\text{remaining\_balance} = \text{total\_fee\_due} - \text{total\_paid}$$
4. **Discount Rule:** Sibling and cash discounts are mutually applicable and deduct 500 DZD each from the base installment price.
5. **Session-to-Headcount Wage Consistency:** Trainer payouts must be derived from verified student enrollment and actual session execution logs rather than manual spreadsheet entry.
