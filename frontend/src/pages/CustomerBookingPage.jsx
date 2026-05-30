import { useState } from "react";

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
  formatMoney,
}) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleTripCheckout = (event) => {
    event.preventDefault();

    if (!selectedTrip) {
      return;
    }

    if (selectedSeats.length === 0) {
      return;
    }

    if (!customerName.trim() || !phoneNumber.trim()) {
      return;
    }

    setShowPaymentModal(true);
  };

  const confirmPayment = async () => {
    const ok = await submitBooking();
    if (ok) {
      setShowPaymentModal(false);
    }
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <div className="brand-title">TicketBooking</div>
            <div className="brand-sub">Đặt vé nhanh — An tâm</div>
          </div>
          <nav className="top-actions">
            <button type="button" className="login-btn" onClick={handleBackToSearch}>
              Tìm tuyến khác
            </button>
            {session ? (
              <button type="button" className="login-btn" onClick={handleLogout}>
                Đăng xuất
              </button>
            ) : null}
          </nav>
        </div>
      </header>

      <section className="hero-card hero-center booking-hero">
        <div className="hero-copy">
          <p className="eyebrow">Kết quả tìm tuyến</p>
          <h1>
            {origin || "Điểm đi"} → {destination || "Điểm đến"}
          </h1>
          <p>
            Ngày khởi hành: {date || "Chưa chọn"}
          </p>
        </div>
      </section>

      <section className="panel panel-soft">
        <h2>Danh sách chuyến</h2>
        <div className="trip-list">
          {searched && trips.length === 0 && <p className="hint">Chưa có chuyến nào được hiển thị.</p>}
          {searched &&
            trips.map((trip) => (
              <button
                key={trip._id}
                type="button"
                className={selectedTrip?._id === trip._id ? "trip-card active" : "trip-card"}
                onClick={() => loadSeats(trip)}
              >
                <p className="trip-route">{trip.route?.route_name || `${trip.origin} → ${trip.destination}`}</p>
                <p>{trip.departure_time ? new Date(trip.departure_time).toLocaleString("vi-VN") : "Chưa có giờ khởi hành"}</p>
                <p>{trip.vehicle?.vehicle_name || "Xe chưa xác định"}</p>
              </button>
            ))}
        </div>
      </section>

      <section className="panel panel-soft">
        <h2>Chọn ghế</h2>
        {loadingSeats && <p className="hint">Đang tải sơ đồ ghế...</p>}
        {!loadingSeats && selectedTrip && (
          <div className="seat-grid">
            {seats.map((seat) => {
              const disabled = seat.status !== "available";
              const selected = selectedSeats.includes(seat.seat_number);

              return (
                <button
                  key={seat.seat_number}
                  type="button"
                  disabled={disabled}
                  className={`seat ${seat.status} ${selected ? "selected" : ""}`}
                  onClick={() => toggleSeat(seat.seat_number)}
                >
                  {seat.seat_number}
                </button>
              );
            })}
          </div>
        )}
        {!selectedTrip && <p className="hint">Chọn một chuyến để xem ghế.</p>}
      </section>

      <section className="panel panel-soft booking-panel">
        <h2>Thông tin thanh toán</h2>
        <form className="checkout-form" onSubmit={handleTripCheckout}>
          <label>
            Họ tên
            <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Nguyễn Văn A" />
          </label>
          <label>
            Số điện thoại
            <input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="09xxxxxxxx" />
          </label>
          <label>
            Email (tùy chọn)
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="abc@email.com" />
          </label>
          <label>
            Hình thức thanh toán
            <div>Thanh toán trực tuyến (cổng thanh toán)</div>
          </label>

          <div className="summary">
            <p>Ghế đã chọn: {selectedSeats.length > 0 ? selectedSeats.join(", ") : "Chưa chọn"}</p>
            <p>Tạm tính: {formatMoney(totalAmount)}</p>
          </div>

          <button type="submit" disabled={submitting}>
            {submitting ? "Đang xử lý..." : "Thanh toán"}
          </button>
        </form>
      </section>

      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => !submitting && setShowPaymentModal(false)}>
          <div className="modal-dialog" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => !submitting && setShowPaymentModal(false)} aria-label="Close">
              ×
            </button>
            <div className="panel panel-soft">
              <h2>Thanh toán</h2>
              <div className="payment-summary">
                <p>
                  <strong>Chuyến:</strong> {selectedTrip?.route?.route_name || `${selectedTrip?.origin} → ${selectedTrip?.destination}`}
                </p>
                <p>
                  <strong>Ghế:</strong> {selectedSeats.join(", ")}
                </p>
                <p>
                  <strong>Tổng:</strong> {formatMoney(totalAmount)}
                </p>
                <p><strong>Hình thức thanh toán:</strong> Thanh toán trực tuyến (cổng thanh toán)</p>
              </div>

              <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.8rem" }}>
                <button type="button" onClick={confirmPayment} disabled={submitting}>
                  {submitting ? "Đang xử lý..." : "Xác nhận thanh toán"}
                </button>
                <button type="button" className="ghost-link" onClick={() => !submitting && setShowPaymentModal(false)}>
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && <p className="alert error">{error}</p>}
      {successMessage && <p className="alert success">{successMessage}</p>}
      <footer className="site-footer">
        © {new Date().getFullYear()} TicketBooking — Dịch vụ đặt vé trực tuyến.
      </footer>
    </main>
  );
}
