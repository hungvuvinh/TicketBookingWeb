import { useEffect, useMemo, useState } from "react";
import Alert from "../components/Alert.jsx";
import Modal from "../components/Modal.jsx";
import Navbar from "../components/Navbar.jsx";
import { API_BASE } from "../config.js";

const SECTIONS = [
  { key: "trips", label: "Quản lý chuyến" },
  { key: "routes", label: "Quản lý tuyến" },
  { key: "vehicles", label: "Quản lý xe" },
  { key: "operators", label: "Quản lý nhân viên"},
];

const emptyTripForm = {
  routeId: "",
  direction: "forward",
  vehicleId: "",
  driverId: "",
  assistantId: "",
  departureTime: "",
};

const emptyRouteForm = {
  origin: "",
  destination: "",
  travel_time: 60,
};

const emptyVehicleForm = {
  vehicle_type: "Ghế ngồi",
  total_seats: 45,
  license_plate: "",
  seat_price: 150000,
  routeId: "",
};

const emptyOperatorForm = {
  name: "",
  phone_number: "",
  email: "",
  role: "driver",
  license: "",
};

const formatDateTime = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("vi-VN");
};

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Không xác định";
  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const toDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatMoney = (value = 0) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const normalizeVehicle = (vehicle) => ({
  ...vehicle,
  license_plate: vehicle?.license_plate || vehicle?.lisence_plate || "",
});

const toDatetimeLocal = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

export default function DispatcherDashboardPage({ session, handleLogout }) {
  const [activeSection, setActiveSection] = useState("trips");
  const [trips, setTrips] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [operators, setOperators] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [tripFilterDate, setTripFilterDate] = useState("");

  const [vehicleRouteMap, setVehicleRouteMap] = useState({});

  const [modalType, setModalType] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const [tripForm, setTripForm] = useState(emptyTripForm);
  const [routeForm, setRouteForm] = useState(emptyRouteForm);
  const [vehicleForm, setVehicleForm] = useState(emptyVehicleForm);
  const [operatorForm, setOperatorForm] = useState(emptyOperatorForm);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const drivers = useMemo(() => operators.filter((op) => op.role === "driver"), [operators]);
  const assistants = useMemo(() => operators.filter((op) => op.role === "assistant"), [operators]);

  const filteredTrips = useMemo(() => {
    if (!tripFilterDate) return trips;
    return trips.filter((trip) => {
      const tripDate = toDateKey(trip.departure_time);
      return tripDate === tripFilterDate;
    });
  }, [trips, tripFilterDate]);

  const availableVehicles = useMemo(() => {
    if (!tripForm.routeId) return vehicles;
    return vehicles.filter((vehicle) => {
      const vehicleRouteId = vehicle?.route?._id || vehicle?.route;
      return !vehicleRouteId || vehicleRouteId === tripForm.routeId;
    });
  }, [vehicles, tripForm.routeId]);

  useEffect(() => {
    if (tripForm.vehicleId && !availableVehicles.some((vehicle) => vehicle._id === tripForm.vehicleId)) {
      setTripForm((prev) => ({ ...prev, vehicleId: "" }));
    }
  }, [availableVehicles, tripForm.vehicleId]);

  const fetchJson = async (url, options) => {
    const res = await fetch(url, options);
    const payload = await res.json();
    if (!res.ok || !payload.success) {
      throw new Error(payload.message || "Request failed");
    }
    return payload.data;
  };

  const loadTrips = async () => {
    setLoadingTrips(true);
    try {
      const data = await fetchJson(`${API_BASE}/trips`);
      setTrips(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingTrips(false);
    }
  };

  const loadRoutes = async () => {
    try {
      const data = await fetchJson(`${API_BASE}/routes`);
      setRoutes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadVehicles = async () => {
    try {
      const data = await fetchJson(`${API_BASE}/vehicles`);
      setVehicles(Array.isArray(data) ? data.map(normalizeVehicle) : []);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadOperators = async () => {
    try {
      const data = await fetchJson(`${API_BASE}/operators`);
      setOperators(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadTrips();
    loadRoutes();
    loadVehicles();
    loadOperators();
  }, []);

  const groupedTrips = useMemo(() => {
    return filteredTrips.reduce((groups, trip) => {
      const key = toDateKey(trip.departure_time);
      if (!groups[key]) groups[key] = [];
      groups[key].push(trip);
      return groups;
    }, {});
  }, [filteredTrips]);

  const tripGroupKeys = useMemo(() => Object.keys(groupedTrips).sort(), [groupedTrips]);

  const closeModal = () => {
    setModalType(null);
    setEditingItem(null);
    setTripForm(emptyTripForm);
    setRouteForm(emptyRouteForm);
    setVehicleForm(emptyVehicleForm);
    setOperatorForm(emptyOperatorForm);
  };

  const openCreate = (type) => {
    setError("");
    setSuccess("");
    setEditingItem(null);
    setModalType(type);
  };

  const openEdit = (type, item) => {
    setError("");
    setSuccess("");
    setEditingItem(item);
    setModalType(type);

    if (type === "trip") {
      setTripForm({
        routeId: item.route?._id || item.route || "",        direction: item.origin === item.route?.origin ? "forward" : "reverse",        vehicleId: item.vehicle?._id || item.vehicle || "",
        driverId: item.driver?._id || item.driver || "",
        assistantId: item.assistant?._id || item.assistant || "",
        departureTime: toDatetimeLocal(item.departure_time),
      });
    } else if (type === "route") {
      setRouteForm({
        origin: item.origin || "",
        destination: item.destination || "",
        travel_time: item.travel_time || 60,
      });
    } else if (type === "vehicle") {
      setVehicleForm({
        vehicle_type: item.vehicle_type || "Ghế ngồi",
        total_seats: item.total_seats || 45,
        license_plate: item.license_plate || "",
        seat_price: item.seat_price || 0,
        routeId: item.route?._id || item.route || "",
      });
    } else if (type === "operator") {
      setOperatorForm({
        name: item.name || "",
        phone_number: item.phone_number || "",
        email: item.email || "",
        role: item.role || "driver",
        license: item.license || "",
      });
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm("Bạn có chắc muốn xóa mục này?")) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const paths = {
        trip: `/trips/${id}`,
        route: `/routes/${id}`,
        vehicle: `/vehicles/${id}`,
        operator: `/operators/${id}`,
      };

      await fetchJson(`${API_BASE}${paths[type]}`, { method: "DELETE" });
      setSuccess("Đã xóa thành công.");

      if (type === "trip") await loadTrips();
      if (type === "route") await loadRoutes();
      if (type === "vehicle") await loadVehicles();
      if (type === "operator") await loadOperators();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (modalType === "trip") {
        const body = {
          route_id: tripForm.routeId,
          direction: tripForm.direction,
          vehicle_id: tripForm.vehicleId,
          driver_id: tripForm.driverId,
          assistant_id: tripForm.assistantId,
          departure_time: new Date(tripForm.departureTime).toISOString(),
        };

        if (editingItem) {
          await fetchJson(`${API_BASE}/trips/${editingItem._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
        } else {
          await fetchJson(`${API_BASE}/trips`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
        }
        await loadTrips();
      }

      if (modalType === "route") {
        const body = {
          origin: routeForm.origin.trim(),
          destination: routeForm.destination.trim(),
          travel_time: Number(routeForm.travel_time),
        };

        if (editingItem) {
          await fetchJson(`${API_BASE}/routes/${editingItem._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
        } else {
          await fetchJson(`${API_BASE}/routes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
        }
        await loadRoutes();
      }

      if (modalType === "vehicle") {
        const body = {
          vehicle_type: vehicleForm.vehicle_type.trim(),
          total_seats: Number(vehicleForm.total_seats),
          license_plate: vehicleForm.license_plate.trim(),
          seat_price: Number(vehicleForm.seat_price),
          route_id: vehicleForm.routeId || undefined,
        };

        if (editingItem) {
          await fetchJson(`${API_BASE}/vehicles/${editingItem._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
        } else {
          await fetchJson(`${API_BASE}/vehicles`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
        }
        await loadVehicles();
      }

      if (modalType === "operator") {
        const body = {
          name: operatorForm.name.trim(),
          phone_number: operatorForm.phone_number.trim(),
          email: operatorForm.email.trim() || undefined,
          role: operatorForm.role,
          license: operatorForm.license.trim() || undefined,
        };

        if (editingItem) {
          await fetchJson(`${API_BASE}/operators/${editingItem._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
        } else {
          await fetchJson(`${API_BASE}/operators`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
        }
        await loadOperators();
      }

      setSuccess(editingItem ? "Đã cập nhật thành công." : "Đã tạo mới thành công.");
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const modalTitles = {
    trip: editingItem ? "Sửa chuyến" : "Thêm chuyến mới",
    route: editingItem ? "Sửa tuyến" : "Thêm tuyến mới",
    vehicle: editingItem ? "Sửa xe" : "Thêm xe mới",
    operator: editingItem ? "Sửa nhân viên" : "Thêm nhân viên mới",
  };

  const ActionButtons = ({ type, item }) => (
    <div className="flex flex-wrap gap-2">
      <button type="button" className="btn-ghost px-3 py-1.5 text-xs" onClick={() => openEdit(type, item)}>
        Sửa
      </button>
      <button
        type="button"
        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
        onClick={() => handleDelete(type, item._id)}
      >
        Xóa
      </button>
    </div>
  );

  const EmptyState = ({ message }) => (
    <p className="rounded-2xl border border-blush-100 bg-blush-50/70 px-4 py-6 text-center text-sm text-blush-600">
      {message}
    </p>
  );

  return (
    <main className="min-h-screen text-blush-900">
      <Navbar tagline="Bảng điều khiển điều phối">
        <span className="hidden rounded-full bg-blush-100 px-3 py-1.5 text-xs font-semibold text-blush-700 sm:inline">
          {session?.profile?.name || session?.profile?.email || "Điều phối viên"}
        </span>
        <button type="button" className="btn-ghost" onClick={handleLogout}>
          Đăng xuất
        </button>
      </Navbar>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="card-panel animate-rise-up">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blush-500">Dashboard</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-blush-900">
            Xin chào, {session?.profile?.name || "điều phối viên"}
          </h1>
          <p className="mt-2 text-blush-600">Quản lý toàn bộ hoạt động vận hành xe khách tại đây.</p>
        </header>

        {(error || success) && (
          <div className="space-y-3">
            {error ? <Alert type="error">{error}</Alert> : null}
            {success ? <Alert type="success">{success}</Alert> : null}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="card-panel h-fit space-y-2 lg:sticky lg:top-24">
            <h2 className="mb-2 font-display text-lg font-bold text-blush-800">Chức năng</h2>
            {SECTIONS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveSection(item.key)}
                className={`card-hover flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-smooth-fast ${
                  activeSection === item.key
                    ? "bg-gradient-to-r from-blush-400 to-blush-600 text-white shadow-md"
                    : "border border-blush-100 bg-white text-blush-700 hover:bg-blush-50"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </aside>

          <section className="space-y-5 animate-rise-up">
            {activeSection === "trips" && (
              <div className="card-panel">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-3">
                    <h2 className="font-display text-2xl font-bold text-blush-900">Danh sách chuyến</h2>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex items-center gap-2 text-sm text-blush-600">
                        <span>Ngày đi:</span>
                        <input
                          type="date"
                          className="input-field h-10"
                          value={tripFilterDate}
                          onChange={(e) => setTripFilterDate(e.target.value)}
                        />
                      </label>
                      {tripFilterDate ? (
                        <button
                          type="button"
                          className="text-sm font-semibold text-blush-600 hover:text-blush-800"
                          onClick={() => setTripFilterDate("")}
                        >
                          Xóa lọc
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="btn-secondary" onClick={loadTrips}>
                      {loadingTrips ? "Đang tải..." : "Tải lại"}
                    </button>
                    <button type="button" className="btn-primary" onClick={() => openCreate("trip")}>
                      + Thêm chuyến
                    </button>
                  </div>
                </div>

                {tripGroupKeys.length === 0 ? (
                  <EmptyState message="Chưa có chuyến nào. Hãy thêm chuyến mới." />
                ) : (
                  <div className="space-y-6">
                    {tripGroupKeys.map((groupKey) => (
                      <div key={groupKey} className="overflow-hidden rounded-3xl border border-blush-100">
                        <div className="border-b border-blush-100 bg-blush-50 px-4 py-3 font-semibold text-blush-700">
                          {formatDate(groupedTrips[groupKey][0]?.departure_time)}
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="border-b border-blush-100 bg-blush-50/50 text-left text-blush-700">
                                <th className="px-4 py-3 font-semibold">Tuyến</th>
                                <th className="px-4 py-3 font-semibold">Xe</th>
                                <th className="px-4 py-3 font-semibold">Nhân viên</th>
                                <th className="px-4 py-3 font-semibold">Khởi hành</th>
                                <th className="px-4 py-3 font-semibold">Thao tác</th>
                              </tr>
                            </thead>
                            <tbody>
                              {groupedTrips[groupKey].map((trip) => (
                                <tr key={trip._id} className="border-b border-blush-50 hover:bg-blush-50/40">
                                  <td className="px-4 py-3">
                                    <div className="font-semibold">{trip.origin}</div>
                                    <div className="text-blush-500">→ {trip.destination}</div>
                                  </td>
                                  <td className="px-4 py-3">{trip.vehicle?.license_plate || "-"}</td>
                                  <td className="px-4 py-3">
                                    <div>Lái: {trip.driver?.name || "-"}</div>
                                    <div>Phụ: {trip.assistant?.name || "-"}</div>
                                  </td>
                                  <td className="px-4 py-3">{formatDateTime(trip.departure_time)}</td>
                                  <td className="px-4 py-3">
                                    <ActionButtons type="trip" item={trip} />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSection === "routes" && (
              <div className="card-panel">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-2xl font-bold text-blush-900">Danh sách tuyến</h2>
                  <button type="button" className="btn-primary" onClick={() => openCreate("route")}>
                    + Thêm tuyến
                  </button>
                </div>

                {routes.length === 0 ? (
                  <EmptyState message="Chưa có tuyến nào." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-blush-100 bg-blush-50/50 text-left text-blush-700">
                          <th className="px-4 py-3 font-semibold">Điểm đi</th>
                          <th className="px-4 py-3 font-semibold">Điểm đến</th>
                          <th className="px-4 py-3 font-semibold">Thời gian</th>
                          <th className="px-4 py-3 font-semibold">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {routes.map((route) => (
                          <tr key={route._id} className="border-b border-blush-50 hover:bg-blush-50/40">
                            <td className="px-4 py-3">{route.origin}</td>
                            <td className="px-4 py-3">{route.destination}</td>
                            <td className="px-4 py-3">{route.travel_time} phút</td>
                            <td className="px-4 py-3">
                              <ActionButtons type="route" item={route} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeSection === "vehicles" && (
              <div className="card-panel">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-2xl font-bold text-blush-900">Danh sách xe</h2>
                  <button type="button" className="btn-primary" onClick={() => openCreate("vehicle")}>
                    + Thêm xe
                  </button>
                </div>

                {vehicles.length === 0 ? (
                  <EmptyState message="Chưa có xe nào." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-blush-100 bg-blush-50/50 text-left text-blush-700">
                          <th className="px-4 py-3 font-semibold">Biển số</th>
                          <th className="px-4 py-3 font-semibold">Loại xe</th>
                          <th className="px-4 py-3 font-semibold">Tuyến</th>
                          <th className="px-4 py-3 font-semibold">Số ghế</th>
                          <th className="px-4 py-3 font-semibold">Giá vé</th>
                          <th className="px-4 py-3 font-semibold">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vehicles.map((vehicle) => (
                          <tr key={vehicle._id} className="border-b border-blush-50 hover:bg-blush-50/40">
                            <td className="px-4 py-3 font-semibold">{vehicle.license_plate}</td>
                            <td className="px-4 py-3">{vehicle.vehicle_type}</td>
                            <td className="px-4 py-3">{vehicle.route ? `${vehicle.route.origin} → ${vehicle.route.destination}` : "-"}</td>
                            <td className="px-4 py-3">{vehicle.total_seats}</td>
                            <td className="px-4 py-3">{formatMoney(vehicle.seat_price)}</td>
                            <td className="px-4 py-3">
                              <ActionButtons type="vehicle" item={vehicle} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeSection === "operators" && (
              <div className="card-panel">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-2xl font-bold text-blush-900">Danh sách nhân viên</h2>
                  <button type="button" className="btn-primary" onClick={() => openCreate("operator")}>
                    + Thêm nhân viên
                  </button>
                </div>

                {operators.length === 0 ? (
                  <EmptyState message="Chưa có nhân viên nào." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-blush-100 bg-blush-50/50 text-left text-blush-700">
                          <th className="px-4 py-3 font-semibold">Họ tên</th>
                          <th className="px-4 py-3 font-semibold">Vai trò</th>
                          <th className="px-4 py-3 font-semibold">Điện thoại</th>
                          <th className="px-4 py-3 font-semibold">Email</th>
                          <th className="px-4 py-3 font-semibold">Bằng lái (Lái xe)</th>
                          <th className="px-4 py-3 font-semibold">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {operators.map((operator) => (
                          <tr key={operator._id} className="border-b border-blush-50 hover:bg-blush-50/40">
                            <td className="px-4 py-3 font-semibold">{operator.name}</td>
                            <td className="px-4 py-3 capitalize">{operator.role === "driver" ? "Lái xe" : "Phụ xe"}</td>
                            <td className="px-4 py-3">{operator.phone_number}</td>
                            <td className="px-4 py-3">{operator.email || "-"}</td>
                            <td className="px-4 py-3">{operator.role === "driver" ? operator.license || "-" : "N/A"}</td>
                            <td className="px-4 py-3">
                              <ActionButtons type="operator" item={operator} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      <Modal
        open={Boolean(modalType)}
        onClose={closeModal}
        title={modalTitles[modalType] || ""}
        subtitle="Quản lý dữ liệu"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="grid gap-4">
          {modalType === "trip" && (
            <>
              <label className="block space-y-2">
                <span className="label-text">Tuyến</span>
                <select
                  className="input-field"
                  value={tripForm.routeId}
                  onChange={(e) => setTripForm({ ...tripForm, routeId: e.target.value })}
                  required
                >
                  <option value="">Chọn tuyến</option>
                  {routes.map((route) => (
                    <option key={route._id} value={route._id}>
                      {route.origin} → {route.destination}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-2">
                <span className="label-text">Hướng đi</span>
                <select
                  className="input-field"
                  value={tripForm.direction}
                  onChange={(e) => setTripForm({ ...tripForm, direction: e.target.value })}
                  disabled={!tripForm.routeId}
                  required
                >
                  {tripForm.routeId && routes.find(r => r._id === tripForm.routeId) ? (
                    <>
                      <option value="forward">
                        {routes.find(r => r._id === tripForm.routeId)?.origin} → {routes.find(r => r._id === tripForm.routeId)?.destination}
                      </option>
                      <option value="reverse">
                        {routes.find(r => r._id === tripForm.routeId)?.destination} → {routes.find(r => r._id === tripForm.routeId)?.origin}
                      </option>
                    </>
                  ) : (
                    <option value="">Chọn tuyến trước</option>
                  )}
                </select>
              </label>
              <label className="block space-y-2">
                <span className="label-text">Xe</span>
                <select
                  className="input-field"
                  value={tripForm.vehicleId}
                  onChange={(e) => setTripForm({ ...tripForm, vehicleId: e.target.value })}
                  required
                >
                  <option value="">Chọn xe</option>
                  {availableVehicles.map((vehicle) => (
                    <option key={vehicle._id} value={vehicle._id}>

                      {vehicle.license_plate} ({vehicle.total_seats} ghế){vehicle.route ? ` — ${vehicle.route.origin} → ${vehicle.route.destination}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2">
                  <span className="label-text">Lái xe</span>
                  <select
                    className="input-field"
                    value={tripForm.driverId}
                    onChange={(e) => setTripForm({ ...tripForm, driverId: e.target.value })}
                    required
                  >
                    <option value="">Chọn lái xe</option>
                    {drivers.map((driver) => (
                      <option key={driver._id} value={driver._id}>
                        {driver.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="label-text">Phụ xe</span>
                  <select
                    className="input-field"
                    value={tripForm.assistantId}
                    onChange={(e) => setTripForm({ ...tripForm, assistantId: e.target.value })}
                    required
                  >
                    <option value="">Chọn phụ xe</option>
                    {assistants.map((assistant) => (
                      <option key={assistant._id} value={assistant._id}>
                        {assistant.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block space-y-2">
                <span className="label-text">Giờ khởi hành</span>
                <input
                  type="datetime-local"
                  className="input-field"
                  value={tripForm.departureTime}
                  onChange={(e) => setTripForm({ ...tripForm, departureTime: e.target.value })}
                  required
                />
              </label>
            </>
          )}

          {modalType === "route" && (
            <>
              <label className="block space-y-2">
                <span className="label-text">Điểm đi</span>
                <input
                  className="input-field"
                  value={routeForm.origin}
                  onChange={(e) => setRouteForm({ ...routeForm, origin: e.target.value })}
                  required
                />
              </label>
              <label className="block space-y-2">
                <span className="label-text">Điểm đến</span>
                <input
                  className="input-field"
                  value={routeForm.destination}
                  onChange={(e) => setRouteForm({ ...routeForm, destination: e.target.value })}
                  required
                />
              </label>
              <label className="block space-y-2">
                <span className="label-text">Thời gian di chuyển (phút)</span>
                <input
                  type="number"
                  min="1"
                  className="input-field"
                  value={routeForm.travel_time}
                  onChange={(e) => setRouteForm({ ...routeForm, travel_time: e.target.value })}
                  required
                />
              </label>
            </>
          )}

          {modalType === "vehicle" && (
            <>
              <label className="block space-y-2">
                <span className="label-text">Loại xe</span>
                <input
                  className="input-field"
                  value={vehicleForm.vehicle_type}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, vehicle_type: e.target.value })}
                  required
                />
              </label>
              <label className="block space-y-2">
                <span className="label-text">Tuyến xe (tùy chọn)</span>
                <select
                  className="input-field"
                  value={vehicleForm.routeId}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, routeId: e.target.value })}
                >
                  <option value="">Không gắn tuyến</option>
                  {routes.map((route) => (
                    <option key={route._id} value={route._id}>
                      {route.origin} → {route.destination}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-2">
                <span className="label-text">Biển số</span>
                <input
                  className="input-field"
                  value={vehicleForm.license_plate}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, license_plate: e.target.value })}
                  required
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2">
                  <span className="label-text">Số ghế</span>
                  <input
                    type="number"
                    min="1"
                    className="input-field"
                    value={vehicleForm.total_seats}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, total_seats: e.target.value })}
                    required
                  />
                </label>
                <label className="block space-y-2">
                  <span className="label-text">Giá vé / ghế (VND)</span>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    value={vehicleForm.seat_price}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, seat_price: e.target.value })}
                    required
                  />
                </label>
              </div>
            </>
          )}

          {modalType === "operator" && (
            <>
              <label className="block space-y-2">
                <span className="label-text">Họ tên</span>
                <input
                  className="input-field"
                  value={operatorForm.name}
                  onChange={(e) => setOperatorForm({ ...operatorForm, name: e.target.value })}
                  required
                />
              </label>
              <label className="block space-y-2">
                <span className="label-text">Vai trò</span>
                <select
                  className="input-field"
                  value={operatorForm.role}
                  onChange={(e) => setOperatorForm({ ...operatorForm, role: e.target.value })}
                  required
                >
                  <option value="driver">Lái xe</option>
                  <option value="assistant">Phụ xe</option>
                </select>
              </label>
              <label className="block space-y-2">
                <span className="label-text">Số điện thoại</span>
                <input
                  className="input-field"
                  value={operatorForm.phone_number}
                  onChange={(e) => setOperatorForm({ ...operatorForm, phone_number: e.target.value })}
                  required
                />
              </label>
              <label className="block space-y-2">
                <span className="label-text">Email (tùy chọn)</span>
                <input
                  type="email"
                  className="input-field"
                  value={operatorForm.email}
                  onChange={(e) => setOperatorForm({ ...operatorForm, email: e.target.value })}
                />
              </label>
              <label className="block space-y-2">
                <span className="label-text">Giấy phép (tùy chọn)</span>
                <input
                  className="input-field"
                  value={operatorForm.license}
                  onChange={(e) => setOperatorForm({ ...operatorForm, license: e.target.value })}
                />
              </label>
            </>
          )}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn-secondary" onClick={closeModal}>
              Hủy
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Đang lưu..." : editingItem ? "Cập nhật" : "Tạo mới"}
            </button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
