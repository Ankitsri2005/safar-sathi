"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { User, UserRole } from "@/types";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    full_name: "",
    role: "police" as UserRole,
    jurisdiction: "",
  });

  useEffect(() => {
    api.get("/auth/users").then((r) => setUsers(r.data));
  }, []);

  const handleCreate = async () => {
    try {
      await api.post("/auth/register-admin", form);
      const r = await api.get("/auth/users");
      setUsers(r.data);
      setShowForm(false);
      setForm({ username: "", password: "", full_name: "", role: "police", jurisdiction: "" });
    } catch {
      alert("Failed to create user");
    }
  };

  const roleColors: Record<string, string> = {
    police: "bg-blue-100 text-blue-700",
    tourism_dept: "bg-purple-100 text-purple-700",
    admin: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "+ Add User"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h2 className="font-semibold">Create New User</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="police">Police</option>
                <option value="tourism_dept">Tourism Dept</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Jurisdiction</label>
              <input
                value={form.jurisdiction}
                onChange={(e) => setForm({ ...form, jurisdiction: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
          >
            Create User
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Username</th>
              <th className="text-left px-4 py-3 font-medium">Role</th>
              <th className="text-left px-4 py-3 font-medium">Jurisdiction</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{user.full_name}</td>
                <td className="px-4 py-3 font-mono text-xs">{user.username}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[user.role]}`}>
                    {user.role.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{user.jurisdiction}</td>
                <td className="px-4 py-3 text-xs text-green-600">Active</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
