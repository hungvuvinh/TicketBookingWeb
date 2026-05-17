const bookingService = require("../services/booking-service");

const createBooking = async (req, res) => {
  try {
    const { trip_id: tripId, seat_numbers: rawSeatNumbers, customer: customerPayload, payment: paymentPayload } = req.body;

    const result = await bookingService.createBooking(tripId, rawSeatNumbers, customerPayload, paymentPayload);

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: result,
    });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.message,
        data: error.data,
      });
    }

    if (error.statusCode === 409) {
      return res.status(409).json({
        success: false,
        message: error.message,
        data: error.data,
      });
    }

    if (error && error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate data detected while booking. Please retry.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

module.exports = {
  createBooking,
};
