const express = require("express");
const { searchTrips, getTripSeats, createTrip, updateTrip, deleteTrip, listTrips } = require("../controllers/trip-controller");
const { createBooking } = require("../controllers/booking-controller");
const { register, login } = require("../controllers/auth-controller");
const { register: dispatcherRegister, login: dispatcherLogin } = require('../controllers/dispatcher-auth-controller');
const { getPointSuggestions, getDestinationsForOrigin, listRoutes, createRoute, updateRoute, deleteRoute } = require("../controllers/route-controller");
const { listVehicles, createVehicle, updateVehicle, deleteVehicle } = require('../controllers/vehicle-controller');
const { listOperators, createOperator, updateOperator, deleteOperator } = require('../controllers/operator-controller');
const { authMiddleware, requireRole } = require('../middlewares/auth-middleware');

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TicketBooking API router is mounted",
  });
});

router.post("/trips", createTrip);
router.put("/trips/:tripId", updateTrip);
router.delete("/trips/:tripId", deleteTrip);
router.get("/trips/search", searchTrips);
router.get('/trips', listTrips);
router.get("/trips/:tripId/seats", getTripSeats);
router.get("/routes/points", getPointSuggestions);
router.get("/routes/destinations", getDestinationsForOrigin);
router.get("/routes", listRoutes);
router.post("/routes", createRoute);
router.put("/routes/:routeId", updateRoute);
router.delete("/routes/:routeId", deleteRoute);
router.get('/vehicles', listVehicles);
router.post('/vehicles', createVehicle);
router.put('/vehicles/:vehicleId', updateVehicle);
router.delete('/vehicles/:vehicleId', deleteVehicle);
router.get('/operators', listOperators);
router.post('/operators', createOperator);
router.put('/operators/:operatorId', updateOperator);
router.delete('/operators/:operatorId', deleteOperator);
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
