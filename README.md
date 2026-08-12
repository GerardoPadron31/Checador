# Checador — Control de Asistencia por Reconocimiento Facial

Un checador de asistencia completo para empresas o escuelas: los empleados **marcan su entrada y salida con la cámara del celular**, sin tarjetas ni contraseñas. El sistema reconoce el rostro de cada persona y registra el movimiento automáticamente.

## ¿Cómo funciona?

1. Una persona se **registra** por primera vez tomándose una foto de su rostro.
2. Cuando llega a la empresa, abre la app, presiona **Tomar asistencia** y se pone frente a la cámara.
3. El backend compara su rostro con los rostros guardados; si coincide, registra la **entrada**. Al final del día repite el paso y registra la **salida**.
4. Todo queda guardado en la base de datos y puede consultarse desde el **historial** (por persona, por área o por período).

Además de la asistencia, la app permite gestionar **horarios** y **permisos/vacaciones**. Los administradores pueden dar de alta usuarios, asignar roles y revisar los registros de todo el personal.

## Tecnologías utilizadas

| Parte | Tecnología |
|---|---|
| Aplicación móvil | React Native con Expo, TypeScript, NativeWind (Tailwind) y expo-router |
| Servidor (API) | Python con FastAPI y SQLAlchemy |
| Reconocimiento facial | `deepface` (modelo Facenet) + OpenCV |
| Base de datos | SQLite (fácil de cambiar a PostgreSQL) |
| Sesiones | JWT (python-jose + passlib/bcrypt) |

## Estructura del proyecto

```
Proyecto_Checador/
├── Backend/            # API en Python (FastAPI) + Panel web de control
├── Frontend/
│   └── my-expo-app/    # App móvil (Expo / React Native)
├── Dataset/            # Fotos de rostro de cada persona (carpeta por persona)
└── AGENTS.md           # Notas para agentes de IA que trabajen en este repo
```

## Cómo ejecutarlo

### 1) Backend

Requisitos: Python 3.10 o superior.

```bash
cd Backend
python -m venv venv
venv\Scripts\activate        # en Windows
# source venv/bin/activate   # en Linux/macOS
pip install -r requirements.txt
copy .env.example .env       # en Windows
# cp .env.example .env       # en Linux/macOS
```

Arranca el servidor:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

> La primera vez, `deepface` descarga los pesos del modelo Facenet (~100 MB) y el
> backend indexa las fotos del `Dataset/`. Ese arranque inicial tarda unos minutos;
> después es casi instantáneo.

Con el servidor arriba puedes ver:
- El **panel de control** web en `http://localhost:8000/`
- La **documentación de la API** (Swagger) en `http://localhost:8000/docs`

### 2) App móvil (frontend)

Requisitos: Node.js 18+ y el teléfono con la app **Expo Go** (o un emulador).

```bash
cd Frontend/my-expo-app
npm install
```

**Importante:** el teléfono y la computadora deben estar en la **misma red Wi-Fi**.
En `Frontend/my-expo-app/services/api.ts` cambia la IP por la de tu computadora:

```ts
const API_URL = 'http://IP_DE_TU_COMPUTADORA:8000';
```

Para conocer tu IP en Windows: `ipconfig` (búscala en la conexión "Wi-Fi", ej. `192.168.0.15`).

Ahora inicia Expo:

```bash
npx expo start
```

Escanea el **código QR** con Expo Go (Android) o con la cámara del iPhone, y la app abrirá en tu teléfono.

## Roles y registro

- **Cualquier persona puede registrarse** desde el login de la app (botón "Regístrate aquí"). En el registro pide su nombre, correo, contraseña, área y una foto de su rostro.
- Al registrarse, el usuario obtiene el rol `user` (asistente). **No puede registrarse como administrador**: si lo intenta, el backend lo rechaza (403).
- El **administrador** puede crear usuarios (e incluso otros administradores) desde la pestaña **Usuarios**, además de editar y eliminar cuentas.

> El admin inicial se crea con el script de seed: `python seed_db.py` en `Backend/`
> (crea `admin@checador.com` / `admin123`).

## Pantallas de la app

| Pestaña | Para qué sirve |
|---|---|
| Asistencia | Marcar entrada/salida con el rostro. Los admin ven los registros del día |
| Historial | Consultar registros por período (semana/mes/año). El admin filtra por persona o área |
| Horarios | El admin crea y administra los horarios del personal |
| Permisos | Solicitar permisos/vacaciones; el admin los aprueba o rechaza |
| Usuarios | Solo admin: registrar, editar y eliminar usuarios |
| Perfil | Ver tus datos y cerrar sesión |

## Notas útiles

- El reconocimiento compara la foto capturada contra las fotos de `Dataset/<Nombre>/` usando el modelo **Facenet** (distancia coseno). Si el rostro no coincide con nadie, la asistencia no se registra.
- La app está hecha con un **tema oscuro tipo "glassmorphism"** y se adapta a cualquier tamaño de pantalla (celulares y tablets).
- El teléfono solo puede usar la cámara con HTTPS: si quieres probar el panel web desde el celular, usa `run_phone.ps1` en `Backend/` para levantar el servidor seguro (puerto 8443).
- En producción cambia la `SECRET_KEY` del archivo `.env`.
