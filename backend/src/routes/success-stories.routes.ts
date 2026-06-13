import { Router } from "express";
import { getSuccessStories, createSuccessStory, updateSuccessStory, deleteSuccessStory } from "../controllers/success-stories.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/role.middleware";

const router = Router();

router.get("/", getSuccessStories);
router.post("/", authenticate, requireAdmin(), createSuccessStory);
router.put("/:id", authenticate, requireAdmin(), updateSuccessStory);
router.delete("/:id", authenticate, requireAdmin(), deleteSuccessStory);

export default router;
