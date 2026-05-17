const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
    {
        vehicle_type: {
            type: String,
            required: [true, "Vehicle type is required"],
            trim: true,
            enum: ["Ghế ngồi", "Giường nằm", "Limousine"]
        },
        total_seats: {
            type: Number,
            required: [true, "Total seats is required"],
            min: [1, "Total seats must be at least 1"],
            max: [45, "Total seats must be at most 45"]
        },
        license_plate: {
            type: String,
            required: [true, "License plate is required"],
            trim: true,
            unique: true
        },
        seat_price:{
            type: Number,
            required: [true, "Seat price is required"],
            min: [0, "Seat price must be at least 0"]
        }
    },
    {
        timestamps: true,
        collection: 'vehicles'
    }
);

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;