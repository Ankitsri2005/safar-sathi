"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { ROLE_LABELS, UserRole } from "@/types";
import {
  Shield,
  Eye,
  EyeOff,
  Lock,
  User as UserIcon,
  AlertCircle,
  CheckCircle,
  Mail,
  ArrowRight,
  ShieldCheck,
  MapPin,
  X,
} from "lucide-react";

function ForgotPasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 text-muted transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-fg">Reset Password</h2>
          <p className="text-sm text-muted mt-1">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <p className="text-sm font-medium text-fg mb-1">Check your email</p>
            <p className="text-xs text-muted">
              If an account exists with <span className="font-medium">{email}</span>, you&apos;ll receive a password reset link shortly.
            </p>
            <Button variant="outline" size="sm" onClick={onClose} className="mt-4">
              Back to Login
            </Button>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
            <div className="space-y-3 mb-4">
              <label className="block text-sm font-medium text-fg">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-border rounded-xl pl-10 pr-4 py-3 text-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                  placeholder="officer@gov.in"
                  required
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-warning-50 border border-warning-200 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-warning-dark">
                  This is a placeholder. Password reset functionality will be available when the backend is connected.
                </p>
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full">
              Send Reset Link
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [loginStatus, setLoginStatus] = useState<"idle" | "authenticating" | "success">("idle");
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  if (isAuthenticated) {
    router.push("/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setLoginStatus("authenticating");

    try {
      await login(username, password);
      setLoginStatus("success");
      setTimeout(() => router.push("/dashboard"), 600);
    } catch (err: any) {
      setLoginStatus("idle");
      setError(err.response?.data?.error || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ForgotPasswordModal open={showForgot} onClose={() => setShowForgot(false)} />

      <div className="min-h-screen flex">
        {/* Left Decorative Panel */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-surface via-primary-dark to-surface overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />
          </div>
          <div className="relative z-10 flex flex-col justify-center px-16">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mb-8 shadow-xl">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Smart Tourist Safety</h2>
            <p className="text-white/50 text-lg leading-relaxed max-w-md">
              Access the command center for real-time tourist monitoring,
              incident response, and digital identity management.
            </p>
            <div className="mt-12 space-y-4">
              {[
                "Real-time tourist location tracking",
                "AI-powered anomaly detection",
                "Blockchain-secured digital identities",
                "Instant emergency response coordination",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-white/40 text-sm">
                  <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                  {item}
                </div>
              ))}
            </div>

            {/* Role Legend */}
            <div className="mt-10 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-white/40 font-medium mb-3 uppercase tracking-wider">Access Roles</p>
              <div className="space-y-2">
                {[
                  { role: UserRole.ADMIN, desc: "Manage users, zones, and system settings" },
                  { role: UserRole.POLICE, desc: "View and respond to alerts, file E-FIRs" },
                  { role: UserRole.TOURISM, desc: "View tourists, risk info, and analytics" },
                  { role: UserRole.VERIFICATION, desc: "Verify digital identities" },
                ].map(({ role, desc }) => (
                  <div key={role} className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                    <span className="text-xs text-white/70 font-medium">{ROLE_LABELS[role]}</span>
                    <span className="text-[10px] text-white/30">— {desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="flex-1 flex items-center justify-center p-6 bg-bg">
          <div className="w-full max-w-md animate-fade-in-up">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-fg">Authority Login</h1>
              <p className="text-muted text-sm mt-1">
                Police / Tourism / Verification Department Access
              </p>
            </div>

            {/* Login Status */}
            {loginStatus === "success" && (
              <div className="mb-4 p-3 rounded-xl bg-success-50 border border-success-200 text-success text-sm flex items-center gap-2 animate-fade-in">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span className="font-medium">Login successful! Redirecting...</span>
              </div>
            )}

            {loginStatus === "authenticating" && (
              <div className="mb-4 p-3 rounded-xl bg-primary-50 border border-primary-200 text-primary text-sm flex items-center gap-2 animate-fade-in">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                <span className="font-medium">Authenticating...</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-danger-50 border border-danger-200 text-danger p-3 rounded-xl text-sm animate-shake flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-sm font-medium text-fg">Username or Email</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full border border-border rounded-xl pl-10 pr-4 py-3 text-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all placeholder:text-muted/40"
                    placeholder="Enter username or email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-fg">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-xs text-primary hover:text-primary-dark transition-colors font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-border rounded-xl pl-10 pr-11 py-3 text-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all placeholder:text-muted/40"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                disabled={loginStatus === "success"}
                className="w-full mt-6"
                iconRight={loginStatus === "idle" ? <ArrowRight className="w-4 h-4" /> : undefined}
              >
                {loginStatus === "success" ? "Authenticated" : "Sign In"}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 rounded-xl bg-surface-light/5 border border-border">
              <p className="text-xs text-muted font-medium mb-2">Demo Credentials</p>
              <div className="space-y-1.5 text-xs text-muted/70">
                <p><span className="font-mono text-fg">admin</span> / <span className="font-mono text-fg">admin123</span> — Administrator</p>
                <p><span className="font-mono text-fg">police1</span> / <span className="font-mono text-fg">police123</span> — Police Officer</p>
                <p><span className="font-mono text-fg">tourism1</span> / <span className="font-mono text-fg">tourism123</span> — Tourism Officer</p>
              </div>
            </div>

            <p className="text-center text-xs text-muted mt-6 flex items-center justify-center gap-1.5">
              <Shield className="w-3 h-3" />
              Protected by government-grade encryption
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
