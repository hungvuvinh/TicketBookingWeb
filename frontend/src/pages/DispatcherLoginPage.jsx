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
    <main className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <div className="brand-title">TicketBooking</div>
            <div className="brand-sub">Đặt vé nhanh — An tâm</div>
          </div>
        </div>
      </header>

      <section className="page-layout dispatcher-layout">
        <section className="hero-card dispatcher-hero">
          <p className="eyebrow">Trang điều phối</p>
          <h1>Đăng nhập vào cổng vận hành riêng cho người điều phối.</h1>
        </section>

        <section className="panel panel-soft auth-panel dispatcher-auth-panel">
          <div className="panel-head">
            <h2>Đăng nhập</h2>
          </div>
          <form className="auth-form single-column" onSubmit={submitDispatcherAuth}>
            <label>
              Email
              <input
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
                placeholder="dispatcher@email.com"
              />
            </label>
            <label>
              Mật khẩu
              <input
                type="password"
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                placeholder="Mật khẩu"
              />
            </label>
            <button type="submit" disabled={authLoading}>
              {authLoading ? "Đang xử lý..." : "Đăng nhập"}
            </button>
          </form>
        </section>
      </section>

      {error && <p className="alert error">{error}</p>}
      {successMessage && <p className="alert success">{successMessage}</p>}
      <footer className="site-footer">
        © {new Date().getFullYear()} TicketBooking — Dịch vụ nội bộ điều phối.
        <small>Chỉ dành cho nhân sự được ủy quyền.</small>
      </footer>
    </main>
  );
}
