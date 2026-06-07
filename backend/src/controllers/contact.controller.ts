import { Request, Response } from "express";
import Inquiry from "../models/Inquiry";
import { env } from "../config/env";

export const submitInquiry = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, category, message } = req.body;

    if (!env.isDatabaseConfigured && env.allowMockAuth) {
      // Mock mode: just return success
      return res.status(201).json({ success: true, message: "Inquiry submitted successfully (mock)" });
    }

    if (!env.isDatabaseConfigured) {
      return res.status(503).json({ success: false, error: "Database is not configured" });
    }

    const inquiry = await Inquiry.create({ firstName, lastName, email, category, message });
    res.status(201).json({ success: true, message: "Inquiry submitted successfully", inquiryId: inquiry.id });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
