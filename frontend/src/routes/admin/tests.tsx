import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Modal } from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import { Icon } from "../../components/common/Icon";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { EmptyState } from "../../components/ui/EmptyState";
import { api } from "../../services/api";

export const Route = createFileRoute("/admin/tests")({
  component: AdminTests,
});

function AdminTests() {
  const [satTests, setSatTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [satModalOpen, setSatModalOpen] = useState(false);
  const [editingSatTest, setEditingSatTest] = useState<any | null>(null);
  const [satForm, setSatForm] = useState({
    title: "",
    year: "2025",
    testNumber: "1",
    accessLevel: "FREE",
  });
  const [satFormError, setSatFormError] = useState("");
  const [satSubmitting, setSatSubmitting] = useState(false);

  const fetchSatTests = async () => {
    setLoading(true);
    const res = await api.get("/api/sat/admin/all");
    if (res.success) setSatTests(res.tests || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchSatTests();
  }, []);

  const toggleSatActive = async (id: string, current: boolean) => {
    await api.put(`/api/sat/admin/${id}`, { isActive: !current });
    fetchSatTests();
  };

  const handleSatDelete = async (id: string) => {
    if (!confirm("Delete this digital SAT practice test?")) return;
    await api.delete(`/api/sat/admin/${id}`);
    fetchSatTests();
  };

  const openSatEdit = (t: any) => {
    setEditingSatTest(t);
    setSatForm({
      title: t.title,
      year: String(t.year),
      testNumber: String(t.testNumber),
      accessLevel: t.accessLevel,
    });
    setSatFormError("");
    setSatModalOpen(true);
  };

  const handleSatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSatFormError("");
    if (!satForm.title) {
      setSatFormError("Title is required.");
      return;
    }
    setSatSubmitting(true);
    const body = {
      title: satForm.title,
      year: parseInt(satForm.year),
      testNumber: parseInt(satForm.testNumber),
      accessLevel: satForm.accessLevel,
    };

    const res = await api.put(`/api/sat/admin/${editingSatTest._id}`, body);

    if (res.success) {
      setSatModalOpen(false);
      fetchSatTests();
    } else {
      setSatFormError(res.error || "Failed to save SAT test.");
    }
    setSatSubmitting(false);
  };

  return (
    <AdminLayout activeItem="/admin/tests">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Digital SAT Test Management</h1>
      </div>

      {loading ? (
        <div className="text-center py-12 text-on-surface-variant">Loading tests...</div>
      ) : satTests.length === 0 ? (
        <EmptyState icon="school" title="No Digital SAT practice tests created yet" description="Practice tests are loaded automatically via import scripts" />
      ) : (
        <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/40 overflow-hidden shark-shadow">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/40 text-xs uppercase tracking-wider text-on-surface-variant">
                <th className="p-4 font-semibold">Title</th>
                <th className="p-4 font-semibold">Year</th>
                <th className="p-4 font-semibold">Test Number</th>
                <th className="p-4 font-semibold">Type</th>
                <th className="p-4 font-semibold">Modules</th>
                <th className="p-4 font-semibold">Access</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {satTests.map((t) => (
                <tr key={t._id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="p-4 font-semibold text-sm">{t.title}</td>
                  <td className="p-4 text-sm">{t.year}</td>
                  <td className="p-4 text-sm">#{t.testNumber}</td>
                  <td className="p-4"><Badge variant="accent">{t.isAdaptive ? "Adaptive" : "Linear"}</Badge></td>
                  <td className="p-4 text-sm">{t.modules?.length || 0} modules</td>
                  <td className="p-4"><Badge variant={t.accessLevel === "PAID" ? "accent" : "success"}>{t.accessLevel}</Badge></td>
                  <td className="p-4">
                    <button onClick={() => toggleSatActive(t._id, t.isActive)} className="cursor-pointer">
                      <Badge variant={t.isActive ? "success" : "error"}>{t.isActive ? "Active" : "Inactive"}</Badge>
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => openSatEdit(t)} className="px-3 py-1 bg-surface-container-high hover:bg-surface-container-highest rounded text-sm transition-colors cursor-pointer">Edit</button>
                      <button onClick={() => handleSatDelete(t._id)} className="px-3 py-1 bg-error/10 text-error hover:bg-error/20 rounded text-sm transition-colors cursor-pointer">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={satModalOpen} onClose={() => setSatModalOpen(false)} title="Edit Digital SAT Practice Test" icon="edit" maxWidth="max-w-md">
        {satFormError && (
          <div className="mb-4 p-3 bg-error/15 text-error rounded-xl text-sm border border-error/25 flex items-center gap-2">
            <Icon name="error" className="shrink-0" /><span>{satFormError}</span>
          </div>
        )}
        <form onSubmit={handleSatSubmit} className="space-y-4">
          <Input label="Test Title" value={satForm.title} onChange={(e) => setSatForm((p) => ({ ...p, title: e.target.value }))} required placeholder="e.g. Digital SAT Practice Test 1" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Year" type="number" value={satForm.year} onChange={(e) => setSatForm((p) => ({ ...p, year: e.target.value }))} required />
            <Input label="Test Number" type="number" value={satForm.testNumber} onChange={(e) => setSatForm((p) => ({ ...p, testNumber: e.target.value }))} required />
          </div>
          <Select label="Access Level" value={satForm.accessLevel} onChange={(e) => setSatForm((p) => ({ ...p, accessLevel: e.target.value }))} options={[{ value: "FREE", label: "Free" }, { value: "PAID", label: "Paid" }]} />

          <div className="flex gap-4 pt-4 border-t border-outline-variant/30">
            <button type="button" onClick={() => setSatModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-outline-variant hover:bg-surface-container-low text-sm font-semibold transition-colors cursor-pointer">Cancel</button>
            <button type="submit" disabled={satSubmitting} className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-accent font-semibold transition-all disabled:opacity-50 cursor-pointer">{satSubmitting ? "Saving..." : "Save Test"}</button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
