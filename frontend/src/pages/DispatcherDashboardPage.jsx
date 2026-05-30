export default function DispatcherDashboardPage({
  session,
  handleLogout,
  dispatcherDrafts,
  updateDispatcherDraft,
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
          <nav className="top-actions">
            <button type="button" className="login-btn" onClick={handleLogout}>
              Đăng xuất
            </button>
          </nav>
        </div>
      </header>

      <section className="dashboard-shell dispatcher-dashboard-shell">
        <section className="hero-card dashboard-hero dispatcher-dashboard-hero">
          <p className="eyebrow">Trang điều phối</p>
          <h1>Xin chào, {session?.profile?.name || "điều phối viên"}.</h1>
        </section>

        <section className="dispatcher-dashboard-grid">
          <article className="panel panel-soft dispatcher-panel">
            <h2>Tạo tuyến</h2>
            <label>
              Tên tuyến
              <input
                value={dispatcherDrafts.routeName}
                onChange={(event) => updateDispatcherDraft("routeName", event.target.value)}
                placeholder="Hà Nội - Hải Phòng"
              />
            </label>
            <button type="button">Lưu tuyến</button>
          </article>

          <article className="panel panel-soft dispatcher-panel">
            <h2>Tạo điều phối viên</h2>
            <label>
              Tên điều phối viên
              <input
                value={dispatcherDrafts.operatorName}
                onChange={(event) => updateDispatcherDraft("operatorName", event.target.value)}
                placeholder="Nguyễn Văn B"
              />
            </label>
            <button type="button">Lưu điều phối viên</button>
          </article>

          <article className="panel panel-soft dispatcher-panel">
            <h2>Tạo xe</h2>
            <label>
              Mã xe
              <input
                value={dispatcherDrafts.vehicleCode}
                onChange={(event) => updateDispatcherDraft("vehicleCode", event.target.value)}
                placeholder="30A-12345"
              />
            </label>
            <button type="button">Lưu xe</button>
          </article>

          <article className="panel panel-soft dispatcher-panel dispatcher-panel-wide">
            <h2>Tạo chuyến</h2>
            <label>
              Ghi chú chuyến
              <input
                value={dispatcherDrafts.tripNote}
                onChange={(event) => updateDispatcherDraft("tripNote", event.target.value)}
                placeholder="Chuyến đêm, xuất bến lúc 22:00"
              />
            </label>
            <button type="button">Lưu chuyến</button>
          </article>
        </section>
      </section>

      {error && <p className="alert error">{error}</p>}
      {successMessage && <p className="alert success">{successMessage}</p>}
      <footer className="site-footer">
        © {new Date().getFullYear()} TicketBooking — Cổng điều phối.
      </footer>
    </main>
  );
}
