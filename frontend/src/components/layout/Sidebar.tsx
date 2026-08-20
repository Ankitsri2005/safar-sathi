"use client";

import { useState, createContext, useContext, useRef, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/utils/cn";
import { ROUTE_ACCESS } from "@/lib/roles";
import { ROLE_LABELS, ROLE_COLORS } from "@/types";
import { Badge } from "@/components/ui/Badge";
import {
  LayoutDashboard,
  MapPin,
  Map,
  AlertTriangle,
  CreditCard,
  FileText,
  Hexagon,
  Users,
  ChevronLeft,
  ChevronRight,
  Shield,
  LogOut,
  User,
  ChevronDown,
  Settings,
  ShieldCheck,
  Bell,
  ClipboardList,
} from "lucide-react";

const SidebarContext = createContext({ collapsed: false, setCollapsed: (_v: boolean) => {} });
export const useSidebar = () => useContext(SidebarContext);

const iconMap: Record<string, typeof LayoutDashboard> = {
  "/dashboard": LayoutDashboard,
  "/tracking": MapPin,
  "/heatmap": Map,
  "/alerts": AlertTriangle,
  "/digital-ids": CreditCard,
  "/efirs": FileText,
  "/zones": Hexagon,
  "/users": Users,
  "/notifications": Bell,
  "/audit-logs": ClipboardList,
};

export default function Sidebar({ children }: { children?: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = Object.entries(ROUTE_ACCESS)
    .filter(([, access]) => user?.role && access.roles.includes(user.role))
    .map(([href, access]) => ({
      href,
      label: access.label,
      icon: iconMap[href] || LayoutDashboard,
    }));

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const roleLabel = user?.role ? ROLE_LABELS[user.role] : "Unknown";
  const roleBadgeVariant = user?.role ? ROLE_COLORS[user.role] : "default";

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <aside
        className={cn(
          "relative flex flex-col bg-surface text-white transition-all duration-300 min-h-screen shrink-0",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 h-16 border-b border-white/5">
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shrink-0 shadow-md">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden animate-fade-in">
              <span className="font-bold text-sm tracking-tight whitespace-nowrap">Smart Tourist Safety</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                  isActive
                    ? "bg-primary text-white shadow-md"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent rounded-r-full" />
                )}
                <Icon className={cn("w-5 h-5 shrink-0", isActive && "text-white")} />
                {!collapsed && (
                  <span className="whitespace-nowrap animate-fade-in">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="px-3 pb-4 border-t border-white/5 pt-4" ref={profileRef}>
          {!collapsed ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors animate-fade-in"
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary-light">
                    {user?.full_name?.charAt(0) || "U"}
                  </span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-medium text-white truncate">{user?.full_name}</p>
                  <p className="text-[10px] text-gray-500 truncate">
                    {user?.jurisdiction || "No jurisdiction"}
                  </p>
                </div>
                <ChevronDown className={cn("w-3.5 h-3.5 text-gray-500 transition-transform", profileOpen && "rotate-180")} />
              </button>

              {/* Profile Dropdown */}
              {profileOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-surface-light rounded-xl border border-white/10 shadow-xl overflow-hidden animate-fade-in-down z-50">
                  <div className="p-3 border-b border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary-light">
                          {user?.full_name?.charAt(0) || "U"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
                        <p className="text-xs text-gray-400 truncate">@{user?.username}</p>
                      </div>
                    </div>
                    <Badge variant={roleBadgeVariant as any} size="sm" icon={<ShieldCheck className="w-3 h-3" />}>
                      {roleLabel}
                    </Badge>
                    {user?.jurisdiction && (
                      <p className="text-[10px] text-gray-500 mt-1.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {user.jurisdiction}
                      </p>
                    )}
                  </div>
                  <div className="p-1.5">
                    <button
                      onClick={() => { setProfileOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Account Settings
                    </button>
                    <button
                      onClick={() => { handleLogout(); setProfileOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-danger hover:bg-danger/10 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex justify-center p-2 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-surface-lighter rounded-full border-2 border-border flex items-center justify-center text-gray-400 hover:text-white hover:bg-primary transition-all z-10"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>
    </SidebarContext.Provider>
  );
}
