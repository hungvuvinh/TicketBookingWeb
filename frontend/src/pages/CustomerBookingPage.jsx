import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "../components/Alert.jsx";
import Modal from "../components/Modal.jsx";
import Navbar from "../components/Navbar.jsx";

export default function CustomerBookingPage({
  session,
  handleLogout,
  handleBackToSearch,
  origin,
  date,
  destination,
  searched,
  trips,
  selectedTrip,
  loadSeats,
  loadingSeats,
  seats,
  selectedSeats,
  toggleSeat,
  customerName,
  setCustomerName,
  phoneNumber,
  setPhoneNumber,
  email,
  setEmail,
  submitBooking,
  submitting,
  totalAmount,
  error,
  successMessage,
  setError,
  setSuccessMessage,
  formatMoney,
}) {
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [localError, setLocalError] = useState("");
  const isCustomer = session?.role === "customer";

  const handleTripCheckout = (event) => {
    event.preventDefault();
    setLocalError("");

    if (!selectedTrip) {
      setLocalError("Vui lòng chọn một chuyến xe.");
      return;
    }

    if (selectedSeats.length === 0) {
      setLocalError("Vui lòng chọn ít nhất 1 ghế.");
      return;
    }

    if (!customerName.trim() || !phoneNumber.trim()) {
      setLocalError("Vui lòng nhập tên và số điện thoại.");
      return;
    }

    setShowPaymentModal(true);
  };

  const handleSelectTrip = (trip) => {
    if (!isCustomer) {
      setLocalError("Vui lòng đăng nhập để chọn chuyến và ghế.");
      return;
    }
    loadSeats(trip);
  };

  const confirmPayment = async () => {
    setLocalError("");
    const result = await submitBooking("vnpay");
    
    if (!result) {
      return;
    }

    navigate("/payment", {
      state: {
        order: result.order,
        payment: result.payment,
      },
    });

    setShowPaymentModal(false);
  };

  const displayError = localError || error;

  return (
    <main className="min-h-screen animate-rise-up text-blush-900">
      <Navbar tagline="Đặt vé & thanh toán">
        <button type="button" className="btn-secondary" onClick={handleBackToSearch}>
          Tìm tuyến khác
        </button>
        {session ? (
          <>
            <button type="button" className="btn-secondary hidden sm:inline-flex" onClick={() => navigate("/tickets")}>
              Xem vé của tôi
            </button>
            <button type="button" className="btn-ghost" onClick={handleLogout}>
              Đăng xuất
            </button>
          </>
        ) : null}
      </Navbar>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="card-panel slide-in-down">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-blush-500">Hành trình của bạn</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-blush-900 sm:text-4xl">
            {origin || "Điểm đi"} → {destination || "Điểm đến"}
          </h1>
          <p className="mt-2 text-blush-600">Ngày khởi hành: {date || "Chưa chọn"}</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-6">
            <section className="card-panel">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-display text-xl font-bold text-blush-900">Danh sách chuyến</h2>
                <span className="rounded-full bg-blush-100 px-3 py-1 text-xs font-semibold text-blush-600">
                  {trips.length} chuyến
                </span>
              </div>

              <div className="space-y-3">
                {searched && trips.length === 0 && (
                  <p className="rounded-2xl border border-blush-100 bg-blush-50/80 px-4 py-3 text-sm text-blush-700">
                    Chưa có chuyến nào.
                  </p>
                )}

                {trips.map((trip, index) => {
                  const active = selectedTrip?._id === trip._id;
                  return (
                    <button
                      key={trip._id}
                      type="button"
                      className={`card-hover w-full rounded-3xl border px-5 py-4 text-left transition-smooth-fast ${
                        active
                          ? "border-blush-400 bg-gradient-to-r from-blush-50 to-white shadow-md"
                          : "border-blush-100 bg-white hover:border-blush-300 hover:bg-blush-50/50"
                      }`}
                      onClick={() => handleSelectTrip(trip)}
                      style={{
                        animation: `slide-in-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.05}s both`,
                      }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="rounded-full bg-blush-100 px-3 py-1 text-xs font-semibold text-blush-600">
                            {trip.vehicle?.vehicle_type || "Xe"} • {trip.vehicle?.license_plate || "Chưa có biển số"} • {trip.vehicle?.total_seats || 0} ghế

                        </span>
                        <span className="rounded-full bg-blush-100 px-3 py-1 text-xs font-semibold text-blush-600">
                          {formatMoney(trip.vehicle?.seat_price || 0)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-blush-600">
                        {trip.departure_time
                          ? new Date(trip.departure_time).toLocaleString("vi-VN")
                          : "Chưa có giờ khởi hành"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="card-panel">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-blush-900">Sơ đồ ghế</h2>
                <span className="text-sm text-blush-500">{selectedSeats.length} ghế đã chọn</span>
              </div>

              {loadingSeats ? (
                <p className="rounded-2xl border border-blush-100 bg-blush-50/80 px-4 py-3 text-sm text-blush-700">
                  Đang tải sơ đồ ghế...
                </p>
              ) : selectedTrip ? (
                <>
                  <div className="mb-4 flex flex-wrap gap-4 text-xs text-blush-600">
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-lg border border-blush-200 bg-white" /> Trống
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-lg bg-gradient-to-br from-blush-400 to-blush-600" /> Đã chọn
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-lg bg-blush-100" /> Đã đặt
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                    {seats.map((seat) => {
                      const disabled = seat.status !== "available";
                      const selected = selectedSeats.includes(seat.seat_number);
                      return (
                        <button
                          key={seat.seat_number}
                          type="button"
                          disabled={disabled || !isCustomer}
                          className={`flex h-11 items-center justify-center rounded-xl text-xs font-semibold transition ${
                            disabled
                              ? "cursor-not-allowed bg-blush-100 text-blush-300"
                              : selected
                                ? "bg-gradient-to-br from-blush-400 to-blush-600 text-white shadow-md"
                                : "border border-blush-200 bg-white text-blush-700 hover:border-blush-400 hover:bg-blush-50"
                          }`}
                          onClick={() => toggleSeat(seat.seat_number)}
                        >
                          {seat.seat_number}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="rounded-2xl border border-blush-100 bg-blush-50/80 px-4 py-3 text-sm text-blush-700">
                  Chọn một chuyến để xem ghế trống.
                </p>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="card-panel lg:sticky lg:top-24">
              <h2 className="font-display text-xl font-bold text-blush-900">Thanh toán</h2>
              <form onSubmit={handleTripCheckout} className="mt-5 space-y-4">
                <label className="block space-y-2">
                  <span className="label-text">Họ tên</span>
                  <input
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="input-field"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="label-text">Số điện thoại</span>
                  <input
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    placeholder="09xxxxxxxx"
                    className="input-field"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="label-text">Email (tùy chọn)</span>
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="abc@email.com"
                    className="input-field"
                  />
                </label>

                <div className="rounded-2xl bg-gradient-to-br from-blush-50 to-mauve-50 p-4 text-sm text-blush-700">
                  <p className="font-semibold text-blush-800">Thanh toán online</p>
                  <p className="mt-1">Bạn sẽ chuyển sang VNPay sau khi xác nhận thông tin đặt vé</p>
                </div>

                <div className="space-y-2 rounded-2xl border border-blush-100 bg-blush-50/60 p-4 text-sm">
                  <p className="text-blush-600">
                    Ghế:{" "}
                    <span className="font-semibold text-blush-900">
                      {selectedSeats.length > 0 ? selectedSeats.join(", ") : "Chưa chọn"}
                    </span>
                  </p>
                  <p className="text-blush-600">
                    Tạm tính:{" "}
                    <span className="font-display text-lg font-bold text-blush-700">{formatMoney(totalAmount)}</span>
                  </p>
                </div>

                <button type="submit" disabled={submitting} className="btn-primary h-12 w-full">
                  {submitting ? "Đang xử lý..." : "Thanh toán"}
                </button>
              </form>
            </section>
          </aside>
        </div>

        {(displayError || successMessage) && (
          <div className="space-y-3">
            {displayError ? (
              <Alert
                type="error"
                open={Boolean(displayError)}
                onClose={() => {
                  setLocalError("");
                  setError("");
                }}
              >
                {displayError}
              </Alert>
            ) : null}
            {successMessage ? (
              <Alert type="success" open={Boolean(successMessage)} onClose={() => setSuccessMessage("")}>
                {successMessage}
              </Alert>
            ) : null}
          </div>
        )}

        <footer className="rounded-4xl border border-white/70 bg-white/60 p-5 text-center text-sm text-blush-500">
          © {new Date().getFullYear()} TicketBooking — Đặt vé trực tuyến nhanh chóng và an toàn.
        </footer>
      </div>

      <Modal
        open={showPaymentModal}
        onClose={() => !submitting && setShowPaymentModal(false)}
        title="Xác nhận thông tin đặt vé"
        subtitle="Hoàn tất đơn đặt vé"
      >
        <div className="space-y-3 rounded-2xl border border-blush-100 bg-blush-50/70 p-5 text-sm text-blush-800 mb-6">
          <p>
            <strong>Chuyến:</strong>{" "}
            {origin && destination ? `${origin} → ${destination}` : `${selectedTrip?.origin} → ${selectedTrip?.destination}`}
          </p>
          <p>
            <strong>Ghế:</strong> {selectedSeats.join(", ")}
          </p>
          <p>
            <strong>Tổng:</strong> {formatMoney(totalAmount)}
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => !submitting && setShowPaymentModal(false)}
            disabled={submitting}
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => confirmPayment()}
            disabled={submitting}
            className="btn-primary"
          >
            {submitting ? "Đang xử lý..." : "Xác nhận và thanh toán"}
          </button>
        </div>
      </Modal>
    </main>
  );
}
