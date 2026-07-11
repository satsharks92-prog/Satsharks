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

  // Practice Mode
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showReferenceModal, setShowReferenceModal] = useState(false);

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

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setResult(null);
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
  const rwSplit = q ? getRWTextSplit(q.text) : { passage: "", prompt: "" };

  if (isPracticeMode && q) {
    const isMath = q.section === "MATH" || section === "MATH";
    return (
      <div className="h-screen w-screen bg-background text-on-background flex flex-col overflow-hidden fixed inset-0 z-50">
        {/* Practice Mode Top Bar */}
        <div className="bg-surface/95 backdrop-blur-md border-b border-outline-variant/40 px-6 py-2.5 flex items-center justify-between shrink-0 gap-4 flex-wrap md:flex-nowrap">
          {/* Left: Title + Exit button */}
          <div className="flex items-center gap-3 shrink-0">
            <h2 className="font-bold text-sm text-on-surface whitespace-nowrap">
              SAT Practice
            </h2>
            <button
              onClick={() => {
                setIsPracticeMode(false);
                setShowCalculator(false);
                setShowReferenceModal(false);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-error/30 text-error hover:bg-error/5 transition-colors text-xs font-bold cursor-pointer"
            >
              <Icon name="logout" className="text-[13px]" />
              <span>Exit</span>
            </button>
          </div>

          {/* Center/Middle: Filters Row */}
          <div className="flex items-center gap-2 flex-1 justify-center max-w-[700px]">
            <Select
              label=""
              value={section}
              onChange={(e) => setSection(e.target.value)}
              options={[
                { value: "", label: "All Sections" },
                { value: "READING_WRITING", label: "Reading & Writing" },
                { value: "MATH", label: "Math" },
              ]}
              className="!w-auto !py-1 !text-xs"
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
              className="!w-auto !py-1 !text-xs"
            />
            <Select
              label=""
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { value: "", label: "All Categories" },
                ...categories.map((c) => ({ value: c._id, label: c.name })),
              ]}
              className="!w-auto !py-1 !text-xs !max-w-[180px] md:!max-w-[240px]"
            />
          </div>

          {/* Right: Math Tools */}
          <div className="flex items-center gap-2 shrink-0">
            {isMath && (
              <>
                <button
                  onClick={() => {
                    if (showCalculator) {
                      setShowCalculator(false);
                    } else {
                      setShowCalculator(true);
                      setShowReferenceModal(false);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors text-xs font-semibold cursor-pointer ${
                    showCalculator
                      ? "bg-primary text-on-primary border-primary shadow-sm"
                      : "border-outline-variant hover:bg-surface-container-low"
                  }`}
                >
                  <Icon name="calculate" className="text-[16px]" />
                  <span>Calculator</span>
                </button>
                <button
                  onClick={() => {
                    if (showReferenceModal) {
                      setShowReferenceModal(false);
                    } else {
                      setShowReferenceModal(true);
                      setShowCalculator(false);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors text-xs font-semibold cursor-pointer ${
                    showReferenceModal
                      ? "bg-primary text-on-primary border-primary shadow-sm"
                      : "border-outline-variant hover:bg-surface-container-low"
                  }`}
                >
                  <Icon name="functions" className="text-[16px]" />
                  <span>Reference</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Split Screen Container */}
        <div className="flex-1 flex w-full min-h-0 bg-background overflow-hidden relative">
          {/* Math Tools Side Panel */}
          {isMath && (showCalculator || showReferenceModal) && (
            <div className="w-[38%] min-w-[340px] max-w-[550px] border-r border-outline-variant/40 flex flex-col h-full bg-surface-container-lowest shrink-0 animate-fade-in">
              <div className="bg-surface-container-low border-b border-outline-variant/30 flex items-center justify-between px-2 shrink-0">
                <div className="flex">
                  <button
                    onClick={() => {
                      setShowCalculator(true);
                      setShowReferenceModal(false);
                    }}
                    className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-1.5 cursor-pointer transition-all ${
                      showCalculator
                        ? "border-primary text-primary bg-surface-container-lowest"
                        : "border-transparent text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                  >
                    <Icon name="calculate" className="text-[16px]" />
                    <span>Calculator</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowReferenceModal(true);
                      setShowCalculator(false);
                    }}
                    className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-1.5 cursor-pointer transition-all ${
                      showReferenceModal
                        ? "border-primary text-primary bg-surface-container-lowest"
                        : "border-transparent text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                  >
                    <Icon name="functions" className="text-[16px]" />
                    <span>Reference</span>
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowCalculator(false);
                    setShowReferenceModal(false);
                  }}
                  className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant cursor-pointer transition-colors"
                >
                  <Icon name="close" className="text-[18px]" />
                </button>
              </div>

              <div className="flex-1 min-h-0 relative">
                {showCalculator && (
                  <iframe
                    src="https://www.desmos.com/testing/cb-digital-sat/graphing"
                    className="w-full h-full border-0 absolute inset-0"
                    title="Desmos Graphing Calculator"
                  />
                )}
                {showReferenceModal && (
                  <div className="w-full h-full overflow-y-auto p-5 bg-surface-container-lowest space-y-6">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl border border-outline-variant/40 bg-surface-container-low">
                        <h4 className="font-bold text-xs text-on-surface mb-1">Circle</h4>
                        <p className="text-[11px] text-on-surface-variant">A = πr²</p>
                        <p className="text-[11px] text-on-surface-variant">C = 2πr</p>
                      </div>
                      <div className="p-3 rounded-xl border border-outline-variant/40 bg-surface-container-low">
                        <h4 className="font-bold text-xs text-on-surface mb-1">Rectangle</h4>
                        <p className="text-[11px] text-on-surface-variant">A = lw</p>
                      </div>
                      <div className="p-3 rounded-xl border border-outline-variant/40 bg-surface-container-low">
                        <h4 className="font-bold text-xs text-on-surface mb-1">Triangle</h4>
                        <p className="text-[11px] text-on-surface-variant">A = ½bh</p>
                      </div>
                      <div className="p-3 rounded-xl border border-outline-variant/40 bg-surface-container-low">
                        <h4 className="font-bold text-xs text-on-surface mb-1">Right Triangle</h4>
                        <p className="text-[11px] text-on-surface-variant">c² = a² + b²</p>
                      </div>
                      <div className="p-3 rounded-xl border border-outline-variant/40 bg-surface-container-low col-span-2">
                        <h4 className="font-bold text-xs text-on-surface mb-1">Special Triangles</h4>
                        <p className="text-[11px] text-on-surface-variant">30°-60°-90°: x, x√3, 2x</p>
                        <p className="text-[11px] text-on-surface-variant">45°-45°-90°: s, s, s√2</p>
                      </div>
                      <div className="p-3 rounded-xl border border-outline-variant/40 bg-surface-container-low">
                        <h4 className="font-bold text-xs text-on-surface mb-1">Rectangular Solid</h4>
                        <p className="text-[11px] text-on-surface-variant">V = lwh</p>
                      </div>
                      <div className="p-3 rounded-xl border border-outline-variant/40 bg-surface-container-low">
                        <h4 className="font-bold text-xs text-on-surface mb-1">Cylinder</h4>
                        <p className="text-[11px] text-on-surface-variant">V = πr²h</p>
                      </div>
                    </div>
                    <div className="border-t border-outline-variant/40 pt-4 text-[11px] text-on-surface-variant space-y-1">
                      <p>• Degrees in a circle: 360°</p>
                      <p>• Radians in a circle: 2π</p>
                      <p>• Sum of angles in a triangle: 180°</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Core Question Layout (Split) */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 h-full min-h-0 overflow-hidden">
            {/* Left Column: Passage */}
            <div className="flex flex-col h-full min-h-0 overflow-hidden bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shark-shadow">
              <div className="bg-surface-container-low px-5 py-3 border-b border-outline-variant/30 flex items-center justify-between shrink-0">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Passage / Reference</span>
              </div>
              <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                <p className="text-[15px] leading-relaxed text-on-surface whitespace-pre-wrap">{rwSplit.passage}</p>
              </div>
            </div>

            {/* Right Column: Question, Options, Actions (Header + Scrollable Body + Fixed Footer) */}
            <div className="flex flex-col h-full min-h-0 overflow-hidden bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shark-shadow">
              {/* Static Header */}
              <div className="bg-surface-container-low px-5 py-3 border-b border-outline-variant/30 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <span className="h-6 w-6 bg-primary text-on-primary rounded flex items-center justify-center text-xs font-bold">
                    {currentIdx + 1}
                  </span>
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Question {currentIdx + 1} of {questions.length}</span>
                </div>
                <Badge variant={q.difficulty === "EASY" ? "success" : q.difficulty === "MEDIUM" ? "warning" : "error"}>
                  {q.difficulty}
                </Badge>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {rwSplit.prompt && (
                  <p className="text-[15px] font-semibold text-on-surface leading-relaxed whitespace-pre-wrap">{rwSplit.prompt}</p>
                )}

                {q.options && q.options.length > 0 ? (
                  <div className="space-y-2">
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
                ) : (
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Enter Your Answer
                    </label>
                    <input
                      type="text"
                      value={selectedAnswer || ""}
                      onChange={(e) => !showResult && setSelectedAnswer(e.target.value)}
                      disabled={showResult}
                      placeholder="Type your answer here..."
                      className={`w-full max-w-[300px] px-4 py-3 rounded-xl border-2 text-base font-mono transition-all bg-surface text-on-surface focus:outline-none focus:shadow-md ${
                        showResult
                          ? result?.isCorrect
                            ? "border-primary bg-primary/5"
                            : "border-error bg-error/5"
                          : "border-outline-variant/60 focus:border-primary"
                      }`}
                    />
                    {showResult && result && (
                      <div className="text-xs font-semibold mt-1">
                        Correct Answer: <span className="font-mono text-primary font-bold">{result.correctAnswer}</span>
                      </div>
                    )}
                  </div>
                )}

                {showResult && result && (
                  <div className={`rounded-xl p-5 ${result.isCorrect ? "bg-primary/10 border border-primary/20" : "bg-error/10 border border-error/20"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name={result.isCorrect ? "check_circle" : "cancel"} className={`text-[22px] ${result.isCorrect ? "text-primary" : "text-error"}`} />
                      <span className="font-semibold text-sm">{result.isCorrect ? "Correct!" : "Incorrect"}</span>
                    </div>
                    {result.explanation && (
                      <p className="text-sm text-on-surface-variant whitespace-pre-wrap">{result.explanation}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Static Fixed Footer (Never scrolls!) */}
              <div className="bg-surface-container-low px-6 py-4 border-t border-outline-variant/30 flex justify-between items-center gap-4 shrink-0">
                <button
                  onClick={handlePrev}
                  disabled={currentIdx === 0}
                  className="px-4 py-2.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container-high text-xs font-semibold transition-colors cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent flex items-center gap-1.5"
                >
                  <Icon name="arrow_back" className="text-[14px]" /> Previous
                </button>

                {!showResult ? (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!selectedAnswer}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-xs disabled:opacity-40 hover:bg-accent transition-all cursor-pointer"
                  >
                    Check Answer
                  </button>
                ) : (
                  <div className="flex-1 text-center py-2.5 text-xs font-bold text-primary uppercase tracking-wider">
                    Answer Submitted
                  </div>
                )}

                <button
                  onClick={handleNext}
                  disabled={currentIdx >= questions.length - 1}
                  className="px-4 py-2.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container-high text-xs font-semibold transition-colors cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent flex items-center gap-1.5"
                >
                  Next <Icon name="arrow_forward" className="text-[14px]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8 w-full items-center">
        <Select
          label=""
          value={section}
          onChange={(e) => setSection(e.target.value)}
          options={[
            { value: "", label: "All Sections" },
            { value: "READING_WRITING", label: "Reading & Writing" },
            { value: "MATH", label: "Math" },
          ]}
          className="w-full !py-2"
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
          className="w-full !py-2"
        />
        <Select
          label=""
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={[
            { value: "", label: "All Categories" },
            ...categories.map((c) => ({ value: c._id, label: c.name })),
          ]}
          className="w-full !py-2"
        />
        <button
          onClick={() => setIsPracticeMode(true)}
          disabled={!q}
          className="w-full h-[40px] px-6 rounded-xl bg-primary text-on-primary font-bold text-sm hover:bg-accent transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm shrink-0"
        >
          <Icon name="open_in_full" className="text-[18px]" />
          <span>Practice Mode</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-on-surface-variant">Loading questions...</div>
      ) : !q ? (
        <EmptyState icon="help_center" title="No questions found" description="Try adjusting your filters" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0 items-start">
          {/* Left Column: Passage / Question Text */}
          <div className="flex flex-col bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shark-shadow overflow-hidden">
            <div className="bg-surface-container-low px-5 py-3 border-b border-outline-variant/30 flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Passage / Reference</span>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <p className="text-[15px] leading-relaxed text-on-surface whitespace-pre-wrap">{rwSplit.passage}</p>
            </div>
          </div>

          {/* Right Column: Question, Options & Feedback */}
          <div className="flex flex-col bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shark-shadow overflow-hidden min-h-[520px] max-h-[720px]">
            <div className="bg-surface-container-low px-5 py-3 border-b border-outline-variant/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="h-6 w-6 bg-primary text-on-primary rounded flex items-center justify-center text-xs font-bold">
                  {currentIdx + 1}
                </span>
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Question {currentIdx + 1} of {questions.length}</span>
              </div>
              <Badge variant={q.difficulty === "EASY" ? "success" : q.difficulty === "MEDIUM" ? "warning" : "error"}>
                {q.difficulty}
              </Badge>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {rwSplit.prompt && (
                <p className="text-[15px] font-semibold text-on-surface leading-relaxed whitespace-pre-wrap">{rwSplit.prompt}</p>
              )}

              {q.options && q.options.length > 0 ? (
                <div className="space-y-2">
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
              ) : (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Enter Your Answer
                  </label>
                  <input
                    type="text"
                    value={selectedAnswer || ""}
                    onChange={(e) => !showResult && setSelectedAnswer(e.target.value)}
                    disabled={showResult}
                    placeholder="Type your answer here..."
                    className={`w-full max-w-[300px] px-4 py-3 rounded-xl border-2 text-base font-mono transition-all bg-surface text-on-surface focus:outline-none focus:shadow-md ${
                      showResult
                        ? result?.isCorrect
                          ? "border-primary bg-primary/5"
                          : "border-error bg-error/5"
                        : "border-outline-variant/60 focus:border-primary"
                    }`}
                  />
                  {showResult && result && (
                    <div className="text-xs font-semibold mt-1">
                      Correct Answer: <span className="font-mono text-primary font-bold">{result.correctAnswer}</span>
                    </div>
                  )}
                </div>
              )}

              {showResult && result && (
                <div className={`rounded-xl p-5 ${result.isCorrect ? "bg-primary/10 border border-primary/20" : "bg-error/10 border border-error/20"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name={result.isCorrect ? "check_circle" : "cancel"} className={`text-[22px] ${result.isCorrect ? "text-primary" : "text-error"}`} />
                    <span className="font-semibold text-sm">{result.isCorrect ? "Correct!" : "Incorrect"}</span>
                  </div>
                  {result.explanation && (
                    <p className="text-sm text-on-surface-variant whitespace-pre-wrap">{result.explanation}</p>
                  )}
                </div>
              )}
            </div>

            <div className="bg-surface-container-low px-5 py-3 border-t border-outline-variant/30 flex justify-between items-center gap-4 shrink-0">
              <button
                onClick={handlePrev}
                disabled={currentIdx === 0}
                className="px-4 py-2.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container-high text-xs font-semibold transition-colors cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent flex items-center gap-1.5"
              >
                <Icon name="arrow_back" className="text-[14px]" /> Previous
              </button>

              {!showResult ? (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedAnswer}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-xs disabled:opacity-40 hover:bg-accent transition-all cursor-pointer"
                >
                  Check Answer
                </button>
              ) : (
                <div className="flex-1 text-center py-2.5 text-xs font-bold text-primary uppercase tracking-wider">
                  Answer Submitted
                </div>
              )}

              <button
                onClick={handleNext}
                disabled={currentIdx >= questions.length - 1}
                className="px-4 py-2.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container-high text-xs font-semibold transition-colors cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent flex items-center gap-1.5"
              >
                Next <Icon name="arrow_forward" className="text-[14px]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}
