import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "../components/Alert.jsx";
import Modal from "../components/Modal.jsx";
import Navbar from "../components/Navbar.jsx";


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
  date,
  setDate,
  destination,
  setDestination,
  handleSearch,
  loadingTrips,
  routePoints,
  destinationOptions,
  handleOriginChange,
  error,
  successMessage,
  setError,
  setSuccessMessage,
}) {
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    const ok = await submitCustomerAuth(event);
    if (ok) {
      setShowAuthModal(false);
    }
  };

  return (
    <main className="min-h-screen text-blush-900">
      <Navbar tagline="Đặt vé xe khách trực tuyến">
        {session ? (
          <span className="hidden rounded-full bg-blush-100 px-3 py-1.5 text-xs font-semibold text-blush-700 sm:inline">
            Xin chào, {session.profile?.customer_name || "bạn"}
          </span>
        ) : null}
        <button type="button" className="btn-secondary hidden sm:inline-flex" onClick={() => navigate("/tickets")}>
          Vé của tôi
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setShowAuthModal(true)}
        >
          {session ? "Tài khoản" : "Đăng nhập"}
        </button>
        {session ? (
          <button type="button" className="btn-ghost" onClick={handleLogout}>
            Đăng xuất
          </button>
        ) : null}
      </Navbar>

      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-blush-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-mauve-200/50 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="animate-rise-up space-y-6">
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-blush-900 sm:text-5xl lg:text-6xl">
              Tìm chuyến xe
              <span className="block bg-gradient-to-r from-blush-500 to-blush-700 bg-clip-text text-transparent">
                nhanh & dễ dàng
              </span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-blush-700/90 sm:text-lg">
              Good job bro.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-blush-600">
              <span className="rounded-2xl bg-white/80 px-4 py-2 shadow-glass">✓ Tìm tuyến nhanh</span>
              <span className="rounded-2xl bg-white/80 px-4 py-2 shadow-glass">✓ Chọn ghế trực tiếp</span>
              <span className="rounded-2xl bg-white/80 px-4 py-2 shadow-glass">✓ Thanh toán tức thì</span>
            </div>
          </div>

          <form
            onSubmit={handleSearch}
            className="card-panel scale-in space-y-5 lg:ml-auto lg:max-w-md"
          >
            <div>
              <h2 className="font-display text-2xl font-bold text-blush-900">Tìm chuyến</h2>
              <p className="mt-1 text-sm text-blush-600">Nhập thông tin để xem chuyến phù hợp</p>
            </div>

            <label className="block space-y-2">
              <span className="label-text">Điểm đi</span>
              <select
                value={origin}
                onChange={(e) => handleOriginChange(e.target.value)}
                className="input-field"
              >
                <option value="">Chọn điểm đi</option>
                {routePoints.map((point) => (
                  <option key={point} value={point}>
                    {point}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="label-text">Điểm đến</span>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                disabled={destinationOptions.length === 0}
                className="input-field"
              >
                <option value="">Chọn điểm đến</option>
                {destinationOptions.map((point) => (
                  <option key={point} value={point}>
                    {point}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="label-text">Ngày đi</span>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="input-field"
              />
            </label>

            <button type="submit" disabled={loadingTrips} className="btn-primary h-12 w-full">
              {loadingTrips ? "Đang tìm kiếm..." : "Tìm kiếm chuyến"}
            </button>
          </form>
        </div>
      </section>

      {(error || successMessage) && (
        <div className="mx-auto max-w-2xl space-y-3 px-4 pb-6">
          {error ? (
            <Alert type="error" open={Boolean(error)} onClose={() => setError("")}>
              {error}
            </Alert>
          ) : null}
          {successMessage ? (
            <Alert type="success" open={Boolean(successMessage)} onClose={() => setSuccessMessage("")}>
              {successMessage}
            </Alert>
          ) : null}
        </div>
      )}

      <Modal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title={authMode === "login" ? "Đăng nhập" : "Đăng ký"}
        subtitle="Tài khoản khách hàng"
        size="sm"
      >
        <div className="mb-5 flex gap-2 rounded-2xl bg-blush-50 p-1">
          {["login", "register"].map((mode) => (
            <button
              key={mode}
              type="button"
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                authMode === mode
                  ? "bg-white text-blush-900 shadow-sm"
                  : "text-blush-600 hover:text-blush-800"
              }`}
              onClick={() => setAuthMode(mode)}
            >
              {mode === "login" ? "Đăng nhập" : "Đăng ký"}
            </button>
          ))}
        </div>

        <form onSubmit={handleAuthSubmit} className="space-y-3">
          {authMode === "register" ? (
            <>
              <label className="block space-y-2">
                <span className="label-text">Họ tên</span>
                <input
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="input-field"
                />
              </label>
              <label className="block space-y-2">
                <span className="label-text">Số điện thoại</span>
                <input
                  value={authPhone}
                  onChange={(e) => setAuthPhone(e.target.value)}
                  placeholder="09xxxxxxxx"
                  className="input-field"
                />
              </label>
            </>
          ) : null}

          <label className="block space-y-2">
            <span className="label-text">Email</span>
            <input
              type="email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="abc@email.com"
              className="input-field"
            />
          </label>

          <label className="block space-y-2">
            <span className="label-text">Mật khẩu</span>
            <input
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="Tối thiểu 8 ký tự"
              className="input-field"
            />
          </label>

          <button type="submit" disabled={authLoading} className="btn-primary w-full">
            {authLoading ? "Đang xử lý..." : authMode === "login" ? "Đăng nhập" : "Đăng ký"}
          </button>
        </form>
      </Modal>

      <footer className="mt-auto border-t border-blush-100/80 bg-white/50 px-4 py-8 text-center text-sm text-blush-500 backdrop-blur-sm">
        © {new Date().getFullYear()} TicketBooking — Đặt vé trực tuyến nhanh chóng và an toàn.
      </footer>
    </main>
  );
}
