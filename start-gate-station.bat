@echo off
setlocal enabledelayedexpansion
title CampusAccess Gate Terminal Production System Launcher

echo ===============================================================================
echo     CampusAccess - Enterprise Gate Security & Biometric Access Terminal
echo ===============================================================================
echo [INFO] Starting pre-flight system diagnostics...

:: 1. Check MySQL
echo [1/4] Checking MySQL Database connection on port 3306...
netstat -ano | findstr :3306 >nul
if %errorlevel% neq 0 (
    echo [WARNING] MySQL does not appear to be listening on port 3306.
    echo Please make sure your MySQL service is started.
) else (
    echo [OK] MySQL is active and listening on port 3306.
)

:: 2. Start Python Neural Face Recognition Microservice
echo [2/4] Initializing Face Recognition Microservice (Port 8001)...
cd /d "%~dp0face-service"
if exist "venv\Scripts\python.exe" (
    start "CampusAccess Face Service" cmd /k "venv\Scripts\python.exe -m uvicorn app:app --host 0.0.0.0 --port 8001"
) else (
    start "CampusAccess Face Service" cmd /k "python -m uvicorn app:app --host 0.0.0.0 --port 8001"
)

:: 3. Start Spring Boot Backend Server
echo [3/4] Initializing Spring Boot Security Backend (Port 8081)...
cd /d "%~dp0backend"
start "CampusAccess Backend" cmd /k "mvn spring-boot:run"

:: 4. Start Vite Frontend Client (Port 3002)
echo [4/4] Initializing Web Client Terminal (Port 3002)...
cd /d "%~dp0frontend"
start "CampusAccess Gate Terminal Frontend" cmd /k "npm run dev -- --host 0.0.0.0 --port 3002"

echo ===============================================================================
echo [SUCCESS] All system services dispatched!
echo.
echo - Web Terminal:        http://localhost:3002
echo - Spring Boot API:     http://localhost:8081
echo - Face Microservice:   http://localhost:8001/docs
echo.
echo For remote laptops/tablets connected to the Gate Wi-Fi, open:
echo   http://^<YOUR_LOCAL_IP^>:3002
echo (Refer to GATE_DEPLOYMENT_GUIDE.md for HTTPS camera permissions)
echo ===============================================================================
pause
