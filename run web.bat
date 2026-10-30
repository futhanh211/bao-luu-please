@echo off
chcp 65001 > nul
title BẢO LƯU, PLEASE! - KHỞI CHẠY HỆ THỐNG
color 0A

:: Đảm bảo đứng ở đúng thư mục chứa file bat
cd /d "%~dp0"

echo ====================================================================
echo        BẢO LƯU, PLEASE! — MÔ PHỎNG QUY TRÌNH TO-BE (BPMN 2.0)
echo        Trường Đại học Kinh tế – Đại học Đà Nẵng
echo ====================================================================
echo.

:: 1. Kiểm tra môi trường Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [LỖI] Máy tính của bạn chưa cài đặt Node.js!
    echo Vui lòng tải và cài đặt Node.js từ: https://nodejs.org
    echo Sau khi cài xong, vui lòng khởi động lại file này.
    echo.
    pause
    exit /b 1
)

:: 2. Kiểm tra thư viện node_modules
if not exist "node_modules\" (
    echo [THÔNG BÁO] Phát hiện lần đầu chạy dự án.
    echo Đang tự động cài đặt các thư viện cần thiết (npm install)...
    echo Quá trình này chỉ diễn ra một lần duy nhất, vui lòng chờ trong giây lát...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo.
        echo [LỖI] Cài đặt thư viện thất bại! Vui lòng kiểm tra lại kết nối mạng.
        pause
        exit /b 1
    )
    echo.
    echo [THÀNH CÔNG] Đã cài đặt xong thư viện!
    echo.
)

:: 3. Mở tự động trình duyệt sau 2 giây
start "" "http://localhost:5173"

:: 4. Khởi động máy chủ phát triển
echo ====================================================================
echo  [+] Đang khởi chạy máy chủ phát triển tại: http://localhost:5173
echo  [+] Trình duyệt web sẽ tự động mở trong chốc lát...
echo.
echo  Mẹo thuyết trình:
echo    - Bấm [ F11 ] để bật chế độ Toàn màn hình
echo    - Bấm [ D ]   để bật chế độ Đạo diễn tự chạy thuyết minh
echo    - Bấm [ B ]   để bật / tắt Bản đồ BPMN toàn màn hình
echo    - Bấm [ M ]   để bật / tắt âm thanh văn phòng
echo.
echo  Để dừng máy chủ, hãy đóng cửa sổ này hoặc bấm Ctrl + C.
echo ====================================================================
echo.

call npm run dev -- --host
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [LỖI] Máy chủ bị dừng đột ngột hoặc cổng 5173 đang bị chiếm dụng.
    pause
)
