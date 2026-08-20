"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import Footer from "@/components/layout/Footer";
import {
  lookupDigitalId,
  maskName,
  type MockDigitalId,
} from "@/lib/mock-data";
import { IdStatus } from "@/types";
import {
  Shield,
  ShieldCheck,
  ShieldX,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Camera,
  Search,
  Hash,
  Calendar,
  User,
  Eye,
  EyeOff,
  ScanLine,
  ArrowRight,
  Info,
  Lock,
} from "lucide-react";

type VerificationResult =
  | { found: true; digitalId: MockDigitalId }
  | { found: false; reason: "not_found" | "invalid_format" };

export default function VerifyPage() {
  const [touristId, setTouristId] = useState("");
  const [blockId, setBlockId] = useState("");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanMode, setScanMode] = useState<"manual" | "qr">("manual");
  const [qrInput, setQrInput] = useState("");
  const [showFullId, setShowFullId] = useState(false);
  const qrInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scanMode === "qr" && qrInputRef.current) {
      qrInputRef.current.focus();
    }
  }, [scanMode]);

  const handleVerify = useCallback(() => {
    setError("");
    setResult(null);

    if (scanMode === "qr") {
      if (!qrInput.trim()) {
        setError("Please scan or paste a QR code value");
        return;
      }
      try {
        const parsed = JSON.parse(qrInput.trim());
        if (!parsed.tourist_id) {
          setError("Invalid QR code format — missing tourist ID");
          return;
        }
        setLoading(true);
        setTimeout(() => {
          const found = lookupDigitalId(parsed.tourist_id, parsed.block_id);
          setResult(found ? { found: true, digitalId: found } : { found: false, reason: "not_found" });
          setLoading(false);
        }, 600);
      } catch {
        // Try as raw tourist ID
        setLoading(true);
        setTimeout(() => {
          const found = lookupDigitalId(qrInput.trim());
          setResult(found ? { found: true, digitalId: found } : { found: false, reason: "not_found" });
          setLoading(false);
        }, 600);
      }
      return;
    }

    // Manual mode
    if (!touristId.trim()) {
      setError("Please enter a Tourist ID");
      return;
    }
    if (touristId.trim().length < 5) {
      setResult({ found: false, reason: "invalid_format" });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const found = lookupDigitalId(touristId.trim(), blockId.trim() || undefined);
      setResult(found ? { found: true, digitalId: found } : { found: false, reason: "not_found" });
      setLoading(false);
    }, 600);
  }, [touristId, blockId, qrInput, scanMode]);

  const reset = () => {
    setResult(null);
    setError("");
    setTouristId("");
    setBlockId("");
    setQrInput("");
  };

  const statusConfig: Record<
    IdStatus,
    {
      icon: typeof ShieldCheck;
      label: string;
      variant: "success" | "warning" | "danger";
      bg: string;
      border: string;
      description: string;
    }
  > = {
    [IdStatus.ACTIVE]: {
      icon: ShieldCheck,
      label: "Verified — Active",
      variant: "success",
      bg: "bg-success-50",
      border: "border-success-200",
      description: "This Digital Tourist ID is valid and verified on the blockchain ledger.",
    },
    [IdStatus.EXPIRED]: {
      icon: Clock,
      label: "Expired",
      variant: "warning",
      bg: "bg-warning-50",
      border: "border-warning-200",
      description: "This Digital Tourist ID has expired. The trip period has ended.",
    },
    [IdStatus.REVOKED]: {
      icon: ShieldX,
      label: "Revoked",
      variant: "danger",
      bg: "bg-danger-50",
      border: "border-danger-200",
      description: "This Digital Tourist ID has been revoked. Do not accept as valid identification.",
    },
  };

  return (
    <div className="min-h-screen bg-bg pt-24 pb-12">
      <div className="max-w-lg mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-fg">Verify Tourist ID</h1>
          <p className="text-muted mt-2 text-sm">
            Scan QR code or enter details to verify a blockchain-secured Digital Tourist ID
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6 animate-fade-in-up">
          <button
            onClick={() => { setScanMode("manual"); reset(); }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              scanMode === "manual"
                ? "bg-primary text-white shadow-md"
                : "bg-white border border-border text-muted hover:border-primary/50"
            }`}
          >
            <Hash className="w-4 h-4" />
            Manual Entry
          </button>
          <button
            onClick={() => { setScanMode("qr"); reset(); }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              scanMode === "qr"
                ? "bg-primary text-white shadow-md"
                : "bg-white border border-border text-muted hover:border-primary/50"
            }`}
          >
            <ScanLine className="w-4 h-4" />
            QR Scanner
          </button>
        </div>

        {/* Input Section */}
        {!result && (
          <Card variant="elevated" className="animate-fade-in-up">
            {scanMode === "qr" ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-fg">Scan QR Code</h2>
                    <p className="text-xs text-muted">Point your camera at the Digital ID QR code</p>
                  </div>
                </div>

                {/* Camera Preview Placeholder */}
                <div className="relative w-full aspect-square max-w-[280px] mx-auto rounded-2xl bg-surface overflow-hidden border-2 border-dashed border-border">
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-48 h-48 border-2 border-primary/40 rounded-xl relative">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-xl" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ScanLine className="w-16 h-16 text-primary/30" />
                      </div>
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary/40 animate-pulse" />
                    </div>
                    <p className="text-xs text-muted mt-4">Camera access required for QR scanning</p>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-muted">or paste QR data manually</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-fg mb-1">QR Code Data</label>
                  <textarea
                    ref={qrInputRef as any}
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all font-mono resize-none"
                    placeholder='{"tourist_id":"TST-...","block_id":"BLK-..."}'
                    rows={3}
                  />
                  <p className="text-xs text-muted mt-1.5 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Paste the JSON data from the QR code, or type a Tourist ID directly
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                    <Search className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-fg">Manual Lookup</h2>
                    <p className="text-xs text-muted">Enter the Tourist ID from the Digital ID card</p>
                  </div>
                </div>

                <Input
                  label="Tourist ID"
                  placeholder="e.g. TST-A1B2C3D4-E5F6"
                  icon={<Hash className="w-4 h-4" />}
                  value={touristId}
                  onChange={(e) => setTouristId(e.target.value)}
                  className="font-mono"
                />
                <Input
                  label="Block ID (optional)"
                  placeholder="e.g. BLK-9F8E7D6C-5A4B"
                  icon={<Hash className="w-4 h-4" />}
                  value={blockId}
                  onChange={(e) => setBlockId(e.target.value)}
                  className="font-mono"
                />
              </div>
            )}

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
              onClick={handleVerify}
              className="w-full mt-5"
              icon={<ShieldCheck className="w-4 h-4" />}
            >
              Verify Identity
            </Button>

            {/* Sample IDs */}
            <div className="mt-4 p-3 rounded-xl bg-bg border border-border">
              <p className="text-xs text-muted font-medium mb-2">Sample IDs to test:</p>
              <div className="space-y-1">
                {[
                  { id: "TST-A1B2C3D4-E5F6", label: "Active ID" },
                  { id: "TST-D1E2F3G4-H5I6", label: "Expired ID" },
                  { id: "TST-X5Y6Z7A8-B9C0", label: "Revoked ID" },
                  { id: "TST-INVALID-0000", label: "Invalid ID" },
                ].map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => {
                      setTouristId(sample.id);
                      setBlockId("");
                      setScanMode("manual");
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs hover:bg-surface-light/10 transition-colors group"
                  >
                    <span className="font-mono text-fg">{sample.id}</span>
                    <span className="text-muted group-hover:text-primary transition-colors flex items-center gap-1">
                      {sample.label}
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Verification Result */}
        {result && (
          <div className="space-y-4 animate-bounce-in">
            {result.found ? (
              <>
                {/* Status Card */}
                <Card variant="elevated" className={`border-2 ${statusConfig[result.digitalId.status].border} ${statusConfig[result.digitalId.status].bg}`}>
                  <div className="text-center">
                    {(() => {
                      const cfg = statusConfig[result.digitalId.status];
                      const Icon = cfg.icon;
                      return (
                        <>
                          <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                            cfg.variant === "success" ? "bg-success" : cfg.variant === "warning" ? "bg-warning" : "bg-danger"
                          }`}>
                            <Icon className="w-8 h-8 text-white" />
                          </div>
                          <Badge variant={cfg.variant} size="md" pulse={result.digitalId.status === IdStatus.ACTIVE}>
                            {cfg.label}
                          </Badge>
                          <p className="text-sm text-muted mt-3 max-w-xs mx-auto">{cfg.description}</p>
                        </>
                      );
                    })()}
                  </div>
                </Card>

                {/* Tourist Info — Masked for Public */}
                <Card variant="elevated">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-fg">Tourist Information</h3>
                    <Badge variant="outline" size="sm" icon={<Lock className="w-3 h-3" />}>
                      Public View
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-xs text-muted">Name</span>
                      <span className="text-sm font-medium text-fg">{maskName(result.digitalId.tourist_name)}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-xs text-muted">Tourist ID</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-fg">
                          {showFullId ? result.digitalId.tourist_id : result.digitalId.tourist_id.slice(0, 8) + "••••••"}
                        </span>
                        <button
                          onClick={() => setShowFullId(!showFullId)}
                          className="text-muted hover:text-fg transition-colors"
                        >
                          {showFullId ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-xs text-muted">ID Type</span>
                      <span className="text-sm text-fg">{result.digitalId.id_type}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-xs text-muted">Block ID</span>
                      <span className="text-xs font-mono text-fg">{result.digitalId.block_id}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-xs text-muted">Trip Period</span>
                      <span className="text-sm text-fg">
                        {new Date(result.digitalId.trip_start).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        {" — "}
                        {new Date(result.digitalId.trip_end).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-xs text-muted">Issued</span>
                      <span className="text-sm text-fg">
                        {new Date(result.digitalId.issued_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>

                  {/* Restricted Info Notice */}
                  <div className="mt-4 p-3 rounded-xl bg-warning-50 border border-warning-200">
                    <div className="flex items-start gap-2">
                      <Lock className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-warning-dark">Restricted Information</p>
                        <p className="text-xs text-warning-dark/70 mt-0.5">
                          Full KYC details, emergency contacts, and phone numbers are restricted to authorized personnel only.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Blockchain Verification */}
                <Card variant="elevated" padding="sm">
                  <div className="flex items-center gap-3 p-2">
                    <div className="w-8 h-8 rounded-lg bg-success-100 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4 text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-fg">Blockchain Verified</p>
                      <p className="text-[10px] text-muted font-mono truncate">Block #{result.digitalId.block_id}</p>
                    </div>
                    <Badge variant="success" size="sm">Intact</Badge>
                  </div>
                </Card>
              </>
            ) : (
              /* Invalid / Not Found */
              <Card variant="elevated" className="border-2 border-danger-200 bg-danger-50">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-danger mx-auto mb-4 flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-white" />
                  </div>
                  <Badge variant="danger" size="md">
                    {result.reason === "invalid_format" ? "Invalid Format" : "ID Not Found"}
                  </Badge>
                  <p className="text-sm text-muted mt-3 max-w-xs mx-auto">
                    {result.reason === "invalid_format"
                      ? "The Tourist ID format is invalid. Please check and try again."
                      : "No Digital Tourist ID matches the provided input. The ID may not exist or has been deleted."}
                  </p>
                </div>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={reset}>
                Verify Another
              </Button>
              <Link href="/" className="flex-1">
                <Button variant="primary" className="w-full">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 animate-fade-in">
          <Card variant="glass" className="p-5">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-fg mb-1">How Verification Works</h3>
                <ul className="text-xs text-muted space-y-1.5">
                  <li>• The QR code contains only Tourist ID and Block ID — no personal data</li>
                  <li>• Verification checks the blockchain ledger for authenticity</li>
                  <li>• Public verification shows limited (masked) information only</li>
                  <li>• Full details require authority authentication</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
