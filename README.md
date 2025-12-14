# 🤖 AI Account Store

Website bán tài khoản AI với đầy đủ chức năng: đăng nhập/đăng ký, giỏ hàng, thanh toán VietQR, admin panel.

![AI Store](https://img.shields.io/badge/React-18-blue) ![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen)

## ✨ Tính năng

### 🛒 Frontend (User)
- Trang chủ với hero section, danh mục, sản phẩm nổi bật
- Danh sách sản phẩm với bộ lọc theo danh mục, giá
- Chi tiết sản phẩm
- Giỏ hàng
- Thanh toán qua VietQR
- Quản lý đơn hàng
- Đăng nhập/Đăng ký

### ⚡ Admin Panel
- Dashboard thống kê
- Quản lý sản phẩm (CRUD)
- Quản lý danh mục (CRUD)
- Quản lý đơn hàng
- Quản lý người dùng

## 🚀 Chạy nhanh (Demo Mode)

Không cần MongoDB, chạy ngay để xem giao diện:

```bash
cd ai-account-store

# Cài dependencies
cd frontend && npm install

# Chạy frontend
npm run dev
```

Truy cập http://localhost:3000 và dùng **Demo Login** để test.

## 📦 Cài đặt đầy đủ (với MongoDB)

### Yêu cầu
- Node.js 18+
- MongoDB (local hoặc Atlas)

### Bước 1: Cài đặt dependencies

```bash
cd ai-account-store

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### Bước 2: Cấu hình MongoDB

**Option A: MongoDB Atlas (Miễn phí, Khuyên dùng)**
1. Tạo tài khoản tại https://www.mongodb.com/cloud/atlas
2. Tạo cluster miễn phí
3. Tạo database user
4. Whitelist IP: `0.0.0.0/0`
5. Copy connection string

**Option B: MongoDB Local**
```bash
# Windows: Tải từ https://www.mongodb.com/try/download/community
# Mac: brew install mongodb-community
# Linux: sudo apt install mongodb
```

### Bước 3: Cấu hình environment

Sửa file `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.xxxxx.mongodb.net/ai-account-store
JWT_SECRET=your-super-secret-key-change-this

# VietQR (thay bằng thông tin thật)
VIETQR_BANK_ID=970422
VIETQR_ACCOUNT_NO=0123456789
VIETQR_ACCOUNT_NAME=AI STORE
```

### Bước 4: Tạo dữ liệu mẫu

```bash
cd backend
node seed.js
```

### Bước 5: Chạy ứng dụng

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

## 🔐 Tài khoản test

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@aistore.vn | admin123 |
| User | user@test.com | user123 |

## 🌐 Deploy

Xem hướng dẫn chi tiết trong [DEPLOY.md](./DEPLOY.md)

### Deploy nhanh lên Render.com (Miễn phí)

1. Push code lên GitHub
2. Tạo MongoDB Atlas cluster
3. Deploy backend: Render > New Web Service
4. Deploy frontend: Render > New Static Site
5. Cấu hình environment variables
6. Done!

## 📁 Cấu trúc dự án

```
ai-account-store/
├── backend/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   ├── uploads/         # Uploaded images
│   ├── server.js        # Entry point
│   └── seed.js          # Seed data
├── frontend/
│   ├── src/
│   │   ├── admin/       # Admin pages
│   │   ├── components/  # Shared components
│   │   ├── pages/       # User pages
│   │   ├── store/       # Zustand stores
│   │   ├── data/        # Mock data
│   │   └── utils/       # API client
│   └── ...
├── DEPLOY.md            # Hướng dẫn deploy
└── README.md
```

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, Zustand, React Router
- **Backend**: Node.js, Express, MongoDB, Mongoose, JWT
- **Payment**: VietQR API
- **Deploy**: Render.com / Vercel

## 📝 API Endpoints

### Auth
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user

### Products
- `GET /api/products` - Danh sách sản phẩm
- `GET /api/products/:id` - Chi tiết sản phẩm
- `POST /api/products` - Thêm sản phẩm (admin)
- `PUT /api/products/:id` - Sửa sản phẩm (admin)
- `DELETE /api/products/:id` - Xóa sản phẩm (admin)

### Categories
- `GET /api/categories` - Danh sách danh mục
- `POST /api/categories` - Thêm danh mục (admin)

### Orders
- `POST /api/orders` - Tạo đơn hàng
- `POST /api/orders/quick-buy` - Mua nhanh (không cần đăng nhập)
- `GET /api/orders/my-orders` - Đơn hàng của tôi
- `GET /api/orders/:id` - Chi tiết đơn hàng
- `POST /api/orders/:id/cancel` - Hủy đơn hàng
- `PUT /api/orders/admin/:id/status` - Cập nhật trạng thái (admin)
- `POST /api/orders/webhook/sepay` - Webhook Sepay (tự động xác nhận thanh toán)

## 💳 Tích hợp Sepay (Tự động xác nhận thanh toán)

Để hệ thống tự động xác nhận thanh toán khi nhận được tiền:

### Bước 1: Đăng ký Sepay
1. Truy cập https://my.sepay.vn và đăng ký tài khoản
2. Liên kết tài khoản ngân hàng (cùng số tài khoản với VietQR)

### Bước 2: Cấu hình Webhook
1. Đăng nhập Sepay → Cài đặt → Webhook
2. Thêm webhook URL: `https://your-domain.com/api/orders/webhook/sepay`
3. Chọn sự kiện: **Giao dịch mới**
4. Lưu và test webhook

### Bước 3: Test
1. Tạo đơn hàng trên website
2. Chuyển khoản với nội dung là mã đơn hàng
3. Hệ thống sẽ tự động xác nhận và gán tài khoản cho khách

## 📄 License

MIT

---

Made with ❤️ by AI Store Team
"# aistore" 
