from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

SQLITE_URL = "sqlite:///./api/data/denguecare.db"


def _resolve_database_url() -> str:
    """Prefer DATABASE_URL when the host provides one (e.g. Render Postgres),
    otherwise fall back to the local SQLite file shipped in the repository."""
    url = (os.getenv("DATABASE_URL") or "").strip()
    if not url:
        return SQLITE_URL
    # Some providers still hand out the legacy postgres:// scheme, which
    # SQLAlchemy 2.x rejects.
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url


SQLALCHEMY_DATABASE_URL = _resolve_database_url()
IS_SQLITE = SQLALCHEMY_DATABASE_URL.startswith("sqlite")

# Ensure data directory exists
if IS_SQLITE:
    os.makedirs(os.path.dirname(SQLITE_URL.replace("sqlite:///./", "")), exist_ok=True)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False} if IS_SQLITE else {},
    pool_pre_ping=True,
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
