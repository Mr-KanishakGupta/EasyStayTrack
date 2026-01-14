const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const OTP = require("../models/OTP");
const auth = require("../middleware/auth");
const { sendOTPEmail } = require("../utils/emailService");

const router = express.Router();

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// @route   POST /api/users/register
// @desc    Register a new user
// @access  Public
router.post(
    "/register",
    [
        body("email").isEmail().withMessage("Please enter a valid email"),
        body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
        body("full_name").notEmpty().withMessage("Full name is required"),
        body("phone").notEmpty().withMessage("Phone number is required"),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, password, full_name, phone, aadhaar, role } = req.body;

            // Check if user already exists
            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ error: "User already exists with this email" });
            }

            // Mask Aadhaar if provided
            let maskedAadhaar = null;
            if (aadhaar && aadhaar.length >= 4) {
                maskedAadhaar = "XXXX-XXXX-" + aadhaar.slice(-4);
            }

            // Create user
            user = new User({
                email,
                password,
                full_name,
                phone,
                aadhaar: maskedAadhaar,
                role: role || "tenant",
            });

            await user.save();

            // Generate auth token
            const token = user.generateAuthToken();

            res.status(201).json({
                message: "User registered successfully",
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    full_name: user.full_name,
                    phone: user.phone,
                    role: user.role,
                },
            });
        } catch (error) {
            console.error("Register error:", error);
            res.status(500).json({ error: "Server error during registration" });
        }
    }
);

// @route   POST /api/users/send-otp
// @desc    Send OTP to user's email for login
// @access  Public
router.post(
    "/send-otp",
    [body("email").isEmail().withMessage("Please enter a valid email")],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email } = req.body;

            // Check if user exists
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ error: "No account found with this email" });
            }

            // Delete any previous OTPs for this email
            await OTP.deleteMany({ email });

            // Generate new OTP
            const otp = generateOTP();

            // Save OTP to database
            const otpDoc = new OTP({
                email,
                otp,
                expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            });
            await otpDoc.save();

            // Send OTP via email
            await sendOTPEmail(email, otp);

            res.json({
                message: "OTP sent successfully to your email",
                expiresIn: 600, // seconds
            });
        } catch (error) {
            console.error("Send OTP error:", error);
            res.status(500).json({ error: "Failed to send OTP. Please try again." });
        }
    }
);

// @route   POST /api/users/verify-otp
// @desc    Verify OTP and login user
// @access  Public
router.post(
    "/verify-otp",
    [
        body("email").isEmail().withMessage("Please enter a valid email"),
        body("otp").isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits"),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, otp } = req.body;

            // Find OTP
            const otpDoc = await OTP.findOne({ email, otp, verified: false });

            if (!otpDoc) {
                return res.status(400).json({ error: "Invalid or expired OTP" });
            }

            // Check if OTP is expired
            if (new Date() > otpDoc.expires_at) {
                await OTP.deleteOne({ _id: otpDoc._id });
                return res.status(400).json({ error: "OTP has expired. Please request a new one." });
            }

            // Mark OTP as verified
            otpDoc.verified = true;
            await otpDoc.save();

            // Get user
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            // Generate auth token
            const token = user.generateAuthToken();

            // Delete the OTP after successful verification
            await OTP.deleteOne({ _id: otpDoc._id });

            res.json({
                message: "Login successful",
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    full_name: user.full_name,
                    phone: user.phone,
                    role: user.role,
                },
            });
        } catch (error) {
            console.error("Verify OTP error:", error);
            res.status(500).json({ error: "Server error during OTP verification" });
        }
    }
);

// @route   POST /api/users/resend-otp
// @desc    Resend OTP to user's email
// @access  Public
router.post(
    "/resend-otp",
    [body("email").isEmail().withMessage("Please enter a valid email")],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email } = req.body;

            // Check if user exists
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ error: "No account found with this email" });
            }

            // Delete any previous OTPs for this email
            await OTP.deleteMany({ email });

            // Generate new OTP
            const otp = generateOTP();

            // Save OTP to database
            const otpDoc = new OTP({
                email,
                otp,
                expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            });
            await otpDoc.save();

            // Send OTP via email
            await sendOTPEmail(email, otp);

            res.json({
                message: "New OTP sent successfully to your email",
                expiresIn: 600, // seconds
            });
        } catch (error) {
            console.error("Resend OTP error:", error);
            res.status(500).json({ error: "Failed to resend OTP. Please try again." });
        }
    }
);

// @route   GET /api/users/me
// @desc    Get current user profile
// @access  Private
router.get("/me", auth, async (req, res) => {
    try {
        res.json({
            user: {
                id: req.user._id,
                email: req.user.email,
                full_name: req.user.full_name,
                phone: req.user.phone,
                aadhaar: req.user.aadhaar,
                role: req.user.role,
                createdAt: req.user.createdAt,
            },
        });
    } catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put("/profile", auth, async (req, res) => {
    try {
        const { full_name, phone } = req.body;

        const user = await User.findById(req.user._id);

        if (full_name) user.full_name = full_name;
        if (phone) user.phone = phone;

        await user.save();

        res.json({
            message: "Profile updated successfully",
            user: {
                id: user._id,
                email: user.email,
                full_name: user.full_name,
                phone: user.phone,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// @route   GET /api/users
// @desc    Get all users (for admin/testing)
// @access  Public (change to Private with admin check in production)
router.get("/", async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.json(users);
    } catch (error) {
        console.error("Get users error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;