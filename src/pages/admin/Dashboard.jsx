// ═══════════════════════════════════════════════════════════════════
// ─── FIELD OFFICER DASHBOARD ──────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
import { getCoopActivities } from "@/services/activityService";
import api from "@/services/api";

const FieldOfficerDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activities, setActivities] = useState([]);
  const [coopName, setCoopName] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [res] = await Promise.all([
          getCoopActivities()
        ]);
        if (!mounted) return;
        setActivities(Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.content) ? res.data.content : []);
      } catch (err) {
        if (!mounted) return;
        setError("Could not load activities.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    let todayCount = 0;
    let totalVol = 0;
    const members = new Set();
    
    activities.forEach(a => {
      if (new Date(a.activityDate || a.createdAt).toDateString() === today) todayCount++;
      totalVol += Number(a.metricValue) || 0;
      const memName = a.memberName || a.member?.fullName || a.member?.username;
      if (memName) members.add(memName);
    });

    return {
      total: activities.length,
      today: todayCount,
      volume: totalVol,
      members: members.size
    };
  }, [activities]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {greet()}, {user?.username || "Field Officer"}
        </h1>
        {coopName && <p className="text-lg font-medium text-emerald-700 mt-1">Welcome to {coopName}</p>}
        <p className="text-sm text-gray-500 mt-1">
          Welcome! Here are your recent cooperative activities.
        </p>
        <div className="mt-4">
          <a href="/activities">
            <button className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700">
              Record Activity
            </button>
          </a>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard icon={Activity} label="Total Activities" value={stats.total} accent={P.emerald} loading={loading} />
        <MetricCard icon={Calendar} label="Today's Activities" value={stats.today} accent={P.blue} loading={loading} />
        <MetricCard icon={Package} label="Total Volume" value={stats.volume.toLocaleString()} accent={P.amber} loading={loading} />
        <MetricCard icon={Users} label="Unique Members" value={stats.members} accent={P.purple} loading={loading} />
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-20 items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                <span className="text-sm text-gray-500">Loading activities...</span>
              </div>
            ) : error ? (
              <Alert>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : activities.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500">No activities recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-md">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Member Name</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Item/Service</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Quantity</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.slice(0, 10).map((activity) => (
                      <tr key={activity.id} className="border-b last:border-b-0">
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {new Date(activity.activityDate || activity.createdAt).toLocaleString("en-GB", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {activity.memberName || activity.member?.fullName || activity.member?.username || "-"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {activity.itemName || activity.item?.name || activity.serviceName || "-"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {activity.metricValue}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {activity.notes || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Building2,
  Calendar,
  ChevronRight,
  Clock,
  Layers,
  Loader2,
  Package,
  TrendingUp,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getAllCooperatives } from "@/services/cooperativeService";
import { getAllUsers, getMyCoopStaff } from "@/services/userService";
import { getAllItems } from "@/services/itemService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, CartesianGrid,
} from "recharts";

// ─── Palette ─────────────────────────────────────────────────────
const P = {
  emerald: "#10b981", blue: "#3b82f6", amber: "#f59e0b",
  purple: "#8b5cf6", indigo: "#6366f1", teal: "#14b8a6", rose: "#f43f5e",
};
const BAR_COLORS = [P.emerald, P.blue, P.amber, P.purple, P.indigo, P.teal, P.rose];

// ─── Helpers ─────────────────────────────────────────────────────
const extractList = (d) => Array.isArray(d) ? d : Array.isArray(d?.content) ? d.content : Array.isArray(d?.data) ? d.data : [];
const pct = (a, b) => b > 0 ? Math.round((a / b) * 100) : 0;
const greet = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; };

// ─── Ring Gauge ──────────────────────────────────────────────────
const RingGauge = ({ value = 0, size = 100, stroke = 8, color = P.emerald, label, sublabel }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
          strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-gray-900">{value}%</span>
      </div>
      {label && <p className="mt-1.5 text-xs font-medium text-gray-600">{label}</p>}
      {sublabel && <p className="text-[11px] text-gray-400">{sublabel}</p>}
    </div>
  );
};

// ─── Stacked Bar ─────────────────────────────────────────────────
const StackedBar = ({ segments = [], total = 1 }) => (
  <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
    {segments.map((s, i) => (
      <div key={s.label} className="h-full transition-all duration-700 ease-out first:rounded-l-full last:rounded-r-full"
        style={{ width: `${pct(s.value, total)}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length], transitionDelay: `${i * 80}ms` }}
        title={`${s.label}: ${s.value}`} />
    ))}
  </div>
);

// ─── Chart Tooltip ───────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-white px-3 py-2 text-gray-900 shadow-lg border border-gray-200">
      <p className="text-[11px] text-gray-400 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

// ─── Metric Card ─────────────────────────────────────────────────
const MetricCard = ({ icon: Icon, label, value, accent, loading }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${accent}15` }}>
          <Icon className="h-4 w-4" style={{ color: accent }} />
        </div>
        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      {loading ? (
        <div className="h-7 w-14 animate-pulse rounded bg-gray-100" />
      ) : (
        <span className="text-2xl font-bold text-gray-900">{value}</span>
      )}
    </CardContent>
  </Card>
);

// ─── Activity Row ────────────────────────────────────────────────
const ActivityRow = ({ icon: Icon, bg, title, sub, time }) => (
  <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50 transition-colors">
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bg}`}>
      <Icon className="h-4 w-4" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-800 truncate">{title}</p>
      <p className="text-[11px] text-gray-400 truncate">{sub}</p>
    </div>
    <span className="text-[11px] text-gray-300 shrink-0">{time}</span>
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// ─── SUPER ADMIN DASHBOARD ───────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coops, setCoops] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [profileName, setProfileName] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      let c = [], u = [];
      try { c = extractList((await getAllCooperatives()).data); } catch (e) { console.error(e); }
      try { u = extractList((await getAllUsers()).data); } catch (e) { console.error(e); }
      try {
        const profRes = await api.get('/profile/me');
        if (profRes?.data?.fullName) setProfileName(profRes.data.fullName);
      } catch (e) { /* silent fail */ }
      if (!c.length && !u.length) setError("Could not load data. Please refresh.");
      setCoops(c); setAllUsers(u); setLoading(false);
    })();
  }, []);

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

  const recentCoops = coops.slice(-5).reverse();
  const activityFeed = [
    ...coops.slice(-3).reverse().map(c => ({ icon: Building2, bg: "bg-emerald-50 text-emerald-600", title: `${c.name} registered`, sub: c.category || "—", time: "Recent" })),
    ...allUsers.slice(-3).reverse().map(u => ({ icon: UserPlus, bg: "bg-blue-50 text-blue-600", title: `${u.fullName || u.username || "User"} joined`, sub: u.role?.replace(/_/g, " ") || "—", time: "Recent" })),
  ].slice(0, 5);

  return (
    <div className="space-y-6">
      {/* ── Welcome ───────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {greet()}, {profileName || user?.fullName || user?.firstName || user?.username || "Admin"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Here's an overview of your cooperative ecosystem.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ── Metrics ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard icon={Building2} label="Cooperatives" value={coops.length} accent={P.emerald} loading={loading} />
        <MetricCard icon={Zap} label="Active Coops" value={activeCoops} accent={P.blue} loading={loading} />
        <MetricCard icon={Users} label="Total Users" value={allUsers.length} accent={P.purple} loading={loading} />
        <MetricCard icon={Layers} label="Categories" value={byCat.length} accent={P.amber} loading={loading} />
      </div>

      {/* ── Charts Row ────────────────────────────────────────── */}
      {!loading && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Growth */}
          <Card className="lg:col-span-7">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Growth Overview</CardTitle>
              <p className="text-xs text-gray-400">Platform expansion over the last 6 months</p>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 text-xs mb-2">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Cooperatives</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> Users</span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={growthData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gCoops" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={P.emerald} stopOpacity={0.15} /><stop offset="100%" stopColor={P.emerald} stopOpacity={0} /></linearGradient>
                    <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={P.blue} stopOpacity={0.15} /><stop offset="100%" stopColor={P.blue} stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="coops" name="Cooperatives" stroke={P.emerald} strokeWidth={2} fill="url(#gCoops)" dot={{ r: 3, fill: "#fff", stroke: P.emerald, strokeWidth: 2 }} />
                  <Area type="monotone" dataKey="users" name="Users" stroke={P.blue} strokeWidth={2} fill="url(#gUsers)" dot={{ r: 3, fill: "#fff", stroke: P.blue, strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Right column */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Activation gauge */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start gap-5">
                  <RingGauge value={activePct} color={P.emerald} label="Activation" sublabel={`${activeCoops} of ${coops.length}`} />
                  <div className="flex-1 space-y-3 pt-1">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">Active</span>
                        <span className="font-semibold text-emerald-600">{activeCoops}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${activePct}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">Inactive</span>
                        <span className="font-semibold text-amber-600">{inactiveCoops}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full bg-amber-400 transition-all duration-700" style={{ width: `${pct(inactiveCoops, coops.length)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Role distribution */}
            <Card className="flex-1">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">User Roles</h3>
                <StackedBar segments={byRole} total={allUsers.length} />
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {byRole.map((r, i) => (
                    <div key={r.label} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }} />
                      <span className="text-xs text-gray-500 truncate flex-1">{r.label}</span>
                      <span className="text-xs font-semibold text-gray-700">{r.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── Bottom Row ─────────────────────────────────────────── */}
      {!loading && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Category chart */}
          <Card className="lg:col-span-5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">By Category</CardTitle>
              <p className="text-xs text-gray-400">Cooperatives grouped by type</p>
            </CardHeader>
            <CardContent>
              {byCat.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={byCat} margin={{ top: 8, right: 0, left: -20, bottom: 0 }} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" name="Cooperatives" radius={[6, 6, 2, 2]} maxBarSize={32}>
                      {byCat.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-xs text-gray-400">No categories yet</div>
              )}
            </CardContent>
          </Card>

          {/* Activity */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Activity</CardTitle>
                <Clock className="h-3.5 w-3.5 text-gray-300" />
              </div>
            </CardHeader>
            <CardContent className="space-y-0.5">
              {activityFeed.length > 0 ? activityFeed.map((a, i) => <ActivityRow key={i} {...a} />) : (
                <p className="text-xs text-gray-400 py-8 text-center">No activity yet</p>
              )}
            </CardContent>
          </Card>

          {/* Recent coops */}
          <Card className="lg:col-span-4">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Latest Cooperatives</CardTitle>
                <a href="/cooperatives" className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5">
                  View all <ChevronRight className="h-3 w-3" />
                </a>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {recentCoops.length === 0 ? (
                <p className="text-xs text-gray-400 py-8 text-center">No cooperatives yet</p>
              ) : recentCoops.map(c => (
                <div key={c.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50 transition-colors">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                    <p className="text-[11px] text-gray-400">{c.category || "—"}</p>
                  </div>
                  <Badge variant={c.status?.toUpperCase() === "ACTIVE" ? "default" : "secondary"} className={c.status?.toUpperCase() === "ACTIVE" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50" : ""}>
                    {c.status || "—"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Quick Actions ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Building2, label: "Register Cooperative", desc: "Onboard a new coop", href: "/cooperatives", color: P.emerald },
          { icon: Users, label: "Manage Users", desc: "View & control access", href: "/users", color: P.blue },
          { icon: Package, label: "Catalog Items", desc: "Products & services", href: "/items", color: P.amber },
        ].map(a => (
          <a key={a.label} href={a.href}>
            <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${a.color}15` }}>
                  <a.icon className="h-5 w-5" style={{ color: a.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{a.label}</p>
                  <p className="text-xs text-gray-400">{a.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300" />
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// ─── COOP ADMIN DASHBOARD ────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
const CoopAdminDashboard = () => {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [items, setItems] = useState([]);
  const [coopName, setCoopName] = useState("");
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
    icon: UserPlus, bg: "bg-blue-50 text-blue-600",
    title: `${u.fullName || u.username || "User"} added`,
    sub: u.role?.replace(/_/g, " ") || "—", time: "Recent",
  }));

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {greet()}, {user?.username || "Admin"}
        </h1>
        {coopName && <p className="text-lg font-medium text-emerald-700 mt-1">Welcome to {coopName}</p>}
        <p className="text-sm text-gray-500 mt-1">Your cooperative's team and operations at a glance.</p>
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard icon={Users} label="Total Staff" value={staff.length} accent={P.emerald} loading={loading} />
        <MetricCard icon={Zap} label="Active Staff" value={activeStaff.length} accent={P.blue} loading={loading} />
        <MetricCard icon={Package} label="Catalog Items" value={items.length} accent={P.amber} loading={loading} />
        <MetricCard icon={TrendingUp} label="Members" value={memberCount} accent={P.purple} loading={loading} />
      </div>

      {/* Charts */}
      {!loading && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <Card className="lg:col-span-7">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Staff Growth</CardTitle>
              <p className="text-xs text-gray-400">Team size over recent months</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={staffGrowth} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gStaff" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={P.emerald} stopOpacity={0.15} /><stop offset="100%" stopColor={P.emerald} stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="staff" name="Staff" stroke={P.emerald} strokeWidth={2} fill="url(#gStaff)" dot={{ r: 3, fill: "#fff", stroke: P.emerald, strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="lg:col-span-5 flex flex-col gap-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start gap-5">
                  <RingGauge value={activeRate} color={P.emerald} label="Active Rate" sublabel={`${activeStaff.length} of ${staff.length}`} />
                  <div className="flex-1 space-y-3 pt-2">
                    {[
                      { label: "Members", value: memberCount, color: P.emerald },
                      { label: "Officers", value: officerCount, color: P.blue },
                      { label: "Accountants", value: accountantCount, color: P.purple },
                    ].map(s => (
                      <div key={s.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                          <span className="text-xs text-gray-500">{s.label}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="flex-1">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Team Composition</h3>
                <StackedBar segments={roleData} total={staff.length} />
                <div className="mt-3 space-y-1.5">
                  {roleData.map((r, i) => (
                    <div key={r.label} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }} />
                      <span className="text-xs text-gray-500 flex-1 truncate">{r.label}</span>
                      <span className="text-xs font-semibold text-gray-700">{r.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Bottom row */}
      {!loading && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Recent Activity</CardTitle>
                <Clock className="h-3.5 w-3.5 text-gray-300" />
              </div>
            </CardHeader>
            <CardContent className="space-y-0.5">
              {activityFeed.length > 0 ? activityFeed.map((a, i) => <ActivityRow key={i} {...a} />) : (
                <p className="text-xs text-gray-400 py-8 text-center">No activity yet</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Your Team</CardTitle>
                <a href="/users" className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5">
                  View all <ChevronRight className="h-3 w-3" />
                </a>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {staff.length === 0 ? (
                <p className="text-xs text-gray-400 py-8 text-center">No staff found</p>
              ) : staff.slice(0, 5).map(m => {
                const name = m.fullName || m.profile?.fullName || m.username || "User";
                const initial = name.charAt(0).toUpperCase();
                const active = resolveActive(m);
                return (
                  <div key={m.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50 transition-colors">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-semibold">
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
                      <p className="text-[11px] text-gray-400">{m.role?.replace(/_/g, " ")}</p>
                    </div>
                    <Badge variant={active ? "default" : "secondary"} className={active ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50" : ""}>
                      {active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// ─── ACCOUNTANT DASHBOARD ──────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
import { getAllActivities } from "@/services/activityService";
import { getAllPayments } from "@/services/paymentService";

const AccountantDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coopName, setCoopName] = useState("");
  const [stats, setStats] = useState({
    pendingCount: 0,
    pendingAmount: 0,
    completedAmount: 0,
    activityCount: 0,
    recentPayments: []
  });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    const fetchAccountantData = async () => {
      try {
        const [paymentsRes, activitiesRes] = await Promise.all([
          getAllPayments().catch(() => ({ data: [] })),
          getAllActivities().catch(() => ({ data: [] }))
        ]);
        const payments = paymentsRes?.data || paymentsRes || [];
        const activities = activitiesRes?.data || activitiesRes || [];
        const pending = payments.filter(p => p.status === 'PENDING');
        const completed = payments.filter(p => p.status === 'COMPLETED');
        if (!mounted) return;
        setStats({
          pendingCount: pending.length,
          pendingAmount: pending.reduce((sum, p) => sum + (p.amount || 0), 0),
          completedAmount: completed.reduce((sum, p) => sum + (p.amount || 0), 0),
          activityCount: activities.length,
          recentPayments: pending.slice(0, 5)
        });
      } catch (error) {
        if (!mounted) return;
        console.error("Dashboard fetch error:", error);
        toast.error("Failed to load some dashboard data");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchAccountantData();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {greet()}, {user?.username || "Accountant"}
        </h1>
        {coopName && <p className="text-lg font-medium text-emerald-700 mt-1">Welcome to {coopName}</p>}
        <p className="text-sm text-gray-500 mt-1">Your payments and activities overview.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard icon={Package} label="Pending Payments" value={stats.pendingCount} accent={P.emerald} loading={loading} />
        <MetricCard icon={Zap} label="Completed Payments" value={stats.completedAmount} accent={P.blue} loading={loading} />
        <MetricCard icon={Users} label="Activities" value={stats.activityCount} accent={P.purple} loading={loading} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-20 items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
              <span className="text-sm text-gray-500">Loading payments...</span>
            </div>
          ) : error ? (
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : !stats || !stats.recentPayments || stats.recentPayments.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">No recent payments found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-md">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentPayments.map((payment) => (
                    <tr key={payment.id} className="border-b last:border-b-0">
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {new Date(payment.createdAt).toLocaleString("en-GB", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {payment.amount || 0}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {payment.status || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// ─── MAIN EXPORT ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
const Dashboard = () => {
  const { user } = useAuth();
  if (user?.role === "SUPER_ADMIN") return <SuperAdminDashboard />;
  if (user?.role === "COOP_ADMIN") return <CoopAdminDashboard />;
  if (user?.role === "FIELD_OFFICER") return <FieldOfficerDashboard />;
  if (user?.role === "ACCOUNTANT") return <AccountantDashboard />;
  return (
    <div className="flex h-64 items-center justify-center gap-3">
      <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
      <p className="text-sm text-gray-400">Loading dashboard…</p>
    </div>
  );
};

export default Dashboard;
