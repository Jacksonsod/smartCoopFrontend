import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Filter,
  Loader2,
  Mail,
  Phone,
  Power,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { getAllUsers, toggleUserStatus, deleteUser } from "../../services/userService";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const extractList = (d) => (Array.isArray(d) ? d : Array.isArray(d?.content) ? d.content : Array.isArray(d?.data) ? d.data : []);
const resolveActive = (u) => {
  if (typeof u.enabled === "boolean") return u.enabled;
  if (typeof u.active === "boolean") return u.active;
  if (typeof u.isActive === "boolean") return u.isActive;
  if (typeof u.status === "boolean") return u.status;
  if (typeof u.status === "string") return ["ACTIVE", "TRUE"].includes(u.status.toUpperCase());
  return false;
};

// ─── Palette ─────────────────────────────────────────────────────────────────
const roleColors = {
  SUPER_ADMIN: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  COOP_ADMIN: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  ACCOUNTANT: { bg: "bg-cyan-50", text: "text-cyan-700", dot: "bg-cyan-500" },
  FIELD_OFFICER: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  QUALITY_INSPECTOR: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
  MEMBER: { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400" },
};

const RoleBadge = ({ role }) => {
  const c = roleColors[role?.toUpperCase()] || roleColors.MEMBER;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {role?.replace(/_/g, " ") || "—"}
    </span>
  );
};

const StatusDot = ({ active }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-red-500"}`} />
    {active ? "Active" : "Inactive"}
  </span>
);

const ALL_ROLES = ["SUPER_ADMIN", "COOP_ADMIN", "ACCOUNTANT", "FIELD_OFFICER", "MEMBER"];

// ═══════════════════════════════════════════════════════════════════════════════
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAllUsers();
      setUsers(extractList(res.data));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggle = async (id) => {
    setTogglingId(id);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await toggleUserStatus(id);
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== id) return u;
          if (res?.data?.id) return res.data;
          const was = resolveActive(u);
          return {
            ...u,
            enabled: !was,
            active: !was,
            isActive: !was,
            ...(typeof u.status === "boolean" ? { status: !was } : {}),
            ...(typeof u.status === "string" ? { status: was ? "INACTIVE" : "ACTIVE" } : {}),
          };
        })
      );
      setSuccessMsg("Status updated!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user permanently?")) return;
    setDeletingId(id);
    setError(null);
    setSuccessMsg(null);
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setSuccessMsg("User deleted.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user.");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = users.filter((u) => {
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      if (
        !(
          (u.fullName || u.profile?.fullName || u.username || "").toLowerCase().includes(t) &&
          (u.email || "").toLowerCase().includes(t) &&
          (u.username || "").toLowerCase().includes(t)
        )
      )
        return false;
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
  const roleGroups = {};
  users.forEach((u) => {
    const r = u.role?.toUpperCase() || "OTHER";
    roleGroups[r] = (roleGroups[r] || 0) + 1;
  });

  return (
    <div className="stagger-children space-y-5">
      {/* ═══ HERO ═══════════════════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-slate-900 via-[#0f1729] to-slate-900 animate-gradient"
        style={{
          backgroundImage: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #134e4a 100%)",
          backgroundSize: "200% 200%",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute -top-16 right-10 h-48 w-48 rounded-full bg-purple-500/20 blur-[60px]" />
        <div className="absolute bottom-0 left-8 h-36 w-36 rounded-full bg-teal-500/15 blur-[50px]" />

        <div className="relative px-7 py-7 sm:px-10 sm:py-9">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] border border-white/[0.08] px-3 py-1.5 mb-3 backdrop-blur-sm">
                <Users className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-[11px] font-semibold text-purple-300 tracking-wide">User Management</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                All{" "}
                <span className="bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">
                  Platform Users
                </span>
              </h1>
              <p className="mt-2 text-sm text-gray-400/90 max-w-md">
                View, manage, and control access for every user across the system.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {[
                { v: total, l: "Total", c: "from-indigo-500 to-indigo-600" },
                { v: activeCount, l: "Active", c: "from-emerald-500 to-emerald-600" },
                { v: Object.keys(roleGroups).length, l: "Roles", c: "from-purple-500 to-purple-600" },
              ].map((p) => (
                <div
                  key={p.l}
                  className={`rounded-2xl bg-gradient-to-br ${p.c} px-4 py-3 shadow-lg min-w-[70px] text-center`}
                >
                  <p className="text-xl font-black text-white">{loading ? "—" : p.v}</p>
                  <p className="text-[9px] font-semibold text-white/60 uppercase tracking-wider">{p.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ ALERTS ═════════════════════════════════════════════════════ */}
      {successMsg && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200/60 px-5 py-3.5 animate-slide-down">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold text-emerald-700">{successMsg}</p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200/60 px-5 py-3.5 animate-slide-down">
          <X className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-sm font-semibold text-red-700 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ═══ TOOLBAR ════════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
          <input
            type="text"
            placeholder="Search users…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-gray-200/80 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-2xl border border-gray-200/80 bg-white px-3 py-2 text-sm">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent text-sm font-medium text-gray-600 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5 rounded-2xl border border-gray-200/80 bg-white px-3 py-2 text-sm">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-sm font-medium text-gray-600 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex h-[38px] w-[38px] items-center justify-center rounded-2xl border border-gray-200/80 bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ═══ COUNT ══════════════════════════════════════════════════════ */}
      <p className="text-[12px] font-medium text-gray-400">
        Showing{" "}
        <span className="font-bold text-gray-700">{filtered.length}</span> of{" "}
        <span className="font-bold text-gray-700">{total}</span> users
      </p>

      {/* ═══ LOADING ════════════════════════════════════════════════════ */}
      {loading && (
        <div className="flex flex-col items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-3" />
          <p className="text-sm text-gray-400">Loading users…</p>
        </div>
      )}

      {/* ═══ EMPTY ══════════════════════════════════════════════════════ */}
      {!loading && users.length === 0 && (
        <div className="flex flex-col items-center py-20 rounded-[20px] bg-white border border-gray-200/80">
          <Users className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-500">No users found</p>
        </div>
      )}

      {/* ═══ NO MATCH ═══════════════════════════════════════════════════ */}
      {!loading && users.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center py-16 rounded-[20px] bg-white border border-gray-200/80">
          <Search className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-500">No users match your filters</p>
        </div>
      )}

      {/* ═══ TABLE ══════════════════════════════════════════════════════ */}
      {!loading && filtered.length > 0 && (
        <div className="rounded-[20px] bg-white border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {["User", "Role", "Cooperative", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((u) => {
                  const name = u.fullName || u.profile?.fullName || u.username || "User";
                  const initial = name.charAt(0).toUpperCase();
                  const active = resolveActive(u);
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white text-[11px] font-bold">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold text-gray-900 truncate">{name}</p>
                            <div className="flex items-center gap-2 text-[11px] text-gray-400">
                              {u.email && (
                                <span className="flex items-center gap-1 truncate">
                                  <Mail className="h-3 w-3" />
                                  {u.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-5 py-3.5 text-[12px] text-gray-500 whitespace-nowrap">
                        {u.cooperativeName || u.cooperative?.name || "—"}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <StatusDot active={active} />
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleToggle(u.id)}
                            disabled={togglingId === u.id}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors disabled:opacity-50 ${
                              active
                                ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {togglingId === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Power className="h-3 w-3" />}
                            {active ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => handleDelete(u.id)}
                            disabled={deletingId === u.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-[10px] font-bold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            {deletingId === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

