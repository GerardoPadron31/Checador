from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app import models, schemas, auth, face_utils
from app.database import SessionLocal

router = APIRouter(prefix="/users", tags=["users"])

def _collect_images(face_images, face_image):
    """Acepta varias fotos (face_images) o una sola (face_image, formato legado)."""
    if face_images:
        return face_images
    if face_image is not None:
        return [face_image]
    return []

@router.post("/register", response_model=schemas.UserResponse)
async def register_user(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    role: schemas.UserRole = Form(schemas.UserRole.user),
    area: str = Form(None),
    face_images: Optional[List[UploadFile]] = File(None),
    face_image: Optional[UploadFile] = File(None),
    db: Session = Depends(auth.get_db),
    current_user: models.User = Depends(auth.get_current_admin)
):
    images = _collect_images(face_images, face_image)
    if not images:
        raise HTTPException(status_code=400, detail="Se requiere al menos una foto de rostro")
    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = auth.get_password_hash(password)
    user = models.User(
        name=name, email=email, hashed_password=hashed,
        role=role, area=area
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    try:
        paths = []
        for i, img in enumerate(images, start=1):
            image_bytes = await img.read()
            paths.append(face_utils.save_reference_face(user, image_bytes, i))
        user.face_image_path = ",".join(paths)
        db.commit()
    except Exception as e:
        db.delete(user)
        db.commit()
        face_utils.delete_reference_face(user)
        raise HTTPException(status_code=500, detail=f"Error saving face image: {str(e)}")
    return user

@router.get("/", response_model=List[schemas.UserResponse])
async def get_users(
    db: Session = Depends(auth.get_db),
    current_user: models.User = Depends(auth.get_current_admin)
):
    return db.query(models.User).all()

@router.get("/me", response_model=schemas.UserResponse)
async def get_current_user_info(
    current_user: models.User = Depends(auth.get_current_user)
):
    return current_user

@router.put("/me", response_model=schemas.UserResponse)
async def update_current_user(
    update_data: schemas.UserUpdate,
    db: Session = Depends(auth.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if update_data.name is not None:
        current_user.name = update_data.name
    if update_data.email is not None:
        existing = db.query(models.User).filter(models.User.email == update_data.email).first()
        if existing and existing.id != current_user.id:
            raise HTTPException(status_code=400, detail="Email already taken")
        current_user.email = update_data.email
    if update_data.area is not None:
        current_user.area = update_data.area
    if update_data.password is not None:
        current_user.hashed_password = auth.get_password_hash(update_data.password)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/{user_id}", response_model=schemas.UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(auth.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=schemas.UserResponse)
async def update_user(
    user_id: int,
    update_data: schemas.UserUpdate,
    db: Session = Depends(auth.get_db),
    current_user: models.User = Depends(auth.get_current_admin)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if update_data.name is not None:
        user.name = update_data.name
    if update_data.email is not None:
        existing = db.query(models.User).filter(models.User.email == update_data.email).first()
        if existing and existing.id != user_id:
            raise HTTPException(status_code=400, detail="Email already taken")
        user.email = update_data.email
    if update_data.role is not None:
        user.role = update_data.role
    if update_data.area is not None:
        user.area = update_data.area
    if update_data.password is not None:
        user.hashed_password = auth.get_password_hash(update_data.password)
    db.commit()
    db.refresh(user)
    return user

@router.post("/{user_id}/face", response_model=schemas.UserResponse)
async def update_user_face(
    user_id: int,
    face_images: Optional[List[UploadFile]] = File(None),
    face_image: Optional[UploadFile] = File(None),
    db: Session = Depends(auth.get_db),
    current_user: models.User = Depends(auth.get_current_admin)
):
    images = _collect_images(face_images, face_image)
    if not images:
        raise HTTPException(status_code=400, detail="Se requiere al menos una foto de rostro")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    try:
        face_utils.delete_reference_face(user)
        paths = []
        for i, img in enumerate(images, start=1):
            image_bytes = await img.read()
            paths.append(face_utils.save_reference_face(user, image_bytes, i))
        user.face_image_path = ",".join(paths)
        db.commit()
        db.refresh(user)
        return user
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving face image: {str(e)}")

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: Session = Depends(auth.get_db),
    current_user: models.User = Depends(auth.get_current_admin)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.query(models.Attendance).filter(models.Attendance.user_id == user_id).delete()
    db.query(models.Schedule).filter(models.Schedule.user_id == user_id).delete()
    db.query(models.Vacation).filter(models.Vacation.user_id == user_id).delete()
    face_utils.delete_reference_face(user)
    db.delete(user)
    db.commit()
    return None