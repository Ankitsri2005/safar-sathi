"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { User, UserRole } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Plus, Search, Shield, UserCheck, UserX, Key, Edit, X, RefreshCw } from "lucide-react";
import { cn } from "@/utils/cn";

const ROLE_LABELS: Record<string, string> = {
  police: "Police Officer",
  tourism_dept: "Tourism Officer",
  admin: "Administrator",
  verification: "Verification Officer",
};

const ROLE_VARIANTS: Record<string, "primary" | "accent" | "danger" | "success"> = {
  police: "primary",
  tourism_dept: "success",
  admin: "danger",
  verification: "accent",
};

type ModalType = "create" | "edit" | "reset-password" | null;

interface UserFormData {
  username: string;
  password: string;
  full_name: string;
  role: UserRole;
  jurisdiction: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState<ModalType>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormData>({
    username: "", password: "", full_name: "", role: UserRole.POLICE, jurisdiction: "",
  });
  const [resetPw, setResetPw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const limit = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page: String(page), limit: String(limit) };
      if (search) params.search = search;
      if (roleFilter !== "all") params.role = roleFilter;
      if (statusFilter !== "all") params.is_active = statusFilter;
      const r = await api.get("/users", { params });
      setUsers(r.data.data);
      setTotal(r.data.total);
    } catch {}
    setLoading(false);
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const totalPages = Math.ceil(total / limit);

  const openCreate = () => {
    setForm({ username: "", password: "", full_name: "", role: UserRole.POLICE, jurisdiction: "" });
    setSelectedUser(null);
    setModal("create");
  };

  const openEdit = (u: User) => {
    setSelectedUser(u);
    setForm({
      username: u.username, password: "", full_name: u.full_name,
      role: u.role, jurisdiction: u.jurisdiction || "",
    });
    setModal("edit");
  };

  const openResetPw = (u: User) => {
    setSelectedUser(u);
    setResetPw("");
    setModal("reset-password");
  };

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      await api.post("/users", form);
      fetchUsers();
      setModal(null);
    } catch (err: any) {
      alert(err?.response?.data?.error || "Failed to create user");
    }
    setSubmitting(false);
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      await api.put(`/users/${selectedUser.id}`, {
        full_name: form.full_name, role: form.role, jurisdiction: form.jurisdiction,
      });
      fetchUsers();
      setModal(null);
    } catch {
      alert("Failed to update user");
    }
    setSubmitting(false);
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      await api.post(`/users/${selectedUser.id}/reset-password`, { password: resetPw });
      setModal(null);
    } catch (err: any) {
      alert(err?.response?.data?.error || "Failed to reset password");
    }
    setSubmitting(false);
  };

  const handleToggleActive = async (u: User) => {
    try {
      const endpoint = u.is_active ? "disable" : "enable";
      await api.patch(`/users/${u.id}/${endpoint}`);
      fetchUsers();
    } catch {
      alert("Failed to update user status");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="User Management"
        subtitle="Manage authority accounts and access roles"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Users" }]}
        actions={
          <Button variant="primary" onClick={openCreate} icon={<Plus className="w-4 h-4" />}>
            Add User
          </Button>
        }
      />

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search name, username..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setSearch(searchInput); setPage(1); } }}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface border border-border text-sm text-fg placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl bg-surface border border-border text-xs text-fg">
          <option value="all">All Roles</option>
          {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl bg-surface border border-border text-xs text-fg">
          <option value="all">All Status</option>
          <option value="true">Active</option>
          <option value="false">Disabled</option>
        </select>
        <Button variant="ghost" size="sm" onClick={fetchUsers} icon={<RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />}>
          Refresh
        </Button>
      </div>

      <div className="rounded-2xl border border-border/50 bg-surface overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-muted/20 mx-auto mb-3" />
            <p className="text-sm text-muted">No users found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow hover={false}>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Jurisdiction</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium text-fg">{user.full_name}</TableCell>
                  <TableCell mono>{user.username}</TableCell>
                  <TableCell>
                    <Badge variant={ROLE_VARIANTS[user.role] || "default"} size="sm">
                      {ROLE_LABELS[user.role] || user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted">{user.jurisdiction || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? "success" : "danger"} size="sm">
                      {user.is_active ? "Active" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(user)} icon={<Edit className="w-3.5 h-3.5" />} title="Edit" />
                      <Button variant="ghost" size="sm" onClick={() => openResetPw(user)} icon={<Key className="w-3.5 h-3.5" />} title="Reset Password" />
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => handleToggleActive(user)}
                        icon={user.is_active ? <UserX className="w-3.5 h-3.5 text-danger" /> : <UserCheck className="w-3.5 h-3.5 text-success" />}
                        title={user.is_active ? "Disable" : "Enable"}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Prev
          </Button>
          <span className="text-xs text-muted px-3">Page {page} of {totalPages} ({total} users)</span>
          <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Next
          </Button>
        </div>
      )}

      {(modal === "create" || modal === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl border border-border shadow-xl w-full max-w-md mx-4 animate-fade-in-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-fg">{modal === "create" ? "Create New User" : "Edit User"}</h2>
              <Button variant="ghost" size="sm" onClick={() => setModal(null)} icon={<X className="w-4 h-4" />} />
            </div>
            <div className="px-5 py-4 space-y-4">
              <InputField label="Full Name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
              {modal === "create" && <InputField label="Username" value={form.username} onChange={(v) => setForm({ ...form, username: v })} />}
              {modal === "create" && <InputField label="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />}
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 rounded-xl bg-bg border border-border text-sm text-fg focus:outline-none focus:ring-2 focus:ring-primary/30">
                  {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <InputField label="Jurisdiction" value={form.jurisdiction} onChange={(v) => setForm({ ...form, jurisdiction: v })} placeholder="e.g. Gangtok District" />
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
              <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={modal === "create" ? handleCreate : handleUpdate}
                disabled={submitting}
              >
                {modal === "create" ? "Create User" : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {modal === "reset-password" && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl border border-border shadow-xl w-full max-w-sm mx-4 animate-fade-in-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-fg">Reset Password</h2>
              <Button variant="ghost" size="sm" onClick={() => setModal(null)} icon={<X className="w-4 h-4" />} />
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-sm text-muted">Reset password for <span className="font-semibold text-fg">{selectedUser.full_name}</span></p>
              <InputField label="New Password" type="password" value={resetPw} onChange={setResetPw} placeholder="Min 6 characters" />
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
              <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
              <Button
                variant="danger"
                onClick={handleResetPassword}
                disabled={submitting || resetPw.length < 6}
                icon={<Key className="w-4 h-4" />}
              >
                Reset Password
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InputField({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl bg-bg border border-border text-sm text-fg placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}
