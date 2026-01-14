const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./db");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// API Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/properties", require("./routes/propertyRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

// Health check route
app.get("/", (req, res) => {
  res.json({
    message: "EasyStayTrack Backend API 🚀",
    status: "Running",
    version: "2.0.0",
    features: ["JWT Auth", "OTP Email Verification", "Multi-Image Upload", "Notifications"],
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Global error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📧 Email service: ${process.env.EMAIL_USER ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`☁️  Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`\n📚 API Endpoints:`);
  console.log(`   POST   /api/users/register`);
  console.log(`   POST   /api/users/send-otp`);
  console.log(`   POST   /api/users/verify-otp`);
  console.log(`   GET    /api/properties`);
  console.log(`   POST   /api/properties (with images)`);
  console.log(`   POST   /api/bookings`);
  console.log(`   GET    /api/notifications\n`);
});
