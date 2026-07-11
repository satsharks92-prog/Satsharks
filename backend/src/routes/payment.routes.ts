import { Router } from "express";
import { createCheckoutSession, stripeWebhook } from "../controllers/payment.controller";
import { optionalAuthenticate } from "../middleware/auth.middleware";

const router = Router();

// Endpoint for creating a checkout session
router.post("/create-checkout", optionalAuthenticate, createCheckoutSession);

export default router;
