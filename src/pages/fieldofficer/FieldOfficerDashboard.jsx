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
  const cls = { emerald: "text-emerald-600 bg-emerald-50", blue: "text-blue-600 bg-blue-50", amber: "text-amber-600 bg-amber-50", purple: "text-purple-600 bg-purple-50" }[color];
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{title}</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${cls}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
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
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mb-2" />
        <p className="text-sm text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greet()}, {user?.fullName || user?.username || "Field Officer"}</h1>
          <p className="text-sm text-gray-500 mt-1">Record member activities and manage cooperative members</p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link to="/activities">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <ClipboardList className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Record Activity</p>
                <p className="text-xs text-gray-500 mt-0.5">Log a member delivery or service</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/users">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-blue-200 bg-blue-50/50">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white">
                <UserPlus className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Add Member</p>
                <p className="text-xs text-gray-500 mt-0.5">Register a new cooperative member</p>
              </div>
            </CardContent>
          </Card>
        </Link>
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
            <div className="py-10 text-center">
              <ClipboardList className="mx-auto h-10 w-10 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-500">No activities recorded yet</p>
              <p className="text-xs text-gray-400 mt-1">Start by recording a member activity</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    {["Date", "Member", "Item", "Quantity", "Revenue", "Notes"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentActivities.map(a => {
                    const revenue = (() => {
                      const settled = parseNum(a.totalRevenue || a.totalAmount);
                      if (settled > 0) return settled;
                      return parseNum(a.metricValue) * parseNum(a.unitPrice || a.item?.defaultUnitPrice);
                    })();
                    return (
                      <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5 text-gray-300" />
                            {formatDate(a.activityDate || a.createdAt)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                          {a.memberName || a.memberUsername || "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge className="bg-emerald-50 text-emerald-700" variant="secondary">
                            {a.itemName || a.item?.name || "-"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-700 whitespace-nowrap">{a.metricValue || 0}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{formatCurrency(revenue)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{a.notes || "-"}</td>
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
