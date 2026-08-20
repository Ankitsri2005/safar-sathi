"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Efir, EfirStatus } from "@/types";

export default function EfirsPage() {
  const [efirs, setEfirs] = useState<Efir[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchEfirs = () => {
    api.get("/efirs", { params: { page: String(page), limit: "15" } }).then((r) => {
      setEfirs(r.data.data);
      setTotal(r.data.total);
    });
  };

  useEffect(() => {
    fetchEfirs();
  }, [page]);

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    filed: "bg-blue-100 text-blue-700",
    closed: "bg-green-100 text-green-700",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">E-FIR Records</h1>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Tourist</th>
              <th className="text-left px-4 py-3 font-medium">Date Generated</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {efirs.map((efir) => (
              <tr key={efir.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{efir.tourist_name}</td>
                <td className="px-4 py-3 text-xs">{new Date(efir.created_at).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[efir.status]}`}>
                    {efir.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {efir.pdf_url && (
                    <a
                      href={`http://localhost:5000${efir.pdf_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Download PDF
                    </a>
                  )}
                </td>
              </tr>
            ))}
            {efirs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  No E-FIRs generated yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {total > 15 && (
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
            disabled={page * 15 >= total}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
