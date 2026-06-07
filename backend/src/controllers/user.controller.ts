import { Response } from "express";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth.middleware";
import { env } from "../config/env";

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!env.isDatabaseConfigured && env.allowMockAuth) {
      return res.status(200).json({ success: true, user: { id: req.user.id, name: "Mock User", email: "mock@example.com", role: req.user.role } });
    }

    if (!env.isDatabaseConfigured) {
      return res.status(503).json({ success: false, error: "Database is not configured" });
    }

    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
