from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas, auth

router = APIRouter(prefix="/vacations", tags=["vacations"])

@router.post("/", response_model=schemas.VacationResponse)
async def create_vacation(
    vacation: schemas.VacationCreate,
    db: Session = Depends(auth.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if vacation.user_id != current_user.id and current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="You can only request vacations for yourself")
    user = db.query(models.User).filter(models.User.id == vacation.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    new_vac = models.Vacation(**vacation.dict(), status=models.VacationStatus.pending)
    db.add(new_vac)
    db.commit()
    db.refresh(new_vac)
    return new_vac

@router.get("/", response_model=List[schemas.VacationResponse])
async def list_vacations(
    db: Session = Depends(auth.get_db),
    current_user: models.User = Depends(auth.get_current_admin)
):
    return db.query(models.Vacation).all()

@router.get("/user/{user_id}", response_model=List[schemas.VacationResponse])
async def get_user_vacations(
    user_id: int,
    db: Session = Depends(auth.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if user_id != current_user.id and current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return db.query(models.Vacation).filter(models.Vacation.user_id == user_id).all()

@router.put("/{vacation_id}", response_model=schemas.VacationResponse)
async def update_vacation(
    vacation_id: int,
    update_data: schemas.VacationUpdate,
    db: Session = Depends(auth.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    vac = db.query(models.Vacation).filter(models.Vacation.id == vacation_id).first()
    if not vac:
        raise HTTPException(status_code=404, detail="Vacation not found")
    if vac.user_id != current_user.id and current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    if current_user.role != models.UserRole.admin and vac.status != models.VacationStatus.pending:
        raise HTTPException(status_code=403, detail="You can only modify pending vacations")
    for key, value in update_data.dict(exclude_unset=True).items():
        setattr(vac, key, value)
    db.commit()
    db.refresh(vac)
    return vac

@router.delete("/{vacation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vacation(
    vacation_id: int,
    db: Session = Depends(auth.get_db),
    current_user: models.User = Depends(auth.get_current_admin)
):
    vac = db.query(models.Vacation).filter(models.Vacation.id == vacation_id).first()
    if not vac:
        raise HTTPException(status_code=404, detail="Vacation not found")
    db.delete(vac)
    db.commit()
    return None