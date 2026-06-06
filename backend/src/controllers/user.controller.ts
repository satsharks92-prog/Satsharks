import { Request, Response } from "express";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth.middleware";

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(200).json({ success: true, user: { id: req.user.id, name: "Mock User", email: "mock@example.com", role: req.user.role } });
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
