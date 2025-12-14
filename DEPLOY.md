# Hướng dẫn Deploy AI Account Store

## 🚀 Cách 1: Deploy lên Render.com (Miễn phí, Dễ nhất)

### Bước 1: Tạo MongoDB Atlas (Database miễn phí)
1. Vào https://www.mongodb.com/cloud/atlas
2. Đăng ký tài khoản miễn phí
3. Tạo cluster mới (chọn FREE tier)
4. Tạo database user với username/password
5. Whitelist IP: `0.0.0.0/0` (cho phép tất cả)
6. Copy connection string: `mongodb+srv://<user>:<pass>@cluster.xxxxx.mongodb.net/ai-account-store`

### Bước 2: Deploy Backend lên Render
1. Vào https://render.com và đăng nhập với GitHub
2. New > Web Service
3. Connect repository chứa code
4. Cấu hình:
   - Name: `ai-store-api`
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Environment Variables:
   ```
   NODE_ENV=production
   MONGODB_URI=<connection string từ MongoDB Atlas>
   JWT_SECRET=<random string dài>
   FRONTEND_URL=https://your-frontend-url.onrender.com
   VIETQR_BANK_ID=970422
   VIETQR_ACCOUNT_NO=<số tài khoản thật>
   VIETQR_ACCOUNT_NAME=<tên chủ tài khoản>
   ```
6. Deploy!

### Bước 3: Deploy Frontend lên Render
1. New > Static Site
2. Connect repository
3. Cấu hình:
   - Name: `ai-store-frontend`
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
4. Environment Variables:
   ```
   VITE_API_URL=https://ai-store-api.onrender.com
   ```
5. Deploy!

### Bước 4: Seed dữ liệu
```bash
# Chạy local với MONGODB_URI của Atlas
cd backend
MONGODB_URI="mongodb+srv://..." node seed.js
```

---

## 🌐 Cách 2: Deploy lên Vercel

### Backend (Vercel Serverless)
1. Vào https://vercel.com
2. Import repository
3. Root Directory: `backend`
4. Add Environment Variables (giống Render)
5. Deploy

### Frontend
1. Import repository
2. Root Directory: `frontend`
3. Framework: Vite
4. Add Environment Variables:
   ```
   VITE_API_URL=https://your-backend.vercel.app
   ```
5. Deploy

---

## 🐳 Cách 3: Deploy với Docker

### Dockerfile cho Backend
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend/ .
EXPOSE 5000
CMD ["npm", "start"]
```

### Dockerfile cho Frontend
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

---

## 🔧 Cấu hình Production

### 1. Cập nhật Frontend API URL
Tạo file `frontend/.env.production`:
```
VITE_API_URL=https://your-api-domain.com
```

### 2. Cập nhật `frontend/src/utils/api.js`:
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' }
});
// ... rest of code
```

### 3. Thông tin VietQR thật
Cập nhật trong backend `.env`:
```
VIETQR_BANK_ID=970422        # Mã ngân hàng (MB Bank)
VIETQR_ACCOUNT_NO=0123456789 # Số tài khoản thật
VIETQR_ACCOUNT_NAME=TEN CHU TK # Tên chủ tài khoản
```

Danh sách mã ngân hàng: https://api.vietqr.io/v2/banks

---

## 📋 Checklist trước khi deploy

- [ ] Đã tạo MongoDB Atlas cluster
- [ ] Đã whitelist IP 0.0.0.0/0
- [ ] Đã tạo database user
- [ ] Đã copy connection string
- [ ] Đã thay JWT_SECRET bằng string ngẫu nhiên
- [ ] Đã cập nhật thông tin VietQR thật
- [ ] Đã chạy seed data
- [ ] Đã test đăng nhập admin

---

## 🔐 Tài khoản mặc định

Sau khi seed data:
- **Admin**: admin@aistore.vn / admin123
- **User**: user@test.com / user123

---

## ❓ Troubleshooting

### Lỗi kết nối MongoDB
- Kiểm tra connection string
- Kiểm tra whitelist IP
- Kiểm tra username/password

### Lỗi CORS
- Kiểm tra FRONTEND_URL trong backend .env
- Đảm bảo URL không có trailing slash

### Lỗi 404 khi refresh trang
- Cấu hình redirect tất cả routes về index.html
- Render: thêm `_redirects` file
- Vercel: đã có trong vercel.json
