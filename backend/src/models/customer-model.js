const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    customer_name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      minlength: [2, "Customer name must be at least 2 characters"],
      maxlength: [100, "Customer name must be at most 100 characters"],
    },
    email: {
      type: String,
      required: [false],
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    password_hash: {
      type: String,
      required: [false],
      minlength: [60, "Password hash is invalid"],
      maxlength: [60, "Password hash is invalid"],
      select: false,
    },
    email_verified: {
      type: Boolean,
      default: false,
    },
    email_verification: {
      requested_at: {
        type: Date,
      },
      token_hash: {
        type: String,
      },
      expires_at: {
        type: Date,
      },
      verified_at: {
        type: Date,
      },
    },
    phone_number: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^[0-9]{10}$/, "Phone number must be 10 digits"],
    },
  },
  {
    timestamps: true,
    collection: "customers",
  }
);

const Customer = mongoose.model("Customer", customerSchema);

module.exports = Customer;
