import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  Filter,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  UserPlus,
  X,
} from "lucide-react";
import {
  activateCooperative,
  getAllCooperatives,
  registerCooperative,
} from "../../services/cooperativeService";
import { registerCoopAdmin, createUserProfile } from "../../services/userService";

// ─── Constants ───────────────────────────────────────────────────────────────
const COOPERATIVE_TYPES = ["AGRICULTURE", "FINANCIAL", "SERVICE", "TRANSPORT", "ARTISAN"];
const initialFormState = {
  name: "", tinNumber: "", rcaRegistrationNumber: "", category: "", type: "",
  province: "", district: "", sector: "",
  representativeName: "", representativePhone: "",
};
const resetAdminForm = () => ({
  username: "", email: "", phone: "", password: "",
  fullName: "", nationalId: "", address: "", dateOfBirth: "", gender: "",
});

// ─── Palette ─────────────────────────────────────────────────────────────────
const categoryColors = {
  AGRICULTURE: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  FINANCIAL:   { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500" },
  SERVICE:     { bg: "bg-purple-50",  text: "text-purple-700",  dot: "bg-purple-500" },
  TRANSPORT:   { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500" },
  ARTISAN:     { bg: "bg-rose-50",    text: "text-rose-700",    dot: "bg-rose-500" },
};

// ─── Reusable Form Field ─────────────────────────────────────────────────────
const Field = ({ id, label, placeholder, type = "text", required = true, value, onChange }) => (
  <div>
    <label htmlFor={id} className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</label>
    <input
      id={id} name={id} type={type} required={required} value={value} onChange={onChange} placeholder={placeholder}
      className="w-full rounded-xl border border-gray-200/80 bg-gray-50/40 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 shadow-sm transition-all duration-200 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
    />
  </div>
);

const Select = ({ id, label, options, placeholder, value, onChange }) => (
  <div>
    <label htmlFor={id} className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</label>
    <select
      id={id} name={id} required value={value} onChange={onChange}
      className="w-full rounded-xl border border-gray-200/80 bg-gray-50/40 px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition-all duration-200 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
    >
      <option value="" disabled>{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
    </select>
  </div>
);

// ─── Status Badge ────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const u = status?.toUpperCase();
  const cfg = {
    ACTIVE:   { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200/60" },
    INACTIVE: { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500",   border: "border-amber-200/60" },
    PENDING:  { bg: "bg-orange-50",  text: "text-orange-600",  dot: "bg-orange-400",  border: "border-orange-200/60" },
  };
  const s = cfg[u] || { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400", border: "border-gray-200/60" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${s.bg} ${s.text} border ${s.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
};

// ─── Category Badge ──────────────────────────────────────────────────────────
const CategoryBadge = ({ category }) => {
  const c = categoryColors[category?.toUpperCase()] || { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[10px] font-bold ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {category?.replace(/_/g, " ") || "—"}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
const CooperativeManagement = () => {
  const [cooperatives, setCooperatives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [activatingId, setActivatingId] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminFormData, setAdminFormData] = useState(resetAdminForm());
  const [selectedCoopId, setSelectedCoopId] = useState(null);
  const [submittingAdmin, setSubmittingAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("cards"); // "cards" | "table"

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchCooperatives = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await getAllCooperatives();
      const d = res.data;
      setCooperatives(Array.isArray(d) ? d : Array.isArray(d?.content) ? d.content : Array.isArray(d?.data) ? d.data : []);
    } catch {
      setError("Failed to load cooperatives."); setCooperatives([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCooperatives(); }, [fetchCooperatives]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleInputChange = (e) => { const { name, value } = e.target; setFormData(p => ({ ...p, [name]: value })); };
  const handleAdminInputChange = (e) => { const { name, value } = e.target; setAdminFormData(p => ({ ...p, [name]: value })); };

  const handleRegister = async (e) => {
    e.preventDefault(); setSubmitting(true); setError(null); setSuccessMsg(null);
    try {
      await registerCooperative(formData);
      setShowModal(false); setFormData(initialFormState);
      setSuccessMsg("Cooperative registered successfully!");
      await fetchCooperatives(); setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to register cooperative.");
    } finally { setSubmitting(false); }
  };

  const handleActivate = async (id) => {
    setActivatingId(id); setError(null); setSuccessMsg(null);
    try {
      await activateCooperative(id);
      setSuccessMsg("Cooperative activated!"); await fetchCooperatives(); setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to activate cooperative.");
    } finally { setActivatingId(null); }
  };

  const handleOpenAdminModal = (coopId) => {
    setSelectedCoopId(coopId); setAdminFormData(resetAdminForm()); setShowAdminModal(true);
  };

  const handleRegisterAdmin = async (e) => {
    e.preventDefault(); setSubmittingAdmin(true); setError(null); setSuccessMsg(null);
    const { username, email, phone, password, fullName, nationalId, address, dateOfBirth, gender } = adminFormData;
    try {
      const r = await registerCoopAdmin({ username, email, phone, password, cooperativeId: selectedCoopId });
      const uid = r.data?.id || r.data?.user?.id || r.data?.data?.id || r.data?.userId;
      if (!uid) { closeAdminModal(); setError("Account created but no user ID returned."); return; }
      try { await createUserProfile(uid, { fullName, nationalId, address, dateOfBirth, gender }); } catch (pe) {
        closeAdminModal(); setError("Account created but profile failed: " + (pe.response?.data?.message || "")); return;
      }
      closeAdminModal(); setSuccessMsg("Coop Admin created successfully!"); setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to register coop admin.");
    } finally { setSubmittingAdmin(false); }
  };

  const closeAdminModal = () => { setShowAdminModal(false); setAdminFormData(resetAdminForm()); setSelectedCoopId(null); setSubmittingAdmin(false); };

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = cooperatives.filter(c => {
    if (searchTerm) { const t = searchTerm.toLowerCase(); if (!(c.name || "").toLowerCase().includes(t) && !(c.tinNumber || "").toLowerCase().includes(t)) return false; }
    if (categoryFilter !== "ALL" && c.category?.toUpperCase() !== categoryFilter) return false;
    if (statusFilter !== "ALL" && c.status?.toUpperCase() !== statusFilter) return false;
    return true;
  });

  // ── Stats ──────────────────────────────────────────────────────────────────
  const total = cooperatives.length;
  const active = cooperatives.filter(c => c.status?.toUpperCase() === "ACTIVE").length;
  const inactive = total - active;
  const categories = [...new Set(cooperatives.map(c => c.category).filter(Boolean))].length;

  return (
    <div className="stagger-children space-y-5">

      {/* ═══ HERO HEADER ════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-slate-900 via-[#0f1729] to-slate-900 animate-gradient" style={{ backgroundImage: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #134e4a 100%)", backgroundSize: "200% 200%" }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="absolute -top-16 right-10 h-48 w-48 rounded-full bg-indigo-500/20 blur-[60px]" />
        <div className="absolute bottom-0 left-8 h-36 w-36 rounded-full bg-teal-500/15 blur-[50px]" />

        <div className="relative px-7 py-7 sm:px-10 sm:py-9">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] border border-white/[0.08] px-3 py-1.5 mb-3 backdrop-blur-sm">
                <Building2 className="h-3.5 w-3.5 text-indigo-400" />
                <span className="text-[11px] font-semibold text-indigo-300 tracking-wide">Cooperative Management</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Manage Your <span className="bg-gradient-to-r from-teal-300 to-indigo-300 bg-clip-text text-transparent">Cooperatives</span>
              </h1>
              <p className="mt-2 text-sm text-gray-400/90 max-w-md">Register, activate, and assign admins to cooperatives across the platform.</p>
            </div>

            {/* Hero stats + action */}
            <div className="flex items-center gap-3 flex-wrap">
              {[
                { v: total, l: "Total", c: "from-indigo-500 to-indigo-600" },
                { v: active, l: "Active", c: "from-emerald-500 to-emerald-600" },
                { v: categories, l: "Types", c: "from-purple-500 to-purple-600" },
              ].map(p => (
                <div key={p.l} className={`rounded-2xl bg-gradient-to-br ${p.c} px-4 py-3 shadow-lg min-w-[70px] text-center`}>
                  <p className="text-xl font-black text-white">{loading ? "—" : p.v}</p>
                  <p className="text-[9px] font-semibold text-white/60 uppercase tracking-wider">{p.l}</p>
                </div>
              ))}
              <button
                onClick={() => setShowModal(true)}
                className="flex h-[62px] items-center gap-2 rounded-2xl bg-white/10 border border-white/10 px-5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/[0.15] hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4" />
                Register
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ ALERTS ═════════════════════════════════════════════════════ */}
      {successMsg && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200/60 px-5 py-3.5 animate-slide-down">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100"><CheckCircle2 className="h-4 w-4 text-emerald-600" /></div>
          <p className="text-sm font-semibold text-emerald-700">{successMsg}</p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200/60 px-5 py-3.5 animate-slide-down">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-100"><X className="h-4 w-4 text-red-500" /></div>
          <p className="text-sm font-semibold text-red-700 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* ═══ TOOLBAR ════════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
          <input
            type="text" placeholder="Search cooperatives…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-gray-200/80 bg-white/70 backdrop-blur-sm py-2.5 pl-10 pr-4 text-sm shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-2xl border border-gray-200/80 bg-white/70 backdrop-blur-sm px-3 py-2 text-sm">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bg-transparent text-sm font-medium text-gray-600 focus:outline-none cursor-pointer">
              <option value="ALL">All Categories</option>
              {COOPERATIVE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5 rounded-2xl border border-gray-200/80 bg-white/70 backdrop-blur-sm px-3 py-2 text-sm">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-transparent text-sm font-medium text-gray-600 focus:outline-none cursor-pointer">
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <button onClick={fetchCooperatives} disabled={loading} className="flex h-[38px] w-[38px] items-center justify-center rounded-2xl border border-gray-200/80 bg-white/70 backdrop-blur-sm text-gray-400 hover:text-gray-600 hover:bg-white transition-all disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          {/* View toggle */}
          <div className="flex rounded-2xl border border-gray-200/80 bg-white/70 backdrop-blur-sm overflow-hidden">
            <button onClick={() => setViewMode("cards")} className={`px-3 py-2 text-[11px] font-bold transition-all ${viewMode === "cards" ? "bg-indigo-500 text-white" : "text-gray-400 hover:text-gray-600"}`}>Cards</button>
            <button onClick={() => setViewMode("table")} className={`px-3 py-2 text-[11px] font-bold transition-all ${viewMode === "table" ? "bg-indigo-500 text-white" : "text-gray-400 hover:text-gray-600"}`}>Table</button>
          </div>
        </div>
      </div>

      {/* ═══ RESULTS INFO ═══════════════════════════════════════════════ */}
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-medium text-gray-400">
          Showing <span className="font-bold text-gray-700">{filtered.length}</span> of <span className="font-bold text-gray-700">{total}</span> cooperatives
        </p>
      </div>

      {/* ═══ LOADING STATE ══════════════════════════════════════════════ */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-3" />
          <p className="text-sm text-gray-400 font-medium">Loading cooperatives…</p>
        </div>
      )}

      {/* ═══ EMPTY STATE ════════════════════════════════════════════════ */}
      {!loading && cooperatives.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 rounded-[20px] bg-white/70 backdrop-blur-sm border border-white/60">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 mb-4">
            <Building2 className="h-7 w-7 text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-500">No cooperatives yet</p>
          <p className="text-xs text-gray-400 mt-1">Register your first cooperative to get started.</p>
          <button onClick={() => setShowModal(true)} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5 transition-all">
            <Plus className="h-4 w-4" /> Register Cooperative
          </button>
        </div>
      )}

      {/* ═══ NO RESULTS STATE ═══════════════════════════════════════════ */}
      {!loading && cooperatives.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 rounded-[20px] bg-white/70 backdrop-blur-sm border border-white/60">
          <Search className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-500">No cooperatives match</p>
          <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters.</p>
        </div>
      )}

      {/* ═══ CARDS VIEW ═════════════════════════════════════════════════ */}
      {!loading && filtered.length > 0 && viewMode === "cards" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(coop => {
            const isActive = coop.status?.toUpperCase() === "ACTIVE";
            const isInactive = coop.status?.toUpperCase() === "INACTIVE";
            return (
              <div key={coop.id} className="group rounded-[20px] bg-white border border-gray-200/80 p-5 shadow-sm hover:shadow-md hover:border-gray-300/80 hover:-translate-y-0.5 transition-all duration-300 flex flex-col">
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-transform">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <StatusBadge status={coop.status} />
                </div>

                {/* Info */}
                <h3 className="text-[15px] font-bold text-gray-900 mb-1 truncate">{coop.name}</h3>
                <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-3">
                  <span className="font-mono">{coop.tinNumber || "—"}</span>
                  <span>·</span>
                  <CategoryBadge category={coop.category} />
                </div>

                {/* Location */}
                {(coop.province || coop.district || coop.sector) && (
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-4">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{[coop.sector, coop.district, coop.province].filter(Boolean).join(", ")}</span>
                  </div>
                )}

                {/* Spacer */}
                <div className="flex-1" />

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100/80">
                  {isInactive && (
                    <button
                      onClick={() => handleActivate(coop.id)}
                      disabled={activatingId === coop.id}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50"
                    >
                      {activatingId === coop.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      Activate
                    </button>
                  )}
                  {isActive && (
                    <>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 rounded-lg px-2 py-1.5">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </span>
                      <button
                        onClick={() => handleOpenAdminModal(coop.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                      >
                        <UserPlus className="h-3.5 w-3.5" /> Assign Admin
                      </button>
                    </>
                  )}
                  {!isActive && !isInactive && (
                    <span className="text-[11px] text-gray-400 font-medium">No actions available</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ TABLE VIEW ═════════════════════════════════════════════════ */}
      {!loading && filtered.length > 0 && viewMode === "table" && (
        <div className="rounded-[20px] bg-white/70 backdrop-blur-sm border border-white/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100/80">
                  {["Cooperative", "TIN", "Category", "Location", "Status", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(coop => {
                  const isActive = coop.status?.toUpperCase() === "ACTIVE";
                  const isInactive = coop.status?.toUpperCase() === "INACTIVE";
                  return (
                    <tr key={coop.id} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <span className="text-[13px] font-bold text-gray-900">{coop.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[12px] text-gray-500 font-mono whitespace-nowrap">{coop.tinNumber}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap"><CategoryBadge category={coop.category} /></td>
                      <td className="px-5 py-3.5 text-[11px] text-gray-400 whitespace-nowrap">{[coop.district, coop.province].filter(Boolean).join(", ") || "—"}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap"><StatusBadge status={coop.status} /></td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {isInactive && (
                            <button onClick={() => handleActivate(coop.id)} disabled={activatingId === coop.id}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-emerald-600 transition-colors disabled:opacity-50">
                              {activatingId === coop.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />} Activate
                            </button>
                          )}
                          {isActive && (
                            <button onClick={() => handleOpenAdminModal(coop.id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-indigo-500 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-indigo-600 transition-colors">
                              <UserPlus className="h-3 w-3" /> Assign Admin
                            </button>
                          )}
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

      {/* ═══ REGISTER COOPERATIVE MODAL ═════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in" onClick={() => { setShowModal(false); setFormData(initialFormState); setError(null); }}>
          <div className="w-full max-w-2xl rounded-[24px] bg-white shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/20">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900">Register Cooperative</h2>
                  <p className="text-[11px] text-gray-400">Fill in the cooperative details below</p>
                </div>
              </div>
              <button onClick={() => { setShowModal(false); setFormData(initialFormState); setError(null); }} className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleRegister} className="px-7 py-6 max-h-[65vh] overflow-y-auto">
              {/* Section: Basic Info */}
              <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">
                <span className="h-px flex-1 bg-gray-100" /> Basic Information <span className="h-px flex-1 bg-gray-100" />
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
                <Field id="name" label="Cooperative Name" placeholder="e.g. Sunrise Farmers Coop" value={formData.name} onChange={handleInputChange} />
                <Field id="tinNumber" label="TIN Number" placeholder="e.g. 1234567890" value={formData.tinNumber} onChange={handleInputChange} />
                <Field id="rcaRegistrationNumber" label="RCA Registration" placeholder="e.g. RCA-2024-001" value={formData.rcaRegistrationNumber} onChange={handleInputChange} />
                <Select id="category" label="Category" options={COOPERATIVE_TYPES} placeholder="Select category" value={formData.category} onChange={handleInputChange} />
                <Select id="type" label="Type" options={COOPERATIVE_TYPES} placeholder="Select type" value={formData.type} onChange={handleInputChange} />
              </div>

              {/* Section: Location */}
              <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">
                <span className="h-px flex-1 bg-gray-100" /> Location <span className="h-px flex-1 bg-gray-100" />
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
                <Field id="province" label="Province" placeholder="e.g. Kigali" value={formData.province} onChange={handleInputChange} />
                <Field id="district" label="District" placeholder="e.g. Gasabo" value={formData.district} onChange={handleInputChange} />
                <Field id="sector" label="Sector" placeholder="e.g. Remera" value={formData.sector} onChange={handleInputChange} />
              </div>

              {/* Section: Representative */}
              <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">
                <span className="h-px flex-1 bg-gray-100" /> Representative <span className="h-px flex-1 bg-gray-100" />
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-2">
                <Field id="representativeName" label="Name" placeholder="e.g. Jean Bosco" value={formData.representativeName} onChange={handleInputChange} />
                <Field id="representativePhone" label="Phone" placeholder="e.g. 0788123456" type="tel" value={formData.representativePhone} onChange={handleInputChange} />
              </div>

              {/* Actions */}
              <div className="mt-6 flex items-center justify-end gap-3 pt-5 border-t border-gray-100">
                <button type="button" onClick={() => { setShowModal(false); setFormData(initialFormState); setError(null); }}
                  className="rounded-2xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {submitting ? "Registering…" : "Register Cooperative"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ CREATE ADMIN MODAL ═════════════════════════════════════════ */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in" onClick={() => { closeAdminModal(); setError(null); }}>
          <div className="w-full max-w-2xl rounded-[24px] bg-white shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg shadow-teal-500/20">
                  <UserPlus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900">Assign Coop Admin</h2>
                  <p className="text-[11px] text-gray-400">Create an admin account for this cooperative</p>
                </div>
              </div>
              <button onClick={() => { closeAdminModal(); setError(null); }} className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleRegisterAdmin} className="px-7 py-6 max-h-[65vh] overflow-y-auto">
              <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">
                <span className="h-px flex-1 bg-gray-100" /> Account Details <span className="h-px flex-1 bg-gray-100" />
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
                <Field id="username" label="Username" placeholder="e.g. admin_john" value={adminFormData.username} onChange={handleAdminInputChange} />
                <Field id="email" label="Email" type="email" placeholder="e.g. john@coop.rw" value={adminFormData.email} onChange={handleAdminInputChange} />
                <Field id="phone" label="Phone" type="tel" placeholder="e.g. 0788123456" value={adminFormData.phone} onChange={handleAdminInputChange} />
                <Field id="password" label="Password" type="password" placeholder="Secure password" value={adminFormData.password} onChange={handleAdminInputChange} />
              </div>

              <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">
                <span className="h-px flex-1 bg-gray-100" /> Personal Profile <span className="h-px flex-1 bg-gray-100" />
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-2">
                <Field id="fullName" label="Full Name" placeholder="e.g. Jean Bosco Uwimana" value={adminFormData.fullName} onChange={handleAdminInputChange} />
                <Field id="nationalId" label="National ID" placeholder="e.g. 1199880012345678" value={adminFormData.nationalId} onChange={handleAdminInputChange} />
                <Field id="dateOfBirth" label="Date of Birth" type="date" placeholder="" value={adminFormData.dateOfBirth} onChange={handleAdminInputChange} />
                <Select id="gender" label="Gender" options={["MALE", "FEMALE"]} placeholder="Select gender" value={adminFormData.gender} onChange={handleAdminInputChange} />
                <div className="sm:col-span-2">
                  <Field id="address" label="Address" placeholder="e.g. Kigali, Gasabo, Remera" value={adminFormData.address} onChange={handleAdminInputChange} required={false} />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-5 border-t border-gray-100">
                <button type="button" onClick={() => { closeAdminModal(); setError(null); }}
                  className="rounded-2xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={submittingAdmin}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50">
                  {submittingAdmin ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  {submittingAdmin ? "Creating…" : "Create Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CooperativeManagement;

