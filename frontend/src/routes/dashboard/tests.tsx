import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { StudentLayout } from "../../components/layout/StudentLayout";
import { Badge } from "../../components/ui/Badge";
import { Icon } from "../../components/common/Icon";
import { EmptyState } from "../../components/ui/EmptyState";
import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import type { DiagnosticTest } from "../../types";

export const Route = createFileRoute("/dashboard/tests")({
  component: TestList,
});

function TestList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tests, setTests] = useState<DiagnosticTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    api.get("/api/tests").then((res) => {
      if (res.success) setTests(res.tests || []);
      setLoading(false);
    });
  }, []);

  const filteredTests = filter === "ALL" ? tests : tests.filter((t) => t.section === filter);

  const handleStart = async (testId: string, accessLevel: string) => {
    if (accessLevel === "PAID" && user?.subscription === "FREE") return;
    const res = await api.post(`/api/tests/${testId}/start`, {});
    if (res.success) {
      navigate({ to: `/dashboard/take-test/${res.attempt._id}`, search: { testId } });
    }
  };

  const sectionLabel = (s: string) => {
    if (s === "READING_WRITING") return "Reading & Writing";
    if (s === "MATH") return "Math";
    return "Full Test";
  };

  return (
    <StudentLayout activeItem="/dashboard/tests">
      <h1 className="text-3xl font-bold mb-2">Diagnostic Tests</h1>
      <p className="text-on-surface-variant mb-8">Challenge yourself with timed diagnostic tests</p>

      <div className="flex gap-2 mb-8 flex-wrap">
        {["ALL", "READING_WRITING", "MATH", "FULL"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${
              filter === s
                ? "bg-primary text-on-primary"
                : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {s === "ALL" ? "All" : sectionLabel(s)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-on-surface-variant">Loading tests...</div>
      ) : filteredTests.length === 0 ? (
        <EmptyState icon="quiz" title="No tests available" description="Check back later for new diagnostic tests" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((test) => {
            const locked = test.accessLevel === "PAID" && user?.subscription === "FREE";
            return (
              <div
                key={test._id}
                className={`rounded-2xl bg-surface-container-lowest p-6 border border-outline-variant/40 shark-shadow flex flex-col hover-lift ${
                  locked ? "opacity-70" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <Badge variant={test.section === "MATH" ? "info" : test.section === "READING_WRITING" ? "accent" : "success"}>
                    {sectionLabel(test.section)}
                  </Badge>
                  {locked ? (
                    <Badge variant="warning">
                      <Icon name="lock" className="text-[12px] mr-1" /> PAID
                    </Badge>
                  ) : (
                    <Badge variant="success">FREE</Badge>
                  )}
                </div>

                <h3 className="text-lg font-semibold mb-2">{test.title}</h3>
                {test.description && (
                  <p className="text-sm text-on-surface-variant mb-4 line-clamp-2">{test.description}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-on-surface-variant mb-6 mt-auto">
                  <span className="flex items-center gap-1">
                    <Icon name="help_center" className="text-[16px]" />
                    {test.questionCount ?? test.totalMarks} questions
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="timer" className="text-[16px]" />
                    {test.timeLimit} min
                  </span>
                  {(test.attemptCount ?? 0) > 0 && (
                    <span className="flex items-center gap-1">
                      <Icon name="check_circle" className="text-[16px] text-primary" />
                      Taken {test.attemptCount}x
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleStart(test._id, test.accessLevel)}
                  disabled={locked}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                    locked
                      ? "bg-surface-container-high text-on-surface-variant cursor-not-allowed"
                      : "btn-shimmer bg-primary text-on-primary shark-shadow hover:bg-accent cursor-pointer"
                  }`}
                >
                  {locked ? "Upgrade to Access" : "Start Test"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </StudentLayout>
  );
}
