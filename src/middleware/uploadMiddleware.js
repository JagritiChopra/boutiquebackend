import multer from "multer";
import { Readable } from "stream";
import cloudinary from "../config/cloudinary.js";

// Store file in memory (not on disk) — we'll stream it to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, and WebP images are allowed."), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

/**
 * Upload a buffer to Cloudinary and return the secure URL + public_id.
 * @param {Buffer} buffer  - File buffer from multer
 * @param {string} folder  - Cloudinary folder (e.g. "boutique/orders")
 * @param {string} [publicId] - Optional public_id (e.g. to overwrite existing)
 */
export const uploadToCloudinary = (buffer, folder, publicId) => {
  return new Promise((resolve, reject) => {
    const options = {
      folder,
      resource_type: "image",
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    };
    if (publicId) options.public_id = publicId;

    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve({ url: result.secure_url, publicId: result.public_id });
    });

    Readable.from(buffer).pipe(stream);
  });
};

/**
 * Delete an image from Cloudinary by its public_id.
 * Safe to call even if publicId is undefined/null — it simply skips.
 */
export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary delete error:", err.message);
  }
};
