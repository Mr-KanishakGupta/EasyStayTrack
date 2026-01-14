const cloudinary = require("cloudinary").v2;
const DatauriParser = require("datauri/parser");
const parser = new DatauriParser();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload image to Cloudinary
const uploadToCloudinary = async (file, folder = "easystaytrack/properties") => {
    try {
        // Convert buffer to base64
        const extName = file.mimetype.split("/")[1];
        const file64 = parser.format(`.${extName}`, file.buffer);

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(file64.content, {
            folder: folder,
            resource_type: "image",
            transformation: [
                { width: 1200, height: 800, crop: "limit" }, // Limit max size
                { quality: "auto" }, // Auto quality
                { fetch_format: "auto" }, // Auto format (WebP for modern browsers)
            ],
        });

        return {
            url: result.secure_url,
            public_id: result.public_id,
        };
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw new Error("Failed to upload image");
    }
};

// Delete image from Cloudinary
const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error("Cloudinary delete error:", error);
        throw new Error("Failed to delete image");
    }
};

module.exports = {
    uploadToCloudinary,
    deleteFromCloudinary,
};
