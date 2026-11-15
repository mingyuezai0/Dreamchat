@echo off
REM ============================================================
REM  Dreamchat - run the whole test suite
REM  Requires Node.js in PATH (v18+).
REM  This file must stay pure ASCII + CRLF:
REM  Chinese characters in a .bat break under a GBK console.
REM ============================================================
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found in PATH. Install Node.js 18+ first.
  pause
  exit /b 1
)

if not exist "node_modules\jsdom" (
  echo [1/7] installing jsdom ...
  call npm i jsdom --no-audit --no-fund
  if errorlevel 1 (
    echo [ERROR] npm install failed. Check the network / proxy.
    pause
    exit /b 1
  )
)

echo [2/7] version numbers in all six places ...
node ..\tools\bump.js --check
if errorlevel 1 goto fail

echo [3/7] extracting script from index.html ...
node re-extract.js
if errorlevel 1 goto fail

echo [4/7] node --check ...
node --check check-latest.js
if errorlevel 1 goto fail

echo [5/7] idcheck ...
node idcheck.js
if errorlevel 1 goto fail

echo [6/7] test17 (static) ...
node test17.js
if errorlevel 1 goto fail

echo [7/7] test18 (jsdom runtime) ...
node test18.js
if errorlevel 1 goto fail

echo.
echo ============================================
echo  ALL TESTS PASSED
echo ============================================
pause
exit /b 0

:fail
echo.
echo ============================================
echo  TESTS FAILED - see the output above
echo ============================================
pause
exit /b 1
