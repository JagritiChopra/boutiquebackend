import { Router } from "express";
import { body } from "express-validator";
import {
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  uploadUserImage,
} from "../controllers/userController.js";
import { protect, adminOnly } from "../middleware/auth.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = Router();

router.use(protect);

router.get("/", adminOnly, getAllUsers);

router.post(
  "/",
  adminOnly,
  [
    body("name").notEmpty().withMessage("Name required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 6 }).withMessage("Min 6 characters"),
    body("role").optional().isIn(["admin", "tailor", "staff"]),
  ],
  createUser
);

router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", adminOnly, deleteUser);
router.post("/:id/image", upload.single("image"), uploadUserImage);

export default router;
