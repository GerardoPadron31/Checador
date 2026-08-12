from pydantic import BaseModel, EmailStr
from datetime import datetime, date, time
from typing import Optional, List
from enum import Enum

class UserRole(str, Enum):
    admin = "admin"
    user = "user"

class AttendanceType(str, Enum):
    in_ = "in"
    out = "out"

class VacationStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: UserRole = UserRole.user
    area: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    area: Optional[str] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    face_image_path: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

class AttendanceCreate(BaseModel):
    user_id: int
    type: AttendanceType

class AttendanceResponse(BaseModel):
    id: int
    user_id: int
    timestamp: datetime
    type: AttendanceType
    user: Optional[UserResponse]
    class Config:
        from_attributes = True

class ScheduleBase(BaseModel):
    user_id: Optional[int] = None
    day_of_week: int
    start_time: time
    end_time: time

class ScheduleCreate(ScheduleBase):
    pass

class ScheduleUpdate(BaseModel):
    user_id: Optional[int] = None
    day_of_week: Optional[int] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None

class ScheduleResponse(ScheduleBase):
    id: int
    class Config:
        from_attributes = True

class VacationBase(BaseModel):
    start_date: date
    end_date: date
    reason: Optional[str] = None

class VacationCreate(VacationBase):
    user_id: int

class VacationUpdate(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    reason: Optional[str] = None
    status: Optional[VacationStatus] = None

class VacationResponse(VacationBase):
    id: int
    user_id: int
    status: VacationStatus
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class FaceLoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
    attendance: Optional[dict] = None

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None