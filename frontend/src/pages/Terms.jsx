import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileContract, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

export default function Terms() {
  const sections = [
    {
      title: '1. Giới thiệu',
      content: `Chào mừng bạn đến với AI Store. Bằng việc truy cập và sử dụng website của chúng tôi, bạn đồng ý tuân thủ các điều khoản và điều kiện được nêu dưới đây. Vui lòng đọc kỹ trước khi sử dụng dịch vụ.`
    },
    {
      title: '2. Định nghĩa',
      content: `• "Chúng tôi", "Shop" đề cập đến AI Store và đội ngũ vận hành.
• "Bạn", "Khách hàng" đề cập đến người sử dụng dịch vụ.
• "Sản phẩm" đề cập đến các tài khoản AI được bán trên website.
• "Dịch vụ" đề cập đến việc cung cấp tài khoản AI và các dịch vụ liên quan.`
    },
    {
      title: '3. Điều kiện sử dụng',
      content: `• Bạn phải từ 18 tuổi trở lên hoặc có sự đồng ý của phụ huynh.
• Thông tin đăng ký phải chính xác và đầy đủ.
• Bạn chịu trách nhiệm bảo mật thông tin tài khoản của mình.
• Không được sử dụng dịch vụ cho mục đích bất hợp pháp.
• Không được chia sẻ, bán lại tài khoản đã mua cho bên thứ ba.`
    },
    {
      title: '4. Sản phẩm và giá cả',
      content: `• Giá sản phẩm được niêm yết bằng VNĐ và có thể thay đổi mà không cần thông báo trước.
• Thông tin sản phẩm được mô tả chính xác nhất có thể.
• Số lượng sản phẩm có hạn và được cập nhật theo thời gian thực.
• Chúng tôi có quyền từ chối đơn hàng nếu phát hiện gian lận.`
    },
    {
      title: '5. Thanh toán',
      content: `• Chấp nhận thanh toán qua chuyển khoản ngân hàng (VietQR) và số dư xu.
• Đơn hàng được xác nhận sau khi thanh toán thành công.
• Không hoàn tiền sau khi đã giao tài khoản, trừ trường hợp lỗi từ phía chúng tôi.
• Thời gian giữ chỗ sản phẩm là 15 phút kể từ khi tạo đơn.`
    },
    {
      title: '6. Bảo hành và đổi trả',
      content: `• Bảo hành 7-30 ngày tùy theo sản phẩm.
• Đổi mới nếu tài khoản không hoạt động do lỗi từ phía chúng tôi.
• Không bảo hành nếu lỗi do người dùng (quên mật khẩu, vi phạm chính sách, v.v.).
• Xem chi tiết tại trang Chính sách bảo hành.`
    },
    {
      title: '7. Quyền sở hữu trí tuệ',
      content: `• Nội dung website thuộc quyền sở hữu của AI Store.
• Các thương hiệu như ChatGPT, Claude, Midjourney thuộc về chủ sở hữu tương ứng.
• Chúng tôi là đại lý phân phối, không liên kết trực tiếp với các nhà cung cấp.`
    },
    {
      title: '8. Giới hạn trách nhiệm',
      content: `• Chúng tôi không chịu trách nhiệm về việc sử dụng tài khoản sau khi giao.
• Không chịu trách nhiệm nếu tài khoản bị khóa do vi phạm chính sách nhà cung cấp.
• Không chịu trách nhiệm về thiệt hại gián tiếp phát sinh từ việc sử dụng dịch vụ.`
    },
    {
      title: '9. Bảo mật thông tin',
      content: `• Thông tin cá nhân được bảo mật theo quy định pháp luật.
• Không chia sẻ thông tin khách hàng cho bên thứ ba.
• Mật khẩu được mã hóa và lưu trữ an toàn.
• Xem chi tiết tại Chính sách bảo mật.`
    },
    {
      title: '10. Thay đổi điều khoản',
      content: `• Chúng tôi có quyền cập nhật điều khoản bất cứ lúc nào.
• Thay đổi có hiệu lực ngay khi đăng tải trên website.
• Việc tiếp tục sử dụng dịch vụ đồng nghĩa với việc chấp nhận điều khoản mới.`
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <FontAwesomeIcon icon={faFileContract} className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">Điều khoản sử dụng</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {sections.map((section, index) => (
              <div key={index} className="p-6 sm:p-8">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4">{section.title}</h2>
                <div className="text-slate-600 text-sm sm:text-base whitespace-pre-line leading-relaxed">
                  {section.content}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agreement */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <FontAwesomeIcon icon={faCheckCircle} className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-800 mb-2">Xác nhận đồng ý</h3>
              <p className="text-sm text-green-700">
                Bằng việc sử dụng dịch vụ của AI Store, bạn xác nhận đã đọc, hiểu và đồng ý với tất cả các điều khoản trên.
              </p>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="mt-8 text-center">
          <p className="text-slate-600 mb-4">Xem thêm:</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/warranty" className="text-purple-600 hover:underline">Chính sách bảo hành</Link>
            <span className="text-slate-300">|</span>
            <Link to="/faq" className="text-purple-600 hover:underline">Câu hỏi thường gặp</Link>
            <span className="text-slate-300">|</span>
            <Link to="/guide" className="text-purple-600 hover:underline">Hướng dẫn mua hàng</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
