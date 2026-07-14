import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Alert from "../components/Alert.jsx";
import Navbar from "../components/Navbar.jsx";

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId, method, message } = location.state || {};
  
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!orderId) {
          throw new Error("Không tìm thấy thông tin đơn hàng");
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/orders/${orderId}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!response.ok) {
          throw new Error("Không thể lấy thông tin đơn hàng");
        }

        const data = await response.json();
        setOrderData(data.data);
      } catch (err) {
        console.error("Fetch order error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <main className="min-h-screen animate-rise-up text-blush-900">
        <Navbar tagline="Xác nhận thành công">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => navigate("/customer")}
          >
            Về trang chủ
          </button>
        </Navbar>
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="card-panel flex flex-col items-center justify-center py-12 gap-4">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 animate-spin">
                <div className="h-full w-full rounded-full border-4 border-blush-200 border-t-blush-500" />
              </div>
            </div>
            <p className="text-lg font-semibold text-blush-700">
              Đang tải thông tin đơn hàng...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen animate-rise-up text-blush-900">
        <Navbar tagline="Lỗi">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => navigate("/customer")}
          >
            Về trang chủ
          </button>
        </Navbar>
        <div className="mx-auto max-w-2xl px-4 py-8">
          <Alert type="error">{error}</Alert>
        </div>
      </main>
    );
  }

  const ticketsCount = orderData?.tickets?.length || 0;
  const tripInfo = orderData?.trip;

  return (
    <main className="min-h-screen animate-rise-up text-blush-900">
      <Navbar tagline="Xác nhận thành công">
        <button
          type="button"
          className="btn-secondary hidden sm:inline-flex"
          onClick={() => navigate("/tickets")}
        >
          Xem vé của tôi
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => navigate("/customer")}
        >
          Về trang chủ
        </button>
      </Navbar>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
        {/* Success Message */}
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
              Đặt vé thành công!
            </h1>
            {message && <Alert type="success">{message}</Alert>}
          </div>
        </section>

        {/* Order Details */}
        {orderData && (
          <section className="card-panel">
            <h2 className="font-display text-lg font-bold text-blush-900 mb-4">
              Thông tin đơn hàng
            </h2>
            <div className="space-y-4">
              {/* Trip Info */}
              <div className="rounded-2xl bg-blush-50/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blush-500">
                  Tuyến xe
                </p>
                <h3 className="mt-2 text-lg font-bold text-blush-900">
                  {tripInfo?.origin || "Điểm đi"} → {tripInfo?.destination || "Điểm đến"}
                </h3>
                <p className="mt-2 text-sm text-blush-600">
                  Khởi hành:{" "}
                  {tripInfo?.departure_time
                    ? new Date(tripInfo.departure_time).toLocaleString("vi-VN")
                    : "N/A"}
                </p>
              </div>

              {/* Tickets Info */}
              <div className="rounded-2xl bg-blush-50/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blush-500">
                  Vé
                </p>
                <div className="mt-2 flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-blush-900">{ticketsCount}</p>
                    <p className="text-sm text-blush-600">vé {method === "cod" ? "COD" : "VNPay"}</p>
                  </div>
                  <p className="text-xs font-mono text-blush-600">
                    Mã đơn: {orderData._id}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="rounded-2xl bg-emerald-50/50 border border-emerald-200/80 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-emerald-900">Trạng thái:</p>
                  <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 capitalize">
                    {orderData.status === "pending"
                      ? "Chờ thanh toán"
                      : orderData.status === "paid"
                      ? "Đã thanh toán"
                      : orderData.status}
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Payment Method Info */}
        {method === "cod" && (
          <section className="rounded-2xl bg-amber-50/80 border border-amber-200/80 px-5 py-4">
            <p className="text-sm text-amber-800">
              <span className="font-semibold">Thanh toán tại chỗ (COD):</span> Vui lòng thanh toán tiền vé khi nhân viên thu tiền. Thực hiện thanh toán đầy đủ để tránh các rắc rối không cần thiết.
            </p>
          </section>
        )}

        {/* Info */}
        <section className="rounded-2xl bg-blue-50/80 border border-blue-200/80 px-5 py-4">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">ℹ️ Lưu ý:</span> Bạn sẽ nhận được email/SMS xác nhận với chi tiết vé. Hãy đổi giờ sớm 30 phút trước giờ khởi hành.
          </p>
        </section>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="btn-secondary flex-1"
            onClick={() => navigate("/customer")}
          >
            Đặt vé khác
          </button>
          <button
            type="button"
            className="btn-primary flex-1"
            onClick={() => navigate("/bookings")}
          >
            Xem đơn hàng của tôi
          </button>
        </div>
      </div>
    </main>
  );
}
