# Góc Máy — website bán hàng mẫu

Dự án mẫu gồm giao diện **React**, API **Node.js** và cơ sở dữ liệu **SQLite**. Docker Compose chạy hai container: `web` (Nginx phục vụ React) và `api` (Node.js). Dữ liệu được lưu trong Docker volume `gocmay_data`, nên vẫn còn sau khi dừng hoặc tạo lại container.

> Đây là website minh họa: ảnh do AI tạo, tên sản phẩm và giá mang tính tham khảo. Đơn hàng chỉ được lưu thử, không kết nối thanh toán, kho hay vận chuyển thực tế. Chưa phù hợp để đưa thẳng lên môi trường kinh doanh thật.

## 1. Cài đặt

- Cài và mở **Docker Desktop** (trên Windows nên bật WSL 2 theo hướng dẫn của Docker).
- Giải nén dự án, mở Terminal / PowerShell tại thư mục có file `docker-compose.yml`.
- Lần đầu cần internet để tải Docker images và các gói frontend.

## 2. Khởi động

```bash
docker compose up -d --build
```

Mở <http://localhost:8080>. Lần đầu có thể mất vài phút để tải và build. Nếu cổng 8080 đã được sử dụng, đổi `"8080:80"` trong `docker-compose.yml` thành ví dụ `"8081:80"`, chạy lại lệnh ở trên rồi mở `http://localhost:8081`.

## 3. Quản lý

```bash
docker compose ps                # Xem trạng thái
docker compose logs -f           # Xem log; Ctrl+C để thoát xem log
docker compose restart           # Khởi động lại
docker compose down              # Dừng và xóa container, giữ dữ liệu
docker compose up -d --build     # Build lại sau khi sửa mã nguồn
```

**Không dùng `docker compose down -v` trừ khi bạn muốn xóa toàn bộ dữ liệu tài khoản và đơn hàng.** Có thể quản lý, xem log và dừng các container tương tự trong Docker Desktop.

## 4. Cách thử website

1. Banner tự động chuyển qua 6 hình; có nút chuyển ảnh và chọn ảnh.
2. Tìm sản phẩm, lọc theo danh mục hoặc mức giá, chọn sắp xếp.
3. Xem chi tiết, thêm sản phẩm vào giỏ, thay đổi số lượng.
4. Đăng ký hoặc đăng nhập. Đăng nhập là cần thiết để tạo và xem đơn hàng.
5. Điền thông tin để tạo đơn hàng **thử**, rồi mở mục tài khoản → **Đơn hàng của tôi**.

Giỏ hàng nằm trong trình duyệt; sản phẩm, tài khoản và đơn hàng lưu ở SQLite trong volume. Giá tiền được API tính lại từ danh mục, không lấy giá do trình duyệt gửi lên.

## 5. Luồng hoạt động

```text
Trình duyệt → React / Nginx (web:80) → /api → Node.js (api:3001) → SQLite (Docker volume)
```

React lấy danh mục và gửi yêu cầu đăng nhập, đặt hàng tới API. API đọc/ghi SQLite. Đây là SQLite, **không phải MySQL**; có thể chuyển sang MySQL sau nếu cần.

| API | Chức năng |
| --- | --- |
| `GET /api/health` | Kiểm tra API |
| `GET /api/products` | Danh mục, hỗ trợ `q`, `category`, `min`, `max`, `sort` |
| `GET /api/products/:id` | Chi tiết sản phẩm |
| `POST /api/auth/register` | Đăng ký |
| `POST /api/auth/login` | Đăng nhập |
| `GET /api/auth/me` | Xem phiên đăng nhập |
| `POST /api/auth/logout` | Đăng xuất |
| `GET /api/orders` | Xem đơn của tài khoản đang đăng nhập |
| `POST /api/orders` | Tạo đơn thử |

## 6. Sửa sản phẩm và hình ảnh

- Ảnh: `frontend/public/images/`.
- Banner và giao diện: `frontend/src/App.jsx`, `frontend/src/styles.css`.
- Dữ liệu sản phẩm khởi tạo: mảng `products` trong `backend/server.mjs`.
- Các lệnh tạo dữ liệu ban đầu dùng `INSERT OR IGNORE` để tránh ghi đè dữ liệu khi khởi động lại. Vì vậy, nếu sửa giá/tên trong mảng sau khi đã chạy, cần cập nhật trực tiếp cơ sở dữ liệu, hoặc xóa volume **sau khi sao lưu** nếu chấp nhận mất mọi tài khoản và đơn hàng; chỉ build lại sẽ không cập nhật các dòng đã có.

Khi triển khai thực tế cần thiết lập HTTPS, bật `COOKIE_SECURE=true`, bổ sung bảo vệ chống spam/thử mật khẩu, kiểm soát tồn kho, quản trị, thanh toán, vận chuyển, sao lưu và kiểm thử bảo mật phù hợp.
