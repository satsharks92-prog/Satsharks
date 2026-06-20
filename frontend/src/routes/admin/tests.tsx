import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Modal } from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import { Icon } from "../../components/common/Icon";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { EmptyState } from "../../components/ui/EmptyState";
import { api } from "../../services/api";
import type { DiagnosticTest, Question } from "../../types";

export const Route = createFileRoute("/admin/tests")({
  component: AdminTests,
});

function AdminTests() {
  const [tests, setTests] = useState<DiagnosticTest[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<DiagnosticTest | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    section: "MATH",
    timeLimit: "60",
    accessLevel: "FREE",
    selectedQuestions: [] as string[],
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchTests = async () => {
    const res = await api.get("/api/tests/admin/all");
    if (res.success) setTests(res.tests || []);
    setLoading(false);
  };

  const fetchQuestions = async () => {
    const res = await api.get("/api/questions/admin?status=PUBLISHED&limit=100");
    if (res.success) setQuestions(res.questions || []);
  };

  useEffect(() => { fetchTests(); fetchQuestions(); }, []);

  const openCreate = () => {
    setEditingTest(null);
    setForm({ title: "", description: "", section: "MATH", timeLimit: "60", accessLevel: "FREE", selectedQuestions: [] });
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (t: DiagnosticTest) => {
    setEditingTest(t);
    setForm({
      title: t.title,
      description: t.description,
      section: t.section,
      timeLimit: String(t.timeLimit),
      accessLevel: t.accessLevel,
      selectedQuestions: (t.questions as any[]).map((q: any) => q._id || q),
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.title || form.selectedQuestions.length === 0) {
      setFormError("Title and at least one question are required.");
      return;
    }
    setSubmitting(true);
    const body = {
      title: form.title,
      description: form.description,
      section: form.section,
      timeLimit: parseInt(form.timeLimit),
      accessLevel: form.accessLevel,
      questions: form.selectedQuestions,
    };

    const res = editingTest
      ? await api.put(`/api/tests/${editingTest._id}`, body)
      : await api.post("/api/tests", body);

    if (res.success) {
      setModalOpen(false);
      fetchTests();
    } else {
      setFormError(res.error || "Failed to save test.");
    }
    setSubmitting(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await api.put(`/api/tests/${id}`, { isActive: !current });
    fetchTests();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this test?")) return;
    await api.delete(`/api/tests/${id}`);
    fetchTests();
  };

  const toggleQuestion = (qId: string) => {
    setForm((prev) => ({
      ...prev,
      selectedQuestions: prev.selectedQuestions.includes(qId)
        ? prev.selectedQuestions.filter((id) => id !== qId)
        : [...prev.selectedQuestions, qId],
    }));
  };

  const sectionLabel = (s: string) => s === "READING_WRITING" ? "Reading & Writing" : s === "MATH" ? "Math" : "Full Test";

  return (
    <AdminLayout activeItem="/admin/tests">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Test Management</h1>
        <button onClick={openCreate} className="btn-shimmer inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shark-shadow hover:bg-accent transition-all cursor-pointer">
          <Icon name="add" className="text-lg" /> Create Test
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-on-surface-variant">Loading...</div>
      ) : tests.length === 0 ? (
        <EmptyState icon="quiz" title="No tests created yet" description="Create your first diagnostic test" />
      ) : (
        <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/40 overflow-hidden shark-shadow">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/40 text-xs uppercase tracking-wider text-on-surface-variant">
                <th className="p-4 font-semibold">Title</th>
                <th className="p-4 font-semibold">Section</th>
                <th className="p-4 font-semibold">Questions</th>
                <th className="p-4 font-semibold">Time</th>
                <th className="p-4 font-semibold">Access</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {tests.map((t) => (
                <tr key={t._id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="p-4 font-semibold text-sm">{t.title}</td>
                  <td className="p-4"><Badge variant="info">{sectionLabel(t.section)}</Badge></td>
                  <td className="p-4 text-sm">{t.questions.length}</td>
                  <td className="p-4 text-sm">{t.timeLimit} min</td>
                  <td className="p-4"><Badge variant={t.accessLevel === "PAID" ? "accent" : "success"}>{t.accessLevel}</Badge></td>
                  <td className="p-4">
                    <button onClick={() => toggleActive(t._id, t.isActive)} className="cursor-pointer">
                      <Badge variant={t.isActive ? "success" : "error"}>{t.isActive ? "Active" : "Inactive"}</Badge>
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(t)} className="px-3 py-1 bg-surface-container-high hover:bg-surface-container-highest rounded text-sm transition-colors cursor-pointer">Edit</button>
                      <button onClick={() => handleDelete(t._id)} className="px-3 py-1 bg-error/10 text-error hover:bg-error/20 rounded text-sm transition-colors cursor-pointer">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingTest ? "Edit Test" : "Create Test"} icon={editingTest ? "edit" : "add_box"} maxWidth="max-w-2xl">
        {formError && (
          <div className="mb-4 p-3 bg-error/15 text-error rounded-xl text-sm border border-error/25 flex items-center gap-2">
            <Icon name="error" className="shrink-0" /><span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Test Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required placeholder="e.g. SAT Math Practice Test 1" />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} placeholder="Brief description..." />
          <div className="grid grid-cols-3 gap-4">
            <Select label="Section" value={form.section} onChange={(e) => setForm((p) => ({ ...p, section: e.target.value }))} options={[{ value: "MATH", label: "Math" }, { value: "READING_WRITING", label: "Reading & Writing" }, { value: "FULL", label: "Full Test" }]} />
            <Input label="Time Limit (min)" type="number" value={form.timeLimit} onChange={(e) => setForm((p) => ({ ...p, timeLimit: e.target.value }))} min="1" required />
            <Select label="Access Level" value={form.accessLevel} onChange={(e) => setForm((p) => ({ ...p, accessLevel: e.target.value }))} options={[{ value: "FREE", label: "Free" }, { value: "PAID", label: "Paid" }]} />
          </div>

          <div>
            <label className="mb-1.5 block font-mono text-[12px] uppercase tracking-[0.08em] text-on-surface-variant">
              Select Questions ({form.selectedQuestions.length} selected)
            </label>
            <div className="max-h-60 overflow-y-auto border border-outline-variant rounded-xl p-3 space-y-2">
              {questions.length === 0 ? (
                <p className="text-sm text-on-surface-variant text-center py-4">No published questions available</p>
              ) : questions.map((q) => (
                <label key={q._id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-surface-container-low cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.selectedQuestions.includes(q._id)}
                    onChange={() => toggleQuestion(q._id)}
                    className="mt-1 accent-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-1">{q.text}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="info">{q.section === "MATH" ? "Math" : "R&W"}</Badge>
                      <Badge variant={q.difficulty === "EASY" ? "success" : q.difficulty === "HARD" ? "error" : "warning"}>{q.difficulty}</Badge>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-outline-variant/30">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-outline-variant hover:bg-surface-container-low text-sm font-semibold transition-colors cursor-pointer">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-accent font-semibold transition-all disabled:opacity-50 cursor-pointer">{submitting ? "Saving..." : "Save Test"}</button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
