import { useEffect, useState } from "react";

const API_BASE = "http://localhost:5000/api";

export default function DispatcherDashboardPage({ session, handleLogout }) {
  const [routePoints, setRoutePoints] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [travelTime, setTravelTime] = useState(60);
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [assistantId, setAssistantId] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const toLocalInput = (d) => {
    if (!d) return "";
    const pad = (n) => String(n).padStart(2, "0");
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/routes/points`);
        const payload = await res.json();
        if (!res.ok || !payload.success) return;
        if (!cancelled) setRoutePoints(Array.isArray(payload.data) ? payload.data : []);
      } catch {
        if (!cancelled) setRoutePoints([]);
      }

      try {
        const v = await fetch(`${API_BASE}/vehicles`);
        const pv = await v.json();
        if (v.ok && pv.success) setVehicles(Array.isArray(pv.data) ? pv.data : []);
      } catch {}

      try {
        const d = await fetch(`${API_BASE}/operators?role=driver`);
        const pd = await d.json();
        if (d.ok && pd.success) setDrivers(Array.isArray(pd.data) ? pd.data : []);
      } catch {}

      try {
        const a = await fetch(`${API_BASE}/operators?role=assistant`);
        const pa = await a.json();
        if (a.ok && pa.success) setAssistants(Array.isArray(pa.data) ? pa.data : []);
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!origin) {
      setDestinations([]);
      return;
    }

    (async () => {
      try {
        const q = new URLSearchParams({ origin: origin });
        const res = await fetch(`${API_BASE}/routes/destinations?${q.toString()}`);
        const payload = await res.json();
        if (!res.ok || !payload.success) {
          setDestinations([]);
          return;
        }
        if (!cancelled) setDestinations(Array.isArray(payload.data) ? payload.data : []);
      } catch {
        if (!cancelled) setDestinations([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [origin]);

  useEffect(() => {
    // recalc arrival when departureTime or travelTime changes
    if (!departureTime) {
      setArrivalTime("");
      return;
    }

    const dep = new Date(departureTime);
    if (isNaN(dep.getTime())) {
      setArrivalTime("");
      return;
    }

    const mins = Number(travelTime) || 0;
    const arr = new Date(dep.getTime() + mins * 60000);
    setArrivalTime(toLocalInput(arr));
  }, [departureTime, travelTime]);

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!origin || !destination) {
      setError("Vui lòng chọn tuyến (điểm đi và điểm đến).");
      return;
    }

    if (!vehicleId || !driverId || !assistantId) {
      setError("Vui lòng chọn nhân viên và xe.");
      return;
    }

    if (!departureTime) {
      setError("Vui lòng chọn thời gian khởi hành.");
      return;
    }

    setLoading(true);
    try {
      const body = {
        origin,
        destination,
        travel_time: Number(travelTime) || 60,
        vehicle_id: vehicleId,
        driver_id: driverId,
        assistant_id: assistantId,
        departure_time: new Date(departureTime).toISOString(),
        arrival_time: new Date(arrivalTime).toISOString(),
      };

      const res = await fetch(`${API_BASE}/trips`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) throw new Error(payload.message || "Không thể tạo chuyến.");

      setSuccess("Tạo chuyến thành công. Vé đã được tạo tự động.");
      // reset form
      setOrigin("");
      setDestination("");
      setTravelTime(60);
      setVehicleId("");
      setDriverId("");
      setAssistantId("");
      setDepartureTime("");
      setArrivalTime("");
    } catch (err) {
      setError(err.message || "Đã có lỗi khi tạo chuyến.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadTrips = async () => {
    setLoadingTrips(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_BASE}/trips`);
      const payload = await res.json();
      if (!res.ok || !payload.success) throw new Error(payload.message || 'Không thể tải chuyến.');
      setTrips(Array.isArray(payload.data) ? payload.data : []);
    } catch (err) {
      setError(err.message || 'Đã có lỗi khi tải chuyến.');
      setTrips([]);
    } finally {
      setLoadingTrips(false);
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
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button type="button" onClick={handleLoadTrips} disabled={loadingTrips}>{loadingTrips ? 'Đang tải...' : 'Tải danh sách chuyến'}</button>
            <button type="button" onClick={() => setShowCreate((s) => !s)}>{showCreate ? 'Đóng tạo chuyến' : 'Tạo chuyến'}</button>
          </div>

          {showCreate && (
            <article className="panel panel-soft dispatcher-panel dispatcher-panel-wide">
              <h2>Tạo chuyến mới</h2>
              <form onSubmit={handleCreateTrip}>
              <label>
                Điểm đi
                <select value={origin} onChange={(e) => setOrigin(e.target.value)}>
                  <option value="">-- Chọn điểm đi --</option>
                  {routePoints.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>

              <label>
                Điểm đến
                <select value={destination} onChange={(e) => setDestination(e.target.value)}>
                  <option value="">-- Chọn điểm đến --</option>
                  {destinations.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </label>

              <label>
                Thời gian di chuyển (phút)
                <input type="number" min={1} value={travelTime} onChange={(e) => setTravelTime(e.target.value)} />
              </label>

              <label>
                Chọn nhân viên lái (driver)
                <select value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                  <option value="">-- Chọn lái xe --</option>
                  {drivers.map((d) => (
                    <option key={d._id} value={d._id}>{d.name} ({d.phone_number})</option>
                  ))}
                </select>
              </label>

              <label>
                Chọn nhân viên phụ (assistant)
                <select value={assistantId} onChange={(e) => setAssistantId(e.target.value)}>
                  <option value="">-- Chọn phụ --</option>
                  {assistants.map((a) => (
                    <option key={a._id} value={a._id}>{a.name} ({a.phone_number})</option>
                  ))}
                </select>
              </label>

              <label>
                Chọn xe
                <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                  <option value="">-- Chọn xe --</option>
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>{v.license_plate} — {v.vehicle_type} ({v.total_seats} ghế)</option>
                  ))}
                </select>
              </label>

              <label>
                Khởi hành
                <input type="datetime-local" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} />
              </label>

              <label>
                Đến nơi
                <div style={{ padding: '6px 8px', background: '#f7f7f7', borderRadius: 4 }}>
                  {arrivalTime ? new Date(arrivalTime).toLocaleString() : "Chưa có"}
                </div>
              </label>

              <div style={{ marginTop: 12 }}>
                <button type="submit" disabled={loading}>{loading ? 'Đang tạo...' : 'Tạo chuyến'}</button>
              </div>
            </form>
            </article>
          )}

          <article className="panel panel-soft dispatcher-panel dispatcher-panel-wide">
            <h2>Danh sách chuyến</h2>
            {trips.length === 0 ? (
              <p>Không có chuyến nào. Nhấn "Tải danh sách chuyến" để lấy dữ liệu.</p>
            ) : (
              <ul>
                {trips.map((t) => (
                  <li key={t._id} style={{ marginBottom: 8 }}>
                    <strong>{t.route?.origin} → {t.route?.destination}</strong>
                    <div>Xe: {t.vehicle?.license_plate} | Lái: {t.driver?.name} | Phụ: {t.assistant?.name}</div>
                    <div>Khởi hành: {new Date(t.departure_time).toLocaleString()} — Đến: {new Date(t.arrival_time).toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>
      </section>

      {error && <p className="alert error">{error}</p>}
      {success && <p className="alert success">{success}</p>}

      <footer className="site-footer">
        © {new Date().getFullYear()} TicketBooking — Cổng điều phối.
      </footer>
    </main>
  );
}
