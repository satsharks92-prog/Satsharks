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
    <footer className="bg-primary border-t border-accent/30 text-on-primary/80">
      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <div className="flex flex-col items-center justify-between gap-6 border-b border-white/10 pb-8 md:flex-row">
          <Link to="/" className="flex items-center gap-3 group transition-transform duration-300 hover:scale-[1.01]">
            <img
              src={logoAsset.url}
              alt="SAT Sharks"
              className="h-8 w-auto brightness-0 invert opacity-95"
            />
          </Link>
          
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 font-body text-[11px] font-bold uppercase tracking-[0.12em]">
            {links.map((l) => (
              <li key={l.label}>
                <Link 
                  to={l.to} 
                  className="hover:text-accent transition-colors duration-300"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 text-center md:text-left">
          <p className="font-body text-[10px] font-medium tracking-wider text-on-primary/50">
            © {new Date().getFullYear()} SAT Sharks. All rights reserved. Your path to academic triumph.
          </p>
          <p className="font-body text-[10px] font-medium tracking-wider text-on-primary/50">
            Admissions Consulting & SAT Prep Excellence.
          </p>
        </div>
      </div>
    </footer>
  );
}
