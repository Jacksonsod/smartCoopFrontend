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
            <h1 className="text-2xl font-bold text-gray-900">{greet()}, {user?.fullName || user?.username || "Inspector"}</h1>
            <p className="text-sm text-gray-500 mt-1">Review and inspect cooperative member activities</p>
          </div>
          <Button variant="outline" onClick={fetchActivities} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
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
                  <ClipboardList className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                  <p className="text-sm font-medium text-gray-500">No activities to review</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                    <tr className="border-b">
                      {/* Updated the final column header */}
                      {["Date", "Member", "Item / Service", "Quantity", "Notes", "Status / Action"].map(h => (
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
                            {/* Now that the 403 error is fixed, this will actually show the name! */}
                            {a.memberName || a.memberUsername || a.member?.fullName || a.member?.username || "-"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge className="bg-emerald-50 text-emerald-700" variant="secondary">
                              {a.itemName || a.item?.name || "-"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-700 whitespace-nowrap">{a.metricValue || 0}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{a.notes || "-"}</td>

                          {/* NEW LOGIC: Show buttons if pending, show badge if already graded */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {(!a.status || a.status.toUpperCase() === "PENDING") ? (
                                <div className="flex items-center gap-2">
                                  <Button
                                      size="sm"
                                      onClick={() => handleUpdateStatus(a.id, "APPROVED")}
                                      className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none h-8 px-3 shadow-none"
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                      size="sm"
                                      onClick={() => handleUpdateStatus(a.id, "REJECTED")}
                                      className="bg-red-100 text-red-700 hover:bg-red-200 border-none h-8 px-3 shadow-none"
                                  >
                                    Reject
                                  </Button>
                                </div>
                            ) : (
                                <Badge
                                    variant="secondary"
                                    className={
                                      a.status === "APPROVED" || a.status === "PAID" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                          a.status === "REJECTED" ? "bg-red-50 text-red-700 border border-red-200" :
                                              "bg-gray-50 text-gray-700 border border-gray-200"
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