import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const temporary = mkdtempSync(join(tmpdir(), 'gocmay-test-'));
const database = join(temporary, 'test.sqlite');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const listener = net.createServer();
await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
const port = listener.address().port;
await new Promise(resolve => listener.close(resolve));
let server;

async function start() {
  server = spawn(process.execPath, [join(root, 'backend/server.mjs')], { env: { ...process.env, PORT: String(port), DATABASE_PATH: database }, stdio: 'ignore' });
  for (let n = 0; n < 60; n++) {
    if (server.exitCode !== null) throw new Error('Test API exited before startup');
    try { if ((await fetch(`http://127.0.0.1:${port}/api/health`)).ok) return; } catch {}
    await sleep(100);
  }
  throw new Error('Test API startup timed out');
}
async function stop() {
  if (!server || server.exitCode !== null) return;
  await new Promise(resolve => { server.once('exit', resolve); server.kill('SIGTERM'); });
}
async function request(path, { method = 'GET', body, cookie } = {}) {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, cookie: response.headers.get('set-cookie')?.split(';')[0], data: await response.json() };
}

try {
  await start();
  const catalog = await request('/api/products');
  assert.equal(catalog.data.products.length, 6);
  assert.equal((await request('/api/products?category=tripod')).data.products.length, 3);
  assert.equal((await request('/api/products?min=500000&max=1000000')).data.products.length, 2);
  assert.equal((await request('/api/orders')).status, 401);
  const body = { name: 'Khách thử', email: 'demo@example.test', password: 'example123' };
  const created = await request('/api/auth/register', { method: 'POST', body });
  assert.equal(created.status, 201);
  assert.ok(created.cookie);
  assert.equal((await request('/api/auth/register', { method: 'POST', body })).status, 409);
  assert.equal((await request('/api/auth/login', { method: 'POST', body: { email: body.email, password: 'wrongpass' } })).status, 401);
  assert.equal((await request('/api/auth/me', { cookie: created.cookie })).data.user.email, body.email);
  const order = await request('/api/orders', { method: 'POST', cookie: created.cookie, body: { customerName: 'Khách thử', phone: '0900000000', address: '123 đường ví dụ, TP HCM', items: [{ productId: 1, quantity: 2, price: 1 }] } });
  assert.equal(order.status, 201);
  assert.equal(order.data.order.total, 1780000, 'Server must ignore client-provided price');
  assert.equal((await request('/api/orders', { cookie: created.cookie })).data.orders.length, 1);
  await stop();
  await start();
  const restored = await request('/api/orders', { cookie: created.cookie });
  assert.equal(restored.data.orders[0].id, order.data.order.id, 'Orders must survive server restart');
  assert.equal(restored.data.orders[0].items[0].quantity, 2);
  const second = await request('/api/auth/register', { method: 'POST', body: { name: 'Khách khác', email: 'other@example.test', password: 'example123' } });
  assert.deepEqual((await request('/api/orders', { cookie: second.cookie })).data.orders, [], 'Users must not see each other’s orders');
  console.log('OK: catalog, filters, registration/login, access control, order totals, persistence and user isolation.');
} finally {
  await stop();
  rmSync(temporary, { recursive: true, force: true });
}
