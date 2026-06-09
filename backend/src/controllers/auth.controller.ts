import { Request, Response } from "express";
import bcrypt from "bcrypt";
import User from "../models/User";
import { generateTokens } from "../utils/jwt";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, country } = req.body;
    
    const region = country.toLowerCase() === "pakistan" ? "LOCAL" : "INTERNATIONAL";
    const subscription = "FREE";
    const status = "ACTIVE";
    
    if (!process.env.DATABASE_URL) {
      // Mock mode
      const tokens = generateTokens("mock-id", "STUDENT", region, subscription, status);
      return res.status(201).json({ success: true, user: { id: "mock-id", name, email, role: "STUDENT", country, region, subscription, status }, ...tokens });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      name, 
      email, 
      password: hashedPassword, 
      role: "STUDENT",
      country,
      region,
      subscription,
      status
    });

    const tokens = generateTokens(user.id, user.role, user.region, user.subscription, user.status);
    res.status(201).json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, country: user.country, region: user.region, subscription: user.subscription, status: user.status }, ...tokens });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!process.env.DATABASE_URL) {
      // Mock mode
      const mockRole = email.includes("admin") ? "ADMIN" : "STUDENT";
      const mockRegion = mockRole === "STUDENT" ? "LOCAL" : "INTERNATIONAL";
      const mockSubscription = mockRole === "STUDENT" ? "FREE" : "FREE";
      const tokens = generateTokens("mock-id", mockRole, mockRegion, mockSubscription, "ACTIVE");
      return res.status(200).json({ success: true, user: { id: "mock-id", name: email.split("@")[0], email, role: mockRole, country: "Pakistan", region: mockRegion, subscription: mockSubscription, status: "ACTIVE" }, ...tokens });
    }

    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    if (user.status === "SUSPENDED") {
      return res.status(403).json({ success: false, error: "Your account is suspended. Please contact support." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const tokens = generateTokens(user.id, user.role, user.region, user.subscription, user.status);
    res.status(200).json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, country: user.country, region: user.region, subscription: user.subscription, status: user.status }, ...tokens });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: "Reset instructions sent if email exists" });
};
