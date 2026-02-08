#!/usr/bin/env node
const {spawn, exec} = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || '5173';
const appId = process.env.DISCORD_APP_ID;
const viteConfigPath = path.resolve(__dirname, '..', 'client', 'vite.config.js');

const cmd = 'cloudflared';
const args = ['tunnel', '--url', `http://localhost:${port}`];

const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], shell: true });
const rl = readline.createInterface({ input: child.stdout });

let found = false;
rl.on('line', line => {
  console.log(line);
  if (!found) {
    // Look for https://...trycloudflare.com anywhere in the line
    const urlMatch = line.match(/https?:\/\/[a-zA-Z0-9_.-]+\.trycloudflare\.com/i);
    if (urlMatch) {
      found = true;
      const url = urlMatch[0];
      console.log(`\n[!] Found URL: ${url}\n`);

      let host;
      try {
        host = new URL(url).host;
        console.log(`[*] Extracted host: ${host}`);
      } catch (e) {
        console.error('[!] Failed to parse URL:', url, e.message);
        return;
      }

      // Update vite.config.js
      try {
        let content = fs.readFileSync(viteConfigPath, 'utf8');
        const updated = content.replace(/allowedHosts\s*:\s*\[[^\]]*\]/, `allowedHosts: ["${host}"]`);
        fs.writeFileSync(viteConfigPath, updated, 'utf8');
        console.log(`[✓] Updated allowedHosts in vite.config.js -> ${host}`);
        console.log('[!] Restart the Vite dev server for changes to take effect.\n');
      } catch (err) {
        console.error(`[!] Error updating vite.config.js: ${err.message}`);
      }

      // Optionally open Discord Developer Portal
      if (appId) {
        const devUrl = `https://discord.com/developers/applications/${appId}/embedded/url-mappings`;
        const startCmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
        exec(`${startCmd} "${devUrl}"`, err => {
          if (!err) {
            console.log(`[✓] Opened Developer Portal mapping page`);
          }
        });
      }
    }
  }
});

child.stderr.on('data', d => process.stderr.write(d));
child.on('exit', code => {
  if (!found) console.error('\n[!] cloudflared exited before a URL was found.');
  process.exit(code);
});
