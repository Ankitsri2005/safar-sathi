"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import {
  Efir, EfirStatus, EfirStatusColors, EfirStatusLabel,
} from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableSkeleton,
} from "@/components/ui/Table";
import { cn } from "@/utils/cn";
import {
  Download, FileText, Plus, Search, Filter, ChevronLeft, ChevronRight,
  Eye, Trash2, CheckCircle, XCircle, ArrowUpRight, MapPin, Clock,
  User, AlertTriangle, Shield, Hash, Lock,
} from "lucide-react";

export default function EfirsPage() {
  const [efirs, setEfirs] = useState<Efir[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedEfir, setSelectedEfir] = useState<Efir | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState("");
  const [genDescription, setGenDescription] = useState("");
  const [generating, setGenerating] = useState(false);
  const limit = 15;

  const fetchEfirs = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page: String(page), limit: String(limit) };
      if (statusFilter !== "all") params.status = statusFilter;
      if (search) params.search = search;
      const r = await api.get("/efirs", { params });
      setEfirs(r.data.data);
      setTotal(r.data.total);
    } catch {}
    setLoading(false);
  }, [page, statusFilter, search]);

  useEffect(() => { fetchEfirs(); }, [fetchEfirs]);

  const fetchEfirDetail = async (id: string) => {
    try {
      const r = await api.get(`/efirs/${id}`);
      setSelectedEfir(r.data);
    } catch {}
  };

  const fetchAlerts = async () => {
    try {
      const r = await api.get("/alerts?limit=50");
      setAlerts(r.data.data || []);
    } catch {}
  };

  const handleGenerate = async () => {
    if (!selectedAlertId) return;
    setGenerating(true);
    try {
      const r = await api.post(`/efirs/generate/${selectedAlertId}`, {
        incident_description: genDescription,
      });
      setShowGenerateModal(false);
      setSelectedAlertId("");
      setGenDescription("");
      fetchEfirs();
      setSelectedEfir(r.data.efir);
    } catch {}
    setGenerating(false);
  };

  const handleStatusUpdate = async (id: string, status: EfirStatus) => {
    try {
      await api.patch(`/efirs/${id}`, { status });
      fetchEfirs();
      if (selectedEfir?.id === id) {
        setSelectedEfir({ ...selectedEfir, status });
      }
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this E-FIR permanently?")) return;
    try {
      await api.delete(`/efirs/${id}`);
      fetchEfirs();
      setSelectedEfir(null);
    } catch {}
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="E-FIR Records"
        subtitle="Electronic First Information Reports"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "E-FIRs" }]}
      />

      {/* Top Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[300px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search by E-FIR number, tourist name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { setSearch(searchInput); setPage(1); } }}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface border border-border text-sm text-fg placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl bg-surface border border-border text-sm text-fg"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="generated">Generated</option>
            <option value="filed">Filed</option>
            <option value="closed">Closed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => { setShowGenerateModal(true); fetchAlerts(); }}
          icon={<Plus className="w-4 h-4" />}
        >
          Generate E-FIR
        </Button>
      </div>

      {/* Content: Split view when detail selected */}
      <div className={cn("flex gap-6", selectedEfir && "min-h-[500px]")}>
        {/* Table */}
        <div className={cn("flex-1 min-w-0", selectedEfir && "max-w-[55%]")}>
          <Card variant="elevated" padding="none">
            {loading ? (
              <TableSkeleton rows={5} cols={5} />
            ) : efirs.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="w-12 h-12 text-muted/20 mx-auto mb-3" />
                <p className="text-sm text-muted">No E-FIR records found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow hover={false}>
                    <TableHead>E-FIR Number</TableHead>
                    <TableHead>Tourist</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {efirs.map((efir) => (
                    <TableRow
                      key={efir.id}
                      className={cn("cursor-pointer", selectedEfir?.id === efir.id && "bg-primary/5")}
                      onClick={() => fetchEfirDetail(efir.id)}
                    >
                      <TableCell>
                        <span className="font-mono text-xs font-semibold text-primary">{efir.efir_number}</span>
                      </TableCell>
                      <TableCell className="text-sm">{efir.tourist_name}</TableCell>
                      <TableCell>
                        <span className="text-xs capitalize">{(efir.incident_type || efir.alert_type || "").replace(/_/g, " ")}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted">
                        {new Date(efir.created_at).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={(EfirStatusColors[efir.status] as any) || "default"} size="sm">
                          {EfirStatusLabel[efir.status] || efir.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {efir.pdf_url && (
                            <a
                              href={`/api/efirs/${efir.id}/download`}
                              className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => fetchEfirDetail(efir.id)}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-muted transition-colors"
                            title="View details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} icon={<ChevronLeft className="w-4 h-4" />} />
              <span className="text-xs text-muted px-3">Page {page} of {totalPages}</span>
              <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} icon={<ChevronRight className="w-4 h-4" />} />
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedEfir && (
          <div className="w-[45%] shrink-0">
            <EfirDetailPanel
              efir={selectedEfir}
              onClose={() => setSelectedEfir(null)}
              onStatusUpdate={handleStatusUpdate}
              onDelete={handleDelete}
            />
          </div>
        )}
      </div>

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowGenerateModal(false)}>
          <div className="bg-surface-light rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-fg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Generate E-FIR
              </h3>
              <p className="text-xs text-muted mt-1">Select an alert to generate an Electronic First Information Report</p>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto max-h-[50vh]">
              <div>
                <label className="text-xs font-medium text-fg mb-1 block">Linked Alert *</label>
                <select
                  value={selectedAlertId}
                  onChange={(e) => setSelectedAlertId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-bg border border-border text-sm text-fg"
                >
                  <option value="">Select an alert...</option>
                  {alerts.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      [{a.severity?.toUpperCase()}] {a.alert_type?.replace(/_/g, " ")} — {a.tourist_name || a.tourist_id} — {new Date(a.created_at).toLocaleDateString("en-IN")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-fg mb-1 block">Incident Description</label>
                <textarea
                  value={genDescription}
                  onChange={(e) => setGenDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe the incident details..."
                  className="w-full px-3 py-2 rounded-xl bg-bg border border-border text-sm text-fg placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowGenerateModal(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleGenerate} disabled={!selectedAlertId || generating} icon={<FileText className="w-4 h-4" />}>
                {generating ? "Generating..." : "Generate E-FIR"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Detail Panel Component ────────────────────────────────────
function EfirDetailPanel({
  efir,
  onClose,
  onStatusUpdate,
  onDelete,
}: {
  efir: Efir;
  onClose: () => void;
  onStatusUpdate: (id: string, status: EfirStatus) => void;
  onDelete: (id: string) => void;
}) {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-lg overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-fg font-mono">{efir.efir_number}</h3>
            <p className="text-[11px] text-muted mt-0.5">
              Created {new Date(efir.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-muted">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant={(EfirStatusColors[efir.status] as any) || "default"}>
            {EfirStatusLabel[efir.status] || efir.status}
          </Badge>
          {efir.blockchain_hash && (
            <Badge variant="outline" size="sm">
              <Lock className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto max-h-[400px]">
        {/* Incident */}
        <Section title="Incident Details" icon={<AlertTriangle className="w-4 h-4 text-warning" />}>
          <Field label="Type" value={(efir.incident_type || efir.alert_type || "").replace(/_/g, " ")} />
          <Field label="Severity" value={efir.incident_severity || efir.alert_severity} />
          <Field label="Date" value={efir.incident_date ? new Date(efir.incident_date).toLocaleString("en-IN") : "N/A"} />
          <Field label="Location" value={efir.last_known_location_name || efir.alert_location_name || "N/A"} />
          <Field label="Coordinates" value={`${efir.last_known_lat || efir.alert_lat}, ${efir.last_known_lng || efir.alert_lng}`} />
          <Field label="Description" value={efir.incident_description || efir.alert_message || "N/A"} />
        </Section>

        {/* Tourist */}
        <Section title="Tourist Information" icon={<User className="w-4 h-4 text-primary" />}>
          <Field label="Name" value={efir.tourist_name} />
          <Field label="ID Type" value={efir.tourist_id_type} />
          <Field label="ID Number" value={efir.tourist_id_number} />
          <Field label="Phone" value={efir.tourist_phone} />
          <Field label="Emergency Contact" value={`${efir.emergency_contact_name || "N/A"} (${efir.emergency_contact_phone || "N/A"})`} />
        </Section>

        {/* Officer */}
        {efir.officer_name && (
          <Section title="Filing Officer" icon={<Shield className="w-4 h-4 text-success" />}>
            <Field label="Name" value={efir.officer_name} />
            <Field label="Role" value={(efir.officer_role || "").replace(/_/g, " ")} />
            <Field label="Jurisdiction" value={efir.officer_jurisdiction || "N/A"} />
          </Section>
        )}

        {/* Verification */}
        <Section title="Verification" icon={<Lock className="w-4 h-4 text-accent" />}>
          <Field label="Resolution" value={(efir.resolution_status || "pending").replace(/_/g, " ")} />
          <Field label="Verification" value={efir.verification_status || "pending"} />
          {efir.blockchain_hash && (
            <Field label="Blockchain Hash" value={efir.blockchain_hash} />
          )}
        </Section>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border flex items-center gap-2 flex-wrap">
        {efir.pdf_url && (
          <a
            href={`${API_BASE}${efir.pdf_url}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="primary" size="sm" icon={<Download className="w-3.5 h-3.5" />}>
              Download PDF
            </Button>
          </a>
        )}
        {efir.status === EfirStatus.GENERATED && (
          <Button variant="accent" size="sm" onClick={() => onStatusUpdate(efir.id, EfirStatus.FILED)} icon={<CheckCircle className="w-3.5 h-3.5" />}>
            Mark Filed
          </Button>
        )}
        {(efir.status === EfirStatus.GENERATED || efir.status === EfirStatus.FILED) && (
          <Button variant="secondary" size="sm" onClick={() => onStatusUpdate(efir.id, EfirStatus.CLOSED)} icon={<CheckCircle className="w-3.5 h-3.5" />}>
            Close
          </Button>
        )}
        {efir.status !== EfirStatus.CANCELLED && efir.status !== EfirStatus.CLOSED && (
          <Button variant="danger" size="sm" onClick={() => onStatusUpdate(efir.id, EfirStatus.CANCELLED)} icon={<XCircle className="w-3.5 h-3.5" />}>
            Cancel
          </Button>
        )}
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={() => onDelete(efir.id)} icon={<Trash2 className="w-3.5 h-3.5" />} className="text-danger hover:text-danger">
          Delete
        </Button>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-semibold text-fg flex items-center gap-1.5 uppercase tracking-wide">
        {icon}
        {title}
      </h4>
      <div className="space-y-1 pl-5">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 text-xs">
      <span className="text-muted w-24 shrink-0">{label}</span>
      <span className="text-fg break-words">{value || "N/A"}</span>
    </div>
  );
}
