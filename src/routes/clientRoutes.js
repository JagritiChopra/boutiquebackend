import { Router } from "express";
import { body } from "express-validator";
import {
  getAllClients,
  createClient,
  getClientById,
  updateClient,
  deleteClient,
} from "../controllers/clientController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = Router();

router.use(protect);

// GET /api/clients?search=&bookingDate=&deliveryDate=&paymentStatus=&page=&limit=
router.get("/", getAllClients);

router.post(
  "/",
  [
    body("name").notEmpty().withMessage("Client name required"),
    body("phone").notEmpty().withMessage("Phone number required"),
    body("email").optional().isEmail().withMessage("Valid email required"),
  ],
  createClient
);

router.get("/:id", getClientById);
router.put("/:id", updateClient);
router.delete("/:id", adminOnly, deleteClient);

export default router;
