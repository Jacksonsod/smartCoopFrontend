import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Filter,
  Loader2,
  Mail,
  Phone,
  Plus,
  Power,
  RefreshCw,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { getMyCoopStaff, createCoopStaff, toggleUserStatus, deleteUser } from "@/services/userService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// ─── Helpers ─────────────────────────────────────────────────────
const extractList = (d) => (Array.isArray(d) ? d : Array.isArray(d?.content) ? d.content : Array.isArray(d?.data) ? d.data : []);
const resolveActive = (u) => {
  if (typeof u.enabled === "boolean") return u.enabled;
  if (typeof u.active === "boolean") return u.active;
  if (typeof u.isActive === "boolean") return u.isActive;
  if (typeof u.status === "boolean") return u.status;
  if (typeof u.status === "string") return u.status.toUpperCase() === "ACTIVE";
  return false;
};

const STAFF_ROLES = ["MEMBER", "FIELD_OFFICER", "ACCOUNTANT", "QUALITY_INSPECTOR"];
const initialForm = { username: "", email: "", phone: "", password: "", role: "" };

const roleColors = {
  COOP_ADMIN: "bg-blue-50 text-blue-700",
  ACCOUNTANT: "bg-cyan-50 text-cyan-700",
  FIELD_OFFICER: "bg-amber-50 text-amber-700",
  QUALITY_INSPECTOR: "bg-rose-50 text-rose-700",
  MEMBER: "bg-gray-100 text-gray-600",
};

// ═══════════════════════════════════════════════════════════════════
const StaffAndUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchStaff = useCallback(async () => {
    setLoading(true); setError(null);
    try { setUsers(extractList((await getMyCoopStaff()).data)); }
    catch { setError("Failed to load staff."); setUsers([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const handleInput = e => { const { name, value } = e.target; setFormData(p => ({ ...p, [name]: value })); };
  const openModal = () => { setFormData(initialForm); setError(null); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setFormData(initialForm); setError(null); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true); setError(null); setSuccessMsg(null);
    try {
      await createCoopStaff({ username: formData.username.trim(), email: formData.email.trim(), phone: formData.phone.trim(), password: formData.password, role: formData.role });
      closeModal(); setSuccessMsg("User created!"); await fetchStaff(); setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) { setError(err.response?.data?.message || "Failed to create user."); }
    finally { setSubmitting(false); }
  };

  const handleToggle = async (id) => {
    setTogglingId(id); setError(null); setSuccessMsg(null);
    try {
      const res = await toggleUserStatus(id);
      setUsers(prev => prev.map(u => {
        if (u.id !== id) return u;
        if (res?.data?.id) return res.data;
        const was = resolveActive(u);
        return { ...u, enabled: !was, active: !was, isActive: !was, ...(typeof u.status === "boolean" ? { status: !was } : {}), ...(typeof u.status === "string" ? { status: was ? "INACTIVE" : "ACTIVE" } : {}) };
      }));
      setSuccessMsg("Status updated!"); setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) { setError(err.response?.data?.message || "Failed to update status."); }
    finally { setTogglingId(null); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user permanently?")) return;
    setDeletingId(id); setError(null); setSuccessMsg(null);
    try {
      await deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      setSuccessMsg("User deleted."); setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) { setError(err.response?.data?.message || "Failed to delete user."); }
    finally { setDeletingId(null); }
  };

  const filtered = users.filter(u => {
    if (searchTerm) { const t = searchTerm.toLowerCase(); if (!(u.fullName || u.profile?.fullName || u.username || "").toLowerCase().includes(t) && !(u.email || "").toLowerCase().includes(t) && !(u.phone || "").toLowerCase().includes(t)) return false; }
    if (roleFilter !== "ALL" && u.role?.toUpperCase() !== roleFilter) return false;
    if (statusFilter !== "ALL") { const a = resolveActive(u); if (statusFilter === "ACTIVE" && !a) return false; if (statusFilter === "INACTIVE" && a) return false; }
    return true;
  });

  const total = users.length;
  const activeCount = users.filter(resolveActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff & Members</h1>
          <p className="text-sm text-gray-500 mt-1">Manage staff, assign roles, and control access. {activeCount} active of {total}.</p>
        </div>
        <Button onClick={openModal} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      {/* Alerts */}
      {successMsg && (
        <Alert className="bg-emerald-50 border-emerald-200 text-emerald-700 animate-slide-down">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{successMsg}</AlertDescription>
        </Alert>
      )}
      {error && !isModalOpen && (
        <Alert variant="destructive" className="animate-slide-down">
          <AlertDescription className="flex items-center justify-between">
            {error}
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
          </AlertDescription>
        </Alert>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search staff…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-sm">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="bg-transparent text-sm focus:outline-none cursor-pointer">
              <option value="ALL">All Roles</option>
              {STAFF_ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
              <option value="COOP_ADMIN">Coop Admin</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-sm">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-transparent text-sm focus:outline-none cursor-pointer">
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <Button variant="outline" size="icon" onClick={fetchStaff} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Showing <span className="font-semibold text-gray-700">{filtered.length}</span> of <span className="font-semibold text-gray-700">{total}</span>
      </p>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mb-2" />
          <p className="text-sm text-gray-400">Loading staff…</p>
        </div>
      )}

      {/* Empty */}
      {!loading && users.length === 0 && (
        <Card className="py-16 text-center">
          <Users className="mx-auto h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-500">No staff yet</p>
          <Button onClick={openModal} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="mr-2 h-4 w-4" /> Add User
          </Button>
        </Card>
      )}

      {/* No match */}
      {!loading && users.length > 0 && filtered.length === 0 && (
        <Card className="py-16 text-center">
          <Search className="mx-auto h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-500">No staff match your filters</p>
        </Card>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  {["User", "Contact", "Role", "Status", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(u => {
                  const name = u.fullName || u.profile?.fullName || u.username || "User";
                  const initial = name.charAt(0).toUpperCase();
                  const active = resolveActive(u);
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-semibold">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                            <p className="text-xs text-gray-400 truncate">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="space-y-0.5">
                          {u.email && <p className="flex items-center gap-1 text-xs text-gray-500"><Mail className="h-3 w-3 text-gray-300" />{u.email}</p>}
                          {u.phone && <p className="flex items-center gap-1 text-xs text-gray-500"><Phone className="h-3 w-3 text-gray-300" />{u.phone}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge className={roleColors[u.role?.toUpperCase()] || roleColors.MEMBER} variant="secondary">
                          {u.role?.replace(/_/g, " ") || "—"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge className={active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"} variant="secondary">
                          {active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => handleToggle(u.id)} disabled={togglingId === u.id}
                            className={`text-xs ${active ? "text-amber-700 border-amber-200 hover:bg-amber-50" : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"}`}>
                            {togglingId === u.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Power className="h-3 w-3 mr-1" />}
                            {active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(u.id)} disabled={deletingId === u.id}
                            className="text-xs text-red-600 border-red-200 hover:bg-red-50">
                            {deletingId === u.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3 w-3 mr-1" />}
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add User Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a staff account for your cooperative</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {error && isModalOpen && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" required placeholder="e.g. john_doe" value={formData.username} onChange={handleInput} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="e.g. john@example.com" value={formData.email} onChange={handleInput} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" required placeholder="e.g. 0788123456" value={formData.phone} onChange={handleInput} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required placeholder="Secure password" value={formData.password} onChange={handleInput} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">Role</Label>
              <select id="role" name="role" required value={formData.role} onChange={handleInput}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="" disabled>Select a role</option>
                {STAFF_ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
              <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitting ? "Creating…" : "Create User"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffAndUsers;
