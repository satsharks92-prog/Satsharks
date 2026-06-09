import { Request, Response } from "express";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth.middleware";

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: "Unauthorized" });

    if (!process.env.DATABASE_URL) {
      return res.status(200).json({ success: true, user: req.user });
    }

    const user = await User.findById(req.user.userId).select("-password");
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    res.status(200).json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, country: user.country, region: user.region, subscription: user.subscription, status: user.status } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(200).json({ success: true, users: [] });
    }

    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json({ success: true, users });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateUserSubscription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { subscription } = req.body;

    if (!process.env.DATABASE_URL) return res.status(200).json({ success: true, message: "Subscription updated (mock)" });

    const user = await User.findByIdAndUpdate(id, { subscription }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    res.status(200).json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!process.env.DATABASE_URL) return res.status(200).json({ success: true, message: "Status updated (mock)" });

    const user = await User.findByIdAndUpdate(id, { status }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    res.status(200).json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
