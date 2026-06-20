import { Request, Response } from "express";
import User from "../models/User";
import Question from "../models/Question";
import DiagnosticTest from "../models/DiagnosticTest";
import TestAttempt from "../models/TestAttempt";
import PracticeTestUpload from "../models/PracticeTestUpload";
import Inquiry from "../models/Inquiry";
import SuccessStory from "../models/SuccessStory";

export const getAdminOverview = async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      paidUsers,
      totalQuestions,
      publishedQuestions,
      totalTests,
      activeTests,
      totalAttempts,
      pendingUploads,
      pendingInquiries,
      totalStories,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ subscription: "PAID" }),
      Question.countDocuments(),
      Question.countDocuments({ status: "PUBLISHED" }),
      DiagnosticTest.countDocuments(),
      DiagnosticTest.countDocuments({ isActive: true }),
      TestAttempt.countDocuments({ status: "COMPLETED" }),
      PracticeTestUpload.countDocuments({ status: { $in: ["UPLOADED", "EXTRACTED"] } }),
      Inquiry.countDocuments({ status: "NEW" }),
      SuccessStory.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      overview: {
        totalUsers,
        paidUsers,
        totalQuestions,
        publishedQuestions,
        totalTests,
        activeTests,
        totalAttempts,
        pendingUploads,
        pendingInquiries,
        totalStories,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
