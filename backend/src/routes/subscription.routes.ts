import { Router } from "express";
import { getPlans } from "../controllers/subscription.controller";
import { authenticate } from "../middleware/auth.middleware";
import {
  requireActiveUser,
  requireStudent,
} from "../middleware/role.middleware";

const router = Router();

router.get(
  "/plans",
  authenticate,
  requireActiveUser(),
  requireStudent(),
  getPlans,
);

export default router;
