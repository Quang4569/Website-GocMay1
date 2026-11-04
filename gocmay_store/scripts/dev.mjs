import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const viteArgs = process.argv.slice(2);
if (!viteArgs.includes('--host')) viteArgs.push('--host', '0.0.0.0');
if (!viteArgs.includes('--port')) viteArgs.push('--port', process.env.PORT || '5173');
if (!viteArgs.includes('--strictPort')) viteArgs.push('--strictPort');
const children = [
  spawn(process.execPath, [join(root, 'backend/server.mjs')], { cwd: root, stdio: 'inherit', env: { ...process.env, PORT: '3001', DATABASE_PATH: join(root, 'backend/data/gocmay.sqlite') } }),
  spawn(process.execPath, [join(root, 'frontend/node_modules/vite/bin/vite.js'), ...viteArgs], { cwd: join(root, 'frontend'), stdio: 'inherit', env: process.env })
];
let closing = false;
function stop(code = 0) { if (closing) return; closing = true; for (const child of children) child.kill('SIGTERM'); setTimeout(() => process.exit(code), 250).unref(); }
for (const child of children) child.on('exit', code => { if (!closing) stop(code || 0); });
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
