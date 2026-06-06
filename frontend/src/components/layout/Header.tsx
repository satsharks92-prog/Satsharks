import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Icon } from "../common/Icon";
import logoAsset from "@/assets/logo.png.asset.json";
import { useAuth } from "../../hooks/useAuth";

export function Header() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  const links = [
    { to: "/", hash: "services", label: "Services" },
    { to: "/", hash: "results", label: "Results" },
    { to: "/", hash: "timeline", label: "Timeline" },
    { to: "/success-stories", hash: undefined, label: "Success Stories" },
    { to: "/subscriptions", hash: undefined, label: "Pricing" },
    { to: "/contact", hash: undefined, label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-outline-variant/40">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoAsset.url} alt="SAT Sharks" className="h-10 w-auto" />
        </Link>
        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              hash={l.hash}
              className="font-mono text-[12px] uppercase tracking-[0.08em] text-on-surface-variant hover:text-primary transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden lg:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-on-surface">Hi, {user.name}</span>
              <button
                onClick={logout}
                className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/auth/login"
                className="text-sm font-semibold text-on-surface hover:text-primary transition-colors"
              >
                Login
              </Link>
              <Link
                to="/auth/register"
                className="btn-shimmer inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shark-shadow hover:bg-primary-container transition-colors"
              >
                Register
                <Icon name="arrow_forward" className="text-[18px]" />
              </Link>
            </div>
          )}
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden rounded-lg p-2 text-on-surface"
          aria-label="menu"
        >
          <Icon name={open ? "close" : "menu"} />
        </button>
      </div>
      {open && (
        <div className="lg:hidden border-t border-outline-variant/40 bg-surface-container-lowest px-6 py-4 space-y-3 shadow-lg">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              hash={l.hash}
              onClick={() => setOpen(false)}
              className="block font-mono text-[13px] uppercase tracking-[0.08em] text-on-surface-variant hover:text-primary transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-4 mt-4 border-t border-outline-variant/40 flex flex-col gap-3">
            {user ? (
              <button
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
                className="block w-full text-left font-mono text-[13px] uppercase tracking-[0.08em] text-on-surface-variant"
              >
                Logout
              </button>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  onClick={() => setOpen(false)}
                  className="block w-full text-center rounded-xl border border-outline-variant bg-surface-container-lowest px-5 py-2.5 text-sm font-semibold text-on-surface"
                >
                  Login
                </Link>
                <Link
                  to="/auth/register"
                  onClick={() => setOpen(false)}
                  className="block w-full rounded-xl bg-primary px-5 py-2.5 text-center text-sm font-semibold text-on-primary"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
