@echo off
REM =====================================================
REM  APLICAR PACK VISUAL (CLEAN) - sin xcopy, con robocopy
REM  Proyecto: D:\NeuroForge\gui\hitech-ares-panel-clean
REM =====================================================

setlocal ENABLEDELAYEDEXPANSION
set BASE_PATH=D:\NeuroForge\gui\hitech-ares-panel-clean
set PACK_PATH=%BASE_PATH%\pack_visual
set DEST_PATH=%BASE_PATH%\app\frontend\src

echo.
echo ==============================================
echo  APLICAR PACK VISUAL SOBRE -CLEAN (robocopy)
echo ==============================================
echo  BASE_PATH: %BASE_PATH%
echo  PACK_PATH: %PACK_PATH%
echo  DEST_PATH: %DEST_PATH%
echo.

REM 1) Validaciones
if not exist "%PACK_PATH%" (
  echo [ERROR] No existe la carpeta "%PACK_PATH%".
  echo         Descomprime pack_visual.zip dentro de "%BASE_PATH%".
  pause
  exit /b 1
)

where robocopy >nul 2>&1
if errorlevel 1 (
  echo [ERROR] No se encontro 'robocopy' en el PATH. Esto es raro en Windows 10/11.
  echo         Alternativas:
  echo           - Abre CMD como admin y prueba: where robocopy
  echo           - O copia manualmente pack_visual dentro de app\frontend\src
  pause
  exit /b 1
)

where docker >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Docker no esta en el PATH o no esta instalado.
  echo         Instala Docker Desktop y vuelve a intentar.
  pause
  exit /b 1
)

REM 2) Copiar pack visual (multihilo, mantiene estructura)
echo [1/4] Copiando pack visual...
robocopy "%PACK_PATH%" "%DEST_PATH%" /E /MT:16
if %ERRORLEVEL% GEQ 8 (
  echo [ERROR] Hubo un problema copiando los archivos (robocopy code %ERRORLEVEL%).
  pause
  exit /b 1
)
echo [OK] Pack visual copiado.
echo.

REM 3) Detener contenedores anteriores
echo [2/4] Deteniendo contenedores...
docker compose --env-file "%BASE_PATH%\.env" -f "%BASE_PATH%\infra\docker-compose.yml" down
if errorlevel 1 (
  echo [WARN] 'down' devolvio error. Continuando de todos modos...
)
echo [OK] Contenedores detenidos.
echo.

REM 4) Levantar con build
echo [3/4] Levantando con build (puede tardar unos minutos la primera vez)...
docker compose --env-file "%BASE_PATH%\.env" -f "%BASE_PATH%\infra\docker-compose.yml" up --build -d
if errorlevel 1 (
  echo [ERROR] No se pudo levantar el entorno.
  pause
  exit /b 1
)
echo [OK] Servicios arriba.
echo.

REM 5) Abrir frontend
echo [4/4] Abriendo http://localhost:5173
start http://localhost:5173

echo.
echo Listo. Si no ves cambios, refresca con Ctrl+F5 en el navegador.
pause
