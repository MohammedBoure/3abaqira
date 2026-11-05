import os
import pytest
from backend.database import Database

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    db_path = "3abaqira_dev.db"
    if os.path.exists(db_path):
        os.remove(db_path)
    # Reset singleton state to ensure fresh initialization
    Database._instance = None
    db = Database()
    db._schema.initialize(force=True)
    yield db

@pytest.fixture
def db(setup_test_db):
    """Provides the active database instance across test functions."""
    return setup_test_db
