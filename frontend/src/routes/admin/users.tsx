import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "../../components/layout/Header";
import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const { user, isLoading } = useAuth();
  const [usersList, setUsersList] = useState<any[]>([]);

  const fetchUsers = async () => {
    const res = await api.get("/api/users");
    if (res.success) setUsersList(res.users || []);
  };

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchUsers();
    }
  }, [user]);

  const updateSubscription = async (id: string, current: string) => {
    const nextSub = current === "FREE" ? "PAID" : "FREE";
    const res = await api.put(`/api/users/${id}/subscription`, { subscription: nextSub });
    if (res.success) {
      setUsersList(prev => prev.map(u => u._id === id ? { ...u, subscription: nextSub } : u));
    }
  };

  const updateStatus = async (id: string, current: string) => {
    const nextStatus = current === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const res = await api.put(`/api/users/${id}/status`, { status: nextStatus });
    if (res.success) {
      setUsersList(prev => prev.map(u => u._id === id ? { ...u, status: nextStatus } : u));
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!user || user.role !== "ADMIN") return <div className="p-8 text-center text-error">Unauthorized.</div>;

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col">
      <Header />
      <main className="flex-1 flex max-w-[1400px] mx-auto w-full">
        <aside className="w-64 border-r border-outline-variant/30 p-6 hidden md:block">
          <h2 className="font-bold text-lg mb-6 text-on-surface-variant uppercase tracking-widest text-xs">Admin Panel</h2>
          <nav className="space-y-2">
            <Link to="/admin" className="block px-4 py-2 rounded-lg hover:bg-surface-container-low transition-colors">Dashboard</Link>
            <Link to="/admin/users" className="block px-4 py-2 rounded-lg bg-primary/10 text-primary font-semibold">Users</Link>
            <Link to="/admin/success-stories" className="block px-4 py-2 rounded-lg hover:bg-surface-container-low transition-colors">Success Stories</Link>
            <Link to="/admin/contact-requests" className="block px-4 py-2 rounded-lg hover:bg-surface-container-low transition-colors">Contact Requests</Link>
          </nav>
        </aside>
        
        <div className="flex-1 p-6 lg:p-10 overflow-x-auto">
          <h1 className="text-3xl font-bold mb-8">User Management</h1>
          
          <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/40 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/40 text-sm uppercase tracking-wider text-on-surface-variant">
                  <th className="p-4 font-semibold">Name & Email</th>
                  <th className="p-4 font-semibold">Country</th>
                  <th className="p-4 font-semibold">Tier</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {usersList.map((u) => (
                  <tr key={u._id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold">{u.name} {u.role === "ADMIN" && <span className="ml-2 text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">ADMIN</span>}</div>
                      <div className="text-sm text-on-surface-variant">{u.email}</div>
                    </td>
                    <td className="p-4 text-sm">
                      <div>{u.country}</div>
                      <div className="text-xs text-on-surface-variant">{u.region}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded font-bold ${u.subscription === "PAID" ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container-high text-on-surface"}`}>
                        {u.subscription}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded font-bold ${u.status === "ACTIVE" ? "bg-primary/20 text-primary" : "bg-error/20 text-error"}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {u.role !== "ADMIN" && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => updateSubscription(u._id, u.subscription)}
                            className="px-3 py-1 bg-surface-container-high hover:bg-surface-container-highest rounded text-sm transition-colors"
                          >
                            {u.subscription === "FREE" ? "Upgrade to PAID" : "Downgrade to FREE"}
                          </button>
                          <button 
                            onClick={() => updateStatus(u._id, u.status)}
                            className={`px-3 py-1 rounded text-sm transition-colors ${u.status === "ACTIVE" ? "bg-error/10 text-error hover:bg-error/20" : "bg-primary/10 text-primary hover:bg-primary/20"}`}
                          >
                            {u.status === "ACTIVE" ? "Suspend" : "Activate"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
