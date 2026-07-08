import { Response } from "express";
import SATTestAttempt from "../models/SATTestAttempt";
import PracticeSession from "../models/PracticeSession";
import { AuthRequest } from "../middleware/auth.middleware";

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.userId;

    const [totalTests, practiceCount, attempts] = await Promise.all([
      SATTestAttempt.countDocuments({ student: studentId, status: "COMPLETED" }),
      PracticeSession.countDocuments({ student: studentId }),
      SATTestAttempt.find({ student: studentId, status: "COMPLETED" })
        .select("percentage totalCorrect createdAt")
        .sort({ createdAt: -1 }),
    ]);

    const avgScore = attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
      : 0;

    const bestScore = attempts.length > 0
      ? Math.max(...attempts.map((a) => a.percentage))
      : 0;

    const recentAttempts = attempts.slice(0, 5);

    res.status(200).json({
      success: true,
      stats: { totalTests, practiceCount, avgScore, bestScore },
      recentAttempts,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getTestHistory = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.userId;
    const { page = "1", limit = "20" } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const [attempts, total] = await Promise.all([
      SATTestAttempt.find({ student: studentId, status: "COMPLETED" })
        .populate("test", "title year testNumber")
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(limitNum),
      SATTestAttempt.countDocuments({ student: studentId, status: "COMPLETED" }),
    ]);

    res.status(200).json({
      success: true,
      attempts,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPerformanceData = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.userId;
    const attempts = await SATTestAttempt.find({ student: studentId, status: "COMPLETED" })
      .populate("test", "title year testNumber")
      .sort({ completedAt: 1 });

    const data = attempts.map((a, i) => ({
      index: i + 1,
      testTitle: (a.test as any)?.title || "Test",
      section: "FULL",
      score: a.percentage,
      correctCount: a.totalCorrect,
      totalQuestions: a.totalQuestions,
      date: a.completedAt,
    }));

    res.status(200).json({ success: true, performance: data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCategoryBreakdown = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.userId;

    const attempts = await SATTestAttempt.find({ student: studentId, status: "COMPLETED" })
      .populate({
        path: "moduleAttempts.answers.question",
        select: "category difficulty",
        populate: { path: "category", select: "name section" },
      });

    const categoryStats: Record<string, { correct: number; total: number; name: string }> = {};

    for (const attempt of attempts) {
      for (const mod of attempt.moduleAttempts) {
        for (const ans of mod.answers) {
          const q = ans.question as any;
          if (!q?.category) continue;
          const catId = q.category._id.toString();
          if (!categoryStats[catId]) {
            categoryStats[catId] = { correct: 0, total: 0, name: q.category.name };
          }
          categoryStats[catId].total++;
          if (ans.isCorrect) categoryStats[catId].correct++;
        }
      }
    }

    const breakdown = Object.values(categoryStats).map((c) => ({
      category: c.name,
      correct: c.correct,
      total: c.total,
      percentage: c.total > 0 ? Math.round((c.correct / c.total) * 100) : 0,
    }));

    res.status(200).json({ success: true, breakdown });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPredictedScore = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.userId;
    const attempts = await SATTestAttempt.find({ student: studentId, status: "COMPLETED" })
      .sort({ completedAt: -1 })
      .limit(10);

    if (attempts.length === 0) {
      return res.status(200).json({ success: true, predicted: null, message: "Take a test to see your predicted score" });
    }

    let weightedSum = 0;
    let weightTotal = 0;
    attempts.forEach((a, i) => {
      const weight = Math.pow(0.85, i);
      weightedSum += a.percentage * weight;
      weightTotal += weight;
    });

    const weightedAvg = weightedSum / weightTotal;
    const predictedScore = Math.round(400 + (weightedAvg / 100) * 1200);
    const confidence = Math.min(95, 40 + attempts.length * 5.5);

    res.status(200).json({
      success: true,
      predicted: {
        score: predictedScore,
        confidence: Math.round(confidence),
        basedOn: attempts.length,
        range: {
          low: Math.max(400, predictedScore - 80),
          high: Math.min(1600, predictedScore + 80),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
