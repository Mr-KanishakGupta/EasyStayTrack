const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        otp: {
            type: String,
            required: true,
        },
        expires_at: {
            type: Date,
            required: true,
            default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        },
        verified: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Auto-delete expired OTPs after 15 minutes
otpSchema.index({ expires_at: 1 }, { expireAfterSeconds: 900 });

module.exports = mongoose.model("OTP", otpSchema);
