const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
	{
		seat_number: {
			type: Number,
			required: [true, "Seat number is required"],
			min: [1, "Seat number must be at least 1"],
		},
		status: {
			type: String,
			required: [true, "Status is required"],
			enum: ["available", "booked", "pending"],
			default: "available",
		},
		trip: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Trip",
			required: [true, "Trip is required"],
		},
	},
	{
		timestamps: true,
		collection: "tickets",
	}
);

ticketSchema.index({ trip: 1, seat_number: 1 }, { unique: true });

const Ticket = mongoose.model("Ticket", ticketSchema);

module.exports = Ticket;
