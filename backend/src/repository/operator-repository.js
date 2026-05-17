const mongoose = require("mongoose");
const Operator = require("../models/operator-model");

class OperatorRepository {
  async create(operatorData) {
    return Operator.create(operatorData);
  }

  async findById(id) {
    return Operator.findById(id);
  }

  async findAll(filter = {}, options = {}) {
    const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options;
    return Operator.find(filter)
      .skip(skip)
      .limit(limit)
      .sort(sort);
  }

  async findByPhoneNumber(phoneNumber) {
    return Operator.findOne({ phone_number: phoneNumber });
  }

  async findByEmail(email) {
    return Operator.findOne({ email });
  }

  async findByLicense(license) {
    return Operator.findOne({ license });
  }

  async findByRole(role) {
    return Operator.find({ role });
  }

  async update(id, updateData) {
    return Operator.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async delete(id) {
    return Operator.findByIdAndDelete(id);
  }

  async count(filter = {}) {
    return Operator.countDocuments(filter);
  }

  async save(operator) {
    return operator.save();
  }
}

module.exports = new OperatorRepository();
