from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
import tempfile
import os
import shutil
from app import models, schemas, auth, face_utils
from app.routes.attendance import register_attendance

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/face-login", response_model=schemas.FaceLoginResponse)
async def face_login(
    image: UploadFile = File(...),
    db: Session = Depends(auth.get_db)
):
    """Reconoce el rostro, inicia sesión y registra la asistencia automáticamente."""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        shutil.copyfileobj(image.file, tmp)
        tmp_path = tmp.name
    try:
        user_id = face_utils.find_user_by_face(tmp_path, db)
    except Exception as e:
        os.unlink(tmp_path)
        raise HTTPException(status_code=500, detail=f"Error en reconocimiento: {str(e)}")
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Rostro no reconocido. Regístrate primero con tus fotos.",
        )

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    attendance = register_attendance(db, user)
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": user.role.value}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
        "attendance": attendance,
    }
