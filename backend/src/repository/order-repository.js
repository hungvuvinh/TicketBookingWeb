const mongoose = require("mongoose");
const Order = require("../models/order-model");

class OrderRepository {
  async create(orderData) {
    return Order.create(orderData);
  }

  async findById(id) {
    return Order.findById(id)
      .populate("customer")
      .populate({
        path: "trip",
        populate: [
          { path: "route" },
          { path: "vehicle" },
        ],
      })
      .populate("tickets");
  }

  async findAll(filter = {}, options = {}) {
    const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options;
    return Order.find(filter)
      .populate("customer")
      .populate({
        path: "trip",
        populate: [
          { path: "route" },
          { path: "vehicle" },
        ],
      })
      .populate("tickets")
      .skip(skip)
      .limit(limit)
      .sort(sort);
  }

  async findByCustomer(customerId, options = {}) {
    const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options;
    return Order.find({ customer: customerId })
      .populate("customer")
      .populate({
        path: "trip",
        populate: [
          { path: "route" },
          { path: "vehicle" },
        ],
      })
      .populate("tickets")
      .skip(skip)
      .limit(limit)
      .sort(sort);
  }

  async findByTrip(tripId) {
    return Order.find({ trip: tripId })
      .populate("customer")
      .populate({
        path: "trip",
        populate: [
          { path: "route" },
          { path: "vehicle" },
        ],
      })
      .populate("tickets");
  }

  async findByStatus(status, options = {}) {
    const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options;
    return Order.find({ status })
      .populate("customer")
      .populate({
        path: "trip",
        populate: [
          { path: "route" },
          { path: "vehicle" },
        ],
      })
      .populate("tickets")
      .skip(skip)
      .limit(limit)
      .sort(sort);
  }

  async findByIdPopulated(orderId) {
    return Order.findById(orderId)
      .populate("customer")
      .populate({
        path: "trip",
        populate: [
          { path: "route" },
          { path: "vehicle" },
        ],
      })
      .populate("tickets");
  }

  async update(id, updateData) {
    return Order.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("customer")
      .populate({
        path: "trip",
        populate: [
          { path: "route" },
          { path: "vehicle" },
        ],
      })
      .populate("tickets");
  }

  async delete(id) {
    return Order.findByIdAndDelete(id);
  }

  async count(filter = {}) {
    return Order.countDocuments(filter);
  }

  async save(order) {
    return order.save();
  }
}

module.exports = new OrderRepository();
