import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import CustomerPage from "./pages/CustomerPage.jsx";
import CustomerBookingPage from "./pages/CustomerBookingPage.jsx";
import CustomerTicketsPage from "./pages/CustomerTicketsPage.jsx";
import PaymentPage from "./pages/PaymentPage.jsx";
import PaymentReturnPage from "./pages/PaymentReturnPage.jsx";
import PaymentSuccessPage from "./pages/PaymentSuccessPage.jsx";
import DispatcherDashboardPage from "./pages/DispatcherDashboardPage.jsx";
import DispatcherLoginPage from "./pages/DispatcherLoginPage.jsx";
import { API_BASE } from "./config.js";
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

export default function AppRouter() {
  const [session, setSession] = useState(() => readStoredSession());
  const [authMode, setAuthMode] = useState("login");
  const [authLoading, setAuthLoading] = useState(false);
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [profileUpdating, setProfileUpdating] = useState(false);

  const [origin, setOrigin] = useState("");
  const [date, setDate] = useState("");
  const [destination, setDestination] = useState("");
  const [routePoints, setRoutePoints] = useState([]);
  const [destinationOptions, setDestinationOptions] = useState([]);
  const [searched, setSearched] = useState(false);
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
  
  const [orderData, setOrderData] = useState(null);
  const [paymentData, setPaymentData] = useState(null);

  const navigate = useNavigate();

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
        token: result.data?.accessToken || null,
        refreshToken: result.data?.refreshToken || null,
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

  const updateCustomerProfile = async (payload) => {
    if (!session?.role || session.role !== "customer") {
      setError("Bạn cần đăng nhập để cập nhật thông tin.");
      return false;
    }

    setError("");
    setSuccessMessage("");
    setProfileUpdating(true);

    try {
      const response = await fetch(`${API_BASE}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Cập nhật thông tin thất bại.");
      }

      const nextProfile = result.data?.customer || session.profile;
      setSession((currentSession) => ({
        ...(currentSession || {}),
        role: "customer",
        profile: nextProfile,
        token: currentSession?.token || null,
        refreshToken: currentSession?.refreshToken || null,
      }));
      setCustomerName(nextProfile?.customer_name || "");
      setPhoneNumber(nextProfile?.phone_number || "");
      setEmail(nextProfile?.email || "");
      setSuccessMessage("Cập nhật thông tin cá nhân thành công.");
      return true;
    } catch (requestError) {
      setError(requestError.message || "Đã có lỗi khi cập nhật thông tin.");
      return false;
    } finally {
      setProfileUpdating(false);
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
        date: date,
        });

        const response = await fetch(`${API_BASE}/trips/search?${query.toString()}`);
        const payload = await response.json();

        if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Không thể tìm chuyến.");
        }

        setTrips(payload.data || []);
        navigate('/booking');
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

  const submitBooking = async (paymentMethod = "vnpay") => {
    setError("");
    setSuccessMessage("");

    if (!selectedTrip) {
      setError("Bạn chưa chọn chuyến đi.");
      return false;
    }

    if (selectedSeats.length === 0) {
      setError("Vui lòng chọn ít nhất 1 ghế.");
      return false;
    }

    if (!customerName.trim() || !phoneNumber.trim()) {
      setError("Vui lòng nhập tên và số điện thoại.");
      return false;
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
            payment_type: paymentMethod,
            bankCode: "",
          },
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Đặt vé không thành công.");
      }

      // Lưu order và payment data để sử dụng trong Payment pages
      setOrderData(payload.data?.order);
      setPaymentData(payload.data?.payment);

      // Reset form
      setSelectedSeats([]);

      return {
        success: true,
        order: payload.data?.order,
        payment: payload.data?.payment,
        vnpay_payment_url: payload.data?.vnpay_payment_url,
      };
    } catch (requestError) {
      setError(requestError.message || "Đã có lỗi khi đặt vé.");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // Router logic dựa trên dispatcher route
  const isDispatcher = window.location.pathname.toLowerCase().includes("/dispatcher");

  if (isDispatcher) {
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
        setError={setError}
        setSuccessMessage={setSuccessMessage}
      />
    );
  }
  return (
    <Routes>
      {/* Customer Routes */}
      <Route
        path="/"
        element={
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
            updateCustomerProfile={updateCustomerProfile}
            profileUpdating={profileUpdating}
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
            setError={setError}
            setSuccessMessage={setSuccessMessage}
          />
        }
      />

      <Route
        path="/customer"
        element={
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
            updateCustomerProfile={updateCustomerProfile}
            profileUpdating={profileUpdating}
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
            setError={setError}
            setSuccessMessage={setSuccessMessage}
          />
        }
      />
      
      <Route
        path="/booking"
        element={
          <CustomerBookingPage
            session={session}
            handleLogout={handleLogout}
            handleBackToSearch={() => {
              setError("");
              setSuccessMessage("");
              navigate("/");
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
            setError={setError}
            setSuccessMessage={setSuccessMessage}
            formatMoney={formatMoney}
          />
        }
      />

      <Route
        path="/tickets"
        element={
          session?.role === "customer" ? (
            <CustomerTicketsPage
              session={session}
              handleLogout={handleLogout}
              error={error}
              successMessage={successMessage}
              setError={setError}
              setSuccessMessage={setSuccessMessage}
            />
            ) : (
              <Navigate to="/" replace />
            )
        }
      />

      <Route path="/payment" element={<PaymentPage />} />
      <Route path="/payment-return" element={<PaymentReturnPage />} />
      <Route path="/payment-success" element={<PaymentSuccessPage />} />

      {/* Dispatcher Route */}
      <Route path="/dispatcher" element={<Navigate to="/dispatcher/login" replace />} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
