const mongoose = require("mongoose");
const Trip = require("../models/trip-model");

class TripRepository {
  async create(tripData) {
    return Trip.create(tripData);
  }

  async findById(tripId) {
    return Trip.findById(tripId)
      .populate("route")
      .populate("vehicle")
      .populate("driver")
      .populate("assistant");
  }

  async findAll(filter = {}, options = {}) {
    const { skip = 0, limit = 10, sort = { departure_time: 1 } } = options;
    return Trip.find(filter)
      .populate("route")
      .populate("vehicle")
      .populate("driver")
      .populate("assistant")
      .skip(skip)
      .limit(limit)
      .sort(sort);
  }

  async findByRouteIds(routeIds) {
    return Trip.find({
      route: { $in: routeIds },
    })
      .populate("route")
      .populate("vehicle")
      .populate("driver")
      .populate("assistant")
      .sort({ departure_time: 1 });
  }

  async findByRoute(routeId) {
    return Trip.find({ route: routeId })
      .populate("route")
      .populate("vehicle")
      .populate("driver")
      .populate("assistant")
      .sort({ departure_time: 1 });
  }

  async findByVehicle(vehicleId) {
    return Trip.find({ vehicle: vehicleId })
      .populate("route")
      .populate("vehicle")
      .populate("driver")
      .populate("assistant")
      .sort({ departure_time: 1 });
  }

  async update(id, updateData) {
    return Trip.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("route")
      .populate("vehicle")
      .populate("driver")
      .populate("assistant");
  }

  async delete(id) {
    return Trip.findByIdAndDelete(id);
  }

  async count(filter = {}) {
    return Trip.countDocuments(filter);
  }

  async save(trip) {
    return trip.save();
  }
}

module.exports = new TripRepository();
