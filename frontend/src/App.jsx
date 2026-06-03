import { useEffect, useMemo, useState } from "react";
import CustomerPage from "./pages/CustomerPage.jsx";
import CustomerBookingPage from "./pages/CustomerBookingPage.jsx";
import DispatcherDashboardPage from "./pages/DispatcherDashboardPage.jsx";
import DispatcherLoginPage from "./pages/DispatcherLoginPage.jsx";

const API_BASE = "http://localhost:5000/api";
const SESSION_KEY = "ticketbooking-session";

function formatMoney(value = 0) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function readStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function App() {
  const [session, setSession] = useState(() => readStoredSession());
  const isDispatcherRoute = typeof window !== "undefined" && window.location.pathname.toLowerCase().endsWith("/dispatcher");
  const [authMode, setAuthMode] = useState("login");
  const [authLoading, setAuthLoading] = useState(false);
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [origin, setOrigin] = useState("");
  const [date, setDate] = useState("");
  const [destination, setDestination] = useState("");
  const [routePoints, setRoutePoints] = useState([]);
  const [destinationOptions, setDestinationOptions] = useState([]);
  const [searched, setSearched] = useState(false);
  const [customerStep, setCustomerStep] = useState("search");
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [session]);

  useEffect(() => {
    if (session?.role === "customer") {
      setCustomerName(session.profile?.customer_name || "");
      setPhoneNumber(session.profile?.phone_number || "");
      setEmail(session.profile?.email || "");
    }
  }, [session]);

  useEffect(() => {
    if (session?.role === "dispatcher" && !isDispatcherRoute) {
      window.location.replace("/dispatcher");
    }
  }, [isDispatcherRoute, session]);

  useEffect(() => {
    let cancelled = false;

    const loadRoutePoints = async () => {
      try {
        const response = await fetch(`${API_BASE}/routes/points`);
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          return;
        }

        if (!cancelled) {
          setRoutePoints(Array.isArray(payload.data) ? payload.data : []);
        }
      } catch {
        if (!cancelled) {
          setRoutePoints([]);
        }
      }
    };

    loadRoutePoints();

    return () => {
      cancelled = true;
    };
  }, []);

  const fetchDestinations = async (originValue) => {
    if (!originValue || !String(originValue).trim()) {
      setDestinationOptions([]);
      return;
    }

    try {
      const query = new URLSearchParams({ origin: originValue.trim() });
      const response = await fetch(`${API_BASE}/routes/destinations?${query.toString()}`);
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        setDestinationOptions([]);
        return;
      }

      setDestinationOptions(Array.isArray(payload.data) ? payload.data : []);
    } catch (err) {
      setDestinationOptions([]);
    }
  };

  const handleOriginChange = (value) => {
    setOrigin(value);
    setDestination("");
    fetchDestinations(value);
  };

  const totalAmount = useMemo(() => {
    const seatPrice = selectedTrip?.vehicle?.seat_price || 0;
    return seatPrice * selectedSeats.length;
  }, [selectedSeats.length, selectedTrip]);

  const resetTripState = () => {
    setTrips([]);
    setSelectedTrip(null);
    setSeats([]);
    setSelectedSeats([]);
    setSearched(false);
    setCustomerStep("search");
  };

  const handleLogout = () => {
    setSession(null);
    setAuthMode("login");
    setAuthPassword("");
    setError("");
    setSuccessMessage("Đã đăng xuất.");
    resetTripState();
  };

  const submitCustomerAuth = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!authEmail.trim() || !authPassword) {
      setError("Vui lòng nhập email và mật khẩu.");
      return false;
    }

    if (authMode === "register" && (!authName.trim() || !authPhone.trim())) {
      setError("Vui lòng nhập họ tên và số điện thoại để đăng ký.");
      return false;
    }

    setAuthLoading(true);
    try {
      const endpoint = authMode === "register" ? "/auth/register" : "/auth/login";
      const payload =
        authMode === "register"
          ? {
              customer_name: authName.trim(),
              phone_number: authPhone.trim(),
              email: authEmail.trim(),
              password: authPassword,
            }
          : {
              email: authEmail.trim(),
              password: authPassword,
            };

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Xác thực thất bại.");
      }

      const customer = result.data?.customer;
      setSession({
        role: "customer",
        profile: customer || null,
        token: null,
      });
      setCustomerName(customer?.customer_name || "");
      setPhoneNumber(customer?.phone_number || "");
      setEmail(customer?.email || "");

      setSuccessMessage(
        authMode === "register"
          ? "Đăng ký thành công. Khung xác thực email đã sẵn sàng (chưa kích hoạt gửi email)."
          : "Đăng nhập thành công."
      );
      setAuthPassword("");
      return true;
    } catch (requestError) {
      setError(requestError.message || "Đã có lỗi khi xác thực tài khoản.");
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const submitDispatcherAuth = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!authEmail.trim() || !authPassword) {
      setError("Vui lòng nhập email và mật khẩu.");
      return;
    }

    setAuthLoading(true);
    try {
      const response = await fetch(`${API_BASE}/dispatcher/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: authEmail.trim(),
          password: authPassword,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Đăng nhập điều phối thất bại.");
      }

      const dispatcher = result.data?.dispatcher;
      setSession({
        role: "dispatcher",
        profile: dispatcher || null,
        token: result.data?.token || null,
      });
      setSuccessMessage("Đăng nhập điều phối thành công.");
      setAuthPassword("");
    } catch (requestError) {
      setError(requestError.message || "Đã có lỗi khi đăng nhập điều phối.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setSelectedTrip(null);
    setSeats([]);
    setSelectedSeats([]);

    if (!origin.trim() || !destination.trim()) {
      setError("Vui lòng nhập điểm đi và điểm đến.");
      return;
    }

    if (!date) {
      setError("Vui lòng chọn ngày.");
      return;
    }

    setSearched(true);

    setLoadingTrips(true);
    try {
      const query = new URLSearchParams({
        origin: origin.trim(),
        destination: destination.trim(),
      });

      const response = await fetch(`${API_BASE}/trips/search?${query.toString()}`);
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Không thể tìm chuyến.");
      }

      setTrips(payload.data || []);
      setCustomerStep("booking");
    } catch (requestError) {
      setTrips([]);
      setError(requestError.message || "Đã có lỗi khi tìm chuyến.");
    } finally {
      setLoadingTrips(false);
    }
  };

  const loadSeats = async (trip) => {
    setLoadingSeats(true);
    setError("");
    setSuccessMessage("");
    setSelectedSeats([]);

    try {
      const response = await fetch(`${API_BASE}/trips/${trip._id}/seats`);
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Không thể tải danh sách ghế.");
      }

      setSelectedTrip(trip);
      setSeats(payload.data?.seats || []);
    } catch (requestError) {
      setSelectedTrip(null);
      setSeats([]);
      setError(requestError.message || "Đã có lỗi khi tải danh sách ghế.");
    } finally {
      setLoadingSeats(false);
    }
  };

  const toggleSeat = (seatNumber) => {
    setSelectedSeats((currentSeats) => {
      if (currentSeats.includes(seatNumber)) {
        return currentSeats.filter((seat) => seat !== seatNumber);
      }

      return [...currentSeats, seatNumber].sort((a, b) => a - b);
    });
  };

  const submitBooking = async (event) => {
    if (event && event.preventDefault) event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!selectedTrip) {
      setError("Bạn chưa chọn chuyến đi.");
      return;
    }

    if (selectedSeats.length === 0) {
      setError("Vui lòng chọn ít nhất 1 ghế.");
      return;
    }

    if (!customerName.trim() || !phoneNumber.trim()) {
      setError("Vui lòng nhập tên và số điện thoại.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trip_id: selectedTrip._id,
          seat_numbers: selectedSeats,
          customer: {
            customer_name: customerName.trim(),
            phone_number: phoneNumber.trim(),
            ...(email.trim() ? { email: email.trim() } : {}),
          },
          payment: {
            payment_type: "online",
          },
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Đặt vé không thành công.");
      }

      setSuccessMessage("Đặt vé thành công. Vé đã được lưu vào hệ thống.");
      setSelectedSeats([]);
      await loadSeats(selectedTrip);
      return true;
    } catch (requestError) {
      setError(requestError.message || "Đã có lỗi khi đặt vé.");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  if (isDispatcherRoute) {
    if (session?.role === "dispatcher") {
      return (
        <DispatcherDashboardPage
          session={session}
          handleLogout={handleLogout}
          error={error}
          successMessage={successMessage}
        />
      );
    }

    return (
      <DispatcherLoginPage
        submitDispatcherAuth={submitDispatcherAuth}
        authEmail={authEmail}
        setAuthEmail={setAuthEmail}
        authPassword={authPassword}
        setAuthPassword={setAuthPassword}
        authLoading={authLoading}
        error={error}
        successMessage={successMessage}
      />
    );
  }

  return (
    customerStep === "search" ? (
      <CustomerPage
        session={session}
        handleLogout={handleLogout}
        authMode={authMode}
        setAuthMode={setAuthMode}
        authLoading={authLoading}
        authName={authName}
        setAuthName={setAuthName}
        authPhone={authPhone}
        setAuthPhone={setAuthPhone}
        authEmail={authEmail}
        setAuthEmail={setAuthEmail}
        authPassword={authPassword}
        setAuthPassword={setAuthPassword}
        submitCustomerAuth={submitCustomerAuth}
        origin={origin}
        setOrigin={setOrigin}
        date={date}
        setDate={setDate}
        destination={destination}
        setDestination={setDestination}
        handleSearch={handleSearch}
        loadingTrips={loadingTrips}
        routePoints={routePoints}
        destinationOptions={destinationOptions}
        handleOriginChange={handleOriginChange}
        error={error}
        successMessage={successMessage}
      />
    ) : (
      <CustomerBookingPage
        session={session}
        handleLogout={handleLogout}
        handleBackToSearch={() => {
          setCustomerStep("search");
          setError("");
          setSuccessMessage("");
        }}
        origin={origin}
        date={date}
        destination={destination}
        searched={searched}
        trips={trips}
        selectedTrip={selectedTrip}
        loadSeats={loadSeats}
        loadingSeats={loadingSeats}
        seats={seats}
        selectedSeats={selectedSeats}
        toggleSeat={toggleSeat}
        customerName={customerName}
        setCustomerName={setCustomerName}
        phoneNumber={phoneNumber}
        setPhoneNumber={setPhoneNumber}
        email={email}
        setEmail={setEmail}
        submitBooking={submitBooking}
        submitting={submitting}
        totalAmount={totalAmount}
        error={error}
        successMessage={successMessage}
        formatMoney={formatMoney}
      />
    )
  );
}

export default App;
