const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema(
    {
        origin: {
            type: String,
            required: [true, 'Origin is required'],
            trim: true,
            minlength: [2, 'Origin must be at least 2 characters'],
            maxlength: [100, 'Origin must be at most 100 characters'],
        },
        destination: {
            type: String,
            required: [true, 'Destination is required'],
            trim: true,
            minlength: [2, 'Destination must be at least 2 characters'],
            maxlength: [100, 'Destination must be at most 100 characters'],
        },
        travel_time: {
            type: Number,
            required: [true, 'Travel time is required'],
            min: [1, 'Travel time must be at least 1 minute']
        }
    },
    {
        timestamps: true,
        collection: 'routes'
    }
);

const Route = mongoose.model('Route', routeSchema);

module.exports = Route;