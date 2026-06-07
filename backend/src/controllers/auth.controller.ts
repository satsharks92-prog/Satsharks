import { Request, Response } from "express";
import bcrypt from "bcrypt";
import User from "../models/User";
import { generateTokens } from "../utils/jwt";
import { env } from "../config/env";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    
    if (!env.isDatabaseConfigured && env.allowMockAuth) {
      // Mock mode
      const tokens = generateTokens("mock-id", "LOCAL_FREE");
      return res.status(201).json({ success: true, user: { id: "mock-id", name, email, role: "LOCAL_FREE" }, ...tokens });
    }

    if (!env.isDatabaseConfigured) {
      return res.status(503).json({ success: false, error: "Database is not configured" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role: "LOCAL_FREE" });

    const tokens = generateTokens(user.id, user.role);
    res.status(201).json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role }, ...tokens });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!env.isDatabaseConfigured && env.allowMockAuth) {
      // Mock mode
      const mockRole = email.includes("admin") ? "ADMIN" : "LOCAL_FREE";
      const tokens = generateTokens("mock-id", mockRole);
      return res.status(200).json({ success: true, user: { id: "mock-id", name: email.split("@")[0], email, role: mockRole }, ...tokens });
    }

    if (!env.isDatabaseConfigured) {
      return res.status(503).json({ success: false, error: "Database is not configured" });
    }

    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const tokens = generateTokens(user.id, user.role);
    res.status(200).json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role }, ...tokens });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  // Mock logic for password reset email
  res.status(200).json({ success: true, message: "Reset instructions sent if email exists" });
};
