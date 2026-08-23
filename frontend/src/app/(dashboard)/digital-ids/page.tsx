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
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableSkeleton } from "@/components/ui/Table";
import { Search } from "lucide-react";

export default function DigitalIdsPage() {
  const [ids, setIds] = useState<DigitalId[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const fetchIds = () => {
    const params: Record<string, string> = { page: String(page), limit: "20" };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    api.get("/digital-ids", { params }).then((r) => {
      setIds(r.data.data);
      setTotal(r.data.total);
    });
  };

  useEffect(() => {
    fetchIds();
  }, [page, statusFilter]);

  const statusVariant: Record<string, "success" | "default" | "danger"> = {
    active: "success",
    expired: "default",
    revoked: "danger",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Digital ID Records"
        subtitle="Manage and verify blockchain-secured tourist identities"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Digital IDs" }]}
      />

      <div className="flex gap-4 items-center flex-wrap">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchIds()}
          placeholder="Search by name or ID number..."
          icon={<Search className="w-4 h-4" />}
          className="flex-1 max-w-md"
        />
        <Select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          options={[
            { value: "", label: "All Status" },
            { value: "active", label: "Active" },
            { value: "expired", label: "Expired" },
            { value: "revoked", label: "Revoked" },
          ]}
          className="w-40"
        />
        <Button variant="primary" size="sm" onClick={fetchIds} icon={<Search className="w-4 h-4" />}>Search</Button>
        <span className="text-sm text-muted">{total} records</span>
      </div>

      <Card variant="elevated" padding="none">
        {ids.length === 0 ? (
          <TableSkeleton rows={5} cols={6} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow hover={false}>
                <TableHead>Tourist Name</TableHead>
                <TableHead>ID Number</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Block ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ids.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.tourist_name || "—"}</TableCell>
                  <TableCell mono>{record.id?.slice(0, 8)}...</TableCell>
                  <TableCell className="text-xs">{new Date(record.issued_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-xs">{new Date(record.expires_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[record.status] || "default"}>
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell mono className="text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-primary/5 text-primary-dark px-1.5 py-0.5 rounded border border-primary/20 text-[11px]">
                        {record.block_id?.slice(0, 8)}...{record.block_id?.slice(-4)}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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
    </div>
  );
}
