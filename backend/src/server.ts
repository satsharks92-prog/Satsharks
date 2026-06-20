import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { connectDB } from "./config/db";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: env.frontendUrl,
  credentials: true
}));
app.use(helmet());
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

// Serve uploaded files
import path from "path";
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

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
