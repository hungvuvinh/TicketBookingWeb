const mongoose = require("mongoose");
const Ticket = require("../models/ticket-model");

class TicketRepository {
  async create(ticketData) {
    return Ticket.create(ticketData);
  }

  async findById(id) {
    return Ticket.findById(id)
      .populate("trip");
  }

  async findAll(filter = {}, options = {}) {
    const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options;
    return Ticket.find(filter)
      .populate("trip")
      .skip(skip)
      .limit(limit)
      .sort(sort);
  }

  async findByTrip(tripId) {
    return Ticket.find({ trip: tripId }).select("seat_number status");
  }

  async findByTripAndSeatNumbers(tripId, seatNumbers) {
    return Ticket.find({
      trip: tripId,
      seat_number: { $in: seatNumbers },
    });
  }

  async findPendingTickets(tripId, seatNumbers) {
    return Ticket.find({
      trip: tripId,
      seat_number: { $in: seatNumbers },
      status: "pending",
    });
  }

  async findByStatus(tripId, status) {
    return Ticket.find({
      trip: tripId,
      status,
    });
  }

  async insertMany(tickets) {
    return Ticket.insertMany(tickets);
  }

  async updateOne(filter, update) {
    return Ticket.updateOne(filter, update);
  }

  async updateMany(filter, update) {
    return Ticket.updateMany(filter, update);
  }

  async update(id, updateData) {
    return Ticket.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("trip");
  }

  async delete(id) {
    return Ticket.findByIdAndDelete(id);
  }

  async deleteMany(filter) {
    return Ticket.deleteMany(filter);
  }

  async count(filter = {}) {
    return Ticket.countDocuments(filter);
  }

  async save(ticket) {
    return ticket.save();
  }
}

module.exports = new TicketRepository();
