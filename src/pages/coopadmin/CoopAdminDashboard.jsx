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
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { getMyCoopStaff } from "@/services/userService";
import { getCoopActivities } from "@/services/activityService";
import { getAllItems } from "@/services/itemService";
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

const StatCard = ({ title, value, subtext, icon: Icon, color = "emerald" }) => {
  const cls = { emerald: "text-emerald-600 bg-emerald-50", blue: "text-blue-600 bg-blue-50", amber: "text-amber-600 bg-amber-50", purple: "text-purple-600 bg-purple-50" }[color];
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{title}</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
            {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${cls}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const CoopAdminDashboard = () => {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [activities, setActivities] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [sRes, aRes, iRes] = await Promise.all([getMyCoopStaff(), getCoopActivities(), getAllItems()]);
        setStaff(extractList(sRes?.data));
        setActivities(extractList(aRes?.data));
        setItems(extractList(iRes?.data));
      } catch { /* silently fail */ }
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{greet()}, {user?.fullName || user?.username || "Admin"}</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your cooperative members, activities, and operations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Members" value={stats.memberCount} icon={Users} color="blue" />
        <StatCard title="Staff" value={stats.staffCount} icon={UserPlus} color="purple" />
        <StatCard title="Activities" value={stats.totalActivities} icon={Activity} color="emerald" />
        <StatCard title="Catalog Items" value={stats.activeItems} icon={Package} color="amber" />
      </div>

      {/* Revenue Card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Revenue</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-xs text-gray-400 mt-1">{stats.totalVolume.toLocaleString()} units processed</p>
            </div>
            <TrendingUp className="h-8 w-8 text-emerald-300" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Activities</CardTitle>
            <Link to="/activities">
              <Button size="sm" variant="outline" className="text-xs">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">No activities yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    {["Date", "Member", "Item", "Quantity", "Notes"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentActivities.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 text-gray-300" />
                          {formatDate(a.activityDate || a.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {a.memberName || a.memberUsername || a.member?.fullName || "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge className="bg-emerald-50 text-emerald-700" variant="secondary">
                          {a.itemName || a.item?.name || "-"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-700 whitespace-nowrap">{a.metricValue}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{a.notes || "-"}</td>
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
