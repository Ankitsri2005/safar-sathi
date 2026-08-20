"use client";

import Navbar from "@/components/layout/Navbar";
import { AuthProvider } from "@/contexts/AuthContext";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <Navbar />
      <main className="pt-16">{children}</main>
    </AuthProvider>
  );
}
