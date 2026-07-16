import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, ReactNode } from "react";
import { StudentLayout } from "../../components/layout/StudentLayout";
import { Badge } from "../../components/ui/Badge";
import { Icon } from "../../components/common/Icon";
import { Select } from "../../components/ui/Select";
import { EmptyState } from "../../components/ui/EmptyState";
import { ZoomableImage } from "../../components/ui/ZoomableImage";
import { api } from "../../services/api";
import type { Question, QuestionCategory } from "../../types";

export const Route = createFileRoute("/dashboard/practice")({
  component: Practice,
});

const MathFraction = ({ num, den }: { num: ReactNode; den: ReactNode }) => (
  <span className="inline-flex flex-col items-center justify-center align-middle mx-1 text-[10px] leading-none">
    <span className="border-b border-current pb-0.5 px-0.5">{num}</span>
    <span className="pt-0.5 px-0.5">{den}</span>
  </span>
);

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
  const [timeSpent, setTimeSpent] = useState(0);

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

  useEffect(() => {
    let interval: any;
    if (isPracticeMode && !showResult) {
      interval = setInterval(() => {
        setTimeSpent((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPracticeMode, showResult, currentIdx]);

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
      setTimeSpent(0);
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
      timeSpent: timeSpent,
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
                  <div className="w-full h-full overflow-y-auto p-5 scroll-smooth bg-surface-container-lowest space-y-6">
                    {/* Formula Cards Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Circle */}
                      <div className="p-3.5 rounded-xl border border-outline-variant/40 bg-surface-container-low flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-on-surface mb-2">Circle</h4>
                          <div className="text-xs text-on-surface-variant space-y-1">
                            <p>Area: A = πr<sup>2</sup></p>
                            <p>Circumference: C = 2πr</p>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-center">
                          <svg viewBox="0 0 100 100" className="w-16 h-16 fill-none">
                            <g className="stroke-primary stroke-2">
                              <circle cx="50" cy="50" r="40" />
                              <line x1="50" y1="50" x2="90" y2="50" strokeDasharray="3" />
                              <circle cx="50" cy="50" r="2" className="fill-primary stroke-none" />
                            </g>
                            <text x="68" y="44" className="fill-primary stroke-none text-xs font-mono font-bold">r</text>
                          </svg>
                        </div>
                      </div>

                      {/* Rectangle */}
                      <div className="p-3.5 rounded-xl border border-outline-variant/40 bg-surface-container-low flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-on-surface mb-2">Rectangle</h4>
                          <div className="text-xs text-on-surface-variant">
                            <p>Area: A = lw</p>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-center">
                          <svg viewBox="0 0 100 70" className="w-20 h-14 fill-none">
                            <g className="stroke-primary stroke-2">
                              <rect x="10" y="10" width="80" height="50" />
                            </g>
                            <text x="50" y="68" className="fill-primary stroke-none text-xs font-mono font-bold">l</text>
                            <text x="94" y="38" className="fill-primary stroke-none text-xs font-mono font-bold">w</text>
                          </svg>
                        </div>
                      </div>

                      {/* Triangle */}
                      <div className="p-3.5 rounded-xl border border-outline-variant/40 bg-surface-container-low flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-on-surface mb-2">Triangle</h4>
                          <div className="text-xs text-on-surface-variant">
                            <p>Area: A = <MathFraction num="1" den="2" />bh</p>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-center">
                          <svg viewBox="0 0 100 80" className="w-18 h-14 fill-none">
                            <g className="stroke-primary stroke-2">
                              <polygon points="50,10 10,70 90,70" />
                              <line x1="50" y1="10" x2="50" y2="70" strokeDasharray="3" />
                            </g>
                            <text x="50" y="79" className="fill-primary stroke-none text-xs font-mono font-bold">b</text>
                            <text x="55" y="45" className="fill-primary stroke-none text-xs font-mono font-bold">h</text>
                          </svg>
                        </div>
                      </div>

                      {/* Right Triangle */}
                      <div className="p-3.5 rounded-xl border border-outline-variant/40 bg-surface-container-low flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-on-surface mb-2">Right Triangle</h4>
                          <div className="text-xs text-on-surface-variant space-y-1">
                            <p className="font-semibold">Pythagorean Theorem:</p>
                            <p>c<sup>2</sup> = a<sup>2</sup> + b<sup>2</sup></p>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-center">
                          <svg viewBox="0 0 100 80" className="w-18 h-14 fill-none">
                            <g className="stroke-primary stroke-2">
                              <polygon points="20,10 20,70 80,70" />
                              <rect x="20" y="62" width="8" height="8" className="stroke-primary/50" />
                            </g>
                            <text x="10" y="45" className="fill-primary stroke-none text-xs font-mono font-bold">a</text>
                            <text x="50" y="79" className="fill-primary stroke-none text-xs font-mono font-bold">b</text>
                            <text x="54" y="40" className="fill-primary stroke-none text-xs font-mono font-bold">c</text>
                          </svg>
                        </div>
                      </div>

                      {/* Special Right Triangles */}
                      <div className="p-3.5 rounded-xl border border-outline-variant/40 bg-surface-container-low flex flex-col justify-between col-span-2">
                        <div>
                          <h4 className="font-bold text-sm text-on-surface mb-2">Special Right Triangles</h4>
                        </div>
                        <div className="mt-4 flex justify-center">
                          <svg viewBox="0 0 240 120" className="w-full max-w-[340px] h-32 fill-none">
                            <g className="stroke-primary stroke-2">
                              {/* 30-60-90 */}
                              <polygon points="30,15 30,105 100,105" />
                              <rect x="30" y="93" width="12" height="12" className="stroke-primary/50" />
                              
                              {/* 45-45-90 */}
                              <polygon points="150,30 150,105 225,105" />
                              <rect x="150" y="93" width="12" height="12" className="stroke-primary/50" />
                            </g>
                            
                            {/* Parameter Texts */}
                            <g className="fill-primary stroke-none text-xs font-mono font-bold">
                              <text x="12" y="65">x</text>
                              <text x="50" y="118">x√3</text>
                              <text x="70" y="55">2x</text>
                              <text x="135" y="70">s</text>
                              <text x="180" y="118">s</text>
                              <text x="195" y="60">s√2</text>
                            </g>
                            
                            {/* Angle Texts */}
                            <g className="fill-primary stroke-none text-[10px] font-semibold">
                              <text x="78" y="100">60°</text>
                              <text x="34" y="32">30°</text>
                              <text x="202" y="100">45°</text>
                              <text x="154" y="46">45°</text>
                            </g>
                          </svg>
                        </div>
                      </div>

                      {/* Rectangular Solid */}
                      <div className="p-3.5 rounded-xl border border-outline-variant/40 bg-surface-container-low flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-on-surface mb-2">Rectangular Solid</h4>
                          <div className="text-xs text-on-surface-variant">
                            <p>Volume: V = lwh</p>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-center">
                          <svg viewBox="0 0 100 80" className="w-20 h-16 fill-none">
                            <g className="stroke-primary stroke-2">
                              <rect x="10" y="30" width="55" height="35" />
                              <polygon points="10,30 25,15 80,15 65,30" />
                              <polygon points="65,30 80,15 80,50 65,65" />
                              <line x1="10" y1="65" x2="25" y2="50" strokeDasharray="3" />
                              <line x1="25" y1="50" x2="80" y2="50" strokeDasharray="3" />
                              <line x1="25" y1="50" x2="25" y2="15" strokeDasharray="3" />
                            </g>
                            <text x="35" y="76" className="fill-primary stroke-none text-xs font-mono font-bold">l</text>
                            <text x="74" y="60" className="fill-primary stroke-none text-xs font-mono font-bold">w</text>
                            <text x="85" y="35" className="fill-primary stroke-none text-xs font-mono font-bold">h</text>
                          </svg>
                        </div>
                      </div>

                      {/* Cylinder */}
                      <div className="p-3.5 rounded-xl border border-outline-variant/40 bg-surface-container-low flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-on-surface mb-2">Cylinder</h4>
                          <div className="text-xs text-on-surface-variant">
                            <p>Volume: V = πr<sup>2</sup>h</p>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-center">
                          <svg viewBox="0 0 100 90" className="w-18 h-16 fill-none">
                            <g className="stroke-primary stroke-2">
                              <ellipse cx="50" cy="20" rx="30" ry="10" />
                              <path d="M 20 20 L 20 70 A 30 10 0 0 0 80 70 L 80 20" />
                              <path d="M 20 70 A 30 10 0 0 1 80 70" strokeDasharray="3" />
                              <line x1="50" y1="20" x2="80" y2="20" strokeDasharray="3" />
                            </g>
                            <text x="65" y="16" className="fill-primary stroke-none text-xs font-mono font-bold">r</text>
                            <text x="86" y="50" className="fill-primary stroke-none text-xs font-mono font-bold">h</text>
                          </svg>
                        </div>
                      </div>

                      {/* Sphere */}
                      <div className="p-3.5 rounded-xl border border-outline-variant/40 bg-surface-container-low flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-on-surface mb-2">Sphere</h4>
                          <div className="text-xs text-on-surface-variant">
                            <p>Volume: V = <MathFraction num="4" den="3" />πr<sup>3</sup></p>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-center">
                          <svg viewBox="0 0 100 100" className="w-16 h-16 fill-none">
                            <g className="stroke-primary stroke-2">
                              <circle cx="50" cy="50" r="40" />
                              <ellipse cx="50" cy="50" rx="40" ry="12" strokeDasharray="3" />
                              <line x1="50" y1="50" x2="90" y2="50" strokeDasharray="3" />
                            </g>
                            <text x="70" y="44" className="fill-primary stroke-none text-xs font-mono font-bold">r</text>
                          </svg>
                        </div>
                      </div>

                      {/* Cone */}
                      <div className="p-3.5 rounded-xl border border-outline-variant/40 bg-surface-container-low flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-on-surface mb-2">Cone</h4>
                          <div className="text-xs text-on-surface-variant">
                            <p>Volume: V = <MathFraction num="1" den="3" />πr<sup>2</sup>h</p>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-center">
                          <svg viewBox="0 0 100 90" className="w-18 h-16 fill-none">
                            <g className="stroke-primary stroke-2">
                              <ellipse cx="50" cy="80" rx="30" ry="10" />
                              <line x1="50" y1="10" x2="20" y2="80" />
                              <line x1="50" y1="10" x2="80" y2="80" />
                              <line x1="50" y1="10" x2="50" y2="80" strokeDasharray="3" />
                              <line x1="50" y1="80" x2="80" y2="80" strokeDasharray="3" />
                            </g>
                            <text x="65" y="89" className="fill-primary stroke-none text-xs font-mono font-bold">r</text>
                            <text x="42" y="45" className="fill-primary stroke-none text-xs font-mono font-bold">h</text>
                          </svg>
                        </div>
                      </div>

                      {/* Pyramid */}
                      <div className="p-3.5 rounded-xl border border-outline-variant/40 bg-surface-container-low flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-on-surface mb-2">Pyramid</h4>
                          <div className="text-xs text-on-surface-variant">
                            <p>Volume: V = <MathFraction num="1" den="3" />lwh</p>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-center">
                          <svg viewBox="0 0 100 80" className="w-18 h-16 fill-none">
                            <g className="stroke-primary stroke-2">
                              <polygon points="50,10 15,65 65,65" />
                              <polygon points="50,10 65,65 85,50" />
                              <line x1="15" y1="65" x2="35" y2="50" strokeDasharray="3" />
                              <line x1="35" y1="50" x2="85" y2="50" strokeDasharray="3" />
                              <line x1="50" y1="10" x2="35" y2="50" strokeDasharray="3" />
                              <line x1="50" y1="10" x2="50" y2="58" strokeDasharray="3" />
                            </g>
                            <text x="38" y="74" className="fill-primary stroke-none text-xs font-mono font-bold">l</text>
                            <text x="76" y="60" className="fill-primary stroke-none text-xs font-mono font-bold">w</text>
                            <text x="54" y="35" className="fill-primary stroke-none text-xs font-mono font-bold">h</text>
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Instructions Panel */}
                    <div className="border-t border-outline-variant/40 pt-4 text-[11px] text-on-surface-variant space-y-2 font-semibold">
                      <p>• The number of degrees of arc in a circle is 360.</p>
                      <p>• The number of radians of arc in a circle is 2π.</p>
                      <p>• The sum of the measures in degrees of the angles of a triangle is 180.</p>
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
              <div className="flex-1 overflow-y-auto p-6 scroll-smooth space-y-6">
                {q.imageUrl && (
                  <ZoomableImage src={q.imageUrl} />
                )}
                {rwSplit.passage && (
                  <p className="text-[15px] leading-relaxed text-on-surface whitespace-pre-wrap">{rwSplit.passage}</p>
                )}
                {rwSplit.prompt && (
                  <p className="text-[15px] font-semibold text-on-surface leading-relaxed whitespace-pre-wrap">{rwSplit.prompt}</p>
                )}
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
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6 custom-scrollbar">
              {q.imageUrl && (
                <ZoomableImage src={q.imageUrl} />
              )}
              {rwSplit.passage && (
                <p className="text-[15px] leading-relaxed text-on-surface whitespace-pre-wrap">{rwSplit.passage}</p>
              )}
              {rwSplit.prompt && (
                <p className="text-[15px] font-semibold text-on-surface leading-relaxed whitespace-pre-wrap">{rwSplit.prompt}</p>
              )}
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
