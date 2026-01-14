const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
    },
    description: {
      type: String,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
    },
    area: {
      type: String,
      required: [true, "Area is required"],
    },
    address: {
      type: String,
      required: [true, "Address is required"],
    },
    price_per_month: {
      type: Number,
      required: [true, "Price is required"],
    },
    property_type: {
      type: String,
      enum: ["single", "double", "triple", "shared"],
      required: true,
    },
    gender_preference: {
      type: String,
      enum: ["male", "female", "any"],
      required: true,
    },
    amenities: {
      type: [String],
      default: [],
    },
    rules: {
      type: String,
    },
    contact_phone: {
      type: String,
      required: [true, "Contact phone is required"],
    },
    contact_email: {
      type: String,
    },
    // Multiple images support
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true }, // For Cloudinary deletion
        is_thumbnail: { type: Boolean, default: false },
      },
    ],
    // Main thumbnail image
    thumbnail_image: {
      type: String, // URL of the thumbnail
    },
    available_from: {
      type: Date,
    },
    is_available: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Property", propertySchema);
