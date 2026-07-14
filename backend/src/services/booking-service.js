const tripRepository = require("../repository/trip-repository");
const ticketRepository = require("../repository/ticket-repository");
const customerRepository = require("../repository/customer-repository");
const orderRepository = require("../repository/order-repository");
const paymentRepository = require("../repository/payment-repository");
const vnpayService = require("./vnpay-service");
require("../models/vehicle-model");

const getVehicleTotalSeats = (vehicle) =>
  Number(vehicle?.total_seats || vehicle?.total_seat || vehicle?._doc?.total_seat || 0);

const buildPaymentReference = () => `PAY-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

const normalizeSeatNumbers = (seatNumbers = []) => {
  if (!Array.isArray(seatNumbers)) {
    return [];
  }

  const parsed = seatNumbers
    .map((seat) => Number(seat))
    .filter((seat) => Number.isInteger(seat) && seat > 0);

  return [...new Set(parsed)].sort((a, b) => a - b);
};

class BookingService {
  async createBooking(tripId, rawSeatNumbers, customerPayload, paymentPayload) {
    const seatNumbers = normalizeSeatNumbers(rawSeatNumbers);

    if (!tripId || seatNumbers.length === 0) {
      throw new Error("trip_id and seat_numbers are required");
    }

    if (!customerPayload || !customerPayload.customer_name || !customerPayload.phone_number) {
      throw new Error("customer.customer_name and customer.phone_number are required");
    }

    if (!paymentPayload || !paymentPayload.payment_type) {
      throw new Error("payment.payment_type is required");
    }

    const trip = await tripRepository.findById(tripId);

    if (!trip) {
      throw new Error("Trip not found");
    }

    const totalSeats = getVehicleTotalSeats(trip.vehicle);
    const invalidSeats = seatNumbers.filter((seat) => seat > totalSeats);

    if (invalidSeats.length > 0) {
      const err = new Error("Some seat numbers exceed vehicle capacity");
      err.statusCode = 400;
      err.data = { invalid_seats: invalidSeats };
      throw err;
    }

    const existingTickets = await ticketRepository.findByTripAndSeatNumbers(trip._id, seatNumbers);

    const unavailableSeats = existingTickets
      .filter((ticket) => ["booked", "pending"].includes(ticket.status))
      .map((ticket) => ticket.seat_number)
      .sort((a, b) => a - b);

    if (unavailableSeats.length > 0) {
      const err = new Error("Some seats are no longer available");
      err.statusCode = 409;
      err.data = { unavailable_seats: unavailableSeats };
      throw err;
    }

    const existingSeatSet = new Set(existingTickets.map((ticket) => ticket.seat_number));
    const missingSeats = seatNumbers.filter((seat) => !existingSeatSet.has(seat));

    if (missingSeats.length > 0) {
      await ticketRepository.insertMany(
        missingSeats.map((seatNumber) => ({
          trip: trip._id,
          seat_number: seatNumber,
          status: "available",
        }))
      );
    }

    const reservedSeatNumbers = [];

    for (const seatNumber of seatNumbers) {
      const reserveResult = await ticketRepository.updateOne(
        {
          trip: trip._id,
          seat_number: seatNumber,
          status: { $in: ["available", "cancelled"] },
        },
        {
          $set: { status: "pending" },
        }
      );

      if (!reserveResult.modifiedCount) {
        if (reservedSeatNumbers.length > 0) {
          await ticketRepository.updateMany(
            {
              trip: trip._id,
              seat_number: { $in: reservedSeatNumbers },
              status: "pending",
            },
            {
              $set: { status: "available" },
            }
          );
        }

        const err = new Error(`Seat ${seatNumber} is no longer available`);
        err.statusCode = 409;
        throw err;
      }

      reservedSeatNumbers.push(seatNumber);
    }

    const reservedTickets = await ticketRepository.findPendingTickets(trip._id, seatNumbers);

    const customerPhone = String(customerPayload.phone_number).trim();
    const customerEmail = customerPayload.email ? String(customerPayload.email).trim().toLowerCase() : undefined;

    let customer = await customerRepository.findByPhoneNumber(customerPhone);

    if (!customer) {
      customer = await customerRepository.create({
        customer_name: String(customerPayload.customer_name).trim(),
        phone_number: customerPhone,
        ...(customerEmail ? { email: customerEmail } : {}),
      });
    } else {
      customer.customer_name = String(customerPayload.customer_name).trim();
      if (customerEmail) {
        customer.email = customerEmail;
      }
      await customerRepository.save(customer);
    }

    const order = await orderRepository.create({
      booked_at: new Date().toISOString(),
      customer: customer._id,
      status: "pending",
      tickets: reservedTickets.map((ticket) => ticket._id),
      trip: trip._id,
    });

    const amount = trip.vehicle.seat_price * seatNumbers.length;
    const paymentType = String(paymentPayload.payment_type).trim().toLowerCase();

    // Xác định status payment dựa trên loại thanh toán
    let paymentStatus = "success"; // Mặc định cho COD hoặc thanh toán trực tiếp
    if (paymentType === "vnpay") {
      paymentStatus = "pending"; // VNPay chưa thanh toán
    }

    const payment = await paymentRepository.create({
      amount,
      customer: customer._id,
      executed_at: new Date().toISOString(),
      order: order._id,
      payment_type: paymentType,
      reference_number:
        paymentPayload.reference_number && String(paymentPayload.reference_number).trim()
          ? String(paymentPayload.reference_number).trim()
          : buildPaymentReference(),
      status: paymentStatus,
    });

    // Nếu là thanh toán trực tiếp (COD, cash), cập nhật status ngay
    if (paymentType !== "vnpay") {
      order.status = "paid";
      await orderRepository.save(order);

      await ticketRepository.updateMany(
        {
          trip: trip._id,
          seat_number: { $in: seatNumbers },
          status: "pending",
        },
        {
          $set: { status: "booked" },
        }
      );

      const finalOrder = await orderRepository.findByIdPopulated(order._id);

      return {
        order: finalOrder,
        payment,
      };
    }

    // Nếu là VNPay, tạo payment URL
    if (paymentType === "vnpay") {
      try {
        const orderInfo = `Thanh toan ve bus - ${seatNumbers.length} ve - ${trip.origin} -> ${trip.destination}`;
        const paymentResult = vnpayService.createPaymentUrl({
          orderId: payment._id.toString(),
          amount,
          orderInfo,
          bankCode: paymentPayload.bankCode || "",
          customerEmail: customer.email || "",
          customerPhone: customer.phone_number || "",
          ipAddress: paymentPayload.ipAddress || "127.0.0.1",
        });

        // Lưu transaction ref
        payment.vnpay_transaction_id = paymentResult.transactionRef;
        await payment.save();

        console.log("[VNPay] Booking payment URL ready:", paymentResult.paymentUrl);

        // Order vẫn pending cho đến khi thanh toán thành công
        const finalOrder = await orderRepository.findByIdPopulated(order._id);

        return {
          order: finalOrder,
          payment,
          vnpay_payment_url: paymentResult.paymentUrl,
          transactionRef: paymentResult.transactionRef,
        };
      } catch (error) {
        console.error("VNPay payment creation error:", error);
        throw new Error(`Failed to create VNPay payment: ${error.message}`);
      }
    }
  }
}

module.exports = new BookingService();
