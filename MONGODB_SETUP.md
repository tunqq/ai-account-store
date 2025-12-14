# Hướng dẫn kết nối MongoDB

## Cách 1: MongoDB Atlas (Miễn phí - Khuyên dùng)

### Bước 1: Tạo tài khoản MongoDB Atlas
1. Truy cập https://www.mongodb.com/cloud/atlas
2. Click **"Try Free"** → Đăng ký tài khoản (có thể dùng Google)

### Bước 2: Tạo Cluster
1. Sau khi đăng nhập, click **"Build a Database"**
2. Chọn **"M0 FREE"** (miễn phí mãi mãi, 512MB)
3. Chọn Provider: **AWS** hoặc **Google Cloud**
4. Chọn Region gần Việt Nam: **Singapore (ap-southeast-1)**
5. Đặt tên Cluster (ví dụ: `ai-store-cluster`)
6. Click **"Create"**

### Bước 3: Tạo Database User
1. Vào **Database Access** (menu bên trái)
2. Click **"Add New Database User"**
3. Chọn **Password** authentication
4. Nhập:
   - Username: `aistore` (hoặc tên bạn muốn)
   - Password: `YourPassword123` (đặt mật khẩu mạnh)
5. Database User Privileges: **Read and write to any database**
6. Click **"Add User"**

### Bước 4: Cho phép IP truy cập
1. Vào **Network Access** (menu bên trái)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - Hoặc thêm IP cụ thể nếu muốn bảo mật hơn
4. Click **"Confirm"**

### Bước 5: Lấy Connection String
1. Vào **Database** → Click **"Connect"** trên cluster
2. Chọn **"Connect your application"**
3. Driver: **Node.js**, Version: **5.5 or later**
4. Copy connection string, sẽ có dạng:
```
mongodb+srv://aistore:<password>@ai-store-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```
5. Thay `<password>` bằng mật khẩu đã tạo ở Bước 3

### Bước 6: Cấu hình trong project
1. Mở file `backend/.env` (copy từ `.env.example` nếu chưa có)
2. Sửa dòng `MONGODB_URI`:
```env
MONGODB_URI=mongodb+srv://aistore:YourPassword123@ai-store-cluster.xxxxx.mongodb.net/ai-account-store?retryWrites=true&w=majority
```
> **Lưu ý:** Thêm `/ai-account-store` trước `?` để đặt tên database

### Bước 7: Chạy Seed Data
```bash
cd backend
npm run seed
```

Nếu thành công sẽ thấy:
```
✅ Connected to MongoDB
✅ Seed data completed successfully!
📋 Test Accounts:
   Admin: admin@aistore.vn / admin123
   User:  user@test.com / user123
```

---

## Cách 2: MongoDB Local (Cài trên máy)

### Windows
1. Tải MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Chạy installer, chọn **"Complete"** installation
3. Tick **"Install MongoDB as a Service"**
4. Hoàn tất cài đặt

### macOS
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### Cấu hình
Trong `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/ai-account-store
```

---

## Kiểm tra kết nối

### Test nhanh
```bash
cd backend
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Kết nối MongoDB thành công!'))
  .catch(err => console.log('❌ Lỗi:', err.message));
"
```

### Chạy server
```bash
cd backend
npm run dev
```

Nếu thấy `✅ MongoDB Connected` là thành công!

---

## Lỗi thường gặp

### 1. "MongoNetworkError" hoặc "connection timed out"
- **Nguyên nhân:** IP chưa được whitelist
- **Giải pháp:** Vào MongoDB Atlas → Network Access → Add IP Address → Allow from Anywhere

### 2. "Authentication failed"
- **Nguyên nhân:** Sai username/password
- **Giải pháp:** Kiểm tra lại password trong connection string, không có ký tự đặc biệt như `@`, `#`, `%`

### 3. "ECONNREFUSED" (Local)
- **Nguyên nhân:** MongoDB service chưa chạy
- **Giải pháp:** 
  - Windows: Mở Services → MongoDB Server → Start
  - macOS: `brew services start mongodb-community`
  - Linux: `sudo systemctl start mongodb`

### 4. "Invalid connection string"
- **Nguyên nhân:** Connection string sai format
- **Giải pháp:** Đảm bảo format đúng:
  - Atlas: `mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/dbname`
  - Local: `mongodb://localhost:27017/dbname`

---

## Công cụ quản lý MongoDB

### MongoDB Compass (GUI - Khuyên dùng)
- Tải: https://www.mongodb.com/try/download/compass
- Dán connection string để kết nối
- Xem/sửa data trực quan

### MongoDB Atlas Web UI
- Vào cluster → Browse Collections
- Xem data online không cần cài đặt

---

## Tóm tắt nhanh

```bash
# 1. Copy file env
cd backend
cp .env.example .env

# 2. Sửa MONGODB_URI trong .env
# Atlas: mongodb+srv://user:pass@cluster.mongodb.net/ai-account-store
# Local: mongodb://localhost:27017/ai-account-store

# 3. Chạy seed data
npm run seed

# 4. Chạy server
npm run dev
```

Nếu gặp vấn đề, hãy hỏi mình nhé! 🚀
