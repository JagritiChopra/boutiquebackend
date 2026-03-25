import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authorized. No token." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user || !req.user.isActive) {
      return res.status(401).json({ success: false, message: "User not found or deactivated." });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Token invalid or expired." });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access only." });
  }
  next();
};

export const adminOrStaff = (req, res, next) => {
  if (!["admin", "staff", "tailor"].includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: "Access denied." });
  }
  next();
};
