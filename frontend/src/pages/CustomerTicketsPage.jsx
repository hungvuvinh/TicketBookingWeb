import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Alert from "../components/Alert.jsx";


const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function formatMoney(value = 0) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadgeColor(status) {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "cancelled":
    case "expired":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getStatusText(status) {
  const statusMap = {
    paid: "Đã thanh toán",
    pending: "Chờ xử lý",
    cancelled: "Đã hủy",
    expired: "Hết hạn",
  };
  return statusMap[status] || status;
}

export default function CustomerTicketsPage({
  session,
  handleLogout,
  error,
  successMessage,
  setError,
  setSuccessMessage,
}) {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    if (!session?.role || session.role !== "customer") {
      navigate("/");
    }
  }, [session?.role, navigate]);

  useEffect(() => {
    const customerId = session?.profile?.customer_id;
    const role = session?.role;

    if (!customerId || role !== "customer") {
      return;
    }

    setLoading(true);
    fetch(`${API_BASE}/tickets/customer/${customerId}`)
      .then((response) => response.json())
      .then((result) => {
        if (result.success) {
          setTickets(result.data.tickets || []);
        }
      })
      .catch((err) => console.error("Error fetching tickets:", err))
      .finally(() => setLoading(false));
  }, [session?.profile?.customer_id, session?.role]);

  const filteredTickets =
    filterStatus === "all"
      ? tickets
      : tickets.filter((ticket) => {
          const orderStatus = ticket.order_status || ticket.order?.status || ticket.status;
          return orderStatus === filterStatus;
        });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar tagline="Quản lý vé của tôi">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => navigate("/customer")}
        >
          Đặt vé mới
        </button>
        {session ? (
          <button
            type="button"
            className="btn-ghost"
            onClick={handleLogout}
          >
            Đăng xuất
          </button>
        ) : null}
      </Navbar>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vé của tôi</h1>
          <p className="text-gray-600">Quản lý và xem chi tiết các vé đã đặt</p>
        </div>

        {/* Alert Messages */}
        {error ? (
          <Alert type="error" open={Boolean(error)} onClose={() => setError("")} message={error} />
        ) : null}
        {successMessage ? (
          <Alert type="success" open={Boolean(successMessage)} onClose={() => setSuccessMessage("")} message={successMessage} />
        ) : null}

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === "all"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
            }`}
          >
            Tất cả ({tickets.length})
          </button>
          <button
            onClick={() => setFilterStatus("paid")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === "paid"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
            }`}
          >
            Đã thanh toán ({tickets.filter((t) => (t.order_status || t.order?.status || t.status) === "paid").length})
          </button>

          <button
            onClick={() => setFilterStatus("expired")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === "expired"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
            }`}
          >
            Hết hạn ({tickets.filter((t) => (t.order_status || t.order?.status || t.status) === "expired").length})
          </button>
          <button
            onClick={() => setFilterStatus("pending")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === "pending"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
            }`}
          >
            Chờ xử lý ({tickets.filter((t) => (t.order_status || t.order?.status || t.status) === "pending").length})
          </button>
          <button
            onClick={() => setFilterStatus("cancelled")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === "cancelled"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
            }`}
          >
            Đã hủy ({tickets.filter((t) => (t.order_status || t.order?.status || t.status) === "cancelled").length})
          </button>
        </div>

        {/* Tickets List or Empty State */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Đang tải vé...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-gray-600 text-lg">Không có vé nào</p>
            <p className="text-gray-500 text-sm mt-2">
              Hãy đặt vé để bắt đầu hành trình của bạn
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.ticket_id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer"
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="p-6">
                  {/* Trip Info */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Điểm đi</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {ticket.trip.origin}
                          </p>
                        </div>
                        <svg
                          className="w-6 h-6 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                        <div>
                          <p className="text-sm text-gray-600">Điểm đến</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {ticket.trip.destination}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                          ticket.order_status || ticket.order?.status || ticket.status
                        )}`}
                      >
                        {getStatusText(ticket.order_status || ticket.order?.status || ticket.status)}
                      </span>
                    </div>
                  </div>

                  {/* Seat and Time Info */}
                  <div className="grid grid-cols-3 gap-4 mb-4 pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-sm text-gray-600">Ghế</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {ticket.seat_number}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Khởi hành</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatDate(ticket.trip.departure_time)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Giá</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {formatMoney(ticket.trip.price)}
                      </p>
                    </div>
                  </div>

                  {/* Order Info */}
                  <div className="pt-4 border-t border-gray-200 text-xs text-gray-600">
                    <p>Mã đơn hàng: {ticket.order_id}</p>
                    <p>Đặt lúc: {formatDate(ticket.booked_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Chi tiết vé
                </h2>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Trip Details */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Thông tin chuyến đi
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Điểm đi</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedTicket.trip.origin}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Điểm đến</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedTicket.trip.destination}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Khởi hành</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatDate(selectedTicket.trip.departure_time)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Dự kiến đến</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatDate(selectedTicket.trip.arrival_time)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ticket Details */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Thông tin vé
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Số ghế</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedTicket.seat_number}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Trạng thái</p>
                      <p className="text-lg font-semibold">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                            selectedTicket.order_status || selectedTicket.order?.status || selectedTicket.status
                          )}`}
                        >
                          {getStatusText(selectedTicket.order_status || selectedTicket.order?.status || selectedTicket.status)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Giá</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {formatMoney(selectedTicket.trip.price)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Mã vé</p>
                      <p className="text-lg font-semibold text-gray-900 font-mono">
                        {selectedTicket.ticket_id}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Thông tin đơn hàng
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Mã đơn hàng</p>
                      <p className="text-lg font-semibold text-gray-900 font-mono">
                        {selectedTicket.order_id}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Trạng thái đơn</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {getStatusText(selectedTicket.order_status || selectedTicket.order?.status || selectedTicket.status)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Ngày đặt</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatDate(selectedTicket.booked_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
