import { Router } from "express";
import { body } from "express-validator";
import {
  getAllOrders,
  createOrder,
  getOrderById,
  updateOrder,
  updateOrderStatus,
  updatePayment,
  deleteOrder,
  uploadOrderImage,
  deleteOrderImage,
} from "../controllers/orderController.js";
import { protect, adminOnly } from "../middleware/auth.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = Router();

router.use(protect);

// GET /api/orders?status=&paymentStatus=&clientId=&deliveryDateFrom=&deliveryDateTo=&page=&limit=
router.get("/", getAllOrders);

// POST /api/orders
// Send as multipart/form-data — include "image" file field (optional)
// All other fields (client, name, deliveryDate, …) go as form fields
router.post(
  "/",
  upload.single("image"), // must come before express-validator
  [
    body("client").notEmpty().withMessage("Client ID required"),
    body("name").notEmpty().withMessage("Order name required"),
    body("deliveryDate").isISO8601().withMessage("Valid delivery date required"),
  ],
  createOrder
);

router.get("/:id", getOrderById);

router.put("/:id", updateOrder);

// PATCH /api/orders/:id/status  — quick status update
router.patch(
  "/:id/status",
  [body("status").isIn(["not_started", "in_progress", "ready", "delivered"])],
  updateOrderStatus
);

// PATCH /api/orders/:id/payment  — update paid amount
router.patch(
  "/:id/payment",
  [body("paidAmount").isNumeric().withMessage("paidAmount must be a number")],
  updatePayment
);

// POST /api/orders/:id/image  — upload or replace image on existing order
router.post("/:id/image", upload.single("image"), uploadOrderImage);

// DELETE /api/orders/:id/image  — remove image from order
router.delete("/:id/image", deleteOrderImage);

router.delete("/:id", adminOnly, deleteOrder);

export default router;
