"""Populate a fresh database from the curated dataset shipped in the repo.

Managed hosts start with an empty database and an ephemeral filesystem, so the
surveillance extract is loaded once on boot. Anything already present is left
untouched, which makes this safe to run on every restart.
"""

import os
import shutil

import pandas as pd

from api.database import SessionLocal
from api.models.schemas import ApprovedData, AuditLog, Submission

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_PATH = os.path.join(PROJECT_ROOT, "dengue_surveillance_dataset.csv")
UPLOAD_DIR = os.path.join(PROJECT_ROOT, "uploads")

SEED_SUBMISSION_ID = "SEED0001"
SEED_ORGANIZATION = "National Health Institute (INS)"


def seed_if_empty() -> None:
    """Load the bundled records when no submission exists yet."""
    db = SessionLocal()
    try:
        if db.query(Submission).first() is not None:
            return

        if not os.path.exists(DATASET_PATH):
            print(f"[seed] dataset not found at {DATASET_PATH}; skipping")
            return

        df = pd.read_csv(DATASET_PATH)

        # Keep the original file beside the app so the admin preview and
        # download actions work against the seeded submission too.
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        stored_file = os.path.join(UPLOAD_DIR, f"{SEED_SUBMISSION_ID}.csv")
        shutil.copyfile(DATASET_PATH, stored_file)

        dates = pd.to_datetime(df["report_date"])

        db.add(
            Submission(
                id=SEED_SUBMISSION_ID,
                organization=SEED_ORGANIZATION,
                org_type="Government",
                district="National",
                city="Bogota",
                period_start=dates.min().date(),
                period_end=dates.max().date(),
                status="approved",
                file_path=stored_file,
            )
        )

        for _, row in df.iterrows():
            db.add(
                ApprovedData(
                    submission_id=SEED_SUBMISSION_ID,
                    report_date=pd.Timestamp(row["report_date"]).date(),
                    district=str(row["district"]),
                    locality=str(row["locality"]),
                    reported_cases=int(row["reported_dengue_cases"]),
                    suspected_cases=int(row["suspected_cases"]),
                    confirmed_cases=int(row["confirmed_cases"]),
                    hospital_visits=int(row["hospital_visits"]),
                    hospital_admissions=int(row["hospital_admissions"]),
                    rainfall=float(row["rainfall"]),
                    temperature=float(row["temperature"]),
                    humidity=float(row["humidity"]),
                    population=int(row["population"]),
                )
            )

        db.add(
            AuditLog(
                action="Submission Received",
                actor=SEED_ORGANIZATION,
                submission_id=SEED_SUBMISSION_ID,
                details="Baseline surveillance extract loaded from the bundled OpenDengue dataset",
            )
        )
        db.add(
            AuditLog(
                action="Submission Approved",
                actor="Admin",
                submission_id=SEED_SUBMISSION_ID,
                details=f"Integrated {len(df)} records into master set",
            )
        )

        db.commit()
        print(f"[seed] loaded {len(df)} surveillance records")
    except Exception as exc:  # pragma: no cover - startup best effort
        db.rollback()
        print(f"[seed] failed: {exc}")
    finally:
        db.close()
