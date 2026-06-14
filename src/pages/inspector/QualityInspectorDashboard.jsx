import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
// ADDED the updateActivityStatus import here!
import { getCoopActivities, updateActivityStatus } from "@/services/activityService";

const extractList = (d) => (Array.isArray(d) ? d : Array.isArray(d?.content) ? d.content : Array.isArray(d?.data) ? d.data : []);
const greet = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; };
const formatDate = (d) => { if (!d) return "-"; const date = new Date(d); return isNaN(date.getTime()) ? "-" : new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date); };

const StatCard = ({ title, value, icon: Icon, color = "emerald" }) => {
  const colorMap = {
    emerald: { accent: "#10b981", bg: "bg-emerald-50/50", text: "text-emerald-600", border: "border-emerald-100" },
    blue: { accent: "#3b82f6", bg: "bg-blue-50/50", text: "text-blue-600", border: "border-blue-100" },
    amber: { accent: "#f59e0b", bg: "bg-amber-50/50", text: "text-amber-600", border: "border-amber-100" },
    purple: { accent: "#8b5cf6", bg: "bg-purple-50/50", text: "text-purple-600", border: "border-purple-100" },
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

const QualityInspectorDashboard = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await getCoopActivities();
      setActivities(extractList(res?.data));
    } catch { setActivities([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchActivities(); }, []);

  // NEW FUNCTION: Handles the button clicks for Approve/Reject
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateActivityStatus(id, newStatus);
      // Refresh the list immediately after updating!
      await fetchActivities();
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update activity status. Check console for details.");
    }
  };

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayActivities = activities.filter(a => (a.activityDate || a.createdAt || "").slice(0, 10) === today);
    return {
      total: activities.length,
      today: todayActivities.length,
      // Updated this logic to look for the "PENDING" status
      pending: activities.filter(a => !a.status || a.status.toUpperCase() === "PENDING").length,
    };
  }, [activities]);

  const recentActivities = activities.slice(0, 10);

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{greet()}, {user?.fullName || user?.username || "Inspector"}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review and inspect cooperative member activities</p>
          </div>
          <Button variant="outline" className="dark:border-gray-800 dark:hover:bg-gray-900 dark:text-gray-300" onClick={fetchActivities} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Total Activities" value={stats.total} icon={Activity} color="blue" />
          <StatCard title="Today" value={stats.today} icon={CalendarDays} color="emerald" />
          <StatCard title="Pending Review" value={stats.pending} icon={ClipboardCheck} color="amber" />
        </div>

        {/* Activity Feed */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Activities to Review
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
                <div className="py-10 text-center">
                  <ClipboardList className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-650 mb-3" />
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No activities to review</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                    <thead className="bg-gray-50/75 dark:bg-gray-800/70">
                    <tr>
                      {["Date", "Member", "Item / Service", "Quantity", "Notes", "Status / Action"].map(h => (
                          <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{h}</th>
                      ))}
                    </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-50 dark:divide-gray-800">
                    {recentActivities.map(a => (
                        <tr key={a.id} className="hover:bg-emerald-50/15 dark:hover:bg-emerald-950/10 transition-colors duration-150">
                          <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <CalendarDays className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                              {formatDate(a.activityDate || a.createdAt)}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                            {a.memberName || a.memberUsername || a.member?.fullName || a.member?.username || "-"}
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-600/10 dark:ring-emerald-500/20">
                              {a.itemName || a.item?.name || "-"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs font-mono font-medium text-gray-600 dark:text-gray-350 whitespace-nowrap">{a.metricValue || 0}</td>
                          <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">{a.notes || "-"}</td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            {(!a.status || a.status.toUpperCase() === "PENDING") ? (
                                <div className="flex items-center gap-2">
                                  <Button
                                      size="sm"
                                      onClick={() => handleUpdateStatus(a.id, "APPROVED")}
                                      className="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-950/50 border-none h-8 px-3 shadow-none text-xs font-bold rounded-lg transition-colors"
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                      size="sm"
                                      onClick={() => handleUpdateStatus(a.id, "REJECTED")}
                                      className="bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-950/50 border-none h-8 px-3 shadow-none text-xs font-bold rounded-lg transition-colors"
                                  >
                                    Reject
                                  </Button>
                                </div>
                            ) : (
                                <Badge
                                    variant="secondary"
                                    className={
                                      a.status === "APPROVED" || a.status === "PAID" 
                                        ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/20" 
                                        : a.status === "REJECTED" 
                                          ? "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-250 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/20" 
                                          : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-250 dark:border-gray-700 hover:bg-gray-50"
                                    }
                                >
                                  {a.status}
                                </Badge>
                            )}
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

export default QualityInspectorDashboard;