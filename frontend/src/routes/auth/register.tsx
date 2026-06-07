import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "../../components/layout/Header";
import { Footer } from "../../components/layout/Footer";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";

export const Route = createFileRoute("/auth/register")({
  component: Register,
});

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [region, setRegion] = useState("LOCAL");
  const [subscription, setSubscription] = useState("FREE");
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (email && name && password) {
      const success = await register(name, email, password, region, subscription);
      if (!success) {
        setError("Unable to create this account. Please check your details or try another email.");
        return;
      }

      navigate({ to: "/" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background animate-fade-up">
      <Header />
      <main className="flex-1 flex items-center justify-center p-6 py-12">
        <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-8 shark-shadow border border-outline-variant/40">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-extrabold tracking-[-0.02em]">
              Create an Account
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              Join SAT Sharks and boost your score
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block font-mono text-[12px] uppercase tracking-[0.08em] text-on-surface-variant">
                  Region
                </label>
                <select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none">
                  <option value="LOCAL">Local</option>
                  <option value="INTERNATIONAL">International</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-[12px] uppercase tracking-[0.08em] text-on-surface-variant">
                  Subscription
                </label>
                <select value={subscription} onChange={(e) => setSubscription(e.target.value)} className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none">
                  <option value="FREE">Free</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>
            </div>
            {error && (
              <p className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm font-medium text-error">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full">
              Create Account
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-on-surface-variant">
            Already have an account?{" "}
            <Link to="/auth/login" className="font-semibold text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
