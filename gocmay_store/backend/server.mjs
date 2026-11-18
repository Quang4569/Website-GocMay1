
import http from 'node:http';
import mysql from 'mysql2/promise';
import {
  createHash,
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual
} from 'node:crypto';

// Database schema and existing records must be migrated
// from SQLite before starting this API.
// No automatic product seeding.
const port = Number(process.env.PORT || 3001);

for (const key of ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']) {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  dateStrings: true
});

const send = (res, status, data, headers = {}) => {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers
  });

  res.end(JSON.stringify(data));
};

const error = (res, status, message) =>
  send(res, status, { error: message });

const clean = (value, max) =>
  String(value ?? '').trim().slice(0, max);

const hashToken = token =>
  createHash('sha256').update(token).digest('hex');

const sessionLifetime = 7 * 24 * 60 * 60 * 1000;

function cookieFor(token, maxAge = sessionLifetime / 1000) {
  const secure = process.env.COOKIE_SECURE === 'true'
    ? '; Secure'
    : '';

  return `gocmay_sid=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

async function createSession(userId) {
  const token = randomBytes(32).toString('hex');

  await pool.execute(
    'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)',
    [hashToken(token), userId, Date.now() + sessionLifetime]
  );

  return token;
}

function getSessionToken(req) {
  const cookie = (req.headers.cookie || '')
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith('gocmay_sid='));

  const token = cookie?.slice('gocmay_sid='.length) || '';

  return /^[a-f0-9]{64}$/.test(token) ? token : null;
}

async function getSession(req) {
  const token = getSessionToken(req);

  if (!token) return null;

  const [rows] = await pool.execute(`
    SELECT users.id, users.name, users.email
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE token_hash = ? AND expires_at > ?
  `, [hashToken(token), Date.now()]);

  return rows[0] || null;
}

function passwordHash(password) {
  const salt = randomBytes(16).toString('hex');

  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

function checkPassword(password, stored) {
  const [salt, hash] = String(stored || '').split(':');

  if (!salt || !hash || !/^[a-f0-9]+$/i.test(hash)) {
    return false;
  }

  const expected = Buffer.from(hash, 'hex');

  if (!expected.length) return false;

  const actual = scryptSync(password, salt, expected.length);

  return expected.length === actual.length &&
    timingSafeEqual(expected, actual);
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

async function getProduct(id) {
  const [rows] = await pool.execute(
    'SELECT * FROM products WHERE id = ?',
    [id]
  );

  return rows[0] || null;
}

const safeUser = user =>
  user
    ? { id: user.id, name: user.name, email: user.email }
    : null;

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname;
    const method = req.method;

    // HEALTH CHECK
    if (method === 'GET' && path === '/api/health') {
      await pool.query('SELECT 1');

      return send(res, 200, { status: 'ok' });
    }

    // PRODUCT LIST
    if (method === 'GET' && path === '/api/products') {
      const q = clean(url.searchParams.get('q'), 100)
        .toLowerCase();

      const category = clean(
        url.searchParams.get('category'),
        32
      );

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

      const [rows] = await pool.query(
        'SELECT * FROM products ORDER BY id'
      );

      const list = rows.filter(p =>
        (!q || `${p.name} ${p.description}`.toLowerCase().includes(q)) &&
        (!category || category === 'all' || p.category === category) &&
        Number(p.price) >= min &&
        Number(p.price) <= max
      );

      if (url.searchParams.get('sort') === 'price-asc') {
        list.sort((a, b) => Number(a.price) - Number(b.price));
      } else if (url.searchParams.get('sort') === 'price-desc') {
        list.sort((a, b) => Number(b.price) - Number(a.price));
      }

      return send(res, 200, { products: list });
    }

    // PRODUCT DETAIL
    const productMatch = path.match(/^\/api\/products\/(\d+)$/);

    if (method === 'GET' && productMatch) {
      const product = await getProduct(Number(productMatch[1]));

      return product
        ? send(res, 200, { product })
        : error(res, 404, 'Không tìm thấy sản phẩm.');
    }

    // CURRENT USER
    if (method === 'GET' && path === '/api/auth/me') {
      return send(res, 200, {
        user: safeUser(await getSession(req))
      });
    }

    // REGISTER
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

      const [existing] = await pool.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (existing.length) {
        return error(res, 409, 'Email này đã được đăng ký.');
      }

      const user = {
        id: randomUUID(),
        name,
        email
      };

      try {
        await pool.execute(
          'INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)',
          [user.id, name, email, passwordHash(password)]
        );
      } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') {
          return error(res, 409, 'Email này đã được đăng ký.');
        }
        throw e;
      }

      const token = await createSession(user.id);

      return send(
        res,
        201,
        { user },
        { 'Set-Cookie': cookieFor(token) }
      );
    }

    // LOGIN
    if (method === 'POST' && path === '/api/auth/login') {
      let body;

      try {
        body = await readBody(req);
      } catch (e) {
        return error(res, 400, e.message);
      }

      const email = clean(body.email, 254).toLowerCase();
      const password = String(body.password || '');

      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      const user = rows[0];

      if (
        !user ||
        password.length > 128 ||
        !checkPassword(password, user.password_hash)
      ) {
        return error(res, 401, 'Email hoặc mật khẩu chưa đúng.');
      }

      const token = await createSession(user.id);

      return send(
        res,
        200,
        { user: safeUser(user) },
        { 'Set-Cookie': cookieFor(token) }
      );
    }

    // LOGOUT
    if (method === 'POST' && path === '/api/auth/logout') {
      const token = getSessionToken(req);

      if (token) {
        await pool.execute(
          'DELETE FROM sessions WHERE token_hash = ?',
          [hashToken(token)]
        );
      }

      return send(
        res,
        200,
        { ok: true },
        { 'Set-Cookie': cookieFor('', 0) }
      );
    }

    // ORDER HISTORY
    if (path === '/api/orders' && method === 'GET') {
      const user = await getSession(req);

      if (!user) {
        return error(res, 401, 'Vui lòng đăng nhập.');
      }

      const [orders] = await pool.execute(`
        SELECT id, customer_name, phone, address, note,
               total, status, created_at
        FROM orders
        WHERE user_id = ?
        ORDER BY created_at DESC, id DESC
      `, [user.id]);

      for (const order of orders) {
        const [items] = await pool.execute(`
          SELECT product_id, name, image, price, quantity
          FROM order_items
          WHERE order_id = ?
          ORDER BY id
        `, [order.id]);

        order.items = items;
      }

      return send(res, 200, { orders });
    }

    // CREATE ORDER
    if (path === '/api/orders' && method === 'POST') {
      const user = await getSession(req);

      if (!user) {
        return error(
          res,
          401,
          'Vui lòng đăng nhập trước khi đặt hàng.'
        );
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

        combined.set(
          id,
          (combined.get(id) || 0) + quantity
        );

        if (combined.get(id) > 99) {
          return error(
            res,
            400,
            'Mỗi sản phẩm tối đa 99 đơn vị.'
          );
        }
      }

      const connection = await pool.getConnection();
      let order;

      try {
        await connection.beginTransaction();

        const lines = [];

        for (const [id, quantity] of combined) {
          const [rows] = await connection.execute(
            'SELECT * FROM products WHERE id = ?',
            [id]
          );

          const product = rows[0];

          if (!product) {
            await connection.rollback();

            return error(
              res,
              400,
              'Sản phẩm không còn trong danh mục.'
            );
          }

          lines.push({ ...product, quantity });
        }

        const total = lines.reduce(
          (sum, product) =>
            sum + Number(product.price) * product.quantity,
          0
        );

        const id = `GM-${randomBytes(6)
          .toString('hex')
          .toUpperCase()}`;

        await connection.execute(`
          INSERT INTO orders
            (id, user_id, customer_name, phone, address, note, total)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          id,
          user.id,
          customerName,
          phone,
          address,
          note,
          total
        ]);

        for (const product of lines) {
          await connection.execute(`
            INSERT INTO order_items
              (order_id, product_id, name, image, price, quantity)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            id,
            product.id,
            product.name,
            product.image,
            product.price,
            product.quantity
          ]);
        }

        await connection.commit();

        order = {
          id,
          total,
          status: 'Mới tạo'
        };
      } catch (e) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error('Rollback error:', rollbackError);
        }

        throw e;
      } finally {
        connection.release();
      }

      return send(res, 201, { order });
    }

    return error(res, 404, 'Không tìm thấy đường dẫn.');
  } catch (e) {
    console.error('Request error:', e);

    if (!res.headersSent) {
      return error(
        res,
        500,
        'Hệ thống đang gặp lỗi. Vui lòng thử lại.'
      );
    }

    res.end();
  }
});

async function start() {
  // Verify all required tables exist before starting the API.
  const [rows] = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name IN (
        'products',
        'users',
        'sessions',
        'orders',
        'order_items'
      )
  `);

  if (rows.length !== 5) {
    throw new Error(
      'MySQL chưa có đủ 5 bảng. Hãy tạo schema và chuyển dữ liệu trước.'
    );
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(
      `Góc Máy MySQL API đang chạy tại cổng ${port}`
    );
  });
}

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.once(signal, () => {
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  });
}

start().catch(async e => {
  console.error('Khởi động MySQL API thất bại:', e);

  await pool.end();
  process.exitCode = 1;
});
