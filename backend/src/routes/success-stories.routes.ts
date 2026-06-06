import { Router } from "express";
import { getSuccessStories, createSuccessStory } from "../controllers/success-stories.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

router.get("/", getSuccessStories);
router.post("/", authenticate, requireRole(["ADMIN"]), createSuccessStory);

export default router;
