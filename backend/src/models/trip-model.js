const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
	{
		route: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Route",
			required: [true, "Route is required"],
		},
		vehicle: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Vehicle",
			required: [true, "Vehicle is required"],
		},
		driver: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Operator",
			required: [true, "Driver is required"],
		},
		assistant: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Operator",
			required: [true, "Assistant is required"],
		},
		departure_time: {
			type: Date,
			required: [true, "Departure time is required"],
		},
		arrival_time: {
			type: Date,
			required: [true, "Arrival time is required"],
		},
	},
	{
		timestamps: true,
		collection: "trips",
	}
);

tripSchema.pre("validate", function (next) {
	if (
		this.driver &&
		this.assistant &&
		this.driver.toString() === this.assistant.toString()
	) {
		return next(new Error("Driver and assistant must be different operators"));
	}

	if (
		this.departure_time &&
		this.arrival_time &&
		this.arrival_time <= this.departure_time
	) {
		return next(new Error("Arrival time must be later than departure time"));
	}

	return next();
});

const Trip = mongoose.model("Trip", tripSchema);

module.exports = Trip;
