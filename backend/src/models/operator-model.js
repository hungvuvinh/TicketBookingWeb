const mongoose = require("mongoose");

const operatorSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Operator name is required"],
            trim: true,
            minlength: [2, "Operator name must be at least 2 characters"],
            maxlength: [100, "Operator name must be at most 100 characters"],
        },
        phone_number: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true,
            unique: true,
            match: [/^[0-9]{10}$/, "Phone number must be 10 digits"],
        },
        email: {
            type: String,
            required: [false],
            trim: true,
            lowercase: true,
            unique: true,
            match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
        },
        role: {
            type: String,
            required: [true, "Role is required"],
            enum: ["driver", "assistant"],
        },
        license: {
            type: String,
            required: [
                function () {
                    return this.role === "driver";
                },
                "License is required when role is driver",
            ],
            trim: true,
            unique: true,
            sparse: true,
        },
    },
    {
        timestamps: true,
        collection: "operators",
    }
);

const Operator = mongoose.model("Operator", operatorSchema);

module.exports = Operator;