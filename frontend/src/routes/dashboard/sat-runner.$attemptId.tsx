import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { Icon } from "../../components/common/Icon";
import { Badge } from "../../components/ui/Badge";
import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import type { SATTest, SATModule, Question } from "../../types";

export const Route = createFileRoute("/dashboard/sat-runner/$attemptId")({
  component: SATRunner,
});

interface LocalAnswer {
  question: string;
  selectedAnswer: string | null;
  markedForReview: boolean;
  timeSpent: number;
}

// Section Directions Content
const rwDirections = (
  <div className="space-y-4 text-sm text-on-surface-variant leading-relaxed">
    <p className="font-bold text-on-surface text-base">Reading and Writing Section Directions</p>
    <p>The questions in this section address a number of important reading and writing skills. Each question includes one or more passages, which may include a table or graph. Read each passage and question carefully, and then choose the best answer to the question based on the passage(s).</p>
    <p>All questions in this section are multiple-choice with four answer choices. Each question has a single best answer.</p>
  </div>
);

const mathDirections = (
  <div className="space-y-4 text-sm text-on-surface-variant leading-relaxed max-h-[400px] overflow-y-auto pr-2">
    <p className="font-bold text-on-surface text-base">Math Section Directions</p>
    <p>The questions in this section address a number of important math skills.</p>
    <p>Use of a calculator is permitted for all questions. A reference sheet, calculator, and these directions can be accessed throughout the test.</p>
    <p className="font-semibold text-on-surface">Unless otherwise indicated:</p>
    <ul className="list-disc pl-5 space-y-1">
      <li>All variables and expressions represent real numbers.</li>
      <li>Figures provided are drawn to scale.</li>
      <li>All figures lie in a plane.</li>
      <li>The domain of a given function f is the set of all real numbers x for which f(x) is a real number.</li>
    </ul>
    <p className="font-semibold text-on-surface">For multiple-choice questions:</p>
    <p>Solve each problem and choose the correct answer from choices provided. Each multiple-choice question has a single correct answer.</p>
    <p className="font-semibold text-on-surface">For student-produced response questions:</p>
    <p>Solve each problem and enter your answer as described below:</p>
    <ul className="list-disc pl-5 space-y-1">
      <li>If you find more than one correct answer, enter only one answer.</li>
      <li>You can enter up to 5 characters for a positive answer and up to 6 characters (including the negative sign) for a negative answer.</li>
      <li>If your answer is a fraction that doesn't fit in the provided space, enter the decimal equivalent.</li>
      <li>If your answer is a decimal that doesn't fit in the provided space, enter it by truncating or rounding at the fourth digit.</li>
      <li>If your answer is a mixed number (such as 3½), enter it as an improper fraction (7/2) or its decimal equivalent (3.5).</li>
      <li>Don't enter symbols such as a percent sign, comma, or dollar sign.</li>
    </ul>
  </div>
);

function SATRunner() {
  const { attemptId } = Route.useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState<SATTest | null>(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, LocalAnswer[]>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [phase, setPhase] = useState<"MODULE" | "BREAK" | "LOADING" | "FINISHED">("LOADING");
  const [breakTimeLeft, setBreakTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showNavGrid, setShowNavGrid] = useState(false);
  const [showTime, setShowTime] = useState(true);
  const { user } = useAuth();
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load attempt + test on mount
  useEffect(() => {
    const load = async () => {
      const res = await api.get(`/api/sat/attempt/${attemptId}`);
      if (!res.success) return;

      const attempt = res.attempt;
      const testData = attempt.test as SATTest;
      setTest(testData);
      setCurrentModuleIndex(attempt.currentModuleIndex);

      // Restore answers from attempt
      const restored: Record<number, LocalAnswer[]> = {};
      for (const ma of attempt.moduleAttempts) {
        restored[ma.moduleIndex] = ma.answers.map((a: any) => ({
          question: typeof a.question === "object" ? a.question._id : a.question,
          selectedAnswer: a.selectedAnswer,
          markedForReview: a.markedForReview || false,
          timeSpent: a.timeSpent || 0,
        }));
      }
      setAnswers(restored);

      if (attempt.status === "ON_BREAK") {
        setPhase("BREAK");
        const breakElapsed = attempt.breakStartedAt
          ? Math.floor((Date.now() - new Date(attempt.breakStartedAt).getTime()) / 1000)
          : 0;
        setBreakTimeLeft(Math.max(0, testData.breakDurationMinutes * 60 - breakElapsed));
      } else if (attempt.status === "IN_PROGRESS") {
        setPhase("MODULE");
        const mod = testData.modules[attempt.currentModuleIndex];
        const modAttempt = attempt.moduleAttempts[attempt.currentModuleIndex];
        if (mod && modAttempt?.startedAt) {
          const elapsed = Math.floor(
            (Date.now() - new Date(modAttempt.startedAt).getTime()) / 1000
          );
          setTimeLeft(Math.max(0, mod.timeLimitMinutes * 60 - elapsed));
        }
      } else if (attempt.status === "COMPLETED") {
        setPhase("FINISHED");
      }
    };
    load();
  }, [attemptId]);

  // Module countdown timer
  useEffect(() => {
    if (phase !== "MODULE" || timeLeft <= 0) return;
    const timer = setTimeout(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleModuleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [phase, timeLeft]);

  // Break countdown timer
  useEffect(() => {
    if (phase !== "BREAK" || breakTimeLeft <= 0) return;
    const timer = setTimeout(() => {
      setBreakTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [phase, breakTimeLeft]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (phase !== "MODULE") return;
    autoSaveTimer.current = setInterval(() => {
      saveProgress();
    }, 30000);
    return () => {
      if (autoSaveTimer.current) clearInterval(autoSaveTimer.current);
    };
  }, [phase, currentModuleIndex, answers]);

  const saveProgress = useCallback(async () => {
    const modAnswers = answers[currentModuleIndex] || [];
    await api.post(`/api/sat/attempt/${attemptId}/save`, {
      moduleIndex: currentModuleIndex,
      answers: modAnswers,
    });
  }, [answers, currentModuleIndex, attemptId]);

  const handleModuleTimeUp = useCallback(async () => {
    await completeCurrentModule();
  }, [currentModuleIndex, answers, attemptId]);

  const completeCurrentModule = async () => {
    if (submitting) return;
    setSubmitting(true);

    const modAnswers = answers[currentModuleIndex] || [];
    const res = await api.post(`/api/sat/attempt/${attemptId}/complete-module`, {
      moduleIndex: currentModuleIndex,
      answers: modAnswers,
    });

    if (res.success) {
      const attempt = res.attempt;
      if (attempt.status === "ON_BREAK") {
        setPhase("BREAK");
        setBreakTimeLeft((test?.breakDurationMinutes || 10) * 60);
        setCurrentModuleIndex(attempt.currentModuleIndex);
        setCurrentQuestionIndex(0);
      } else if (attempt.status === "COMPLETED") {
        setPhase("FINISHED");
      } else {
        // Next module
        setCurrentModuleIndex(attempt.currentModuleIndex);
        setCurrentQuestionIndex(0);
        const nextMod = test?.modules[attempt.currentModuleIndex];
        if (nextMod) setTimeLeft(nextMod.timeLimitMinutes * 60);
        setPhase("MODULE");
      }
    }
    setSubmitting(false);
  };

  const handleEndBreak = async () => {
    const res = await api.post(`/api/sat/attempt/${attemptId}/end-break`, {});
    if (res.success) {
      setPhase("MODULE");
      const nextMod = test?.modules[currentModuleIndex];
      if (nextMod) setTimeLeft(nextMod.timeLimitMinutes * 60);
      setCurrentQuestionIndex(0);
    }
  };

  const handleSubmitAll = async () => {
    if (!confirm("Are you sure you want to submit the entire test? This cannot be undone.")) return;
    setSubmitting(true);
    const res = await api.post(`/api/sat/attempt/${attemptId}/submit`, {});
    if (res.success) {
      navigate({ to: `/dashboard/sat-result/${attemptId}` });
    }
    setSubmitting(false);
  };

  const selectAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => {
      const modAnswers = [...(prev[currentModuleIndex] || [])];
      const idx = modAnswers.findIndex((a) => a.question === questionId);
      if (idx >= 0) {
        modAnswers[idx] = { ...modAnswers[idx], selectedAnswer: answer };
      } else {
        modAnswers.push({ question: questionId, selectedAnswer: answer, markedForReview: false, timeSpent: 0 });
      }
      return { ...prev, [currentModuleIndex]: modAnswers };
    });
  };

  const toggleReview = (questionId: string) => {
    setAnswers((prev) => {
      const modAnswers = [...(prev[currentModuleIndex] || [])];
      const idx = modAnswers.findIndex((a) => a.question === questionId);
      if (idx >= 0) {
        modAnswers[idx] = { ...modAnswers[idx], markedForReview: !modAnswers[idx].markedForReview };
      } else {
        modAnswers.push({ question: questionId, selectedAnswer: null, markedForReview: true, timeSpent: 0 });
      }
      return { ...prev, [currentModuleIndex]: modAnswers };
    });
  };

  const getAnswer = (questionId: string): LocalAnswer | undefined => {
    return (answers[currentModuleIndex] || []).find((a) => a.question === questionId);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (phase === "LOADING" || !test) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Icon name="hourglass_top" className="text-5xl text-primary mb-4 animate-pulse" />
          <div className="text-on-surface-variant font-semibold">Loading your SAT test...</div>
        </div>
      </div>
    );
  }

  if (phase === "FINISHED") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <Icon name="check_circle" className="text-6xl text-primary mb-4" />
          <h1 className="text-2xl font-bold mb-2">Test Submitted</h1>
          <p className="text-on-surface-variant mb-6">Your SAT practice test has been submitted and scored.</p>
          <button
            onClick={() => navigate({ to: `/dashboard/sat-result/${attemptId}` })}
            className="btn-shimmer bg-primary text-on-primary px-8 py-3 rounded-xl font-semibold hover:bg-accent transition-colors cursor-pointer"
          >
            View Results
          </button>
        </div>
      </div>
    );
  }

  // --- BREAK SCREEN ---
  if (phase === "BREAK") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-lg p-10 rounded-2xl bg-surface-container-lowest shark-shadow border border-outline-variant/40">
          <Icon name="coffee" className="text-6xl text-accent mb-4" />
          <h1 className="text-3xl font-bold mb-2">Break Time</h1>
          <p className="text-on-surface-variant mb-6">
            You've completed the Reading & Writing section. Take a 10-minute break before starting Math.
          </p>
          <div className="text-5xl font-mono font-bold text-primary mb-8">
            {formatTime(breakTimeLeft)}
          </div>
          <div className="space-y-3">
            <button
              onClick={handleEndBreak}
              className="w-full btn-shimmer bg-primary text-on-primary py-3.5 rounded-xl font-semibold hover:bg-accent transition-colors cursor-pointer"
            >
              Resume Test — Start Math Section
            </button>
            <p className="text-xs text-on-surface-variant">You can resume early or wait for the timer</p>
          </div>
        </div>
      </div>
    );
  }

  // --- MODULE SCREEN ---
  const currentModule: SATModule = test.modules[currentModuleIndex];
  const questions: Question[] = currentModule?.questions || [];
  const q = questions[currentQuestionIndex];
  const currentAnswer = q ? getAnswer(q._id) : undefined;
  const answeredCount = (answers[currentModuleIndex] || []).filter((a) => a.selectedAnswer).length;
  const reviewCount = (answers[currentModuleIndex] || []).filter((a) => a.markedForReview).length;
  const isWarning = timeLeft < 120 && timeLeft > 0;
  const isLastModule = currentModuleIndex === test.modules.length - 1;

  const getRWTextSplit = (text: string) => {
    const newlineIdx = text.lastIndexOf("\n");
    if (newlineIdx !== -1) {
      return {
        passage: text.substring(0, newlineIdx).trim(),
        prompt: text.substring(newlineIdx + 1).trim(),
      };
    }
    return {
      passage: text,
      prompt: "",
    };
  };

  const isRW = currentModule.section === "READING_WRITING";
  const rwSplit = q ? getRWTextSplit(q.text) : { passage: "", prompt: "" };
  const showMathTools = currentModule.section === "MATH";

  return (
    <div className="h-screen bg-background text-on-background flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-outline-variant/40 px-6 py-2.5">
        <div className="max-w-[1400px] mx-auto grid grid-cols-3 items-center w-full relative">
          <div className="flex items-center gap-4 justify-self-start">
            <h1 className="font-bold text-sm text-on-surface">
              {currentModule.name.replace(/\s*-\s*(Easier|Harder)/i, "")}
            </h1>
            <button
              onClick={() => setShowDirectionsModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-outline-variant hover:bg-surface-container-low transition-colors text-xs font-semibold cursor-pointer"
            >
              <Icon name="info" className="text-[14px]" />
              <span>Directions</span>
            </button>
          </div>

          {/* Center Timer */}
          <div className="flex flex-col items-center gap-1 justify-self-center">
            <div className={`flex items-center gap-2 font-mono text-base font-bold min-w-[70px] justify-center transition-opacity ${showTime ? "text-primary opacity-100" : "text-transparent opacity-0 pointer-events-none select-none"
              } ${isWarning && showTime ? "text-error animate-pulse" : ""}`}>
              <Icon name="timer" className="text-[18px]" />
              {formatTime(timeLeft)}
            </div>
            <button
              onClick={() => setShowTime(!showTime)}
              className="px-3 py-0.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-[10px] font-bold tracking-wider uppercase cursor-pointer transition-colors border-none"
            >
              {showTime ? "Hide" : "Show"}
            </button>
          </div>

          {/* Guidelines Tool Buttons */}
          <div className="flex items-center gap-2 justify-self-end">
            {showMathTools && (
              <>
                <button
                  onClick={() => setShowCalculatorModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container-low transition-colors text-xs font-semibold cursor-pointer"
                >
                  <Icon name="calculate" className="text-[16px]" />
                  <span className="hidden sm:inline">Calculator</span>
                </button>
                <button
                  onClick={() => setShowReferenceModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container-low transition-colors text-xs font-semibold cursor-pointer"
                >
                  <Icon name="functions" className="text-[16px]" />
                  <span className="hidden sm:inline">Reference</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-surface-container-high">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Area */}
      <div className="flex-1 flex justify-center w-full min-h-0 bg-background overflow-hidden">
        {q && (
          isRW ? (
            /* Split Screen for Reading & Writing */
            <div className="w-full max-w-[1400px] grid grid-cols-1 md:grid-cols-2 gap-6 px-6 py-5 h-full min-h-0 overflow-hidden">
              {/* Left Column: Passage */}
              <div className="flex flex-col h-full min-h-0 overflow-hidden bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shark-shadow">
                <div className="bg-surface-container-low px-5 py-3 border-b border-outline-variant/30 flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Passage</span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                  <p className="text-[15px] leading-relaxed text-on-surface whitespace-pre-wrap">{rwSplit.passage}</p>
                </div>
              </div>

              {/* Right Column: Question Prompt & Options */}
              <div className="flex flex-col h-full min-h-0 overflow-hidden bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shark-shadow">
                <div className="bg-surface-container-low px-5 py-2.5 border-b border-outline-variant/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 bg-primary text-on-primary rounded flex items-center justify-center text-xs font-bold">
                      {currentQuestionIndex + 1}
                    </span>
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Question</span>
                  </div>

                  <button
                    onClick={() => toggleReview(q._id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${currentAnswer?.markedForReview
                        ? "bg-accent text-primary"
                        : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                      }`}
                  >
                    <Icon name={currentAnswer?.markedForReview ? "flag" : "outlined_flag"} className="text-[14px]" />
                    <span>{currentAnswer?.markedForReview ? "Flagged" : "Flag"}</span>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  {rwSplit.prompt && (
                    <p className="text-[15px] font-semibold text-on-surface leading-relaxed mb-5 whitespace-pre-wrap">{rwSplit.prompt}</p>
                  )}

                  {q.options && q.options.length > 0 && (
                    <div className="space-y-2">
                      {q.options.map((opt) => {
                        const selected = currentAnswer?.selectedAnswer === opt.label;
                        return (
                          <button
                            key={opt.label}
                            onClick={() => selectAnswer(q._id, opt.label)}
                            className={`w-full flex items-center gap-4 py-3 px-4 rounded-xl border-2 text-left transition-all cursor-pointer ${selected
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-outline-variant/40 hover:border-primary/40 hover:bg-surface-container-low"
                              }`}
                          >
                            <span
                              className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${selected
                                  ? "bg-primary text-on-primary"
                                  : "bg-surface-container-high text-on-surface"
                                }`}
                            >
                              {opt.label}
                            </span>
                            <span className="text-sm leading-relaxed">{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Split Screen for Math */
            <div className="w-full max-w-[1400px] grid grid-cols-1 md:grid-cols-2 gap-6 px-6 py-5 h-full min-h-0 overflow-hidden">
              {/* Left Column: Math Question Text */}
              <div className="flex flex-col h-full min-h-0 overflow-hidden bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shark-shadow">
                <div className="bg-surface-container-low px-5 py-3 border-b border-outline-variant/30 flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Question Context</span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                  <p className="text-[15px] leading-relaxed text-on-surface whitespace-pre-wrap">{q.text}</p>
                </div>
              </div>

              {/* Right Column: MCQ Options or Student-Produced Response Input Field */}
              <div className="flex flex-col h-full min-h-0 overflow-hidden bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shark-shadow">
                <div className="bg-surface-container-low px-5 py-2.5 border-b border-outline-variant/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 bg-primary text-on-primary rounded flex items-center justify-center text-xs font-bold">
                      {currentQuestionIndex + 1}
                    </span>
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Answer Choices</span>
                  </div>

                  <button
                    onClick={() => toggleReview(q._id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${currentAnswer?.markedForReview
                        ? "bg-accent text-primary"
                        : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                      }`}
                  >
                    <Icon name={currentAnswer?.markedForReview ? "flag" : "outlined_flag"} className="text-[14px]" />
                    <span>{currentAnswer?.markedForReview ? "Flagged" : "Flag"}</span>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  {q.options && q.options.length > 0 ? (
                    <div className="space-y-2">
                      {q.options.map((opt) => {
                        const selected = currentAnswer?.selectedAnswer === opt.label;
                        return (
                          <button
                            key={opt.label}
                            onClick={() => selectAnswer(q._id, opt.label)}
                            className={`w-full flex items-center gap-4 py-3 px-4 rounded-xl border-2 text-left transition-all cursor-pointer ${selected
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-outline-variant/40 hover:border-primary/40 hover:bg-surface-container-low"
                              }`}
                          >
                            <span
                              className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${selected
                                  ? "bg-primary text-on-primary"
                                  : "bg-surface-container-high text-on-surface"
                                }`}
                            >
                              {opt.label}
                            </span>
                            <span className="text-sm leading-relaxed">{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    /* Student-Produced Response Input Field */
                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-on-surface uppercase tracking-wider">
                        Enter Your Answer
                      </label>
                      <input
                        type="text"
                        value={currentAnswer?.selectedAnswer || ""}
                        onChange={(e) => selectAnswer(q._id, e.target.value)}
                        placeholder="Type your answer here..."
                        className="w-full max-w-[300px] px-5 py-4 rounded-xl border-2 border-outline-variant/60 focus:border-primary focus:outline-none text-lg font-mono tracking-wide transition-all bg-surface text-on-surface focus:shadow-md"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* Footer Navigation Bar */}
      <div className="border-t border-outline-variant/40 bg-surface-container-lowest px-6 py-3.5 z-40">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between relative">
          {/* Left: Student Name */}
          <div className="text-sm font-bold text-on-surface">
            {user?.name || "Student"}
          </div>

          {/* Center: Question Navigation Popover Button */}
          <div className="relative">
            <button
              onClick={() => setShowNavGrid(!showNavGrid)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-sm font-bold cursor-pointer transition-all border border-outline-variant/40 shadow-sm"
            >
              Question {currentQuestionIndex + 1} of {questions.length}
              <Icon name={showNavGrid ? "expand_more" : "expand_less"} className="text-[18px]" />
            </button>

            {showNavGrid && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-4 shadow-xl z-50 min-w-[300px] max-w-[90vw] animate-scale-in">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-outline-variant/30">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Question Navigation</span>
                  <button
                    onClick={() => setShowNavGrid(false)}
                    className="p-1 rounded hover:bg-surface-container-low text-on-surface-variant"
                  >
                    <Icon name="close" className="text-[16px]" />
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-2 max-h-[220px] overflow-y-auto p-1">
                  {questions.map((q, i) => {
                    const ans = getAnswer(q._id);
                    const isAnswered = !!ans?.selectedAnswer && ans.selectedAnswer !== "";
                    const isReview = !!ans?.markedForReview;
                    const isCurrent = i === currentQuestionIndex;
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setCurrentQuestionIndex(i);
                          setShowNavGrid(false);
                        }}
                        className={`relative h-9 w-9 rounded-lg text-xs font-bold transition-all cursor-pointer ${isCurrent
                            ? isAnswered
                              ? "bg-primary text-on-primary border-b-[3px] border-b-accent ring-2 ring-primary/40 ring-offset-1"
                              : "bg-surface-container-low text-on-surface border-b-[3px] border-b-primary border-x border-t border-outline-variant/40 ring-2 ring-primary/40 ring-offset-1"
                            : isAnswered
                              ? "bg-primary text-on-primary hover:bg-primary/90"
                              : "bg-surface-container-low text-on-surface-variant/70 border border-outline-variant/30 hover:bg-surface-container-high"
                          }`}
                      >
                        {i + 1}
                        {isReview && (
                          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-accent border border-white animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Popover Legend */}
                <div className="flex gap-4 items-center justify-between text-[10px] font-semibold text-on-surface-variant mt-4 pt-3 border-t border-outline-variant/30">
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-primary" />
                    <span>Attempted</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-surface-container-low border border-outline-variant/30" />
                    <span>Unattempted</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-surface-container-low border-b-2 border-b-primary border-x border-t border-outline-variant/30" />
                    <span>Current</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right: Previous / Next Actions */}
          <div className="flex items-center gap-3">
            {/* Back Button */}
            <button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-outline-variant text-sm font-semibold disabled:opacity-30 hover:bg-surface-container-low transition-colors cursor-pointer"
            >
              Back
            </button>

            {/* Next Button */}
            {currentQuestionIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold hover:bg-accent hover:text-primary transition-colors cursor-pointer"
              >
                Next
              </button>
            ) : (
              <button
                onClick={completeCurrentModule}
                disabled={submitting}
                className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold hover:bg-accent hover:text-primary transition-colors disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Submitting..." : isLastModule ? "Submit Test" : "Next"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Directions Modal */}
      {showDirectionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-outline-variant/40 rounded-2xl p-6 max-w-lg w-full shark-shadow flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3 mb-4">
              <h3 className="text-lg font-bold text-on-surface">Directions</h3>
              <button
                onClick={() => setShowDirectionsModal(false)}
                className="p-1.5 rounded-lg hover:bg-surface-container-low transition-colors text-on-surface-variant cursor-pointer"
              >
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2">
              {showMathTools ? mathDirections : rwDirections}
            </div>
            <div className="flex justify-end pt-4 border-t border-outline-variant/40 mt-4">
              <button
                onClick={() => setShowDirectionsModal(false)}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary hover:bg-accent hover:text-primary transition-colors font-semibold text-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calculator Modal */}
      {showCalculatorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-outline-variant/40 rounded-2xl p-6 max-w-4xl w-full shark-shadow flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Icon name="calculate" className="text-primary text-[24px]" />
                <h3 className="text-lg font-bold text-on-surface">Desmos Graphing Calculator</h3>
              </div>
              <button
                onClick={() => setShowCalculatorModal(false)}
                className="p-1.5 rounded-lg hover:bg-surface-container-low transition-colors text-on-surface-variant cursor-pointer"
              >
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>
            <div className="flex-1 rounded-xl overflow-hidden bg-surface-container-low min-h-[500px]">
              <iframe
                src="https://www.desmos.com/testing/cb-digital-sat/graphing"
                className="w-full h-full min-h-[500px] border-0"
                title="Desmos Graphing Calculator"
              />
            </div>
            <div className="flex justify-end pt-4 border-t border-outline-variant/40 mt-4">
              <button
                onClick={() => setShowCalculatorModal(false)}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary hover:bg-accent hover:text-primary transition-colors font-semibold text-sm cursor-pointer"
              >
                Close Calculator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reference Sheet Modal */}
      {showReferenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-outline-variant/40 rounded-2xl p-6 max-w-3xl w-full shark-shadow flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Icon name="functions" className="text-primary text-[24px]" />
                <h3 className="text-lg font-bold text-on-surface">Math Reference Sheet</h3>
              </div>
              <button
                onClick={() => setShowReferenceModal(false)}
                className="p-1.5 rounded-lg hover:bg-surface-container-low transition-colors text-on-surface-variant cursor-pointer"
              >
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
              {/* Formula Cards Grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Circle */}
                <div className="p-4 rounded-xl border border-outline-variant/40 bg-surface-container-low">
                  <h4 className="font-bold text-sm text-on-surface mb-2">Circle</h4>
                  <div className="flex justify-between items-center text-xs text-on-surface-variant">
                    <div>
                      <p>{"Area: \\(A = \\pi r^2\\)"}</p>
                      <p>{"Circumference: \\(C = 2\\pi r\\)"}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full border-2 border-primary/40 flex items-center justify-center relative">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary absolute"></span>
                      <span className="text-[9px] text-primary absolute right-1 top-4">r</span>
                      <div className="w-6 h-0.5 bg-primary/40 absolute left-6 top-6"></div>
                    </div>
                  </div>
                </div>

                {/* Rectangle */}
                <div className="p-4 rounded-xl border border-outline-variant/40 bg-surface-container-low">
                  <h4 className="font-bold text-sm text-on-surface mb-2">Rectangle</h4>
                  <div className="flex justify-between items-center text-xs text-on-surface-variant">
                    <div>
                      <p>{"Area: \\(A = l w\\)"}</p>
                    </div>
                    <div className="w-16 h-10 border-2 border-primary/40 flex items-center justify-center relative">
                      <span className="text-[9px] text-primary absolute bottom-0.5">l</span>
                      <span className="text-[9px] text-primary absolute right-1">w</span>
                    </div>
                  </div>
                </div>

                {/* Triangle */}
                <div className="p-4 rounded-xl border border-outline-variant/40 bg-surface-container-low">
                  <h4 className="font-bold text-sm text-on-surface mb-2">Triangle</h4>
                  <div className="flex justify-between items-center text-xs text-on-surface-variant">
                    <div>
                      <p>{"Area: \\(A = \\frac{1}{2} b h\\)"}</p>
                    </div>
                    <div className="w-14 h-12 relative">
                      <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-primary/40 stroke-2">
                        <polygon points="50,10 10,90 90,90" />
                        <line x1="50" y1="10" x2="50" y2="90" strokeDasharray="3" />
                      </svg>
                      <span className="text-[9px] text-primary absolute left-10 bottom-0.5">b</span>
                      <span className="text-[9px] text-primary absolute left-[54px] top-6">h</span>
                    </div>
                  </div>
                </div>

                {/* Right Triangle */}
                <div className="p-4 rounded-xl border border-outline-variant/40 bg-surface-container-low">
                  <h4 className="font-bold text-sm text-on-surface mb-2">Right Triangle</h4>
                  <div className="flex justify-between items-center text-xs text-on-surface-variant">
                    <div>
                      <p>Pythagorean Theorem:</p>
                      <p className="font-bold">{"\\(c^2 = a^2 + b^2\\)"}</p>
                    </div>
                    <div className="w-14 h-12 relative">
                      <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-primary/40 stroke-2">
                        <polygon points="10,10 10,90 90,90" />
                        <rect x="10" y="80" width="10" height="10" />
                      </svg>
                      <span className="text-[9px] text-primary absolute left-[45px] top-[40px]">c</span>
                      <span className="text-[9px] text-primary absolute left-2 top-[40px]">a</span>
                      <span className="text-[9px] text-primary absolute left-[45px] bottom-0.5">b</span>
                    </div>
                  </div>
                </div>

                {/* Cylinder */}
                <div className="p-4 rounded-xl border border-outline-variant/40 bg-surface-container-low">
                  <h4 className="font-bold text-sm text-on-surface mb-2">Cylinder</h4>
                  <div className="flex justify-between items-center text-xs text-on-surface-variant">
                    <div>
                      <p>{"Volume: \\(V = \\pi r^2 h\\)"}</p>
                    </div>
                    <div className="w-14 h-12 relative">
                      <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-primary/40 stroke-2">
                        <ellipse cx="50" cy="20" rx="30" ry="10" />
                        <ellipse cx="50" cy="80" rx="30" ry="10" />
                        <line x1="20" y1="20" x2="20" y2="80" />
                        <line x1="80" y1="20" x2="80" y2="80" />
                        <line x1="50" y1="20" x2="80" y2="20" strokeDasharray="2" />
                      </svg>
                      <span className="text-[9px] text-primary absolute right-6 top-1">r</span>
                      <span className="text-[9px] text-primary absolute right-1 top-[40px]">h</span>
                    </div>
                  </div>
                </div>

                {/* Sphere */}
                <div className="p-4 rounded-xl border border-outline-variant/40 bg-surface-container-low">
                  <h4 className="font-bold text-sm text-on-surface mb-2">Sphere</h4>
                  <div className="flex justify-between items-center text-xs text-on-surface-variant">
                    <div>
                      <p>{"Volume: \\(V = \\frac{4}{3} \\pi r^3\\)"}</p>
                    </div>
                    <div className="w-12 h-12 relative">
                      <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-primary/40 stroke-2">
                        <circle cx="50" cy="50" r="40" />
                        <ellipse cx="50" cy="50" rx="40" ry="12" strokeDasharray="3" />
                        <line x1="50" y1="50" x2="90" y2="50" strokeDasharray="2" />
                      </svg>
                      <span className="text-[9px] text-primary absolute right-4 top-4">r</span>
                    </div>
                  </div>
                </div>

                {/* Cone */}
                <div className="p-4 rounded-xl border border-outline-variant/40 bg-surface-container-low">
                  <h4 className="font-bold text-sm text-on-surface mb-2">Cone</h4>
                  <div className="flex justify-between items-center text-xs text-on-surface-variant">
                    <div>
                      <p>{"Volume: \\(V = \\frac{1}{3} \\pi r^2 h\\)"}</p>
                    </div>
                    <div className="w-14 h-12 relative">
                      <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-primary/40 stroke-2">
                        <ellipse cx="50" cy="80" rx="30" ry="10" />
                        <line x1="50" y1="10" x2="20" y2="80" />
                        <line x1="50" y1="10" x2="80" y2="80" />
                        <line x1="50" y1="10" x2="50" y2="80" strokeDasharray="3" />
                        <line x1="50" y1="80" x2="80" y2="80" strokeDasharray="2" />
                      </svg>
                      <span className="text-[9px] text-primary absolute right-6 bottom-2">r</span>
                      <span className="text-[9px] text-primary absolute left-9 top-8">h</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-outline-variant/40 mt-4">
              <button
                onClick={() => setShowReferenceModal(false)}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary hover:bg-accent hover:text-primary transition-colors font-semibold text-sm cursor-pointer"
              >
                Close Reference
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
