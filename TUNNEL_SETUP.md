# Cloudflared Tunnel Automation for Discord Activity

This guide explains how to create a temporary public endpoint for your Discord Activity using Cloudflare Tunnel and automate the configuration updates.

## Overview

The automation process:
1. **Start** a cloudflared tunnel pointing to your local dev server (port 5173)
2. **Extract** the temporary `*.trycloudflare.com` URL
3. **Update** `client/vite.config.js` `allowedHosts` with that URL
4. **Open** the Discord Developer Portal to paste the URL into your app settings

## Option 1: Automated (Recommended if Node script works)

Run from the project root:

```bash
$env:DISCORD_APP_ID="1469778204838592642"
node scripts/start_tunnel.js
```

This will:
- Start cloudflared tunnel
- Watch for the URL in the output
- Automatically update `allowedHosts` in `vite.config.js`
- Open your Discord Developer Portal at the URL mappings page
- Keep the tunnel running (press `Ctrl+C` to stop)

**Note:** You may need to restart the Vite dev server after the config is updated.

## Option 2: Manual Steps (Most Reliable)

If the automated script doesn't work, follow these manual steps:

### Step 1: Kill any existing tunnels
```powershell
Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1
```

### Step 2: Start the tunnel
In a terminal, run:
```bash
cloudflared tunnel --url http://localhost:5173
```

**Wait** for the message like:
```
Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):
https://RANDOM-WORDS-RANDOM-WORDS.trycloudflare.com
```

### Step 3: Copy the URL
Copy the full `https://` URL from the output.

### Step 4: Update `client/vite.config.js`
Edit the file and update the `allowedHosts` array with your new URL:

```javascript
export default defineConfig({
  envDir: '../',
  server: {
     allowedHosts: ["YOUR-TUNNEL-URL-HERE.trycloudflare.com"],  // <-- Update this
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
    hmr: {
      clientPort: 443,
    },
  },
});
```

Replace `YOUR-TUNNEL-URL-HERE.trycloudflare.com` with the hostname part only (e.g., `east-emerging-potatoes-rom.trycloudflare.com`).

### Step 5: Restart Vite dev server
In another terminal:
```bash
cd client
npm run dev
```

### Step 6: Update Discord Developer Portal
1. Open: `https://discord.com/developers/applications/1469778204838592642/embedded/url-mappings`
2. Paste your tunnel URL into the "URL Mappings" field
3. Example:
   ```
   Endpoint URL: https://east-emerging-potatoes-rom.trycloudflare.com/
   ```
4. Save changes

## Important Notes

⚠️ **Temporary URLs:**  
- These `trycloudflare.com` URLs are **temporary** — they change when the tunnel restarts
- For production, create a permanent Cloudflare tunnel with a custom domain

✏️ **Config Restarts:**  
- Changing `vite.config.js` requires restarting the Vite dev server
- After updating allowedHosts, press `Ctrl+C` and `npm run dev` again

🌐 **Network & HMR:**  
- The `clientPort: 443` setting enables Hot Module Replacement through the tunnel
- Keep the cloudflared tunnel running while developing

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "cloudflared" command not found | Install cloudflared: `brew install cloudflare/cloudflare/cloudflared` (Mac) or download from https://developers.cloudflare.com/cloudflare-one/downloads/ |
| Port 5173 already in use | Change the port or kill the existing process |
| allowedHosts not updating | Make sure you're using the hostname only (not the full URL) in vite.config.js |
| DNS not resolving the tunnel URL | The tunnel may not be ready yet; wait a few seconds |

## Running Both Services

In development, you need two terminals:

**Terminal 1 - Dev server:**
```bash
cd client
npm run dev
```

**Terminal 2 - Tunnel:**
```bash
node scripts/start_tunnel.js
# or manually:
# cloudflared tunnel --url http://localhost:5173
```
