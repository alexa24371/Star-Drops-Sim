#!/usr/bin/env node
/**
 * Start All – Run client, server, and tunnel concurrently
 * Usage: node start-all.js
 */

const { spawn } = require('child_process');
const path = require('path');

const appId = process.env.DISCORD_APP_ID || '1469778204838592642';

const processes = [
  {
    name: 'TUNNEL',
    cmd: 'node',
    args: ['scripts/start_tunnel.js'],
    cwd: __dirname,
    color: '\x1b[36m', // cyan
  },
  {
    name: 'CLIENT',
    cmd: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'client'),
    color: '\x1b[33m', // yellow
  },
  {
    name: 'SERVER',
    cmd: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'server'),
    color: '\x1b[35m', // magenta
  },
];

console.log('\n\x1b[1m🚀 Starting all services...\x1b[0m\n');

const reset = '\x1b[0m';

processes.forEach(({ name, cmd, args, cwd, color }) => {
  const proc = spawn(cmd, args, { cwd, stdio: 'pipe', shell: true });

  // Label and colorize output
  proc.stdout?.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.trim()) console.log(`${color}[${name}]${reset} ${line}`);
    });
  });

  proc.stderr?.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.trim()) console.log(`${color}[${name}]${reset} ${line}`);
    });
  });

  proc.on('exit', (code) => {
    console.log(`${color}[${name}]${reset} exited with code ${code}`);
  });

  proc.on('error', (err) => {
    console.error(`${color}[${name}]${reset} error: ${err.message}`);
  });
});

console.log(`${processes.map((p) => `${p.color}[${p.name}]${reset}`).join(' | ')}  All services running. Press Ctrl+C to stop.\n`);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down...');
  process.exit(0);
});
