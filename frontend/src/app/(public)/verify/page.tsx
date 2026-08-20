"use client";

import { useState } from "react";
import api from "@/lib/api";

export default function VerifyPage() {
  const [touristId, setTouristId] = useState("");
  const [blockId, setBlockId] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!touristId || !blockId) {
      setError("Please enter both Tourist ID and Block ID");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await api.get(`/verify-id/${touristId}/${blockId}`);
      setResult(res.data);
    } catch {
      setError("Verification request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-lg mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Verify Tourist ID</h1>
          <p className="text-gray-600 mt-2">Scan QR or enter ID details to verify</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tourist ID
            </label>
            <input
              value={touristId}
              onChange={(e) => setTouristId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
              placeholder="Enter tourist UUID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Block ID
            </label>
            <input
              value={blockId}
              onChange={(e) => setBlockId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
              placeholder="Enter block UUID"
            />
          </div>

          <button
            onClick={handleVerify}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify Identity"}
          </button>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
          )}

          {result && (
            <div className="border rounded-xl p-4 space-y-3">
              <div
                className={`text-center p-3 rounded-lg text-sm font-medium ${
                  result.valid
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {result.valid
                  ? "✅ Blockchain Verified"
                  : "⚠ Verification Failed"}
              </div>

              {result.tourist && (
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-gray-500">Name:</span>{" "}
                    {result.tourist.full_name}
                  </p>
                  <p>
                    <span className="text-gray-500">ID Type:</span>{" "}
                    {result.tourist.id_type}
                  </p>
                </div>
              )}

              <div className="text-xs text-gray-500 space-y-1">
                <p>Chain Integrity: {result.chainIntact ? "✅ Intact" : "❌ Broken"}</p>
                <p>Status: {result.status}</p>
                <p>
                  Expired: {result.expired ? "Yes" : "No"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
