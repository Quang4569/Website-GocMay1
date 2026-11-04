import React, { useEffect, useMemo, useRef, useState } from 'react';
const slides = [
  { image: '/images/tripod_du_lich.png', eyebrow: '01 / DÀNH CHO NHỮNG CHUYẾN ĐI', title: <>Giữ trọn góc nhìn.<br /><em>Đi xa hơn.</em></>, text: 'Một góc chụp vững vàng cho những ý tưởng đang chờ bạn khám phá.', category: 'tripod', tag: 'TRIPOD DU LỊCH', tone: 'lime' },
  { image: '/images/tripod_mini_de_ban.png', eyebrow: '02 / NHỎ GỌN MỖI NGÀY', title: <>Góc nhỏ thôi.<br /><em>Ý tưởng thật lớn.</em></>, text: 'Từ bàn làm việc đến góc sáng tạo, bắt đầu với những điều vừa vặn.', category: 'tripod', tag: 'TRIPOD MINI', tone: 'blue' },
  { image: '/images/tripod_quay_video.png', eyebrow: '03 / SÁNG TẠO THEO CÁCH CỦA BẠN', title: <>Mỗi khung hình<br /><em>đều đáng nhớ.</em></>, text: 'Tạo nên những thước phim mang dấu ấn rất riêng của bạn.', category: 'tripod', tag: 'TRIPOD QUAY VIDEO', tone: 'sand' },
  { image: '/images/sac_du_phong_bac.png', eyebrow: '04 / NĂNG LƯỢNG LUÔN SẴN SÀNG', title: <>Thêm năng lượng.<br /><em>Thêm hành trình.</em></>, text: 'Một người bạn đồng hành gọn gàng cho những ngày di chuyển.', category: 'sac-du-phong', tag: 'SẠC DỰ PHÒNG BẠC', tone: 'blue' },
  { image: '/images/sac_du_phong_den.png', eyebrow: '05 / GỌN GÀNG MÀ ĐẦY CẢM HỨNG', title: <>Điều hay không<br /><em>cần dừng lại.</em></>, text: 'Sẵn sàng cho nhịp sống bận rộn, theo cách thật tối giản.', category: 'sac-du-phong', tag: 'SẠC DỰ PHÒNG ĐEN', tone: 'sand' },
  { image: '/images/sac_du_phong_trang.png', eyebrow: '06 / MANG THEO ĐIỀU CẦN THIẾT', title: <>Nhẹ nhàng đi.<br /><em>Trọn vẹn trải nghiệm.</em></>, text: 'Một thiết kế tinh gọn, giúp bạn luôn chủ động trên đường đi.', category: 'sac-du-phong', tag: 'SẠC DỰ PHÒNG TRẮNG', tone: 'lime' },
  { image: '/images/may_anh_compact.png', eyebrow: '07 / NHỮNG KHOẢNH KHẮC NHỎ', title: <>Mang theo<br /><em>điều đáng nhớ.</em></>, text: 'Một chiếc máy ảnh nhỏ gọn cho những góc nhìn hằng ngày.', category: 'may-anh', tag: 'MÁY ẢNH COMPACT', tone: 'blue' },
  { image: '/images/may_anh_DSLR.png', eyebrow: '08 / KHÁM PHÁ GÓC NHÌN', title: <>Mỗi khoảnh khắc<br /><em>một câu chuyện.</em></>, text: 'Bắt đầu hành trình ghi lại thế giới theo cách của bạn.', category: 'may-anh', tag: 'MÁY ẢNH DSLR', tone: 'sand' },
  { image: '/images/may_anh_mirrorless.png', eyebrow: '09 / SẴN SÀNG SÁNG TẠO', title: <>Đi xa hơn<br /><em>với góc nhìn riêng.</em></>, text: 'Gợi ý cho những ngày bạn muốn mang theo cảm hứng.', category: 'may-anh', tag: 'MÁY ẢNH MIRRORLESS', tone: 'lime' }
];

const categoryLabels = {
  'tripod': 'TRIPOD',
  'sac-du-phong': 'SẠC DỰ PHÒNG',
  'may-anh': 'MÁY ẢNH'
};

const formatPrice = value => new Intl.NumberFormat('vi-VN').format(value) + ' ₫';
const normalized = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();
function Icon({ name, size = 20, ...props }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></>,
    bag: <><path d="M5 8h14l1 12H4L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></>,
    user: <><circle cx="12" cy="8" r="3.2"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/></>,
    arrow: <><path d="M4 12h15"/><path d="m14 7 5 5-5 5"/></>,
    left: <path d="m14 6-6 6 6 6"/>,
    right: <path d="m10 6 6 6-6 6"/>,
    plus: <><path d="M12 5v14"/><path d="M5 12h14"/></>,
    minus: <path d="M5 12h14"/>,
    close: <><path d="M6 6l12 12"/><path d="M18 6 6 18"/></>,
    box: <><path d="m12 3 8 4v10l-8 4-8-4V7l8-4Z"/><path d="m4 7 8 4 8-4M12 11v10"/></>,
    grid: <><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    back: <><path d="M20 12H5"/><path d="m10 7-5 5 5 5"/></>,
    logout: <><path d="M10 4H5v16h5"/><path d="M13 8l4 4-4 4M8 12h9"/></>
  };
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Kết nối chưa thành công. Vui lòng thử lại.');
  }
  return data;
}
function readCart() {
  try {
    const value = JSON.parse(localStorage.getItem('gocmay_cart') || '[]');

    return Array.isArray(value)
      ? value.filter(
          item =>
            Number.isInteger(item.id) &&
            Number.isInteger(item.quantity) &&
            item.quantity > 0 &&
            item.quantity <= 99
        )
      : [];
  } catch {
    return [];
  }
}
export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState(readCart);
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('featured');
  const [price, setPrice] = useState('all');
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [drawer, setDrawer] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [afterAuth, setAfterAuth] = useState('');
  const [selected, setSelected] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersError, setOrdersError] = useState('');
  const [authError, setAuthError] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [busy, setBusy] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [notice, setNotice] = useState('');
  const noticeTimer = useRef(null);
  useEffect(() => {
    api('/api/products')
      .then(data => setProducts(data.products))
      .catch(e => setLoadError(e.message))
      .finally(() => setLoading(false));

    api('/api/auth/me')
      .then(data => setUser(data.user))
      .catch(() => {});
  }, []);
  useEffect(() => {
    localStorage.setItem('gocmay_cart', JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (paused || reduced) return;

    const timer = setInterval(() => {
      if (!document.hidden) {
        setSlide(s => (s + 1) % slides.length);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [paused]);

  useEffect(() => {
    const onKey = event => {
      if (event.key === 'Escape') {
        setDrawer('');
        setSelected(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => () => clearTimeout(noticeTimer.current), []);
  const showNotice = text => {
    setNotice(text);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(''), 2600);
  };
  const visible = useMemo(() => {
    let list = products.filter(
      p =>
        (category === 'all' || p.category === category) &&
        normalized(p.name + ' ' + p.description).includes(normalized(query.trim()))
    );

    if (price === 'under-500') list = list.filter(p => p.price < 500000);
    if (price === '500-1000') list = list.filter(p => p.price >= 500000 && p.price <= 1000000);
    if (price === 'over-1000') list = list.filter(p => p.price > 1000000);
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);

    return list;
  }, [products, category, query, price, sort]);
  const lines = cart
    .map(item => ({
      ...products.find(p => p.id === item.id),
      quantity: item.quantity
    }))
    .filter(item => item.id);
  const total = lines.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const current = slides[slide];
  const browse = value => {
    setCategory(value);
    setQuery('');
    setPrice('all');
    document.getElementById('san-pham')?.scrollIntoView({ behavior: 'smooth' });
  };
  const addToCart = item => {
    setCart(old =>
      old.some(i => i.id === item.id)
        ? old.map(i =>
            i.id === item.id
              ? { ...i, quantity: Math.min(99, i.quantity + 1) }
              : i
          )
        : [...old, { id: item.id, quantity: 1 }]
    );
    showNotice('Đã thêm vào giỏ hàng');
  };
  const changeQuantity = (id, change) => {
    setCart(old =>
      old
        .map(item =>
          item.id === id
            ? { ...item, quantity: Math.min(99, item.quantity + change) }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  };

  const showAuth = (next = '') => {
    setAfterAuth(next);
    setAuthError('');
    setAuthMode('login');
    setDrawer('auth');
  };

  const showOrders = async () => {
    if (!user) return showAuth('orders');

    setDrawer('orders');
    setOrdersError('');

    try {
      const data = await api('/api/orders');
      setOrders(data.orders);
    } catch (e) {
      setOrdersError(e.message);
    }
  };

  const submitAuth = async event => {
    event.preventDefault();
    setAuthError('');
    setBusy(true);

    const f = new FormData(event.currentTarget);

    try {
      const body = {
        email: f.get('email'),
        password: f.get('password'),
        ...(authMode === 'register' ? { name: f.get('name') } : {})
      };

      const data = await api(`/api/auth/${authMode}`, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      setUser(data.user);

      if (afterAuth === 'checkout') {
        setDrawer('checkout');
      } else if (afterAuth === 'orders') {
        setDrawer('orders');
        const result = await api('/api/orders');
        setOrders(result.orders);
      } else {
        setDrawer('');
      }

      showNotice(`Xin chào ${data.user.name}!`);
    } catch (e) {
      setAuthError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setOrders([]);
      setDrawer('');
      showNotice('Đã đăng xuất');
    } catch (e) {
      showNotice(e.message);
    }
  };

  const proceed = () => {
    if (!lines.length) return;

    setCheckoutError('');

    if (!user) {
      showAuth('checkout');
    } else {
      setDrawer('checkout');
    }
  };

  const submitOrder = async event => {
    event.preventDefault();
    setCheckoutError('');
    setBusy(true);

    const f = new FormData(event.currentTarget);

    try {
      const body = {
        customerName: f.get('customerName'),
        phone: f.get('phone'),
        address: f.get('address'),
        note: f.get('note'),
        items: lines.map(item => ({
          productId: item.id,
          quantity: item.quantity
        }))
      };

      const data = await api('/api/orders', {
        method: 'POST',
        body: JSON.stringify(body)
      });

      setCart([]);
      setPlacedOrder(data.order);
      setDrawer('success');
    } catch (e) {
      setCheckoutError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="announcement">
        <span className="announce-dot" />
        CHÀO MỪNG ĐẾN GÓC MÁY -NƠI Ý TƯỞNG SÁNG TẠO BẮT ĐẦU    
        <span>✳</span>
      </div>

      <header className="header">
        <div className="header-main shell">
          <a
            href="#dau-trang"
            className="brand"
            aria-label="Góc Máy, về đầu trang"
          >
            <span className="brand-mark">
              <span />
            </span>

            <span>
              góc<span className="brand-accent">máy</span>
              <small>CREATIVE GEAR</small>
            </span>
          </a>

          <nav className="main-nav" aria-label="Menu chính">
            <a href="#san-pham" onClick={() => setCategory('all')}>
              Tất cả sản phẩm
            </a>

            <a href="#san-pham" onClick={() => setCategory('tripod')}>
              Tripod
            </a>

            <a href="#san-pham" onClick={() => setCategory('sac-du-phong')}>
              Sạc dự phòng
            </a>

            <a href="#san-pham" onClick={() => setCategory('may-anh')}>
              Máy ảnh
            </a>
          </nav>

          <div className="header-actions">
           <label className="search-field">
             <Icon name="search" size={17} />
             <span className="sr-only">Tìm sản phẩm</span>
                <input
                 id="product-search"
                 type="search"
                 placeholder="Tìm sản phẩm..."
                 value={query}
                 onChange={(e) => {
                  setQuery(e.target.value);
                  setCategory('all');
                }}
                onKeyDown={(e) => {
                 if (e.key === 'Enter') {
                 e.preventDefault();
                 document.getElementById('san-pham')?.scrollIntoView({
                 behavior: 'smooth',
                 block: 'start'
            });
           }
            }}
              />
              </label>

            <button
              className="icon-button"
              aria-label={user ? 'Tài khoản' : 'Đăng nhập'}
              onClick={() => user ? setDrawer('account') : showAuth()}
            >
              <Icon name="user" />
            </button>

            <button
              className="icon-button bag-button"
              aria-label={`Giỏ hàng, ${count} sản phẩm`}
              onClick={() => setDrawer('cart')}
            >
              <Icon name="bag" />
              <span className="bag-count">{count}</span>
            </button>
          </div>
        </div>
      </header>

      <main id="dau-trang">
        <section
          className="hero shell"
          aria-roledescription="carousel"
          aria-label="Sản phẩm nổi bật"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={event => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setPaused(false);
            }
          }}
        >
          <div className={`hero-panel ${current.tone}`}>
            <div className="hero-copy" key={'copy-' + slide}>
              <div className="eyebrow">
                <span className="eyebrow-line" />
                {current.eyebrow}
              </div>

              <h1>{current.title}</h1>
              <p>{current.text}</p>

              <button
                className="primary-button hero-cta"
                onClick={() => browse(current.category)}
              >
                Khám phá ngay <Icon name="arrow" size={19} />
              </button>
            </div>

            <div className="hero-art" aria-label={current.tag}>
              <div className="hero-art-circle" />
              <span className="hero-orbit orbit-one" />
              <span className="hero-orbit orbit-two" />

              <div className="hero-sparkle">✳</div>

              <img
                key={current.image}
                src={current.image}
                alt={current.tag.toLowerCase()}
              />

              <span className="hero-product-tag">
                <span /> {current.tag}
              </span>
            </div>

            <div className="hero-bottom">
              <div
                className="hero-progress"
                aria-label={`Ảnh ${slide + 1} trên ${slides.length}`}
              >
                {slides.map((s, i) => (
                  <button
                    key={s.image}
                    className={i === slide ? 'active' : ''}
                    aria-label={`Xem ảnh ${i + 1}: ${s.tag}`}
                    aria-current={i === slide ? 'true' : undefined}
                    onClick={() => setSlide(i)}
                  />
                ))}
              </div>

              <div className="slider-controls">
                <span>
                  0{slide + 1} <b>/</b> 0{slides.length}
                </span>

                <button
                  aria-label="Ảnh trước"
                  onClick={() => setSlide((slide + slides.length - 1) % slides.length)}
                >
                  <Icon name="left" size={17} />
                </button>

                <button
                  aria-label="Ảnh tiếp theo"
                  onClick={() => setSlide((slide + 1) % slides.length)}
                >
                  <Icon name="right" size={17} />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="intro-strip shell" aria-label="Giới thiệu">
          <div>
            <span className="intro-icon">✳</span>
            <div>
              <strong>Cho những ý tưởng của bạn</strong>
              <small>Phụ kiện cho cuộc sống sáng tạo</small>
            </div>
          </div>

          <div>
            <span className="intro-icon">
              <Icon name="box" size={21} />
            </span>
            <div>
              <strong>Đơn hàng dễ theo dõi</strong>
              <small>Xem lại ngay trong tài khoản</small>
            </div>
          </div>

          <div>
            <span className="intro-icon">⌁</span>
            <div>
              <strong>Trải nghiệm đơn giản</strong>
              <small>Chọn nhanh, đặt hàng dễ dàng</small>
            </div>
          </div>
        </section>

        <section className="categories shell" aria-labelledby="category-heading">
          <div className="section-top">
            <div>
              <div className="eyebrow dark-eyebrow">CHỌN THEO NHU CẦU</div>
              <h2 id="category-heading">Hôm nay bạn tìm gì?</h2>
            </div>

            <span className="section-note">01 — DANH MỤC</span>
          </div>

          <div className="category-grid">
            <button
              className="category-card category-tripod"
              onClick={() => browse('tripod')}
            >
              <span className="category-copy">
                <small>01 / GÓC SÁNG TẠO</small>
                <strong>Tripod</strong>
                <span>Khám phá <Icon name="arrow" size={16} /></span>
              </span>

              <img src="/images/tripod_du_lich.png" alt="" />
              <span className="category-circle" />
            </button>

            <button
              className="category-card category-power"
              onClick={() => browse('sac-du-phong')}
            >
              <span className="category-copy">
                <small>02 / LUÔN SẴN SÀNG</small>
                <strong>Sạc dự phòng</strong>
                <span>Khám phá <Icon name="arrow" size={16} /></span>
              </span>

              <img src="/images/sac_du_phong_bac.png" alt="" />
              <span className="category-circle" />
            </button>

            <button
              className="category-card category-camera"
              onClick={() => browse('may-anh')}
            >
              <span className="category-copy">
                <small>03 / GÓC NHÌN MỚI</small>
                <strong>Máy ảnh</strong>
                <span>Khám phá <Icon name="arrow" size={16} /></span>
              </span>

              <img src="/images/may_anh_mirrorless.png" alt="" />
              <span className="category-circle" />
            </button>
          </div>
        </section>

        <section
          className="catalog shell"
          id="san-pham"
          aria-labelledby="product-heading"
        >
          <div className="section-top">
            <div>
              <div className="eyebrow dark-eyebrow">NHỮNG MÓN ĐỒ HAY HO</div>

              <h2 id="product-heading">
                Chọn một người bạn đồng hành
                <span className="heading-dot">.</span>
              </h2>

              <p>Những phụ kiện nhỏ cho những hành trình lớn.</p>
            </div>

            <span className="section-note">02 — SẢN PHẨM</span>
          </div>

          <div className="catalog-tools">
            <div className="filter-pills" role="group" aria-label="Lọc theo danh mục">
              {[
                ['all', 'Tất cả'],
                ['tripod', 'Tripod'],
                ['sac-du-phong', 'Sạc dự phòng'],
                ['may-anh', 'Máy ảnh']
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={category === value ? 'active' : ''}
                  onClick={() => setCategory(value)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="tool-controls">

              <label>
                <span className="sr-only">Lọc theo giá</span>

                <select value={price} onChange={e => setPrice(e.target.value)}>
                  <option value="all">Mọi mức giá</option>
                  <option value="under-500">Dưới 500.000₫</option>
                  <option value="500-1000">500.000₫ – 1 triệu</option>
                  <option value="over-1000">Trên 1 triệu</option>
                </select>
              </label>

              <label>
                <span className="sr-only">Sắp xếp</span>

                <select value={sort} onChange={e => setSort(e.target.value)}>
                  <option value="featured">Nổi bật</option>
                  <option value="price-asc">Giá thấp đến cao</option>
                  <option value="price-desc">Giá cao đến thấp</option>
                </select>
              </label>
            </div>
          </div>

          <div className="result-row">
            <span>{loading ? 'Đang tải sản phẩm…' : `${visible.length} sản phẩm`}</span>
            <span>GIÁ THAM KHẢO</span>
          </div>

          {loadError && (
            <div className="empty-state">
              Không tải được sản phẩm. Hãy kiểm tra API và thử tải lại trang.
            </div>
          )}

          {!loading && !loadError && !visible.length && (
            <div className="empty-state">
              <Icon name="search" size={28} />
              <strong>Chưa tìm thấy sản phẩm phù hợp</strong>
              <span>Thử từ khóa hoặc bộ lọc khác nhé.</span>

              <button onClick={() => {
                setQuery('');
                setCategory('all');
                setPrice('all');
              }}>
                Xóa bộ lọc
              </button>
            </div>
          )}

          <div className="product-grid">
            {visible.map(product => (
              <article className="product-card" key={product.id}>
                <button
                  className="product-image"
                  onClick={() => setSelected(product)}
                  aria-label={`Xem ${product.name}`}
                >
                  <span className="product-label">{product.label}</span>

                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                  />

                  <span className="image-arrow">
                    <Icon name="arrow" size={18} />
                  </span>
                </button>

                <div className="product-details">
                  <div className="product-category">
                    {categoryLabels[product.category] || product.category}
                  </div>

                  <button
                    className="product-name"
                    onClick={() => setSelected(product)}
                  >
                    {product.name}
                  </button>

                  <div className="product-footer">
                    <span>{formatPrice(product.price)}</span>

                    <button
                      aria-label={`Thêm ${product.name} vào giỏ hàng`}
                      onClick={() => addToCart(product)}
                    >
                      <Icon name="plus" size={18} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="closing shell">
          <div className="closing-inner">
            <div>
              <div className="eyebrow">GÓC MÁY / CREATIVE GEAR</div>

              <h2>
                Để ý tưởng của bạn<br />
                <em>luôn sẵn sàng.</em>
              </h2>

              <p>Bắt đầu từ những món đồ bạn yêu thích.</p>

              <button onClick={() => browse('all')}>
                Xem tất cả sản phẩm <Icon name="arrow" size={18} />
              </button>
            </div>

            <div className="closing-art">
              <span>✳</span>
              <p>MAKE ROOM<br />FOR GOOD IDEAS.</p>
              <small>THINGS FOR YOUR EVERYDAY.</small>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="shell footer-inner">
          <a href="#dau-trang" className="footer-brand">
            gócmáy<span>✳</span>
          </a>

          <p>
            Phụ kiện nhỏ, cảm hứng lớn.<br />
            <span>Website demo · Sản phẩm, hình ảnh và giá chỉ để minh họa.</span>
          </p>

          <button onClick={showOrders}>
            Đơn hàng của tôi <Icon name="arrow" size={16} />
          </button>
        </div>

        <div className="shell footer-bottom">
          <span>© GÓC MÁY / CREATIVE GEAR</span>
          <span>MADE FOR CREATIVE DAYS ☺</span>
        </div>
      </footer>

      {notice && (
        <div className="toast" role="status">
          <Icon name="check" size={17} />
          {notice}
        </div>
      )}

      {selected && (
        <div className="modal-layer" onClick={() => setSelected(null)}>
          <section
            className="product-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Chi tiết ${selected.name}`}
            onClick={e => e.stopPropagation()}
          >
            <button
              className="close-button modal-close"
              aria-label="Đóng"
              onClick={() => setSelected(null)}
            >
              <Icon name="close" />
            </button>

            <div className="modal-image">
              <img src={selected.image} alt={selected.name} />
            </div>

            <div className="modal-copy">
              <div className="eyebrow dark-eyebrow">SẢN PHẨM MINH HỌA</div>
              <h2>{selected.name}</h2>
              <p>{selected.description}</p>
              <strong className="modal-price">{formatPrice(selected.price)}</strong>
              <small>Giá tham khảo cho bản demo.</small>

              <button
                className="primary-button"
                onClick={() => {
                  addToCart(selected);
                  setSelected(null);
                }}
              >
                Thêm vào giỏ <Icon name="plus" size={18} />
              </button>
            </div>
          </section>
        </div>
      )}

      {drawer && (
        <div className="drawer-layer" onClick={() => setDrawer('')}>
          <aside
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-label={
              drawer === 'cart'
                ? 'Giỏ hàng'
                : drawer === 'checkout'
                  ? 'Thông tin đặt hàng'
                  : drawer === 'orders'
                    ? 'Đơn hàng của tôi'
                    : 'Tài khoản'
            }
            onClick={e => e.stopPropagation()}
          >
            <div className="drawer-header">
              <div>
                <span className="eyebrow dark-eyebrow">
                  GÓC MÁY / CREATIVE GEAR
                </span>

                <h2>
                  {drawer === 'cart'
                    ? 'Giỏ hàng'
                    : drawer === 'checkout'
                      ? 'Thông tin đặt hàng'
                      : drawer === 'orders'
                        ? 'Đơn hàng của tôi'
                        : drawer === 'success'
                          ? 'Đã đặt hàng!'
                          : drawer === 'account'
                            ? 'Tài khoản'
                            : authMode === 'register'
                              ? 'Tạo tài khoản'
                              : 'Chào bạn trở lại'}
                </h2>
              </div>

              <button
                className="close-button"
                aria-label="Đóng"
                onClick={() => setDrawer('')}
              >
                <Icon name="close" />
              </button>
            </div>

            {drawer === 'cart' && (
              <>
                <div className="drawer-body">
                  {!lines.length ? (
                    <div className="drawer-empty">
                      <span><Icon name="bag" size={30} /></span>
                      <h3>Giỏ hàng còn trống</h3>
                      <p>Chọn vài món bạn yêu thích nhé.</p>

                      <button onClick={() => {
                        setDrawer('');
                        browse('all');
                      }}>
                        Khám phá sản phẩm <Icon name="arrow" size={17} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="drawer-caption">
                        Bạn có {count} sản phẩm trong giỏ.
                      </p>

                      {lines.map(item => (
                        <div className="cart-line" key={item.id}>
                          <img src={item.image} alt="" />

                          <div className="cart-line-info">
                            <strong>{item.name}</strong>
                            <span>{formatPrice(item.price)}</span>
                            <div className="quantity">
                              <button
                                aria-label={`Giảm ${item.name}`}
                                onClick={() => changeQuantity(item.id, -1)}
                              >
                                <Icon name="minus" size={15} />
                              </button>

                              <span>{item.quantity}</span>

                              <button
                                aria-label={`Tăng ${item.name}`}
                                onClick={() => changeQuantity(item.id, 1)}
                              >
                                <Icon name="plus" size={15} />
                              </button>
                            </div>
                          </div>

                          <button
                            className="remove-button"
                            aria-label={`Xóa ${item.name}`}
                            onClick={() => setCart(old => old.filter(i => i.id !== item.id))}
                          >
                            <Icon name="close" size={17} />
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {!!lines.length && (
                  <div className="drawer-bottom">
                    <div className="total-row">
                      <span>Tạm tính</span>
                      <strong>{formatPrice(total)}</strong>
                    </div>

                    <p>Giá tham khảo; đây là đơn hàng thử.</p>

                    <button className="primary-button full-width" onClick={proceed}>
                      Tiếp tục đặt hàng <Icon name="arrow" size={19} />
                    </button>
                  </div>
                )}
              </>
            )}

            {drawer === 'auth' && (
              <form className="drawer-form" onSubmit={submitAuth}>
                <p>
                  {authMode === 'register'
                    ? 'Tạo tài khoản để lưu và xem lại đơn hàng.'
                    : 'Đăng nhập để tiếp tục hành trình của bạn.'}
                </p>

                {authMode === 'register' && (
                  <label>
                    Họ và tên
                    <input
                      name="name"
                      autoComplete="name"
                      minLength="2"
                      maxLength="80"
                      required
                      placeholder="Tên của bạn"
                    />
                  </label>
                )}

                <label>
                  Email
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="ban@email.com"
                  />
                </label>

                <label>
                  Mật khẩu
                  <input
                    name="password"
                    type="password"
                    autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                    minLength="8"
                    maxLength="128"
                    required
                    placeholder="Tối thiểu 8 ký tự"
                  />
                </label>

                {authError && (
                  <p className="form-error" role="alert">{authError}</p>
                )}

                <button className="primary-button full-width" disabled={busy}>
                  {busy
                    ? 'Đang xử lý...'
                    : authMode === 'register'
                      ? 'Tạo tài khoản'
                      : 'Đăng nhập'}
                  {' '}<Icon name="arrow" size={18} />
                </button>

                <p className="form-switch">
                  {authMode === 'register' ? 'Đã có tài khoản?' : 'Bạn chưa có tài khoản?'}
                  {' '}

                  <button
                    type="button"
                    onClick={() => {
                      setAuthError('');
                      setAuthMode(authMode === 'register' ? 'login' : 'register');
                    }}
                  >
                    {authMode === 'register' ? 'Đăng nhập' : 'Đăng ký ngay'}
                  </button>
                </p>
              </form>
            )}

            {drawer === 'checkout' && (
              <form className="drawer-form checkout-form" onSubmit={submitOrder}>
                <button
                  type="button"
                  className="back-link"
                  onClick={() => setDrawer('cart')}
                >
                  <Icon name="back" size={17} /> Trở lại giỏ hàng
                </button>

                <p>Điền thông tin để tạo <strong>đơn hàng thử</strong>.</p>

                <label>
                  Họ và tên
                  <input
                    name="customerName"
                    defaultValue={user?.name || ''}
                    minLength="2"
                    maxLength="80"
                    required
                    placeholder="Họ và tên người nhận"
                  />
                </label>

                <label>
                  Số điện thoại
                  <input
                    name="phone"
                    type="tel"
                    minLength="8"
                    maxLength="20"
                    required
                    placeholder="Số điện thoại liên hệ"
                  />
                </label>

                <label>
                  Địa chỉ nhận hàng
                  <textarea
                    name="address"
                    minLength="8"
                    maxLength="300"
                    required
                    placeholder="Số nhà, đường, phường/xã, tỉnh/thành"
                    rows="3"
                  />
                </label>

                <label>
                  Ghi chú <span className="optional">(không bắt buộc)</span>
                  <textarea
                    name="note"
                    maxLength="500"
                    placeholder="Bạn muốn nhắn thêm điều gì?"
                    rows="2"
                  />
                </label>

                <div className="checkout-total">
                  <span>
                    Tổng đơn hàng
                    <small>{count} sản phẩm · giá demo</small>
                  </span>

                  <strong>{formatPrice(total)}</strong>
                </div>

                <p className="demo-note">
                  Đây là đơn hàng mô phỏng, chưa kết nối thanh toán hay giao hàng thực tế.
                </p>

                {checkoutError && (
                  <p className="form-error" role="alert">{checkoutError}</p>
                )}

                <button className="primary-button full-width" disabled={busy}>
                  {busy ? 'Đang tạo đơn...' : 'Xác nhận đơn hàng thử'}
                  {' '}<Icon name="arrow" size={18} />
                </button>
              </form>
            )}

            {drawer === 'success' && (
              <div className="drawer-empty success">
                <span><Icon name="check" size={30} /></span>
                <h3>Đơn hàng đã được tạo</h3>
                <p>Mã đơn của bạn: <strong>{placedOrder?.id}</strong></p>
                <p>Đây là đơn hàng thử và sẽ không được giao thực tế.</p>

                <button onClick={showOrders}>
                  Xem đơn hàng <Icon name="arrow" size={17} />
                </button>
              </div>
            )}

            {drawer === 'orders' && (
              <div className="drawer-body">
                <p className="drawer-caption">Danh sách đơn hàng thử của bạn.</p>

                {ordersError && <p className="form-error">{ordersError}</p>}

                {!ordersError && !orders.length && (
                  <div className="drawer-empty">
                    <span><Icon name="box" size={30} /></span>
                    <h3>Chưa có đơn hàng nào</h3>
                    <p>Hãy chọn một vài món đồ bạn thích nhé.</p>

                    <button onClick={() => {
                      setDrawer('');
                      browse('all');
                    }}>
                      Xem sản phẩm <Icon name="arrow" size={17} />
                    </button>
                  </div>
                )}

                {orders.map(order => (
                  <article className="order-card" key={order.id}>
                    <div className="order-card-top">
                      <strong>{order.id}</strong>
                      <span>{order.status}</span>
                    </div>

                    <small>
                      {new Date(order.created_at.replace(' ', 'T') + 'Z').toLocaleString('vi-VN')}
                    </small>

                    {order.items.map(item => (
                      <div className="order-item" key={item.product_id}>
                        <span>{item.name} × {item.quantity}</span>
                        <span>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}

                    <div className="order-total">
                      <span>Tổng cộng</span>
                      <strong>{formatPrice(order.total)}</strong>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {drawer === 'account' && (
              <div className="drawer-body account-panel">
                <div className="account-avatar">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>

                <h3>{user?.name}</h3>
                <p>{user?.email}</p>

                <button onClick={showOrders}>
                  <Icon name="box" size={19} />
                  Đơn hàng của tôi
                  <Icon name="right" size={18} />
                </button>

                <button onClick={logout}>
                  <Icon name="logout" size={19} />
                  Đăng xuất
                  <Icon name="right" size={18} />
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}