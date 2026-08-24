"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  UserPlus,
  LogIn,
  BadgeCheck,
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
                  Please contact your department system administrator or enter your registered official email.
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
  const [tab, setTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.POLICE);
  const [jurisdiction, setJurisdiction] = useState("Sikkim");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [actionStatus, setActionStatus] = useState<"idle" | "processing" | "success">("idle");
  const { login, register, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setActionStatus("processing");

    try {
      await login(username, password);
      setActionStatus("success");
      setTimeout(() => router.push("/dashboard"), 600);
    } catch (err: any) {
      setActionStatus("idle");
      setError(err.response?.data?.error || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setActionStatus("processing");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      setActionStatus("idle");
      return;
    }

    try {
      await register({
        username: username.trim(),
        password,
        full_name: fullName.trim(),
        role,
        jurisdiction: jurisdiction.trim() || "National",
      });
      setActionStatus("success");
      setTimeout(() => router.push("/dashboard"), 600);
    } catch (err: any) {
      setActionStatus("idle");
      setError(err.response?.data?.error || "Registration failed. Please check the provided information.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (u: string, p: string) => {
    setTab("login");
    setUsername(u);
    setPassword(p);
    setError("");
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
            <p className="text-white/70 text-lg leading-relaxed max-w-md">
              Access the authority command center for real-time tourist monitoring,
              geofence alert response, and digital identity management.
            </p>
            <div className="mt-12 space-y-4">
              {[
                "Real-time tourist location tracking & heatmaps",
                "AI-powered anomaly & deviation detection",
                "Blockchain-secured digital tourist identities",
                "Instant emergency & E-FIR coordination",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-white/60 text-sm">
                  <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                  {item}
                </div>
              ))}
            </div>

            {/* Role Legend */}
            <div className="mt-10 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-white/50 font-semibold mb-3 uppercase tracking-wider">Authorized Roles</p>
              <div className="space-y-2.5">
                {[
                  { role: UserRole.ADMIN, desc: "Manage users, zones, and system settings" },
                  { role: UserRole.POLICE, desc: "Monitor live alerts, respond to incidents, file E-FIRs" },
                  { role: UserRole.TOURISM, desc: "View tourists, safety statistics & analytics" },
                ].map(({ role: r, desc }) => (
                  <div key={r} className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
                    <span className="text-xs text-white/90 font-medium">{ROLE_LABELS[r]}</span>
                    <span className="text-[11px] text-white/40">— {desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="flex-1 flex items-center justify-center p-6 bg-bg overflow-y-auto">
          <div className="w-full max-w-md animate-fade-in-up my-auto py-8">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-fg">Authority Portal</h1>
              <p className="text-muted text-sm mt-1">
                Police / Tourism / Verification Department Access
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex p-1 bg-surface-light/10 border border-border rounded-xl mb-6">
              <button
                type="button"
                onClick={() => { setTab("login"); setError(""); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  tab === "login"
                    ? "bg-primary text-white shadow"
                    : "text-muted hover:text-fg"
                }`}
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setTab("register"); setError(""); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  tab === "register"
                    ? "bg-primary text-white shadow"
                    : "text-muted hover:text-fg"
                }`}
              >
                <UserPlus className="w-4 h-4" />
                Register Authority
              </button>
            </div>

            {/* Status Notifications */}
            {actionStatus === "success" && (
              <div className="mb-4 p-3 rounded-xl bg-success-50 border border-success-200 text-success text-sm flex items-center gap-2 animate-fade-in">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span className="font-medium">
                  {tab === "login" ? "Login successful! Redirecting..." : "Registration successful! Redirecting to dashboard..."}
                </span>
              </div>
            )}

            {actionStatus === "processing" && (
              <div className="mb-4 p-3 rounded-xl bg-primary-50 border border-primary-200 text-primary text-sm flex items-center gap-2 animate-fade-in">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                <span className="font-medium">Authenticating credentials...</span>
              </div>
            )}

            {error && (
              <div className="mb-4 bg-danger-50 border border-danger-200 text-danger p-3 rounded-xl text-sm animate-shake flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* LOGIN FORM */}
            {tab === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-fg">Username or ID</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full border border-border rounded-xl pl-10 pr-4 py-3 text-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all placeholder:text-muted/40"
                      placeholder="e.g. admin, police1, tourism1"
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
                  disabled={actionStatus === "success"}
                  className="w-full mt-6"
                  iconRight={actionStatus === "idle" ? <ArrowRight className="w-4 h-4" /> : undefined}
                >
                  {actionStatus === "success" ? "Authenticated" : "Sign In to Dashboard"}
                </Button>
              </form>
            ) : (
              /* REGISTRATION FORM */
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-fg">Full Name & Title</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full border border-border rounded-xl pl-10 pr-4 py-3 text-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all placeholder:text-muted/40"
                      placeholder="e.g. Officer Karma Bhutia"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-fg">Official Username</label>
                  <div className="relative">
                    <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full border border-border rounded-xl pl-10 pr-4 py-3 text-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all placeholder:text-muted/40"
                      placeholder="e.g. police_east, gangtok_desk"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-fg">Department / Role</label>
                    <div className="relative">
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                        className="w-full border border-border rounded-xl px-3 py-3 text-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                      >
                        <option value={UserRole.POLICE}>Police Officer</option>
                        <option value={UserRole.TOURISM}>Tourism Dept</option>
                        <option value={UserRole.ADMIN}>Administrator</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-fg">Jurisdiction</label>
                    <div className="relative">
                      <input
                        value={jurisdiction}
                        onChange={(e) => setJurisdiction(e.target.value)}
                        className="w-full border border-border rounded-xl px-3 py-3 text-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all placeholder:text-muted/40"
                        placeholder="e.g. Sikkim, Gangtok"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-fg">Set Password (min 6 chars)</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border border-border rounded-xl pl-10 pr-11 py-3 text-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all placeholder:text-muted/40"
                      placeholder="Create secure password"
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
                  disabled={actionStatus === "success"}
                  className="w-full mt-6"
                  iconRight={actionStatus === "idle" ? <ArrowRight className="w-4 h-4" /> : undefined}
                >
                  {actionStatus === "success" ? "Registered" : "Complete Registration"}
                </Button>
              </form>
            )}

            {/* Quick Demo Credentials Fillers */}
            <div className="mt-6 p-4 rounded-xl bg-surface-light/5 border border-border">
              <p className="text-xs text-muted font-medium mb-2.5">Quick Demo Credentials (Click to Fill):</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemo("admin", "admin123")}
                  className="px-2 py-1.5 rounded-lg border border-border/70 hover:border-primary bg-white text-left transition-colors"
                >
                  <p className="text-[11px] font-bold text-fg">Admin</p>
                  <p className="text-[10px] text-muted font-mono">admin / 123</p>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo("police1", "police123")}
                  className="px-2 py-1.5 rounded-lg border border-border/70 hover:border-primary bg-white text-left transition-colors"
                >
                  <p className="text-[11px] font-bold text-fg">Police</p>
                  <p className="text-[10px] text-muted font-mono">police1 / 123</p>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo("tourism1", "tourism123")}
                  className="px-2 py-1.5 rounded-lg border border-border/70 hover:border-primary bg-white text-left transition-colors"
                >
                  <p className="text-[11px] font-bold text-fg">Tourism</p>
                  <p className="text-[10px] text-muted font-mono">tourism1 / 123</p>
                </button>
              </div>
            </div>

            {/* Switch to Tourist Registration */}
            <div className="mt-6 text-center">
              <p className="text-xs text-muted">
                Are you a traveler looking for a Digital Tourist ID?{" "}
                <Link href="/register" className="text-primary font-semibold hover:underline">
                  Register as Tourist
                </Link>
              </p>
            </div>

            <p className="text-center text-xs text-muted mt-4 flex items-center justify-center gap-1.5">
              <Shield className="w-3 h-3 text-primary" />
              Protected by government-grade encryption & audit logging
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
