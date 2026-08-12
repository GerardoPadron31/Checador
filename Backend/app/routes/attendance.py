from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from app import models, schemas, auth, face_utils
import tempfile
import os
import shutil

router = APIRouter(prefix="/attendance", tags=["attendance"])

def register_attendance(db: Session, user: models.User) -> dict:
    """Registra entrada/salida alternada según el último registro del usuario."""
    last_attendance = db.query(models.Attendance).filter(
        models.Attendance.user_id == user.id
    ).order_by(models.Attendance.timestamp.desc()).first()
    if last_attendance and last_attendance.type == models.AttendanceType.in_:
        att_type = models.AttendanceType.out
    else:
        att_type = models.AttendanceType.in_
    new_att = models.Attendance(user_id=user.id, type=att_type)
    db.add(new_att)
    db.commit()
    db.refresh(new_att)
    return {
        "success": True,
        "user_id": user.id,
        "name": user.name,
        "type": att_type.value,
        "timestamp": new_att.timestamp.isoformat()
    }

@router.post("/check", response_model=dict)
async def check_attendance(
    image: UploadFile = File(...),
    db: Session = Depends(auth.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        shutil.copyfileobj(image.file, tmp)
        tmp_path = tmp.name
    try:
        user_id = face_utils.find_user_by_face(tmp_path, db)
        if user_id is None:
            return {"success": False, "message": "Rostro no reconocido"}
    except Exception as e:
        return {"success": False, "message": f"Error en reconocimiento: {str(e)}"}
    finally:
        os.unlink(tmp_path)
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return {"success": False, "message": "Usuario no encontrado"}
    return register_attendance(db, user)

@router.get("/user/{user_id}", response_model=List[schemas.AttendanceResponse])
async def get_user_attendance(
    user_id: int,
    year: Optional[int] = None,
    month: Optional[int] = None,
    week: Optional[int] = None,
    db: Session = Depends(auth.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.Attendance).filter(models.Attendance.user_id == user_id)
    if year:
        query = query.filter(models.Attendance.timestamp >= datetime(year, 1, 1),
                             models.Attendance.timestamp < datetime(year+1, 1, 1))
    if month and year:
        start = datetime(year, month, 1)
        if month == 12:
            end = datetime(year+1, 1, 1)
        else:
            end = datetime(year, month+1, 1)
        query = query.filter(models.Attendance.timestamp >= start,
                             models.Attendance.timestamp < end)
    if week and year:
        start = datetime.fromisocalendar(year, week, 1)
        end = start + timedelta(days=7)
        query = query.filter(models.Attendance.timestamp >= start,
                             models.Attendance.timestamp < end)
    return query.order_by(models.Attendance.timestamp.desc()).all()

@router.get("/area", response_model=List[schemas.AttendanceResponse])
async def get_area_attendance(
    area: str,
    year: Optional[int] = None,
    month: Optional[int] = None,
    week: Optional[int] = None,
    db: Session = Depends(auth.get_db),
    current_user: models.User = Depends(auth.get_current_admin)
):
    user_ids = db.query(models.User.id).filter(models.User.area == area).subquery()
    query = db.query(models.Attendance).filter(models.Attendance.user_id.in_(user_ids))
    if year:
        query = query.filter(models.Attendance.timestamp >= datetime(year, 1, 1),
                             models.Attendance.timestamp < datetime(year+1, 1, 1))
    if month and year:
        start = datetime(year, month, 1)
        if month == 12:
            end = datetime(year+1, 1, 1)
        else:
            end = datetime(year, month+1, 1)
        query = query.filter(models.Attendance.timestamp >= start,
                             models.Attendance.timestamp < end)
    if week and year:
        start = datetime.fromisocalendar(year, week, 1)
        end = start + timedelta(days=7)
        query = query.filter(models.Attendance.timestamp >= start,
                             models.Attendance.timestamp < end)
    return query.order_by(models.Attendance.timestamp.desc()).all()

@router.get("/today", response_model=List[schemas.AttendanceResponse])
async def get_today_attendance(
    db: Session = Depends(auth.get_db),
    current_user: models.User = Depends(auth.get_current_admin)
):
    today = datetime.utcnow().date()
    start = datetime(today.year, today.month, today.day)
    end = start + timedelta(days=1)
    return db.query(models.Attendance).filter(
        models.Attendance.timestamp >= start,
        models.Attendance.timestamp < end
    ).order_by(models.Attendance.timestamp.desc()).all()