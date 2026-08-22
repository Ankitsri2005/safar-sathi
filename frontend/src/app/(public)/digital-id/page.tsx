"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { DigitalIdCard, type DigitalIdData } from "@/components/digital-id/DigitalIdCard";
import Footer from "@/components/layout/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Shield,
  Search,
  Hash,
  User,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Info,
} from "lucide-react";

function DigitalIdContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [touristId, setTouristId] = useState("");
  const [blockId, setBlockId] = useState("");
  const [result, setResult] = useState<DigitalIdData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const executeLookup = async (tid: string, bid: string) => {
    if (!tid.trim()) {
      setError("Please enter a Tourist ID");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await api.get(`/verify-id/${tid.trim()}/${bid.trim() || "latest"}`);
      const d = res.data;
      if (d.status === "not_found" || !d.tourist) {
        setError("Could not find a Digital ID matching your input. Check the IDs and try again.");
        return;
      }
      setResult({
        tourist_id: d.tourist?.id || tid,
        full_name: d.tourist?.full_name || "Tourist",
        photo_url: d.tourist?.photo_url || null,
        trip_start: d.tourist?.trip_start || new Date().toISOString(),
        trip_end: d.tourist?.trip_end || new Date().toISOString(),
        block_id: d.blockId || bid || "N/A",
        status: d.valid ? "active" : d.status === "expired" ? "expired" : "pending",
        issued_at: d.issued_at,
      });
    } catch {
      setError("Could not find a Digital ID matching your input. Check the IDs and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const qId = searchParams.get("id");
    const qBlock = searchParams.get("block");
    if (qId) {
      setTouristId(qId);
      if (qBlock) setBlockId(qBlock);
      executeLookup(qId, qBlock || "latest");
    }
  }, [searchParams]);

  const handleLookup = () => {
    executeLookup(touristId, blockId);
  };

  return (
    <div className="min-h-screen bg-bg pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="relative inline-block mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-fg">
            {t("dig_title")}
          </h1>
          <p className="text-muted mt-2 text-sm max-w-md mx-auto">
            {t("dig_subtitle")}
          </p>
        </div>

        {/* Lookup Form */}
        <Card variant="elevated" className="animate-fade-in-up mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <Search className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-fg">Look Up Your Digital ID</h2>
              <p className="text-xs text-muted">Enter your Tourist ID to view your Digital ID card</p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Tourist ID"
              placeholder="e.g. TST-XXXXXXXX-XXXX"
              icon={<Hash className="w-4 h-4" />}
              value={touristId}
              onChange={(e) => setTouristId(e.target.value)}
              className="font-mono"
            />
            <Input
              label="Block ID (optional)"
              placeholder="e.g. BLK-XXXXXXXX-XXXX"
              icon={<Hash className="w-4 h-4" />}
              value={blockId}
              onChange={(e) => setBlockId(e.target.value)}
              className="font-mono"
            />
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-danger-50 border border-danger-200 text-danger text-sm flex items-center gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            loading={loading}
            onClick={handleLookup}
            className="w-full mt-5"
            icon={<Search className="w-4 h-4" />}
          >
            Look Up Digital ID
          </Button>
        </Card>

        {/* Result */}
        {result && (
          <div className="animate-bounce-in">
            <DigitalIdCard data={result} showActions />
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 space-y-4 animate-fade-in">
          <Card variant="glass" className="p-5">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-fg mb-1">About Your Digital ID</h3>
                <ul className="text-xs text-muted space-y-1.5">
                  <li>Your Digital Tourist ID is secured on a blockchain ledger</li>
                  <li>The QR code contains only your Tourist ID and Block ID — no personal information</li>
                  <li>Authorities can verify your identity by scanning the QR code</li>
                  <li>Print or download your ID for offline access during your trip</li>
                </ul>
              </div>
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/demo-digital-id" className="flex-1">
              <Button variant="accent" className="w-full" icon={<Sparkles className="w-4 h-4" />}>
                View Demo ID
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link href="/register" className="flex-1">
              <Button variant="outline" className="w-full" icon={<User className="w-4 h-4" />}>
                Register Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function DigitalIdPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg pt-24 text-center text-muted">Loading Digital ID...</div>}>
      <DigitalIdContent />
    </Suspense>
  );
}
