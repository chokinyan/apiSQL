@echo off
setlocal enabledelayedexpansion

:: MariaDB database creation script
echo Creating database from colloc.sql...

:: Default parameters - customize these as needed
set /P DB_HOST="Enter the database host [localhost]: " || set DB_HOST=localhost
set /P DB_USER="Enter the database user [root]: " || set DB_USER=root
set /P DB_PASSWORD="Enter the database password []: " || set DB_PASSWORD=password
set SQL_FILE=%~dp0colloc.sql

:: Check if SQL file exists
if not exist "%SQL_FILE%" (
    echo Error: %SQL_FILE% not found!
    echo Please make sure the SQL file is in the same directory as this script.
    exit /b 1
)

:: Create the database using the SQL file
echo Executing SQL file using MariaDB...
C:\Windows\System32\cmd.exe /k  "set MYSQL_HOME=C:\Program Files\MariaDB 11.7\data\&& set PATH=C:\Program Files\MariaDB 11.7\bin\;%PATH%;&&echo Setting environment for MariaDB 11.7 (x64) "
mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASSWORD% < "%SQL_FILE%"

if %ERRORLEVEL% neq 0 (
    echo Error: Database creation failed!
) else (
    echo Database created successfully!
)

exit /b %ERRORLEVEL%