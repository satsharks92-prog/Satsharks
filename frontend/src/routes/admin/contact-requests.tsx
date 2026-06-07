import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "../../components/layout/Header";
import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/contact-requests")({
  component: AdminContactRequests,
});

function AdminContactRequests() {
  const { user, isLoading } = useAuth();
  const [inquiries, setInquiries] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      api.get("/api/contact").then(res => {
        if (res.success) setInquiries(res.inquiries || []);
      });
    }
  }, [user]);

  const updateStatus = async (id: string, status: string) => {
    const res = await api.put(`/api/contact/${id}/status`, { status });
    if (res.success) {
      setInquiries(prev => prev.map(i => i._id === id ? { ...i, status } : i));
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
            <Link to="/admin/contact-requests" className="block px-4 py-2 rounded-lg bg-primary/10 text-primary font-semibold">Contact Requests</Link>
          </nav>
        </aside>
        
        {/* Content */}
        <div className="flex-1 p-6 lg:p-10">
          <h1 className="text-3xl font-bold mb-8">Contact Inquiries</h1>
          <div className="space-y-4">
            {inquiries.map((inquiry: any) => (
              <div key={inquiry._id} className="rounded-xl bg-surface-container-lowest p-6 border border-outline-variant/40">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{inquiry.firstName} {inquiry.lastName}</h3>
                    <p className="text-sm text-on-surface-variant">{inquiry.email}</p>
                    <p className="mt-2 font-medium">{inquiry.category}</p>
                    <p className="mt-2 text-sm">{inquiry.message}</p>
                  </div>
                  <div>
                    <select 
                      value={inquiry.status || "NEW"} 
                      onChange={(e) => updateStatus(inquiry._id, e.target.value)}
                      className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-1.5 text-sm"
                    >
                      <option value="NEW">New</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
            {inquiries.length === 0 && <p>No inquiries found.</p>}
          </div>
        </div>
      </main>
    </div>
  );
}
