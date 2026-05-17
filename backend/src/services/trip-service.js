const tripRepository = require("../repository/trip-repository");
const routeRepository = require("../repository/route-repository");
const ticketRepository = require("../repository/ticket-repository");
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
}

module.exports = new TripService();
