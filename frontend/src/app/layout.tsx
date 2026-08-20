import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Tourist Safety Monitoring & Incident Response System",
  description:
    "A comprehensive system for monitoring tourist safety, managing digital IDs, and responding to incidents using blockchain-secured identity verification.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">{children}</body>
    </html>
  );
}
