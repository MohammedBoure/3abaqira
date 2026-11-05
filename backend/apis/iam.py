"""
backend/apis/iam.py
--------------------
REST API Router for Identity & Access Management (IAM):
  - iam_account: Account lifecycle & fee payment auto-activation
  - Dynamic permission catalog & role administration
  - Multi-branch role assignments (global vs branch-scoped)
  - Effective permission resolution
"""

from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field

from backend.database import Database, get_database, IAMManager
from backend.apis.security import hash_password

router = APIRouter(prefix="/iam", tags=["Identity & Access Management (IAM)"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================
class AccountCreate(BaseModel):
    person_id: int
    username: str
    password: str
    is_under_14: bool = False


class FeePaymentRequest(BaseModel):
    fee_type: str = Field(..., description="REGISTRATION, FIRST_LEVEL, or FULL")


class PermissionCreate(BaseModel):
    code: str
    name: str
    module: str
    description: Optional[str] = None


class RoleCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    permission_ids: Optional[List[int]] = None


class RolePermissionAssign(BaseModel):
    permission_ids: List[int]


class PersonRoleAssign(BaseModel):
    role_id: int
    branch_id: Optional[str] = Field(None, description="Optional branch code; None applies globally to all branches")


# =============================================================================
# ENDPOINTS: ACCOUNTS & FEE ACTIVATION LIFECYCLE
# =============================================================================
@router.post("/accounts", status_code=status.HTTP_201_CREATED, summary="Create user account (PENDING status)")
def create_account(payload: AccountCreate, db: Database = Depends(get_database)):
    mgr = IAMManager(db)
    try:
        pw_hash = hash_password(payload.password)
        account = mgr.create_account(
            person_id=payload.person_id,
            username=payload.username,
            password_hash=pw_hash,
            is_under_14=payload.is_under_14,
        )
        return account
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/accounts/{person_id}", summary="Get account by person ID")
def get_account(person_id: int, db: Database = Depends(get_database)):
    mgr = IAMManager(db)
    account = mgr.get_account_by_person_id(person_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    account.pop("password_hash", None)
    return account


@router.post("/accounts/{person_id}/fee-payment", summary="Record fee payment & auto-activate account")
def record_fee_payment(
    person_id: int,
    payload: FeePaymentRequest,
    db: Database = Depends(get_database),
):
    mgr = IAMManager(db)
    try:
        updated = mgr.record_fee_payment_and_evaluate_activation(
            person_id=person_id, fee_type=payload.fee_type
        )
        if not updated:
            raise HTTPException(status_code=404, detail="Account for person not found")
        updated.pop("password_hash", None)
        return {
            "message": f"Fee payment recorded. Current account status: {updated['status']}",
            "account": updated,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# =============================================================================
# ENDPOINTS: DYNAMIC PERMISSION CATALOG
# =============================================================================
@router.get("/permissions", summary="List permission catalog")
def list_permissions(
    module: Optional[str] = None,
    db: Database = Depends(get_database),
):
    mgr = IAMManager(db)
    return mgr.get_all_permissions(module=module)


@router.post("/permissions", status_code=status.HTTP_201_CREATED, summary="Create catalog permission")
def create_permission(payload: PermissionCreate, db: Database = Depends(get_database)):
    mgr = IAMManager(db)
    try:
        return mgr.create_permission(**payload.dict())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# =============================================================================
# ENDPOINTS: DYNAMIC ROLES
# =============================================================================
@router.get("/roles", summary="List dynamic roles")
def list_roles(db: Database = Depends(get_database)):
    mgr = IAMManager(db)
    return mgr.get_all_roles()


@router.post("/roles", status_code=status.HTTP_201_CREATED, summary="Create dynamic role")
def create_role(payload: RoleCreate, db: Database = Depends(get_database)):
    mgr = IAMManager(db)
    try:
        return mgr.create_role(**payload.dict())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/roles/{role_id}", summary="Get role with its permissions")
def get_role(role_id: int, db: Database = Depends(get_database)):
    mgr = IAMManager(db)
    role = mgr.get_role_by_id(role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role


@router.put("/roles/{role_id}/permissions", summary="Set permissions for role")
def assign_role_permissions(
    role_id: int,
    payload: RolePermissionAssign,
    db: Database = Depends(get_database),
):
    mgr = IAMManager(db)
    mgr.assign_permissions_to_role(role_id=role_id, permission_ids=payload.permission_ids)
    return {"message": "Role permissions updated successfully."}


# =============================================================================
# ENDPOINTS: PERSON ROLES & EFFECTIVE PERMISSIONS
# =============================================================================
@router.post("/persons/{person_id}/roles", summary="Assign role to person (branch-level or global)")
def assign_role(
    person_id: int,
    payload: PersonRoleAssign,
    db: Database = Depends(get_database),
):
    mgr = IAMManager(db)
    try:
        assigned = mgr.assign_role_to_person(
            person_id=person_id,
            role_id=payload.role_id,
            branch_id=payload.branch_id,
        )
        return assigned
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/persons/{person_id}/roles/{role_id}", summary="Remove role assignment")
def remove_role(
    person_id: int,
    role_id: int,
    branch_id: Optional[str] = Query(None),
    db: Database = Depends(get_database),
):
    mgr = IAMManager(db)
    success = mgr.remove_role_from_person(person_id=person_id, role_id=role_id, branch_id=branch_id)
    return {"success": success}


@router.get("/persons/{person_id}/roles", summary="Get roles assigned to person")
def get_person_roles(
    person_id: int,
    branch_id: Optional[str] = None,
    db: Database = Depends(get_database),
):
    mgr = IAMManager(db)
    return mgr.get_person_roles(person_id=person_id, branch_id=branch_id)


@router.get("/persons/{person_id}/permissions", summary="Get effective permissions for person")
def get_effective_permissions(
    person_id: int,
    branch_id: Optional[str] = None,
    db: Database = Depends(get_database),
):
    mgr = IAMManager(db)
    perms = mgr.get_effective_permissions(person_id=person_id, branch_id=branch_id)
    return {"person_id": person_id, "branch_id": branch_id, "permissions": sorted(list(perms))}
