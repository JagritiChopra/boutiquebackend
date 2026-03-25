import { Router } from "express";
import { getDashboardStats, getSchedule } from "../controllers/dashboardController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);

// GET /api/dashboard  — home screen stats
router.get("/", getDashboardStats);

// GET /api/dashboard/schedule?date=YYYY-MM-DD  OR  ?from=&to=
router.get("/schedule", getSchedule);

export default router;
