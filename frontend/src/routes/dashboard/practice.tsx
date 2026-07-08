import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { StudentLayout } from "../../components/layout/StudentLayout";
import { Badge } from "../../components/ui/Badge";
import { Icon } from "../../components/common/Icon";
import { Select } from "../../components/ui/Select";
import { EmptyState } from "../../components/ui/EmptyState";
import { api } from "../../services/api";
import type { Question, QuestionCategory } from "../../types";

export const Route = createFileRoute("/dashboard/practice")({
  component: Practice,
});

function Practice() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<{ isCorrect: boolean; correctAnswer: string; explanation: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, correct: 0 });

  // Filters
  const [section, setSection] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    api.get("/api/categories").then((res) => {
      if (res.success) setCategories(res.categories || []);
    });
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (section) params.set("section", section);
    if (difficulty) params.set("difficulty", difficulty);
    if (category) params.set("category", category);
    params.set("limit", "50");

    const res = await api.get(`/api/questions?${params}`);
    if (res.success) {
      setQuestions(res.questions || []);
      setCurrentIdx(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setResult(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuestions();
  }, [section, difficulty, category]);

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !questions[currentIdx]) return;
    const res = await api.post("/api/practice/answer", {
      questionId: questions[currentIdx]._id,
      selectedAnswer,
      timeSpent: 0,
    });
    if (res.success) {
      setResult(res.result);
      setShowResult(true);
      setStats((prev) => ({
        total: prev.total + 1,
        correct: prev.correct + (res.result.isCorrect ? 1 : 0),
      }));
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setResult(null);
    }
  };

  const q = questions[currentIdx];

  return (
    <StudentLayout activeItem="/dashboard/practice">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Practice Questions</h1>
          <p className="text-on-surface-variant text-sm">Answer one question at a time with instant feedback</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Badge variant="success">{stats.correct} correct</Badge>
          <Badge variant="default">{stats.total} answered</Badge>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <Select
          label=""
          value={section}
          onChange={(e) => setSection(e.target.value)}
          options={[
            { value: "", label: "All Sections" },
            { value: "READING_WRITING", label: "Reading & Writing" },
            { value: "MATH", label: "Math" },
          ]}
          className="!w-auto !py-2"
        />
        <Select
          label=""
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          options={[
            { value: "", label: "All Difficulties" },
            { value: "EASY", label: "Easy" },
            { value: "MEDIUM", label: "Medium" },
            { value: "HARD", label: "Hard" },
          ]}
          className="!w-auto !py-2"
        />
        <Select
          label=""
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={[
            { value: "", label: "All Categories" },
            ...categories.map((c) => ({ value: c._id, label: c.name })),
          ]}
          className="!w-auto !py-2"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-on-surface-variant">Loading questions...</div>
      ) : !q ? (
        <EmptyState icon="help_center" title="No questions found" description="Try adjusting your filters" />
      ) : (
        <div className="max-w-[800px]">
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-xs text-on-surface-variant">
              Question {currentIdx + 1} of {questions.length}
            </span>
            <Badge variant={q.difficulty === "EASY" ? "success" : q.difficulty === "MEDIUM" ? "warning" : "error"}>
              {q.difficulty}
            </Badge>
          </div>

          <div className="rounded-xl bg-surface-container-lowest p-6 border border-outline-variant/40 shark-shadow mb-4">
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{q.text}</p>
          </div>

          <div className="space-y-2 mb-6">
            {q.options.map((opt) => {
              const isSelected = selectedAnswer === opt.label;
              let optStyle = "";
              if (showResult && result) {
                if (opt.label === result.correctAnswer) {
                  optStyle = "border-primary bg-primary/10";
                } else if (isSelected && !result.isCorrect) {
                  optStyle = "border-error bg-error/10";
                }
              } else if (isSelected) {
                optStyle = "border-primary bg-primary/5";
              }

              return (
                <button
                  key={opt.label}
                  onClick={() => !showResult && setSelectedAnswer(opt.label)}
                  disabled={showResult}
                  className={`w-full flex items-center gap-4 py-3 px-4 rounded-xl border-2 text-left transition-all cursor-pointer disabled:cursor-default ${
                    optStyle || "border-outline-variant/40 hover:border-primary/40"
                  }`}
                >
                  <span className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isSelected ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface"
                  }`}>
                    {opt.label}
                  </span>
                  <span className="text-sm">{opt.text}</span>
                  {showResult && opt.label === result?.correctAnswer && (
                    <Icon name="check_circle" className="ml-auto text-primary text-[20px]" />
                  )}
                  {showResult && isSelected && !result?.isCorrect && opt.label !== result?.correctAnswer && (
                    <Icon name="cancel" className="ml-auto text-error text-[20px]" />
                  )}
                </button>
              );
            })}
          </div>

          {showResult && result && (
            <div className={`rounded-xl p-5 mb-6 ${result.isCorrect ? "bg-primary/10 border border-primary/20" : "bg-error/10 border border-error/20"}`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon name={result.isCorrect ? "check_circle" : "cancel"} className={`text-[22px] ${result.isCorrect ? "text-primary" : "text-error"}`} />
                <span className="font-semibold text-sm">{result.isCorrect ? "Correct!" : "Incorrect"}</span>
              </div>
              {result.explanation && (
                <p className="text-sm text-on-surface-variant">{result.explanation}</p>
              )}
            </div>
          )}

          <div className="flex gap-4">
            {!showResult ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer}
                className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-semibold text-sm disabled:opacity-40 hover:bg-accent transition-colors cursor-pointer"
              >
                Check Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={currentIdx >= questions.length - 1}
                className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-semibold text-sm disabled:opacity-40 hover:bg-accent transition-colors cursor-pointer"
              >
                Next Question <Icon name="arrow_forward" className="text-[16px] inline ml-1" />
              </button>
            )}
          </div>
        </div>
      )}
    </StudentLayout>
  );
}
