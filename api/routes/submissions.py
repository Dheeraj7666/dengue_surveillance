from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from api.database import get_db
from api.models.schemas import Submission, AuditLog, ApprovedData
from api.auth import require_admin
import uuid
import os
import math
import pandas as pd
from datetime import datetime

router = APIRouter(prefix="/api/submissions", tags=["submissions"])
admin_router = APIRouter(
    prefix="/api/admin/submissions",
    tags=["admin-submissions"],
    dependencies=[Depends(require_admin)],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

REQUIRED_COLUMNS = ["report_date", "district", "locality", "reported_dengue_cases"]
CASE_COLUMN_ALIASES = ["reported_dengue_cases", "reported_cases", "cases"]


def _to_int(value, default: int = 0) -> int:
    try:
        if value is None or (isinstance(value, float) and math.isnan(value)):
            return default
        return int(round(float(value)))
    except (TypeError, ValueError):
        return default


def _to_float(value, default: float = 0.0) -> float:
    try:
        if value is None or (isinstance(value, float) and math.isnan(value)):
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _read_file(file_path: str) -> pd.DataFrame:
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Uploaded file is no longer available")
    if file_path.lower().endswith(".csv"):
        return pd.read_csv(file_path)
    return pd.read_excel(file_path)


def _fetch_submission(submission_id: str, db: Session) -> Submission:
    sub = db.query(Submission).filter(Submission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    return sub


def _preview_payload(sub: Submission) -> dict:
    df = _read_file(sub.file_path)
    case_column = next((c for c in CASE_COLUMN_ALIASES if c in df.columns), None)

    duplicate_rows = int(df.duplicated().sum())
    required_present = [c for c in REQUIRED_COLUMNS if c in df.columns]
    if required_present:
        completeness = round(float(df[required_present].notna().to_numpy().mean()) * 100, 1)
    else:
        completeness = 0.0

    total_cases = int(df[case_column].fillna(0).sum()) if case_column else 0

    return {
        "columns": list(df.columns),
        "rows": df.head(20).fillna("").to_dict(orient="records"),
        "totalRows": int(len(df)),
        "stats": {
            "totalCases": total_cases,
            "duplicates": duplicate_rows,
            "completeness": completeness,
            "missingColumns": [c for c in REQUIRED_COLUMNS if c not in df.columns],
        },
    }


def _file_response(sub: Submission) -> FileResponse:
    if not sub.file_path or not os.path.exists(sub.file_path):
        raise HTTPException(status_code=404, detail="Uploaded file is no longer available")
    filename = f"submission_{sub.id}{os.path.splitext(sub.file_path)[1]}"
    return FileResponse(sub.file_path, filename=filename)


@router.post("")
async def create_submission(
    organization: str = Form(...),
    org_type: str = Form(...),
    district: str = Form(...),
    city: str = Form(...),
    period_start: str = Form(...),
    period_end: str = Form(...),
    notes: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    submission_id = str(uuid.uuid4())[:8].upper()
    file_ext = os.path.splitext(file.filename)[1]
    file_path = os.path.join(UPLOAD_DIR, f"{submission_id}{file_ext}")

    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    new_submission = Submission(
        id=submission_id,
        organization=organization,
        org_type=org_type,
        district=district,
        city=city,
        period_start=datetime.strptime(period_start, "%Y-%m-%d").date(),
        period_end=datetime.strptime(period_end, "%Y-%m-%d").date(),
        status="pending",
        admin_remarks=notes,
        file_path=file_path
    )

    db.add(new_submission)

    # Log the action
    audit = AuditLog(
        action="Submission Received",
        actor=organization,
        submission_id=submission_id,
        details=f"New data file uploaded from {organization} ({district})"
    )
    db.add(audit)
    db.commit()

    return {"id": submission_id, "status": "pending"}


@router.get("/my")
async def get_my_submissions(db: Session = Depends(get_db)):
    return db.query(Submission).order_by(Submission.created_at.desc()).all()


@router.get("/{id}/preview")
async def preview_my_submission(id: str, db: Session = Depends(get_db)):
    return _preview_payload(_fetch_submission(id, db))


@router.get("/{id}/file")
async def download_my_submission_file(id: str, db: Session = Depends(get_db)):
    return _file_response(_fetch_submission(id, db))


@admin_router.get("")
async def get_all_submissions(db: Session = Depends(get_db)):
    return db.query(Submission).order_by(Submission.created_at.desc()).all()


@admin_router.get("/{id}/preview")
async def preview_submission(id: str, db: Session = Depends(get_db)):
    return _preview_payload(_fetch_submission(id, db))


@admin_router.get("/{id}/file")
async def download_submission_file(id: str, db: Session = Depends(get_db)):
    return _file_response(_fetch_submission(id, db))


@admin_router.post("/{id}/approve")
async def approve_submission(id: str, db: Session = Depends(get_db)):
    sub = db.query(Submission).filter(Submission.id == id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    try:
        df = _read_file(sub.file_path)

        for col in REQUIRED_COLUMNS:
            if col not in df.columns:
                raise HTTPException(status_code=400, detail=f"File missing required column: {col}")

        # Replace any previously integrated rows so re-approval stays idempotent.
        db.query(ApprovedData).filter(ApprovedData.submission_id == id).delete()

        for _, row in df.iterrows():
            try:
                if isinstance(row["report_date"], str):
                    report_date = datetime.strptime(row["report_date"][:10], "%Y-%m-%d").date()
                else:
                    report_date = pd.Timestamp(row["report_date"]).date()
            except Exception:
                report_date = datetime.now().date()

            new_data = ApprovedData(
                submission_id=id,
                report_date=report_date,
                district=str(row["district"]),
                locality=str(row["locality"]),
                reported_cases=_to_int(row.get("reported_dengue_cases", 0)),
                suspected_cases=_to_int(row.get("suspected_cases", 0)),
                confirmed_cases=_to_int(row.get("confirmed_cases", 0)),
                hospital_visits=_to_int(row.get("hospital_visits", 0)),
                hospital_admissions=_to_int(row.get("hospital_admissions", 0)),
                rainfall=_to_float(row.get("rainfall", 0)),
                temperature=_to_float(row.get("temperature", 0)),
                humidity=_to_float(row.get("humidity", 0)),
                population=_to_int(row.get("population", 0)),
            )
            db.add(new_data)

        sub.status = "approved"
        sub.admin_remarks = None

        audit = AuditLog(
            action="Submission Approved",
            actor="Admin",
            submission_id=id,
            details=f"Integrated {len(df)} records into master set"
        )
        db.add(audit)
        db.commit()
        return {"status": "approved", "records_integrated": len(df)}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Integration failed: {str(e)}")


@admin_router.post("/{id}/reject")
async def reject_submission(id: str, reason: str, db: Session = Depends(get_db)):
    sub = db.query(Submission).filter(Submission.id == id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    sub.status = "rejected"
    sub.admin_remarks = reason

    audit = AuditLog(
        action="Submission Rejected",
        actor="Admin",
        submission_id=id,
        details=f"Reason: {reason}"
    )
    db.add(audit)
    db.commit()
    return {"status": "rejected"}
