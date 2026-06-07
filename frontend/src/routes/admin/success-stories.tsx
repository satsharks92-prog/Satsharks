import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "../../components/layout/Header";
import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/success-stories")({
  component: AdminSuccessStories,
});

function AdminSuccessStories() {
  const { user, isLoading } = useAuth();
  const [stories, setStories] = useState<any[]>([]);

  useEffect(() => {
    api.get("/api/success-stories").then(res => {
      if (res.success) setStories(res.stories || []);
    });
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const res = await api.delete(`/api/success-stories/${id}`);
    if (res.success) {
      setStories(prev => prev.filter(s => s._id !== id));
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!user || user.role !== "ADMIN") return <div className="p-8 text-center text-error">Unauthorized.</div>;

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col">
      <Header />
      <main className="flex-1 flex max-w-[1400px] mx-auto w-full">
        {/* Sidebar */}
        <aside className="w-64 border-r border-outline-variant/30 p-6 hidden md:block">
          <h2 className="font-bold text-lg mb-6 text-on-surface-variant uppercase tracking-widest text-xs">Admin Panel</h2>
          <nav className="space-y-2">
            <Link to="/admin" className="block px-4 py-2 rounded-lg hover:bg-surface-container-low transition-colors">Dashboard</Link>
            <Link to="/admin/success-stories" className="block px-4 py-2 rounded-lg bg-primary/10 text-primary font-semibold">Success Stories</Link>
          </nav>
        </aside>
        
        {/* Content */}
        <div className="flex-1 p-6 lg:p-10">
          <h1 className="text-3xl font-bold mb-8">Success Stories</h1>
          <div className="space-y-4">
            {stories.map((story: any) => (
              <div key={story._id || story.name} className="rounded-xl bg-surface-container-lowest p-6 border border-outline-variant/40 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg">{story.name} - {story.score}</h3>
                  <p className="text-sm text-on-surface-variant">{story.university}</p>
                </div>
                <button onClick={() => handleDelete(story._id)} className="px-4 py-2 bg-error text-on-error rounded-lg text-sm font-semibold">Delete</button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
