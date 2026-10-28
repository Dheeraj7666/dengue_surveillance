from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

SQLALCHEMY_DATABASE_URL = "sqlite:///./api/data/denguecare.db"

# Ensure data directory exists
os.makedirs(os.path.dirname(SQLALCHEMY_DATABASE_URL.replace("sqlite:///./", "")), exist_ok=True)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Columns added after the initial prototype schema. Applied on startup so an
# existing SQLite database keeps working without a manual migration.
_APPROVED_DATA_COLUMNS = {
    "suspected_cases": "INTEGER",
    "hospital_admissions": "INTEGER",
    "population": "INTEGER",
}

def init_db():
    """Create missing tables and add any new columns to existing ones."""
    from api.models import schemas  # noqa: F401  (register models on Base)

    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    if "approved_data" not in inspector.get_table_names():
        return

    existing = {col["name"] for col in inspector.get_columns("approved_data")}
    with engine.begin() as conn:
        for column, column_type in _APPROVED_DATA_COLUMNS.items():
            if column not in existing:
                conn.execute(text(f"ALTER TABLE approved_data ADD COLUMN {column} {column_type}"))
