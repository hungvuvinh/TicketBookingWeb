const mongoose = require("mongoose");
const Customer = require("../models/customer-model");

class CustomerRepository {
  async create(customerData) {
    return Customer.create(customerData);
  }

  async findById(id) {
    return Customer.findById(id);
  }

  async findAll(filter = {}, options = {}) {
    const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options;
    return Customer.find(filter)
      .skip(skip)
      .limit(limit)
      .sort(sort);
  }

  async findByPhoneNumber(phoneNumber) {
    return Customer.findOne({ phone_number: phoneNumber });
  }

  async findByEmail(email) {
    return Customer.findOne({ email });
  }

  async update(id, updateData) {
    return Customer.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async delete(id) {
    return Customer.findByIdAndDelete(id);
  }

  async count(filter = {}) {
    return Customer.countDocuments(filter);
  }

  async save(customer) {
    return customer.save();
  }
}

module.exports = new CustomerRepository();
