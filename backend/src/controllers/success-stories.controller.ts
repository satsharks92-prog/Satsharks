import { Request, Response } from "express";
import SuccessStory from "../models/SuccessStory";
import { env } from "../config/env";
import { phaseOneSuccessStories } from "../data/phaseOne";

export const getSuccessStories = async (req: Request, res: Response) => {
  try {
    if (!env.isDatabaseConfigured) {
      return res.status(200).json({ success: true, stories: phaseOneSuccessStories });
    }

    const stories = await SuccessStory.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, stories });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createSuccessStory = async (req: Request, res: Response) => {
  try {
    const { name, score, quote, university, imageUrl, videoUrl } = req.body;

    if (!env.isDatabaseConfigured && env.allowMockAuth) {
      return res.status(201).json({ success: true, message: "Success story created (mock)" });
    }

    if (!env.isDatabaseConfigured) {
      return res.status(503).json({ success: false, error: "Database is not configured" });
    }

    const story = await SuccessStory.create({ name, score, quote, university, imageUrl, videoUrl });
    res.status(201).json({ success: true, story });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateSuccessStory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, score, quote, university, imageUrl, videoUrl } = req.body;

    if (!env.isDatabaseConfigured && env.allowMockAuth) {
      return res.status(200).json({ success: true, message: "Success story updated (mock)" });
    }

    if (!env.isDatabaseConfigured) {
      return res.status(503).json({ success: false, error: "Database is not configured" });
    }

    const story = await SuccessStory.findByIdAndUpdate(
      id,
      { name, score, quote, university, imageUrl, videoUrl },
      { new: true, runValidators: true }
    );

    if (!story) {
      return res.status(404).json({ success: false, error: "Story not found" });
    }

    res.status(200).json({ success: true, story });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteSuccessStory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!process.env.DATABASE_URL) {
      return res.status(200).json({ success: true, message: "Success story deleted (mock)" });
    }

    const story = await SuccessStory.findByIdAndDelete(id);
    if (!story) return res.status(404).json({ success: false, error: "Story not found" });

    res.status(200).json({ success: true, message: "Story deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
