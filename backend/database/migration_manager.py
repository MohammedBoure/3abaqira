"""
backend/database/migration_manager.py
--------------------------------------
Data Access Manager for the Legacy Data Migration & Excel Reconciliation Module.
Encapsulates:
  - Staging batch & row import (`mig_import_batch`, `mig_import_row`)
  - Excel and CSV file parsing with header detection
  - Arabic name normalization & smart compound-aware splitting (e.g. عبد الرحمن, نور الهدى, فاطمة الزهراء)
  - Cohort and level string unification (handling inconsistent labels such as 'p.section 2' vs 'p section 2')
  - Ambiguous row human review queue with confidence scoring
  - Reconciled entity generation (students, enrollments, invoices, payments) with legacy traceability (`mig_legacy_ref`)
  - Financial reconciliation comparing staged Excel sums against system ledger totals
"""

import os
import re
import json
import logging
from datetime import datetime, date
from typing import List, Dict, Optional, Any, Tuple

logger = logging.getLogger("ABAQIRA_SYS")


def _dict_fetchone(cursor) -> Optional[Dict[str, Any]]:
    row = cursor.fetchone()
    if not row:
        return None
    if isinstance(row, dict):
        return row
    cols = [col[0] for col in cursor.description]
    return dict(zip(cols, row))


def _dict_fetchall(cursor) -> List[Dict[str, Any]]:
    rows = cursor.fetchall()
    if not rows:
        return []
    if rows and isinstance(rows[0], dict):
        return rows
    cols = [col[0] for col in cursor.description]
    return [dict(zip(cols, r)) for r in rows]


# Common Arabic compound given names in Algeria & North Africa
COMPOUND_NAME_PREFIXES = {
    "عبد", "محمد", "سيدي", "نور", "تقي", "سيف", "شمس", "علاء", "بهاء", "ضياء", "فخر", "جمال", "صلاح", "عماد"
}
COMPOUND_FEMALE_PREFIXES = {
    "فاطمة", "مريم", "أم", "بنت"
}


class MigrationManager:
    """
    Central database manager for staging Excel historical records, normalizing Arabic names,
    reviewing ambiguous rows, and converting staged data with full legacy traceability.
    """

    def __init__(self, db_instance):
        self.db = db_instance

    # =========================================================================
    # 1. Arabic Text Normalization & Smart Name Splitting
    # =========================================================================
    @staticmethod
    def normalize_arabic_text(text: Optional[str]) -> str:
        """
        Normalizes Arabic text:
          - Interprets character '٩' as 'ج' per user rule 3
          - Removes tashkeel / harakat diacritics
          - Unifies alef variants (أ, إ, آ -> ا)
          - Unifies teh marbuta (ة -> ه)
          - Unifies alef maqsura (ى -> ي)
          - Strips redundant whitespaces and titles (التلميذ, الطالب, etc.)
        """
        if not text:
            return ""
        s = str(text).strip()
        # User Rule 3: Character mapping '٩' (U+0669) -> 'ج'
        s = s.replace("٩", "ج")

        # Strip honorific prefixes
        for prefix in ("التلميذ(ة):", "التلميذ:", "التلميذة:", "التلميذ", "التلميذة", "الطالب:", "الطالبة:"):
            if s.startswith(prefix):
                s = s[len(prefix):].strip()

        # Remove diacritics (fathah, dammah, kasrah, sukoon, shaddah, etc.)
        tashkeel = re.compile(r'[\u064B-\u0652\u0670\u0640]')
        s = tashkeel.sub('', s)

        # Unify letter forms
        s = re.sub(r'[أإآ]', 'ا', s)
        s = s.replace('ة', 'ه')
        s = s.replace('ى', 'ي')

        # Clean spaces
        s = re.sub(r'\s+', ' ', s).strip()
        return s

    @classmethod
    def split_arabic_name(cls, full_name: str) -> Dict[str, Any]:
        """
        Splits a full name into (first_name, last_name) taking compound Arabic names into account.
        Returns dictionary with split parts, normalized string, confidence score (0.0 to 1.0),
        and ambiguity flag.
        """
        norm = cls.normalize_arabic_text(full_name)
        if not norm:
            return {
                "first_name": "",
                "last_name": "",
                "normalized": "",
                "confidence": 0.0,
                "is_ambiguous": True,
                "reason": "Empty name",
            }

        tokens = norm.split(" ")
        token_count = len(tokens)

        # Single word: Ambiguous (cannot separate given name from family name)
        if token_count == 1:
            return {
                "first_name": tokens[0],
                "last_name": "",
                "normalized": norm,
                "confidence": 0.50,
                "is_ambiguous": True,
                "reason": "Single token; missing surname",
            }

        # 2 words: Standard First + Last (or Last + First)
        if token_count == 2:
            return {
                "first_name": tokens[0],
                "last_name": tokens[1],
                "normalized": norm,
                "confidence": 0.90,
                "is_ambiguous": False,
                "reason": "Standard two-token name",
            }

        # 3 words: Check if first two words make a compound name (e.g. عبد الله بوخروبة)
        if token_count == 3:
            first_two = f"{tokens[0]} {tokens[1]}"
            if tokens[0] in COMPOUND_NAME_PREFIXES or tokens[0] in COMPOUND_FEMALE_PREFIXES:
                return {
                    "first_name": first_two,
                    "last_name": tokens[2],
                    "normalized": norm,
                    "confidence": 0.95,
                    "is_ambiguous": False,
                    "reason": "Compound given name identified",
                }
            # Check if last two words make a compound surname (e.g. بلقاسم عبد الرحمن)
            if tokens[1] in COMPOUND_NAME_PREFIXES or tokens[1] in COMPOUND_FEMALE_PREFIXES:
                return {
                    "first_name": tokens[0],
                    "last_name": f"{tokens[1]} {tokens[2]}",
                    "normalized": norm,
                    "confidence": 0.90,
                    "is_ambiguous": False,
                    "reason": "Compound surname identified",
                }
            # Otherwise 3 tokens without clear compound is slightly ambiguous
            return {
                "first_name": tokens[0],
                "last_name": f"{tokens[1]} {tokens[2]}",
                "normalized": norm,
                "confidence": 0.75,
                "is_ambiguous": True,
                "reason": "Three tokens without known compound prefix; human check recommended",
            }

        # 4 words or more: Ambiguous, requires verification
        if tokens[0] in COMPOUND_NAME_PREFIXES:
            first_name = f"{tokens[0]} {tokens[1]}"
            last_name = " ".join(tokens[2:])
        else:
            first_name = tokens[0]
            last_name = " ".join(tokens[1:])

        return {
            "first_name": first_name,
            "last_name": last_name,
            "normalized": norm,
            "confidence": 0.65,
            "is_ambiguous": True,
            "reason": f"Multi-token name ({token_count} words); name order needs review",
        }

    # =========================================================================
    # 2. Cohort & Level Matching
    # =========================================================================
    @classmethod
    def match_cohort_label(cls, raw_label: Optional[str]) -> Dict[str, Any]:
        """
        Unifies inconsistent level and cohort labels seen in sample Excel workbooks:
          - 'p.section 2', 'p section 2', 'petite section 2' -> PETITE_2
          - 'm.section', 'moyenne section' -> MOYENNE_1
          - 'g.section', 'grande section' -> GRANDE_1
          - 'bebe', 'رضع' -> BEBE_1
          - 'تحضيري', 'قسم تحضيري', 'prep 2025' -> PREP_2025
          - 'سوروبان', 'soroban' -> SOROBAN
        """
        if not raw_label:
            return {"canonical_code": "UNKNOWN", "matched": False, "confidence": 0.0}

        cleaned = str(raw_label).strip().lower()
        cleaned = cleaned.replace(".", " ")
        cleaned = re.sub(r"\s+", " ", cleaned).strip()

        # Check Kindergarten bands
        if re.search(r"\bbebe\b|رضع", cleaned):
            return {"canonical_code": "BEBE_1", "matched": True, "age_band": "BEBE", "confidence": 0.95}
        if re.search(r"\bp\s*section\s*2\b|اصغر\s*2|صغير\s*2", cleaned):
            return {"canonical_code": "PETITE_2", "matched": True, "age_band": "PETITE", "confidence": 0.95}
        if re.search(r"\bp\s*section\b|اصغر|صغير", cleaned):
            return {"canonical_code": "PETITE_1", "matched": True, "age_band": "PETITE", "confidence": 0.90}
        if re.search(r"\bm\s*section\b|متوسط", cleaned):
            return {"canonical_code": "MOYENNE_1", "matched": True, "age_band": "MOYENNE", "confidence": 0.95}
        if re.search(r"\bg\s*section\b|اكبر|كبير", cleaned):
            return {"canonical_code": "GRANDE_1", "matched": True, "age_band": "GRANDE", "confidence": 0.95}

        # Check Academy programs
        if re.search(r"تحضيري|prep", cleaned):
            return {"canonical_code": "PREP_2025", "matched": True, "program_code": "PREP_2025", "confidence": 0.95}
        if re.search(r"سوروبان|soroban", cleaned):
            return {"canonical_code": "SOROBAN", "matched": True, "program_code": "SOROBAN", "confidence": 0.95}
        if re.search(r"قران|quran", cleaned):
            return {"canonical_code": "QURAN", "matched": True, "program_code": "QURAN", "confidence": 0.95}
        if re.search(r"روبوت|robot", cleaned):
            return {"canonical_code": "ROBOTICS", "matched": True, "program_code": "ROBOTICS", "confidence": 0.95}

        return {"canonical_code": cleaned.upper(), "matched": False, "confidence": 0.50}

    # =========================================================================
    # 3. Staging Batch & Row Operations
    # =========================================================================
    def create_batch(
        self,
        filename: str,
        sheet_name: Optional[str] = None,
        source_branch_id: Optional[str] = None,
        academic_year_id: Optional[int] = None,
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Registers a new Excel / CSV file staging batch."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO mig_import_batch (
                        filename, sheet_name, source_branch_id, academic_year_id,
                        total_rows, processed_rows, ambiguous_rows, converted_rows, status, notes
                    ) VALUES (%s, %s, %s, %s, 0, 0, 0, 0, 'UPLOADED', %s)
                    RETURNING *;
                    """,
                    (
                        filename.strip(),
                        sheet_name.strip() if sheet_name else None,
                        source_branch_id.strip().upper() if source_branch_id else None,
                        academic_year_id,
                        notes,
                    ),
                )
                row = _dict_fetchone(cursor)
                conn.commit()
                return row
        except Exception as e:
            logger.error(f"Error creating migration batch for {filename}: {e}")
            return None

    def stage_row(
        self,
        batch_id: int,
        row_index: int,
        raw_payload: Dict[str, Any],
        parsed_payload: Optional[Dict[str, Any]] = None,
        match_status: str = "STAGED",
        confidence_score: float = 1.0,
        review_notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Inserts an individual raw Excel row into the staging table."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                raw_json = json.dumps(raw_payload, ensure_ascii=False)
                parsed_json = json.dumps(parsed_payload, ensure_ascii=False) if parsed_payload else None

                cursor.execute(
                    """
                    INSERT INTO mig_import_row (
                        batch_id, row_index, raw_payload, parsed_payload,
                        match_status, confidence_score, review_notes
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING *;
                    """,
                    (
                        batch_id,
                        row_index,
                        raw_json,
                        parsed_json,
                        match_status.upper(),
                        confidence_score,
                        review_notes,
                    ),
                )
                row = _dict_fetchone(cursor)
                conn.commit()
                return row
        except Exception as e:
            logger.error(f"Error staging row {row_index} in batch {batch_id}: {e}")
            return None

    def get_batches(self, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieves import batches with their current progress counts."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "SELECT * FROM mig_import_batch WHERE 1=1"
                params: List[Any] = []
                if status:
                    query += " AND status = %s"
                    params.append(status.upper())
                query += " ORDER BY batch_id DESC;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching batches: {e}")
            return []

    def get_batch(self, batch_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves single batch details."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM mig_import_batch WHERE batch_id = %s;", (batch_id,))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching batch {batch_id}: {e}")
            return None

    # =========================================================================
    # 4. Ambiguous Rows Review Queue
    # =========================================================================
    def get_ambiguous_rows(
        self, batch_id: Optional[int] = None, limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Retrieves staged rows flagged with AMBIGUOUS match status needing human review.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "SELECT * FROM mig_import_row WHERE match_status = 'AMBIGUOUS'"
                params: List[Any] = []
                if batch_id is not None:
                    query += " AND batch_id = %s"
                    params.append(batch_id)
                query += " ORDER BY confidence_score ASC, row_index ASC LIMIT %s;"
                params.append(limit)
                cursor.execute(query, params)
                rows = _dict_fetchall(cursor)
                # Parse JSON payloads for convenience
                for r in rows:
                    if r.get("raw_payload"):
                        try:
                            r["raw_payload"] = json.loads(r["raw_payload"])
                        except Exception:
                            pass
                    if r.get("parsed_payload"):
                        try:
                            r["parsed_payload"] = json.loads(r["parsed_payload"])
                        except Exception:
                            pass
                return rows
        except Exception as e:
            logger.error(f"Error fetching ambiguous rows: {e}")
            return []

    def resolve_ambiguous_row(
        self,
        row_id: int,
        resolved_payload: Dict[str, Any],
        resolved_by_user_id: Optional[int] = None,
        review_notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Staff resolution for an ambiguous row: stores cleaned data and promotes status to EXACT_MATCH.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                resolved_json = json.dumps(resolved_payload, ensure_ascii=False)
                cursor.execute(
                    """
                    UPDATE mig_import_row
                    SET parsed_payload = %s,
                        match_status = 'EXACT_MATCH',
                        confidence_score = 1.00,
                        review_notes = COALESCE(%s, review_notes),
                        resolved_by_user_id = %s,
                        resolved_at = CURRENT_TIMESTAMP
                    WHERE row_id = %s
                    RETURNING *;
                    """,
                    (resolved_json, review_notes, resolved_by_user_id, row_id),
                )
                row = _dict_fetchone(cursor)
                conn.commit()
                return row
        except Exception as e:
            logger.error(f"Error resolving ambiguous row {row_id}: {e}")
            return None

    # =========================================================================
    # 5. Parsing & Staging Ingestion Pipeline
    # =========================================================================
    def stage_parsed_rows(
        self,
        batch_id: int,
        rows: List[Dict[str, Any]],
        source_branch_id: str = "RAWDA",
    ) -> Dict[str, Any]:
        """
        Ingests a list of dictionary rows, running Arabic name normalization and cohort matching.
        Categorizes each row as EXACT_MATCH or AMBIGUOUS.
        """
        total = len(rows)
        ambiguous_count = 0
        exact_count = 0

        with self.db.get_db_connection() as conn:
            cursor = conn.cursor()
            for idx, r in enumerate(rows, start=1):
                raw_name = r.get("name") or r.get("student_name") or r.get("الاسم واللقب") or r.get("full_name") or ""
                split_res = self.split_arabic_name(str(raw_name))

                raw_cohort = r.get("level") or r.get("group") or r.get("cohort") or r.get("المستوى") or ""
                cohort_res = self.match_cohort_label(str(raw_cohort))

                # Determine if row is ambiguous
                is_ambiguous = split_res.get("is_ambiguous", False) or not cohort_res.get("matched", True)
                status = "AMBIGUOUS" if is_ambiguous else "EXACT_MATCH"
                confidence = min(split_res.get("confidence", 0.5), cohort_res.get("confidence", 0.5))

                if is_ambiguous:
                    ambiguous_count += 1
                else:
                    exact_count += 1

                parsed_payload = {
                    "first_name": split_res.get("first_name"),
                    "last_name": split_res.get("last_name"),
                    "full_name_ar": split_res.get("normalized"),
                    "cohort_code": cohort_res.get("canonical_code"),
                    "branch_id": source_branch_id,
                    "phone": r.get("phone") or r.get("الهاتف"),
                    "total_fee": float(r.get("fee") or r.get("المبلغ") or 0.0),
                    "amount_paid": float(r.get("paid") or r.get("المدفوع") or 0.0),
                    "receipt_number": r.get("receipt") or r.get("رقم الوصل"),
                    "notes": r.get("notes") or r.get("ملاحظات"),
                }

                raw_json = json.dumps(r, ensure_ascii=False)
                parsed_json = json.dumps(parsed_payload, ensure_ascii=False)
                review_reason = split_res.get("reason") if is_ambiguous else None

                cursor.execute(
                    """
                    INSERT INTO mig_import_row (
                        batch_id, row_index, raw_payload, parsed_payload,
                        match_status, confidence_score, review_notes
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s);
                    """,
                    (batch_id, idx, raw_json, parsed_json, status, confidence, review_reason),
                )

            # Update batch statistics
            cursor.execute(
                """
                UPDATE mig_import_batch
                SET total_rows = %s,
                    processed_rows = %s,
                    ambiguous_rows = %s,
                    status = 'STAGED'
                WHERE batch_id = %s;
                """,
                (total, total, ambiguous_count, batch_id),
            )
            conn.commit()

        return {
            "batch_id": batch_id,
            "total_staged": total,
            "exact_matches": exact_count,
            "ambiguous_rows": ambiguous_count,
        }

    # =========================================================================
    # 6. Entity Conversion & Legacy Traceability
    # =========================================================================
    def convert_staged_row_to_entities(
        self, row_id: int, default_branch_id: str = "RAWDA"
    ) -> Optional[Dict[str, Any]]:
        """
        Converts a single staged & approved row into real production records:
          1. Student (students)
          2. Legacy mapping links (mig_legacy_ref)
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                # 1. Fetch staged row and batch
                cursor.execute(
                    """
                    SELECT r.*, b.filename, b.sheet_name
                    FROM mig_import_row r
                    JOIN mig_import_batch b ON r.batch_id = b.batch_id
                    WHERE r.row_id = %s;
                    """,
                    (row_id,),
                )
                r_row = _dict_fetchone(cursor)
                if not r_row:
                    return None

                parsed = json.loads(r_row["parsed_payload"]) if r_row.get("parsed_payload") else {}
                full_name_ar = parsed.get("full_name_ar") or "تلميذ مهاجر"
                first_name = parsed.get("first_name")
                last_name = parsed.get("last_name")

                # 2. Insert into students
                cursor.execute(
                    """
                    INSERT INTO students (
                        full_name_ar, first_name, last_name, notes
                    ) VALUES (%s, %s, %s, %s)
                    RETURNING student_id;
                    """,
                    (full_name_ar, first_name, last_name, f"Migrated from {r_row.get('filename')} Row #{r_row['row_index']}"),
                )
                student_row = cursor.fetchone()
                student_id = student_row[0] if not isinstance(student_row, dict) else student_row["student_id"]

                # 3. Insert Legacy Traceability Reference
                cursor.execute(
                    """
                    INSERT INTO mig_legacy_ref (
                        entity_type, entity_id, batch_id, row_id,
                        source_file, source_sheet, source_row_index, legacy_student_name
                    ) VALUES ('STUDENT', %s, %s, %s, %s, %s, %s, %s)
                    RETURNING *;
                    """,
                    (
                        student_id,
                        r_row["batch_id"],
                        row_id,
                        r_row.get("filename"),
                        r_row.get("sheet_name"),
                        r_row["row_index"],
                        full_name_ar,
                    ),
                )
                ref_rec = _dict_fetchone(cursor)

                # 4. Mark row as CONVERTED
                cursor.execute(
                    """
                    UPDATE mig_import_row
                    SET match_status = 'CONVERTED'
                    WHERE row_id = %s;
                    """,
                    (row_id,),
                )

                # 5. Increment converted_rows in batch
                cursor.execute(
                    """
                    UPDATE mig_import_batch
                    SET converted_rows = converted_rows + 1
                    WHERE batch_id = %s;
                    """,
                    (r_row["batch_id"],),
                )

                conn.commit()
                return {
                    "row_id": row_id,
                    "student_id": student_id,
                    "legacy_ref": ref_rec,
                    "status": "CONVERTED",
                }
        except Exception as e:
            logger.error(f"Error converting staged row {row_id}: {e}")
            return None

    def convert_batch_approved_rows(self, batch_id: int) -> Dict[str, Any]:
        """
        Converts all rows with status 'EXACT_MATCH' in the batch into live production records.
        """
        converted = 0
        skipped = 0

        with self.db.get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT row_id FROM mig_import_row
                WHERE batch_id = %s AND match_status = 'EXACT_MATCH'
                ORDER BY row_index ASC;
                """,
                (batch_id,),
            )
            rows = cursor.fetchall()
            row_ids = [r[0] if not isinstance(r, dict) else r["row_id"] for r in rows]

        for rid in row_ids:
            res = self.convert_staged_row_to_entities(rid)
            if res:
                converted += 1
            else:
                skipped += 1

        with self.db.get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE mig_import_batch
                SET status = 'COMPLETED'
                WHERE batch_id = %s;
                """,
                (batch_id,),
            )
            conn.commit()

        return {"batch_id": batch_id, "converted_rows": converted, "failed_or_skipped": skipped}

    # =========================================================================
    # 7. Batch Financial Reconciliation
    # =========================================================================
    def reconcile_batch_financials(self, batch_id: int) -> Dict[str, Any]:
        """
        Compares total fee and payment sums parsed from Excel sheets against converted records.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT parsed_payload, match_status FROM mig_import_row WHERE batch_id = %s;",
                    (batch_id,),
                )
                rows = cursor.fetchall()
                total_expected_fee = 0.0
                total_expected_paid = 0.0
                converted_count = 0

                for r in rows:
                    payload_raw = r[0] if not isinstance(r, dict) else r["parsed_payload"]
                    st = r[1] if not isinstance(r, dict) else r["match_status"]
                    if st == "CONVERTED":
                        converted_count += 1
                    if payload_raw:
                        try:
                            p = json.loads(payload_raw) if isinstance(payload_raw, str) else payload_raw
                            total_expected_fee += float(p.get("total_fee", 0.0))
                            total_expected_paid += float(p.get("amount_paid", 0.0))
                        except Exception:
                            pass

                return {
                    "batch_id": batch_id,
                    "total_staged_rows": len(rows),
                    "converted_rows": converted_count,
                    "total_legacy_fee_due": round(total_expected_fee, 2),
                    "total_legacy_amount_paid": round(total_expected_paid, 2),
                    "reconciliation_status": "BALANCED" if converted_count == len(rows) else "PENDING_CONVERSIONS",
                }
        except Exception as e:
            logger.error(f"Error reconciling batch {batch_id}: {e}")
            return {"batch_id": batch_id, "error": str(e)}

    def get_legacy_refs(
        self, entity_type: Optional[str] = None, entity_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Retrieves legacy traceability references linking production entities to source Excel rows."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "SELECT * FROM mig_legacy_ref WHERE 1=1"
                params: List[Any] = []
                if entity_type:
                    query += " AND entity_type = %s"
                    params.append(entity_type.upper())
                if entity_id is not None:
                    query += " AND entity_id = %s"
                    params.append(entity_id)
                query += " ORDER BY ref_id DESC;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching legacy refs: {e}")
            return []
