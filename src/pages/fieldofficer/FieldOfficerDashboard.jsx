import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  ClipboardList,
  Loader2,
  RefreshCw,
  UserPlus,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { getCoopActivities } from "@/services/activityService";
import { getMyCoopStaff } from "@/services/userService";

const extractList = (d) => (Array.isArray(d) ? d : Array.isArray(d?.content) ? d.content : Array.isArray(d?.data) ? d.data : []);
const greet = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; };
const formatDate = (d) => { if (!d) return "-"; const date = new Date(d); return isNaN(date.getTime()) ? "-" : new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date); };
const formatCurrency = (a) => new Intl.NumberFormat("en-RW", { style: "currency", currency: "RWF", maximumFractionDigits: 0 }).format(a || 0);
const parseNum = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

const StatCard = ({ title, value, icon: Icon, color = "emerald" }) => {
  const colorMap = {
    emerald: { accent: "#10b981", bg: "bg-emerald-50/50 dark:bg-emerald-950/20", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-100 dark:border-emerald-900/30" },
    blue: { accent: "#3b82f6", bg: "bg-blue-50/50 dark:bg-blue-950/20", text: "text-blue-600 dark:text-blue-400", border: "border-blue-100 dark:border-blue-900/30" },
    amber: { accent: "#f59e0b", bg: "bg-amber-50/50 dark:bg-amber-950/20", text: "text-amber-600 dark:text-amber-400", border: "border-amber-100 dark:border-amber-900/30" },
    purple: { accent: "#8b5cf6", bg: "bg-purple-50/50 dark:bg-purple-950/20", text: "text-purple-600 dark:text-purple-400", border: "border-purple-100 dark:border-purple-900/30" },
  };
  const cmap = colorMap[color] || colorMap.emerald;
  return (
    <Card className={`overflow-hidden border ${cmap.border} dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group`}>
      <CardContent className="p-6 relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{title}</p>
            <p className="mt-3 text-3xl font-extrabold text-gray-950 dark:text-white tracking-tight">{value}</p>
          </div>
          <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${cmap.bg} ${cmap.text} transition-all duration-300 group-hover:scale-110`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        {/* Decorative colored glow on the side */}
        <div className="absolute right-0 top-0 bottom-0 w-[3px] transition-all duration-300" style={{ backgroundColor: cmap.accent }} />
      </CardContent>
    </Card>
  );
};

const FieldOfficerDashboard = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [aRes, mRes] = await Promise.all([getCoopActivities(), getMyCoopStaff()]);
      setActivities(extractList(aRes?.data));
      setMembers(extractList(mRes?.data).filter(u => String(u.role).toUpperCase() === "MEMBER"));
    } catch { setActivities([]); setMembers([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayCount = activities.filter(a => (a.activityDate || a.createdAt || "").slice(0, 10) === today).length;
    const totalVolume = activities.reduce((s, a) => s + parseNum(a.metricValue), 0);
    const totalRevenue = activities.reduce((s, a) => {
      const settled = parseNum(a.totalRevenue || a.totalAmount);
      if (settled > 0) return s + settled;
      return s + (parseNum(a.metricValue) * parseNum(a.unitPrice || a.item?.defaultUnitPrice));
    }, 0);
    return { total: activities.length, today: todayCount, memberCount: members.length, totalVolume, totalRevenue };
  }, [activities, members]);

  const recentActivities = activities.slice(0, 8);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mb-2" />
        <p className="text-sm text-gray-400 dark:text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{greet()}, {user?.fullName || user?.username || "Field Officer"}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Record member activities and manage cooperative members</p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading} className="dark:border-gray-800 dark:hover:bg-gray-800 dark:text-gray-300">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Activities" value={stats.total} icon={Activity} color="emerald" />
        <StatCard title="Today" value={stats.today} icon={CalendarDays} color="blue" />
        <StatCard title="Members" value={stats.memberCount} icon={Users} color="purple" />
        <StatCard title="Revenue" value={formatCurrency(stats.totalRevenue)} icon={Activity} color="amber" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Link to="/activities">
          <Card className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-emerald-100 dark:border-emerald-900 bg-emerald-50/10 dark:bg-emerald-950/10 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 rounded-xl group">
            <CardContent className="p-5 flex items-center gap-4.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/10 transition-all duration-300 group-hover:scale-110">
                <ClipboardList className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-gray-950 dark:text-white text-base">Record Activity</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Log a member delivery or service</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/users">
          <Card className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-blue-100 dark:border-blue-900 bg-blue-50/10 dark:bg-blue-950/10 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 rounded-xl group">
            <CardContent className="p-5 flex items-center gap-4.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/10 transition-all duration-300 group-hover:scale-110">
                <UserPlus className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-gray-950 dark:text-white text-base">Add Member</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Register a new cooperative member</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activities */}
      <Card className="border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <CardHeader className="pb-3 border-b border-gray-50 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-gray-900 dark:text-white">Recent Activities</CardTitle>
            <Link to="/activities">
              <Button size="sm" variant="outline" className="text-xs dark:border-gray-800 dark:hover:bg-gray-800 dark:text-gray-300">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {recentActivities.length === 0 ? (
            <div className="py-10 text-center">
              <ClipboardList className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No activities recorded yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Start by recording a member activity</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                <thead className="bg-gray-50/75 dark:bg-gray-950/50">
                  <tr>
                    {["Date", "Member", "Item", "Quantity", "Revenue", "Notes"].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-550">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-50 dark:divide-gray-800">
                  {recentActivities.map(a => {
                    const revenue = (() => {
                      const settled = parseNum(a.totalRevenue || a.totalAmount);
                      if (settled > 0) return settled;
                      return parseNum(a.metricValue) * parseNum(a.unitPrice || a.item?.defaultUnitPrice);
                    })();
                    return (
                      <tr key={a.id} className="hover:bg-emerald-50/15 dark:hover:bg-emerald-950/10 transition-colors duration-150">
                        <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                            {formatDate(a.activityDate || a.createdAt)}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                          {a.memberName || a.memberUsername || "-"}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-600/10 dark:ring-emerald-500/20">
                            {a.itemName || a.item?.name || "-"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs font-mono font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">{a.metricValue || 0}</td>
                        <td className="px-5 py-3.5 text-xs font-mono font-bold text-gray-950 dark:text-white whitespace-nowrap">{formatCurrency(revenue)}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">{a.notes || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FieldOfficerDashboard;
