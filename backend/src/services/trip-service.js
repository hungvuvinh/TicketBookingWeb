const tripRepository = require("../repository/trip-repository");
const routeRepository = require("../repository/route-repository");
const ticketRepository = require("../repository/ticket-repository");
const vehicleRepository = require("../repository/vehicle-repository");
const operatorRepository = require("../repository/operator-repository");
require("../models/vehicle-model");

const getVehicleTotalSeats = (vehicle) => {
  if (!vehicle) {
    return 0;
  }

  const fromSchema = vehicle.total_seats;
  const fromLegacyPath = vehicle.total_seat;
  const fromRawDoc = vehicle?._doc?.total_seat;

  return Number(fromSchema || fromLegacyPath || fromRawDoc || 0);
};

class TripService {
  async searchTrips(origin, destination) {
    if (!origin || !destination) {
      throw new Error("Origin and destination are required");
    }

    const routeIds = await routeRepository.findByOriginDestination(origin, destination);

    if (routeIds.length === 0) {
      return [];
    }

    return tripRepository.findByRouteIds(routeIds.map((route) => route._id));
  }

  async getTripSeatsMap(tripId) {
    const trip = await tripRepository.findById(tripId);

    if (!trip) {
      throw new Error("Trip not found");
    }

    const totalSeats = getVehicleTotalSeats(trip.vehicle);

    if (!totalSeats) {
      throw new Error("Trip vehicle does not have total seats configured");
    }

    const tickets = await ticketRepository.findByTrip(trip._id);

    const ticketBySeat = new Map();
    tickets.forEach((ticket) => {
      ticketBySeat.set(ticket.seat_number, ticket.status);
    });

    const seats = [];
    for (let seatNumber = 1; seatNumber <= totalSeats; seatNumber += 1) {
      seats.push({
        seat_number: seatNumber,
        status: ticketBySeat.get(seatNumber) || "available",
      });
    }

    const availableCount = seats.filter((seat) => seat.status === "available").length;

    return {
      trip,
      total_seats: totalSeats,
      available_seats: availableCount,
      booked_seats: totalSeats - availableCount,
      seats,
    };
  }

  async createTrip({ routeId, origin, destination, travel_time, vehicleId, driverId, assistantId, departure_time, arrival_time }) {
    if ((!routeId && (!origin || !destination)) || !vehicleId || !driverId || !assistantId || !departure_time || !arrival_time) {
      const err = new Error("Missing required fields to create trip");
      err.statusCode = 400;
      throw err;
    }

    let route = null;
    if (routeId) {
      route = await routeRepository.findById(routeId);
    } else {
      const found = await routeRepository.findByOriginDestination(origin, destination);
      if (Array.isArray(found) && found.length > 0) {
        // findByOriginDestination returns {_id} list
        route = await routeRepository.findById(found[0]._id);
      } else {
        // create a route with provided travel_time or default 60
        const tt = Number(travel_time) || 60;
        route = await routeRepository.create({ origin: origin.trim(), destination: destination.trim(), travel_time: tt });
      }
    }

    const [vehicle, driver, assistant] = await Promise.all([
      vehicleRepository.findById(vehicleId),
      operatorRepository.findById(driverId),
      operatorRepository.findById(assistantId),
    ]);

    if (!route) {
      const err = new Error("Route not found");
      err.statusCode = 404;
      throw err;
    }

    if (!vehicle) {
      const err = new Error("Vehicle not found");
      err.statusCode = 404;
      throw err;
    }

    if (!driver || !assistant) {
      const err = new Error("Driver or assistant not found");
      err.statusCode = 404;
      throw err;
    }

    const dep = new Date(departure_time);
    if (isNaN(dep.getTime())) {
      const err = new Error("Invalid departure time");
      err.statusCode = 400;
      throw err;
    }

    let arr;
    if (arrival_time) {
      arr = new Date(arrival_time);
    } else {
      const mins = Number(travel_time) || 0;
      arr = new Date(dep.getTime() + mins * 60000);
    }

    if (isNaN(arr.getTime()) || arr <= dep) {
      const err = new Error("Invalid arrival time computed or provided");
      err.statusCode = 400;
      throw err;
    }

    // create trip
    const trip = await tripRepository.create({
      route: route._id,
      vehicle: vehicle._id,
      driver: driver._id,
      assistant: assistant._id,
      departure_time: dep,
      arrival_time: arr,
    });

    // create tickets based on vehicle.total_seats
    const totalSeats = Number(vehicle.total_seats || 0);
    if (totalSeats > 0) {
      const tickets = [];
      for (let i = 1; i <= totalSeats; i += 1) {
        tickets.push({ seat_number: i, status: "available", trip: trip._id });
      }

      try {
        await ticketRepository.insertMany(tickets);
      } catch (e) {
        // best-effort: if tickets creation fails, delete the trip to avoid orphan
        try {
          await tripRepository.delete(trip._id);
        } catch (delErr) {
          // ignore
        }
        throw new Error("Failed to create initial tickets: " + (e.message || e));
      }
    }

    // return the created trip with populated fields
    return tripRepository.findById(trip._id);
  }
}

module.exports = new TripService();
