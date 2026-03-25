import { Router } from "express";
import { body } from "express-validator";
import { login, getMe, changePassword } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { updateMe } from "../controllers/authController.js";


const router = Router();

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password required"),
  ],
  login
);

router.get("/me", protect, getMe);
router.put("/update-me", protect, updateMe);
router.put(
  "/change-password",
  protect,
  [
    body("currentPassword").notEmpty(),
    body("newPassword").isLength({ min: 6 }).withMessage("Min 6 characters"),
  ],
  changePassword
);

export default router;
