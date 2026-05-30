const express = require("express");
const { searchTrips, getTripSeats, createTrip, listTrips } = require("../controllers/trip-controller");
const { createBooking } = require("../controllers/booking-controller");
const { register, login } = require("../controllers/auth-controller");
const { register: dispatcherRegister, login: dispatcherLogin } = require('../controllers/dispatcher-auth-controller');
const { getPointSuggestions } = require("../controllers/route-controller");
const { getDestinationsForOrigin } = require("../controllers/route-controller");
const { listVehicles } = require('../controllers/vehicle-controller');
const { listOperators } = require('../controllers/operator-controller');
const { authMiddleware, requireRole } = require('../middlewares/auth-middleware');

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TicketBooking API router is mounted",
  });
});

router.post("/trips", createTrip);
router.get("/trips/search", searchTrips);
router.get('/trips', listTrips);
router.get("/trips/:tripId/seats", getTripSeats);
router.get("/routes/points", getPointSuggestions);
router.get("/routes/destinations", getDestinationsForOrigin);
router.get('/vehicles', listVehicles);
router.get('/operators', listOperators);
router.post("/bookings", createBooking);
router.post("/auth/register", register);
router.post("/auth/login", login);

// dispatcher auth
router.post('/dispatcher/register', dispatcherRegister);
router.post('/dispatcher/login', dispatcherLogin);

// example protected dispatcher route (CRUD endpoints to be added later)
router.get('/dispatcher/me', authMiddleware, requireRole('dispatcher'), (req, res) => {
  return res.status(200).json({ success: true, data: { dispatcher: req.dispatcher || null } });
});

module.exports = router;
