import { Router } from "express";
import { submitInquiry } from "../controllers/contact.controller";
import { validate } from "../middleware/validate.middleware";
import { inquiryValidator } from "../validators/contact.validator";

const router = Router();

router.post("/inquiry", inquiryValidator, validate, submitInquiry);

export default router;
