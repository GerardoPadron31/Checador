# run_phone.ps1
# Abre el Checador para usarlo desde el CELULAR con cámara (HTTPS).
# 1) Genera un certificado local autofirmado (solo la primera vez).
# 2) Levanta el backend en HTTPS en el puerto 8443.
# En el celular abre: https://IP_DE_ESTA_PC:8443  y acepta la advertencia de seguridad.
# La cámara funciona solo en HTTPS o localhost (requisito de los navegadores).

$ErrorActionPreference = "Stop"
$Backend = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Backend

# --- 1) Certificado ---
$certDir = Join-Path $Backend "certs"
$cert = Join-Path $certDir "cert.pem"
$key  = Join-Path $certDir "key.pem"
if (-not (Test-Path $cert) -or -not (Test-Path $key)) {
    New-Item -ItemType Directory -Path $certDir -Force | Out-Null
    Write-Host "Generando certificado autofirmado (valido 1 anio)..."
    openssl req -x509 -newkey rsa:2048 -keyout $key -out $cert -days 365 -nodes -subj "/CN=Checador" 2>$null
    if (-not (Test-Path $cert)) { Write-Host "Error: no se pudo generar el certificado. Asegurate de tener openssl."; exit 1 }
}

# --- 2) Direccion local ---
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } | Select-Object -First 1).IPAddress
if (-not $ip) { $ip = "localhost" }
Write-Host ""
Write-Host "=============================="
Write-Host " Checador listo para el celular"
Write-Host "=============================="
Write-Host " En el celular abre:"
Write-Host "   https://$ip`:8443"
Write-Host ""
Write-Host " (Acepta la advertencia 'No es seguro' -> Continuar)"
Write-Host " (El backend HTTP normal sigue en :8000)"
Write-Host " Ctrl+C para detener."
Write-Host "=============================="
Write-Host ""

# --- 3) Servidor HTTPS ---
& .\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8443 `
    --ssl-certfile $cert --ssl-keyfile $key
