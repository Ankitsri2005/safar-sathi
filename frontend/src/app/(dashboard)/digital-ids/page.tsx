"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { DigitalId, IdStatus } from "@/types";

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

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    expired: "bg-gray-100 text-gray-700",
    revoked: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Digital ID Records</h1>

      <div className="flex gap-4 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchIds()}
          placeholder="Search by name or ID number..."
          className="border rounded-lg px-3 py-2 text-sm flex-1 max-w-md"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="revoked">Revoked</option>
        </select>
        <button onClick={fetchIds} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          Search
        </button>
        <span className="text-sm text-gray-500">{total} records</span>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Tourist Name</th>
              <th className="text-left px-4 py-3 font-medium">ID Number</th>
              <th className="text-left px-4 py-3 font-medium">Issued</th>
              <th className="text-left px-4 py-3 font-medium">Expires</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Block ID</th>
            </tr>
          </thead>
          <tbody>
            {ids.map((record) => (
              <tr key={record.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{record.tourist_name || "—"}</td>
                <td className="px-4 py-3 font-mono text-xs">{record.id?.slice(0, 8)}...</td>
                <td className="px-4 py-3 text-xs">{new Date(record.issued_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-xs">{new Date(record.expires_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[record.status]}`}>
                    {record.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">
                  {record.block_id.slice(0, 8)}...
                </td>
              </tr>
            ))}
            {ids.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No digital IDs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-3 py-1 text-sm text-gray-500">Page {page}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page * 20 >= total}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
