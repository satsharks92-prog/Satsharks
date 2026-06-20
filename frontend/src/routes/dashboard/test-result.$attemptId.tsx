import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { StudentLayout } from "../../components/layout/StudentLayout";
import { ScoreCircle } from "../../components/ui/ScoreCircle";
import { Badge } from "../../components/ui/Badge";
import { Icon } from "../../components/common/Icon";
import { api } from "../../services/api";
import type { TestAttempt, Question } from "../../types";

export const Route = createFileRoute("/dashboard/test-result/$attemptId")({
  component: TestResult,
});

function TestResult() {
  const { attemptId } = Route.useParams();
  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    api.get(`/api/tests/attempt/${attemptId}`).then((res) => {
      if (res.success) setAttempt(res.attempt);
      setLoading(false);
    });
  }, [attemptId]);

  if (loading) {
    return (
      <StudentLayout activeItem="/dashboard/tests">
        <div className="text-center py-12 text-on-surface-variant">Loading results...</div>
      </StudentLayout>
    );
  }

  if (!attempt) {
    return (
      <StudentLayout activeItem="/dashboard/tests">
        <div className="text-center py-12 text-error">Result not found</div>
      </StudentLayout>
    );
  }

  const test = attempt.test as any;
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  return (
    <StudentLayout activeItem="/dashboard/tests">
      <div className="max-w-[900px] mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Test Complete!</h1>
          <p className="text-on-surface-variant">{test?.title || "Diagnostic Test"}</p>
        </div>

        <div className="rounded-2xl bg-surface-container-lowest p-10 shark-shadow border border-outline-variant/40 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <ScoreCircle score={attempt.percentage} maxScore={100} size={180} label="Your Score" />

            <div className="flex-1 grid grid-cols-2 gap-6">
              <div className="text-center p-4 rounded-xl bg-surface-container-low">
                <div className="text-2xl font-bold text-primary">{attempt.correctCount}</div>
                <div className="text-xs text-on-surface-variant mt-1">Correct</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-surface-container-low">
                <div className="text-2xl font-bold text-error">{attempt.totalQuestions - attempt.correctCount}</div>
                <div className="text-xs text-on-surface-variant mt-1">Incorrect</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-surface-container-low">
                <div className="text-2xl font-bold text-on-surface">{attempt.totalQuestions}</div>
                <div className="text-xs text-on-surface-variant mt-1">Total Questions</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-surface-container-low">
                <div className="text-2xl font-bold text-accent">{formatTime(attempt.timeTaken)}</div>
                <div className="text-xs text-on-surface-variant mt-1">Time Taken</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          <Link
            to="/dashboard/tests"
            className="flex-1 py-3 rounded-xl border border-outline-variant text-center text-sm font-semibold hover:bg-surface-container-low transition-colors"
          >
            Back to Tests
          </Link>
          <button
            onClick={() => setShowReview(!showReview)}
            className="flex-1 py-3 rounded-xl bg-primary text-on-primary text-center text-sm font-semibold hover:bg-accent transition-colors cursor-pointer"
          >
            {showReview ? "Hide Review" : "Review Answers"}
          </button>
        </div>

        {showReview && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Answer Review</h2>
            {attempt.answers.map((ans, idx) => {
              const q = ans.question as Question;
              if (!q || typeof q === "string") return null;
              return (
                <div
                  key={idx}
                  className={`rounded-xl p-6 border ${
                    ans.isCorrect ? "border-primary/30 bg-primary/5" : "border-error/30 bg-error/5"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="font-mono text-xs text-on-surface-variant">Q{idx + 1}</span>
                    <Badge variant={ans.isCorrect ? "success" : "error"}>
                      {ans.isCorrect ? "Correct" : "Incorrect"}
                    </Badge>
                  </div>
                  <p className="text-sm mb-4 leading-relaxed">{q.text}</p>
                  <div className="space-y-2">
                    {q.options?.map((opt) => {
                      const isSelected = ans.selectedAnswer === opt.label;
                      const isCorrectOption = q.correctAnswer === opt.label;
                      return (
                        <div
                          key={opt.label}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm ${
                            isCorrectOption
                              ? "bg-primary/15 text-primary font-semibold"
                              : isSelected && !ans.isCorrect
                              ? "bg-error/15 text-error"
                              : "text-on-surface-variant"
                          }`}
                        >
                          <span className="font-bold w-6">{opt.label}.</span>
                          <span>{opt.text}</span>
                          {isCorrectOption && <Icon name="check_circle" className="ml-auto text-primary text-[18px]" />}
                          {isSelected && !isCorrectOption && <Icon name="cancel" className="ml-auto text-error text-[18px]" />}
                        </div>
                      );
                    })}
                  </div>
                  {q.explanation && (
                    <div className="mt-3 p-3 rounded-lg bg-surface-container-low text-xs text-on-surface-variant">
                      <strong>Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
