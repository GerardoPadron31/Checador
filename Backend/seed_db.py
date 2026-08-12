import os, shutil, sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
from app.database import SessionLocal, engine
from app import models
from app.auth import get_password_hash
from app.config import settings

USERS_MAP = {
    "Mario": 1, "Victor": 2, "Leisla": 4, "Jassam": 5,
    "Diego": 6, "Ochoa": 7, "Edwin Torres": 8, "Itzel": 9,
    "Ronaldo": 10, "Honorato": 11, "Nuncio": 13, "Soria": 14,
    "Neto": 15, "Marco": 16, "Sarur": 17, "Charly": 18,
    "Ulises": 19, "Jorge": 20
}
USER_AREA = {
    "Mario": "Ventas", "Victor": "RH", "Leisla": "Administrativo",
    "Jassam": "TI", "Diego": "Logística", "Ochoa": "Finanzas",
    "Edwin Torres": "RH", "Itzel": "Marketing", "Ronaldo": "Ventas",
    "Honorato": "Administrativo", "Nuncio": "TI", "Soria": "Finanzas",
    "Neto": "Logística", "Marco": "Ventas", "Sarur": "RH",
    "Charly": "TI", "Ulises": "Administrativo", "Jorge": "Marketing"
}
DATASET_PATH = r"C:\Users\utm23\OneDrive\Documentos\Programación para Inteligencia Artificial\dataset\dataset"  # AJUSTA ESTA RUTA
DATASET_DIR = settings.dataset_dir

def seed():
    db = SessionLocal()
    models.Base.metadata.create_all(bind=engine)
    os.makedirs(DATASET_DIR, exist_ok=True)

    for name, uid in USERS_MAP.items():
        folder = os.path.join(DATASET_PATH, name)
        if not os.path.isdir(folder):
            print(f"⚠️  Carpeta {folder} no encontrada")
            continue
        images = [f for f in os.listdir(folder) if f.lower().endswith(('.jpg','.jpeg','.png'))]
        if not images:
            print(f"⚠️  No hay imágenes en {folder}")
            continue
        safe = name.replace("/", "_").replace("\\", "_").strip()
        user_dir = os.path.join(DATASET_DIR, safe)
        if os.path.isdir(user_dir):
            shutil.rmtree(user_dir)
        os.makedirs(user_dir, exist_ok=True)
        paths = []
        for i, img in enumerate(sorted(images), start=1):
            src = os.path.join(folder, img)
            dst = os.path.join(user_dir, f"img_{i}.jpg")
            shutil.copy2(src, dst)
            paths.append(os.path.join("Dataset", safe, f"img_{i}.jpg"))
        email = f"{name.lower().replace(' ', '_')}@checador.com"
        area = USER_AREA.get(name, "General")
        user = db.query(models.User).filter(models.User.id == uid).first()
        if user:
            user.name = name
            user.email = email
            user.face_image_path = ",".join(paths)
            user.area = area
        else:
            new_user = models.User(
                id=uid, name=name, email=email,
                hashed_password=get_password_hash("password123"),
                role=models.UserRole.user, area=area,
                face_image_path=",".join(paths)
            )
            db.add(new_user)
        db.commit()
        print(f"✅ {name} procesado ({len(paths)} fotos) -> Dataset/{safe}/")

    if not db.query(models.User).filter(models.User.email=="admin@checador.com").first():
        admin = models.User(
            name="Admin", email="admin@checador.com",
            hashed_password=get_password_hash("admin123"),
            role=models.UserRole.admin, area="RH"
        )
        db.add(admin)
        db.commit()
        print("👑 Admin creado")
    db.close()
    print("✅ Seed completado")

if __name__ == "__main__":
    seed()