@echo off
echo.
echo ================================================
echo   CityLocal 101 - Backend Server Launcher
echo ================================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [1/3] Installing dependencies...
    call npm install
    echo.
) else (
    echo [1/3] Dependencies already installed
    echo.
)

REM Check if MongoDB is running
echo [2/3] Checking MongoDB connection...
echo.

REM Run database seeder
echo [3/3] Seeding database...
call npm run seed
echo.

echo ================================================
echo   Starting Server...
echo ================================================
echo.
echo  Website: http://localhost:5000
echo  Admin Panel: http://localhost:5000/admin
echo.
echo  Admin Login:
echo  Email: admin@citylocal101.com
echo  Password: Admin@123456
echo.
echo ================================================
echo.

REM Start the server
call npm run dev

pause

