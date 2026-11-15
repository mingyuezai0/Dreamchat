@echo off
REM ============================================================
REM  Dreamchat Android APK - one-click build
REM
REM  Self-locating: this file sits in <repo>\tools\, so the repo
REM  root and mobile\ are derived from %~dp0. There is NO absolute
REM  path to the project in here - moving the repo needs no edit.
REM
REM  Toolchain lives outside the repo and can be overridden:
REM    CAPACITOR_HOME        default D:\Capacitor
REM    CAPACITOR_JAVA_HOME   default %CAPACITOR_HOME%\jdk\jdk-21.0.12.1+1
REM    CAPACITOR_ANDROID     default %CAPACITOR_HOME%\android-sdk
REM    CAPACITOR_GRADLE      default %CAPACITOR_HOME%\gradle\gradle-8.14
REM
REM  Output: mobile\android\app\build\outputs\apk\debug\<name from build.gradle>
REM
REM  This file must stay pure ASCII + CRLF. Chinese characters in a
REM  .bat break under a GBK console and can fail silently.
REM ============================================================
setlocal

set "REPO=%~dp0.."
for %%I in ("%REPO%") do set "REPO=%%~fI"

if not exist "%REPO%\mobile\package.json" (
  echo [ERROR] mobile\package.json not found under "%REPO%"
  echo         Is tools\build-apk.bat still inside the repo?
  pause
  exit /b 1
)

if not defined CAPACITOR_HOME set "CAPACITOR_HOME=D:\Capacitor"
if not defined CAPACITOR_JAVA_HOME set "CAPACITOR_JAVA_HOME=%CAPACITOR_HOME%\jdk\jdk-21.0.12.1+1"
if not defined CAPACITOR_ANDROID set "CAPACITOR_ANDROID=%CAPACITOR_HOME%\android-sdk"
if not defined CAPACITOR_GRADLE set "CAPACITOR_GRADLE=%CAPACITOR_HOME%\gradle\gradle-8.14"

set "JAVA_HOME=%CAPACITOR_JAVA_HOME%"
set "ANDROID_HOME=%CAPACITOR_ANDROID%"
set "ANDROID_SDK_ROOT=%CAPACITOR_ANDROID%"
set "GRADLE_USER_HOME=%CAPACITOR_HOME%\gradle-home"
set "PATH=%JAVA_HOME%\bin;%CAPACITOR_GRADLE%\bin;%PATH%"

if not exist "%JAVA_HOME%\bin\java.exe" (
  echo [ERROR] JDK not found: "%JAVA_HOME%"
  echo         Set CAPACITOR_HOME or CAPACITOR_JAVA_HOME.
  pause
  exit /b 1
)
if not exist "%ANDROID_HOME%" (
  echo [ERROR] Android SDK not found: "%ANDROID_HOME%"
  echo         Set CAPACITOR_HOME or CAPACITOR_ANDROID.
  pause
  exit /b 1
)

echo Repo      : %REPO%
echo Toolchain : %CAPACITOR_HOME%
echo.

cd /d "%REPO%\mobile" || (echo [ERROR] cd failed & pause & exit /b 1)

if not exist "%REPO%\mobile\node_modules" (
  echo [1/4] installing mobile dependencies ...
  call npm i --no-audit --no-fund
  if errorlevel 1 goto fail
)

echo [2/4] sync web assets to www ...
call node scripts\copy-www.js
if errorlevel 1 goto fail
call npx cap sync android
if errorlevel 1 goto fail

echo [3/4] building APK ...
call gradle.bat -p android assembleDebug
if errorlevel 1 goto fail

echo [4/4] done
dir /b "android\app\build\outputs\apk\debug\*.apk"
endlocal & exit /b 0

:fail
echo.
echo ============================================
echo  APK BUILD FAILED - see the output above
echo ============================================
pause
exit /b 1
