"""
backend/app.py
---------------
Main FastAPI Application Entrypoint for 3abaqira Enterprise Management Platform.
Initializes the FastAPI application, mounts modular REST API routers from backend/apis,
configures CORS, handles application lifecycles, and serves API documentation.
"""

import os
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure backend root is on Python sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.database import Database, logger
from backend.apis import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles startup verification and graceful shutdown."""
    logger.info("Initializing 3abaqira Enterprise Backend Service...")
    try:
        db = Database()
        logger.info("Database singleton initialized & schema verified.")
    except Exception as e:
        logger.error(f"Startup warning: Database initialization deferred or error: {e}")
    yield
    logger.info("3abaqira Enterprise Backend Service stopped.")


# Create FastAPI App Instance
app = FastAPI(
    title="3abaqira Enterprise Management API",
    description=(
        "Backend REST API for 3abaqira Academy & Daycare (أكاديمية وروضة الأطفال العباقرة). "
        "Provides multi-tenant branch isolation, JWT authentication, academic cycles, and infrastructure management."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for frontend clients (Vite / Next.js / Desktop clients)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount modular API router
app.include_router(api_router)


# Root Endpoint
@app.get("/", tags=["Root"])
def root():
    return {
        "service": "3abaqira Enterprise Management API",
        "version": "1.0.0",
        "documentation": "/docs",
        "redoc": "/redoc",
        "endpoints": {
            "auth": "/api/auth/login",
            "health": "/api/health",
            "branches": "/api/branches",
            "academic_years": "/api/academic-years",
            "classrooms": "/api/classrooms",
            "guardians": "/api/guardians",
            "students": "/api/students",
            "programs": "/api/programs",
            "levels": "/api/levels",
            "pricing_plans": "/api/pricing-plans",
            "groups": "/api/groups",
            "schedules": "/api/schedules",
            "sessions": "/api/sessions",
            "enrollments": "/api/enrollments",
            "invoices": "/api/invoices",
            "system_overview": "/api/system/overview",
        },
    }


# Standalone runner
if __name__ == "__main__":
    try:
        import uvicorn
        uvicorn.run("backend.app:app", host="0.0.0.0", port=8000, reload=True)
    except ImportError:
        print("Uvicorn is not installed. Run: pip install uvicorn")
