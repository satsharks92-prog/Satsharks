import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { connectDB } from "./config/db";

const app = express();

// Stripe webhook must come BEFORE express.json() because it needs the raw body
import { stripeWebhook } from "./controllers/payment.controller";
app.post("/api/payment/webhook/stripe", express.raw({ type: "application/json" }), stripeWebhook);

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors({
  origin: (origin, callback) => {
    // In dev, allow all origins (LAN IPs, localhost, etc.)
    if (env.nodeEnv !== "production") {
      return callback(null, true);
    }
    // In production, only allow configured frontend URL
    const allowed = [env.frontendUrl];
    if (!origin || allowed.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow images to load cross-origin
}));
app.use(morgan("dev"));

// Connect to database (or run in mock mode)
connectDB();

// Basic Route
app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok", message: "API is running" });
});

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import subscriptionRoutes from "./routes/subscription.routes";
import contactRoutes from "./routes/contact.routes";
import successStoryRoutes from "./routes/success-stories.routes";
import categoryRoutes from "./routes/category.routes";
import questionRoutes from "./routes/question.routes";
import testRoutes from "./routes/test.routes";
import analyticsRoutes from "./routes/analytics.routes";
import practiceRoutes from "./routes/practice.routes";
import uploadRoutes from "./routes/upload.routes";
import adminAnalyticsRoutes from "./routes/admin-analytics.routes";
import satRoutes from "./routes/sat.routes";
import consultingRoutes from "./routes/consulting.routes";
import essayRoutes from "./routes/essay.routes";
import notificationRoutes from "./routes/notification.routes";
import universityRoutes from "./routes/university.routes";
import paymentRoutes from "./routes/payment.routes";

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/success-stories", successStoryRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/practice", practiceRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/admin/analytics", adminAnalyticsRoutes);
app.use("/api/sat", satRoutes);
app.use("/api/consulting", consultingRoutes);
app.use("/api/essays", essayRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/universities", universityRoutes);
app.use("/api/payment", paymentRoutes);

// Serve uploaded files with cross-origin headers so images load from any network origin
import path from "path";
app.use("/uploads", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
}, express.static(path.resolve(__dirname, "../uploads")));

// Error handling middleware
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Server Error"
  });
});

app.listen(env.port, () => {
  console.log(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
});
