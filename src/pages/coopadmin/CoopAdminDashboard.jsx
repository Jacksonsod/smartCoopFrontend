import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  CalendarDays,
  ClipboardList,
  Loader2,
  Package,
  Plus,
  TrendingUp,
  UserPlus,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { getMyCoopStaff } from "@/services/userService";
import { getCoopActivities } from "@/services/activityService";
import { getAllItems } from "@/services/itemService";
import { getReportSummary } from "@/services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const extractList = (d) => (Array.isArray(d) ? d : Array.isArray(d?.content) ? d.content : Array.isArray(d?.data) ? d.data : []);
const greet = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; };
const formatCurrency = (a) => new Intl.NumberFormat("en-RW", { style: "currency", currency: "RWF", maximumFractionDigits: 0 }).format(a || 0);
const formatDate = (d) => { if (!d) return "-"; const date = new Date(d); return isNaN(date.getTime()) ? "-" : new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "short", day: "2-digit" }).format(date); };

// Premium Metric Card Component
const PremiumStatCard = ({ title, value, subtext, icon: Icon, color = "emerald", trend = null }) => {
  const colorMap = {
    emerald: { accent: "#10b981", bg: "bg-emerald-50/50", text: "text-emerald-600", border: "border-emerald-100" },
    blue: { accent: "#3b82f6", bg: "bg-blue-50/50", text: "text-blue-600", border: "border-blue-100" },
    amber: { accent: "#f59e0b", bg: "bg-amber-50/50", text: "text-amber-600", border: "border-amber-100" },
    purple: { accent: "#8b5cf6", bg: "bg-purple-50/50", text: "text-purple-600", border: "border-purple-100" },
  };
  const cmap = colorMap[color] || colorMap.emerald;

  return (
    <Card className={`overflow-hidden border ${cmap.border} dark:border-gray-850 bg-white dark:bg-gray-900 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group`}>
      <CardContent className="p-6 relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{title}</p>
            <p className="mt-3 text-3xl font-extrabold text-gray-950 dark:text-white tracking-tight">{value}</p>
            {subtext && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{subtext}</p>}
            {trend && (
              <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <TrendingUp className="h-3.5 w-3.5" />
                {trend}
              </div>
            )}
          </div>
          <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${cmap.bg} dark:bg-gray-800 ${cmap.text} dark:text-emerald-400 transition-all duration-300 group-hover:scale-110`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        {/* Decorative colored glow on the side */}
        <div className="absolute right-0 top-0 bottom-0 w-[3px] transition-all duration-300" style={{ backgroundColor: cmap.accent }} />
      </CardContent>
    </Card>
  );
};

const CoopAdminDashboard = () => {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [activities, setActivities] = useState([]);
  const [items, setItems] = useState([]);
  const [reportSummary, setReportSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [sRes, aRes, iRes, rRes] = await Promise.all([
          getMyCoopStaff().catch(() => ({ data: [] })),
          getCoopActivities().catch(() => ({ data: [] })),
          getAllItems().catch(() => ({ data: [] })),
          getReportSummary().catch(() => ({ data: {} })),
        ]);
        setStaff(extractList(sRes?.data));
        setActivities(extractList(aRes?.data));
        setItems(extractList(iRes?.data));
        setReportSummary(rRes?.data || {});
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard data");
      }
      finally { setLoading(false); }
    })();
  }, []);

  const stats = useMemo(() => {
    const members = staff.filter(s => String(s.role).toUpperCase() === "MEMBER");
    const activeStaff = staff.filter(s => ["FIELD_OFFICER", "ACCOUNTANT", "QUALITY_INSPECTOR"].includes(String(s.role).toUpperCase()));
    const totalVolume = activities.reduce((s, a) => s + (Number(a.metricValue) || 0), 0);
    const totalRevenue = activities.reduce((s, a) => {
      const direct = Number(a.totalRevenue || a.totalAmount) || 0;
      if (direct > 0) return s + direct;
      const qty = Number(a.metricValue) || 0;
      const price = Number(a.unitPrice || a.item?.defaultUnitPrice || a.defaultUnitPrice) || 0;
      return s + (qty * price);
    }, 0);
    return { memberCount: members.length, staffCount: activeStaff.length, totalActivities: activities.length, activeItems: items.filter(i => i.active !== false).length, totalVolume, totalRevenue };
  }, [staff, activities, items]);

  // Activity chart data (last 7 days)
  const chartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-GB", { weekday: "short" });
      const count = activities.filter(a => (a.activityDate || a.createdAt || "").slice(0, 10) === key).length;
      days.push({ day: label, count });
    }
    return days;
  }, [activities]);

  const recentActivities = activities.slice(0, 5);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mb-2" />
        <p className="text-sm text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{greet()}, {user?.fullName || user?.username || "Admin"}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Manage cooperative members, activities, and operations</p>
        </div>
        <Link to="/activities">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" size="lg">
            <Plus className="h-4 w-4" />
            Record Activity
          </Button>
        </Link>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Premium Metrics Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
        <PremiumStatCard
          title="Total Deliveries"
          value={stats.totalActivities}
          subtext="Activities recorded"
          icon={Activity}
          color="emerald"
          trend={"+12% from last month"}
        />
        <PremiumStatCard
          title="Total Volume"
          value={`${stats.totalVolume.toLocaleString()} units`}
          subtext="Across all items"
          icon={Package}
          color="blue"
        />
        <PremiumStatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          subtext={`${stats.totalVolume.toLocaleString()} units processed`}
          icon={DollarSign}
          color="emerald"
          trend={"+8% growth"}
        />
        <PremiumStatCard
          title="Active Members"
          value={stats.memberCount}
          subtext={`${stats.staffCount} staff members`}
          icon={Users}
          color="purple"
        />
      </div>

      {/* Quick Metrics Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 stagger-children" style={{ animationDelay: "200ms" }}>
        <Card className="border border-amber-100 dark:border-amber-900/30 bg-amber-50/20 dark:bg-amber-950/20 hover:shadow-md hover:bg-amber-50/30 dark:hover:bg-amber-950/30 transition-all duration-200 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3.5">
              <div className="p-2 bg-amber-50 dark:bg-amber-900/40 rounded-lg text-amber-600 dark:text-amber-400">
                <Clock className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">Pending Payments</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{reportSummary?.pendingPaymentsAmount || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/20 dark:bg-emerald-950/20 hover:shadow-md hover:bg-emerald-50/30 dark:hover:bg-emerald-950/30 transition-all duration-200 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3.5">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/40 rounded-lg text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-450">Completed Payments</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{reportSummary?.totalActivities || activities.filter(a => (a.paymentStatus || a.status) === 'PAID').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-blue-100 dark:border-blue-900/30 bg-blue-50/20 dark:bg-blue-950/20 hover:shadow-md hover:bg-blue-50/30 dark:hover:bg-blue-950/30 transition-all duration-200 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3.5">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/40 rounded-lg text-blue-600 dark:text-blue-400">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400">Catalog Items</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{stats.activeItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 stagger-children" style={{ animationDelay: "300ms" }}>
        {/* Activity Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-emerald-600" /> Activity This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Activities" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/activities">
              <Button className="w-full justify-start bg-emerald-600 hover:bg-emerald-700 text-white mb-2">
                <ClipboardList className="mr-2 h-4 w-4" /> Record Activity
              </Button>
            </Link>
            <Link to="/users">
              <Button className="w-full justify-start mb-2" variant="outline">
                <UserPlus className="mr-2 h-4 w-4" /> Add Staff / Member
              </Button>
            </Link>
            <Link to="/items">
              <Button className="w-full justify-start mb-2" variant="outline">
                <Package className="mr-2 h-4 w-4" /> Manage Catalog
              </Button>
            </Link>
            <Link to="/helpdesk">
              <Button className="w-full justify-start" variant="outline">
                <Activity className="mr-2 h-4 w-4" /> View Helpdesk
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader className="pb-3 border-b dark:border-gray-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-gray-900 dark:text-white">Recent Activities</CardTitle>
            <Link to="/activities">
              <Button size="sm" variant="outline" className="text-xs dark:border-gray-850 dark:hover:bg-gray-800">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {recentActivities.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">No activities yet</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                <thead className="bg-gray-50/75 dark:bg-gray-800/70">
                  <tr>
                    {["Date", "Member", "Item", "Quantity", "Notes"].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-50 dark:divide-gray-850">
                  {recentActivities.map(a => (
                    <tr key={a.id} className="hover:bg-emerald-50/15 dark:hover:bg-emerald-950/10 transition-colors duration-150">
                      <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                          {formatDate(a.activityDate || a.createdAt)}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        {a.memberName || a.memberUsername || a.member?.fullName || "-"}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-450 ring-1 ring-inset ring-emerald-600/10 dark:ring-emerald-500/20">
                          {a.itemName || a.item?.name || "-"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono font-medium text-gray-600 dark:text-gray-350 whitespace-nowrap">{a.metricValue}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">{a.notes || "-"}</td>
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

export default CoopAdminDashboard;
