# Data Dictionary & Column Mapping Reference
**Project:** 3abaqira Enterprise Database Migration  
**Scope:** Complete cross-referencing between Excel columns (Arabic / Legacy headers) and target Relational Database attributes.

---

## 1. Student & Enrollment Domain

| Source Sheet | Excel Header (Arabic) | Target Table | Target Attribute (SQL) | Data Type | Description & Business Rules |
|--------------|-----------------------|--------------|------------------------|-----------|------------------------------|
| `FEILLE`, `تحضيري`, `المداخيل` | الرقم | `students` / `enrollments` | `seq_number` | `INTEGER` | Sequential student index within class or program |
| `FEILLE`, `القران`, `تحضيري` | الإسم و اللقب / الاسم واللقب | `students` | `full_name_ar` | `VARCHAR(150)` | Full Arabic name of student |
| `NOM FRANCAIS SOROBAN` | الأسماء بالفرنسية Noms en français | `students` | `full_name_fr` | `VARCHAR(150)` | Full Latin / French spelling of student name |
| `تحضيري 2025` | تاريخ الميلاد | `students` | `birth_date` | `DATE` | Birth date of child |
| `المداخيل` | فئة العمرية | `levels` | `age_group` | `VARCHAR(50)` | Nursery cohort: `Bébé`, `Petit`, `Moyen`, `Grand` |
| `تحضيري 2025` | الفئة | `groups` | `cohort_section` | `VARCHAR(50)` | Preschool section identifier |
| `FEILLE` | المستوى | `levels` | `level_code` | `VARCHAR(30)` | Soroban level: `p1`, `p2`, `p5`, `j2`, `j4`, `s6` |
| `FEILLE` | المدرب | `employees` | `full_name` | `VARCHAR(150)` | Assigned lead coach / teacher |
| `تحضيري 2025` | تاريخ الدفع | `student_enrollments` | `enrollment_date` | `DATE` | Date of registration confirmation |
| `تحضيري 2025`, `المداخيل` | ح,تسجيل / حقوق التسجيل | `pricing_plans` | `registration_fee` | `DECIMAL(10,2)` | One-time enrollment fee (Standard: 8,000 DZD) |
| `المداخيل` | العرض 2025 | `student_enrollments` | `annual_package_fee` | `DECIMAL(10,2)` | Prepaid full-year package (Standard: 121,500 DZD) |
| `FEILLE`, `اللغات`, `الروبوتيك` | الوضعية | `student_enrollments` | `agreed_total_amount` | `DECIMAL(10,2)` | Total agreed program tuition |
| `تحضيري 2025`, `المداخيل` | المبلغ المستحق | `invoices` | `monthly_due_amount` | `DECIMAL(10,2)` | Monthly installment obligation |

---

## 2. Invoicing, Payments & Receipts Domain

| Source Sheet | Excel Header (Arabic) | Target Table | Target Attribute (SQL) | Data Type | Description & Business Rules |
|--------------|-----------------------|--------------|------------------------|-----------|------------------------------|
| `FEILLE`, `اللغات`, `النادي` | الدفعة1 | `invoices` / `payments` | `installment_1_amount` | `DECIMAL(10,2)` | First tranche installment payment |
| `FEILLE`, `اللغات`, `النادي` | الوصل | `payments` | `receipt_number` | `VARCHAR(50)` | Printed receipt voucher number |
| `FEILLE`, `اللغات` | الدفعة 2 | `invoices` / `payments` | `installment_2_amount` | `DECIMAL(10,2)` | Second tranche installment payment |
| `اللغات-مستويات` | التاريخ المقترح | `invoices` | `due_date` | `DATE` | Scheduled target date for payment |
| `FEILLE`, `اللغات` | الدفعة3 | `invoices` / `payments` | `installment_3_amount` | `DECIMAL(10,2)` | Third tranche installment payment |
| `FEILLE`, `اللغات` | الدفعة 4 | `invoices` / `payments` | `installment_4_amount` | `DECIMAL(10,2)` | Fourth tranche installment payment |
| `FEILLE`, `اللغات` | مجموع الدفعات | `invoices` | `total_paid` | `DECIMAL(10,2)` | Sum of all confirmed payments: $\sum \text{installments}$ |
| `FEILLE`, `اللغات` | الباقي | `invoices` | `remaining_balance` | `DECIMAL(10,2)` | Unpaid balance: $\text{total\_due} - \text{total\_paid}$ |
| `القران `, `تحضيري`, `المداخيل`| سبثمبر .. جويلية | `invoices` | `monthly_installments` | `DECIMAL(10,2)` | Monthly recurring tuition columns |
| `القران `, `تحضيري` | رقم الوصل | `payments` | `receipt_number` | `VARCHAR(50)` | Receipt voucher corresponding to specific month |
| `الأسعار` | الدفع بالتقسيط | `pricing_plans` | `standard_installment_price`| `DECIMAL(10,2)` | Base full price when paying in tranches |
| `الأسعار` | الدفع كاش | `pricing_plans` | `cash_discount` | `DECIMAL(10,2)` | Upfront full payment discount (-500 DZD) |
| `الأسعار` | في حالة إخوة | `pricing_plans` | `sibling_discount` | `DECIMAL(10,2)` | Family / sibling discount (-500 DZD) |

---

## 3. Human Resources & Payroll Domain

| Source Sheet | Excel Header (Arabic) | Target Table | Target Attribute (SQL) | Data Type | Description & Business Rules |
|--------------|-----------------------|--------------|------------------------|-----------|------------------------------|
| `الرواتب الشهرية` | الاسم واللقب / المدرب | `employees` | `full_name` | `VARCHAR(150)` | Staff member, teacher, or coach name |
| `الرواتب الشهرية` | المبلغ المستحق | `employees` | `base_salary` | `DECIMAL(10,2)` | Contracted monthly base salary |
| `الرواتب الشهرية` | تاريخ بداية العمل / الدخول| `employees` | `hire_date` | `DATE` | Initial employment start date |
| `اجور السوروبان` | عدد الأطفال | `completed_sessions` | `attended_student_count` | `INTEGER` | Enrolled children in group for rate calculation |
| `اجور السوروبان` | الأفواج | `groups` | `group_name` | `VARCHAR(100)` | Assigned class group for coach |
| `اجور السوروبان`, `اللغات` | الأجرة | `payroll_items` | `calculated_wage` | `DECIMAL(10,2)` | Multiplier payout per group/headcount |
| `أجور القرآن`, `اللغات -دعم` | عدد الحصص | `completed_sessions` | `session_count` | `INTEGER` | Total class sessions conducted in the month |
| `أجور القرآن` | الجمعة/السبت صباحا/مساءا | `group_schedules`| `time_slot` | `VARCHAR(50)` | Quran teaching shifts (Fri/Sat AM/PM) |
| `الرواتب الشهرية` | المجموع أجور الإدارة | `payroll_runs` | `admin_subtotal` | `DECIMAL(12,2)` | Administrative department salary subtotal |
| `الرواتب الشهرية` | أجور أساتذة التحضيري | `payroll_runs` | `teachers_subtotal` | `DECIMAL(12,2)` | Preschool teachers salary subtotal |

---

## 4. Treasury, Daily Drawer & Remittances

| Source Sheet | Excel Header (Arabic) | Target Table | Target Attribute (SQL) | Data Type | Description & Business Rules |
|--------------|-----------------------|--------------|------------------------|-----------|------------------------------|
| `الملخص اليومي` | التاريخ | `daily_cash_registers` | `register_date` | `DATE` | Business reconciliation date |
| `الملخص اليومي` | المداخيل | `daily_cash_registers` | `total_revenues` | `DECIMAL(12,2)` | Aggregate daily cash receipts |
| `الملخص اليومي` | المصاريف | `daily_cash_registers` | `total_expenses` | `DECIMAL(12,2)` | Aggregate daily out-of-pocket expenses |
| `الملخص اليومي` | المسلم | `daily_cash_registers` | `total_remitted` | `DECIMAL(12,2)` | Daily safe remittance total |
| `الملخص اليومي` | الباقي | `daily_cash_registers` | `closing_balance` | `DECIMAL(12,2)` | End of day drawer cash balance |
| `التسليم` | التاريخ | `cash_handovers` | `handover_date` | `DATE` | Vault drop execution date |
| `التسليم` | الوصل | `cash_handovers` | `receipt_voucher_no` | `VARCHAR(50)` | Signed physical drop voucher number |
| `التسليم` | المبلغ / المبلغ المسلم | `cash_handovers` | `amount` | `DECIMAL(10,2)` | Cash amount transferred |
| `التسليم` | المستلم / المستلم(ة) | `cash_handovers` | `received_by_name` | `VARCHAR(100)` | Recipient custodian / supervisor |

---

## 5. Expenses & Kitchen Procurement (Daycare)

| Source Sheet | Excel Header (Arabic) | Target Table | Target Attribute (SQL) | Data Type | Description & Business Rules |
|--------------|-----------------------|--------------|------------------------|-----------|------------------------------|
| `المصاريف`, `المصروف اليومي`| التعيين | `expenses` | `description` | `VARCHAR(255)` | Purchase description or vendor |
| `المصاريف`, `المصروف اليومي`| المبلغ | `expenses` | `amount` | `DECIMAL(10,2)` | Transaction cost |
| `ملخص المصاريف` | المتغير | `budget_variances` | `variable_factor` | `DECIMAL(10,2)` | Consumption units or base volume |
| `ملخص المصاريف` | المبلغ المستحق | `budget_variances` | `budgeted_amount` | `DECIMAL(10,2)` | Target budgeted monthly limit |
| `ملخص المصاريف` | المبلغ الحقيقي | `budget_variances` | `actual_amount` | `DECIMAL(10,2)` | Actual accumulated expenses |
| `الخبز` | الأيام | `daily_bread_logs` | `day_of_week` | `VARCHAR(20)` | Weekday name (Sun–Thu) |
| `الخبز` | الوجبة | `daily_bread_logs` | `scheduled_meal` | `VARCHAR(100)` | Lunch menu (Couscous, Pasta, Lentils) |
| `الخبز` | عدد الخبز | `daily_bread_logs` | `loaf_count` | `INTEGER` | Baguettes consumed on that day |
| `الخبز` | السعر | `daily_bread_logs` | `unit_price` | `DECIMAL(6,2)` | Price per baguette |
| `اللحم و الدجاج` | التعيين | `provisions_orders` | `item_category` | `VARCHAR(100)` | Meat, Chicken, Minced Escalope, 5L Water |
| `اللحم و الدجاج` | الكمية | `provisions_orders` | `quantity` | `DECIMAL(8,2)` | Weight in Kg or unit count |
| `اللحم و الدجاج` | السعر - كغ | `provisions_orders` | `unit_price` | `DECIMAL(10,2)` | Unit price per Kg or pack |
| `اللحم و الدجاج` | المبلغ | `provisions_orders` | `total_amount` | `DECIMAL(10,2)` | Line total: $\text{quantity} \times \text{unit\_price}$ |
| `اللحم و الدجاج` | الأسبوع | `provisions_orders` | `week_number` | `SMALLINT` | Week order index (1 to 5) |
