const express = require("express");
const Booking = require("../models/Booking");
const Property = require("../models/Property");
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/bookings
// @desc    Get bookings (filter by user_id or owner_id)
// @access  Private
router.get("/", auth, async (req, res) => {
    try {
        const { user_id, property_id, owner_id } = req.query;

        let filter = {};

        // If specific filters provided, use them
        if (user_id) filter.user_id = user_id;
        if (property_id) filter.property_id = property_id;
        if (owner_id) filter.owner_id = owner_id;

        // If no filters, show bookings related to the current user
        if (!user_id && !property_id && !owner_id) {
            filter.$or = [{ user_id: req.user._id }, { owner_id: req.user._id }];
        }

        const bookings = await Booking.find(filter)
            .populate("property_id")
            .populate("user_id", "full_name email phone")
            .populate("owner_id", "full_name email phone")
            .sort({ createdAt: -1 });

        // Transform bookings to match frontend expectations
        const transformedBookings = bookings.map(booking => {
            const bookingObj = booking.toObject();
            return {
                ...bookingObj,
                id: bookingObj._id,
                property: bookingObj.property_id,
                user_profile: bookingObj.user_id,
            };
        });

        res.json(transformedBookings);
    } catch (error) {
        console.error("Get bookings error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// @route   GET /api/bookings/:id
// @desc    Get single booking by ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate("property_id")
            .populate("user_id", "full_name email phone")
            .populate("owner_id", "full_name email phone");

        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        // Check authorization
        if (
            booking.user_id._id.toString() !== req.user._id.toString() &&
            booking.owner_id._id.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({ error: "Not authorized to view this booking" });
        }

        res.json(booking);
    } catch (error) {
        console.error("Get booking error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private
router.post("/", auth, async (req, res) => {
    try {
        const { property_id, message, phone, booking_date, duration, special_requests } = req.body;

        // Get property details
        const property = await Property.findById(property_id);

        if (!property) {
            return res.status(404).json({ error: "Property not found" });
        }

        // Check if property is available
        if (!property.is_available) {
            return res.status(400).json({ error: "This property is no longer available" });
        }

        // Create booking
        const booking = new Booking({
            property_id,
            user_id: req.user._id,
            owner_id: property.owner_id,
            message,
            phone: phone || req.user.phone,
            booking_date,
            duration,
            special_requests,
            status: "pending",
        });

        await booking.save();

        // Create notification for property owner
        const notification = new Notification({
            user_id: property.owner_id,
            title: "New Booking Request! 🎉",
            message: `You have a new booking request for "${property.title}" in ${property.area} from ${req.user.full_name}.`,
            type: "info",
            booking_id: booking._id,
        });

        await notification.save();

        res.status(201).json({
            message: "Booking request submitted successfully",
            booking,
        });
    } catch (error) {
        console.error("Create booking error:", error);
        res.status(500).json({ error: "Server error creating booking" });
    }
});

// @route   PUT /api/bookings/:id/status
// @desc    Update booking status (confirm/reject)
// @access  Private (Owner only)
router.put("/:id/status", auth, async (req, res) => {
    try {
        const { status } = req.body;

        if (!["confirmed", "rejected"].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const booking = await Booking.findById(req.params.id)
            .populate("property_id")
            .populate("user_id", "full_name");

        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        // Check if user is the property owner
        if (booking.owner_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "Not authorized to update this booking" });
        }

        // Update status
        booking.status = status;
        await booking.save();

        // Create notification for tenant
        const notification = new Notification({
            user_id: booking.user_id._id,
            title: status === "confirmed" ? "Booking Accepted! 🎉" : "Booking Declined",
            message:
                status === "confirmed"
                    ? `Great news! Your booking request for "${booking.property_id.title}" in ${booking.property_id.area} has been accepted by the owner. You can now contact them to proceed.`
                    : `Unfortunately, your booking request for "${booking.property_id.title}" in ${booking.property_id.area} has been declined by the owner.`,
            type: status === "confirmed" ? "success" : "info",
            booking_id: booking._id,
        });

        await notification.save();

        res.json({
            message: `Booking ${status} successfully`,
            booking,
        });
    } catch (error) {
        console.error("Update booking status error:", error);
        res.status(500).json({ error: "Server error updating booking status" });
    }
});

// @route   PUT /api/bookings/:id
// @desc    Update booking details
// @access  Private (User only)
router.put("/:id", auth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        // Check if user owns the booking
        if (booking.user_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "Not authorized to update this booking" });
        }

        // Update allowed fields
        const allowedUpdates = ["message", "phone", "booking_date", "duration", "special_requests"];
        allowedUpdates.forEach((field) => {
            if (req.body[field] !== undefined) {
                booking[field] = req.body[field];
            }
        });

        await booking.save();

        res.json({
            message: "Booking updated successfully",
            booking,
        });
    } catch (error) {
        console.error("Update booking error:", error);
        res.status(500).json({ error: "Server error updating booking" });
    }
});

// @route   DELETE /api/bookings/:id
// @desc    Cancel/Delete booking
// @access  Private (User only)
router.delete("/:id", auth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        // Check if user owns the booking
        if (booking.user_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "Not authorized to delete this booking" });
        }

        await Booking.findByIdAndDelete(req.params.id);

        res.json({ message: "Booking cancelled successfully" });
    } catch (error) {
        console.error("Delete booking error:", error);
        res.status(500).json({ error: "Server error deleting booking" });
    }
});

module.exports = router;