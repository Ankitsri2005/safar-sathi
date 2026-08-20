"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: "📊" },
  { href: "/tracking", label: "Live Tracking", icon: "📍" },
  { href: "/heatmap", label: "Heatmap", icon: "🗺️" },
  { href: "/alerts", label: "Alerts", icon: "🚨" },
  { href: "/digital-ids", label: "Digital IDs", icon: "🪪" },
  { href: "/efirs", label: "E-FIRs", icon: "📋" },
  { href: "/zones", label: "Zones", icon: "⬡" },
  { href: "/users", label: "Users", icon: "👥" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4">
      <div className="mb-8">
        <h2 className="text-lg font-bold">Dashboard</h2>
        <p className="text-xs text-gray-400 mt-1">
          {user?.jurisdiction} Division
        </p>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          if (item.href === "/users" && user?.role !== "admin") return null;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
