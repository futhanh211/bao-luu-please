@echo off
cd /d "%~dp0"
title Bao Luu Please - Khoi chay he thong

echo ====================================================================
echo        BAO LUU, PLEASE! - MO PHONG QUY TRINH TO-BE (BPMN 2.0)
echo        Truong Dai hoc Kinh te - Dai hoc Da Nang
echo ====================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [LOI] May tinh chua cai dat Node.js!
    echo Vui long cai dat Node.js tai: https://nodejs.org
    echo.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo [THONG BAO] Dang cai dat thu vien (npm install)...
    call npm install
)

echo [THONG BAO] Dang khoi dong may chu web tai: http://localhost:5173
echo [THONG BAO] Trinh duyet se tu dong mo trong giay lat...
echo.
echo Meo thuyet trinh:
echo   - Bam F11: Toan man hinh
echo   - Bam D:   Bat che do Dao dien tu chay
echo   - Bam B:   Xem Ban do BPMN toan man hinh
echo   - Bam M:   Bat / tat am thanh
echo.
echo ====================================================================

start http://localhost:5173
call npm run dev -- --host

if %errorlevel% neq 0 (
    echo.
    echo [LOI] Co loi xay ra khi khoi chay may chu.
    pause
)
