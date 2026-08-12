import os
import threading
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import timedelta
from app import models, schemas, auth, database, face_utils
from app.routes import users, attendance, schedules, vacations, face_login
from app.config import settings

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Checador API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(attendance.router)
app.include_router(schedules.router)
app.include_router(vacations.router)
app.include_router(face_login.router)

@app.on_event("startup")
async def warm_face_cache():
    """Precalcula los embeddings de todas las fotos para que el primer
    reconocimiento facial sea inmediato (corre en segundo plano)."""
    def _run():
        try:
            n = face_utils.warmup_cache()
            print(f"[checador] Cache facial listo: {n} fotos indexadas")
        except Exception as e:
            print(f"[checador] Warmup facial omitido: {e}")
    threading.Thread(target=_run, daemon=True).start()

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(auth.get_db)
):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": user.role.value},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/", include_in_schema=False)
async def root():
    return FileResponse(os.path.join("app", "static", "panel", "index.html"))

@app.get("/panel", include_in_schema=False)
async def panel():
    return FileResponse(os.path.join("app", "static", "panel", "index.html"))