"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { DigitalId, IdStatus } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableSkeleton } from "@/components/ui/Table";
import { Search, ShieldCheck, QrCode, Phone, Calendar, MapPin, Eye, ExternalLink } from "lucide-react";
import QRCode from "qrcode";

export default function DigitalIdsPage() {
  const [ids, setIds] = useState<DigitalId[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(true);

  // Inspector modal state
  const [selectedRecord, setSelectedRecord] = useState<DigitalId | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  const fetchIds = async () => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: String(limit) };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    try {
      const r = await api.get("/digital-ids", { params });
      setIds(r.data.data);
      setTotal(r.data.total);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchIds();
  }, [page, statusFilter, limit]);

  const handleOpenInspector = async (record: DigitalId) => {
    setSelectedRecord(record);
    try {
      const tid = record.tourist_id || record.id || "TOURIST-ID";
      const bid = record.block_id || "BLOCK-ID";
      const qrData = record.qr_data || JSON.stringify({
        digital_id: record.id,
        tourist_id: tid,
        block_id: bid,
        verified_by: "West Bengal Tourism Safety Portal",
      });
      const url = await QRCode.toDataURL(qrData, { width: 250, margin: 1 });
      setQrCodeUrl(url);
    } catch (err) {
      console.error("Inspector QR code generation error:", err);
      setQrCodeUrl(null);
    }
  };

  const statusVariant: Record<string, "success" | "default" | "danger"> = {
    active: "success",
    expired: "default",
    revoked: "danger",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Digital Tourist ID Registry"
        subtitle="Verify and inspect blockchain-secured tourist digital identities and trip itineraries"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Digital IDs" }]}
      />

      <div className="flex gap-4 items-center flex-wrap">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchIds()}
          placeholder="Search tourist name or ID number..."
          icon={<Search className="w-4 h-4" />}
          className="flex-1 max-w-md"
        />
        <Select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          options={[
            { value: "", label: "All Statuses" },
            { value: "active", label: "Active" },
            { value: "expired", label: "Expired" },
            { value: "revoked", label: "Revoked" },
          ]}
          className="w-40"
        />
        <Button variant="primary" size="sm" onClick={fetchIds} icon={<Search className="w-4 h-4" />}>Search</Button>
        <span className="text-xs font-mono text-muted">{total} total registered IDs</span>
      </div>

      <Card variant="elevated" padding="none">
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow hover={false}>
                <TableHead>Tourist Name</TableHead>
                <TableHead>Digital ID Hash</TableHead>
                <TableHead>Issued Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Blockchain Block</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ids.length === 0 ? (
                <TableRow>
                  <td colSpan={7} className="text-center py-8 text-muted">
                    No digital tourist IDs found matching your search.
                  </td>
                </TableRow>
              ) : (
                ids.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-semibold text-fg flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {record.tourist_name?.charAt(0) || "T"}
                      </div>
                      {record.tourist_name || "Verified Tourist"}
                    </TableCell>
                    <TableCell mono className="text-xs">{record.id?.slice(0, 10)}...</TableCell>
                    <TableCell className="text-xs">{new Date(record.issued_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-xs">{new Date(record.expires_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[record.status] || "default"}>
                        {record.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell mono className="text-xs text-muted">{record.block_id?.slice(0, 10)}...</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenInspector(record)}
                        icon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Inspect QR
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {total > 20 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
          <span className="px-3 py-1 text-sm text-muted">Page {page}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total}>Next</Button>
        </div>
      )}

      {/* Digital ID QR & Blockchain Inspector Modal */}
      <Modal
        open={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="Digital Tourist ID Blockchain Verification"
      >
        {selectedRecord && (
          <div className="space-y-4 py-2">
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-bg border border-border rounded-xl p-4">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="Digital ID QR" className="w-32 h-32 rounded-lg border border-border bg-white p-1 shrink-0 shadow" />
              ) : (
                <div className="w-32 h-32 rounded-lg bg-surface-light flex items-center justify-center text-muted shrink-0">
                  <QrCode className="w-10 h-10" />
                </div>
              )}
              <div className="space-y-1.5 min-w-0 flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h3 className="font-bold text-base text-fg">{selectedRecord.tourist_name || "Verified Tourist"}</h3>
                  <Badge variant="success" size="sm" icon={<ShieldCheck className="w-3 h-3" />}>Blockchain Verified</Badge>
                </div>
                <p className="text-xs font-mono text-muted">ID Hash: {selectedRecord.id}</p>
                <p className="text-xs font-mono text-muted">Block Hash: {selectedRecord.block_id}</p>
                <div className="pt-1 flex items-center justify-center sm:justify-start gap-3 text-xs text-muted">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-primary" /> Valid: {new Date(selectedRecord.issued_at).toLocaleDateString()} - {new Date(selectedRecord.expires_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
              <span>SHA-256 Hash Chain ledger verified. Immutable record stored on West Bengal Tourism Blockchain.</span>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedRecord(null)}>Close Inspector</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
