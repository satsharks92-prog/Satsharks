import { Router } from "express";
import { getPlans } from "../controllers/subscription.controller";

const router = Router();

router.get("/plans", getPlans);

export default router;
