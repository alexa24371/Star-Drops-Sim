# Star Drops Simulator (Discord Activity)

A **Discord Embedded Activity** that simulates opening Brawl Stars-style Star Drops.

Users click a Star Drop to build rarity, trigger opening animations/sound effects, and receive a random character reward based on the final rarity.

---

## What this project does

This project runs a small full-stack app with two parts:

- **Client (`client/`)**: Vite + vanilla JavaScript UI rendered inside Discord using the Embedded App SDK.
- **Server (`server/`)**: Express API that exchanges Discord OAuth authorization codes for access tokens.

### Core gameplay flow

1. User clicks the Star Drop.
2. Each click can upgrade rarity (Rare → Super Rare → Epic → Mythic → Legendary).
3. A pity-like mechanic increases upgrade odds when upgrades fail repeatedly.
4. At 4 clicks (or immediately if Legendary), the drop is “ready” to open.
5. Opening animation plays with rarity-specific audio.
6. A random character from that rarity tier is shown as the reward.
7. Clicking again resets the drop.

### Discord integration flow

1. Client waits for `DiscordSDK.ready()`.
2. Client calls `authorize()` to get an OAuth code.
3. Client sends the code to `POST /api/token`.
4. Server exchanges the code with Discord OAuth for `access_token`.
5. Client calls `authenticate()` with the token.

---

## Project structure

```text
.
├── client/                 # Vite frontend + Discord Embedded SDK
│   ├── assets/             # Star, rarity images, character images, audio files
│   ├── main.js             # App bootstrap, auth flow, game logic
│   ├── style.css           # UI styling and animations
│   └── vite.config.js      # Dev server config + API proxy + allowedHosts
├── server/
│   └── server.js           # Express OAuth token exchange endpoint
├── scripts/
│   └── start_tunnel.js     # Cloudflared tunnel helper
├── start-all.js            # Starts tunnel, client, and server concurrently
├── example.env             # Required environment variables template
└── TUNNEL_SETUP.md         # Detailed tunnel usage guide
```

---

## Requirements

- Node.js **14+** (Node 18+ recommended)
- npm
- A Discord application configured for Activities
- (Optional, for remote testing) `cloudflared`

---

## Environment variables

Copy `example.env` to `.env` in the project root and set values:

```bash
cp example.env .env
```

```env
VITE_DISCORD_CLIENT_ID=YOUR_DISCORD_CLIENT_ID_HERE
DISCORD_CLIENT_SECRET=YOUR_DISCORD_CLIENT_SECRET
```

> `VITE_DISCORD_CLIENT_ID` is used by both client and server in this project.

---

## Installation

Install dependencies for root, client, and server:

```bash
npm install
npm --prefix client install
npm --prefix server install
```

---

## Run locally

### Option A: Start everything together (recommended)

```bash
npm run dev
```

This launches:

- Tunnel helper (`scripts/start_tunnel.js`)
- Vite client dev server (default `5173`)
- Express server (`3001`)

### Option B: Start services manually

In separate terminals:

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

The client proxies `/api/*` to `http://localhost:3001`.

---

## Tunnel / Discord URL mapping

For Discord Activity testing, you typically need a public HTTPS URL that points to your local Vite server.

Use:

```bash
npm run tunnel
```

or follow manual instructions in [`TUNNEL_SETUP.md`](./TUNNEL_SETUP.md).

---

## Notable implementation details

- **Spam resistance**: clicks are ignored while opening animation runs.
- **Dynamic opening duration**: higher rarities take longer to open.
- **Audio fallback**: if rarity MP3 playback fails, synthesized sound is used.
- **Visual feedback**: rarity badge, background color, progress circles, and overlay effects.

---

## Available scripts

### Root

- `npm run dev` — start tunnel + client + server via `start-all.js`
- `npm run tunnel` — run tunnel helper only

### Client (`client/package.json`)

- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run preview` — preview built app

### Server (`server/package.json`)

- `npm run dev` — start Express server

---

## Security note

This is a development-oriented project. Keep your `DISCORD_CLIENT_SECRET` in `.env` only and never commit secrets.

---

## License

No license file is currently included in this repository.
