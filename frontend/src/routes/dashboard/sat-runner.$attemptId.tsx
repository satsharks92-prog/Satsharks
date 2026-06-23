import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { Icon } from "../../components/common/Icon";
import { Badge } from "../../components/ui/Badge";
import { api } from "../../services/api";
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
  const [showNav, setShowNav] = useState(false);
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
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleModuleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, timeLeft > 0]);

  // Break countdown timer
  useEffect(() => {
    if (phase !== "BREAK" || breakTimeLeft <= 0) return;
    const timer = setInterval(() => {
      setBreakTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, breakTimeLeft > 0]);

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

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-primary text-on-primary px-4 py-2.5">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="font-bold text-sm">{currentModule.name}</div>
            <Badge variant={currentModule.section === "MATH" ? "info" : "accent"} className="!text-[10px]">
              {currentModule.section === "MATH" ? "Math" : "R&W"}
            </Badge>
          </div>
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 font-mono text-lg font-bold ${isWarning ? "text-accent animate-pulse" : ""}`}>
              <Icon name="timer" className="text-[20px]" />
              {formatTime(timeLeft)}
            </div>
            <button
              onClick={() => setShowNav(!showNav)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 text-xs font-bold hover:bg-white/25 transition-colors cursor-pointer"
            >
              <Icon name="grid_view" className="text-[16px]" />
              {answeredCount}/{questions.length}
              {reviewCount > 0 && <span className="ml-1 text-accent">({reviewCount}⚑)</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-surface-container-high">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Navigation Overlay */}
      {showNav && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowNav(false)}>
          <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-md w-full shark-shadow" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Question Navigator</h3>
              <button onClick={() => setShowNav(false)} className="p-1 hover:bg-surface-container-low rounded-full cursor-pointer">
                <Icon name="close" className="text-xl" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {questions.map((q, i) => {
                const ans = getAnswer(q._id);
                const isAnswered = !!ans?.selectedAnswer;
                const isReview = !!ans?.markedForReview;
                const isCurrent = i === currentQuestionIndex;
                return (
                  <button
                    key={i}
                    onClick={() => { setCurrentQuestionIndex(i); setShowNav(false); }}
                    className={`relative h-10 w-10 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isCurrent ? "bg-primary text-on-primary ring-2 ring-accent"
                      : isAnswered ? "bg-primary/20 text-primary"
                      : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                    }`}
                  >
                    {i + 1}
                    {isReview && (
                      <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-accent border border-white" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-4 text-xs text-on-surface-variant">
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-primary/20" /> Answered</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-surface-container-high" /> Unanswered</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-accent" /> Flagged</span>
            </div>
          </div>
        </div>
      )}

      {/* Question Content */}
      <div className="flex-1 flex justify-center px-4 py-8">
        <div className="w-full max-w-[800px]">
          {q && (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs text-on-surface-variant">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <button
                  onClick={() => toggleReview(q._id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentAnswer?.markedForReview
                      ? "bg-accent text-primary"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  <Icon name={currentAnswer?.markedForReview ? "flag" : "outlined_flag"} className="text-[16px]" />
                  {currentAnswer?.markedForReview ? "Flagged" : "Mark for Review"}
                </button>
              </div>

              <div className="rounded-2xl bg-surface-container-lowest p-8 border border-outline-variant/40 shark-shadow mb-6">
                <p className="text-base leading-relaxed whitespace-pre-wrap">{q.text}</p>
              </div>

              {q.options && q.options.length >= 2 ? (
                <div className="space-y-3">
                  {q.options.map((opt) => {
                    const selected = currentAnswer?.selectedAnswer === opt.label;
                    return (
                      <button
                        key={opt.label}
                        onClick={() => selectAnswer(q._id, opt.label)}
                        className={`w-full flex items-center gap-4 p-5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                          selected
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-outline-variant/40 hover:border-primary/40 hover:bg-surface-container-low"
                        }`}
                      >
                        <span className={`flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                          selected ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface"
                        }`}>
                          {opt.label}
                        </span>
                        <span className="text-sm leading-relaxed">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Free-response input */
                <div>
                  <label className="block font-mono text-[12px] uppercase tracking-[0.08em] text-on-surface-variant mb-2">Your Answer</label>
                  <input
                    type="text"
                    value={currentAnswer?.selectedAnswer || ""}
                    onChange={(e) => selectAnswer(q._id, e.target.value)}
                    placeholder="Type your answer..."
                    className="w-full rounded-xl border-2 border-outline-variant bg-surface-container-low px-5 py-4 text-lg font-mono outline-none focus:border-primary transition-colors"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="border-t border-outline-variant/40 bg-surface-container-lowest px-4 py-3">
        <div className="max-w-[800px] mx-auto flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant text-sm font-semibold disabled:opacity-30 hover:bg-surface-container-low transition-colors cursor-pointer"
          >
            <Icon name="chevron_left" className="text-[18px]" /> Previous
          </button>

          <div className="flex gap-3">
            {currentQuestionIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-accent transition-colors cursor-pointer"
              >
                Next <Icon name="chevron_right" className="text-[18px]" />
              </button>
            ) : (
              <button
                onClick={completeCurrentModule}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-primary text-sm font-bold hover:bg-accent/80 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Icon name={isLastModule ? "check_circle" : "skip_next"} className="text-[18px]" />
                {submitting ? "Submitting..." : isLastModule ? "Submit Test" : "Finish Module"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
