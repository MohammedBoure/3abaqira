# Kindergarten & Daycare Workbook Structure (`rawda.xlsx`)
**Source File:** `docs/excel_files/rawda.xlsx`  
**Domain:** Kindergarten, Nursery & Preschool Operations (روضة أكاديمية الأطفال العباقرة - كونشوفالي / الروضة)  
**Purpose:** Exhaustive structural documentation and field-level specifications of all sheets, tables, procurement logs, tuition collection, and daily treasury balances for database migration.

---

## 1. Executive Summary & Domain Overview

The `rawda.xlsx` workbook contains **8 key operational sheets** designed to administer a full-service childcare, nursery, and preschool center. The system covers:
1. **Child Enrollment & Tuition (`المداخيل`):** Multi-age tier tracking (Bébé, Petit, Moyen, Grand Section), one-time registration fees, annual subscription offers ("العرض 2025"), and monthly tuition schedules across 11 months (September through July).
2. **Class & Educator Allocation (`تقسيم الافواج`):** Roster allocations across 10 classes and assigned early-childhood educators/nannies.
3. **Daily Cashflow Reconciliation (`الملخص اليومي`):** End-of-day drawer balancing integrating Daily Revenues, Daily Expenses, Safe Remittances, and Rolling Cash-on-Hand.
4. **Petty Cash Operations (`المصروف اليومي` & `ملخص المصاريف`):** Itemized monthly pocket expenses and consolidated category-level variance analysis (Cleaning supplies, Dry goods, Bread, Produce, Dairy, Meat).
5. **Kitchen Provisions & Consumption (`الخبز` & `اللحم و الدجاج`):** Daily bread consumption correlated with scheduled lunch menus (Couscous, Spaghetti, Lentils, Puree), and weekly butcher/dairy purchase orders with unit pricing.

---

## 2. Master Sheet Catalog & Summary

| Sheet # | Sheet Name (Excel) | English Semantic Name | Category | Primary Function | Records / Size |
|---------|--------------------|-----------------------|----------|------------------|----------------|
| 1 | `التسليم` | Cash Remittance | Treasury | Register of cash deposits handed over to management | 33 rows |
| 2 | `المصروف اليومي` | Daily Operational Expense | Accounting | 11 monthly logs of daily petty expenses | 350+ entries |
| 3 | `المداخيل` | Child Enrollment & Tuition | Billing | Master student directory, fees, annual plans & monthly payments | 273 rows |
| 4 | `الملخص اليومي` | Daily Cash Drawer Summary | Treasury | Daily balance sheet: Revenues - Expenses - Safe Deposits | 348 daily rows |
| 5 | `تقسيم الافواج` | Class Roster & Educators | Academic | Distribution of children across 10 age-grouped classes | 10 classes, 38 rows |
| 6 | `ملخص المصاريف` | Expense Category Breakdown | Budgeting | Monthly budget vs actual analysis across 10 expense heads | 11 months |
| 7 | `الخبز` | Daily Bread Consumption | Kitchen / Inventory | Daily bread loaf consumption tracking by weekday and meal | 5 weeks × 11 months |
| 8 | `اللحم و الدجاج` | Meat & Dairy Procurement | Kitchen / Procurement | Weekly procurement log for butcher, poultry, cheese, eggs & water | 5 weeks × 11 months |

---

## 3. Detailed Worksheet Technical Specifications

### 3.1. Sheet: `المداخيل` (Child Enrollment & Tuition Billing)
*Primary registry of children enrolled in the nursery and kindergarten, tuition pricing rules, and monthly payment status.*

- **Excel Range:** `A2:Q274`
- **Table Definition:**

| Column | Arabic Header | Normalized Field Name | Data Type | Nullable | Constraints & Domain Rules |
|--------|---------------|-----------------------|-----------|----------|----------------------------|
| `A` | الرقم | `child_seq_number` | INTEGER | No | Sequential roll number |
| `B` | فئة العمرية | `age_group` | VARCHAR(50) | No | Enum: `Bébé`, `Petit Section`, `Moyen Section`, `Grand Section` |
| `C` | الاسم واللقب | `child_full_name` | VARCHAR(150) | No | Child full Arabic name |
| `D` | حقوق التسجيل | `registration_fee` | DECIMAL(10,2) | No | Annual registration fee (Standard: 8,000.00 DZD) |
| `E` | العرض 2025 | `annual_package_fee` | DECIMAL(10,2) | Yes | Annual discounted package (Standard: 121,500.00 DZD) |
| `F` | مبلغ المستحق | `monthly_due_amount` | DECIMAL(10,2) | No | Standard monthly fee (14,500.00 DZD or 0 if annual prepaid) |
| `G` | سبثمبر | `payment_september` | DECIMAL(10,2) | Yes | September payment |
| `H` | اكثوبر | `payment_october` | DECIMAL(10,2) | Yes | October payment |
| `I` | نوفمبر | `payment_november` | DECIMAL(10,2) | Yes | November payment |
| `J` | ديسمبر | `payment_december` | DECIMAL(10,2) | Yes | December payment |
| `K` | جانفي | `payment_january` | DECIMAL(10,2) | Yes | January payment |
| `L` | فيفري | `payment_february` | DECIMAL(10,2) | Yes | February payment |
| `M` | مارس | `payment_march` | DECIMAL(10,2) | Yes | March payment |
| `N` | افريل | `payment_april` | DECIMAL(10,2) | Yes | April payment |
| `O` | ماي | `payment_may` | DECIMAL(10,2) | Yes | May payment |
| `P` | جوان | `payment_june` | DECIMAL(10,2) | Yes | June payment |
| `Q` | جويلية | `payment_july` | DECIMAL(10,2) | Yes | July payment |

*Business Rules Identified:*
- If `annual_package_fee` is paid up front, `monthly_due_amount` is set to `0`.
- Standard monthly rate without annual package is `14,500.00 DZD`.
- Registration fee is paid once upon entry (`8,000.00 DZD`).

---

### 3.2. Sheet: `الملخص اليومي` (Daily Cash Drawer Reconciliation)
*Auditing table ensuring every cent received at reception matches daily expenditures and deposits to the vault.*

- **Excel Range:** `B3:F350`
- **Table Definition:**

| Column | Arabic Header | Normalized Field Name | Data Type | Nullable | Formula & Business Logic |
|--------|---------------|-----------------------|-----------|----------|--------------------------|
| `F` | التاريخ | `reconciliation_date` | DATE | No | Business date (stored as Excel serial e.g., 45901) |
| `E` | المداخيل | `daily_revenues` | DECIMAL(10,2) | No | Total cash collected from enrollments and daily services |
| `D` | المصاريف | `daily_expenses` | DECIMAL(10,2) | No | Total daily out-of-pocket expenses for the day |
| `C` | المسلم | `cash_remitted` | DECIMAL(10,2) | No | Amount deposited/handed over to general management |
| `B` | الباقي | `closing_balance` | DECIMAL(10,2) | No | $\text{Closing} = \text{Opening} + \text{Revenues} - \text{Expenses} - \text{Remitted}$ |

---

### 3.3. Sheet: `التسليم` (Cash Remittance to Management)
*Proof-of-handover ledger linking cashier drawer drops to supervisor receipts.*

- **Excel Table:** `Table_1` (`F2:T33`)
- **Table Definition:**

| Column | Arabic Header | Normalized Field Name | Data Type | Nullable | Description |
|--------|---------------|-----------------------|-----------|----------|-------------|
| `F` | التاريخ | `handover_date` | DATE | No | Date of handover |
| `E` | الوصل | `receipt_voucher_no` | VARCHAR(50) | Yes | Number of signed remittance voucher |
| `D` | المبلغ المسلم | `amount_delivered` | DECIMAL(10,2) | No | Cash delivered |
| `C` | المستلم(ة) | `recipient_name` | VARCHAR(100) | No | Name of supervisor / owner taking custody |
| `B` | ملاحظات | `remarks` | TEXT | Yes | Handover comments / bank deposit slip reference |

---

### 3.4. Sheet: `المصروف اليومي` (Daily Operational Expenses by Month)
*Monthly 3-column repeater tables capturing petty cash purchases.*

- **Excel Range:** `C5:AS36` across 11 monthly blocks:
  - September (`C:E`), October (`G:I`), November (`K:M`), December (`O:Q`), January (`S:U`), February (`W:Y`), March (`AA:AC`), April (`AE:AG`), May (`AI:AK`), June (`AM:AO`), July (`AQ:AS`).
- **Normalized Table Definition (Target Model):**

| Normalized Column | Arabic Context | Data Type | Nullable | Description |
|-------------------|----------------|-----------|----------|-------------|
| `expense_id` | معرف المصروف | BIGINT | No | Primary Key |
| `expense_date` | التاريخ | DATE | No | Transaction date |
| `month_code` | الشهر | VARCHAR(20) | No | Academic month (`2025-09` ... `2026-07`) |
| `designation` | التعيين | VARCHAR(255) | No | Specific expense purpose or item bought |
| `amount` | المبلغ | DECIMAL(10,2) | No | Cost incurred |
| `payment_method`| طريقة الدفع | VARCHAR(50) | No | Default: `CASH` |

---

### 3.5. Sheet: `تقسيم الافواج` (Class Sections & Staff Assignment)
*Classroom roster distributing children into developmentally appropriate cohorts and assigning teachers/nannies.*

- **Excel Range:** `A4:K38`
- **Class Cohorts Configured:**

| Column | Section Identifier | English Description | Age Target |
|--------|---------------------|---------------------|------------|
| `J` | `bebe` | Infant & Nursery Section | 3 months – 1.5 years |
| `I` | `petit section 1` | Toddler Cohort 1 | 1.5 – 2.5 years |
| `H` | `petit section 1-1` | Toddler Cohort 1-1 | 2 – 3 years |
| `G` | `petit section 1-2` | Toddler Cohort 1-2 | 2.5 – 3 years |
| `F` | `moyen section -1` | Middle Preschool 1 | 3 – 4 years |
| `E` | `moyen section -2` | Middle Preschool 2 | 3 – 4 years |
| `D` | `moyen section -3` | Middle Preschool 3 | 3.5 – 4 years |
| `C` | `grand section -1` | Upper Kindergarten 1 | 4 – 5 years |
| `B` | `grand section -2` | Upper Kindergarten 2 | 4.5 – 5.5 years |
| `A` | `grand section -3` | Upper Kindergarten 3 (Prep) | 5 – 6 years |

- **Staff Assignments:** Rows 38–40 assign educators (`المربية 1`, `المربية 2`, `المربية 3`, etc.) to specific classrooms.

---

### 3.6. Sheet: `ملخص المصاريف` (Expense Categories & Variance Analysis)
*Category-level budget accounting comparing planned allowance against actual costs.*

- **Excel Range:** `B3:BH18` (11 monthly blocks with 4 metrics per category)
- **Standard Categories Tracked:**
  1. `حفاظات و مواد التنظيف` (Diapers & Sanitary Supplies)
  2. `المصروف اليومي` (Daily Petty Cash Operations)
  3. `مواد جافة ` (Dry Groceries / Non-perishable Food)
  4. `الخبز` (Bread)
  5. `خضر وفواكه` (Fresh Produce / Vegetables & Fruits)
  6. `ياوغورت` (Yogurt / Dairy)
  7. `اللحم و الدجاج` (Butcher: Fresh Meat & Poultry)
- **4 Metrics per Category per Month:**
  - `المتغير` (`variable_factor`): Unit count or rate
  - `المبلغ المستحق` (`budgeted_amount`): Planned budget
  - `المبلغ الحقيقي` (`actual_amount`): Actual realized spending
  - `الباقي` (`variance`): Difference ($\text{Budget} - \text{Actual}$)

---

### 3.7. Sheet: `الخبز` (Daily Bread Consumption & Meal Coordination)
*Daily bread procurement auditing tied directly to school cafeteria menus.*

- **Excel Range:** `A1:AD85` (Structured by Month and Weeks 1 through 5)
- **Table Definition:**

| Column Group | Arabic Header | Normalized Field Name | Data Type | Nullable | Values & Description |
|--------------|---------------|-----------------------|-----------|----------|----------------------|
| Days | الأيام | `day_of_week` | VARCHAR(20) | No | Enum: `الأحد`, `الإثنين`, `الثلاثاء`, `الأربعاء`, `الخميس` |
| Meal | الوجبة | `scheduled_meal` | VARCHAR(100) | No | Menu item: `كسكس` (Couscous), `سباقيتي` (Spaghetti), `بيري` (Puree), `عدس` (Lentils), `معكرونة` (Pasta) |
| Quantity | عدد الخبز | `loaf_count` | INTEGER | No | Number of standard baguettes consumed |
| Unit Price | السعر | `unit_price` | DECIMAL(10,2) | No | Price per baguette (typically 10–15 DZD) |
| Total Cost | المجموع | `total_cost` | DECIMAL(10,2) | No | Formula: `=loaf_count * unit_price` |
| Remarks | ملاحظات | `remarks` | TEXT | Yes | Waste, extras, or supplier shortages |

---

### 3.8. Sheet: `اللحم و الدجاج` (Butcher, Dairy & Provisions Orders)
*Weekly food supply purchase orders ensuring institutional food safety and cost control.*

- **Excel Range:** `A3:AA165` (Split across Months and Weeks 1–5)
- **Items Monitored:**
  1. `اللحم` (Fresh Red Meat / Beef)
  2. `الدجاج ` (Fresh Whole Chicken / Poultry)
  3. `سكالوب مرحي` (Minced Turkey / Escalope)
  4. `الماء - 5ل` (5-Liter Bottled Drinking Water)
  5. `البيض` (Eggs - Trays)
  6. `الجبن` (Portion Cheese / Dairy Blocks)

- **Table Definition per Order Item:**

| Normalized Field Name | Arabic Header | Data Type | Unit | Description |
|-----------------------|---------------|-----------|------|-------------|
| `item_name` | التعيين | VARCHAR(100) | - | Provisions item identifier |
| `quantity` | الكمية | DECIMAL(10,2) | Kg / Units | Purchased quantity |
| `unit_price` | السعر - كغ | DECIMAL(10,2) | DZD | Cost per Kg or per pack |
| `total_amount` | المبلغ | DECIMAL(10,2) | DZD | Calculated total: `quantity * unit_price` |
| `order_week` | الأسبوع | SMALLINT | 1–5 | Week number within the target month |
| `order_month` | الشهر | VARCHAR(20) | - | Target month |

---

## 4. Key Business Logic & Integrity Constraints

1. **Child Age Group Segregation:** Each child can belong to only one active class section (`bebe` through `grand section 3`) per academic year.
2. **Annual Plan Preemption:** Enrolling a child with `annual_package_fee > 0` automatically zeroes out monthly fee obligations for months September through July.
3. **Cash Drawer Balancing Constraint:**
   $$\text{closing\_balance}_t = \text{closing\_balance}_{t-1} + \text{daily\_revenues}_t - \text{daily\_expenses}_t - \text{cash\_remitted}_t$$
   *Any variance must raise an immediate discrepancy alert in the database.*
4. **Cafeteria Supply Aggregation:** Sum of weekly kitchen purchases (Bread + Meat/Poultry + Produce) must reconcile with the category totals in `ملخص المصاريف`.
