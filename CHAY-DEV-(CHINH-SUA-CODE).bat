@echo off
chcp 65001 >nul
cd /d "%~dp0"
title BẢO LƯU, PLEASE! - Chế độ Phát triển (Dev Mode)

echo ====================================================================
echo        BẢO LƯU, PLEASE! - CHẾ ĐỘ PHÁT TRIỂN & CHỈNH SỬA CODE
echo ====================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [LỖI] Máy tính chưa cài đặt Node.js!
    echo Vui lòng tải và cài đặt Node.js tại: https://nodejs.org
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo [THÔNG BÁO] Đang cài đặt thư viện phụ thuộc (npm install)...
    call npm install
)

echo [THÔNG BÁO] Đang khởi chạy máy chủ phát triển Vite Dev Server...
start "" http://localhost:5173
call npm run dev -- --host

pause
