# AGENTS.md

Proyecto de checador de asistencia biométrica (reconocimiento facial).

## Stack

- Backend: FastAPI (Python) en `Backend/`
- Frontend: Expo (React Native) con TypeScript en `Frontend/my-expo-app`
- Base de datos: SQLite (archivos `*.db` generados por el backend)

## Comandos de verificación (Frontend)

Todos desde `Frontend/my-expo-app`:

- Verificar tipos: `npx tsc --noEmit`
- Verificar bundle (compilación completa de la app): `npx expo export --platform android --output-dir bundle.out`
- Correr la app en el teléfono (Expo Go): `npx expo start` y escanear el QR con la app Expo Go.

Siempre correr `tsc --noEmit` después de modificar archivos del frontend.

## Comandos del Backend

Desde `Backend/`:

- Instalar dependencias: `pip install -r requirements.txt`
- Correr servidor: `uvicorn main:app --host 0.0.0.0 --port 8000` (o `python main.py`)

La app apunta al backend por `http://<IP-de-la-PC>:8000` (ajustar en `Frontend/my-expo-app/services/api.ts` según la IP local del servidor).

## Estado actual

- Tema oscuro tipo "glassmorphism" aplicado a todo el frontend: fondo `#0a0f1e`, tarjetas `#141d38`, inputs `#0d1428`, acentos púrpura (`#8b7cf7`) y verde (`#00e5a8`).
- Tab bar inferior flotante personalizado (`components/TabBar.tsx`) con pill púrpura activa y etiquetas cortas.
- `Header` y `FaceCapture` respetan las safe areas (notch / home indicator) vía `useSafeAreaInsets`.
- Pantallas: login, registro, asistencia, historial, horarios, permisos/vacaciones, usuarios, perfil.
- `bundle.out` es output de build; no se debe editar (regenerable con `npx expo export`).
- **Registro público**: cualquiera se registra desde login; el backend fuerza rol `user` y rechaza `admin` sin sesión de admin (403). El admin crea usuarios/admins desde la pestaña Usuarios.
- **Cámara**: `FaceCapture` espera `onCameraReady` antes de permitir capturar (evita "Failed to capture image" en Android) y maneja `onMountError`.
- **Responsive**: helper `rs(size)` en `constants/theme.ts` escala tamaños según el ancho de pantalla (baseline 390px, tope 520px) y está aplicado en Header, login, splash, asistencia, perfil, FaceCapture.
