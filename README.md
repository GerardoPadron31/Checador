# Checador — Control de Asistencia con Reconocimiento Facial

Aplicación móvil completa (Frontend + Backend) para el control de asistencia de personal.
El mecanismo principal de autenticación es el **reconocimiento facial mediante inteligencia artificial**
usando la librería [`deepface`](https://github.com/serengil/deepface).

## Stack Tecnológico

| Capa      | Tecnología                                                    |
|-----------|---------------------------------------------------------------|
| Backend   | Python + FastAPI + SQLAlchemy                                 |
| IA/Biometría | `deepface` (modelo Facenet) con OpenCV                    |
| Frontend  | React Native + Expo + NativeWind (Tailwind) + expo-router     |
| Base de datos | SQLite (relacional, lista para cambiar a PostgreSQL)      |
| Autenticación | JWT (python-jose + passlib/bcrypt)                       |

## Estructura del Repositorio

```
.
├── Backend/
│   ├── app/
│   │   ├── main.py            # Configuración de FastAPI, CORS y panel web
│   │   ├── models.py          # Modelos SQLAlchemy (User, Attendance, Schedule, Vacation)
│   │   ├── schemas.py         # Esquemas Pydantic
│   │   ├── auth.py            # JWT, hashing y dependencias de permisos
│   │   ├── database.py        # Conexión y sesión de la BD
│   │   ├── face_utils.py      # Guardado de rostros y reconocimiento con deepface
│   │   ├── config.py          # Variables de entorno
│   │   └── routes/
│   │       ├── users.py       # CRUD de usuarios + rostro
│   │       ├── attendance.py  # Toma de asistencia y consulta de historiales
│   │       ├── schedules.py   # CRUD de horarios
│   │       └── vacations.py   # CRUD de permisos/vacaciones
│   ├── static/panel/index.html  # Panel de Control web (vistas + botones)
│   ├── seed_db.py             # Poblado inicial (usa dataset local de rostros)
│   ├── requirements.txt
│   └── .env.example
└── Frontend/
    └── my-expo-app/
        ├── app/
        │   ├── (auth)/        # login y registro
        │   └── (tabs)/        # attendance, users, history, schedules, vacations, profile
        ├── components/        # Componentes reutilizables (captura facial)
        ├── services/api.ts    # Cliente Axios (cambia aquí la IP del backend)
        └── store/             # Zustand (sesión y autenticación)
```

## 1. Ejecutar el Backend

Requisitos: Python 3.10+.

```bash
cd Backend

# Crear y activar el entorno virtual
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/macOS

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
copy .env.example .env         # Windows
# cp .env.example .env         # Linux/macOS
```

> La primera vez que arranca, `deepface` descarga los pesos del modelo **Facenet**
> (~100 MB) a `~/.deepface`. Requiere conexión a internet en ese momento.

> Al arrancar, el backend **indexa las fotos del `Dataset/`** en segundo plano
> (~1-2 min la primera vez). Hasta que termina, el primer reconocimiento puede
> tardar; después es casi instantáneo.

Arrancar el servidor:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Al abrir `http://localhost:8000/` verás el **Panel de Control** web con una vista
por módulo (Usuarios, Asistencia, Horarios, Vacaciones) donde cada acción se ejecuta
con un botón. También sigue disponible la documentación interactiva de la API
(Swagger) en `http://localhost:8000/docs`.

### Flujo de reconocimiento facial

1. **Registrar** (`Usuarios → Registrar usuario`): captura **varias fotos del rostro**
   desde distintos ángulos (botón 📷). Se guardan en `Dataset/<Nombre>/img_*.jpg`
   y las rutas quedan registradas en la base de datos.
2. **Iniciar sesión con rostro** (`Inicio → Iniciar con rostro`): la cámara captura
   el rostro, el backend lo compara contra todas las fotos del `Dataset/`, emite el
   JWT y **registra la asistencia automáticamente** (entrada/salida alternada).
3. También puedes **tomar asistencia** directamente (`Asistencia → Tomar asistencia`).

### Usar el panel desde el celular (con cámara)

Los navegadores móviles solo permiten usar la **cámara** en páginas con **HTTPS**.
El script `run_phone.ps1` genera un certificado local y levanta el backend seguro:

```powershell
cd Backend
.\run_phone.ps1          # HTTPS en el puerto 8443 (el HTTP sigue en :8000)
```

Luego, en el celular (misma red Wi-Fi), abre la URL que indica el script
(ej. `https://192.168.0.15:8443`) y **acepta la advertencia de seguridad**
(Configuración avanzada → Continuar). Así podrás **tomar la asistencia con la
cámara**: en *Asistencia → Tomar asistencia* presiona el botón 📷, captura el
rostro dentro del marco y listo; el registro se guarda en la base de datos.

### Usuario administrador

Sin base de datos poblada, crea el admin con el script de seed:

```bash
python seed_db.py
```

Crea el usuario `admin@checador.com` / `admin123` (rol `admin`) y, si configuras la
ruta `DATASET_PATH` apuntando a una carpeta con fotos por persona, registra usuarios
con su imagen de rostro. También puedes crear usuarios desde la app (módulo Usuarios).

## 2. Ejecutar el Frontend (App Móvil)

Requisitos: Node.js 18+ y el teléfono físico con la app **Expo Go** (o un emulador).

```bash
cd Frontend/my-expo-app
npm install
```

**Importante:** en `Frontend/my-expo-app/services/api.ts` cambia la URL por la IP de
tu computadora en la red local (debe estar en la misma red que el teléfono):

```ts
const API_URL = 'http://TU_IP_LOCAL:8000';
```

Iniciar Expo:

```bash
npx expo start
```

Escanea el código QR con Expo Go (Android) o la cámara del iPhone. También puedes usar:

```bash
npx expo start --android   # con emulador Android
npx expo start --ios       # con simulador iOS
```

### Pantallas

| Módulo      | Pantallas                                                                                       |
|-------------|------------------------------------------------------------------------------------------------|
| Usuarios    | Registro con captura de rostro (cámara/galería), tabla de usuarios, editar y eliminar (admin)   |
| Asistencia  | Toma de asistencia por reconocimiento facial, asistencias del día (admin)                       |
| Historial   | Por usuario y por área, con filtros de semana, mes o año (admin); el usuario ve el suyo        |
| Horarios    | Crear, editar, eliminar y listar horarios (admin)                                               |
| Vacaciones  | Solicitar y editar permisos (usuario), aprobar/rechazar y filtrar por usuario (admin)           |

## Estructura de la Base de Datos

Modelo relacional SQLite (4 tablas). Se puede migrar a PostgreSQL cambiando
`DATABASE_URL` en `.env`.

```
┌──────────────┐        ┌──────────────────┐        ┌─────────────┐
│    users     │        │   attendances    │        │  schedules  │
├──────────────┤        ├──────────────────┤        ├─────────────┤
│ id (PK)      │ 1    n │ id (PK)          │        │ id (PK)     │
│ name         │<───────│ user_id (FK) ────│ 1    n │ user_id (FK)│── nullable
│ email (UQ)   │        │ timestamp        │<───────│ day_of_week │
│ hashed_pswd  │        │ type (in/out)    │        │ start_time  │
│ role         │        └──────────────────┘        │ end_time    │
│ area         │                                     └─────────────┘
│ face_img_path│        ┌──────────────────┐
│ created_at   │ 1    n │    vacations     │
└──────────────┘<───────┼──────────────────┤
                        │ id (PK)          │
                        │ user_id (FK)     │
                        │ start_date       │
                        │ end_date         │
                        │ reason           │
                        │ status           │
                        └──────────────────┘
```

- **users**: usuarios del sistema. `role` puede ser `admin` o `user`; `area` agrupa por
  departamento (RH, Administrativo, TI, Ventas, Logística, Finanzas, Marketing).
  `face_image_path` guarda la referencia a la foto de rostro usada como plantilla biométrica.
- **attendances**: registros de entrada/salida. Cada *check* facial agrega un registro
  alternando entre `in` (entrada) y `out` (salida) según el último registro del usuario.
- **schedules**: horarios. `user_id` opcional: si es `NULL` aplica a todos (general),
  si tiene valor aplica solo a ese usuario. `day_of_week` usa 0=Lunes … 6=Domingo.
- **vacations**: solicitudes de permiso/vacaciones con `status`
  (`pending`, `approved`, `rejected`).

## API REST (resumen)

| Método | Ruta                          | Descripción                                | Permiso |
|--------|-------------------------------|--------------------------------------------|---------|
| POST   | `/token`                      | Login con correo/contraseña (JWT)          | público |
| POST   | `/auth/face-login`            | Login facial: reconoce + JWT + asistencia  | público |
| POST   | `/users/register`             | Crear usuario + varias fotos de rostro     | admin   |
| GET    | `/users/`                     | Lista de usuarios                          | admin   |
| GET    | `/users/me`                   | Datos del usuario autenticado              | usuario |
| PUT    | `/users/me`                   | Editar mi perfil                           | usuario |
| GET    | `/users/{id}`                 | Detalle de usuario                         | usuario |
| PUT    | `/users/{id}`                 | Editar usuario                             | admin   |
| POST   | `/users/{id}/face`            | Actualizar rostro (varias fotos)           | admin   |
| DELETE | `/users/{id}`                 | Eliminar usuario + su rostro               | admin   |
| POST   | `/attendance/check`           | Toma de asistencia (imagen facial)         | usuario |
| GET    | `/attendance/today`           | Asistencias del día                        | admin   |
| GET    | `/attendance/user/{id}`       | Historial por usuario (año/mes/semana)     | usuario |
| GET    | `/attendance/area`            | Historial por área (año/mes/semana)        | admin   |
| POST   | `/schedules/`                 | Crear horario                              | admin   |
| GET    | `/schedules/`                 | Listar horarios                            | usuario |
| PUT    | `/schedules/{id}`             | Actualizar horario                         | admin   |
| DELETE | `/schedules/{id}`             | Eliminar horario                           | admin   |
| POST   | `/vacations/`                 | Solicitar permiso                          | usuario |
| GET    | `/vacations/`                 | Listar todos los permisos                  | admin   |
| GET    | `/vacations/user/{id}`        | Historial de permisos de un usuario        | usuario |
| PUT    | `/vacations/{id}`             | Editar permiso / aprobar o rechazar        | usuario |
| DELETE | `/vacations/{id}`             | Eliminar permiso                           | admin   |

Filtros de historial: parámetros opcionales `year`, `month` y `week`
(ej. `GET /attendance/user/3?year=2026&month=8`).

## Notas

- El reconocimiento compara la imagen capturada contra todas las fotos de cada
  usuario en `Dataset/<Nombre>/` (modelo Facenet, distancia coseno). Si la distancia
  mínima supera el umbral (0.6), el rostro se considera no registrado. Las
  plantillas se indexan al arrancar para que cada reconocimiento sea casi inmediato.
- `Dataset/` está junto a `Backend/` y `Frontend/` (configúralo con `DATASET_DIR` en
  `.env`) y está ignorado por git por su tamaño.
- Cambia `SECRET_KEY` en producción.
- El frontend persiste el token JWT y los datos del usuario con AsyncStorage; al abrir
  la app restaura la sesión automáticamente.
