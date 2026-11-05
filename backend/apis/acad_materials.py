"""
backend/apis/acad_materials.py
-------------------------------
REST API Router for Digital Course Materials & Access Control (acad_material):
  - Online books, homework assignments, and worksheets
  - Download access strictly restricted to actively enrolled students
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from backend.database import Database, get_database, AcadMaterialManager

router = APIRouter(prefix="/acad", tags=["Academy Course Materials"])


class MaterialCreate(BaseModel):
    course_id: int
    title: str
    material_type: str = Field(..., description="BOOK, HOMEWORK, WORKSHEET, AUDIO, VIDEO, SOLUTION")
    file_path: str = Field(..., description="File path or URL")
    file_size_bytes: int = 0
    mime_type: str = "application/pdf"
    description: Optional[str] = None


@router.post("/materials", status_code=status.HTTP_201_CREATED, summary="Upload/Register course material")
def create_material(payload: MaterialCreate, db: Database = Depends(get_database)):
    mgr = AcadMaterialManager(db)
    try:
        return mgr.create_material(**payload.dict())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/courses/{course_id}/materials", summary="List materials for course level")
def list_course_materials(
    course_id: int,
    active_only: bool = True,
    db: Database = Depends(get_database),
):
    mgr = AcadMaterialManager(db)
    return mgr.get_materials_by_course(course_id=course_id, active_only=active_only)


@router.get("/students/{student_id}/materials/{material_id}/download", summary="Download material (restricted to enrolled students)")
def download_material(
    student_id: int,
    material_id: int,
    db: Database = Depends(get_database),
):
    mgr = AcadMaterialManager(db)
    try:
        material = mgr.download_material(student_id=student_id, material_id=material_id)
        return {
            "message": "Access granted: Student active enrollment verified.",
            "material": material,
        }
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
