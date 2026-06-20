import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { Icon } from "../../components/common/Icon";
import { api } from "../../services/api";
import type { Question } from "../../types";

export const Route = createFileRoute("/dashboard/take-test/$attemptId")({
  component: TakeTest,
});

function TakeTest() {
  const { attemptId } = Route.useParams();
  const search: any = useSearch({ from: "/dashboard/take-test/$attemptId" });
  const testId = search.testId;
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [testTitle, setTestTitle] = useState("");
  const [timeLimit, setTimeLimit] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!testId) return;
    api.get(`/api/tests/${testId}`).then((res) => {
      if (res.success) {
        setQuestions(res.test.questions || []);
        setTestTitle(res.test.title);
        setTimeLimit(res.test.timeLimit);
        setTimeLeft(res.test.timeLimit * 60);
      }
      setLoading(false);
    });
  }, [testId]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft > 0]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const body = {
      answers: questions.map((q) => ({
        question: q._id,
        selectedAnswer: answers[q._id] || null,
        timeSpent: 0,
      })),
      timeTaken,
    };
    const res = await api.put(`/api/tests/attempt/${attemptId}/submit`, body);
    if (res.success) {
      navigate({ to: `/dashboard/test-result/${attemptId}` });
    }
    setSubmitting(false);
  }, [questions, answers, attemptId, submitting, startTime]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-on-surface-variant font-semibold">Loading test...</div>
      </div>
    );
  }

  const q = questions[currentIdx];
  const answered = Object.keys(answers).length;
  const isWarning = timeLeft < 120 && timeLeft > 0;

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-outline-variant/40 px-6 py-3">
        <div className="max-w-[1000px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-sm">{testTitle}</h1>
            <span className="text-xs text-on-surface-variant">
              Question {currentIdx + 1} of {questions.length}
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 font-mono text-lg font-bold ${isWarning ? "text-error animate-pulse" : "text-primary"}`}>
              <Icon name="timer" className="text-[20px]" />
              {formatTime(timeLeft)}
            </div>
            <div className="text-xs text-on-surface-variant">
              {answered}/{questions.length} answered
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-surface-container-high">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Area */}
      <div className="flex-1 flex justify-center px-6 py-10">
        <div className="w-full max-w-[800px]">
          {q && (
            <>
              <div className="rounded-2xl bg-surface-container-lowest p-8 border border-outline-variant/40 shark-shadow mb-8">
                <p className="text-lg leading-relaxed whitespace-pre-wrap">{q.text}</p>
              </div>

              <div className="space-y-3">
                {q.options.map((opt) => {
                  const selected = answers[q._id] === opt.label;
                  return (
                    <button
                      key={opt.label}
                      onClick={() => handleAnswer(q._id, opt.label)}
                      className={`w-full flex items-center gap-4 p-5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                        selected
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-outline-variant/40 hover:border-primary/40 hover:bg-surface-container-low"
                      }`}
                    >
                      <span
                        className={`flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                          selected
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
            </>
          )}
        </div>
      </div>

      {/* Question Navigation Grid */}
      <div className="border-t border-outline-variant/40 bg-surface-container-lowest px-6 py-4">
        <div className="max-w-[800px] mx-auto">
          <div className="flex flex-wrap gap-2 mb-4">
            {questions.map((q, i) => (
              <button
                key={i}
                onClick={() => setCurrentIdx(i)}
                className={`h-8 w-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  i === currentIdx
                    ? "bg-primary text-on-primary"
                    : answers[q._id]
                    ? "bg-primary/20 text-primary"
                    : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
              disabled={currentIdx === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant text-sm font-semibold disabled:opacity-30 hover:bg-surface-container-low transition-colors cursor-pointer"
            >
              <Icon name="chevron_left" className="text-[18px]" /> Previous
            </button>
            {currentIdx < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIdx(currentIdx + 1)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-accent transition-colors cursor-pointer"
              >
                Next <Icon name="chevron_right" className="text-[18px]" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-primary text-sm font-bold hover:bg-accent/80 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Icon name="check_circle" className="text-[18px]" />
                {submitting ? "Submitting..." : "Submit Test"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
