import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const port = Number(process.env.PORT || 3001);
const databasePath = resolve(process.env.DATABASE_PATH || './data/gocmay.sqlite');

mkdirSync(dirname(databasePath), { recursive: true });

const db = new DatabaseSync(databasePath);

db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    price INTEGER NOT NULL,
    image TEXT NOT NULL,
    label TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    total INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'Mới tạo',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    name TEXT NOT NULL,
    image TEXT NOT NULL,
    price INTEGER NOT NULL,
    quantity INTEGER NOT NULL
  );
`);

// Giá và mô tả sản phẩm mang tính minh họa.
const products = [
  [
    1,
    'Tripod du lịch',
    'tripod',
    'Chân máy gọn gàng cho những chuyến đi và góc chụp linh hoạt.',
    890000,
    '/images/tripod_du_lich.png',
    'Dễ mang theo'
  ],
  [
    2,
    'Tripod mini để bàn',
    'tripod',
    'Một người bạn nhỏ cho góc làm việc, học tập và sáng tạo.',
    290000,
    '/images/tripod_mini_de_ban.png',
    'Nhỏ gọn'
  ],
  [
    3,
    'Tripod quay video',
    'tripod',
    'Chân máy dáng vững chắc, phù hợp làm mẫu cho góc quay.',
    1500000,
    '/images/tripod_quay_video.png',
    'Góc quay'
  ],
  [
    11,
    'Tripod mới',
    'tripod',
    'Chân máy hỗ trợ chụp ảnh và quay video.',
    650000,
    '/images/Tripodnew.webp',
    'Mẫu mới'
  ],
  [
    4,
    'Sạc dự phòng màu bạc',
    'sac-du-phong',
    'Thiết kế màu bạc gọn gàng, đồng hành cùng các thiết bị.',
    590000,
    '/images/sac_du_phong_bac.png',
    'Thiết kế bạc'
  ],
  [
    5,
    'Sạc dự phòng màu đen',
    'sac-du-phong',
    'Thiết kế màu đen tối giản cho những ngày di chuyển.',
    490000,
    '/images/sac_du_phong_den.png',
    'Tối giản'
  ],
  [
    6,
    'Sạc dự phòng màu trắng',
    'sac-du-phong',
    'Một lựa chọn sáng màu và tinh gọn cho mỗi hành trình.',
    390000,
    '/images/sac_du_phong_trang.png',
    'Mỏng nhẹ'
  ],

  [
    12,
    'Sạc dự phòng mới',
    'sac-du-phong',
    'Sạc dự phòng tiện lợi cho mọi hành trình.',
    450000,
    '/images/sac_du_phong_new.webp',
    'Mẫu mới'
  ],


  // Ba sản phẩm máy ảnh mới
  [
    7,
    'Máy ảnh Compact',
    'may-anh',
    'Máy ảnh nhỏ gọn cho những khoảnh khắc thường ngày.',
    12000000,
    '/images/may_anh_compact.png',
    'Nhỏ gọn'
  ],
  [
    8,
    'Máy ảnh DSLR',
    'may-anh',
    'Máy ảnh DSLR cho những góc chụp sáng tạo.',
    13000000,
    '/images/may_anh_DSLR.png',
    'Sáng tạo'
  ],
  [
    9,
    'Máy ảnh Mirrorless',
    'may-anh',
    'Máy ảnh mirrorless cho hành trình của bạn.',
    18000000,
    '/images/may_anh_mirrorless.png',
    'Linh hoạt'
  ]

];

const insertProduct = db.prepare(`
  INSERT OR IGNORE INTO products
    (id, name, category, description, price, image, label)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

for (const product of products) {
  insertProduct.run(...product);
}

const send = (res, status, data, headers = {}) => {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers
  });

  res.end(JSON.stringify(data));
};

const error = (res, status, message) => {
  return send(res, status, { error: message });
};

const clean = (value, max) => {
  return String(value ?? '').trim().slice(0, max);
};

const hashToken = token => {
  return createHash('sha256').update(token).digest('hex');
};

const sessionLifetime = 7 * 24 * 60 * 60 * 1000;

function cookieFor(token, maxAge = sessionLifetime / 1000) {
  const secure = process.env.COOKIE_SECURE === 'true' ? '; Secure' : '';

  return `gocmay_sid=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function createSession(userId) {
  const token = randomBytes(32).toString('hex');

  db.prepare(
    'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)'
  ).run(hashToken(token), userId, Date.now() + sessionLifetime);

  return token;
}

function getSession(req) {
  const cookie = (req.headers.cookie || '')
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith('gocmay_sid='));

  const token = cookie?.slice('gocmay_sid='.length) || '';

  if (!/^[a-f0-9]{64}$/.test(token)) {
    return null;
  }

  return db.prepare(`
    SELECT users.id, users.name, users.email
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE token_hash = ? AND expires_at > ?
  `).get(hashToken(token), Date.now()) || null;
}

function passwordHash(password) {
  const salt = randomBytes(16).toString('hex');

  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

function checkPassword(password, stored) {
  const [salt, hash] = stored.split(':');

  if (!salt || !hash) {
    return false;
  }

  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(password, salt, expected.length);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function readBody(req) {
  if (!(req.headers['content-type'] || '').startsWith('application/json')) {
    throw new Error('Dữ liệu gửi lên phải là JSON.');
  }

  let body = '';

  for await (const chunk of req) {
    body += chunk;

    if (body.length > 100_000) {
      throw new Error('Dữ liệu gửi lên quá lớn.');
    }
  }

  try {
    return JSON.parse(body || '{}');
  } catch {
    throw new Error('Dữ liệu gửi lên không hợp lệ.');
  }
}

const getProduct = db.prepare('SELECT * FROM products WHERE id = ?');

const safeUser = user => {
  return user
    ? { id: user.id, name: user.name, email: user.email }
    : null;
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname;
    const method = req.method;

    if (method === 'GET' && path === '/api/health') {
      return send(res, 200, { status: 'ok' });
    }

    if (method === 'GET' && path === '/api/products') {
      const q = clean(url.searchParams.get('q'), 100).toLowerCase();
      const category = clean(url.searchParams.get('category'), 32);
      const min = Number(url.searchParams.get('min') || 0);
      const max = Number(
        url.searchParams.get('max') || Number.MAX_SAFE_INTEGER
      );

      if (
        !Number.isFinite(min) ||
        !Number.isFinite(max) ||
        min < 0 ||
        max < min
      ) {
        return error(res, 400, 'Khoảng giá không hợp lệ.');
      }

      let list = db.prepare('SELECT * FROM products ORDER BY id').all();

      list = list.filter(p =>
        (!q || `${p.name} ${p.description}`.toLowerCase().includes(q)) &&
        (!category || category === 'all' || p.category === category) &&
        p.price >= min &&
        p.price <= max
      );

      if (url.searchParams.get('sort') === 'price-asc') {
        list.sort((a, b) => a.price - b.price);
      }

      if (url.searchParams.get('sort') === 'price-desc') {
        list.sort((a, b) => b.price - a.price);
      }

      return send(res, 200, { products: list });
    }

    const productMatch = path.match(/^\/api\/products\/(\d+)$/);

    if (method === 'GET' && productMatch) {
      const product = getProduct.get(Number(productMatch[1]));

      return product
        ? send(res, 200, { product })
        : error(res, 404, 'Không tìm thấy sản phẩm.');
    }

    if (method === 'GET' && path === '/api/auth/me') {
      return send(res, 200, { user: safeUser(getSession(req)) });
    }

    if (method === 'POST' && path === '/api/auth/register') {
      let body;

      try {
        body = await readBody(req);
      } catch (e) {
        return error(res, 400, e.message);
      }

      const name = clean(body.name, 80);
      const email = clean(body.email, 254).toLowerCase();
      const password = String(body.password || '');

      if (
        name.length < 2 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        password.length < 8 ||
        password.length > 128
      ) {
        return error(
          res,
          400,
          'Nhập họ tên, email hợp lệ và mật khẩu từ 8 đến 128 ký tự.'
        );
      }

      if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
        return error(res, 409, 'Email này đã được đăng ký.');
      }

      const user = {
        id: randomUUID(),
        name,
        email
      };

      db.prepare(`
        INSERT INTO users (id, name, email, password_hash)
        VALUES (?, ?, ?, ?)
      `).run(user.id, name, email, passwordHash(password));

      const token = createSession(user.id);

      return send(
        res,
        201,
        { user },
        { 'Set-Cookie': cookieFor(token) }
      );
    }

    if (method === 'POST' && path === '/api/auth/login') {
      let body;

      try {
        body = await readBody(req);
      } catch (e) {
        return error(res, 400, e.message);
      }

      const email = clean(body.email, 254).toLowerCase();
      const password = String(body.password || '');
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

      if (
        !user ||
        password.length > 128 ||
        !checkPassword(password, user.password_hash)
      ) {
        return error(res, 401, 'Email hoặc mật khẩu chưa đúng.');
      }

      const token = createSession(user.id);

      return send(
        res,
        200,
        { user: safeUser(user) },
        { 'Set-Cookie': cookieFor(token) }
      );
    }

    if (method === 'POST' && path === '/api/auth/logout') {
      const cookie = (req.headers.cookie || '')
        .split(';')
        .map(part => part.trim())
        .find(part => part.startsWith('gocmay_sid='));

      const token = cookie?.slice('gocmay_sid='.length) || '';

      if (/^[a-f0-9]{64}$/.test(token)) {
        db.prepare('DELETE FROM sessions WHERE token_hash = ?')
          .run(hashToken(token));
      }

      return send(
        res,
        200,
        { ok: true },
        { 'Set-Cookie': cookieFor('', 0) }
      );
    }

    if (path === '/api/orders' && method === 'GET') {
      const user = getSession(req);

      if (!user) {
        return error(res, 401, 'Vui lòng đăng nhập.');
      }

      const orders = db.prepare(`
        SELECT id, customer_name, phone, address, note, total, status, created_at
        FROM orders
        WHERE user_id = ?
        ORDER BY created_at DESC, rowid DESC
      `).all(user.id);

      const getItems = db.prepare(`
        SELECT product_id, name, image, price, quantity
        FROM order_items
        WHERE order_id = ?
        ORDER BY id
      `);

      return send(res, 200, {
        orders: orders.map(order => ({
          ...order,
          items: getItems.all(order.id)
        }))
      });
    }

    if (path === '/api/orders' && method === 'POST') {
      const user = getSession(req);

      if (!user) {
        return error(res, 401, 'Vui lòng đăng nhập trước khi đặt hàng.');
      }

      let body;

      try {
        body = await readBody(req);
      } catch (e) {
        return error(res, 400, e.message);
      }

      const customerName = clean(body.customerName, 80);
      const phone = clean(body.phone, 20);
      const address = clean(body.address, 300);
      const note = clean(body.note, 500);

      if (
        customerName.length < 2 ||
        !/^[0-9+().\s-]{8,20}$/.test(phone) ||
        address.length < 8
      ) {
        return error(
          res,
          400,
          'Vui lòng nhập họ tên, số điện thoại và địa chỉ hợp lệ.'
        );
      }

      if (
        !Array.isArray(body.items) ||
        !body.items.length ||
        body.items.length > 30
      ) {
        return error(res, 400, 'Giỏ hàng không hợp lệ.');
      }

      const combined = new Map();

      for (const item of body.items) {
        const id = Number(item.productId);
        const quantity = Number(item.quantity);

        if (
          !Number.isInteger(id) ||
          !Number.isInteger(quantity) ||
          quantity < 1 ||
          quantity > 99
        ) {
          return error(res, 400, 'Số lượng sản phẩm không hợp lệ.');
        }

        combined.set(id, (combined.get(id) || 0) + quantity);

        if (combined.get(id) > 99) {
          return error(res, 400, 'Mỗi sản phẩm tối đa 99 đơn vị.');
        }
      }

      const lines = [];

      for (const [id, quantity] of combined) {
        const product = getProduct.get(id);

        if (!product) {
          return error(res, 400, 'Sản phẩm không còn trong danh mục.');
        }

        lines.push({ ...product, quantity });
      }

      const total = lines.reduce(
        (sum, product) => sum + product.price * product.quantity,
        0
      );

      const id = `GM-${randomBytes(6).toString('hex').toUpperCase()}`;

      db.exec('BEGIN IMMEDIATE');

      try {
        db.prepare(`
          INSERT INTO orders
            (id, user_id, customer_name, phone, address, note, total)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          id,
          user.id,
          customerName,
          phone,
          address,
          note,
          total
        );

        const add = db.prepare(`
          INSERT INTO order_items
            (order_id, product_id, name, image, price, quantity)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        for (const product of lines) {
          add.run(
            id,
            product.id,
            product.name,
            product.image,
            product.price,
            product.quantity
          );
        }

        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }

      return send(res, 201, {
        order: {
          id,
          total,
          status: 'Mới tạo'
        }
      });
    }

    return error(res, 404, 'Không tìm thấy đường dẫn.');
  } catch (e) {
    console.error('Request error:', e);

    if (!res.headersSent) {
      return error(res, 500, 'Hệ thống đang gặp lỗi. Vui lòng thử lại.');
    }

    res.end();
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Góc Máy API đang chạy tại cổng ${port}`);
});
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    server.close(() => {
      db.close();
      process.exit(0);
    });
  });
}