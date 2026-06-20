import { Router } from "express";
import { submitPracticeAnswer, getPracticeHistory } from "../controllers/practice.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireActiveUser } from "../middleware/role.middleware";

const router = Router();

router.post("/answer", authenticate, requireActiveUser(), submitPracticeAnswer);
router.get("/history", authenticate, requireActiveUser(), getPracticeHistory);

export default router;
