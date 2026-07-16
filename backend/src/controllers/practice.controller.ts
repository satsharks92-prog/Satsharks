import { Response } from "express";
import PracticeSession from "../models/PracticeSession";
import Question from "../models/Question";
import { AuthRequest } from "../middleware/auth.middleware";
import { checkAnswerCorrectness } from "../utils/grading";

export const submitPracticeAnswer = async (req: AuthRequest, res: Response) => {
  try {
    const { questionId, selectedAnswer, timeSpent } = req.body;
    const studentId = req.user?.userId;

    if (req.user?.subscription === "FREE") {
      const count = await PracticeSession.countDocuments({ student: studentId });
      if (count >= 20) {
        return res.status(403).json({
          success: false,
          error: "You have reached the free limit of 20 practice questions. Please upgrade to a Premium plan to unlock unlimited access to all 3,686 questions!",
          limitReached: true,
        });
      }
    }

    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ success: false, error: "Question not found" });

    const isCorrect = checkAnswerCorrectness(question.correctAnswer, selectedAnswer);

    const session = await PracticeSession.create({
      student: studentId,
      question: questionId,
      selectedAnswer,
      isCorrect,
      timeSpent: timeSpent || 0,
    });

    res.status(201).json({
      success: true,
      result: {
        isCorrect,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        sessionId: session._id,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPracticeHistory = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.userId;
    const { page = "1", limit = "20" } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const [sessions, total] = await Promise.all([
      PracticeSession.find({ student: studentId })
        .populate("question", "text category difficulty section")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      PracticeSession.countDocuments({ student: studentId }),
    ]);

    const correct = await PracticeSession.countDocuments({ student: studentId, isCorrect: true });

    res.status(200).json({
      success: true,
      sessions,
      stats: { total, correct, accuracy: total > 0 ? Math.round((correct / total) * 100) : 0 },
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
