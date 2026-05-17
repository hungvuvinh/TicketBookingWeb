const mongoose = require("mongoose");

const dispatcherSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: [false],
			trim: true,
			lowercase: true,
			unique: true,
			match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
		},
		name: {
			type: String,
			required: [true, "Name is required"],
			trim: true,
			minlength: [2, "Name must be at least 2 characters"],
			maxlength: [100, "Name must be at most 100 characters"],
		},
		phone_number: {
			type: String,
			required: [true, "Phone number is required"],
			trim: true,
			unique: true,
			match: [/^[0-9]{10}$/, "Phone number must be 10 digits"],
		},
	},
	{
		timestamps: true,
		collection: "dispatchers",
	}
);

const Dispatcher = mongoose.model("Dispatcher", dispatcherSchema);

module.exports = Dispatcher;
