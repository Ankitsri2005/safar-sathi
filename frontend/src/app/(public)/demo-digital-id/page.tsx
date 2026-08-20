"use client";

import { useState } from "react";
import Link from "next/link";
import { DigitalIdCard, type DigitalIdData } from "@/components/digital-id/DigitalIdCard";
import { Button } from "@/components/ui/Button";
import Footer from "@/components/layout/Footer";
import { Sparkles, ArrowLeft, User, Shield, AlertTriangle, Clock } from "lucide-react";

const DEMO_IDS: DigitalIdData[] = [
  {
    tourist_id: "TST-DEMO-A1B2C3D4",
    full_name: "Priya Sharma",
    photo_url: null,
    trip_start: "2026-08-15",
    trip_end: "2026-08-25",
    block_id: "BLK-DEMO-9F8E7D6C",
    status: "active",
    issued_at: "2026-08-15T10:30:00Z",
  },
  {
    tourist_id: "TST-DEMO-E5F6G7H8",
    full_name: "Arjun Patel",
    photo_url: null,
    trip_start: "2026-07-01",
    trip_end: "2026-07-10",
    block_id: "BLK-DEMO-1A2B3C4D",
    status: "expired",
    issued_at: "2026-07-01T08:00:00Z",
  },
  {
    tourist_id: "TST-DEMO-I9J0K1L2",
    full_name: "Mei Lin Wong",
    photo_url: null,
    trip_start: "2026-08-20",
    trip_end: "2026-09-01",
    block_id: "BLK-DEMO-5E6F7A8B",
    status: "pending",
    issued_at: "2026-08-20T14:15:00Z",
  },
];

const statusConfig: Record<string, { label: string; icon: typeof User; color: string; bg: string }> = {
  active: { label: "Demo — Active", icon: Shield, color: "text-success", bg: "bg-success-50 border-success-200" },
  expired: { label: "Demo — Expired", icon: AlertTriangle, color: "text-danger", bg: "bg-danger-50 border-danger-200" },
  pending: { label: "Demo — Pending", icon: Clock, color: "text-warning", bg: "bg-warning-50 border-warning-200" },
};

export default function DemoDigitalIdPage() {
  const [selected, setSelected] = useState(0);
  const demo = DEMO_IDS[selected];

  return (
    <div className="min-h-screen bg-bg pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-6 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-100 text-accent text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Frontend Demo Mode
          </div>
          <h1 className="text-3xl font-bold text-fg">
            Demo Digital <span className="gradient-text">ID</span>
          </h1>
          <p className="text-muted mt-2 text-sm max-w-md mx-auto">
            Preview how the Digital Tourist ID card looks. These are sample IDs with mock data.
          </p>
        </div>

        {/* Status Selector */}
        <div className="flex gap-3 mb-6 animate-fade-in-up overflow-x-auto pb-2">
          {DEMO_IDS.map((id, i) => {
            const cfg = statusConfig[id.status];
            const Icon = cfg.icon;
            return (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all shrink-0 ${
                  selected === i
                    ? `${cfg.bg} ${cfg.color} shadow-md`
                    : "bg-white border-border text-muted hover:border-primary/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Demo Notice */}
        <div className="mb-6 p-3 rounded-xl bg-warning-50 border border-warning-200 flex items-start gap-2 animate-fade-in">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-warning-dark">Demo Digital ID — Not Official</p>
            <p className="text-xs text-warning-dark/70 mt-0.5">
              This is a sample ID for demonstration purposes only. In production, the status will show
              the real ledger-verification status after backend connection.
            </p>
          </div>
        </div>

        {/* Digital ID Card */}
        <div className="animate-bounce-in">
          <DigitalIdCard key={selected} data={demo} showActions />
        </div>

        {/* Back Link */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 animate-fade-in">
          <Link href="/digital-id" className="flex-1">
            <Button variant="outline" className="w-full" icon={<ArrowLeft className="w-4 h-4" />}>
              Look Up Real ID
            </Button>
          </Link>
          <Link href="/register" className="flex-1">
            <Button variant="primary" className="w-full" icon={<User className="w-4 h-4" />}>
              Register as Tourist
            </Button>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
