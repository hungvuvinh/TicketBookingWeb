import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Alert from "../components/Alert.jsx";
import Modal from "../components/Modal.jsx";
import Navbar from "../components/Navbar.jsx";

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { order, payment } = location.state || {};

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Nếu không có order/payment data, redirect
  if (!order || !payment) {
    return (
      <main className="min-h-screen animate-rise-up text-blush-900">
        <Navbar tagline="Thanh toán">
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={() => navigate("/customer")}
          >
            Quay lại
          </button>
        </Navbar>
        <div className="mx-auto max-w-2xl px-4 py-8">
          <Alert type="error">
            Không tìm thấy thông tin đơn hàng. Vui lòng quay lại và thử lại.
          </Alert>
        </div>
      </main>
    );
  }

  const ticketsCount = order.tickets?.length || 0;
  const totalAmount = payment.amount || 0;
  const tripInfo = order.trip;

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
    if (method === "cod") {
      // COD - xác nhận ngay
      handleConfirmPayment("cod");
    } else {
      // VNPay - show confirm modal
      setShowConfirmModal(true);
    }
  };

  const handleConfirmPayment = async (method) => {
    setLoading(true);
    setError("");

    try {
      if (method === "vnpay") {
        // Gọi API tạo VNPay payment URL
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/payments/vnpay/create`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: order._id,
              paymentId: payment._id,
              amount: totalAmount,
              bankCode: "", // User có thể chọn ngân hàng (optional)
              ipAddress: await getClientIp(),
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Không thể tạo link thanh toán VNPay");
        }

        const data = await response.json();
        if (data.data?.paymentUrl) {
          // Redirect đến VNPay
          window.location.href = data.data.paymentUrl;
        } else {
          throw new Error("Không nhận được link thanh toán");
        }
      } else if (method === "cod") {
        // COD - update order status to paid
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/orders/${order._id}/confirm`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentMethod: "cod" }),
          }
        );

        if (!response.ok) {
          throw new Error("Lỗi khi xác nhận đơn hàng");
        }

        // Redirect đến payment success page
        navigate("/payment-success", {
          state: {
            orderId: order._id,
            method: "cod",
            message: "Đặt vé thành công! Vui lòng thanh toán tại quầy."
          }
        });
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(err.message || "Có lỗi xảy ra. Vui lòng thử lại.");
      setLoading(false);
    }

    setShowConfirmModal(false);
  };

  const getClientIp = async () => {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip || "127.0.0.1";
    } catch {
      return "127.0.0.1";
    }
  };

  return (
    <main className="min-h-screen animate-rise-up text-blush-900">
      <Navbar tagline="Chọn phương thức thanh toán">
        <button 
          type="button" 
          className="btn-ghost" 
          onClick={() => navigate(-1)}
        >
          Quay lại
        </button>
      </Navbar>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
        {/* Order Summary */}
        <section className="card-panel slide-in-down">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-blush-500">
            Tóm tắt đơn hàng
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold text-blush-900">
            {tripInfo?.origin || "Điểm đi"} → {tripInfo?.destination || "Điểm đến"}
          </h1>
          <div className="mt-4 space-y-2 rounded-2xl bg-blush-50/50 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-blush-600">Số vé:</span>
              <span className="font-semibold text-blush-900">{ticketsCount} vé</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-blush-600">Giá vé:</span>
              <span className="font-semibold text-blush-900">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(totalAmount / ticketsCount || 0)}
              </span>
            </div>
            <div className="border-t border-blush-200 pt-2 flex justify-between text-base font-bold">
              <span>Tổng cộng:</span>
              <span className="text-emerald-600">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(totalAmount)}
              </span>
            </div>
          </div>
        </section>

        {/* Error Alert */}
        {error && <Alert type="error">{error}</Alert>}

        {/* Payment Methods */}
        <section className="card-panel space-y-4">
          <h2 className="font-display text-xl font-bold text-blush-900">
            Chọn phương thức thanh toán
          </h2>

          {/* VNPay Option */}
          <button
            type="button"
            onClick={() => handlePaymentMethodSelect("vnpay")}
            disabled={loading}
            className={`group card-hover relative w-full rounded-3xl border-2 px-6 py-5 text-left transition-smooth-fast ${
              selectedPaymentMethod === "vnpay"
                ? "border-blush-400 bg-gradient-to-r from-blush-50 to-white shadow-lg"
                : "border-blush-100 bg-white hover:border-blush-300"
            } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-blush-900">VNPay</h3>
                <p className="mt-1 text-sm text-blush-600">
                  Thanh toán online qua VNPay - Nhanh chóng & bảo mật
                </p>
              </div>
              <div className={`ml-4 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-smooth-fast ${
                selectedPaymentMethod === "vnpay"
                  ? "border-blush-400 bg-blush-400"
                  : "border-blush-200 group-hover:border-blush-300"
              }`}>
                {selectedPaymentMethod === "vnpay" && (
                  <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </div>
          </button>

          {/* COD Option */}
          <button
            type="button"
            onClick={() => handlePaymentMethodSelect("cod")}
            disabled={loading}
            className={`group card-hover relative w-full rounded-3xl border-2 px-6 py-5 text-left transition-smooth-fast ${
              selectedPaymentMethod === "cod"
                ? "border-blush-400 bg-gradient-to-r from-blush-50 to-white shadow-lg"
                : "border-blush-100 bg-white hover:border-blush-300"
            } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-blush-900">Thanh toán tại chỗ (COD)</h3>
                <p className="mt-1 text-sm text-blush-600">
                  Thanh toán khi nhận dịch vụ - Tiện lợi & linh hoạt
                </p>
              </div>
              <div className={`ml-4 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-smooth-fast ${
                selectedPaymentMethod === "cod"
                  ? "border-blush-400 bg-blush-400"
                  : "border-blush-200 group-hover:border-blush-300"
              }`}>
                {selectedPaymentMethod === "cod" && (
                  <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </div>
          </button>
        </section>

        {/* Info */}
        <section className="rounded-2xl bg-emerald-50/80 border border-emerald-200/80 px-5 py-4">
          <p className="text-sm text-emerald-800">
            <span className="font-semibold">Lưu ý:</span> Sau khi chọn phương thức thanh toán, bạn sẽ được hướng dẫn hoàn tất giao dịch.
            Vé của bạn sẽ được xác nhận ngay khi thanh toán thành công.
          </p>
        </section>
      </div>

      {/* Confirm Modal */}
      <Modal
        open={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Xác nhận thanh toán"
        subtitle="VNPay"
      >
        <div className="space-y-4">
          <p className="text-blush-700">
            Bạn sẽ được chuyển hướng đến trang thanh toán VNPay. Hãy đảm bảo kết nối internet ổn định.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              className="btn-secondary flex-1"
              onClick={() => setShowConfirmModal(false)}
              disabled={loading}
            >
              Huỷ
            </button>
            <button
              type="button"
              className="btn-primary flex-1"
              onClick={() => handleConfirmPayment("vnpay")}
              disabled={loading}
            >
              {loading ? "Đang xử lý..." : "Tiếp tục thanh toán"}
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
