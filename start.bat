@echo off
echo ========================================
echo    Starting Attic Lounges Services
echo ========================================
echo.

echo Checking if Node.js is installed...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

echo Checking if MongoDB is running...
netstat -an | findstr :27017 >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: MongoDB might not be running on port 27017
    echo Please make sure MongoDB is installed and running
    echo.
)

echo Installing dependencies if needed...
echo.

echo Installing User Service dependencies...
cd services\user-service
if not exist node_modules (
    echo Installing user-service dependencies...
    npm install
) else (
    echo User service dependencies already installed
)
cd ..\..

echo Installing Product Service dependencies...
cd services\product-service
if not exist node_modules (
    echo Installing product-service dependencies...
    npm install
) else (
    echo Product service dependencies already installed
)
cd ..\..

echo Installing Order Service dependencies...
cd services\order-service
if not exist node_modules (
    echo Installing order-service dependencies...
    npm install
) else (
    echo Order service dependencies already installed
)
cd ..\..

echo Installing AI Service dependencies...
cd services\ai-service
if not exist node_modules (
    echo Installing ai-service dependencies...
    npm install
) else (
    echo AI service dependencies already installed
)
cd ..\..

echo.
echo ========================================
echo    Starting All Services
echo ========================================
echo.

echo Starting User Service (Port 4001)...
start "User Service - Port 4001" cmd /k "cd services\user-service && echo Starting User Service... && npm start"

timeout /t 2 /nobreak >nul

echo Starting Product Service (Port 4002)...
start "Product Service - Port 4002" cmd /k "cd services\product-service && echo Starting Product Service... && npm start"

timeout /t 2 /nobreak >nul

echo Starting Order Service (Port 4003)...
start "Order Service - Port 4003" cmd /k "cd services\order-service && echo Starting Order Service... && npm start"

timeout /t 2 /nobreak >nul

echo Starting AI Service (Port 4004)...
start "AI Service - Port 4004" cmd /k "cd services\ai-service && echo Starting AI Service... && npm start"

timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo    Services Started Successfully!
echo ========================================
echo.
echo Services running on:
echo - User Service:    http://localhost:4001
echo - Product Service: http://localhost:4002  
echo - Order Service:   http://localhost:4003
echo - AI Service:      http://localhost:4004
echo.
echo To access the website:
echo 1. Open index.html in your browser
echo 2. Or use Live Server extension in VS Code
echo.
echo To create owner account:
echo 1. Click "OWNER" button in header
echo 2. Fill the "Create Owner" form
echo 3. You'll be redirected to admin panel
echo.
echo Press any key to open the website...
pause >nul

echo Opening website...
start index.html

echo.
echo ========================================
echo    Setup Complete!
echo ========================================
echo.
echo The website should now be open in your browser.
echo If you need to stop the services, close the terminal windows.
echo.
pause
