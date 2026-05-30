import { useState } from "react";

export default function CustomerPage({
  session,
  handleLogout,
  authMode,
  setAuthMode,
  authLoading,
  authName,
  setAuthName,
  authPhone,
  setAuthPhone,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  submitCustomerAuth,
  origin,
  setOrigin,
  date,
  setDate,
  destination,
  setDestination,
  handleSearch,
  loadingTrips,
  routePoints,
  destinationOptions,
  handleOriginChange,
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
  paymentType,
  setPaymentType,
  submitBooking,
  submitting,
  totalAmount,
  error,
  successMessage,
}) {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <div className="brand-title">TicketBooking</div>
            <div className="brand-sub">Đặt vé nhanh — An tâm</div>
          </div>
          <nav className="top-actions">
            <button type="button" className="login-btn" onClick={() => setShowAuthModal(true)}>
              Tài khoản
            </button>
            {session ? (
              <button type="button" className="login-btn" onClick={handleLogout}>
                Đăng xuất
              </button>
            ) : null}
          </nav>
        </div>
      </header>

      <section className="hero-card hero-center">
        <div className="hero-search-wrap">
          <form className="search-form hero-search" onSubmit={handleSearch}>
            <label>
              Điểm đi
              <select value={origin} onChange={(e) => handleOriginChange(e.target.value)}>
                <option value="">-- Chọn điểm đi --</option>
                {routePoints.map((point) => (
                  <option key={point} value={point}>
                    {point}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Điểm đến
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                disabled={!destinationOptions || destinationOptions.length === 0}
              >
                <option value="">-- Chọn điểm đến --</option>
                {destinationOptions && destinationOptions.map((pt) => (
                  <option key={pt} value={pt}>{pt}</option>
                ))}
              </select>
            </label>
            <label>
              Ngày
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
            <button type="submit" disabled={loadingTrips}>
              {loadingTrips ? "Đang tìm..." : "Tìm"}
            </button>
          </form>
          {/* routePoints provided as select options above */}
        </div>
      </section>

      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="modal-dialog" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAuthModal(false)} aria-label="Close">
              ×
            </button>
            <div className="panel panel-soft auth-panel-modal">
              <div className="panel-head">
                <h2>{authMode === "login" ? "Đăng nhập khách hàng" : "Đăng ký khách hàng"}</h2>
              </div>

              <div className="auth-switcher">
                <button
                  type="button"
                  className={authMode === "login" ? "switch-btn active" : "switch-btn"}
                  onClick={() => setAuthMode("login")}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  className={authMode === "register" ? "switch-btn active" : "switch-btn"}
                  onClick={() => setAuthMode("register")}
                >
                  Đăng ký
                </button>
              </div>

              <form
                className="auth-form"
                onSubmit={(event) => {
                  submitCustomerAuth(event);
                  setShowAuthModal(false);
                }}
              >
                {authMode === "register" && (
                  <>
                    <label>
                      Họ tên
                      <input
                        value={authName}
                        onChange={(event) => setAuthName(event.target.value)}
                        placeholder="Nguyễn Văn A"
                      />
                    </label>
                    <label>
                      Số điện thoại
                      <input
                        value={authPhone}
                        onChange={(event) => setAuthPhone(event.target.value)}
                        placeholder="09xxxxxxxx"
                      />
                    </label>
                  </>
                )}

                <label>
                  Email
                  <input value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="abc@email.com" />
                </label>
                <label>
                  Mật khẩu
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(event) => setAuthPassword(event.target.value)}
                    placeholder="Tối thiểu 8 ký tự"
                  />
                </label>

                <button type="submit" disabled={authLoading}>
                  {authLoading ? "Đang xử lý..." : authMode === "register" ? "Tạo tài khoản" : "Đăng nhập"}
                </button>
              </form>
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