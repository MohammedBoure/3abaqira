"""
backend/apis/users.py
---------------------
User Identity & RBAC Administration REST Router.
Provides endpoints for:
  - Listing system users across branches (Admin protected)
  - Inspecting user profiles
  - Provisioning new employee/staff accounts (Admin protected)
  - Modifying user roles and tenant branch scopes (Admin protected)
  - Toggling user account active status (Admin protected)
  - Administrator password reset (Admin protected)
  - Deleting user accounts (Super Admin protected)
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from pydantic import BaseModel, Field, EmailStr

from backend.database import Database, get_database, UserManager
from backend.apis.security import require_role, hash_password, get_current_active_user

router = APIRouter(prefix="/users", tags=["User Management"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Unique username", example="teacher_fatima")
    full_name: str = Field(..., description="Full name of staff member", example="فاطمة الزهراء بن علي")
    email: Optional[str] = Field(None, description="Contact email", example="fatima@3abaqira.dz")
    role: str = Field("STAFF", description="User role: SUPER_ADMIN, ADMIN, DIRECTOR, TEACHER, STAFF, ACCOUNTANT", example="TEACHER")
    branch_id: Optional[str] = Field(None, description="Assigned branch code (or NULL for global)", example="CENTER")
    is_active: bool = Field(True, description="Account active status")


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Initial plaintext password", example="SecurePass123!")


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    branch_id: Optional[str] = None
    is_active: Optional[bool] = None


class AdminPasswordResetRequest(BaseModel):
    new_password: str = Field(..., min_length=6, description="New plaintext password for user")


class UserStatusToggleRequest(BaseModel):
    is_active: bool = Field(..., description="Active flag")


# =============================================================================
# DEPENDENCY PROVIDER
# =============================================================================

def get_user_mgr(db: Database = Depends(get_database)) -> UserManager:
    return UserManager(db)


# =============================================================================
# ROUTE HANDLERS
# =============================================================================

@router.get(
    "",
    summary="List all users",
    description="Lists system user accounts with optional filtering by branch, role, and active status. Requires ADMIN role.",
    dependencies=[Depends(require_role("ADMIN", "DIRECTOR"))],
)
def list_users(
    branch_id: Optional[str] = Query(None, description="Filter by assigned branch"),
    role: Optional[str] = Query(None, description="Filter by system role"),
    active_only: bool = Query(False, description="Filter active accounts only"),
    mgr: UserManager = Depends(get_user_mgr),
):
    return mgr.get_all(branch_id=branch_id, role=role, active_only=active_only)


@router.get(
    "/{user_id}",
    summary="Get user by ID",
    description="Retrieves a user profile by ID. Users can view their own profile; admins can view any profile.",
)
def get_user(
    user_id: int = Path(..., description="User ID"),
    current_user: dict = Depends(get_current_active_user),
    mgr: UserManager = Depends(get_user_mgr),
):
    # Allow self inspection or admin inspection
    is_admin = current_user.get("role") in ("ADMIN", "SUPER_ADMIN", "DIRECTOR")
    if current_user.get("user_id") != user_id and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this user profile.",
        )

    user = mgr.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User ID {user_id} not found.",
        )
    return user


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Provision new user",
    description="Creates a new user account with hashed password. Requires ADMIN role.",
    dependencies=[Depends(require_role("ADMIN"))],
)
def create_user(
    payload: UserCreate,
    mgr: UserManager = Depends(get_user_mgr),
):
    existing = mgr.get_by_username(payload.username)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Username '{payload.username}' is already registered.",
        )

    hashed_pw = hash_password(payload.password)
    created = mgr.create(
        username=payload.username,
        password_hash=hashed_pw,
        full_name=payload.full_name,
        email=payload.email,
        role=payload.role,
        branch_id=payload.branch_id,
        is_active=payload.is_active,
    )
    if not created:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user account.",
        )
    return created


@router.put(
    "/{user_id}",
    summary="Update user details",
    description="Modifies a user's details, role, or branch assignment. Requires ADMIN role.",
    dependencies=[Depends(require_role("ADMIN"))],
)
def update_user(
    user_id: int,
    payload: UserUpdate,
    mgr: UserManager = Depends(get_user_mgr),
):
    existing = mgr.get_by_id(user_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User ID {user_id} not found.",
        )

    success = mgr.update(user_id, **payload.model_dump(exclude_unset=True))
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Update failed or no modifications provided.",
        )
    return mgr.get_by_id(user_id)


@router.patch(
    "/{user_id}/status",
    summary="Toggle user active status",
    description="Enables or disables a user account. Requires ADMIN role.",
    dependencies=[Depends(require_role("ADMIN"))],
)
def toggle_user_status(
    user_id: int,
    payload: UserStatusToggleRequest,
    current_user: dict = Depends(get_current_active_user),
    mgr: UserManager = Depends(get_user_mgr),
):
    if current_user.get("user_id") == user_id and not payload.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators cannot deactivate their own active account.",
        )

    existing = mgr.get_by_id(user_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User ID {user_id} not found.",
        )

    mgr.toggle_status(user_id, payload.is_active)
    return {
        "user_id": user_id,
        "is_active": payload.is_active,
        "message": "User status successfully updated.",
    }


@router.post(
    "/{user_id}/reset-password",
    summary="Admin password reset",
    description="Forces a password reset for a target user. Requires ADMIN role.",
    dependencies=[Depends(require_role("ADMIN"))],
)
def admin_reset_password(
    user_id: int,
    payload: AdminPasswordResetRequest,
    mgr: UserManager = Depends(get_user_mgr),
):
    existing = mgr.get_by_id(user_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User ID {user_id} not found.",
        )

    new_hash = hash_password(payload.new_password)
    success = mgr.update_password(user_id, new_hash)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset password.",
        )
    return {"message": f"Password for user ID {user_id} reset successfully."}


@router.delete(
    "/{user_id}",
    summary="Delete user account",
    description="Permanently removes a user account. Requires SUPER_ADMIN role.",
    dependencies=[Depends(require_role("SUPER_ADMIN"))],
)
def delete_user(
    user_id: int,
    current_user: dict = Depends(get_current_active_user),
    mgr: UserManager = Depends(get_user_mgr),
):
    if current_user.get("user_id") == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own active administrator account.",
        )

    existing = mgr.get_by_id(user_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User ID {user_id} not found.",
        )

    success = mgr.delete(user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user account.",
        )
    return {"message": f"User ID {user_id} permanently deleted."}
