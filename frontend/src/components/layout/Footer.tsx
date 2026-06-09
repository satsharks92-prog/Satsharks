import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/logo.png.asset.json";

export function Footer() {
  const links = [
    { label: "Privacy Policy", to: "/" },
    { label: "Terms of Service", to: "/" },
    { label: "Careers", to: "/" },
    { label: "Contact Us", to: "/contact" },
  ];
  return (
    <footer className="bg-inverse-surface text-inverse-on-surface">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
        <div className="flex items-center gap-3">
          <img
            src={logoAsset.url}
            alt="SAT Sharks"
            className="h-8 w-auto brightness-0 invert opacity-90"
          />
          <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-inverse-on-surface/70">
            © 2024 SAT Sharks. Your path to academic triumph.
          </span>
        </div>
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[12px] uppercase tracking-[0.08em] text-inverse-on-surface/70">
          {links.map((l) => (
            <li key={l.label}>
              <Link to={l.to} className="hover:text-inverse-on-surface transition-colors">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
