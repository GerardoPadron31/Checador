from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas, auth

router = APIRouter(prefix="/schedules", tags=["schedules"])

@router.post("/", response_model=schemas.ScheduleResponse)
async def create_schedule(
    schedule: schemas.ScheduleCreate,
    db: Session = Depends(auth.get_db),
    current_user: models.User = Depends(auth.get_current_admin)
):
    if schedule.user_id:
        user = db.query(models.User).filter(models.User.id == schedule.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
    new_sched = models.Schedule(**schedule.dict())
    db.add(new_sched)
    db.commit()
    db.refresh(new_sched)
    return new_sched

@router.get("/", response_model=List[schemas.ScheduleResponse])
async def list_schedules(
    db: Session = Depends(auth.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.Schedule).all()

@router.get("/{schedule_id}", response_model=schemas.ScheduleResponse)
async def get_schedule(
    schedule_id: int,
    db: Session = Depends(auth.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    sched = db.query(models.Schedule).filter(models.Schedule.id == schedule_id).first()
    if not sched:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return sched

@router.put("/{schedule_id}", response_model=schemas.ScheduleResponse)
async def update_schedule(
    schedule_id: int,
    update_data: schemas.ScheduleUpdate,
    db: Session = Depends(auth.get_db),
    current_user: models.User = Depends(auth.get_current_admin)
):
    sched = db.query(models.Schedule).filter(models.Schedule.id == schedule_id).first()
    if not sched:
        raise HTTPException(status_code=404, detail="Schedule not found")
    for key, value in update_data.dict(exclude_unset=True).items():
        setattr(sched, key, value)
    db.commit()
    db.refresh(sched)
    return sched

@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schedule(
    schedule_id: int,
    db: Session = Depends(auth.get_db),
    current_user: models.User = Depends(auth.get_current_admin)
):
    sched = db.query(models.Schedule).filter(models.Schedule.id == schedule_id).first()
    if not sched:
        raise HTTPException(status_code=404, detail="Schedule not found")
    db.delete(sched)
    db.commit()
    return None