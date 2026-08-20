"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import Sidebar from "@/components/layout/Sidebar";
import NotificationBell from "@/components/notifications/NotificationBell";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { canAccessRoute } from "@/lib/roles";
import { ShieldX } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

function RoleDenied() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-bg p-6">
      <div className="text-center max-w-md animate-fade-in">
        <div className="w-16 h-16 bg-danger-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldX className="w-8 h-8 text-danger" />
        </div>
        <h1 className="text-2xl font-bold text-fg mb-2">Access Denied</h1>
        <p className="text-muted text-sm mb-6">
          You don&apos;t have permission to access this page. Contact your administrator if you believe this is an error.
        </p>
        <Link href="/dashboard">
          <Button variant="primary">Return to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}

function DashboardGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <LoadingScreen message="Authenticating..." />;
  }

  if (!isAuthenticated) return null;

  if (!canAccessRoute(pathname, user?.role)) {
    return (
      <div className="flex min-h-screen bg-bg">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">
          <RoleDenied />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border/50 bg-surface/80 backdrop-blur-md flex items-center justify-end px-4 sticky top-0 z-30">
          <NotificationBell />
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <SocketProvider>
        <DashboardGuard>{children}</DashboardGuard>
      </SocketProvider>
    </AuthProvider>
  );
}
