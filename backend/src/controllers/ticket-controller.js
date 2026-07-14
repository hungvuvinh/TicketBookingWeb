const orderRepository = require("../repository/order-repository");

class TicketController {
  async getCustomerTickets(req, res) {
    try {
      const { customerId } = req.params;

      if (!customerId) {
        return res.status(400).json({
          success: false,
          message: "customerId is required",
        });
      }

      // Lấy tất cả orders của khách hàng (chỉ lấy những order đã thanh toán hoặc confirmed)
      const orders = await orderRepository.findByCustomer(customerId, {
        skip: 0,
        limit: 100,
        sort: { createdAt: -1 },
      });

      if (!orders || orders.length === 0) {
        return res.status(200).json({
          success: true,
          message: "Khách hàng chưa có vé nào",
          data: {
            tickets: [],
          },
        });
      }

      // Format tickets từ orders và loại bỏ duplicate ticket_id
      const ticketsMap = new Map();
      orders.forEach((order) => {
        if (order.tickets && order.tickets.length > 0) {
          order.tickets.forEach((ticket) => {
            const ticketId = ticket._id.toString();
            if (!ticketsMap.has(ticketId)) {
              ticketsMap.set(ticketId, {
                ticket_id: ticket._id,
                seat_number: ticket.seat_number,
                // Use order status as the ticket's effective status
                status: order.status,
                trip: {
                  trip_id: order.trip?._id,
                  origin: order.trip?.route?.origin || null,
                  destination: order.trip?.route?.destination || null,
                  departure_time: order.trip?.departure_time,
                  arrival_time: order.trip?.arrival_time,
                  price: order.trip?.vehicle?.seat_price || 0,
                },
                order_id: order._id,
                booked_at: order.booked_at,
                order_status: order.status,
                created_at: ticket.createdAt,
              });
            }
          });
        }
      });
      const tickets = Array.from(ticketsMap.values());

      return res.status(200).json({
        success: true,
        message: "Lấy vé thành công",
        data: {
          tickets,
          total: tickets.length,
        },
      });
    } catch (error) {
      console.error("Error getting customer tickets:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Lỗi khi lấy vé khách hàng",
      });
    }
  }

  async getTicketDetails(req, res) {
    try {
      const { ticketId } = req.params;

      if (!ticketId) {
        return res.status(400).json({
          success: false,
          message: "ticketId is required",
        });
      }

      // Lấy order chứa ticket này
      const orders = await orderRepository.findAll({});
      let ticketDetail = null;

      for (const order of orders) {
        const ticket = order.tickets?.find((t) => t._id.toString() === ticketId);
        if (ticket) {
            ticketDetail = {
            ticket_id: ticket._id,
            seat_number: ticket.seat_number,
            // Report the order status as the ticket's status
            status: order.status,
            trip: {
              trip_id: order.trip?._id,
              origin: order.trip?.route?.origin || null,
              destination: order.trip?.route?.destination || null,
              departure_time: order.trip?.departure_time,
              arrival_time: order.trip?.arrival_time,
              price: order.trip?.vehicle?.seat_price || 0,
            },
            order_id: order._id,
            customer: order.customer,
            booked_at: order.booked_at,
            order_status: order.status,
            created_at: ticket.createdAt,
          };
          break;
        }
      }

      if (!ticketDetail) {
        return res.status(404).json({
          success: false,
          message: "Vé không tìm thấy",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Lấy chi tiết vé thành công",
        data: ticketDetail,
      });
    } catch (error) {
      console.error("Error getting ticket details:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Lỗi khi lấy chi tiết vé",
      });
    }
  }
}

module.exports = new TicketController();
