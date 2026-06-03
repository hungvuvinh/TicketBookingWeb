import Alert from "../components/Alert.jsx";
import Navbar from "../components/Navbar.jsx";

export default function DispatcherLoginPage({
  submitDispatcherAuth,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authLoading,
  error,
  successMessage,
}) {
  return (
    <main className="min-h-screen animate-rise-up text-blush-900">
      <Navbar tagline="Cổng điều phối viên" />

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <section className="slide-in-left space-y-6 self-center">
          <p className="inline-flex rounded-full border border-blush-200 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-blush-500">
            Internal portal
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight text-blush-900 sm:text-5xl">
            Cổng đăng nhập
            <span className="block bg-gradient-to-r from-blush-500 to-blush-700 bg-clip-text text-transparent">
              điều phối viên
            </span>
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-blush-700">
            Quản lý chuyến xe, tuyến đường, phương tiện và nhân sự vận hành trên một bảng điều khiển gọn gàng, hiện đại.
          </p>
          <div className="rounded-3xl border border-blush-100 bg-blush-50/80 px-5 py-4 text-sm font-medium text-blush-700">
            Chỉ dành cho nhân sự được ủy quyền
          </div>
        </section>

        <section className="card-panel scale-in">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blush-500">Đăng nhập</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-blush-900">Bắt đầu phiên làm việc</h2>

          <form className="mt-6 grid gap-4" onSubmit={submitDispatcherAuth}>
            <label className="block space-y-2">
              <span className="label-text">Email</span>
              <input
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
                placeholder="dispatcher@email.com"
                className="input-field"
              />
            </label>

            <label className="block space-y-2">
              <span className="label-text">Mật khẩu</span>
              <input
                type="password"
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                placeholder="Mật khẩu"
                className="input-field"
              />
            </label>

            <button type="submit" disabled={authLoading} className="btn-primary h-12 w-full">
              {authLoading ? "Đang xử lý..." : "Đăng nhập"}
            </button>
          </form>
        </section>
      </div>

      {(error || successMessage) && (
        <div className="mx-auto max-w-md space-y-3 px-4 pb-8">
          {error ? <Alert type="error">{error}</Alert> : null}
          {successMessage ? <Alert type="success">{successMessage}</Alert> : null}
        </div>
      )}

      <footer className="border-t border-blush-100/80 bg-white/50 px-4 py-6 text-center text-sm text-blush-500">
        © {new Date().getFullYear()} TicketBooking — Dịch vụ nội bộ điều phối.
      </footer>
    </main>
  );
}
