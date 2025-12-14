# 🧪 Checklist Test UI - AI Account Store

## 📍 URL: http://localhost:3000

---

## ✅ Trang chủ (/)
- [ ] Hero section hiển thị đúng với gradient background
- [ ] Floating cards animation hoạt động
- [ ] Trust badges (10K+, 50K+, 99%) hiển thị
- [ ] Features section (4 cards) hiển thị đúng
- [ ] Danh mục sản phẩm (5 categories) hiển thị
- [ ] Sản phẩm nổi bật (8 products) hiển thị
- [ ] Best sellers section với ranking badges
- [ ] CTA section với email input
- [ ] Footer hiển thị đầy đủ

## ✅ Header
- [ ] Logo hiển thị
- [ ] Navigation links hoạt động
- [ ] Cart icon với badge số lượng
- [ ] Scroll effect (background thay đổi khi scroll)
- [ ] Mobile menu hoạt động (responsive)
- [ ] User menu dropdown (khi đăng nhập)

## ✅ Trang sản phẩm (/products)
- [ ] Header với gradient
- [ ] Sidebar filters hiển thị
- [ ] Search input hoạt động
- [ ] Category filter hoạt động
- [ ] Price range filter hoạt động
- [ ] Sort dropdown hoạt động
- [ ] Grid/List view toggle
- [ ] Product cards hiển thị đúng
- [ ] Hover effects trên cards

## ✅ Chi tiết sản phẩm (/products/:id)
- [ ] Breadcrumb navigation
- [ ] Product image/placeholder
- [ ] Badges (Hot, Sale, etc.)
- [ ] Price và original price
- [ ] Features list
- [ ] Quantity selector
- [ ] Add to cart button
- [ ] Stock status
- [ ] Trust badges
- [ ] Related products

## ✅ Giỏ hàng (/cart)
- [ ] Empty cart state
- [ ] Cart items hiển thị
- [ ] Quantity controls
- [ ] Remove item
- [ ] Clear all
- [ ] Order summary
- [ ] Checkout button

## ✅ Đăng nhập (/login)
- [ ] Form hiển thị đúng
- [ ] Email/Password inputs
- [ ] Show/hide password toggle
- [ ] Remember me checkbox
- [ ] Login button
- [ ] Demo login buttons (User/Admin)
- [ ] Test account info box
- [ ] Register link
- [ ] Right side image (desktop)

## ✅ Đăng ký (/register)
- [ ] Form hiển thị đúng
- [ ] Name/Email/Password inputs
- [ ] Password strength indicator
- [ ] Confirm password validation
- [ ] Terms checkbox
- [ ] Register button
- [ ] Demo register button
- [ ] Login link
- [ ] Left side benefits (desktop)

## ✅ Thanh toán (/checkout)
- [ ] Order summary
- [ ] Payment method (VietQR)
- [ ] Create order button
- [ ] QR code hiển thị sau khi tạo đơn
- [ ] Copy buttons hoạt động
- [ ] Success message

## ✅ Đơn hàng (/orders)
- [ ] Empty state (khi chưa có đơn)
- [ ] Order list
- [ ] Status badges
- [ ] Order detail link

## ✅ Chi tiết đơn hàng (/orders/:id)
- [ ] Order info
- [ ] Products list
- [ ] Payment info (nếu pending)
- [ ] Account data (nếu completed)

---

## 🔐 Admin Panel (/admin)

### Dashboard
- [ ] Welcome banner
- [ ] Stats cards (4 cards)
- [ ] Recent orders table
- [ ] Top products list
- [ ] Quick actions

### Sản phẩm (/admin/products)
- [ ] Products table
- [ ] Search
- [ ] Add product button
- [ ] Edit/Delete buttons
- [ ] Modal form

### Danh mục (/admin/categories)
- [ ] Categories grid
- [ ] Add category button
- [ ] Edit/Delete buttons
- [ ] Modal form

### Đơn hàng (/admin/orders)
- [ ] Orders table
- [ ] Search & filter
- [ ] View detail button
- [ ] Status update modal

### Người dùng (/admin/users)
- [ ] Users table
- [ ] Search
- [ ] Stats cards
- [ ] Role badges

---

## 🎯 Test Flow

### Flow 1: Mua hàng (Demo)
1. Vào trang chủ
2. Click "Mua ngay" hoặc chọn sản phẩm
3. Thêm vào giỏ hàng
4. Vào giỏ hàng
5. Click "Đăng nhập để thanh toán"
6. Click "User Demo" để đăng nhập
7. Quay lại giỏ hàng
8. Click "Tiến hành thanh toán"
9. Tạo đơn hàng
10. Xem QR code

### Flow 2: Admin (Demo)
1. Vào /login
2. Click "Admin Demo"
3. Tự động vào /admin
4. Test các chức năng CRUD

---

## 📱 Responsive Test
- [ ] Mobile (< 640px)
- [ ] Tablet (640px - 1024px)
- [ ] Desktop (> 1024px)

---

## ⚠️ Known Issues
- Backend cần MongoDB để hoạt động đầy đủ
- Demo mode chỉ lưu trong localStorage
- VietQR dùng số tài khoản mẫu (cần thay đổi)
