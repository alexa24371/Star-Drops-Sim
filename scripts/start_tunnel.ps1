param(
    [string]$Port = "5173"
)

$viteConfigPath = Join-Path $PSScriptRoot "..\client\vite.config.js"
$appId = $env:DISCORD_APP_ID

Write-Host "[*] Starting cloudflared tunnel on port $Port..." -ForegroundColor Cyan

$process = Start-Process -FilePath "cloudflared" -ArgumentList "tunnel --url http://localhost:$Port" -PassThru -NoNewWindow -RedirectStandardOutput .\tunnel_output.log

Start-Sleep -Seconds 2

# Try to find the URL in recent output
for ($i = 0; $i -lt 10; $i++) {
    if (Test-Path .\tunnel_output.log) {
        $output = Get-Content .\tunnel_output.log | Select-String "trycloudflare.com" | Select-Object -First 1
        if ($output) {
            $url = [regex]::Match($output, "https?://[a-zA-Z0-9_.-]+\.trycloudflare\.com").Value
            if ($url) {
                Write-Host "[!] Found URL: $url" -ForegroundColor Green
                
                # Extract host
                $uri = [System.Uri]$url
                $host = $uri.Host
                Write-Host "[*] Extracted host: $host" -ForegroundColor Cyan
                
                # Update vite.config.js
                if (Test-Path $viteConfigPath) {
                    $content = Get-Content $viteConfigPath -Raw
                    $updated = $content -replace 'allowedHosts\s*:\s*\[[^\]]*\]', "allowedHosts: [`"$host`"]"
                    Set-Content $viteConfigPath $updated
                    Write-Host "[✓] Updated allowedHosts in vite.config.js -> $host" -ForegroundColor Green
                    Write-Host "[!] Restart the Vite dev server for changes to take effect.`n" -ForegroundColor Yellow
                }
                
                # Open Discord Developer Portal if app ID is set
                if ($appId) {
                    $devUrl = "https://discord.com/developers/applications/$appId/embedded/url-mappings"
                    Start-Process $devUrl
                    Write-Host "[✓] Opened Developer Portal mapping page" -ForegroundColor Green
                }
                
                Write-Host "[*] Tunnel is running. Press Ctrl+C to stop." -ForegroundColor Cyan
                Wait-Process -Id $process.Id
                break
            }
        }
    }
    
    Write-Host "[*] Waiting for tunnel URL... ($($i+1)/10)" -ForegroundColor Gray
    Start-Sleep -Seconds 1
}

if (-not $url) {
    Write-Host "[!] Could not find trycloudflare URL. Output log:" -ForegroundColor Red
    if (Test-Path .\tunnel_output.log) {
        Get-Content .\tunnel_output.log | Select-Object -Last 20
    }
    $process | Stop-Process -Force -ErrorAction SilentlyContinue
}
