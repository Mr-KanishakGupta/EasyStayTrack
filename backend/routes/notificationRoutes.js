const express = require("express");
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get all notifications for current user
// @access  Private
router.get("/", auth, async (req, res) => {
    try {
        const notifications = await Notification.find({ user_id: req.user._id })
            .populate("booking_id")
            .sort({ createdAt: -1 })
            .limit(50); // Limit to last 50 notifications

        res.json(notifications);
    } catch (error) {
        console.error("Get notifications error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// @route   GET /api/notifications/unread
// @desc    Get unread notifications count
// @access  Private
router.get("/unread", auth, async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            user_id: req.user._id,
            is_read: false,
        });

        res.json({ unread_count: count });
    } catch (error) {
        console.error("Get unread count error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put("/:id/read", auth, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        // Check if notification belongs to user
        if (notification.user_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "Not authorized" });
        }

        notification.is_read = true;
        await notification.save();

        res.json({
            message: "Notification marked as read",
            notification,
        });
    } catch (error) {
        console.error("Mark as read error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put("/read-all", auth, async (req, res) => {
    try {
        await Notification.updateMany({ user_id: req.user._id, is_read: false }, { is_read: true });

        res.json({ message: "All notifications marked as read" });
    } catch (error) {
        console.error("Mark all as read error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete("/:id", auth, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        // Check if notification belongs to user
        if (notification.user_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "Not authorized" });
        }

        await Notification.findByIdAndDelete(req.params.id);

        res.json({ message: "Notification deleted successfully" });
    } catch (error) {
        console.error("Delete notification error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
