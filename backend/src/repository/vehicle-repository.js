const mongoose = require("mongoose");
const Vehicle = require("../models/vehicle-model");

class VehicleRepository {
  async create(vehicleData) {
    return Vehicle.create(vehicleData);
  }

  async findById(id) {
    return Vehicle.findById(id);
  }

  async findAll(filter = {}, options = {}) {
    const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options;
    return Vehicle.find(filter)
      .skip(skip)
      .limit(limit)
      .sort(sort);
  }

  async findByLicensePlate(licensePlate) {
    return Vehicle.findOne({ license_plate: licensePlate });
  }

  async findByType(vehicleType) {
    return Vehicle.find({ vehicle_type: vehicleType });
  }

  async update(id, updateData) {
    return Vehicle.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async delete(id) {
    return Vehicle.findByIdAndDelete(id);
  }

  async count(filter = {}) {
    return Vehicle.countDocuments(filter);
  }

  async save(vehicle) {
    return vehicle.save();
  }
}

module.exports = new VehicleRepository();
