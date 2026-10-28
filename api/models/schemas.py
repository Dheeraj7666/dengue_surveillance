from sqlalchemy import Column, Integer, String, Date, DateTime, Float, ForeignKey, Text
from sqlalchemy.sql import func
from api.database import Base

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(String, primary_key=True, index=True)
    organization = Column(String, nullable=False)
    org_type = Column(String)
    district = Column(String, nullable=False)
    city = Column(String)
    period_start = Column(Date)
    period_end = Column(Date)
    status = Column(String, default="pending")  # pending, approved, rejected, requires_correction
    admin_remarks = Column(Text)
    file_path = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ApprovedData(Base):
    __tablename__ = "approved_data"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    submission_id = Column(String, ForeignKey("submissions.id"))
    report_date = Column(Date, index=True)
    district = Column(String, index=True)
    locality = Column(String)
    reported_cases = Column(Integer)
    suspected_cases = Column(Integer)
    confirmed_cases = Column(Integer)
    hospital_visits = Column(Integer)
    hospital_admissions = Column(Integer)
    rainfall = Column(Float)
    temperature = Column(Float)
    humidity = Column(Float)
    population = Column(Integer)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    action = Column(String)
    actor = Column(String)
    submission_id = Column(String)
    details = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
