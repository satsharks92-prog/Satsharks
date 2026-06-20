import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { StudentLayout } from "../../components/layout/StudentLayout";
import { StatCard } from "../../components/ui/StatCard";
import { ScoreCircle } from "../../components/ui/ScoreCircle";
import { Badge } from "../../components/ui/Badge";
import { Icon } from "../../components/common/Icon";
import { EmptyState } from "../../components/ui/EmptyState";
import { api } from "../../services/api";
import type { PerformanceDataPoint, CategoryBreakdown, PredictedScore, DashboardStats } from "../../types";

export const Route = createFileRoute("/dashboard/analytics")({
  component: Analytics,
});

function Analytics() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [performance, setPerformance] = useState<PerformanceDataPoint[]>([]);
  const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([]);
  const [predicted, setPredicted] = useState<PredictedScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [statsRes, perfRes, catRes, predRes] = await Promise.all([
        api.get("/api/analytics/dashboard"),
        api.get("/api/analytics/performance"),
        api.get("/api/analytics/category-breakdown"),
        api.get("/api/analytics/predicted-score"),
      ]);
      if (statsRes.success) setStats(statsRes.stats);
      if (perfRes.success) setPerformance(perfRes.performance || []);
      if (catRes.success) setBreakdown(catRes.breakdown || []);
      if (predRes.success && predRes.predicted) setPredicted(predRes.predicted);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <StudentLayout activeItem="/dashboard/analytics">
        <div className="text-center py-12 text-on-surface-variant">Loading analytics...</div>
      </StudentLayout>
    );
  }

  if (!stats || stats.totalTests === 0) {
    return (
      <StudentLayout activeItem="/dashboard/analytics">
        <h1 className="text-3xl font-bold mb-8">Performance Analytics</h1>
        <EmptyState
          icon="insights"
          title="No data yet"
          description="Complete at least one diagnostic test to see your analytics"
        />
      </StudentLayout>
    );
  }

  return (
    <StudentLayout activeItem="/dashboard/analytics">
      <h1 className="text-3xl font-bold mb-8">Performance Analytics</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard label="Tests Taken" value={stats.totalTests} icon="quiz" color="primary" />
        <StatCard label="Average Score" value={`${stats.avgScore}%`} icon="trending_up" color="secondary" />
        <StatCard label="Best Score" value={`${stats.bestScore}%`} icon="emoji_events" color="accent" />
        <StatCard label="Questions Practiced" value={stats.practiceCount} icon="fitness_center" color="primary" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-10">
        {/* Predicted Score */}
        <div className="rounded-2xl bg-surface-container-lowest p-8 shark-shadow border border-outline-variant/40 flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-6 self-start">Predicted SAT Score</h2>
          {predicted ? (
            <>
              <ScoreCircle score={predicted.score} label="Estimated" sublabel={`${predicted.range.low} – ${predicted.range.high}`} />
              <Badge variant="info" className="mt-4">{predicted.confidence}% Confidence</Badge>
            </>
          ) : (
            <p className="text-sm text-on-surface-variant">Not enough data</p>
          )}
        </div>

        {/* Score Trend */}
        <div className="lg:col-span-2 rounded-2xl bg-surface-container-lowest p-8 shark-shadow border border-outline-variant/40">
          <h2 className="text-lg font-semibold mb-6">Score Trend</h2>
          {performance.length > 0 ? (
            <div className="space-y-3">
              {performance.map((p, i) => {
                const prev = i > 0 ? performance[i - 1].score : p.score;
                const diff = p.score - prev;
                return (
                  <div key={i} className="flex items-center gap-4">
                    <span className="w-8 text-xs font-mono text-on-surface-variant text-right">#{p.index}</span>
                    <div className="flex-1 h-6 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          p.score >= 70 ? "bg-primary" : p.score >= 50 ? "bg-accent" : "bg-error"
                        }`}
                        style={{ width: `${p.score}%` }}
                      />
                    </div>
                    <span className="w-12 text-sm font-bold text-right">{p.score}%</span>
                    {i > 0 && (
                      <span className={`w-14 text-xs font-bold text-right ${diff > 0 ? "text-primary" : diff < 0 ? "text-error" : "text-on-surface-variant"}`}>
                        {diff > 0 ? `+${diff}` : diff}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant">No data</p>
          )}
        </div>
      </div>

      {/* Category Breakdown */}
      {breakdown.length > 0 && (
        <div className="rounded-2xl bg-surface-container-lowest p-8 shark-shadow border border-outline-variant/40">
          <h2 className="text-lg font-semibold mb-6">Category Breakdown</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {breakdown.map((cat) => (
              <div key={cat.category} className="p-5 rounded-xl border border-outline-variant/30 hover:bg-surface-container-low transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-sm">{cat.category}</span>
                  <Badge variant={cat.percentage >= 70 ? "success" : cat.percentage >= 50 ? "warning" : "error"}>
                    {cat.percentage}%
                  </Badge>
                </div>
                <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      cat.percentage >= 70 ? "bg-primary" : cat.percentage >= 50 ? "bg-accent" : "bg-error"
                    }`}
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-on-surface-variant">
                  {cat.correct} / {cat.total} correct
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </StudentLayout>
  );
}
