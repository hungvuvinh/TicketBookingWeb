import { useMemo, useState } from "react";
import "./App.css";

const API_BASE = "http://localhost:5000/api";

function formatMoney(value = 0) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function App() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [paymentType, setPaymentType] = useState("cash");

  const totalAmount = useMemo(() => {
    const seatPrice = selectedTrip?.vehicle?.seat_price || 0;
    return seatPrice * selectedSeats.length;
  }, [selectedSeats.length, selectedTrip]);

  const handleSearch = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setSelectedTrip(null);
    setSeats([]);
    setSelectedSeats([]);

    if (!origin.trim() || !destination.trim()) {
      setError("Vui long nhap diem di va diem den.");
      return;
    }

    setLoadingTrips(true);
    try {
      const query = new URLSearchParams({
        origin: origin.trim(),
        destination: destination.trim(),
      });

      const response = await fetch(`${API_BASE}/trips/search?${query.toString()}`);
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Khong the tim chuyen.");
      }

      setTrips(payload.data || []);
    } catch (requestError) {
      setTrips([]);
      setError(requestError.message || "Da co loi khi tim chuyen.");
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
        throw new Error(payload.message || "Khong the tai danh sach ghe.");
      }

      setSelectedTrip(trip);
      setSeats(payload.data?.seats || []);
    } catch (requestError) {
      setSelectedTrip(null);
      setSeats([]);
      setError(requestError.message || "Da co loi khi tai danh sach ghe.");
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
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!selectedTrip) {
      setError("Ban chua chon chuyen di.");
      return;
    }

    if (selectedSeats.length === 0) {
      setError("Vui long chon it nhat 1 ghe.");
      return;
    }

    if (!customerName.trim() || !phoneNumber.trim()) {
      setError("Vui long nhap ten va so dien thoai.");
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
            payment_type: paymentType,
          },
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Dat ve khong thanh cong.");
      }

      setSuccessMessage("Dat ve thanh cong. Ve da duoc luu vao he thong.");
      setSelectedSeats([]);
      await loadSeats(selectedTrip);
    } catch (requestError) {
      setError(requestError.message || "Da co loi khi dat ve.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="booking-page">
      <header className="hero-card">
        <p className="eyebrow">TicketBookingWeb</p>
        <h1>Dat Ve Xe Khach</h1>
        <p>Tim chuyen di, chon ghe, va hoan tat dat ve chi trong mot man hinh.</p>
      </header>

      <section className="panel">
        <h2>1) Tim Chuyen</h2>
        <form className="search-form" onSubmit={handleSearch}>
          <label>
            Diem di
            <input value={origin} onChange={(event) => setOrigin(event.target.value)} placeholder="VD: Ha Noi" />
          </label>
          <label>
            Diem den
            <input
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder="VD: Hai Phong"
            />
          </label>
          <button type="submit" disabled={loadingTrips}>
            {loadingTrips ? "Dang tim..." : "Tim chuyen"}
          </button>
        </form>

        <div className="trip-list">
          {trips.map((trip) => {
            const isActive = selectedTrip?._id === trip._id;
            return (
              <button key={trip._id} className={`trip-card ${isActive ? "active" : ""}`} onClick={() => loadSeats(trip)} type="button">
                <p className="trip-route">
                  {trip.route?.origin} - {trip.route?.destination}
                </p>
                <p>{new Date(trip.departure_time).toLocaleString("vi-VN")}</p>
                <p>{trip.vehicle?.vehicle_type} · {formatMoney(trip.vehicle?.seat_price || 0)}/ghe</p>
              </button>
            );
          })}
          {!loadingTrips && trips.length === 0 && <p className="hint">Chua co ket qua tim chuyen.</p>}
        </div>
      </section>

      <section className="panel">
        <h2>2) Chon Ghe</h2>
        {loadingSeats && <p className="hint">Dang tai so do ghe...</p>}
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
        {!selectedTrip && <p className="hint">Chon mot chuyen de xem ghe.</p>}
      </section>

      <section className="panel">
        <h2>3) Xac Nhan Dat Ve</h2>
        <form className="checkout-form" onSubmit={submitBooking}>
          <label>
            Ho ten
            <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Nguyen Van A" />
          </label>
          <label>
            So dien thoai
            <input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="09xxxxxxxx" />
          </label>
          <label>
            Email (tuy chon)
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="abc@email.com" />
          </label>
          <label>
            Hinh thuc thanh toan
            <select value={paymentType} onChange={(event) => setPaymentType(event.target.value)}>
              <option value="cash">Tien mat</option>
              <option value="bank-transfer">Chuyen khoan</option>
              <option value="e-wallet">Vi dien tu</option>
            </select>
          </label>

          <div className="summary">
            <p>Ghe da chon: {selectedSeats.length > 0 ? selectedSeats.join(", ") : "Chua chon"}</p>
            <p>Tam tinh: {formatMoney(totalAmount)}</p>
          </div>

          <button type="submit" disabled={submitting}>
            {submitting ? "Dang dat ve..." : "Dat ve ngay"}
          </button>
        </form>
      </section>

      {error && <p className="alert error">{error}</p>}
      {successMessage && <p className="alert success">{successMessage}</p>}
    </main>
  );
}

export default App;
