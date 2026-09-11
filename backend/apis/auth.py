"""
backend/apis/auth.py
--------------------
Authentication & Token Lifecycle REST Router.
Provides endpoints for:
  - User Login via JSON payload (`/login`)
  - OAuth2 Password Request Form (`/token`) for Swagger UI compatibility
  - Current identity profile inspection (`/me`)
  - Token refresh (`/refresh`)
  - Password updating (`/change-password`)
"""

import logging
from typing import Optional, Dict, Any
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field

from backend.database import Database, get_database, UserManager
from backend.apis.security import (
    create_access_token,
    create_refresh_token,
    verify_password,
    hash_password,
    get_current_user,
    get_current_active_user,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)

logger = logging.getLogger("ABAQIRA_SYS")

router = APIRouter(prefix="/auth", tags=["Authentication"])


# =============================================================================
# DATA TRANSFER OBJECTS (SCHEMAS)
# =============================================================================

class LoginRequest(BaseModel):
    username: str = Field(..., description="System username", example="admin")
    password: str = Field(..., description="Account secret password", example="Admin@123456")


class UserProfileResponse(BaseModel):
    user_id: int
    branch_id: Optional[str] = None
    username: str
    full_name: str
    email: Optional[str] = None
    role: str
    is_active: bool
    last_login: Optional[Any] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_seconds: int
    user: UserProfileResponse


class RefreshRequest(BaseModel):
    refresh_token: str = Field(..., description="Valid refresh token")


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(..., description="Current plaintext password")
    new_password: str = Field(..., min_length=6, description="New plaintext password")


# =============================================================================
# AUTHENTICATION ROUTE HANDLERS
# =============================================================================

@router.post(
    "/login",
    response_model=TokenResponse,
    summary="User login (JSON)",
    description="Authenticates credentials and returns a signed JWT access token along with user profile.",
)
def login(payload: LoginRequest, db: Database = Depends(get_database)):
    user_mgr = UserManager(db)
    user = user_mgr.get_by_username(payload.username, include_password_hash=True)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled. Please contact an administrator.",
        )

    stored_hash = user.get("password_hash")
    if not stored_hash or not verify_password(payload.password, stored_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Update last login timestamp
    user_mgr.update_last_login(user["user_id"])

    # Create JWT claims
    claims = {
        "sub": user["username"],
        "user_id": user["user_id"],
        "role": user["role"],
        "branch_id": user.get("branch_id"),
    }
    access_token = create_access_token(claims)

    user_profile = {k: v for k, v in user.items() if k != "password_hash"}

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in_seconds=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_profile,
    )


@router.post(
    "/token",
    summary="OAuth2 Password Flow (OpenAPI/Swagger UI)",
    description="Standard OAuth2 compliant endpoint allowing interactive Swagger UI authorization.",
)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Database = Depends(get_database),
):
    user_mgr = UserManager(db)
    user = user_mgr.get_by_username(form_data.username, include_password_hash=True)

    if not user or not verify_password(form_data.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated.",
        )

    user_mgr.update_last_login(user["user_id"])

    claims = {
        "sub": user["username"],
        "user_id": user["user_id"],
        "role": user["role"],
        "branch_id": user.get("branch_id"),
    }
    token = create_access_token(claims)
    return {"access_token": token, "token_type": "bearer"}


@router.get(
    "/me",
    response_model=UserProfileResponse,
    summary="Get current user profile",
    description="Returns the profile information of the currently authenticated JWT bearer.",
)
def get_current_user_profile(
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    return current_user


@router.post(
    "/change-password",
    summary="Change account password",
    description="Allows the authenticated user to change their current password.",
)
def change_password(
    payload: PasswordChangeRequest,
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: Database = Depends(get_database),
):
    user_mgr = UserManager(db)
    full_user = user_mgr.get_by_id(current_user["user_id"], include_password_hash=True)
    if not full_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if not verify_password(payload.current_password, full_user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password verification failed.",
        )

    new_hash = hash_password(payload.new_password)
    success = user_mgr.update_password(current_user["user_id"], new_hash)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update password.",
        )

    return {"message": "Password updated successfully."}
