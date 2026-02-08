@echo off
setlocal enabledelayedexpansion

REM Tunnel automation script for Discord Activity
REM This script starts cloudflared, extracts the URL, and updates vite.config.js

set PORT=5173
if not "%1"=="" set PORT=%1

echo [*] Starting cloudflared tunnel on port %PORT%...

REM Start cloudflared and capture output
cloudflared tunnel --url http://localhost:%PORT% > tunnel.log 2>&1

echo Done.
pauserem End of script
