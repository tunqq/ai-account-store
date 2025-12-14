import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faEye, faEyeSlash, faArrowRight, faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const { login, demoLogin, loading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('Vui lòng điền đầy đủ thông tin'); return; }

    try {
      const data = await login(form.email, form.password);
      toast.success('Đăng nhập thành công!', { icon: '👋' });
      navigate(data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      const message = err.response?.data?.message || 'Không thể kết nối server. Thử demo login.';
      setError(message);
      toast.error(message);
    }
  };

  const handleDemoLogin = (role) => {
    demoLogin(role);
    toast.success(`Đăng nhập demo với ${role}!`, { icon: '🎉' });
    navigate(role === 'admin' ? '/admin' : '/');
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 bg-white">
        <div className="w-full max-w-md">
          <Link to="/" className="block mb-6 sm:mb-10">
            <img src="/1.png" alt="AI-ZONE SHOP" className="h-14 sm:h-20 w-auto mx-auto drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]" />
          </Link>

          <div className="mb-6 sm:mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Chào mừng trở lại!</h1>
            <p className="text-slate-500 text-sm sm:text-base">Đăng nhập để tiếp tục mua sắm</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <FontAwesomeIcon icon={faCircleExclamation} className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
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
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500" />
                <span className="ml-2 text-xs sm:text-sm text-slate-600">Ghi nhớ đăng nhập</span>
              </label>
              <a href="#" className="text-xs sm:text-sm text-purple-600 hover:text-purple-700 font-medium">Quên mật khẩu?</a>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base">
              {loading ? <div className="w-5 sm:w-6 h-5 sm:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (
                <>Đăng nhập <FontAwesomeIcon icon={faArrowRight} className="ml-2" /></>
              )}
            </button>
          </form>

          <p className="text-center text-slate-500 mt-6 sm:mt-8 text-sm sm:text-base">
            Chưa có tài khoản? <Link to="/register" className="text-purple-600 font-semibold hover:text-purple-700">Đăng ký ngay</Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-purple-600 via-pink-600 to-purple-800 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl"></div>
        
        <div className="relative text-center text-white max-w-md">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-8">
            <span className="text-4xl font-bold">AI</span>
          </div>
          <h2 className="text-3xl font-bold mb-4">Tài khoản AI Premium</h2>
          <p className="text-white/80 text-lg leading-relaxed">Truy cập ChatGPT Plus, Claude Pro, Midjourney và nhiều công cụ AI khác với giá tốt nhất thị trường.</p>
          
          <div className="flex justify-center gap-8 mt-10">
            <div><div className="text-3xl font-bold">10K+</div><div className="text-white/60 text-sm">Khách hàng</div></div>
            <div className="w-px bg-white/20"></div>
            <div><div className="text-3xl font-bold">50K+</div><div className="text-white/60 text-sm">Đơn hàng</div></div>
            <div className="w-px bg-white/20"></div>
            <div><div className="text-3xl font-bold">99%</div><div className="text-white/60 text-sm">Hài lòng</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
