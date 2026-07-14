const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    booked_at: {
      type: Date,
      required: [true, "Booked at is required"],
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: ["pending", "paid", "cancelled", "expired"],
      default: "pending",
    },
    tickets: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Ticket",
        },
      ],
      default: [],
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: [true, "Trip is required"],
    },
  },
  {
    timestamps: true,
    collection: "orders",
  }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;