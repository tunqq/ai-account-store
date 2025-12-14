import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faCreditCard, faCheckCircle, faQuestionCircle, faArrowRight } from '@fortawesome/free-solid-svg-icons';

export default function Guide() {
  const steps = [
    {
      icon: faShoppingCart,
      title: '1. Chọn sản phẩm',
      description: 'Duyệt qua danh sách sản phẩm, chọn tài khoản AI phù hợp với nhu cầu của bạn.',
      details: [
        'Xem chi tiết sản phẩm, tính năng và giá cả',
        'Kiểm tra số lượng còn hàng',
        'Chọn số lượng muốn mua (tối đa 10/lần)'
      ]
    },
    {
      icon: faCreditCard,
      title: '2. Thanh toán',
      description: 'Chọn phương thức thanh toán phù hợp và hoàn tất giao dịch.',
      details: [
        'Quét mã QR VietQR để chuyển khoản ngân hàng',
        'Hoặc thanh toán bằng số dư xu trong tài khoản',
        'Nhập đúng nội dung chuyển khoản để xác nhận tự động'
      ]
    },
    {
      icon: faCheckCircle,
      title: '3. Nhận tài khoản',
      description: 'Sau khi thanh toán thành công, bạn sẽ nhận được thông tin tài khoản ngay lập tức.',
      details: [
        'Thông tin tài khoản hiển thị ngay trên màn hình',
        'Đồng thời lưu trong mục "Đơn hàng của tôi"',
        'Đổi mật khẩu ngay sau khi nhận để bảo mật'
      ]
    }
  ];

  const paymentMethods = [
    { name: 'VietQR', desc: 'Chuyển khoản qua mã QR - Xác nhận tự động trong 1-5 phút' },
    { name: 'Số dư xu', desc: 'Thanh toán bằng xu đã nạp - Xác nhận ngay lập tức' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">Hướng dẫn mua hàng</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Chỉ với 3 bước đơn giản, bạn có thể sở hữu tài khoản AI Premium ngay lập tức
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-8 mb-12">
          {steps.map((step, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
              <div className="flex items-start gap-4 sm:gap-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <FontAwesomeIcon icon={step.icon} className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">{step.title}</h2>
                  <p className="text-slate-600 mb-4">{step.description}</p>
                  <ul className="space-y-2">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-600">
                        <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3 text-purple-500 mt-1.5 flex-shrink-0" />
                        <span className="text-sm sm:text-base">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6">Phương thức thanh toán</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {paymentMethods.map((method, index) => (
              <div key={index} className="p-4 bg-slate-50 rounded-xl">
                <h3 className="font-semibold text-slate-800 mb-1">{method.name}</h3>
                <p className="text-sm text-slate-600">{method.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Sẵn sàng mua hàng?</h2>
          <p className="mb-6 text-white/80">Khám phá các tài khoản AI Premium với giá tốt nhất</p>
          <Link to="/products" className="inline-flex items-center px-6 py-3 bg-white text-purple-600 font-semibold rounded-xl hover:shadow-lg transition-all">
            Xem sản phẩm <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
          </Link>
        </div>

        {/* Help */}
        <div className="mt-8 text-center">
          <p className="text-slate-600">
            Cần hỗ trợ? <Link to="/faq" className="text-purple-600 font-medium hover:underline">Xem câu hỏi thường gặp</Link>
            {' '}hoặc liên hệ <a href="https://zalo.me/0352772640" target="_blank" rel="noopener noreferrer" className="text-purple-600 font-medium hover:underline">Zalo hỗ trợ</a>
          </p>
        </div>
      </div>
    </div>
  );
}
