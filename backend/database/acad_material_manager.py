"""
backend/database/acad_material_manager.py
------------------------------------------
Data Access Manager for Digital Course Materials & Download Access Control (acad_material):
  - Online books, homework assignments, and worksheets
  - Strict enrollment verification: Downloads restricted to students actively enrolled in the course
"""

import logging
from typing import List, Dict, Optional, Any

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


class AcadMaterialManager:
    """
    Manages course materials and enforces access control ensuring
    only actively enrolled students can access and download files.
    """

    def __init__(self, db_instance):
        self.db = db_instance

    def create_material(
        self,
        course_id: int,
        title: str,
        material_type: str,
        file_path: str,
        file_size_bytes: int = 0,
        mime_type: str = "application/pdf",
        description: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Registers a new digital material for a course."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                INSERT INTO acad_material (
                    course_id, title, material_type, file_path, file_size_bytes, mime_type, description, is_active
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE)
                RETURNING *;
                """
                cursor.execute(
                    query,
                    (
                        course_id,
                        title.strip(),
                        material_type.strip().upper(),
                        file_path.strip(),
                        file_size_bytes,
                        mime_type.strip(),
                        description,
                    ),
                )
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error creating course material '{title}': {e}")
            raise

    def get_materials_by_course(
        self, course_id: int, active_only: bool = True
    ) -> List[Dict[str, Any]]:
        """Lists materials available for a course level."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "SELECT * FROM acad_material WHERE course_id = %s"
                params = [course_id]
                if active_only:
                    query += " AND is_active = TRUE"
                query += " ORDER BY material_id ASC;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching materials for course {course_id}: {e}")
            return []

    def can_student_access_material(self, student_id: int, material_id: int) -> bool:
        """
        Enforces access rule:
        A student can ONLY access or download materials for courses they are currently
        actively enrolled in.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                SELECT e.enrollment_id
                FROM acad_material m
                JOIN acad_enrollment e ON m.course_id = e.course_id
                WHERE m.material_id = %s
                  AND e.student_id = %s
                  AND e.status = 'ACTIVE';
                """
                cursor.execute(query, (material_id, student_id))
                return cursor.fetchone() is not None
        except Exception as e:
            logger.error(f"Error checking material access for student {student_id}: {e}")
            return False

    def download_material(self, student_id: int, material_id: int) -> Dict[str, Any]:
        """
        Retrieves material details for download after verifying active enrollment.
        Raises PermissionError if student is not actively enrolled in the course.
        """
        if not self.can_student_access_material(student_id, material_id):
            raise PermissionError(
                f"Access denied: Student #{student_id} is not actively enrolled in the course "
                f"associated with material #{material_id}."
            )

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM acad_material WHERE material_id = %s;", (material_id,))
                material = _dict_fetchone(cursor)
                if not material:
                    raise ValueError(f"Material {material_id} not found.")
                return material
        except Exception as e:
            logger.error(f"Error downloading material {material_id}: {e}")
            raise
