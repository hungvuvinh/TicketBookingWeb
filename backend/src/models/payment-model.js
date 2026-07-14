const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
	{
		amount: {
			type: Number,
			required: [true, "Amount is required"],
			min: [0, "Amount must be at least 0"],
		},
		customer: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Customer",
			required: [true, "Customer is required"],
		},
		executed_at: {
			type: String,
			required: [true, "Executed at is required"],
		},
		order: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Order",
			required: [true, "Order is required"],
		},
		payment_type: {
			type: String,
			required: [true, "Payment type is required"],
			trim: true,
		},
		reference_number: {
			type: String,
			required: [true, "Reference number is required"],
			trim: true,
			unique: true,
		},
		status: {
			type: String,
			required: [true, "Status is required"],
			enum: ["pending", "success", "failed", "refunded"],
			default: "pending",
		},
		vnpay_transaction_id: {
			type: String,
			trim: true,
		},
		vnpay_response_code: {
			type: String,
			trim: true,
		},
		bank_code: {
			type: String,
			trim: true,
		}
	},
	{
		timestamps: true,
		collection: "payments",
	}
);

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
