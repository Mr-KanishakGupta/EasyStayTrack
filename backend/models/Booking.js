const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
    {
        property_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Property",
            required: true,
        },
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        owner_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        message: {
            type: String,
        },
        phone: {
            type: String,
        },
        booking_date: {
            type: Date,
        },
        duration: {
            type: Number, // Duration in months
        },
        special_requests: {
            type: String,
        },
        status: {
            type: String,
            enum: ["pending", "confirmed", "rejected", "cancelled"],
            default: "pending",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);