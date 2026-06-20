import { Router } from "express";
import { getDashboardStats, getTestHistory, getPerformanceData, getCategoryBreakdown, getPredictedScore } from "../controllers/analytics.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireActiveUser } from "../middleware/role.middleware";

const router = Router();

router.get("/dashboard", authenticate, requireActiveUser(), getDashboardStats);
router.get("/history", authenticate, requireActiveUser(), getTestHistory);
router.get("/performance", authenticate, requireActiveUser(), getPerformanceData);
router.get("/category-breakdown", authenticate, requireActiveUser(), getCategoryBreakdown);
router.get("/predicted-score", authenticate, requireActiveUser(), getPredictedScore);

export default router;
