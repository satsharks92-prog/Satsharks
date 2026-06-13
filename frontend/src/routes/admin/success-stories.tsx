import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "../../components/layout/Header";
import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { Link } from "@tanstack/react-router";
import { Icon } from "../../components/common/Icon";

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
  const { user, isLoading } = useAuth();
  const [stories, setStories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<StoryForm | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<StoryForm>({
    name: "",
    score: "",
    university: "",
    quote: "",
    imageUrl: "",
    videoUrl: "",
  });
  
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStories = async () => {
    try {
      const res = await api.get("/api/success-stories");
      if (res.success) setStories(res.stories || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchStories();
    }
  }, [user]);

  const openAddModal = () => {
    setEditingStory(null);
    setFormData({
      name: "",
      score: "",
      university: "",
      quote: "",
      imageUrl: "",
      videoUrl: "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (story: any) => {
    setEditingStory(story);
    setFormData({
      name: story.name,
      score: story.score,
      university: story.university,
      quote: story.quote,
      imageUrl: story.imageUrl || "",
      videoUrl: story.videoUrl || "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    
    if (!formData.name || !formData.score || !formData.university || !formData.quote) {
      setFormError("Name, Score, University, and Quote are required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingStory && editingStory._id) {
        // Edit mode
        const res = await api.put(`/api/success-stories/${editingStory._id}`, formData);
        if (res.success) {
          setIsModalOpen(false);
          fetchStories();
        } else {
          setFormError(res.error || "Failed to update success story.");
        }
      } else {
        // Create mode
        const res = await api.post("/api/success-stories", formData);
        if (res.success) {
          setIsModalOpen(false);
          fetchStories();
        } else {
          setFormError(res.error || "Failed to create success story.");
        }
      }
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this success story?")) return;
    try {
      const res = await api.delete(`/api/success-stories/${id}`);
      if (res.success) {
        setStories(prev => prev.filter(s => s._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!user || user.role !== "ADMIN") return <div className="p-8 text-center text-error">Unauthorized. Admins only.</div>;

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col">
      <Header />
      <main className="flex-1 flex max-w-[1400px] mx-auto w-full">
        {/* Sidebar */}
        <aside className="w-64 border-r border-outline-variant/30 p-6 hidden md:block">
          <h2 className="font-bold text-lg mb-6 text-on-surface-variant uppercase tracking-widest text-xs">Admin Panel</h2>
          <nav className="space-y-2">
            <Link to="/admin" className="block px-4 py-2 rounded-lg hover:bg-surface-container-low transition-colors">Dashboard</Link>
            <Link to="/admin/users" className="block px-4 py-2 rounded-lg hover:bg-surface-container-low transition-colors">Users</Link>
            <Link to="/admin/success-stories" className="block px-4 py-2 rounded-lg bg-primary/10 text-primary font-semibold">Success Stories</Link>
            <Link to="/admin/contact-requests" className="block px-4 py-2 rounded-lg hover:bg-surface-container-low transition-colors">Contact Requests</Link>
          </nav>
        </aside>
        
        {/* Content */}
        <div className="flex-1 p-6 lg:p-10">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Success Stories</h1>
            <button
              onClick={openAddModal}
              className="btn-shimmer inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shark-shadow hover:bg-accent transition-all duration-300 cursor-pointer"
            >
              <Icon name="add" className="text-lg" />
              Add Story
            </button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((story: any) => (
              <div
                key={story._id || story.name}
                className="rounded-2xl bg-surface-container-lowest p-6 border border-outline-variant/40 flex flex-col justify-between hover-lift relative"
              >
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    {story.imageUrl ? (
                      <img
                        src={story.imageUrl}
                        alt={story.name}
                        className="w-12 h-12 rounded-full object-cover border border-outline-variant"
                      />
                    ) : (
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-primary text-on-primary font-display text-lg font-bold">
                        {story.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-on-surface text-lg">{story.name}</h3>
                      <div className="font-mono text-xs uppercase tracking-wider text-primary">{story.score}</div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-on-surface-variant flex items-center gap-1 mb-3">
                    <Icon name="school" className="text-sm" /> {story.university}
                  </div>
                  
                  <p className="text-sm text-on-surface italic leading-relaxed line-clamp-3 mb-6">
                    "{story.quote}"
                  </p>

                  <div className="flex gap-2 mb-4 text-xs font-mono">
                    {story.imageUrl && (
                      <span className="inline-flex items-center gap-1 rounded bg-secondary/15 text-secondary px-2 py-0.5 border border-secondary/25">
                        <Icon name="image" className="text-[12px]" /> Image
                      </span>
                    )}
                    {story.videoUrl && (
                      <span className="inline-flex items-center gap-1 rounded bg-accent/15 text-accent px-2 py-0.5 border border-accent/25">
                        <Icon name="smart_display" className="text-[12px]" /> Video
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-outline-variant/30 mt-auto">
                  <button
                    onClick={() => openEditModal(story)}
                    className="flex-1 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-sm font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Icon name="edit" className="text-[16px]" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(story._id)}
                    className="flex-1 py-2 rounded-lg bg-error/10 hover:bg-error/20 text-error text-sm font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Icon name="delete" className="text-[16px]" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {stories.length === 0 && (
            <div className="text-center py-12 border border-dashed border-outline-variant/60 rounded-2xl bg-surface-container-lowest">
              <Icon name="social_leaderboard" className="text-4xl text-on-surface-variant/40 mb-3" />
              <p className="text-on-surface-variant">No success stories found. Add the first one!</p>
            </div>
          )}
        </div>
      </main>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant/65 rounded-2xl shadow-xl w-full max-w-lg p-6 relative flex flex-col my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container-low transition-colors"
            >
              <Icon name="close" className="text-2xl" />
            </button>

            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Icon name={editingStory ? "edit" : "add_box"} className="text-primary" />
              {editingStory ? "Edit Success Story" : "Add Success Story"}
            </h2>

            {formError && (
              <div className="mb-4 p-3 bg-error/15 text-error rounded-xl text-sm border border-error/25 flex items-center gap-2">
                <Icon name="error" className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Student Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah M."
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Score Achieved *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Scored 1580 (+210)"
                    value={formData.score}
                    onChange={e => setFormData(prev => ({ ...prev, score: e.target.value }))}
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    University / College *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Harvard University"
                    value={formData.university}
                    onChange={e => setFormData(prev => ({ ...prev, university: e.target.value }))}
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Student Image URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="e.g. https://images.unsplash.com/..."
                  value={formData.imageUrl}
                  onChange={e => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Video Testimonial URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="e.g. YouTube watch link or direct MP4 URL"
                  value={formData.videoUrl}
                  onChange={e => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Student Quote *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write the testimonial text here..."
                  value={formData.quote}
                  onChange={e => setFormData(prev => ({ ...prev, quote: e.target.value }))}
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-outline-variant hover:bg-surface-container-low text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-accent font-semibold transition-all duration-300 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Saving..." : "Save Story"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
