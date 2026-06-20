import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Modal } from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import { Icon } from "../../components/common/Icon";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { EmptyState } from "../../components/ui/EmptyState";
import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

export const Route = createFileRoute("/admin/success-stories")({
  component: AdminSuccessStories,
});

interface StoryForm {
  _id?: string;
  name: string;
  score: string;
  university: string;
  quote: string;
  imageUrl: string;
  videoUrl: string;
}

function AdminSuccessStories() {
  const { user } = useAuth();
  const [stories, setStories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<StoryForm | null>(null);
  const [formData, setFormData] = useState<StoryForm>({
    name: "", score: "", university: "", quote: "", imageUrl: "", videoUrl: "",
  });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStories = async () => {
    const res = await api.get("/api/success-stories");
    if (res.success) setStories(res.stories || []);
  };

  useEffect(() => {
    if (user?.role === "ADMIN") fetchStories();
  }, [user]);

  const openAddModal = () => {
    setEditingStory(null);
    setFormData({ name: "", score: "", university: "", quote: "", imageUrl: "", videoUrl: "" });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (story: any) => {
    setEditingStory(story);
    setFormData({
      name: story.name, score: story.score, university: story.university,
      quote: story.quote, imageUrl: story.imageUrl || "", videoUrl: story.videoUrl || "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!formData.name || !formData.score || !formData.university || !formData.quote) {
      setFormError("Name, Score, University, and Quote are required.");
      return;
    }
    setIsSubmitting(true);
    const res = editingStory?._id
      ? await api.put(`/api/success-stories/${editingStory._id}`, formData)
      : await api.post("/api/success-stories", formData);
    if (res.success) { setIsModalOpen(false); fetchStories(); }
    else setFormError(res.error || "Failed to save.");
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this success story?")) return;
    await api.delete(`/api/success-stories/${id}`);
    setStories((prev) => prev.filter((s) => s._id !== id));
  };

  return (
    <AdminLayout activeItem="/admin/success-stories">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Success Stories</h1>
        <button onClick={openAddModal} className="btn-shimmer inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shark-shadow hover:bg-accent transition-all cursor-pointer">
          <Icon name="add" className="text-lg" /> Add Story
        </button>
      </div>

      {stories.length === 0 ? (
        <EmptyState icon="social_leaderboard" title="No success stories" description="Add your first success story!" />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story: any) => (
            <div key={story._id || story.name} className="rounded-2xl bg-surface-container-lowest p-6 border border-outline-variant/40 flex flex-col justify-between hover-lift">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  {story.imageUrl ? (
                    <img src={story.imageUrl} alt={story.name} className="w-12 h-12 rounded-full object-cover border border-outline-variant" />
                  ) : (
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-primary text-on-primary font-display text-lg font-bold">{story.name.charAt(0)}</div>
                  )}
                  <div>
                    <h3 className="font-semibold text-on-surface text-lg">{story.name}</h3>
                    <div className="font-mono text-xs uppercase tracking-wider text-primary">{story.score}</div>
                  </div>
                </div>
                <div className="text-xs text-on-surface-variant flex items-center gap-1 mb-3">
                  <Icon name="school" className="text-sm" /> {story.university}
                </div>
                <p className="text-sm text-on-surface italic leading-relaxed line-clamp-3 mb-4">"{story.quote}"</p>
                <div className="flex gap-2 text-xs font-mono">
                  {story.imageUrl && <Badge variant="info">Image</Badge>}
                  {story.videoUrl && <Badge variant="accent">Video</Badge>}
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-outline-variant/30 mt-4">
                <button onClick={() => openEditModal(story)} className="flex-1 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-sm font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer">
                  <Icon name="edit" className="text-[16px]" /> Edit
                </button>
                <button onClick={() => handleDelete(story._id)} className="flex-1 py-2 rounded-lg bg-error/10 hover:bg-error/20 text-error text-sm font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer">
                  <Icon name="delete" className="text-[16px]" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingStory ? "Edit Success Story" : "Add Success Story"} icon={editingStory ? "edit" : "add_box"}>
        {formError && (
          <div className="mb-4 p-3 bg-error/15 text-error rounded-xl text-sm border border-error/25 flex items-center gap-2">
            <Icon name="error" className="shrink-0" /><span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Student Name *" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} required placeholder="e.g. Sarah M." />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Score *" value={formData.score} onChange={(e) => setFormData((p) => ({ ...p, score: e.target.value }))} required placeholder="e.g. Scored 1580 (+210)" />
            <Input label="University *" value={formData.university} onChange={(e) => setFormData((p) => ({ ...p, university: e.target.value }))} required placeholder="e.g. Harvard" />
          </div>
          <Input label="Image URL" type="url" value={formData.imageUrl} onChange={(e) => setFormData((p) => ({ ...p, imageUrl: e.target.value }))} placeholder="https://..." />
          <Input label="Video URL" type="url" value={formData.videoUrl} onChange={(e) => setFormData((p) => ({ ...p, videoUrl: e.target.value }))} placeholder="YouTube or MP4 URL" />
          <Textarea label="Quote *" value={formData.quote} onChange={(e) => setFormData((p) => ({ ...p, quote: e.target.value }))} required rows={3} placeholder="Student testimonial..." />
          <div className="flex gap-4 pt-4 border-t border-outline-variant/30">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-outline-variant hover:bg-surface-container-low text-sm font-semibold transition-colors cursor-pointer">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-accent font-semibold transition-all disabled:opacity-50 cursor-pointer">{isSubmitting ? "Saving..." : "Save Story"}</button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
