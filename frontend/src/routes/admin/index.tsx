import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "../../components/layout/Header";
import { useAuth } from "../../hooks/useAuth";

export const Route = createFileRoute("/admin/")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  if (!user || user.role !== "ADMIN") {
    return <div className="p-8 text-center text-error">Unauthorized. Admins only.</div>;
  }

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col">
      <Header />
      <main className="flex-1 flex max-w-[1400px] mx-auto w-full">
        {/* Sidebar */}
        <aside className="w-64 border-r border-outline-variant/30 p-6 hidden md:block">
          <h2 className="font-bold text-lg mb-6 text-on-surface-variant uppercase tracking-widest text-xs">Admin Panel</h2>
          <nav className="space-y-2">
            <Link to="/admin" className="block px-4 py-2 rounded-lg hover:bg-surface-container-low transition-colors [&.active]:bg-primary/10 [&.active]:text-primary [&.active]:font-semibold">Dashboard</Link>
            <Link to="/admin/users" className="block px-4 py-2 rounded-lg hover:bg-surface-container-low transition-colors [&.active]:bg-primary/10 [&.active]:text-primary [&.active]:font-semibold">Users</Link>
            <Link to="/admin/success-stories" className="block px-4 py-2 rounded-lg hover:bg-surface-container-low transition-colors [&.active]:bg-primary/10 [&.active]:text-primary [&.active]:font-semibold">Success Stories</Link>
            <Link to="/admin/contact-requests" className="block px-4 py-2 rounded-lg hover:bg-surface-container-low transition-colors [&.active]:bg-primary/10 [&.active]:text-primary [&.active]:font-semibold">Contact Requests</Link>
          </nav>
        </aside>
        
        {/* Content */}
        <div className="flex-1 p-6 lg:p-10">
          <h1 className="text-3xl font-bold mb-8">Admin Dashboard Overview</h1>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-xl bg-surface-container-lowest p-6 border border-outline-variant/40">
              <div className="text-on-surface-variant text-sm mb-1">Total Users</div>
              <div className="text-3xl font-bold text-primary">--</div>
            </div>
            <div className="rounded-xl bg-surface-container-lowest p-6 border border-outline-variant/40">
              <div className="text-on-surface-variant text-sm mb-1">Paid Users</div>
              <div className="text-3xl font-bold text-accent">--</div>
            </div>
            <div className="rounded-xl bg-surface-container-lowest p-6 border border-outline-variant/40">
              <div className="text-on-surface-variant text-sm mb-1">Pending Inquiries</div>
              <div className="text-3xl font-bold text-warning">--</div>
            </div>
            <div className="rounded-xl bg-surface-container-lowest p-6 border border-outline-variant/40">
              <div className="text-on-surface-variant text-sm mb-1">Success Stories</div>
              <div className="text-3xl font-bold text-secondary">--</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
