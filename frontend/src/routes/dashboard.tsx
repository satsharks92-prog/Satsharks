import { createFileRoute, redirect } from "@tanstack/react-router";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { useAuth } from "../hooks/useAuth";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  
  if (!user || user.role !== "STUDENT") {
    return <div className="p-8 text-center">Unauthorized. Students only.</div>;
  }

  return (
    <div className="min-h-screen bg-background text-on-background animate-fade-up flex flex-col">
      <Header />
      <main className="flex-1 py-12 px-6">
        <div className="mx-auto max-w-[1000px]">
          <h1 className="text-3xl font-bold mb-8">Student Dashboard</h1>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-2xl bg-surface-container-lowest p-6 shark-shadow border border-outline-variant/40">
              <h2 className="text-xl font-semibold mb-4">Profile</h2>
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
            </div>
            
            <div className="rounded-2xl bg-surface-container-lowest p-6 shark-shadow border border-outline-variant/40">
              <h2 className="text-xl font-semibold mb-4">Account Tier</h2>
              <div className="inline-flex gap-2">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-mono tracking-widest">{user.region}</span>
                <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-mono tracking-widest">{user.subscription}</span>
              </div>
              <p className="mt-4 text-sm text-on-surface-variant">
                {user.subscription === "PAID" 
                  ? "You have full access to all premium features, practice materials, and expert sessions." 
                  : "Upgrade to PAID to unlock full curriculum and expert mentoring sessions."}
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
