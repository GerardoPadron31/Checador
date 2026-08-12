from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Date, Time
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base

class UserRole(str, enum.Enum):
    admin = "admin"
    user = "user"

class AttendanceType(str, enum.Enum):
    in_ = "in"
    out = "out"

class VacationStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(200), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.user)
    area = Column(String(50), nullable=True)
    face_image_path = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    attendances = relationship("Attendance", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)
    schedules = relationship("Schedule", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)
    vacations = relationship("Vacation", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)

class Attendance(Base):
    __tablename__ = "attendances"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    type = Column(Enum(AttendanceType), nullable=False)

    user = relationship("User", back_populates="attendances")

class Schedule(Base):
    __tablename__ = "schedules"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    day_of_week = Column(Integer, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    user = relationship("User", back_populates="schedules")

class Vacation(Base):
    __tablename__ = "vacations"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    reason = Column(String(200), nullable=True)
    status = Column(Enum(VacationStatus), default=VacationStatus.pending)

    user = relationship("User", back_populates="vacations")