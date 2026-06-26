import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { Icon } from "../../components/common/Icon";
import { api } from "../../services/api";
import type { Question } from "../../types";

export const Route = createFileRoute("/dashboard/take-test/$attemptId")({
  component: TakeTest,
});

interface ModuleConfig {
  number: number;
  name: string;
  questionIndices: number[];
  duration: number; // in seconds
}

interface AttemptState {
  activeModuleIdx: number;
  timeLeft: number;
  currentIdx: number;
  answers: Record<string, string>;
  isBreakActive: boolean;
  breakTimeLeft: number;
}

const getTestModules = (section: string, questionCount: number): ModuleConfig[] | null => {
  if (section === "FULL" && questionCount === 98) {
    return [
      { number: 1, name: "Reading & Writing - Module 1", questionIndices: Array.from({ length: 27 }, (_, i) => i), duration: 32 * 60 },
      { number: 2, name: "Reading & Writing - Module 2", questionIndices: Array.from({ length: 27 }, (_, i) => i + 27), duration: 32 * 60 },
      { number: 3, name: "Math - Module 1", questionIndices: Array.from({ length: 22 }, (_, i) => i + 54), duration: 35 * 60 },
      { number: 4, name: "Math - Module 2", questionIndices: Array.from({ length: 22 }, (_, i) => i + 76), duration: 35 * 60 },
    ];
  }
  if (section === "READING_WRITING" && questionCount === 54) {
    return [
      { number: 1, name: "Reading & Writing - Module 1", questionIndices: Array.from({ length: 27 }, (_, i) => i), duration: 32 * 60 },
      { number: 2, name: "Reading & Writing - Module 2", questionIndices: Array.from({ length: 27 }, (_, i) => i + 27), duration: 32 * 60 },
    ];
  }
  if (section === "MATH" && questionCount === 44) {
    return [
      { number: 1, name: "Math - Module 1", questionIndices: Array.from({ length: 22 }, (_, i) => i), duration: 35 * 60 },
      { number: 2, name: "Math - Module 2", questionIndices: Array.from({ length: 22 }, (_, i) => i + 22), duration: 35 * 60 },
    ];
  }
  return null;
};

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
    <p>Solve each problem and choose the correct answer from the choices provided. Each multiple-choice question has a single correct answer.</p>
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

  // Modular state
  const [modules, setModules] = useState<ModuleConfig[] | null>(null);
  const [activeModuleIdx, setActiveModuleIdx] = useState<number>(0);
  const [isBreakActive, setIsBreakActive] = useState<boolean>(false);
  const [breakTimeLeft, setBreakTimeLeft] = useState<number>(10 * 60);
  const [showTransitionModal, setShowTransitionModal] = useState(false);

  // Guidelines Tool Modals state
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [showReferenceModal, setShowReferenceModal] = useState(false);

  useEffect(() => {
    if (!testId) return;
    api.get(`/api/tests/${testId}`).then((res) => {
      if (res.success) {
        const testQuestions = res.test.questions || [];
        setQuestions(testQuestions);
        setTestTitle(res.test.title);

        const resolvedModules = getTestModules(res.test.section, testQuestions.length);
        setModules(resolvedModules);

        // Try restoring from localStorage
        const stored = localStorage.getItem(`satsharks_attempt_${attemptId}`);
        if (stored) {
          try {
            const parsed: AttemptState = JSON.parse(stored);
            setActiveModuleIdx(parsed.activeModuleIdx ?? 0);
            setTimeLeft(parsed.timeLeft ?? 0);
            setCurrentIdx(parsed.currentIdx ?? 0);
            setAnswers(parsed.answers ?? {});
            setIsBreakActive(parsed.isBreakActive ?? false);
            setBreakTimeLeft(parsed.breakTimeLeft ?? 10 * 60);
            setLoading(false);
            return;
          } catch (e) {
            console.error("Failed to restore test attempt state", e);
          }
        }

        // Initialize normally
        if (resolvedModules) {
          const firstMod = resolvedModules[0];
          setActiveModuleIdx(0);
          setTimeLeft(firstMod.duration);
          setCurrentIdx(firstMod.questionIndices[0]);
        } else {
          setTimeLimit(res.test.timeLimit);
          setTimeLeft(res.test.timeLimit * 60);
          setCurrentIdx(0);
        }
      }
      setLoading(false);
    });
  }, [testId, attemptId]);

  // Persist state to localStorage on changes
  useEffect(() => {
    if (loading || !testId) return;
    const stateToSave: AttemptState = {
      activeModuleIdx,
      timeLeft,
      currentIdx,
      answers,
      isBreakActive,
      breakTimeLeft,
    };
    localStorage.setItem(`satsharks_attempt_${attemptId}`, JSON.stringify(stateToSave));
  }, [activeModuleIdx, timeLeft, currentIdx, answers, isBreakActive, breakTimeLeft, loading, testId, attemptId]);

  // Break Timer
  useEffect(() => {
    if (!isBreakActive || breakTimeLeft <= 0) return;
    const breakTimer = setInterval(() => {
      setBreakTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(breakTimer);
          setIsBreakActive(false);
          if (modules) {
            const nextModIdx = 2; // Math Module 1
            setActiveModuleIdx(nextModIdx);
            setTimeLeft(modules[nextModIdx].duration);
            setCurrentIdx(modules[nextModIdx].questionIndices[0]);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(breakTimer);
  }, [isBreakActive, breakTimeLeft, modules]);

  // Main Test / Module Timer ticking
  useEffect(() => {
    if (isBreakActive || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isBreakActive, timeLeft > 0]);

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
      localStorage.removeItem(`satsharks_attempt_${attemptId}`);
      navigate({ to: `/dashboard/test-result/${attemptId}` });
    }
    setSubmitting(false);
  }, [questions, answers, attemptId, submitting, startTime, navigate]);

  // Timer expiration transition logic
  useEffect(() => {
    if (timeLeft === 0 && !loading && !isBreakActive) {
      if (modules) {
        const nextIdx = activeModuleIdx + 1;
        if (nextIdx < modules.length) {
          if (activeModuleIdx === 1 && modules.length === 4) {
            setIsBreakActive(true);
            setBreakTimeLeft(10 * 60);
          } else {
            setActiveModuleIdx(nextIdx);
            setTimeLeft(modules[nextIdx].duration);
            setCurrentIdx(modules[nextIdx].questionIndices[0]);
          }
        } else {
          handleSubmit();
        }
      } else {
        handleSubmit();
      }
    }
  }, [timeLeft, isBreakActive, activeModuleIdx, modules, loading, handleSubmit]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const confirmNextModule = () => {
    setShowTransitionModal(false);
    if (!modules) return;
    const nextIdx = activeModuleIdx + 1;
    if (nextIdx < modules.length) {
      if (activeModuleIdx === 1 && modules.length === 4) {
        setIsBreakActive(true);
        setBreakTimeLeft(10 * 60);
      } else {
        setActiveModuleIdx(nextIdx);
        setTimeLeft(modules[nextIdx].duration);
        setCurrentIdx(modules[nextIdx].questionIndices[0]);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-on-surface-variant font-semibold">Loading test...</div>
      </div>
    );
  }

  if (isBreakActive) {
    const skipBreak = () => {
      setIsBreakActive(false);
      if (modules) {
        const nextModIdx = 2; // Math Module 1
        setActiveModuleIdx(nextModIdx);
        setTimeLeft(modules[nextModIdx].duration);
        setCurrentIdx(modules[nextModIdx].questionIndices[0]);
      }
    };

    const breakM = Math.floor(breakTimeLeft / 60);
    const breakS = breakTimeLeft % 60;
    const formattedBreakTime = `${breakM.toString().padStart(2, "0")}:${breakS.toString().padStart(2, "0")}`;

    return (
      <div className="min-h-screen bg-background text-on-background flex flex-col justify-center items-center p-6">
        <div className="max-w-md w-full text-center bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-8 shark-shadow">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
            <Icon name="coffee" className="text-[32px]" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Scheduled Break</h2>
          <p className="text-sm text-on-surface-variant mb-8 leading-relaxed">
            Take a 10-minute break to rest. You can stretch, grab a glass of water, or skip the break to continue your test immediately.
          </p>
          <div className="text-5xl font-mono font-black text-primary mb-8 tracking-wider">
            {formattedBreakTime}
          </div>
          <button
            onClick={skipBreak}
            className="w-full btn-shimmer bg-primary text-on-primary hover:bg-accent hover:text-primary py-3.5 rounded-2xl text-sm font-bold shark-shadow transition-all cursor-pointer border-none animate-bounce"
          >
            Skip Break & Resume Test
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];
  const answered = Object.keys(answers).length;
  const isWarning = timeLeft < 120 && timeLeft > 0;
  const activeModule = modules ? modules[activeModuleIdx] : null;
  const isLastQuestionInModule = activeModule ? currentIdx === activeModule.questionIndices[activeModule.questionIndices.length - 1] : false;
  const isLastModule = modules ? activeModuleIdx === modules.length - 1 : false;

  const isMathModule = modules && activeModule ? (activeModule.number === 3 || activeModule.number === 4) : false;
  const isMathSection = !modules && q?.section === "MATH";
  const showMathTools = isMathModule || isMathSection;

  const relativeQuestionNum = modules && activeModule 
    ? (currentIdx - activeModule.questionIndices[0] + 1)
    : (currentIdx + 1);

  const totalModuleQuestions = modules && activeModule
    ? activeModule.questionIndices.length
    : questions.length;

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-outline-variant/40 px-6 py-3">
        <div className="max-w-[1000px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-sm">
              {modules ? `${testTitle} - ${activeModule?.name}` : testTitle}
            </h1>
            <span className="text-xs text-on-surface-variant">
              Question {relativeQuestionNum} of {totalModuleQuestions}
            </span>
          </div>

          {/* Guidelines Tool Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDirectionsModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container-low transition-colors text-xs font-semibold cursor-pointer"
            >
              <Icon name="info" className="text-[16px]" />
              <span className="hidden sm:inline">Directions</span>
            </button>
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

          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 font-mono text-lg font-bold ${isWarning ? "text-error animate-pulse" : "text-primary"}`}>
              <Icon name="timer" className="text-[20px]" />
              {formatTime(timeLeft)}
            </div>
            <div className="text-xs text-on-surface-variant">
              {modules && activeModule ? (
                (() => {
                  const moduleAnswers = activeModule.questionIndices.filter(idx => answers[questions[idx]?._id]).length;
                  return `${moduleAnswers}/${activeModule.questionIndices.length} answered`;
                })()
              ) : (
                `${answered}/${questions.length} answered`
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-surface-container-high">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{
            width: `${(relativeQuestionNum / totalModuleQuestions) * 100}%`,
          }}
        />
      </div>

      {/* Question Area */}
      <div className="flex-1 flex justify-center px-6 py-10">
        <div className="w-full max-w-[800px]">
          {q && (
            <>
              {/* Question Number Header */}
              <div className="mb-4 flex items-center justify-between border-b border-outline-variant/30 pb-2">
                <span className="text-base font-extrabold text-primary tracking-widest uppercase">
                  Question {relativeQuestionNum}
                </span>
                <span className="text-xs font-medium text-on-surface-variant bg-surface-container-high px-2.5 py-1 rounded-full">
                  {q.difficulty} • {q.section === "MATH" ? "Math" : "Reading & Writing"}
                </span>
              </div>

              {/* Question Text Card */}
              <div className="rounded-2xl bg-surface-container-lowest p-8 border border-outline-variant/40 shark-shadow mb-8">
                <p className="text-lg leading-relaxed whitespace-pre-wrap">{q.text}</p>
              </div>

              {/* Answer Section */}
              {q.options && q.options.length > 0 ? (
                /* Multiple Choice Options */
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
              ) : (
                /* Student-Produced Response Input Field */
                <div className="rounded-2xl bg-surface-container-lowest p-6 border border-outline-variant/40 shark-shadow">
                  <label className="block text-sm font-bold text-on-surface mb-3 uppercase tracking-wider">
                    Enter Your Answer
                  </label>
                  <input
                    type="text"
                    value={answers[q._id] || ""}
                    onChange={(e) => handleAnswer(q._id, e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full max-w-[300px] px-5 py-4 rounded-xl border-2 border-outline-variant/60 focus:border-primary focus:outline-none text-lg font-mono tracking-wide transition-all bg-surface text-on-surface focus:shadow-md"
                  />
                  <div className="mt-5 p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <span className="flex items-start gap-2.5 text-xs text-on-surface-variant leading-relaxed">
                      <Icon name="info" className="text-primary text-[16px] mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-bold text-on-surface">Digital SAT Rules for Student-Produced Responses:</span>
                        <ul className="list-disc pl-4 mt-1.5 space-y-1 text-[11px]">
                          <li>Positive answers: up to 5 characters max.</li>
                          <li>Negative answers: up to 6 characters max (including negative sign).</li>
                          <li>Fractions: enter as improper fraction (e.g. 7/2) or decimal. Mixed numbers must be entered as fractions/decimals (e.g. enter 3.5 or 7/2, not 3 1/2).</li>
                          <li>Do not enter symbols (%, $, commas, etc.).</li>
                        </ul>
                      </div>
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Question Navigation Grid */}
      <div className="border-t border-outline-variant/40 bg-surface-container-lowest px-6 py-4">
        <div className="max-w-[800px] mx-auto">
          <div className="flex flex-wrap gap-2 mb-4">
            {modules ? (
              activeModule?.questionIndices.map((absIdx) => {
                const questionObj = questions[absIdx];
                const relativeNum = absIdx - activeModule.questionIndices[0] + 1;
                return (
                  <button
                    key={absIdx}
                    onClick={() => setCurrentIdx(absIdx)}
                    className={`h-8 w-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      absIdx === currentIdx
                        ? "bg-primary text-on-primary"
                        : answers[questionObj._id]
                        ? "bg-primary/20 text-primary"
                        : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                    }`}
                  >
                    {relativeNum}
                  </button>
                );
              })
            ) : (
              questions.map((q, i) => (
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
              ))
            )}
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
              disabled={
                modules && activeModule
                  ? currentIdx === activeModule.questionIndices[0]
                  : currentIdx === 0
              }
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant text-sm font-semibold disabled:opacity-30 hover:bg-surface-container-low transition-colors cursor-pointer"
            >
              <Icon name="chevron_left" className="text-[18px]" /> Previous
            </button>
            {modules ? (
              isLastQuestionInModule ? (
                isLastModule ? (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-primary text-sm font-bold hover:bg-accent/80 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Icon name="check_circle" className="text-[18px]" />
                    {submitting ? "Submitting..." : "Submit Test"}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowTransitionModal(true)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-primary text-sm font-bold hover:bg-accent/80 transition-colors cursor-pointer"
                  >
                    Next Module <Icon name="arrow_forward" className="text-[18px]" />
                  </button>
                )
              ) : (
                <button
                  onClick={() => setCurrentIdx(currentIdx + 1)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-accent transition-colors cursor-pointer"
                >
                  Next <Icon name="chevron_right" className="text-[18px]" />
                </button>
              )
            ) : (
              currentIdx < questions.length - 1 ? (
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
              )
            )}
          </div>
        </div>
      </div>

      {/* Transition Modal */}
      {showTransitionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-outline-variant/40 rounded-2xl p-6 max-w-md w-full shark-shadow animate-scale-in">
            <div className="flex items-center gap-3 text-warning mb-4">
              <Icon name="warning" className="text-[28px]" />
              <h3 className="text-lg font-bold text-on-surface">Confirm Module Submission</h3>
            </div>
            <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
              Are you sure you want to move to the next module? Once you proceed, you will not be able to view or edit questions in the current module.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowTransitionModal(false)}
                className="px-4 py-2 rounded-xl border border-outline-variant hover:bg-surface-container-low transition-colors font-semibold text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmNextModule}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-accent hover:text-primary transition-colors font-semibold text-sm cursor-pointer"
              >
                Yes, Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Directions Modal */}
      {showDirectionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-outline-variant/40 rounded-2xl p-6 max-w-lg w-full shark-shadow animate-scale-in flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3 mb-4">
              <h3 className="text-lg font-bold text-on-surface">Test Directions</h3>
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
          <div className="bg-surface border border-outline-variant/40 rounded-2xl p-6 max-w-4xl w-full shark-shadow animate-scale-in flex flex-col max-h-[90vh]">
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
          <div className="bg-surface border border-outline-variant/40 rounded-2xl p-6 max-w-3xl w-full shark-shadow animate-scale-in flex flex-col max-h-[90vh]">
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

                {/* Rectangular Prism */}
                <div className="p-4 rounded-xl border border-outline-variant/40 bg-surface-container-low">
                  <h4 className="font-bold text-sm text-on-surface mb-2">Rectangular Prism</h4>
                  <div className="flex justify-between items-center text-xs text-on-surface-variant">
                    <div>
                      <p>{"Volume: \\(V = l w h\\)"}</p>
                    </div>
                    <div className="w-16 h-12 relative">
                      <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-primary/40 stroke-2">
                        <rect x="10" y="30" width="50" height="40" />
                        <rect x="30" y="10" width="50" height="40" strokeDasharray="2" />
                        <line x1="10" y1="30" x2="30" y2="10" />
                        <line x1="60" y1="30" x2="80" y2="10" />
                        <line x1="10" y1="70" x2="30" y2="50" />
                        <line x1="60" y1="70" x2="80" y2="50" />
                      </svg>
                      <span className="text-[9px] text-primary absolute left-6 bottom-[34px]">l</span>
                      <span className="text-[9px] text-primary absolute right-2 top-2">w</span>
                      <span className="text-[9px] text-primary absolute left-1 top-[46px]">h</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Right Triangles card */}
              <div className="p-4 rounded-xl border border-outline-variant/40 bg-surface-container-low">
                <h4 className="font-bold text-sm text-on-surface mb-3">Special Right Triangles</h4>
                <div className="grid sm:grid-cols-2 gap-6 text-xs text-on-surface-variant">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-on-surface mb-1">{"30\u00b0-60\u00b0-90\u00b0"}</p>
                      <p>{"Opposite 30\u00b0: \\(x\\)"}</p>
                      <p>{"Opposite 60\u00b0: \\(x\\sqrt{3}\\)"}</p>
                      <p>{"Hypotenuse: \\(2x\\)"}</p>
                    </div>
                    <div className="w-20 h-16 relative">
                      <svg viewBox="0 0 100 80" className="w-full h-full fill-none stroke-primary/40 stroke-2">
                        <polygon points="10,10 10,70 90,70" />
                        <rect x="10" y="60" width="10" height="10" />
                      </svg>
                      <span className="text-[9px] text-primary absolute left-4 top-[35px]">x</span>
                      <span className="text-[9px] text-primary absolute left-[45px] bottom-0.5">{"x\\(\\sqrt{3}\\)"}</span>
                      <span className="text-[9px] text-primary absolute left-[48px] top-[24px]">2x</span>
                      <span className="text-[8px] absolute left-[22px] bottom-[12px]">30°</span>
                      <span className="text-[8px] absolute left-[12px] top-[18px]">60°</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-on-surface mb-1">{"45\u00b0-45\u00b0-90\u00b0"}</p>
                      <p>{"Legs: \\(s\\)"}</p>
                      <p>{"Hypotenuse: \\(s\\sqrt{2}\\)"}</p>
                    </div>
                    <div className="w-20 h-16 relative">
                      <svg viewBox="0 0 100 80" className="w-full h-full fill-none stroke-primary/40 stroke-2">
                        <polygon points="10,10 10,70 70,70" />
                        <rect x="10" y="60" width="10" height="10" />
                      </svg>
                      <span className="text-[9px] text-primary absolute left-4 top-[35px]">s</span>
                      <span className="text-[9px] text-primary absolute left-[35px] bottom-0.5">s</span>
                      <span className="text-[9px] text-primary absolute left-[40px] top-[30px]">{"s\\(\\sqrt{2}\\)"}</span>
                      <span className="text-[8px] absolute left-[22px] bottom-[12px]">45°</span>
                      <span className="text-[8px] absolute left-[12px] top-[18px]">45°</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Extra facts */}
              <div className="p-4 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs text-on-surface-variant leading-relaxed">
                <ul className="list-disc pl-5 space-y-1">
                  <li>{"The number of degrees of arc in a circle is 360."}</li>
                  <li>{"The number of radians of arc in a circle is 2\\pi."}</li>
                  <li>{"The sum of the measures in degrees of the angles of a triangle is 180."}</li>
                </ul>
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-outline-variant/40 mt-4">
              <button
                onClick={() => setShowReferenceModal(false)}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary hover:bg-accent hover:text-primary transition-colors font-semibold text-sm cursor-pointer"
              >
                Close Reference Sheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
