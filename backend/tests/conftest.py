import os
import pytest
from backend.database import Database

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    db_path = "3abaqira_dev.db"
    if os.path.exists(db_path):
        os.remove(db_path)
    # Initialize fresh database once for session
    db = Database()
    yield db
