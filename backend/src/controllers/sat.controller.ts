import { Request, Response } from "express";
import SATTest from "../models/SATTest";
import SATTestAttempt from "../models/SATTestAttempt";
import Question from "../models/Question";
import { AuthRequest } from "../middleware/auth.middleware";

// --- Student: list available SAT tests ---
export const getSATTests = async (req: AuthRequest, res: Response) => {
  try {
    const userSub = req.user?.subscription;
    const filter: any = { isActive: true };
    if (userSub === "FREE") filter.accessLevel = "FREE";

    const tests = await SATTest.find(filter)
      .select("-modules.questions")
      .sort({ year: -1, testNumber: 1 });

    const testsWithMeta = await Promise.all(
      tests.map(async (t) => {
        const doc = t.toObject();
        const totalQuestions = t.modules.reduce((s, m) => s + m.questions.length, 0);
        const totalMinutes = t.modules.reduce((s, m) => s + m.timeLimitMinutes, 0) + t.breakDurationMinutes;
        const attemptCount = await SATTestAttempt.countDocuments({
          student: req.user?.userId, test: t._id, status: "COMPLETED",
        });
        return {
          ...doc,
          totalQuestions,
          totalMinutes,
          attemptCount,
          modulesSummary: t.modules.map((m) => ({
            name: m.name,
            section: m.section,
            questionCount: m.questions.length,
            timeLimitMinutes: m.timeLimitMinutes,
          })),
        };
      })
    );

    res.status(200).json({ success: true, tests: testsWithMeta });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- Student: start a SAT test ---
export const startSATTest = async (req: AuthRequest, res: Response) => {
  try {
    const test = await SATTest.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, error: "Test not found" });
    if (!test.isActive) return res.status(400).json({ success: false, error: "Test is not active" });

    if (req.user?.subscription === "FREE" && test.accessLevel === "PAID") {
      return res.status(403).json({ success: false, error: "Paid subscription required" });
    }

    // Check for existing in-progress attempt
    const existing = await SATTestAttempt.findOne({
      student: req.user?.userId, test: test._id,
      status: { $in: ["IN_PROGRESS", "ON_BREAK"] },
    });
    if (existing) {
      // Resume existing attempt
      const populatedTest = await SATTest.findById(test._id).populate("modules.questions");
      return res.status(200).json({ success: true, attempt: existing, test: populatedTest, resumed: true });
    }

    const moduleAttempts = test.modules.map((m, idx) => ({
      moduleIndex: idx,
      answers: [],
      startedAt: idx === 0 ? new Date() : null,
      completedAt: null,
      score: 0,
      totalQuestions: m.questions.length,
      correctCount: 0,
    }));

    const totalQuestions = test.modules.reduce((s, m) => s + m.questions.length, 0);

    const attempt = await SATTestAttempt.create({
      student: req.user?.userId,
      test: test._id,
      moduleAttempts,
      currentModuleIndex: 0,
      totalQuestions,
      startedAt: new Date(),
    });

    const populatedTest = await SATTest.findById(test._id).populate("modules.questions");

    res.status(201).json({ success: true, attempt, test: populatedTest });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- Student: save progress (auto-save / manual save) ---
export const saveSATProgress = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { moduleIndex, answers, markedForReview } = req.body;

    const attempt = await SATTestAttempt.findOne({
      _id: id, student: req.user?.userId,
      status: { $in: ["IN_PROGRESS", "ON_BREAK"] },
    });
    if (!attempt) return res.status(404).json({ success: false, error: "Attempt not found" });

    if (moduleIndex !== undefined && attempt.moduleAttempts[moduleIndex]) {
      const modAttempt = attempt.moduleAttempts[moduleIndex];
      if (answers) {
        modAttempt.answers = answers.map((a: any) => ({
          question: a.question,
          selectedAnswer: a.selectedAnswer || null,
          isCorrect: false,
          markedForReview: markedForReview?.[a.question] || false,
          timeSpent: a.timeSpent || 0,
        }));
      }
    }

    await attempt.save();
    res.status(200).json({ success: true, message: "Progress saved" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- Student: complete a module and move to break/next ---
export const completeModule = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { moduleIndex, answers } = req.body;

    const attempt = await SATTestAttempt.findOne({
      _id: id, student: req.user?.userId,
      status: { $in: ["IN_PROGRESS", "ON_BREAK"] },
    });
    if (!attempt) return res.status(404).json({ success: false, error: "Attempt not found" });

    const test = await SATTest.findById(attempt.test);
    if (!test) return res.status(404).json({ success: false, error: "Test not found" });

    const mod = test.modules[moduleIndex];
    const modAttempt = attempt.moduleAttempts[moduleIndex];
    if (!mod || !modAttempt) return res.status(400).json({ success: false, error: "Invalid module index" });

    // Score the answers
    const questionIds = mod.questions.map((q) => q.toString());
    const questions = await Question.find({ _id: { $in: questionIds } });
    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

    let correctCount = 0;
    modAttempt.answers = (answers || []).map((a: any) => {
      const q = questionMap.get(a.question);
      const isCorrect = q ? q.correctAnswer === a.selectedAnswer : false;
      if (isCorrect) correctCount++;
      return {
        question: a.question,
        selectedAnswer: a.selectedAnswer || null,
        isCorrect,
        markedForReview: a.markedForReview || false,
        timeSpent: a.timeSpent || 0,
      };
    });
    modAttempt.correctCount = correctCount;
    modAttempt.score = correctCount;
    modAttempt.completedAt = new Date();

    const nextModuleIndex = moduleIndex + 1;
    const isBreakPoint = moduleIndex === 1 && test.modules.length > 2;

    if (isBreakPoint) {
      // After R&W Module 2, start break
      attempt.status = "ON_BREAK";
      attempt.breakStartedAt = new Date();
      attempt.currentModuleIndex = nextModuleIndex;
    } else if (nextModuleIndex < test.modules.length) {
      // Move to next module
      attempt.currentModuleIndex = nextModuleIndex;
      attempt.moduleAttempts[nextModuleIndex].startedAt = new Date();
      attempt.status = "IN_PROGRESS";
    } else {
      // All modules complete — finalize
      return finalizeAttempt(attempt, res);
    }

    await attempt.save();
    res.status(200).json({ success: true, attempt });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- Student: end break and start next module ---
export const endBreak = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const attempt = await SATTestAttempt.findOne({
      _id: id, student: req.user?.userId, status: "ON_BREAK",
    });
    if (!attempt) return res.status(404).json({ success: false, error: "Attempt not found or not on break" });

    attempt.breakCompletedAt = new Date();
    attempt.status = "IN_PROGRESS";
    const nextIdx = attempt.currentModuleIndex;
    if (attempt.moduleAttempts[nextIdx]) {
      attempt.moduleAttempts[nextIdx].startedAt = new Date();
    }

    await attempt.save();
    res.status(200).json({ success: true, attempt });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- Student: submit entire test ---
export const submitSATTest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const attempt = await SATTestAttempt.findOne({
      _id: id, student: req.user?.userId,
      status: { $in: ["IN_PROGRESS", "ON_BREAK"] },
    });
    if (!attempt) return res.status(404).json({ success: false, error: "Attempt not found" });

    return finalizeAttempt(attempt, res);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

async function finalizeAttempt(attempt: any, res: Response) {
  let totalCorrect = 0;
  let totalQuestions = 0;
  let totalTime = 0;

  for (const mod of attempt.moduleAttempts) {
    totalCorrect += mod.correctCount;
    totalQuestions += mod.totalQuestions;
    if (mod.startedAt && mod.completedAt) {
      totalTime += Math.round(
        (new Date(mod.completedAt).getTime() - new Date(mod.startedAt).getTime()) / 1000
      );
    }
  }

  attempt.totalCorrect = totalCorrect;
  attempt.totalScore = totalCorrect;
  attempt.totalQuestions = totalQuestions;
  attempt.percentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  attempt.totalTimeTaken = totalTime;
  attempt.status = "COMPLETED";
  attempt.completedAt = new Date();

  await attempt.save();
  res.status(200).json({ success: true, attempt });
}

// --- Student: get attempt details ---
export const getSATAttempt = async (req: AuthRequest, res: Response) => {
  try {
    const attempt = await SATTestAttempt.findOne({
      _id: req.params.id, student: req.user?.userId,
    })
      .populate({ path: "test", select: "title year testNumber modules.name modules.section modules.timeLimitMinutes breakDurationMinutes" })
      .populate({ path: "moduleAttempts.answers.question", select: "text options correctAnswer explanation difficulty category" });

    if (!attempt) return res.status(404).json({ success: false, error: "Attempt not found" });
    res.status(200).json({ success: true, attempt });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- Student: list own SAT attempts ---
export const getMySATAttempts = async (req: AuthRequest, res: Response) => {
  try {
    const attempts = await SATTestAttempt.find({
      student: req.user?.userId, status: "COMPLETED",
    })
      .populate("test", "title year testNumber")
      .sort({ completedAt: -1 });

    res.status(200).json({ success: true, attempts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- Admin: list all SAT tests ---
export const getAllSATTestsAdmin = async (req: Request, res: Response) => {
  try {
    const tests = await SATTest.find().sort({ year: -1, testNumber: 1 });
    res.status(200).json({ success: true, tests });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
