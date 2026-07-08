import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { StudentLayout } from "../../components/layout/StudentLayout";
import { StatCard } from "../../components/ui/StatCard";
import { ScoreCircle } from "../../components/ui/ScoreCircle";
import { Badge } from "../../components/ui/Badge";
import { Icon } from "../../components/common/Icon";
import { api } from "../../services/api";
import type { DashboardStats, TestAttempt, PredictedScore } from "../../types";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentAttempts, setRecentAttempts] = useState<TestAttempt[]>([]);
  const [predicted, setPredicted] = useState<PredictedScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [statsRes, predRes] = await Promise.all([
        api.get("/api/analytics/dashboard"),
        api.get("/api/analytics/predicted-score"),
      ]);
      if (statsRes.success) {
        setStats(statsRes.stats);
        setRecentAttempts(statsRes.recentAttempts || []);
      }
      if (predRes.success && predRes.predicted) {
        setPredicted(predRes.predicted);
      }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <StudentLayout activeItem="/dashboard">
      <h1 className="text-3xl font-bold mb-8">Student Dashboard</h1>

      {loading ? (
        <div className="text-center py-12 text-on-surface-variant">Loading your dashboard...</div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <StatCard label="Tests Taken" value={stats?.totalTests ?? 0} icon="quiz" color="primary" />
            <StatCard label="Average Score" value={`${stats?.avgScore ?? 0}%`} icon="trending_up" color="secondary" />
            <StatCard label="Best Score" value={`${stats?.bestScore ?? 0}%`} icon="emoji_events" color="accent" />
            <StatCard label="Questions Practiced" value={stats?.practiceCount ?? 0} icon="fitness_center" color="primary" />
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-10">
            <div className="lg:col-span-1 rounded-2xl bg-surface-container-lowest p-8 shark-shadow border border-outline-variant/40 flex flex-col items-center">
              <h2 className="text-lg font-semibold mb-6 self-start">Predicted SAT Score</h2>
              {predicted ? (
                <>
                  <ScoreCircle score={predicted.score} label="Predicted Score" sublabel={`${predicted.range.low} – ${predicted.range.high} range`} />
                  <div className="mt-4 flex items-center gap-2">
                    <Badge variant="info">{predicted.confidence}% Confidence</Badge>
                    <span className="text-xs text-on-surface-variant">Based on {predicted.basedOn} tests</span>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Icon name="psychology" className="text-4xl text-on-surface-variant/40 mb-2" />
                  <p className="text-sm text-on-surface-variant">Take a Digital SAT practice test to see your predicted score</p>
                </div>
              )}
            </div>

            <div className="lg:col-span-2 rounded-2xl bg-surface-container-lowest p-8 shark-shadow border border-outline-variant/40">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Recent Tests</h2>
                <Link to="/dashboard/history" className="text-xs font-bold uppercase tracking-widest text-primary hover:underline">
                  View All
                </Link>
              </div>
              {recentAttempts.length > 0 ? (
                <div className="space-y-3">
                  {recentAttempts.map((a: any) => (
                    <Link
                      key={a._id}
                      to={`/dashboard/sat-result/${a._id}`}
                      className="flex items-center justify-between p-4 rounded-xl border border-outline-variant/30 hover:bg-surface-container-low transition-colors group"
                    >
                      <div>
                        <div className="font-semibold text-sm group-hover:text-primary transition-colors">
                          Test #{a._id.slice(-6).toUpperCase()}
                        </div>
                        <div className="text-xs text-on-surface-variant">
                          {new Date(a.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={a.percentage >= 70 ? "success" : a.percentage >= 50 ? "warning" : "error"}>
                          {a.percentage}%
                        </Badge>
                        <Icon name="chevron_right" className="text-on-surface-variant text-[20px]" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Icon name="assignment" className="text-4xl text-on-surface-variant/40 mb-2" />
                  <p className="text-sm text-on-surface-variant">No tests taken yet</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <Link
              to="/dashboard/sat-tests"
              className="flex items-center gap-4 p-6 rounded-2xl bg-primary text-on-primary shark-shadow hover:-translate-y-1 transition-transform"
            >
              <Icon name="quiz" className="text-[28px]" />
              <div>
                <div className="font-semibold">Take a Test</div>
                <div className="text-xs text-on-primary/70">Start a practice mock test</div>
              </div>
            </Link>
            <Link
              to="/dashboard/practice"
              className="flex items-center gap-4 p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shark-shadow hover:-translate-y-1 transition-transform"
            >
              <Icon name="fitness_center" className="text-[28px] text-accent" />
              <div>
                <div className="font-semibold">Practice Questions</div>
                <div className="text-xs text-on-surface-variant">Sharpen your skills</div>
              </div>
            </Link>
            <Link
              to="/dashboard/analytics"
              className="flex items-center gap-4 p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shark-shadow hover:-translate-y-1 transition-transform"
            >
              <Icon name="insights" className="text-[28px] text-secondary" />
              <div>
                <div className="font-semibold">View Analytics</div>
                <div className="text-xs text-on-surface-variant">Track your progress</div>
              </div>
            </Link>
          </div>
        </>
      )}
    </StudentLayout>
  );
}
