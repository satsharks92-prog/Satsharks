import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { StudentLayout } from "../../components/layout/StudentLayout";
import { Badge } from "../../components/ui/Badge";
import { Icon } from "../../components/common/Icon";
import { EmptyState } from "../../components/ui/EmptyState";
import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import type { SATTest } from "../../types";

export const Route = createFileRoute("/dashboard/sat-tests")({
  component: SATTestList,
});

function SATTestList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tests, setTests] = useState<SATTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/sat").then((res) => {
      if (res.success) setTests(res.tests || []);
      setLoading(false);
    });
  }, []);

  const handleStart = async (testId: string) => {
    const res = await api.post(`/api/sat/${testId}/start`, {});
    if (res.success) {
      navigate({ to: `/dashboard/sat-runner/${res.attempt._id}` });
    }
  };

  return (
    <StudentLayout activeItem="/dashboard/sat-tests">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Digital SAT Practice Tests</h1>
        <p className="text-on-surface-variant">Full-length SAT mock tests with real exam timing and structure</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-on-surface-variant">Loading SAT tests...</div>
      ) : tests.length === 0 ? (
        <EmptyState icon="school" title="No SAT tests available" description="SAT practice tests will appear here once imported by an administrator" />
      ) : (
        <div className="space-y-6">
          {tests.map((test) => {
            const locked = test.accessLevel === "PAID" && user?.subscription === "FREE";
            return (
              <div key={test._id} className={`rounded-2xl bg-surface-container-lowest p-8 border border-outline-variant/40 shark-shadow hover-lift ${locked ? "opacity-70" : ""}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h2 className="text-xl font-bold">{test.title}</h2>
                      {locked ? (
                        <Badge variant="warning"><Icon name="lock" className="text-[12px] mr-1" />PAID</Badge>
                      ) : (
                        <Badge variant="success">FREE</Badge>
                      )}
                    </div>
                    {test.description && <p className="text-sm text-on-surface-variant mb-4">{test.description}</p>}

                    <div className="flex flex-wrap gap-6 text-sm text-on-surface-variant">
                      <span className="flex items-center gap-1.5">
                        <Icon name="help_center" className="text-[18px] text-primary" />
                        {test.totalQuestions} questions
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Icon name="timer" className="text-[18px] text-accent" />
                        ~{test.totalMinutes} minutes total
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Icon name="view_module" className="text-[18px] text-secondary" />
                        4 modules + break
                      </span>
                      {(test.attemptCount ?? 0) > 0 && (
                        <span className="flex items-center gap-1.5">
                          <Icon name="check_circle" className="text-[18px] text-primary" />
                          Completed {test.attemptCount}x
                        </span>
                      )}
                    </div>

                    {/* Module breakdown */}
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                      {test.modulesSummary?.map((m, i) => (
                        <div key={i} className="px-3 py-2 rounded-lg bg-surface-container-low text-xs">
                          <div className="font-semibold text-on-surface">{m.name}</div>
                          <div className="text-on-surface-variant">{m.questionCount}q · {m.timeLimitMinutes}min</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 md:items-end shrink-0">
                    <button
                      onClick={() => handleStart(test._id)}
                      disabled={locked}
                      className={`px-8 py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${
                        locked
                          ? "bg-surface-container-high text-on-surface-variant cursor-not-allowed"
                          : "btn-shimmer bg-primary text-on-primary shark-shadow hover:bg-accent cursor-pointer"
                      }`}
                    >
                      {locked ? "Upgrade to Access" : "Start Test"}
                    </button>
                    {test.pdfUrl && (
                      <a
                        href={test.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                      >
                        <Icon name="picture_as_pdf" className="text-[16px]" /> View PDF
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </StudentLayout>
  );
}
