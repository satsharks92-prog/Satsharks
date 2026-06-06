import { Request, Response } from "express";
import SuccessStory from "../models/SuccessStory";

export const getSuccessStories = async (req: Request, res: Response) => {
  try {
    if (!process.env.DATABASE_URL) {
      // Return mock stories
      const mockStories = [
        {
          name: "Sarah M.",
          score: "Scored 1580 (+210)",
          quote: "The personalized study plan was a game-changer.",
          university: "Harvard University",
        },
        {
          name: "David L.",
          score: "Scored 1550 (+180)",
          quote: "The instructors genuinely care about your success.",
          university: "Stanford University",
        }
      ];
      return res.status(200).json({ success: true, stories: mockStories });
    }

    const stories = await SuccessStory.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, stories });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createSuccessStory = async (req: Request, res: Response) => {
  try {
    const { name, score, quote, university } = req.body;

    if (!process.env.DATABASE_URL) {
      return res.status(201).json({ success: true, message: "Success story created (mock)" });
    }

    const story = await SuccessStory.create({ name, score, quote, university });
    res.status(201).json({ success: true, story });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
