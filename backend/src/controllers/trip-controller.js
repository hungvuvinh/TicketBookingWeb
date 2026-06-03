const tripService = require("../services/trip-service");
const tripRepository = require("../repository/trip-repository");

const searchTrips = async (req, res) => {
  try {
    const origin = typeof req.query.origin === "string" ? req.query.origin.trim() : "";
    const destination = typeof req.query.destination === "string" ? req.query.destination.trim() : "";

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: "origin and destination are required",
      });
    }

    const trips = await tripService.searchTrips(origin, destination);

    return res.status(200).json({
      success: true,
      message: "Trips found successfully",
      data: trips,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

const getTripSeats = async (req, res) => {
  try {
    const { tripId } = req.params;

    const seatsData = await tripService.getTripSeatsMap(tripId);

    return res.status(200).json({
      success: true,
      message: "Trip seats fetched successfully",
      data: seatsData,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

const createTrip = async (req, res) => {
  try {
    const {
      route_id,
      origin,
      destination,
      travel_time,
      vehicle_id,
      driver_id,
      assistant_id,
      departure_time,
      arrival_time,
    } = req.body || {};

    const trip = await tripService.createTrip({
      routeId: route_id,
      origin,
      destination,
      travel_time,
      vehicleId: vehicle_id,
      driverId: driver_id,
      assistantId: assistant_id,
      departure_time,
      arrival_time,
    });

    return res.status(201).json({ success: true, message: "Trip created successfully", data: trip });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: error.message || "Internal server error" });
  }
};

const updateTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const {
      route_id,
      origin,
      destination,
      travel_time,
      vehicle_id,
      driver_id,
      assistant_id,
      departure_time,
      arrival_time,
    } = req.body || {};

    const trip = await tripService.updateTrip({
      tripId,
      routeId: route_id,
      origin,
      destination,
      travel_time,
      vehicleId: vehicle_id,
      driverId: driver_id,
      assistantId: assistant_id,
      departure_time,
      arrival_time,
    });

    return res.status(200).json({ success: true, message: "Trip updated successfully", data: trip });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: error.message || "Internal server error" });
  }
};

const deleteTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    await tripService.deleteTrip(tripId);

    return res.status(200).json({ success: true, message: "Trip deleted successfully" });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: error.message || "Internal server error" });
  }
};

const listTrips = async (req, res) => {
  try {
    const { skip = 0, limit = 50 } = req.query;
    const trips = await tripRepository.findAll({}, { skip: Number(skip), limit: Number(limit) });
    return res.status(200).json({ success: true, message: 'Trips fetched', data: trips });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

module.exports = {
  searchTrips,
  getTripSeats,
  createTrip,
  updateTrip,
  deleteTrip,
  listTrips,
};
