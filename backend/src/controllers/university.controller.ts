import { Request, Response } from "express";
import University from "../models/University";

export const getAllUniversities = async (req: Request, res: Response) => {
  try {
    const universities = await University.find();
    return res.status(200).json({ success: true, data: universities });
  } catch (error: any) {
    console.error("Get All Universities Error:", error);
    return res.status(500).json({ success: false, error: "Server Error" });
  }
};

export const syncUniversities = async (req: Request, res: Response) => {
  try {
    const { universities } = req.body;

    if (!Array.isArray(universities)) {
      return res.status(400).json({ success: false, error: "Invalid data format. Expected an array of universities." });
    }

    // Clear existing collection
    await University.deleteMany({});

    // Insert new universities
    const inserted = await University.insertMany(universities);

    return res.status(200).json({ success: true, data: inserted, message: "Universities synced successfully." });
  } catch (error: any) {
    console.error("Sync Universities Error:", error);
    return res.status(500).json({ success: false, error: error.message || "Server Error", details: error.errors });
  }
};
