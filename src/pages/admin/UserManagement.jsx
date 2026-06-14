import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Filter,
  Loader2,
  Mail,
  Power,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { getAllUsers, toggleUserStatus, deleteUser, updateUser } from "@/services/userService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";

// ─── Helpers ─────────────────────────────────────────────────────
const extractList = (d) => (Array.isArray(d) ? d : Array.isArray(d?.content) ? d.content : Array.isArray(d?.data) ? d.data : []);
const resolveActive = (u) => {
  if (typeof u.enabled === "boolean") return u.enabled;
  if (typeof u.active === "boolean") return u.active;
  if (typeof u.isActive === "boolean") return u.isActive;
  if (typeof u.status === "boolean") return u.status;
  if (typeof u.status === "string") return ["ACTIVE", "TRUE"].includes(u.status.toUpperCase());
  return false;
};

const roleColors = {
  SUPER_ADMIN: "bg-purple-50 text-purple-700",
  COOP_ADMIN: "bg-blue-50 text-blue-700",
  ACCOUNTANT: "bg-cyan-50 text-cyan-700",
  FIELD_OFFICER: "bg-amber-50 text-amber-700",
  QUALITY_INSPECTOR: "bg-rose-50 text-rose-700",
  MEMBER: "bg-gray-100 text-gray-600",
};

const ALL_ROLES = ["SUPER_ADMIN", "COOP_ADMIN", "ACCOUNTANT", "FIELD_OFFICER", "MEMBER"];

// ═══════════════════════════════════════════════════════════════════
const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [editUser, setEditUser] = useState(null); // user object for modal
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', phone: '', username: '', role: '', password: '' });
  const [editLoading, setEditLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError(null);
    try { setUsers(extractList((await getAllUsers()).data)); }
    catch (err) { setError(err.response?.data?.message || "Failed to load users."); setUsers([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

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

  // Open edit modal and populate form
  const handleEditOpen = (user) => {
    setEditUser(user);
    setEditForm({
      firstName: user.firstName || user.profile?.firstName || '',
      lastName: user.lastName || user.profile?.lastName || '',
      email: user.email || '',
      phone: user.phone || user.profile?.phone || '',
      username: user.username || '',
      role: user.role || '',
      password: '', // always blank on open
    });
  };
  // Close edit modal
  const handleEditClose = () => {
    setEditUser(null);
    setEditForm({ firstName: '', lastName: '', email: '', phone: '', username: '', role: '', password: '' });
    setEditLoading(false);
  };
  // Handle edit form change
  const handleEditChange = (e) => {
    setEditForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };
  // Submit edit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setError(null);
    try {
      const payload = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        phone: editForm.phone,
        username: editForm.username,
        role: editForm.role,
        password: editForm.password ? editForm.password : "unchanged",
      };
      await updateUser(editUser.id, payload);
      setSuccessMsg('User updated successfully!');
      fetchUsers();
      handleEditClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user.');
    }
    setEditLoading(false);
  };

  const filtered = users.filter(u => {
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      const name = (u.fullName || u.profile?.fullName || u.username || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      if (!name.includes(t) && !email.includes(t)) return false;
    }
    if (roleFilter !== "ALL" && u.role?.toUpperCase() !== roleFilter) return false;
    if (statusFilter !== "ALL") {
      const a = resolveActive(u);
      if (statusFilter === "ACTIVE" && !a) return false;
      if (statusFilter === "INACTIVE" && a) return false;
    }
    return true;
  });

  const total = users.length;
  const activeCount = users.filter(resolveActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">All Platform Users</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome, {user?.firstName || user?.fullName || user?.username || ""}. View, manage, and control access for every user. {activeCount} active of {total}.</p>
      </div>

      {/* Alerts */}
      {successMsg && (
        <Alert className="bg-emerald-50 border-emerald-200 text-emerald-700 animate-slide-down">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{successMsg}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="animate-slide-down">
          <AlertDescription className="flex items-center justify-between">
            {error}
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
          </AlertDescription>
        </Alert>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search users…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 border border-gray-300 rounded-lg shadow-sm px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2 border border-gray-300 rounded-lg shadow-sm px-4 py-2 text-sm focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="bg-transparent text-sm focus:outline-none cursor-pointer px-2"
            >
              <option value="ALL">All Roles</option>
              {ALL_ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 border border-gray-300 rounded-lg shadow-sm px-4 py-2 text-sm focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-transparent text-sm focus:outline-none cursor-pointer px-2"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <Button variant="outline" size="icon" onClick={fetchUsers} disabled={loading} className="border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500">
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
          <p className="text-sm text-gray-400">Loading users…</p>
        </div>
      )}

      {/* Empty */}
      {!loading && users.length === 0 && (
        <Card className="py-16 text-center">
          <Users className="mx-auto h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-500">No users found</p>
        </Card>
      )}

      {/* No match */}
      {!loading && users.length > 0 && filtered.length === 0 && (
        <Card className="py-16 text-center bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800">
          <Search className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-700 mb-3" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No users match your filters</p>
        </Card>
      )}

      {/* Desktop view Table */}
      {!loading && filtered.length > 0 && (
        <Card className="hidden md:block overflow-hidden border border-gray-150 dark:border-gray-800 shadow-xs rounded-xl bg-white dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
              <thead className="bg-gray-50/75 dark:bg-gray-950/50">
                <tr>
                  {["User", "Role", "Cooperative", "Status", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-550">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-50 dark:divide-gray-800">
                {filtered.map(u => {
                  const name = u.fullName || u.profile?.fullName || u.username || "User";
                  const initial = name.charAt(0).toUpperCase();
                  const active = resolveActive(u);
                  return (
                    <tr key={u.id} className="hover:bg-emerald-50/10 dark:hover:bg-emerald-950/10 transition-colors duration-150">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-semibold shadow-sm">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{name}</p>
                            {u.email && (
                              <p className="flex items-center gap-1 text-[11px] text-gray-450 dark:text-gray-400 truncate">
                                <Mail className="h-3 w-3" />{u.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Badge className={`${roleColors[u.role?.toUpperCase()] || roleColors.MEMBER} font-semibold border-none shadow-none text-[10px] px-2 py-0.5`} variant="secondary">
                          {u.role?.replace(/_/g, " ") || "—"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {u.cooperativeName || u.cooperative?.name || "—"}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Badge className={`${active ? "bg-emerald-50 dark:bg-emerald-955/20 text-emerald-700 dark:text-emerald-400 border-none" : "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-none"} font-semibold shadow-none text-[10px] px-2 py-0.5`} variant="secondary">
                          {active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => handleEditOpen(u)} className="text-[10px] font-semibold h-8 px-2.5 rounded-lg border border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors shadow-none">
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleToggle(u.id)} disabled={togglingId === u.id}
                            className={`text-[10px] font-semibold h-8 px-2.5 rounded-lg border shadow-none transition-colors ${active ? "text-amber-700 border-amber-200 dark:border-amber-900/50 hover:bg-amber-50 dark:hover:bg-amber-955/20" : "text-emerald-700 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-955/20"}`}>
                            {togglingId === u.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Power className="h-3 w-3 mr-1" />}
                            {active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(u.id)} disabled={deletingId === u.id}
                            className="text-[10px] font-semibold h-8 px-2.5 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-955/20 shadow-none transition-colors">
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

      {/* Mobile Card List */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {filtered.map(u => {
            const name = u.fullName || u.profile?.fullName || u.username || "User";
            const initial = name.charAt(0).toUpperCase();
            const active = resolveActive(u);
            return (
              <div key={u.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-150 dark:border-gray-800 p-4 shadow-xs space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-semibold shadow-xs">
                      {initial}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{name}</p>
                      {u.email && (
                        <p className="flex items-center gap-1 text-[11px] text-gray-455 dark:text-gray-400 truncate max-w-[170px]">
                          <Mail className="h-3 w-3" />{u.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge className={`${roleColors[u.role?.toUpperCase()] || roleColors.MEMBER} font-semibold border-none shadow-none text-[9px] px-2 py-0.5`} variant="secondary">
                    {u.role?.replace(/_/g, " ") || "—"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-y border-gray-50 dark:border-gray-800 py-2.5">
                  <div>
                    <span className="text-gray-455 block text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">Cooperative</span>
                    <span className="text-gray-800 dark:text-gray-205 font-medium truncate block max-w-[130px]">
                      {u.cooperativeName || u.cooperative?.name || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-455 block text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">Status</span>
                    <Badge className={`${active ? "bg-emerald-50 dark:bg-emerald-955/20 text-emerald-700 dark:text-emerald-400" : "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400"} font-semibold border-none shadow-none text-[9px] px-2 py-0.5`} variant="secondary">
                      {active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => handleEditOpen(u)} className="text-[10px] font-semibold h-8 px-2.5 rounded-lg border border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors shadow-none">
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleToggle(u.id)} disabled={togglingId === u.id}
                    className={`text-[10px] font-semibold h-8 px-2.5 rounded-lg border shadow-none transition-colors ${active ? "text-amber-700 border-amber-200 dark:border-amber-900/50 hover:bg-amber-50 dark:hover:bg-amber-955/20" : "text-emerald-700 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-955/20"}`}>
                    {togglingId === u.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Power className="h-3 w-3 mr-1" />}
                    {active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(u.id)} disabled={deletingId === u.id}
                    className="text-[10px] font-semibold h-8 px-2.5 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-955/20 shadow-none transition-colors">
                    {deletingId === u.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3 w-3 mr-1" />}
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg w-full max-w-md p-6 relative border border-gray-100 dark:border-gray-800 animate-scale-in">
            <button onClick={handleEditClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-650 dark:hover:text-gray-250 transition-colors">
              <X className="h-4 w-4" />
            </button>
            <h2 className="text-base font-bold text-gray-950 dark:text-white mb-4">Edit User</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">First Name</label>
                <Input name="firstName" value={editForm.firstName} onChange={handleEditChange} required className="dark:bg-gray-950" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Last Name</label>
                <Input name="lastName" value={editForm.lastName} onChange={handleEditChange} required className="dark:bg-gray-950" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Email</label>
                <Input name="email" type="email" value={editForm.email} onChange={handleEditChange} required className="dark:bg-gray-950" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Phone</label>
                <Input name="phone" value={editForm.phone} onChange={handleEditChange} className="dark:bg-gray-950" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Username</label>
                <Input name="username" value={editForm.username} onChange={handleEditChange} required disabled className="dark:bg-gray-950" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Role</label>
                <Input name="role" value={editForm.role} onChange={handleEditChange} required disabled className="dark:bg-gray-950" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Password</label>
                <Input name="password" type="password" value={editForm.password} onChange={handleEditChange} placeholder="Leave blank to keep unchanged" autoComplete="new-password" className="dark:bg-gray-950" />
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <Button type="button" variant="outline" onClick={handleEditClose} className="dark:border-gray-800 dark:hover:bg-gray-800 dark:text-gray-300">Cancel</Button>
                <Button type="submit" disabled={editLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                  {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
