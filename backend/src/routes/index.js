const express = require("express");
const { searchTrips, getTripSeats } = require("../controllers/trip-controller");
const { createBooking } = require("../controllers/booking-controller");

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TicketBooking API router is mounted",
  });
});

router.get("/trips/search", searchTrips);
router.get("/trips/:tripId/seats", getTripSeats);
router.post("/bookings", createBooking);

module.exports = router;
