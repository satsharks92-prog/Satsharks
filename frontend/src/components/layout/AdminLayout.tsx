import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Header } from "./Header";
import { useAuth } from "../../hooks/useAuth";
import { Icon } from "../common/Icon";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: "dashboard" },
  { to: "/admin/users", label: "Users", icon: "group" },
  { to: "/admin/tests", label: "Tests", icon: "quiz" },
  { to: "/admin/questions", label: "Questions", icon: "help_center" },
  { to: "/admin/uploads", label: "Uploads", icon: "upload_file" },
  { to: "/admin/success-stories", label: "Success Stories", icon: "social_leaderboard" },
  { to: "/admin/contact-requests", label: "Contact Requests", icon: "mail" },
];

export function AdminLayout({ children, activeItem }: { children: ReactNode; activeItem: string }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-on-surface-variant font-semibold">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return <div className="p-8 text-center text-error font-semibold">Unauthorized. Admins only.</div>;
  }

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col">
      <Header />
      <main className="flex-1 flex max-w-[1400px] mx-auto w-full">
        <aside className="w-64 border-r border-outline-variant/30 p-6 hidden md:block">
          <h2 className="font-bold mb-6 text-on-surface-variant uppercase tracking-widest text-xs">
            Admin Panel
          </h2>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                  activeItem === item.to
                    ? "bg-primary/10 text-primary font-semibold"
                    : "hover:bg-surface-container-low text-on-surface-variant"
                }`}
              >
                <Icon name={item.icon} className="text-[20px]" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="flex-1 p-6 lg:p-10">{children}</div>
      </main>
    </div>
  );
}
