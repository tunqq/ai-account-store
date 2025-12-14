import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved, faCheckCircle, faTimesCircle, faClock, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

export default function Warranty() {
  const warrantyItems = [
    { icon: faCheckCircle, text: 'Tài khoản không đăng nhập được ngay sau khi mua', covered: true },
    { icon: faCheckCircle, text: 'Tài khoản bị khóa trong thời gian bảo hành', covered: true },
    { icon: faCheckCircle, text: 'Thông tin tài khoản sai (email/password)', covered: true },
    { icon: faCheckCircle, text: 'Tài khoản hết hạn trước thời gian cam kết', covered: true },
    { icon: faTimesCircle, text: 'Khách hàng tự đổi mật khẩu rồi quên', covered: false },
    { icon: faTimesCircle, text: 'Tài khoản bị khóa do vi phạm chính sách nhà cung cấp', covered: false },
    { icon: faTimesCircle, text: 'Khách hàng chia sẻ tài khoản cho người khác', covered: false },
    { icon: faTimesCircle, text: 'Đã hết thời gian bảo hành', covered: false }
  ];

  const process = [
    { step: 1, title: 'Liên hệ hỗ trợ', desc: 'Gửi tin nhắn qua Zalo hoặc email kèm mã đơn hàng' },
    { step: 2, title: 'Xác minh', desc: 'Chúng tôi kiểm tra và xác minh vấn đề trong 1-24h' },
    { step: 3, title: 'Xử lý', desc: 'Đổi tài khoản mới hoặc hoàn xu theo chính sách' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <FontAwesomeIcon icon={faShieldHalved} className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">Chính sách bảo hành</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Cam kết bảo hành rõ ràng, minh bạch cho mọi sản phẩm
          </p>
        </div>

        {/* Warranty Period */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 sm:p-8 text-white mb-8">
          <div className="flex items-center gap-4 mb-4">
            <FontAwesomeIcon icon={faClock} className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Thời gian bảo hành: 7-30 ngày</h2>
              <p className="text-white/80">Tùy theo từng loại sản phẩm, xem chi tiết tại trang sản phẩm</p>
            </div>
          </div>
        </div>

        {/* Coverage */}
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6">Phạm vi bảo hành</h2>
          <div className="space-y-3">
            {warrantyItems.map((item, index) => (
              <div key={index} className={`flex items-start gap-3 p-3 rounded-xl ${item.covered ? 'bg-green-50' : 'bg-red-50'}`}>
                <FontAwesomeIcon 
                  icon={item.icon} 
                  className={`w-5 h-5 mt-0.5 flex-shrink-0 ${item.covered ? 'text-green-600' : 'text-red-500'}`} 
                />
                <span className={`text-sm sm:text-base ${item.covered ? 'text-green-800' : 'text-red-700'}`}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Process */}
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6">Quy trình bảo hành</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {process.map((item) => (
              <div key={item.step} className="text-center p-4 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold text-slate-800 mb-1">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <FontAwesomeIcon icon={faExclamationTriangle} className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800 mb-2">Lưu ý quan trọng</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Vui lòng đổi mật khẩu ngay sau khi nhận tài khoản</li>
                <li>• Lưu lại mã đơn hàng để tiện liên hệ bảo hành</li>
                <li>• Không chia sẻ tài khoản cho người khác</li>
                <li>• Liên hệ hỗ trợ trong vòng 24h nếu gặp vấn đề</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="text-center bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Cần hỗ trợ bảo hành?</h2>
          <p className="text-slate-600 mb-6">Liên hệ ngay để được hỗ trợ nhanh nhất</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://zalo.me/0352772640" target="_blank" rel="noopener noreferrer"
              className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors">
              Chat Zalo
            </a>
            <Link to="/faq" className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors">
              Xem FAQ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
