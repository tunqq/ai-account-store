import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      category: 'Mua hàng',
      questions: [
        {
          q: 'Làm sao để mua tài khoản?',
          a: 'Bạn chỉ cần chọn sản phẩm, nhấn "Mua ngay", quét mã QR để thanh toán. Sau khi thanh toán thành công, thông tin tài khoản sẽ hiển thị ngay trên màn hình.'
        },
        {
          q: 'Tôi có cần đăng ký tài khoản không?',
          a: 'Không bắt buộc. Bạn có thể mua hàng mà không cần đăng ký. Tuy nhiên, nếu đăng ký, bạn sẽ dễ dàng quản lý đơn hàng và sử dụng tính năng nạp xu.'
        },
        {
          q: 'Thanh toán bằng những hình thức nào?',
          a: 'Chúng tôi hỗ trợ: 1) Chuyển khoản ngân hàng qua VietQR (tự động xác nhận), 2) Thanh toán bằng số dư xu trong tài khoản.'
        },
        {
          q: 'Sau khi thanh toán bao lâu thì nhận được tài khoản?',
          a: 'Với VietQR: 1-5 phút sau khi chuyển khoản thành công. Với số dư xu: Nhận ngay lập tức.'
        }
      ]
    },
    {
      category: 'Tài khoản',
      questions: [
        {
          q: 'Tài khoản có thời hạn sử dụng không?',
          a: 'Có, mỗi loại tài khoản có thời hạn khác nhau (thường 1 tháng, 3 tháng, 1 năm). Thông tin chi tiết được ghi rõ tại trang sản phẩm.'
        },
        {
          q: 'Tôi có thể đổi mật khẩu tài khoản không?',
          a: 'Có, bạn nên đổi mật khẩu ngay sau khi nhận tài khoản để bảo mật. Tuy nhiên, hãy lưu lại mật khẩu mới vì chúng tôi không hỗ trợ khôi phục nếu bạn quên.'
        },
        {
          q: 'Tài khoản có thể dùng trên bao nhiêu thiết bị?',
          a: 'Tùy theo chính sách của từng nhà cung cấp (ChatGPT, Claude, v.v.). Thông thường có thể đăng nhập trên nhiều thiết bị nhưng không nên dùng đồng thời.'
        }
      ]
    },
    {
      category: 'Bảo hành',
      questions: [
        {
          q: 'Chính sách bảo hành như thế nào?',
          a: 'Bảo hành 7-30 ngày tùy sản phẩm. Đổi mới nếu tài khoản không đăng nhập được hoặc bị khóa trong thời gian bảo hành (không do lỗi người dùng).'
        },
        {
          q: 'Làm sao để yêu cầu bảo hành?',
          a: 'Liên hệ qua Zalo hoặc email, cung cấp mã đơn hàng và mô tả vấn đề. Chúng tôi sẽ xác minh và xử lý trong 1-24h.'
        },
        {
          q: 'Trường hợp nào không được bảo hành?',
          a: 'Không bảo hành nếu: Tự đổi mật khẩu rồi quên, chia sẻ tài khoản cho người khác, vi phạm chính sách nhà cung cấp, hoặc đã hết thời gian bảo hành.'
        }
      ]
    },
    {
      category: 'Xu & Nạp tiền',
      questions: [
        {
          q: 'Xu là gì?',
          a: 'Xu là số dư trong tài khoản của bạn, có thể dùng để thanh toán đơn hàng. 1 xu = 1 VNĐ.'
        },
        {
          q: 'Làm sao để nạp xu?',
          a: 'Vào mục "Ví xu", chọn số tiền muốn nạp, quét mã QR để chuyển khoản. Xu sẽ được cộng tự động sau 1-5 phút.'
        },
        {
          q: 'Xu có thể rút ra tiền mặt không?',
          a: 'Không, xu chỉ dùng để thanh toán trên hệ thống. Tuy nhiên, nếu đơn hàng bị hủy, xu sẽ được hoàn lại vào tài khoản.'
        }
      ]
    }
  ];

  const toggleQuestion = (categoryIndex, questionIndex) => {
    const key = `${categoryIndex}-${questionIndex}`;
    setOpenIndex(openIndex === key ? null : key);
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <FontAwesomeIcon icon={faQuestionCircle} className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">Câu hỏi thường gặp</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Tìm câu trả lời nhanh cho các thắc mắc phổ biến
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {faqs.map((category, catIndex) => (
            <div key={catIndex} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                <h2 className="text-lg font-bold text-white">{category.category}</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {category.questions.map((item, qIndex) => {
                  const isOpen = openIndex === `${catIndex}-${qIndex}`;
                  return (
                    <div key={qIndex}>
                      <button
                        onClick={() => toggleQuestion(catIndex, qIndex)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                      >
                        <span className="font-medium text-slate-800 pr-4">{item.q}</span>
                        <FontAwesomeIcon 
                          icon={faChevronDown} 
                          className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
                        />
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-4">
                          <p className="text-slate-600 text-sm sm:text-base bg-slate-50 p-4 rounded-xl">
                            {item.a}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Still have questions */}
        <div className="mt-12 text-center bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Vẫn còn thắc mắc?</h2>
          <p className="text-slate-600 mb-6">Liên hệ với chúng tôi để được hỗ trợ trực tiếp</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://zalo.me/0352772640" target="_blank" rel="noopener noreferrer"
              className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors">
              Chat Zalo
            </a>
            <Link to="/guide" className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors">
              Hướng dẫn mua hàng
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
