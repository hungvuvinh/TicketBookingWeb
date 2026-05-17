const mongoose = require("mongoose");
const Payment = require("../models/payment-model");

class PaymentRepository {
  async create(paymentData) {
    return Payment.create(paymentData);
  }

  async findById(id) {
    return Payment.findById(id)
      .populate("customer")
      .populate("order");
  }

  async findAll(filter = {}, options = {}) {
    const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options;
    return Payment.find(filter)
      .populate("customer")
      .populate("order")
      .skip(skip)
      .limit(limit)
      .sort(sort);
  }

  async findByOrder(orderId) {
    return Payment.find({ order: orderId })
      .populate("customer")
      .populate("order");
  }

  async findByCustomer(customerId) {
    return Payment.find({ customer: customerId })
      .populate("customer")
      .populate("order");
  }

  async findByStatus(status, options = {}) {
    const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options;
    return Payment.find({ status })
      .populate("customer")
      .populate("order")
      .skip(skip)
      .limit(limit)
      .sort(sort);
  }

  async findByReferenceNumber(referenceNumber) {
    return Payment.findOne({ reference_number: referenceNumber })
      .populate("customer")
      .populate("order");
  }

  async update(id, updateData) {
    return Payment.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("customer")
      .populate("order");
  }

  async delete(id) {
    return Payment.findByIdAndDelete(id);
  }

  async count(filter = {}) {
    return Payment.countDocuments(filter);
  }

  async save(payment) {
    return payment.save();
  }
}

module.exports = new PaymentRepository();
