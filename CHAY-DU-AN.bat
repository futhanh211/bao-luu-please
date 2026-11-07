@echo off
chcp 65001 >nul
cd /d "%~dp0"
title BẢO LƯU, PLEASE! - Trình khởi chạy hệ thống Một Cửa Số

echo ====================================================================
echo        BẢO LƯU, PLEASE! - MÔ PHỎNG QUY TRÌNH TO-BE (BPMN 2.0)
echo        Trường Đại học Kinh tế - Đại học Đà Nẵng
echo ====================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [LỖI] Máy tính của bạn chưa cài đặt Node.js!
    echo.
    echo Vui lòng tải và cài đặt Node.js (phiên bản miễn phí LTS) tại:
    echo   👉 https://nodejs.org
    echo.
    echo (Sau khi cài Node.js xong, bạn chỉ cần nhấn đúp chuột vào file này để mở ứng dụng!)
    echo.
    pause
    exit /b 1
)

:: Ưu tiên 1: Chạy ngay bản Standalone cực nhanh qua server.cjs (không cần chờ npm install)
if exist "dist\index.html" if exist "server.cjs" (
    echo [THÔNG BÁO] Đang khởi chạy ứng dụng...
    node server.cjs
    goto END
)

:: Ưu tiên 2: Chạy chế độ Dev (tự động cài đặt thư viện nếu chưa có)
if not exist "node_modules\" (
    echo [THÔNG BÁO] Đang tải thư viện phụ thuộc npm install (chỉ cần chạy lần đầu)...
    call npm install
)

echo [THÔNG BÁO] Đang khởi động máy chủ tại: http://localhost:5173
start "" http://localhost:5173
call npm run dev

:END
if %errorlevel% neq 0 (
    echo.
    echo [THÔNG BÁO] Ứng dụng đã đóng.
    pause
)
