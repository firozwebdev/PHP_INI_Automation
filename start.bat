@echo off
echo.
echo ========================================
echo  PHP INI Automation Pro v2.0.0
echo ========================================
echo.

REM Check if .env file exists
if not exist ".env" (
    echo Creating .env file from template...
    echo # PHP Installation Paths > .env
    echo PVM_PATH="C:/Users/%USERNAME%/pvm/" >> .env
    echo LARAGON_PATH="C:/laragon/bin/" >> .env
    echo XAMPP_PATH="C:/xampp/php/" >> .env
    echo WAMP_PATH="C:/wamp64/bin/" >> .env
    echo DEFAULT_PATH="C:/php/" >> .env
    echo.
    echo .env file created with default paths.
    echo Edit .env file if your PHP installations are in different locations.
    echo.
)

echo Starting PHP INI Automation Pro CLI...
echo.

REM Start the CLI tool
bun start

pause
