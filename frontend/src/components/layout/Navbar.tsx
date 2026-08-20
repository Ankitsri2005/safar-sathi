"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";
import {
  Shield,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  User,
  ChevronDown,
} from "lucide-react";

const publicLinks = [
  { label: "About", href: "/about" },
  { label: "Digital ID", href: "/digital-id" },
  { label: "My Tracking", href: "/my-tracking" },
  { label: "Safety", href: "/safety" },
  { label: "Emergency", href: "/emergency" },
  { label: "FAQ", href: "/faq" },
];

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isActive = (href: string) => pathname === href;

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "glass shadow-md"
          : "bg-white/60 backdrop-blur-sm"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-md group-hover:shadow-glow transition-shadow">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-fg text-lg tracking-tight">
                Smart Tourist
              </span>
              <span className="text-accent font-bold text-lg"> Safety</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200",
                  isActive(link.href)
                    ? "text-primary bg-primary-50"
                    : "text-muted hover:text-fg hover:bg-surface-light/10"
                )}
              >
                {link.label}
              </Link>
            ))}

            <div className="h-5 w-px bg-border mx-2" />

            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-sm font-medium text-muted hover:text-fg transition-colors px-3 py-2 rounded-lg hover:bg-surface-light/10"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <div className="h-5 w-px bg-border mx-1" />
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-light/5">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-fg leading-tight">{user?.full_name}</p>
                    <p className="text-[10px] text-muted uppercase tracking-wider">{user?.role?.replace("_", " ")}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} icon={<LogOut className="w-3.5 h-3.5" />}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className="text-sm font-medium text-muted hover:text-fg transition-colors px-3 py-2 rounded-lg hover:bg-surface-light/10"
                >
                  Register
                </Link>
                <Button variant="primary" size="sm" onClick={() => router.push("/login")}>
                  Authority Login
                </Button>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-surface-light/10 text-muted"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300",
          mobileOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="glass border-t border-border px-4 py-4 space-y-1">
          {publicLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block text-sm font-medium px-3 py-2.5 rounded-lg transition-colors",
                isActive(link.href)
                  ? "text-primary bg-primary-50"
                  : "text-muted hover:text-fg hover:bg-surface-light/10"
              )}
            >
              {link.label}
            </Link>
          ))}

          <div className="h-px bg-border my-2" />

          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-light/5 mb-1">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-fg">{user?.full_name}</p>
                  <p className="text-xs text-muted">{user?.role?.replace("_", " ")}</p>
                </div>
              </div>
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 text-sm font-medium text-muted hover:text-fg px-3 py-2.5 rounded-lg hover:bg-surface-light/10"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <button
                onClick={() => { handleLogout(); setMobileOpen(false); }}
                className="flex items-center gap-2 text-sm font-medium text-danger px-3 py-2.5 rounded-lg hover:bg-danger-50 w-full"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="block text-sm font-medium text-muted hover:text-fg px-3 py-2.5 rounded-lg hover:bg-surface-light/10"
              >
                Register
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block text-sm font-medium text-white bg-primary px-3 py-2.5 rounded-lg text-center hover:bg-primary-dark"
              >
                Authority Login
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
