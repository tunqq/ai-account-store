import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faLock, faEye, faEyeSlash, faArrowRight, faCheck, faCircleExclamation, faPhone } from '@fortawesome/free-solid-svg-icons';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const { register, loading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', agree: false });

  // Validate password theo yêu cầu backend
  const validatePassword = (password) => {
    const errors = [];
    if (!password || password.length < 8) errors.push('Ít nhất 8 ký tự');
    if (!/[a-z]/.test(password)) errors.push('Có chữ thường');
    if (!/[A-Z]/.test(password)) errors.push('Có chữ hoa');
    if (!/[0-9]/.test(password)) errors.push('Có số');
    return { isValid: errors.length === 0, errors };
  };

  const passwordStrength = () => {
    const { password } = form;
    if (!password) return { level: 0, text: '', color: '', errors: [] };
    
    const validation = validatePassword(password);
    const passedChecks = 4 - validation.errors.length;
    
    if (passedChecks <= 1) return { level: 1, text: 'Yếu', color: 'bg-red-500', errors: validation.errors };
    if (passedChecks <= 3) return { level: 2, text: 'Trung bình', color: 'bg-yellow-500', errors: validation.errors };
    return { level: 3, text: 'Mạnh', color: 'bg-green-500', errors: [] };
  };

  // Validate phone VN - đúng đầu số Việt Nam
  const validatePhoneVN = (phone) => {
    if (!phone) return false;
    const cleanPhone = phone.replace(/\s/g, '');
    // Đầu số VN: Viettel (03x, 09x, 086), Vina (08x, 091, 094), Mobi (07x, 090, 093), 
    // Vietnamobile (05x, 092), Gmobile (059, 099), Itelecom (087)
    const phoneRegex = /^(03[2-9]|05[2689]|07[06-9]|08[1-689]|09[0-46-9])[0-9]{7}$/;
    return phoneRegex.test(cleanPhone);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.phone || !form.password) { setError('Vui lòng điền đầy đủ thông tin'); return; }
    
    // Validate phone
    if (!validatePhoneVN(form.phone)) {
      setError('Số điện thoại không hợp lệ. Vui lòng nhập đúng đầu số VN (VD: 0912345678)');
      return;
    }
    
    if (form.password !== form.confirmPassword) { setError('Mật khẩu xác nhận không khớp'); return; }
    
    // Validate password strength
    const passwordValidation = validatePassword(form.password);
    if (!passwordValidation.isValid) {
      setError('Mật khẩu cần: ' + passwordValidation.errors.join(', '));
      return;
    }
    
    if (!form.agree) { setError('Vui lòng đồng ý với điều khoản sử dụng'); return; }

    try {
      await register(form.name, form.email, form.phone, form.password);
      toast.success('Đăng ký thành công!', { icon: '🎉' });
      navigate('/');
    } catch (err) {
      const message = err.response?.data?.message || 'Không thể kết nối server. Thử demo.';
      setError(message);
      toast.error(message);
    }
  };

  const strength = passwordStrength();

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        <div className="absolute top-20 right-20 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        
        <div className="relative text-white max-w-lg">
          <h2 className="text-4xl font-bold mb-6">Tham gia cộng đồng AI-ZONE SHOP</h2>
          <p className="text-white/70 text-lg mb-10 leading-relaxed">Đăng ký ngay để nhận ưu đãi 10% cho đơn hàng đầu tiên và cập nhật những sản phẩm AI mới nhất.</p>
          
          <div className="space-y-4">
            {['Giảm 10% đơn hàng đầu tiên', 'Thông báo sản phẩm mới & khuyến mãi', 'Hỗ trợ ưu tiên 24/7', 'Tích điểm đổi quà'].map((benefit, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon icon={faCheck} className="w-3 h-3 text-green-400" />
                </div>
                <span className="text-white/80">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 bg-white">
        <div className="w-full max-w-md">
          <Link to="/" className="block mb-6 sm:mb-10">
            <img src="/1.png" alt="AI-ZONE SHOP" className="h-14 sm:h-20 w-auto mx-auto drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]" />
          </Link>

          <div className="mb-6 sm:mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Tạo tài khoản mới</h1>
            <p className="text-slate-500 text-sm sm:text-base">Đăng ký để bắt đầu mua sắm</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <FontAwesomeIcon icon={faCircleExclamation} className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">Họ tên</label>
              <div className="relative">
                <FontAwesomeIcon icon={faUser} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 sm:w-5 h-4 sm:h-5" />
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-sm sm:text-base"
                  placeholder="Nguyễn Văn A" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">Email</label>
              <div className="relative">
                <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 sm:w-5 h-4 sm:h-5" />
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-sm sm:text-base"
                  placeholder="email@example.com" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">Số điện thoại <span className="text-red-500">*</span></label>
              <div className="relative">
                <FontAwesomeIcon icon={faPhone} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 sm:w-5 h-4 sm:h-5" />
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-sm sm:text-base"
                  placeholder="0912345678" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">Mật khẩu</label>
              <div className="relative">
                <FontAwesomeIcon icon={faLock} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 sm:w-5 h-4 sm:h-5" />
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-sm sm:text-base"
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="w-4 sm:w-5 h-4 sm:h-5" />
                </button>
              </div>
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3].map(level => (
                      <div key={level} className={`h-1 flex-1 rounded-full ${level <= strength.level ? strength.color : 'bg-slate-200'}`}></div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${strength.level === 3 ? 'text-green-600' : strength.level === 2 ? 'text-yellow-600' : 'text-red-600'}`}>{strength.text}</span>
                    {strength.errors.length > 0 && (
                      <span className="text-xs text-slate-500">Cần: {strength.errors.join(', ')}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">Xác nhận mật khẩu</label>
              <div className="relative">
                <FontAwesomeIcon icon={faLock} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 sm:w-5 h-4 sm:h-5" />
                <input type={showPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className={`w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-sm sm:text-base ${
                    form.confirmPassword && form.confirmPassword !== form.password ? 'border-red-300 bg-red-50' : 'border-slate-200'
                  }`}
                  placeholder="••••••••" />
                {form.confirmPassword && form.confirmPassword === form.password && (
                  <FontAwesomeIcon icon={faCheck} className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-green-500 w-4 sm:w-5 h-4 sm:h-5" />
                )}
              </div>
            </div>

            <label className="flex items-start space-x-2 sm:space-x-3 cursor-pointer">
              <input type="checkbox" checked={form.agree} onChange={(e) => setForm({ ...form, agree: e.target.checked })}
                className="w-4 sm:w-5 h-4 sm:h-5 text-purple-600 border-slate-300 rounded focus:ring-purple-500 mt-0.5" />
              <span className="text-xs sm:text-sm text-slate-600">
                Tôi đồng ý với <a href="#" className="text-purple-600 hover:underline">Điều khoản sử dụng</a> và <a href="#" className="text-purple-600 hover:underline">Chính sách bảo mật</a>
              </span>
            </label>

            <button type="submit" disabled={loading}
              className="w-full py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base">
              {loading ? <div className="w-5 sm:w-6 h-5 sm:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (
                <>Đăng ký <FontAwesomeIcon icon={faArrowRight} className="ml-2" /></>
              )}
            </button>
          </form>

          <p className="text-center text-slate-500 mt-6 sm:mt-8 text-sm sm:text-base">
            Đã có tài khoản? <Link to="/login" className="text-purple-600 font-semibold hover:text-purple-700">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
