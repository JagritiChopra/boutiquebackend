import { validationResult } from "express-validator";
import User from "../models/User.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../middleware/uploadMiddleware.js";

// GET /api/users  (admin only)
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    next(err);
  }
};

// POST /api/users  (admin only - create team member)
export const createUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    const user = await User.create(req.body);
    res.status(201).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/:id  (admin can edit anyone; staff can edit self)
export const updateUser = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === "admin";
    const isSelf = req.user._id.toString() === req.params.id;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    // Prevent non-admins from changing their role
    if (!isAdmin) delete req.body.role;
    delete req.body.password; // Use change-password route

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/:id  (admin only - soft delete)
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    res.json({ success: true, message: "User deactivated." });
  } catch (err) {
    next(err);
  }
};

// POST /api/users/:id/image  — upload or replace profile image
export const uploadUserImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided." });
    }

    const isAdmin = req.user.role === "admin";
    const isSelf  = req.user._id.toString() === req.params.id;
    if (!isAdmin && !isSelf) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    // Delete old image if present
    if (user.profileImagePublicId) {
      await deleteFromCloudinary(user.profileImagePublicId).catch(() => {});
    }

    const result = await uploadToCloudinary(req.file.buffer, "boutique/profiles");
    user.profileImage = result.url;
    user.profileImagePublicId = result.publicId;
    await user.save();

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
