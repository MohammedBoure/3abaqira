"""
backend/apis/security.py
-------------------------
Security, JWT token lifecycle, and role-based authorization services.
Implements:
  - Secure bcrypt password hashing and verification
  - JWT Access and Refresh token encoding / decoding (HS256)
  - FastAPI dependency injection guards:
      * get_current_user
      * get_current_active_user
      * require_role(*allowed_roles)
      * get_optional_current_user
"""

import os
import time
import hmac
import hashlib
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any, Callable

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials

from backend.database import Database, get_database, UserManager

logger = logging.getLogger("ABAQIRA_SYS")

# =============================================================================
# CONFIGURATION & CONSTANTS
# =============================================================================

JWT_SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY",
    "3abaqira_jwt_super_secure_signing_secret_key_2025_prod_enterprise_algeria"
)
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))        # 7 days

# Scheme for Swagger UI Authorize dialog and standard Bearer header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)
http_bearer = HTTPBearer(auto_error=False)


# =============================================================================
# PASSWORD HASHING UTILITIES
# =============================================================================

try:
    import bcrypt

    def hash_password(plain_password: str) -> str:
        """Hashes a plain password using bcrypt with automated salt generation."""
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(plain_password.encode("utf-8"), salt)
        return hashed.decode("utf-8")

    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verifies a plain password against stored bcrypt hash."""
        try:
            return bcrypt.checkpw(
                plain_password.encode("utf-8"),
                hashed_password.encode("utf-8")
            )
        except Exception as e:
            logger.warning(f"Bcrypt verification error: {e}")
            return False

except ImportError:
    # Pure-Python fallback using PBKDF2-HMAC-SHA256
    logger.warning("Bcrypt package not installed; falling back to hashlib PBKDF2.")

    def hash_password(plain_password: str) -> str:
        salt = os.urandom(16)
        key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, 100_000)
        return f"pbkdf2_sha256${salt.hex()}${key.hex()}"

    def verify_password(plain_password: str, hashed_password: str) -> bool:
        try:
            if not hashed_password.startswith("pbkdf2_sha256$"):
                return False
            _, salt_hex, key_hex = hashed_password.split("$")
            salt = bytes.fromhex(salt_hex)
            key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, 100_000)
            return hmac.compare_digest(key.hex(), key_hex)
        except Exception:
            return False


# =============================================================================
# JWT TOKEN ISSUANCE & VERIFICATION
# =============================================================================

def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Encodes standard JWT claims for an authenticated user session.
    Payload includes 'sub' (username), user ID, assigned role, and branch scope.
    """
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({
        "exp": expire,
        "iat": now,
        "type": "access"
    })
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def create_refresh_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """Generates a long-lived refresh token for token renewal."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode.update({
        "exp": expire,
        "iat": now,
        "type": "refresh"
    })
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    """
    Validates signature, expiration, and claims of a JWT string.
    Raises HTTPException(401) on failure.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError as e:
        logger.warning(f"JWT decode error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )


# =============================================================================
# FASTAPI DEPENDENCIES & AUTHORIZATION GUARDS
# =============================================================================

def get_current_user(
    token_oauth: Optional[str] = Depends(oauth2_scheme),
    bearer_creds: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer),
    db: Database = Depends(get_database),
) -> Dict[str, Any]:
    """
    FastAPI dependency extracting and verifying the JWT token from HTTP Authorization header.
    Returns the authenticated user entity dictionary from the database.
    """
    raw_token = token_oauth or (bearer_creds.credentials if bearer_creds else None)
    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided in Authorization header.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(raw_token)
    username: Optional[str] = payload.get("sub")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token: missing subject identity claim.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_mgr = UserManager(db)
    user = user_mgr.get_by_username(username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User identity associated with token no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated. Contact system administrator.",
        )

    return user


def get_current_active_user(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Ensures the authenticated user is currently active."""
    if not current_user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account.",
        )
    return current_user


def get_optional_current_user(
    token_oauth: Optional[str] = Depends(oauth2_scheme),
    bearer_creds: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer),
    db: Database = Depends(get_database),
) -> Optional[Dict[str, Any]]:
    """
    Optional user dependency. Returns user if valid token present, None otherwise.
    Never raises HTTP 401. Useful for public endpoints with optional personalization.
    """
    raw_token = token_oauth or (bearer_creds.credentials if bearer_creds else None)
    if not raw_token:
        return None
    try:
        payload = decode_token(raw_token)
        username = payload.get("sub")
        if not username:
            return None
        user_mgr = UserManager(db)
        return user_mgr.get_by_username(username)
    except Exception:
        return None


def require_role(*allowed_roles: str) -> Callable:
    """
    Role-based Access Control (RBAC) dependency factory.
    Enforces that current user belongs to one of the allowed roles.
    SUPER_ADMIN always possesses unrestricted access across all endpoints.
    
    Usage:
        @router.post("/branches", dependencies=[Depends(require_role("ADMIN", "DIRECTOR"))])
        def create_branch(...):
            ...
    """
    normalized_roles = {r.upper() for r in allowed_roles}
    normalized_roles.add("SUPER_ADMIN")  # Super admin is always authorized

    def role_checker(
        current_user: Dict[str, Any] = Depends(get_current_active_user)
    ) -> Dict[str, Any]:
        user_role = (current_user.get("role") or "").upper()
        if user_role not in normalized_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Access forbidden: requires one of the roles {sorted(list(normalized_roles))}. "
                    f"Current user role is '{user_role}'."
                ),
            )
        return current_user

    return role_checker
