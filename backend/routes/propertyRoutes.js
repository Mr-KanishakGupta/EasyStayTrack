const express = require("express");
const Property = require("../models/Property");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const { uploadToCloudinary, deleteFromCloudinary } = require("../utils/cloudinary");

const router = express.Router();

// @route   GET /api/properties
// @desc    Get all properties with optional filters
// @access  Public
router.get("/", async (req, res) => {
  try {
    const { location, gender_preference, min_price, max_price, owner_id } = req.query;

    let filter = { is_available: true };

    if (location) filter.location = new RegExp(location, "i"); // Case-insensitive search
    if (gender_preference) filter.gender_preference = gender_preference;
    if (owner_id) filter.owner_id = owner_id;
    if (min_price || max_price) {
      filter.price_per_month = {};
      if (min_price) filter.price_per_month.$gte = Number(min_price);
      if (max_price) filter.price_per_month.$lte = Number(max_price);
    }

    const properties = await Property.find(filter)
      .populate("owner_id", "full_name email phone")
      .sort({ createdAt: -1 });

    res.json(properties);
  } catch (error) {
    console.error("Get properties error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   GET /api/properties/stats/locations
// @desc    Get all unique locations with property counts for autocomplete
// @access  Public
router.get("/stats/locations", async (req, res) => {
  try {
    const locationStats = await Property.aggregate([
      { $match: { is_available: true } },
      {
        $group: {
          _id: "$area",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Transform to more readable format
    const formattedStats = locationStats.map(stat => ({
      area: stat._id,
      count: stat.count
    }));

    res.json(formattedStats);
  } catch (error) {
    console.error("Get location stats error:", error);
    res.status(500).json({ error: "Server error" });
  }
});


// @route   GET /api/properties/:id
// @desc    Get single property by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate(
      "owner_id",
      "full_name email phone"
    );

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    res.json(property);
  } catch (error) {
    console.error("Get property error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   POST /api/properties
// @desc    Create a new property with images
// @access  Private
router.post("/", auth, upload.array("images", 10), async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      area,
      address,
      price_per_month,
      property_type,
      gender_preference,
      amenities,
      rules,
      contact_phone,
      contact_email,
      available_from,
    } = req.body;

    // Upload images to Cloudinary
    const images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file);
        images.push({
          url: result.url,
          public_id: result.public_id,
          is_thumbnail: false,
        });
      }

      // Set first image as default thumbnail
      if (images.length > 0) {
        images[0].is_thumbnail = true;
      }
    }

    // Create property
    const property = new Property({
      owner_id: req.user._id,
      title,
      description,
      location,
      area,
      address,
      price_per_month,
      property_type,
      gender_preference,
      amenities: typeof amenities === "string" ? JSON.parse(amenities) : amenities,
      rules,
      contact_phone,
      contact_email,
      available_from,
      images,
      thumbnail_image: images.length > 0 ? images[0].url : null,
    });

    await property.save();

    res.status(201).json({
      message: "Property created successfully",
      property,
    });
  } catch (error) {
    console.error("Create property error:", error);
    res.status(500).json({ error: "Server error creating property" });
  }
});

// @route   PUT /api/properties/:id
// @desc    Update property
// @access  Private (Owner only)
router.put("/:id", auth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Check if user is the owner
    if (property.owner_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to update this property" });
    }

    // Update fields
    const updateFields = [
      "title",
      "description",
      "location",
      "area",
      "address",
      "price_per_month",
      "property_type",
      "gender_preference",
      "amenities",
      "rules",
      "contact_phone",
      "contact_email",
      "available_from",
      "is_available",
    ];

    updateFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        property[field] = req.body[field];
      }
    });

    await property.save();

    res.json({
      message: "Property updated successfully",
      property,
    });
  } catch (error) {
    console.error("Update property error:", error);
    res.status(500).json({ error: "Server error updating property" });
  }
});

// @route   PUT /api/properties/:id/images
// @desc    Add images to property
// @access  Private (Owner only)
router.put("/:id/images", auth, upload.array("images", 10), async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Check if user is the owner
    if (property.owner_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to update this property" });
    }

    // Upload new images to Cloudinary
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file);
        property.images.push({
          url: result.url,
          public_id: result.public_id,
          is_thumbnail: false,
        });
      }

      // If no thumbnail exists, set first image as thumbnail
      if (!property.thumbnail_image && property.images.length > 0) {
        property.images[0].is_thumbnail = true;
        property.thumbnail_image = property.images[0].url;
      }

      await property.save();
    }

    res.json({
      message: "Images added successfully",
      property,
    });
  } catch (error) {
    console.error("Add images error:", error);
    res.status(500).json({ error: "Server error adding images" });
  }
});

// @route   DELETE /api/properties/:id/images/:imageId
// @desc    Delete specific image from property
// @access  Private (Owner only)
router.delete("/:id/images/:imageId", auth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Check if user is the owner
    if (property.owner_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to update this property" });
    }

    // Find the image
    const imageIndex = property.images.findIndex(
      (img) => img._id.toString() === req.params.imageId
    );

    if (imageIndex === -1) {
      return res.status(404).json({ error: "Image not found" });
    }

    const image = property.images[imageIndex];

    // Delete from Cloudinary
    await deleteFromCloudinary(image.public_id);

    // Remove from array
    property.images.splice(imageIndex, 1);

    // If deleted image was thumbnail, set new thumbnail
    if (image.is_thumbnail && property.images.length > 0) {
      property.images[0].is_thumbnail = true;
      property.thumbnail_image = property.images[0].url;
    } else if (property.images.length === 0) {
      property.thumbnail_image = null;
    }

    await property.save();

    res.json({
      message: "Image deleted successfully",
      property,
    });
  } catch (error) {
    console.error("Delete image error:", error);
    res.status(500).json({ error: "Server error deleting image" });
  }
});

// @route   PUT /api/properties/:id/thumbnail/:imageId
// @desc    Set thumbnail image for property
// @access  Private (Owner only)
router.put("/:id/thumbnail/:imageId", auth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Check if user is the owner
    if (property.owner_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to update this property" });
    }

    // Find the image
    const imageIndex = property.images.findIndex(
      (img) => img._id.toString() === req.params.imageId
    );

    if (imageIndex === -1) {
      return res.status(404).json({ error: "Image not found" });
    }

    // Reset all thumbnails
    property.images.forEach((img) => (img.is_thumbnail = false));

    // Set new thumbnail
    property.images[imageIndex].is_thumbnail = true;
    property.thumbnail_image = property.images[imageIndex].url;

    await property.save();

    res.json({
      message: "Thumbnail updated successfully",
      property,
    });
  } catch (error) {
    console.error("Set thumbnail error:", error);
    res.status(500).json({ error: "Server error setting thumbnail" });
  }
});

// @route   DELETE /api/properties/:id
// @desc    Delete property
// @access  Private (Owner only)
router.delete("/:id", auth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Check if user is the owner
    if (property.owner_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to delete this property" });
    }

    // Delete all images from Cloudinary
    for (const image of property.images) {
      await deleteFromCloudinary(image.public_id);
    }

    // Delete property
    await Property.findByIdAndDelete(req.params.id);

    res.json({ message: "Property deleted successfully" });
  } catch (error) {
    console.error("Delete property error:", error);
    res.status(500).json({ error: "Server error deleting property" });
  }
});

module.exports = router;
