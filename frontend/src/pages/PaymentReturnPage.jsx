import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Alert from "../components/Alert.jsx";
import Navbar from "../components/Navbar.jsx";

export default function PaymentReturnPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [status, setStatus] = useState("loading"); // loading, success, failed
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [message, setMessage] = useState("");
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Lấy các parameter từ VNPay callback
        const vnp_ResponseCode = searchParams.get("vnp_ResponseCode");
        const vnp_TransactionNo = searchParams.get("vnp_TransactionNo");
        const vnp_Amount = searchParams.get("vnp_Amount");
        const vnp_BankCode = searchParams.get("vnp_BankCode");
        const vnp_OrderInfo = searchParams.get("vnp_OrderInfo");
        const vnp_PayDate = searchParams.get("vnp_PayDate");

        if (!vnp_ResponseCode) {
          setStatus("failed");
          setMessage("Không nhận được phản hồi từ VNPay. Vui lòng kiểm tra và thử lại.");
          return;
        }

        // Hiển thị thông tin payment
        setPaymentInfo({
          responseCode: vnp_ResponseCode,
          transactionNo: vnp_TransactionNo,
          amount: vnp_Amount ? (parseInt(vnp_Amount) / 100).toLocaleString("vi-VN") : "0",
          bankCode: vnp_BankCode || "N/A",
          payDate: formatPayDate(vnp_PayDate),
          orderInfo: vnp_OrderInfo,
        });

        if (vnp_ResponseCode === "00") {
          // Thanh toán thành công
          setStatus("success");
          setMessage("Thanh toán VNPay thành công! Vé của bạn đã được xác nhận.");

          // Gọi API backend để cập nhật trạng thái order
          try {
            const response = await fetch(
              `${import.meta.env.VITE_API_URL}/payments/vnpay/return`,
              {
                method: "GET",
                headers: { "Content-Type": "application/json" },
              }
            );

            if (response.ok) {
              const data = await response.json();
              if (data.data) {
                setOrderData(data.data);
              }
            }
          } catch (error) {
            console.error("Error updating order:", error);
          }
        } else {
          // Thanh toán thất bại
          setStatus("failed");
          const errorMessages = {
            "01": "Giao dịch bị từ chối",
            "02": "Tài khoản VNPay bị khoá",
            "03": "Địa chỉ IP không được phép",
            "04": "Không hỗ trợ loại tiền tệ",
            "05": "Giao dịch không hợp lệ",
            "07": "Trùng lặp dữ liệu",
            "09": "Giao dịch không hợp lệ",
            "10": "Định dạng dữ liệu không đúng",
            "11": "Nhập sai mật khẩu quá 3 lần",
            "12": "Tài khoản khách hàng bị khóa",
            "13": "Sai định dạng dữ liệu",
            "99": "Lỗi không xác định",
          };
          setMessage(
            `Thanh toán thất bại: ${errorMessages[vnp_ResponseCode] || "Lỗi không xác định"}`
          );
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        setStatus("failed");
        setMessage("Có lỗi xảy ra khi xác minh thanh toán. Vui lòng liên hệ hỗ trợ.");
      }
    };

    verifyPayment();
  }, [searchParams]);

  const formatPayDate = (dateStr) => {
    if (!dateStr || dateStr.length !== 14) return dateStr;
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = dateStr.substring(8, 10);
    const minute = dateStr.substring(10, 12);
    const second = dateStr.substring(12, 14);
    return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
  };

  return (
    <main className="min-h-screen animate-rise-up text-blush-900">
      <Navbar tagline="Kết quả thanh toán">
        <button
          type="button"
          className="btn-ghost"
          onClick={() => navigate("/customer")}
        >
          Về trang chủ
        </button>
      </Navbar>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
        {/* Status Card */}
        {status === "loading" && (
          <section className="card-panel slide-in-down">
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="relative h-16 w-16">
                <div className="absolute inset-0 animate-spin">
                  <div className="h-full w-full rounded-full border-4 border-blush-200 border-t-blush-500" />
                </div>
              </div>
              <p className="text-lg font-semibold text-blush-700">
                Đang xác minh thanh toán...
              </p>
            </div>
          </section>
        )}

        {status === "success" && (
          <>
            <section className="card-panel slide-in-down">
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                  <svg
                    className="h-10 w-10 text-emerald-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h1 className="font-display text-2xl font-bold text-emerald-600">
                  Thanh toán thành công!
                </h1>
                <Alert type="success">{message}</Alert>
              </div>
            </section>

            {/* Payment Details */}
            {paymentInfo && (
              <section className="card-panel">
                <h2 className="font-display text-lg font-bold text-blush-900 mb-4">
                  Chi tiết giao dịch
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between py-3 border-b border-blush-100">
                    <span className="text-blush-600">Mã giao dịch VNPay:</span>
                    <span className="font-mono font-semibold text-blush-900">
                      {paymentInfo.transactionNo}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-blush-100">
                    <span className="text-blush-600">Mã ngân hàng:</span>
                    <span className="font-semibold text-blush-900">
                      {paymentInfo.bankCode}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-blush-100">
                    <span className="text-blush-600">Số tiền:</span>
                    <span className="font-semibold text-emerald-600">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(parseInt(paymentInfo.amount.replace(/\D/g, "")))}
                    </span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-blush-600">Thời gian giao dịch:</span>
                    <span className="font-semibold text-blush-900">
                      {paymentInfo.payDate}
                    </span>
                  </div>
                </div>
              </section>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="btn-secondary flex-1"
                onClick={() => navigate("/customer")}
              >
                Tiếp tục đặt vé
              </button>
              <button
                type="button"
                className="btn-primary flex-1"
                onClick={() => navigate("/bookings")}
              >
                Xem đơn hàng của tôi
              </button>
            </div>

            {/* Info */}
            <section className="rounded-2xl bg-emerald-50/80 border border-emerald-200/80 px-5 py-4">
              <p className="text-sm text-emerald-800">
                <span className="font-semibold">✓ Thành công:</span> Vé của bạn đã được xác nhận và sẽ gửi qua email/SMS trong vài phút.
              </p>
            </section>
          </>
        )}

        {status === "failed" && (
          <>
            <section className="card-panel slide-in-down">
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-100">
                  <svg
                    className="h-10 w-10 text-rose-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h1 className="font-display text-2xl font-bold text-rose-600">
                  Thanh toán thất bại
                </h1>
                <Alert type="error">{message}</Alert>
              </div>
            </section>

            {/* Payment Details */}
            {paymentInfo && (
              <section className="card-panel">
                <h2 className="font-display text-lg font-bold text-blush-900 mb-4">
                  Chi tiết giao dịch
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between py-3 border-b border-blush-100">
                    <span className="text-blush-600">Mã phản hồi:</span>
                    <span className="font-mono font-semibold text-rose-600">
                      {paymentInfo.responseCode}
                    </span>
                  </div>
                  {paymentInfo.transactionNo && (
                    <div className="flex justify-between py-3 border-b border-blush-100">
                      <span className="text-blush-600">Mã giao dịch VNPay:</span>
                      <span className="font-mono font-semibold text-blush-900">
                        {paymentInfo.transactionNo}
                      </span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="btn-secondary flex-1"
                onClick={() => navigate(-1)}
              >
                Quay lại
              </button>
              <button
                type="button"
                className="btn-primary flex-1"
                onClick={() => navigate("/customer")}
              >
                Thử lại
              </button>
            </div>

            {/* Info */}
            <section className="rounded-2xl bg-rose-50/80 border border-rose-200/80 px-5 py-4">
              <p className="text-sm text-rose-800">
                <span className="font-semibold">✗ Thất bại:</span> Giao dịch không thành công. Vui lòng kiểm tra tài khoản ngân hàng và thử lại, hoặc chọn phương thức thanh toán khác.
              </p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
