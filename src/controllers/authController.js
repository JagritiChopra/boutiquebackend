import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import User from "../models/User.js";

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account deactivated." });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// PUT /api/auth/change-password
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: "Current password incorrect." });
    }

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: "Password updated." });
  } catch (err) {
    next(err);
  }
};

// PUT /api/auth/update-me
export const updateMe = async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update only allowed fields
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    res.json({
      success: true,
      user,
      message: "Profile updated successfully",
    });
  } catch (err) {
    next(err);
  }
};
