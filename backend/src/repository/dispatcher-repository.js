const mongoose = require("mongoose");
const Dispatcher = require("../models/dispatcher-model");

class DispatcherRepository {
  async create(dispatcherData) {
    return Dispatcher.create(dispatcherData);
  }

  async findById(id) {
    return Dispatcher.findById(id);
  }

  async findAll(filter = {}, options = {}) {
    const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options;
    return Dispatcher.find(filter)
      .skip(skip)
      .limit(limit)
      .sort(sort);
  }

  async findByPhoneNumber(phoneNumber) {
    return Dispatcher.findOne({ phone_number: phoneNumber });
  }

  async findByEmail(email) {
    return Dispatcher.findOne({ email });
  }

  async findByEmailWithPassword(email) {
    return Dispatcher.findOne({ email }).select("+password_hash");
  }

  async update(id, updateData) {
    return Dispatcher.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async delete(id) {
    return Dispatcher.findByIdAndDelete(id);
  }

  async count(filter = {}) {
    return Dispatcher.countDocuments(filter);
  }

  async save(dispatcher) {
    return dispatcher.save();
  }
}

module.exports = new DispatcherRepository();
