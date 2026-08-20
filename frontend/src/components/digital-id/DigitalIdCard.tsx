"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import QRCode from "qrcode";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Shield,
  ShieldCheck,
  Download,
  Printer,
  CalendarDays,
  Hash,
  User,
  Camera,
  Clock,
  AlertTriangle,
  ExternalLink,
  Globe,
} from "lucide-react";

export interface DigitalIdData {
  tourist_id: string;
  full_name: string;
  photo_url: string | null;
  trip_start: string;
  trip_end: string;
  block_id: string;
  status: "active" | "expired" | "revoked" | "pending";
  issued_at?: string;
}

interface DigitalIdCardProps {
  data: DigitalIdData;
  showActions?: boolean;
  className?: string;
  compact?: boolean;
}

function maskName(name: string): string {
  if (!name) return "••••••••";
  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    const first = parts[0][0];
    const rest = parts[0].slice(1).replace(/./g, "•");
    return `${first}${rest}`;
  }
  return parts
    .map((p, i) => (i === 0 || i === parts.length - 1 ? p[0] + p.slice(1).replace(/./g, "•") : "•".repeat(p.length)))
    .join(" ");
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "active":
      return <ShieldCheck className="w-4 h-4" />;
    case "pending":
      return <Clock className="w-4 h-4" />;
    case "expired":
      return <AlertTriangle className="w-4 h-4" />;
    case "revoked":
      return <AlertTriangle className="w-4 h-4" />;
    default:
      return <Shield className="w-4 h-4" />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: "success" | "warning" | "danger" | "primary"; label: string }> = {
    active: { variant: "success", label: "Active" },
    pending: { variant: "warning", label: "Pending Verification" },
    expired: { variant: "danger", label: "Expired" },
    revoked: { variant: "danger", label: "Revoked" },
  };
  const c = config[status] || { variant: "primary" as const, label: status };
  return (
    <Badge variant={c.variant} icon={<StatusIcon status={status} />} pulse={status === "active"}>
      {c.label}
    </Badge>
  );
}

export function DigitalIdCard({ data, showActions = true, className, compact = false }: DigitalIdCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const qrPayload = JSON.stringify({
      tourist_id: data.tourist_id,
      block_id: data.block_id,
    });
    QRCode.toDataURL(qrPayload, {
      width: compact ? 120 : 200,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
      errorCorrectionLevel: "M",
    }).then(setQrDataUrl);
  }, [data.tourist_id, data.block_id, compact]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handlePrint = useCallback(() => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const cardHtml = cardRef.current?.innerHTML;
    if (!cardHtml) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Digital Tourist ID - ${data.tourist_id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f8fafc; }
          .print-card { background: white; border: 2px solid #1e40af; border-radius: 16px; padding: 32px; max-width: 420px; width: 100%; }
          .print-header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; }
          .print-header h1 { font-size: 18px; color: #1e40af; font-weight: 700; }
          .print-header p { font-size: 11px; color: #64748b; margin-top: 4px; }
          .print-photo { width: 80px; height: 80px; border-radius: 50%; border: 3px solid #1e40af; margin: 12px auto; object-fit: cover; background: #eff6ff; display: flex; align-items: center; justify-content: center; color: #1e40af; font-size: 32px; }
          .print-name { text-align: center; font-size: 16px; font-weight: 600; color: #0f172a; margin-top: 8px; }
          .print-id { text-align: center; font-family: monospace; font-size: 12px; color: #64748b; margin-top: 4px; }
          .print-details { margin: 20px 0; }
          .print-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
          .print-label { color: #64748b; }
          .print-value { color: #0f172a; font-weight: 500; }
          .print-qr { text-align: center; margin: 20px 0; }
          .print-qr img { width: 140px; height: 140px; }
          .print-footer { text-align: center; font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 16px; }
          .print-status { text-align: center; margin: 12px 0; }
          .print-status span { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; }
          .status-active { background: #dcfce7; color: #16a34a; }
          .status-pending { background: #fef3c7; color: #d97706; }
          .status-expired { background: #fee2e2; color: #dc2626; }
          .status-revoked { background: #fee2e2; color: #dc2626; }
          @media print { body { background: white; } .print-card { border: 2px solid #000; box-shadow: none; } }
        </style>
      </head>
      <body>
        <div class="print-card">
          <div class="print-header">
            <h1>Smart Tourist Safety System</h1>
            <p>Government of Sikkim — Digital Tourist ID</p>
          </div>
          ${data.photo_url
            ? `<img class="print-photo" src="${data.photo_url}" alt="Tourist" />`
            : `<div class="print-photo">👤</div>`
          }
          <div class="print-name">${data.full_name}</div>
          <div class="print-id">${data.tourist_id}</div>
          <div class="print-status">
            <span class="status-${data.status}">${data.status === "pending" ? "Pending Verification" : data.status.charAt(0).toUpperCase() + data.status.slice(1)}</span>
          </div>
          <div class="print-details">
            <div class="print-row"><span class="print-label">Trip Start</span><span class="print-value">${formatDate(data.trip_start)}</span></div>
            <div class="print-row"><span class="print-label">Trip End</span><span class="print-value">${formatDate(data.trip_end)}</span></div>
            <div class="print-row"><span class="print-label">Block ID</span><span class="print-value" style="font-family:monospace;font-size:11px">${data.block_id}</span></div>
          </div>
          <div class="print-qr">${qrDataUrl ? `<img src="${qrDataUrl}" alt="QR Code" />` : ""}</div>
          <div class="print-footer">
            <p>This Digital ID is secured on a blockchain ledger.</p>
            <p>Verify at: verify.touristsafety.gov.in</p>
            <p style="margin-top:4px">Generated: ${new Date().toLocaleDateString("en-IN")}</p>
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  }, [data, qrDataUrl]);

  const handleDownload = useCallback(() => {
    if (!cardRef.current) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const c = ctx;
    const scale = 2;
    const width = 420;
    const height = 640;
    canvas.width = width * scale;
    canvas.height = height * scale;
    c.scale(scale, scale);

    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, width, height);

    c.strokeStyle = "#1e40af";
    c.lineWidth = 2;
    c.beginPath();
    c.roundRect(1, 1, width - 2, height - 2, 16);
    c.stroke();

    c.fillStyle = "#1e40af";
    c.font = "bold 16px Inter, sans-serif";
    c.textAlign = "center";
    c.fillText("Smart Tourist Safety System", width / 2, 40);

    c.fillStyle = "#64748b";
    c.font = "10px Inter, sans-serif";
    c.fillText("Government of Sikkim — Digital Tourist ID", width / 2, 56);

    c.strokeStyle = "#e2e8f0";
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(20, 68);
    c.lineTo(width - 20, 68);
    c.stroke();

    function drawText() {
      c.fillStyle = "#0f172a";
      c.font = "bold 15px Inter, sans-serif";
      c.textAlign = "center";
      c.fillText(data.full_name, width / 2, 172);

      c.fillStyle = "#64748b";
      c.font = "11px monospace";
      c.fillText(data.tourist_id, width / 2, 190);

      const statusColors: Record<string, string> = {
        active: "#16a34a",
        pending: "#d97706",
        expired: "#dc2626",
        revoked: "#dc2626",
      };
      const statusLabels: Record<string, string> = {
        active: "Active",
        pending: "Pending Verification",
        expired: "Expired",
        revoked: "Revoked",
      };
      const sColor = statusColors[data.status] || "#64748b";
      c.fillStyle = sColor + "18";
      const statusText = statusLabels[data.status] || data.status;
      const tw = c.measureText(statusText).width + 24;
      c.beginPath();
      c.roundRect(width / 2 - tw / 2, 200, tw, 24, 12);
      c.fill();
      c.fillStyle = sColor;
      c.font = "bold 11px Inter, sans-serif";
      c.fillText(statusText, width / 2, 216);

      c.strokeStyle = "#e2e8f0";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(30, 240);
      c.lineTo(width - 30, 240);
      c.stroke();

      const details = [
        ["Trip Start", formatDate(data.trip_start)],
        ["Trip End", formatDate(data.trip_end)],
        ["Block ID", data.block_id],
      ];
      let y = 268;
      details.forEach(([label, value]) => {
        c.fillStyle = "#64748b";
        c.font = "11px Inter, sans-serif";
        c.textAlign = "left";
        c.fillText(label, 30, y);
        c.fillStyle = "#0f172a";
        c.font = "500 11px Inter, sans-serif";
        c.textAlign = "right";
        c.fillText(value, width - 30, y);
        y += 28;
      });

      if (qrDataUrl) {
        const qrImg = new Image();
        qrImg.onload = () => {
          c.drawImage(qrImg, width / 2 - 60, y + 5, 120, 120);
          y += 135;

          c.fillStyle = "#64748b";
          c.font = "9px Inter, sans-serif";
          c.textAlign = "center";
          c.fillText("This Digital ID is secured on a blockchain ledger.", width / 2, y + 10);
          c.fillText("Verify at: verify.touristsafety.gov.in", width / 2, y + 24);
          c.fillText(`Generated: ${new Date().toLocaleDateString("en-IN")}`, width / 2, y + 38);

          const link = document.createElement("a");
          link.download = `digital-id-${data.tourist_id}.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
        };
        qrImg.src = qrDataUrl;
      }
    }

    if (data.photo_url) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        c.save();
        c.beginPath();
        c.arc(width / 2, 115, 36, 0, Math.PI * 2);
        c.clip();
        c.drawImage(img, width / 2 - 36, 79, 72, 72);
        c.restore();
        c.strokeStyle = "#1e40af";
        c.lineWidth = 2;
        c.beginPath();
        c.arc(width / 2, 115, 36, 0, Math.PI * 2);
        c.stroke();
        drawText();
      };
      img.src = data.photo_url;
    } else {
      c.fillStyle = "#eff6ff";
      c.beginPath();
      c.arc(width / 2, 115, 36, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#1e40af";
      c.font = "28px sans-serif";
      c.fillText("👤", width / 2, 125);
      drawText();
    }
  }, [data, qrDataUrl]);

  if (compact) {
    return (
      <div ref={cardRef} className={cn("bg-white rounded-xl border border-border overflow-hidden", className)}>
        <div className="flex items-center gap-3 p-4">
          <div className="w-12 h-12 rounded-full bg-primary-50 border-2 border-primary flex items-center justify-center overflow-hidden shrink-0">
            {data.photo_url ? (
              <img src={data.photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-primary" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-fg truncate">{maskName(data.full_name)}</p>
            <p className="text-xs font-mono text-muted truncate">{data.tourist_id}</p>
          </div>
          <StatusBadge status={data.status} />
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-bg/50">
          <div className="flex items-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1">
              <CalendarDays className="w-3 h-3" />
              {formatDate(data.trip_start)} — {formatDate(data.trip_end)}
            </span>
          </div>
          {qrDataUrl && (
            <img src={qrDataUrl} alt="QR" className="w-8 h-8 rounded" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={cardRef} className={cn("bg-white rounded-2xl border-2 border-primary/20 shadow-xl overflow-hidden", className)}>
      {/* Government Header */}
      <div className="bg-gradient-to-r from-primary to-primary-dark px-6 py-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-white" />
          <h2 className="text-base font-bold text-white tracking-wide">SMART TOURIST SAFETY SYSTEM</h2>
        </div>
        <p className="text-xs text-white/70">Government of Sikkim — Digital Tourist Identity</p>
      </div>

      {/* Photo + Name */}
      <div className="flex flex-col items-center pt-6 pb-4">
        <div className="w-24 h-24 rounded-full border-4 border-primary bg-primary-50 flex items-center justify-center overflow-hidden shadow-lg mb-3">
          {data.photo_url ? (
            <img src={data.photo_url} alt={data.full_name} className="w-full h-full object-cover" />
          ) : (
            <Camera className="w-10 h-10 text-primary/40" />
          )}
        </div>
        <h3 className="text-xl font-bold text-fg">{data.full_name}</h3>
        <p className="text-sm font-mono text-muted mt-1 flex items-center gap-1.5">
          <Hash className="w-3.5 h-3.5" />
          {data.tourist_id}
        </p>
        <div className="mt-3">
          <StatusBadge status={data.status} />
        </div>
      </div>

      {/* Divider */}
      <div className="mx-6 border-t border-dashed border-border" />

      {/* Details Grid */}
      <div className="px-6 py-4 grid grid-cols-2 gap-4">
        <div className="space-y-0.5">
          <p className="text-xs text-muted font-medium flex items-center gap-1">
            <CalendarDays className="w-3 h-3" />
            Trip Start
          </p>
          <p className="text-sm font-semibold text-fg">{formatDate(data.trip_start)}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs text-muted font-medium flex items-center gap-1">
            <CalendarDays className="w-3 h-3" />
            Trip End
          </p>
          <p className="text-sm font-semibold text-fg">{formatDate(data.trip_end)}</p>
        </div>
        <div className="col-span-2 space-y-0.5">
          <p className="text-xs text-muted font-medium flex items-center gap-1">
            <Globe className="w-3 h-3" />
            Ledger Block ID
          </p>
          <p className="text-xs font-mono text-fg bg-bg px-3 py-1.5 rounded-lg border border-border inline-block">
            {data.block_id}
          </p>
        </div>
      </div>

      {/* QR Code Section */}
      <div className="mx-6 border-t border-dashed border-border" />
      <div className="px-6 py-5 flex flex-col items-center">
        <p className="text-xs text-muted mb-3 font-medium">Scan to Verify Identity</p>
        {qrDataUrl ? (
          <div className="relative">
            <img
              src={qrDataUrl}
              alt="Digital ID QR Code"
              className="w-40 h-40 rounded-xl border border-border shadow-md"
            />
            <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-success rounded-full flex items-center justify-center shadow-md border-2 border-white">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        ) : (
          <div className="w-40 h-40 rounded-xl border border-border bg-bg flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <p className="text-[10px] text-muted mt-2 text-center max-w-[200px]">
          QR contains only Tourist ID and Block ID — no personal information
        </p>
      </div>

      {/* Blockchain Badge */}
      <div className="mx-6 mb-4">
        <div className="bg-success-50 border border-success-200 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-success">
            <ShieldCheck className="w-4 h-4" />
            Blockchain Secured — Block #{data.block_id?.slice(0, 8)}
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="px-6 pb-6 flex gap-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            icon={<Printer className="w-4 h-4" />}
            onClick={handlePrint}
          >
            Print
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            icon={<Download className="w-4 h-4" />}
            onClick={handleDownload}
          >
            Download
          </Button>
        </div>
      )}

      {/* Footer */}
      <div className="bg-bg/80 border-t border-border px-6 py-3 text-center">
        <p className="text-[10px] text-muted">
          Verify this ID at{" "}
          <span className="font-medium text-primary">verify.touristsafety.gov.in</span>
        </p>
        <p className="text-[10px] text-muted mt-0.5">
          Generated: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>
    </div>
  );
}
