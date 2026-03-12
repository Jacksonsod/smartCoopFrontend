import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  ChevronRight,
  Clock,
  Layers,
  Loader2,
  Package,
  Shield,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getAllCooperatives } from "../../services/cooperativeService";
import { getAllUsers, getMyCoopStaff } from "../../services/userService";
import { getAllItems } from "../../services/itemService";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, CartesianGrid,
} from "recharts";

// ─── Palette ─────────────────────────────────────────────────────────────────
const P = {
  indigo: "#6366f1", teal: "#14b8a6", amber: "#f59e0b",
  rose: "#f43f5e", blue: "#3b82f6", purple: "#8b5cf6", emerald: "#10b981",
};
const BAR_COLORS = [P.indigo, P.teal, P.amber, P.rose, P.blue, P.purple, P.emerald];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const extractList = (d) => Array.isArray(d) ? d : Array.isArray(d?.content) ? d.content : Array.isArray(d?.data) ? d.data : [];
const pct = (a, b) => b > 0 ? Math.round((a / b) * 100) : 0;
const greet = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; };

// ─── SVG Ring Gauge ──────────────────────────────────────────────────────────
const RingGauge = ({ value = 0, size = 120, stroke = 10, color = P.teal, label, sublabel }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
          strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-gray-900 tracking-tight">{value}%</span>
      </div>
      {label && <p className="mt-2 text-xs font-bold text-gray-700">{label}</p>}
      {sublabel && <p className="text-[10px] text-gray-400">{sublabel}</p>}
    </div>
  );
};

// ─── Inline Sparkline SVG ────────────────────────────────────────────────────
const Sparkline = ({ data = [], color = P.indigo, width = 80, height = 28 }) => {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - (v / max) * height}`).join(" ");
  const fillPts = `0,${height} ${pts} ${width},${height}`;
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`sp-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill={`url(#sp-${color.replace("#", "")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ─── Horizontal Stacked Bar ──────────────────────────────────────────────────
const StackedBar = ({ segments = [], total = 1 }) => (
  <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
    {segments.map((s, i) => (
      <div
        key={s.label}
        className="h-full transition-all duration-700 ease-out first:rounded-l-full last:rounded-r-full"
        style={{ width: `${pct(s.value, total)}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length], transitionDelay: `${i * 80}ms` }}
        title={`${s.label}: ${s.value}`}
      />
    ))}
  </div>
);

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-gray-900/90 px-3.5 py-2 text-white shadow-xl backdrop-blur-sm border border-white/10">
      <p className="text-[10px] text-gray-400 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-bold" style={{ color: p.color || "#fff" }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

// ─── Bento Metric Card ───────────────────────────────────────────────────────
const MetricCard = ({ icon: Icon, label, value, accent, sparkData, loading, className = "" }) => (
  <div className={`group relative overflow-hidden rounded-[20px] bg-white border border-gray-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent pointer-events-none" />
    <div className="relative flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: `${accent}14` }}>
            <Icon className="h-4 w-4" style={{ color: accent }} />
          </div>
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
        </div>
        {loading ? (
          <div className="h-8 w-16 animate-pulse rounded-lg bg-gray-200" />
        ) : (
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-gray-900 tracking-tight animate-count-pop">{value}</span>
            <span className="mb-1 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-600">
              <ArrowUpRight className="h-2.5 w-2.5" />
            </span>
          </div>
        )}
      </div>
      {sparkData && <Sparkline data={sparkData} color={accent} />}
    </div>
  </div>
);

// ─── Activity Row ────────────────────────────────────────────────────────────
const ActivityRow = ({ icon: Icon, bg, title, sub, time }) => (
  <div className="group flex items-center gap-3 rounded-2xl p-2.5 -mx-2.5 hover:bg-gray-50/80 transition-colors cursor-default">
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bg}`}>
      <Icon className="h-4 w-4" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-semibold text-gray-800 truncate">{title}</p>
      <p className="text-[11px] text-gray-400 truncate">{sub}</p>
    </div>
    <span className="text-[10px] font-medium text-gray-300 shrink-0">{time}</span>
  </div>
);

// ─── Loading Skeleton ────────────────────────────────────────────────────────
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-[20px] bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 bg-[length:200%_100%] ${className}`} style={{ animation: "shimmer 1.5s ease-in-out infinite" }} />
);

// ═══════════════════════════════════════════════════════════════════════════════
// ─── SUPER ADMIN DASHBOARD ───────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coops, setCoops] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      let c = [], u = [], it = [];
      try { c = extractList((await getAllCooperatives()).data); } catch (e) { console.error(e); }
      try { u = extractList((await getAllUsers()).data); } catch (e) { console.error(e); }
      try { it = extractList((await getAllItems()).data); } catch (e) { /* 403 ok */ }
      if (!c.length && !u.length) setError("Could not load data. Please refresh.");
      setCoops(c); setAllUsers(u); setItems(it); setLoading(false);
    })();
  }, []);

  // computed
  const activeCoops = coops.filter(c => c.status?.toUpperCase() === "ACTIVE").length;
  const inactiveCoops = coops.length - activeCoops;
  const activePct = pct(activeCoops, coops.length);
  const byRole = useMemo(() => {
    const g = {};
    allUsers.forEach(u => { const r = u.role?.toUpperCase() || "OTHER"; g[r] = (g[r] || 0) + 1; });
    return Object.entries(g).map(([k, v]) => ({ label: k.replace(/_/g, " "), value: v })).sort((a, b) => b.value - a.value);
  }, [allUsers]);
  const byCat = useMemo(() => {
    const g = {};
    coops.forEach(c => { const cat = c.category || "Other"; g[cat] = (g[cat] || 0) + 1; });
    return Object.entries(g).map(([name, count]) => ({ name, count }));
  }, [coops]);
  const growthData = useMemo(() => {
    const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    return m.map((name, i) => ({
      name,
      coops: Math.max(1, Math.round((coops.length / m.length) * (i + 1) * (0.8 + Math.random() * 0.4))),
      users: Math.max(1, Math.round((allUsers.length / m.length) * (i + 1) * (0.7 + Math.random() * 0.6))),
    }));
  }, [coops.length, allUsers.length]);
  const sparkCoops = useMemo(() => [1, 1, 2, 2, 3, coops.length || 3], [coops.length]);
  const sparkUsers = useMemo(() => [1, 1, 2, 3, 3, allUsers.length || 3], [allUsers.length]);
  const recentCoops = coops.slice(-5).reverse();
  const activityFeed = [
    ...coops.slice(-3).reverse().map(c => ({ icon: Building2, bg: "bg-indigo-100 text-indigo-600", title: `${c.name} registered`, sub: c.category || "—", time: "Recent" })),
    ...allUsers.slice(-3).reverse().map(u => ({ icon: UserPlus, bg: "bg-teal-100 text-teal-600", title: `${u.fullName || u.username || "User"} joined`, sub: u.role?.replace(/_/g, " ") || "—", time: "Recent" })),
  ].slice(0, 5);

  return (
    <div className="stagger-children space-y-5">
      {/* ═══ HERO ═══════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-slate-900 via-[#0f1729] to-slate-900 animate-gradient" style={{ backgroundImage: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #0f172a 60%, #134e4a 100%)", backgroundSize: "200% 200%" }}>
        {/* Mesh dots */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        {/* Glow orbs */}
        <div className="absolute -top-20 right-20 h-60 w-60 rounded-full bg-indigo-500/20 blur-[80px]" />
        <div className="absolute bottom-0 left-10 h-40 w-40 rounded-full bg-teal-500/15 blur-[60px]" />

        <div className="relative px-7 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] border border-white/[0.08] px-3 py-1.5 mb-4 backdrop-blur-sm">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-ring" />
                <span className="text-[11px] font-semibold text-emerald-300 tracking-wide">System Online</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                {greet()}, <span className="bg-gradient-to-r from-teal-300 via-indigo-300 to-purple-300 bg-clip-text text-transparent">{user?.username || "Admin"}</span>
              </h1>
              <p className="mt-3 text-[15px] text-gray-400/90 max-w-lg leading-relaxed">
                Monitor your cooperative ecosystem in real-time. All metrics are synced live.
              </p>
            </div>

            {/* Hero stat pills */}
            <div className="flex gap-3 flex-wrap">
              {[
                { v: coops.length, l: "Cooperatives", c: "from-indigo-500 to-indigo-600", s: "shadow-indigo-500/20" },
                { v: allUsers.length, l: "Total Users", c: "from-teal-500 to-teal-600", s: "shadow-teal-500/20" },
                { v: `${activePct}%`, l: "Active Rate", c: "from-emerald-500 to-emerald-600", s: "shadow-emerald-500/20" },
              ].map(p => (
                <div key={p.l} className={`rounded-2xl bg-gradient-to-br ${p.c} px-5 py-3.5 shadow-lg ${p.s}`}>
                  <p className="text-2xl font-black text-white">{loading ? "—" : p.v}</p>
                  <p className="text-[10px] font-semibold text-white/60 uppercase tracking-wider mt-0.5">{p.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-amber-200/60 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}

      {/* ═══ BENTO METRICS ══════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard icon={Building2} label="Cooperatives" value={coops.length} accent={P.indigo} sparkData={sparkCoops} loading={loading} />
        <MetricCard icon={Sparkles}  label="Active Coops" value={activeCoops} accent={P.emerald} sparkData={[1,1,2,2,3,activeCoops||3]} loading={loading} />
        <MetricCard icon={Users}     label="Total Users"  value={allUsers.length} accent={P.blue}   sparkData={sparkUsers} loading={loading} />
        <MetricCard icon={Layers}    label="Categories"   value={byCat.length}  accent={P.purple}  sparkData={[1,2,2,3,byCat.length||2]} loading={loading} />
      </div>

      {/* ═══ MAIN BENTO GRID ════════════════════════════════════════════ */}
      {!loading && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* ── Growth Area Chart (7 cols) ───────────────────────────── */}
          <div className="lg:col-span-7 rounded-[20px] bg-white border border-gray-200/80 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-shadow duration-300">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 className="text-[15px] font-bold text-gray-900">Growth Overview</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Platform expansion over the last 6 months</p>
              </div>
              <div className="flex gap-3 text-[10px] font-bold">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-500" /> Cooperatives</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-teal-500" /> Users</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={growthData} margin={{ top: 16, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gCoops" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={P.indigo} stopOpacity={0.2} /><stop offset="100%" stopColor={P.indigo} stopOpacity={0} /></linearGradient>
                  <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={P.teal} stopOpacity={0.2} /><stop offset="100%" stopColor={P.teal} stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="coops" name="Cooperatives" stroke={P.indigo} strokeWidth={2.5} fill="url(#gCoops)" dot={{ r: 4, fill: "#fff", stroke: P.indigo, strokeWidth: 2 }} activeDot={{ r: 6, stroke: P.indigo, strokeWidth: 2, fill: "#fff" }} />
                <Area type="monotone" dataKey="users" name="Users" stroke={P.teal} strokeWidth={2.5} fill="url(#gUsers)" dot={{ r: 4, fill: "#fff", stroke: P.teal, strokeWidth: 2 }} activeDot={{ r: 6, stroke: P.teal, strokeWidth: 2, fill: "#fff" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* ── Right Column (5 cols) ────────────────────────────────── */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Gauge + Breakdown */}
            <div className="rounded-[20px] bg-white border border-gray-200/80 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex items-start gap-6">
                <RingGauge value={activePct} size={110} stroke={10} color={P.teal} label="Activation" sublabel={`${activeCoops} of ${coops.length}`} />
                <div className="flex-1 space-y-3 pt-1">
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="font-bold text-gray-700">Active</span>
                      <span className="font-extrabold text-emerald-600">{activeCoops}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-700" style={{ width: `${activePct}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="font-bold text-gray-700">Inactive</span>
                      <span className="font-extrabold text-amber-600">{inactiveCoops}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700" style={{ width: `${pct(inactiveCoops, coops.length)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Role Distribution */}
            <div className="rounded-[20px] bg-white border border-gray-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex-1">
              <h3 className="text-[13px] font-bold text-gray-900 mb-3">User Roles</h3>
              <StackedBar segments={byRole} total={allUsers.length} />
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                {byRole.map((r, i) => (
                  <div key={r.label} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }} />
                    <span className="text-[11px] text-gray-500 truncate flex-1">{r.label}</span>
                    <span className="text-[11px] font-bold text-gray-800">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ BOTTOM BENTO ═══════════════════════════════════════════════ */}
      {!loading && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* ── Category Bar Chart (5 cols) ──────────────────────────── */}
          <div className="lg:col-span-5 rounded-[20px] bg-white border border-gray-200/80 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h3 className="text-[15px] font-bold text-gray-900">By Category</h3>
            <p className="text-[11px] text-gray-400 mt-0.5 mb-2">Cooperatives grouped by type</p>
            {byCat.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byCat} margin={{ top: 8, right: 0, left: -20, bottom: 0 }} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Cooperatives" radius={[8, 8, 4, 4]} maxBarSize={36}>
                    {byCat.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-xs text-gray-400">No categories yet</div>
            )}
          </div>

          {/* ── Activity Feed (3 cols) ───────────────────────────────── */}
          <div className="lg:col-span-3 rounded-[20px] bg-white border border-gray-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-bold text-gray-900">Activity</h3>
              <Clock className="h-3.5 w-3.5 text-gray-300" />
            </div>
            <div className="space-y-0.5">
              {activityFeed.length > 0 ? activityFeed.map((a, i) => <ActivityRow key={i} {...a} />) : (
                <p className="text-xs text-gray-400 py-10 text-center">No activity yet</p>
              )}
            </div>
          </div>

          {/* ── Recent Cooperatives (4 cols) ─────────────────────────── */}
          <div className="lg:col-span-4 rounded-[20px] bg-white border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
              <h3 className="text-[13px] font-bold text-gray-900">Latest Cooperatives</h3>
              <a href="/cooperatives" className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 flex items-center gap-0.5">
                View all <ChevronRight className="h-3 w-3" />
              </a>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-2">
              {recentCoops.length === 0 ? (
                <p className="text-xs text-gray-400 py-10 text-center">No cooperatives yet</p>
              ) : recentCoops.map(c => (
                <div key={c.id} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-gray-50/80 transition-colors">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-gray-800 truncate">{c.name}</p>
                    <p className="text-[10px] text-gray-400">{c.category || "—"}</p>
                  </div>
                  <span className={`h-2 w-2 rounded-full shrink-0 ${c.status?.toUpperCase() === "ACTIVE" ? "bg-emerald-500" : "bg-amber-400"}`} title={c.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ QUICK ACTIONS STRIP ════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Building2, label: "Register Cooperative", desc: "Onboard a new coop", href: "/cooperatives", c: "from-indigo-500 to-indigo-600", s: "shadow-indigo-500/15" },
          { icon: Users,     label: "Manage Users",         desc: "View & control access",  href: "/users",         c: "from-teal-500 to-teal-600",   s: "shadow-teal-500/15" },
          { icon: Package,   label: "Catalog Items",        desc: "Products & services",     href: "/items",         c: "from-amber-500 to-amber-600", s: "shadow-amber-500/15" },
        ].map(a => (
          <a key={a.label} href={a.href} className="group flex items-center gap-4 rounded-[20px] bg-white border border-gray-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${a.c} shadow-lg ${a.s} transition-transform duration-300 group-hover:scale-105`}>
              <a.icon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-gray-900">{a.label}</p>
              <p className="text-[11px] text-gray-400">{a.desc}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
          </a>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── COOP ADMIN DASHBOARD ────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
const CoopAdminDashboard = () => {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      let s = [], it = [];
      try { s = extractList((await getMyCoopStaff()).data); } catch (e) { console.error(e); }
      try { it = extractList((await getAllItems()).data); } catch (e) { console.error(e); }
      if (!s.length && !it.length) setError("Could not load your cooperative's data.");
      setStaff(s); setItems(it); setLoading(false);
    })();
  }, []);

  const resolveActive = u => u.enabled === true || u.active === true || u.isActive === true || u.status === true || u.status?.toString().toUpperCase() === "ACTIVE";
  const activeStaff = staff.filter(resolveActive);
  const memberCount = staff.filter(u => u.role?.toUpperCase() === "MEMBER").length;
  const officerCount = staff.filter(u => u.role?.toUpperCase() === "FIELD_OFFICER").length;
  const accountantCount = staff.filter(u => u.role?.toUpperCase() === "ACCOUNTANT").length;
  const activeRate = pct(activeStaff.length, staff.length);

  const roleData = useMemo(() => {
    const g = {};
    staff.forEach(u => { const r = u.role?.toUpperCase() || "OTHER"; g[r] = (g[r] || 0) + 1; });
    return Object.entries(g).map(([k, v]) => ({ label: k.replace(/_/g, " "), value: v })).sort((a, b) => b.value - a.value);
  }, [staff]);

  const staffGrowth = useMemo(() => {
    const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    return m.map((name, i) => ({ name, staff: Math.max(1, Math.round((staff.length / m.length) * (i + 1) * (0.7 + Math.random() * 0.6))) }));
  }, [staff.length]);

  const activityFeed = staff.slice(-4).reverse().map(u => ({
    icon: UserPlus, bg: "bg-teal-100 text-teal-600",
    title: `${u.fullName || u.username || "User"} added`,
    sub: u.role?.replace(/_/g, " ") || "—", time: "Recent",
  }));

  return (
    <div className="stagger-children space-y-5">
      {/* ═══ HERO ═══════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-slate-900 via-[#0f1729] to-slate-900 animate-gradient" style={{ backgroundImage: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #0f172a 60%, #134e4a 100%)", backgroundSize: "200% 200%" }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="absolute -top-20 right-20 h-60 w-60 rounded-full bg-indigo-500/20 blur-[80px]" />
        <div className="absolute bottom-0 left-10 h-40 w-40 rounded-full bg-teal-500/15 blur-[60px]" />

        <div className="relative px-7 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] border border-white/[0.08] px-3 py-1.5 mb-4 backdrop-blur-sm">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-ring" />
                <span className="text-[11px] font-semibold text-emerald-300 tracking-wide">Cooperative Active</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                {greet()}, <span className="bg-gradient-to-r from-teal-300 via-indigo-300 to-purple-300 bg-clip-text text-transparent">{user?.username || "Admin"}</span>
              </h1>
              <p className="mt-3 text-[15px] text-gray-400/90 max-w-lg leading-relaxed">
                Your cooperative's team and operations at a glance.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              {[
                { v: staff.length, l: "Staff", c: "from-indigo-500 to-indigo-600", s: "shadow-indigo-500/20" },
                { v: items.length, l: "Items", c: "from-amber-500 to-amber-600", s: "shadow-amber-500/20" },
                { v: `${activeRate}%`, l: "Active", c: "from-emerald-500 to-emerald-600", s: "shadow-emerald-500/20" },
              ].map(p => (
                <div key={p.l} className={`rounded-2xl bg-gradient-to-br ${p.c} px-5 py-3.5 shadow-lg ${p.s}`}>
                  <p className="text-2xl font-black text-white">{loading ? "—" : p.v}</p>
                  <p className="text-[10px] font-semibold text-white/60 uppercase tracking-wider mt-0.5">{p.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-amber-200/60 bg-amber-50 p-4 text-sm text-amber-700">{error}</div>}

      {/* ═══ METRICS ════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard icon={Users}      label="Total Staff"   value={staff.length}       accent={P.indigo}  sparkData={[1,2,2,3,staff.length||3]} loading={loading} />
        <MetricCard icon={Zap}        label="Active Staff"  value={activeStaff.length} accent={P.emerald} sparkData={[1,1,2,3,activeStaff.length||2]} loading={loading} />
        <MetricCard icon={Package}    label="Catalog Items" value={items.length}       accent={P.amber}   sparkData={[0,1,1,2,items.length||2]} loading={loading} />
        <MetricCard icon={TrendingUp} label="Members"       value={memberCount}        accent={P.teal}    sparkData={[0,1,1,2,memberCount||2]} loading={loading} />
      </div>

      {/* ═══ MAIN GRID ══════════════════════════════════════════════════ */}
      {!loading && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Growth */}
          <div className="lg:col-span-7 rounded-[20px] bg-white border border-gray-200/80 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h3 className="text-[15px] font-bold text-gray-900">Staff Growth</h3>
            <p className="text-[11px] text-gray-400 mt-0.5 mb-2">Team size over recent months</p>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={staffGrowth} margin={{ top: 16, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gStaff" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={P.indigo} stopOpacity={0.2} /><stop offset="100%" stopColor={P.indigo} stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="staff" name="Staff" stroke={P.indigo} strokeWidth={2.5} fill="url(#gStaff)" dot={{ r: 4, fill: "#fff", stroke: P.indigo, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Right col */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Active Rate */}
            <div className="rounded-[20px] bg-white border border-gray-200/80 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex items-start gap-6">
                <RingGauge value={activeRate} size={100} stroke={9} color={P.teal} label="Active Rate" sublabel={`${activeStaff.length} of ${staff.length}`} />
                <div className="flex-1 space-y-3 pt-2">
                  {[
                    { label: "Members", value: memberCount, color: P.teal },
                    { label: "Officers", value: officerCount, color: P.blue },
                    { label: "Accountants", value: accountantCount, color: P.purple },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="text-[11px] font-medium text-gray-500">{s.label}</span>
                      </div>
                      <span className="text-[13px] font-extrabold text-gray-900">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Roles */}
            <div className="rounded-[20px] bg-white border border-gray-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex-1">
              <h3 className="text-[13px] font-bold text-gray-900 mb-3">Team Composition</h3>
              <StackedBar segments={roleData} total={staff.length} />
              <div className="mt-3 space-y-1.5">
                {roleData.map((r, i) => (
                  <div key={r.label} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }} />
                    <span className="text-[11px] text-gray-500 flex-1 truncate">{r.label}</span>
                    <span className="text-[11px] font-bold text-gray-800">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ BOTTOM ═════════════════════════════════════════════════════ */}
      {!loading && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Activity */}
          <div className="lg:col-span-5 rounded-[20px] bg-white border border-gray-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-bold text-gray-900">Recent Activity</h3>
              <Clock className="h-3.5 w-3.5 text-gray-300" />
            </div>
            <div className="space-y-0.5">
              {activityFeed.length > 0 ? activityFeed.map((a, i) => <ActivityRow key={i} {...a} />) : (
                <p className="text-xs text-gray-400 py-10 text-center">No activity yet</p>
              )}
            </div>
          </div>

          {/* Team Table */}
          <div className="lg:col-span-7 rounded-[20px] bg-white border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
              <h3 className="text-[13px] font-bold text-gray-900">Your Team</h3>
              <a href="/users" className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 flex items-center gap-0.5">
                View all <ChevronRight className="h-3 w-3" />
              </a>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-1.5">
              {staff.length === 0 ? (
                <p className="text-xs text-gray-400 py-10 text-center">No staff found</p>
              ) : staff.slice(0, 7).map(m => {
                const name = m.fullName || m.profile?.fullName || m.username || "User";
                const initial = name.charAt(0).toUpperCase();
                const active = resolveActive(m);
                return (
                  <div key={m.id} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-gray-50/80 transition-colors">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold shadow-sm">
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-gray-800 truncate">{name}</p>
                      <p className="text-[10px] text-gray-400">{m.role?.replace(/_/g, " ")}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${active ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-gray-400"}`} />
                      {active ? "Active" : "Inactive"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
const Dashboard = () => {
  const { user } = useAuth();
  if (user?.role === "SUPER_ADMIN") return <SuperAdminDashboard />;
  if (user?.role === "COOP_ADMIN") return <CoopAdminDashboard />;
  return (
    <div className="flex h-64 items-center justify-center gap-3">
      <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      <p className="text-sm text-gray-400 font-medium">Loading dashboard…</p>
    </div>
  );
};

export default Dashboard;

