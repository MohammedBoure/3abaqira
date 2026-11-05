"""
tests/test_kg_comm_fin_mig.py
------------------------------
Comprehensive Unit & Integration Test Suite for:
  1. Kindergarten Module (Age bands, books, daily logs A/B/C, monthly reports review, incidents, specialist notes, menu)
  2. Staff & HR Module (Positions, profiles, multi-branch assignments, attendance with biometric source, interview pipeline)
  3. Communication Module (Two-way parent notes, time window policy toggle, notification queue & delivery worker)
  4. Finance Module (Fee plans, dynamic price overrides, installment invoices, gapless sequential receipts, payment voids, RTL documents)
  5. Migration Module (Arabic normalization ٩->ج, compound name splitting, cohort matching, ambiguous queue, legacy traceability)
"""

import os
import pytest
from datetime import date, datetime, timedelta

from backend.database import (
    Database,
    KindergartenManager,
    HRManager,
    CommunicationManager,
    FinanceManager,
    MigrationManager,
)


@pytest.fixture(autouse=True)
def seed_kg_prerequisites(db):
    """Seeds prerequisite records for KG/Fin tests without dropping schema."""
    with db.get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT OR IGNORE INTO levels (level_id, program_id, level_code, name_ar, name_en, age_group_cohort)
            VALUES (1, (SELECT program_id FROM programs LIMIT 1), 'LVL-01', 'المستوى الأول', 'Level 1', 'CHILDREN');
            """
        )
        cursor.execute(
            """
            INSERT OR IGNORE INTO groups (group_id, branch_id, level_id, academic_year_id, group_name)
            VALUES (1, 'RAWDA', 1, 1, 'فوج البراعم');
            """
        )
        cursor.execute(
            """
            INSERT OR IGNORE INTO students (student_id, student_code, first_name, last_name, full_name_ar)
            VALUES (1, 'STU-001', 'أحمد', 'بن علي', 'أحمد بن علي');
            """
        )
        cursor.execute(
            """
            INSERT OR IGNORE INTO student_enrollments (
                enrollment_id, branch_id, student_id, group_id, academic_year_id,
                enrollment_date, base_tuition_fee, agreed_total_amount, enrollment_status
            ) VALUES (1, 'RAWDA', 1, 1, 1, CURRENT_DATE, 15000.0, 15000.0, 'ACTIVE');
            """
        )
        conn.commit()


# =============================================================================
# 1. KINDERGARTEN MODULE TESTS
# =============================================================================

def test_kg_age_bands_seed_and_create(db):
    mgr = KindergartenManager(db)
    bands = mgr.get_age_bands()
    assert len(bands) >= 4
    codes = {b["code"] for b in bands}
    assert {"BEBE", "PETITE", "MOYENNE", "GRANDE"}.issubset(codes)

    # Test create custom cohort
    band_code = f"PRE_{int(datetime.now().timestamp()) % 1000000}"
    new_band = mgr.create_age_band(
        code=band_code,
        name_ar="الحضانة المبكرة",
        name_en="Early Nursery",
        min_age_months=1,
        max_age_months=3,
        description="Early newborn daycare care",
    )
    assert new_band is not None
    assert new_band["code"] == band_code


def test_kg_child_books(db):
    mgr = KindergartenManager(db)
    book_num = f"BK-TEST-{int(datetime.now().timestamp()) % 1000000}"
    # Assign numbered book
    book = mgr.assign_child_book(
        student_id=1,
        book_number=book_num,
        title="كتاب الأنشطة التمهيدية",
        level_label="Petite Section 1",
        notes="Delivered to guardian",
    )
    assert book is not None
    assert book["book_number"] == book_num
    assert book["status"] == "ASSIGNED"

    # Query books
    books = mgr.get_child_books(student_id=1)
    assert any(b["book_number"] == book_num for b in books)

    # Update status to RETURNED
    updated = mgr.update_book_status(book["child_book_id"], status="RETURNED")
    assert updated["status"] == "RETURNED"
    assert updated["return_date"] is not None


def test_kg_attendance(db):
    mgr = KindergartenManager(db)
    today = date.today()
    att = mgr.mark_attendance(
        student_id=1,
        branch_id="RAWDA",
        attendance_date=today,
        status="PRESENT",
        arrival_time="08:10",
        picked_up_by="عمر بن علي (الأب)",
    )
    assert att is not None
    assert att["status"] == "PRESENT"
    assert att["picked_up_by"] == "عمر بن علي (الأب)"

    # Query attendance
    records = mgr.get_attendance(branch_id="RAWDA", attendance_date=today)
    assert len(records) >= 1


def test_kg_daily_logs_strict_ratings(db):
    mgr = KindergartenManager(db)
    today = date.today()

    # Valid daily log with A/B/C ratings across 8 categories
    log = mgr.record_daily_log(
        student_id=1,
        branch_id="RAWDA",
        log_date=today,
        breakfast="A",
        lunch="B",
        snack="A",
        sleep="A",
        study="B",
        interaction="A",
        crying="C",
        clothes_change="A",
        notes="شارك بنشاط في حصة الألوان والحساب الذهني المبكر",
    )
    assert log is not None
    assert log["breakfast"] == "A"
    assert log["lunch"] == "B"
    assert log["crying"] == "C"

    # Invalid rating should raise ValueError
    with pytest.raises(ValueError):
        mgr.record_daily_log(
            student_id=1,
            branch_id="RAWDA",
            log_date=today + timedelta(days=1),
            breakfast="X",  # Invalid
            lunch="A",
            snack="A",
            sleep="A",
            study="A",
            interaction="A",
            crying="A",
            clothes_change="A",
        )


def test_kg_monthly_report_workflow_and_double_blind_rule(db):
    mgr = KindergartenManager(db)
    # 1. Author teacher records monthly report
    report = mgr.create_monthly_report(
        student_id=1,
        branch_id="RAWDA",
        month_period="2026-11",
        author_staff_id=2,  # Teacher ID
        breakfast="A",
        lunch="A",
        snack="A",
        sleep="B",
        study="A",
        interaction="A",
        crying="A",
        clothes_change="A",
        teacher_notes="تطور ملحوظ في التفاعل الجماعي واللغوي",
        status="SUBMITTED",
    )
    assert report is not None
    report_id = report["report_id"]
    assert bool(report["visible_to_parents"]) is False

    # 2. Segregation of Duties: Author cannot review their own report!
    with pytest.raises(PermissionError):
        mgr.review_monthly_report(
            report_id=report_id,
            reviewer_admin_id=2,  # Same as author_staff_id -> Forbidden!
            status="APPROVED",
        )

    # 3. Independent Admin reviews and approves report
    approved = mgr.review_monthly_report(
        report_id=report_id,
        reviewer_admin_id=1,  # Different staff ID
        status="APPROVED",
        admin_feedback="معتمد وممتاز للنشر في تطبيق الأولياء",
    )
    assert approved is not None
    assert approved["status"] == "APPROVED"
    assert bool(approved["visible_to_parents"]) is True
    assert approved["reviewer_admin_id"] == 1


def test_kg_incidents_and_specialist_notes(db):
    mgr = KindergartenManager(db)

    # Incident Log
    inc = mgr.log_incident(
        student_id=1,
        branch_id="RAWDA",
        category="BEHAVIOR",
        description="رفض مشاركة الألعاب مع زملائه في حصة الاستراحة",
        action_taken="تم توجيهه تربوياً وإشراكه في نشاط ثنائي",
        parent_notified=True,
    )
    assert inc is not None
    assert inc["category"] == "BEHAVIOR"

    ack = mgr.acknowledge_incident(inc["incident_id"], "تمت المتابعة في البيت مع الطفل")
    assert ack["parent_acknowledgment"] is not None

    # Specialist Orthophonist Note
    note_staff = mgr.record_specialist_note(
        student_id=1,
        specialist_id=7,
        observation_type="ORTHOPHONIE",
        clinical_observations="تحسن ملحوظ في إخراج حرف الراء",
        visibility="STAFF_ONLY",
    )
    assert note_staff is not None

    note_parent = mgr.record_specialist_note(
        student_id=1,
        specialist_id=7,
        observation_type="ORTHOPHONIE",
        clinical_observations="تمارين منزلية لتحسين النطق",
        recommendations="قراءة قصة قصيرة يومياً لمدة 10 دقائق",
        visibility="STAFF_AND_PARENTS",
    )
    assert note_parent is not None

    # Check role-sensitive visibility
    parent_view = mgr.get_specialist_notes(student_id=1, viewer_role="PARENT")
    staff_view = mgr.get_specialist_notes(student_id=1, viewer_role="STAFF")
    assert any(n["specialist_note_id"] == note_parent["specialist_note_id"] for n in parent_view)
    assert not any(n["specialist_note_id"] == note_staff["specialist_note_id"] for n in parent_view)
    assert len(staff_view) >= len(parent_view)


def test_kg_child_habit_profile_and_menu(db):
    mgr = KindergartenManager(db)

    # Habit Profile
    profile = mgr.upsert_child_habit_profile(
        student_id=1,
        food_preferences="يفضل الخضار والشوربة ويكره الطماطم المطهوة",
        sleep_habits="ينام بعد قراءة قصة مصورة",
        allergies_medical="حساسية طفيفة من الفراولة",
        temperament="هادئ ومطيع",
    )
    assert profile is not None
    assert "الشوربة" in profile["food_preferences"]

    fetched = mgr.get_child_habit_profile(1)
    assert fetched["allergies_medical"] == "حساسية طفيفة من الفراولة"

    # Cafeteria Menu
    menu = mgr.set_menu_entry(
        branch_id="RAWDA",
        week_number=1,
        day_of_week=1,
        meal_type="LUNCH",
        menu_items="عدس بالخضار واللحم + سلطة جزر + برتقال",
        allergen_info="خالٍ من الغلوتين",
    )
    assert menu is not None
    assert menu["meal_type"] == "LUNCH"

    weekly = mgr.get_weekly_menu(branch_id="RAWDA", week_number=1)
    assert len(weekly) >= 1


# =============================================================================
# 2. STAFF & HR MODULE TESTS
# =============================================================================

def test_hr_positions_and_staff_profile(db):
    mgr = HRManager(db)
    positions = mgr.get_positions()
    assert len(positions) >= 6
    categories = {p["category"] for p in positions}
    assert {"TEACHING", "ADMINISTRATIVE", "NANNY", "COOK", "CLEANING", "MAINTENANCE", "ORTHOPHONIST"}.issubset(categories)

    # Extended staff profile
    staff = mgr.create_staff_profile(
        employee_id=1,
        national_id="1987123456789",
        qualifications="Licence en Sciences de l'Education",
        specialization="Pédagogie de la petite enfance",
    )
    assert staff is not None
    assert staff["employee_id"] == 1


def test_hr_multi_branch_assignment_and_attendance(db):
    mgr = HRManager(db)

    # Assign staff across branches
    assign = mgr.assign_staff_to_branch(
        employee_id=1,
        branch_id="RAWDA",
        role_in_branch="Coordinatrice Pédagogique",
        allocation_percentage=60.0,
        is_primary=True,
    )
    assert assign is not None
    assert assign["allocation_percentage"] == 60.0

    # Daily attendance with BIOMETRIC source
    today = date.today()
    att = mgr.mark_staff_attendance(
        employee_id=1,
        branch_id="RAWDA",
        attendance_date=today,
        status="PRESENT",
        check_in_time="07:50",
        source="BIOMETRIC",
    )
    assert att is not None
    assert att["source"] == "BIOMETRIC"

    # Query attendance
    records = mgr.get_staff_attendance(branch_id="RAWDA", attendance_date=today, source="BIOMETRIC")
    assert len(records) >= 1


def test_hr_job_application_and_pipeline(db):
    mgr = HRManager(db)

    # 1. Candidate applies
    app = mgr.submit_application(
        applicant_name="ياسمين بوحفص",
        email="yasmine.bouhafs@test.dz",
        phone="+213-662-112233",
        applied_position="مربية أطفال وحضانة",
        experience_years=4,
    )
    assert app is not None
    app_id = app["application_id"]
    assert app["status"] == "APPLIED"

    # 2. Schedule interview
    interv_date = datetime.now() + timedelta(days=2)
    scheduled = mgr.schedule_interview(
        application_id=app_id,
        interview_date=interv_date,
        interview_notes="اختبار مهارات الإسعافات الأولية والتنشيط الحركي",
    )
    assert scheduled["status"] == "INTERVIEW_SCHEDULED"

    # 3. Evaluate candidate with 1-5 score
    evaluated = mgr.record_interview_result(
        application_id=app_id,
        interview_rating=5,
        interview_notes="مرشحة ممتازة ذات خبرة وسلوك تربوي نموذجي",
        new_status="OFFERED",
        decision_notes="عرض منصب مربية بروضة جيجل",
    )
    assert evaluated["status"] == "OFFERED"
    assert evaluated["interview_rating"] == 5

    # Stats
    stats = mgr.get_pipeline_statistics()
    assert stats.get("OFFERED", 0) >= 1


# =============================================================================
# 3. COMMUNICATION MODULE TESTS
# =============================================================================

def test_comm_note_policy_and_time_window(db):
    mgr = CommunicationManager(db)

    # 1. Update policy to restricted window
    policy = mgr.update_policy(
        branch_id="RAWDA",
        is_enabled=True,
        window_start_time="08:00",
        window_end_time="18:00",
        allowed_days="1,2,3,4,5,6,7",
    )
    assert policy is not None
    assert bool(policy["is_enabled"]) is True

    # 2. Inside window check (mock 10:00 AM on Monday)
    open_time = datetime(2026, 11, 2, 10, 0, 0)  # Monday
    assert mgr.is_time_window_open("RAWDA", check_time=open_time) is True

    # 3. Outside window check (mock 22:00 at night)
    closed_time = datetime(2026, 11, 2, 22, 0, 0)
    assert mgr.is_time_window_open("RAWDA", check_time=closed_time) is False


def test_comm_two_way_parent_notes(db):
    mgr = CommunicationManager(db)

    # 1. Submit parent note (using bypass_policy for testing)
    note = mgr.submit_parent_note(
        student_id=1,
        branch_id="RAWDA",
        subject="طلب استلام مبكر اليوم",
        message="السلام عليكم، سيحضر الخال لاستلام الطفل على الساعة 14:00 لظرف عائلي.",
        recipient_role="TEACHER",
        bypass_policy=True,
    )
    assert note is not None
    note_id = note["note_id"]
    assert note["status"] == "OPEN"

    # 2. Staff responds
    answered = mgr.respond_to_note(
        note_id=note_id,
        staff_response="وعليكم السلام، تم تسجيل الطلب وإعلام المربية المشرفة.",
        answered_by_employee_id=1,
    )
    assert answered["status"] == "ANSWERED"
    assert answered["staff_response"] is not None

    # 3. Close note
    ok = mgr.close_note(note_id)
    assert ok is True


def test_comm_notification_queue_worker(db):
    mgr = CommunicationManager(db)

    # 1. Enqueue multi-channel notifications
    n_sms = mgr.queue_notification(
        channel="SMS",
        notification_type="ABSENCE_ALERT",
        recipient_name="عبد القادر",
        recipient_target="+213555001122",
        title="تنبيه غياب",
        body_text="نحيطكم علماً بغياب التلميذ اليوم.",
    )
    assert n_sms is not None
    assert n_sms["status"] == "QUEUED"

    n_wa = mgr.queue_notification(
        channel="WHATSAPP",
        notification_type="PAYMENT_RECEIPT",
        recipient_name="أمينة",
        recipient_target="+213661223344",
        title="وصل تسديد رسوم",
        body_text="تم استلام مبلغ 12,000 د.ج بنجاح. شكراً لثقتكم.",
    )
    assert n_wa is not None

    # 2. Worker process cycle
    result = mgr.process_delivery_queue(batch_size=10)
    assert result["processed"] >= 2
    assert result["sent"] >= 2


# =============================================================================
# 4. FINANCE MODULE TESTS
# =============================================================================

def test_fin_fee_plans_and_dynamic_overrides(db):
    mgr = FinanceManager(db)

    # 1. Fee plans query
    plans = mgr.get_fee_plans(branch_id="RAWDA")
    assert len(plans) >= 2

    # 2. Create invoice with installments
    inv = mgr.create_invoice_with_installments(
        branch_id="RAWDA",
        enrollment_id=1,
        total_amount=15000.0,
        installments=[
            {"due_date": date.today(), "amount": 7500.0, "notes": "القسط 1"},
            {"due_date": date.today() + timedelta(days=30), "amount": 7500.0, "notes": "القسط 2"},
        ],
        period_label=f"PLAN-{int(datetime.now().timestamp())}",
    )
    assert inv is not None
    invoice_id = inv["invoice_id"]
    assert len(inv["installments"]) == 2

    # 3. Dynamic price override with mandatory reason & author
    override = mgr.record_price_override(
        invoice_id=invoice_id,
        original_price=15000.0,
        overridden_price=12000.0,
        reason="تخفيض اجتماعي معتمد من الإدارة العامة للأخ الثاني",
        authorized_by_employee_id=1,
    )
    assert override is not None
    assert override["difference_amount"] == 3000.0
    assert override["authorized_by_employee_id"] == 1

    # Empty reason must fail!
    with pytest.raises(ValueError):
        mgr.record_price_override(
            invoice_id=invoice_id,
            original_price=15000.0,
            overridden_price=12000.0,
            reason="",  # Invalid
            authorized_by_employee_id=1,
        )


def test_fin_gapless_sequential_receipts_and_payment_voiding(db):
    mgr = FinanceManager(db)
    current_year = date.today().year

    # 1. Gapless sequential receipt numbers
    num1 = mgr.get_next_receipt_number("RAWDA", fiscal_year=current_year)
    num2 = mgr.get_next_receipt_number("RAWDA", fiscal_year=current_year)
    assert num1.startswith(f"REC-RAWDA-{current_year}-")
    assert num2.startswith(f"REC-RAWDA-{current_year}-")
    seq1 = int(num1.split("-")[-1])
    seq2 = int(num2.split("-")[-1])
    assert seq2 == seq1 + 1  # Strictly sequential without gaps!

    # 2. Record cash payment
    inv = mgr.create_invoice_with_installments(
        branch_id="RAWDA",
        enrollment_id=1,
        total_amount=5000.0,
        installments=[{"due_date": date.today(), "amount": 5000.0, "notes": "دفعة نقدية"}],
        period_label=f"VOID-{int(datetime.now().timestamp())}",
    )
    inv_id = inv["invoice_id"] if inv else 1

    pay = mgr.record_cash_payment(
        branch_id="RAWDA",
        invoice_id=inv_id,
        amount=5000.0,
        collected_by_employee_id=1,
        remarks="دفعة نقدية معتمدة",
    )
    assert pay is not None
    assert pay["payment_method"] == "CASH"
    assert bool(pay["is_voided"]) is False
    payment_id = pay["payment_id"]

    # 3. Payment voiding with reason (no deletes)
    voided = mgr.void_payment(
        payment_id=payment_id,
        void_reason="خطأ في تسجيل الوصل المرجعي وسيتم إعادة إصداره",
        voided_by_user_id=1,
    )
    assert voided is not None
    assert bool(voided["is_voided"]) is True
    assert voided["void_reason"] == "خطأ في تسجيل الوصل المرجعي وسيتم إعادة إصداره"


def test_fin_cash_handovers_and_daily_summary(db):
    mgr = FinanceManager(db)

    # Record handover to head office
    handover = mgr.record_cash_handover(
        branch_id="RAWDA",
        amount=25000.0,
        received_by_name="سيد علي (المحاسب العام)",
        recipient_type="HEAD_OFFICE",
        receipt_voucher_no="REM-RAWDA-0042",
    )
    assert handover is not None
    assert handover["amount"] == 25000.0

    # Daily summary view
    summary = mgr.get_daily_summary("RAWDA")
    assert summary is not None
    assert "net_balance" in summary


def test_fin_arabic_rtl_document_generators(db):
    mgr = FinanceManager(db)

    with db.get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT invoice_id FROM invoices ORDER BY invoice_id DESC;")
        inv_row = cursor.fetchone()
        inv_id = inv_row[0] if inv_row else 1

        cursor.execute("SELECT payment_id FROM payments ORDER BY payment_id DESC;")
        pay_row = cursor.fetchone()
        pay_id = pay_row[0] if pay_row else 1

    # 1. Arabic RTL Invoice HTML
    inv_html = mgr.generate_arabic_rtl_invoice_html(inv_id)
    assert "dir=\"rtl\"" in inv_html
    assert "أكاديمية وروضة الأطفال العباقرة" in inv_html
    assert "د.ج" in inv_html

    # 2. Arabic RTL Receipt HTML
    rec_html = mgr.generate_arabic_rtl_receipt_html(pay_id)
    assert "dir=\"rtl\"" in rec_html
    assert "وصل قبض نقدي" in rec_html


# =============================================================================
# 5. DATA MIGRATION MODULE TESTS
# =============================================================================

def test_mig_arabic_normalization_and_user_rule_3():
    # User Rule 3: Character '٩' (U+0669) must be interpreted strictly as 'ج'
    text_with_rule3 = "٩ميلة ٩مال"
    norm = MigrationManager.normalize_arabic_text(text_with_rule3)
    assert "جميله" in norm or "جمال" in norm or "ج" in norm
    assert "٩" not in norm

    # Diacritics and alef normalization
    complex_arabic = "  التلميذ: أَحْمَدُ بْنُ عَبْدِ الرَّحْمَنِ  "
    cleaned = MigrationManager.normalize_arabic_text(complex_arabic)
    assert "احمد بن عبد الرحمن" in cleaned


def test_mig_compound_arabic_name_splitting():
    # Compound name: عبد الرحمن بن علي
    res1 = MigrationManager.split_arabic_name("عبد الرحمن بن علي")
    assert res1["first_name"] == "عبد الرحمن"
    assert res1["last_name"] == "بن علي"
    assert res1["is_ambiguous"] is False
    assert res1["confidence"] >= 0.90

    # Compound female name: فاطمة الزهراء بلقاسم
    res2 = MigrationManager.split_arabic_name("فاطمة الزهراء بلقاسم")
    assert res2["first_name"] == "فاطمة الزهراء"
    assert res2["last_name"] == "بلقاسم"
    assert res2["is_ambiguous"] is False

    # Ambiguous single name
    res3 = MigrationManager.split_arabic_name("صهيب")
    assert res3["is_ambiguous"] is True
    assert res3["confidence"] <= 0.60


def test_mig_cohort_label_matching():
    # Inconsistent variations seen in legacy Excel
    c1 = MigrationManager.match_cohort_label("p.section 2")
    assert c1["canonical_code"] == "PETITE_2"
    assert c1["matched"] is True

    c2 = MigrationManager.match_cohort_label("p section 2")
    assert c2["canonical_code"] == "PETITE_2"

    c3 = MigrationManager.match_cohort_label("قسم تحضيري 2025")
    assert c3["canonical_code"] == "PREP_2025"

    c4 = MigrationManager.match_cohort_label("سوروبان مستوى 1")
    assert c4["canonical_code"] == "SOROBAN"


def test_mig_staging_ambiguous_queue_and_conversion(db):
    mgr = MigrationManager(db)

    # 1. Create batch
    batch = mgr.create_batch(
        filename="test_sample_students.xlsx",
        sheet_name="Section 2",
        source_branch_id="RAWDA",
    )
    assert batch is not None
    batch_id = batch["batch_id"]

    # 2. Stage rows with one clear compound name and one ambiguous single name
    sample_rows = [
        {"name": "محمد أمين زروقي", "level": "p.section 2", "fee": 12000, "paid": 6000},
        {"name": "يونس", "level": "unknown", "fee": 12000, "paid": 0},  # Ambiguous!
    ]
    staged = mgr.stage_parsed_rows(batch_id=batch_id, rows=sample_rows)
    assert staged["total_staged"] == 2
    assert staged["exact_matches"] == 1
    assert staged["ambiguous_rows"] == 1

    # 3. Retrieve ambiguous review queue
    ambiguous_queue = mgr.get_ambiguous_rows(batch_id=batch_id)
    assert len(ambiguous_queue) >= 1
    amb_row = ambiguous_queue[0]

    # 4. Human resolves ambiguous row
    resolved = mgr.resolve_ambiguous_row(
        row_id=amb_row["row_id"],
        resolved_payload={
            "first_name": "يونس",
            "last_name": "بوشارب",
            "full_name_ar": "يونس بوشارب",
            "cohort_code": "PETITE_1",
            "total_fee": 12000.0,
            "amount_paid": 6000.0,
        },
        resolved_by_user_id=1,
        review_notes="Verified full family name from paper archives.",
    )
    assert resolved["match_status"] == "EXACT_MATCH"

    # 5. Convert batch approved rows into real production records
    conv = mgr.convert_batch_approved_rows(batch_id=batch_id)
    assert conv["converted_rows"] >= 2

    # 6. Verify legacy traceability reference
    refs = mgr.get_legacy_refs(entity_type="STUDENT")
    assert len(refs) >= 2
    assert any("يونس بوشارب" in str(r.get("legacy_student_name")) for r in refs)

    # 7. Financial Reconciliation
    recon = mgr.reconcile_batch_financials(batch_id=batch_id)
    assert recon["total_staged_rows"] == 2
    assert recon["total_legacy_fee_due"] == 24000.0
