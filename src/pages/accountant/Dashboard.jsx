import { useEffect, useState } from "react";
import {
  Banknote,
  CalendarDays,
  CreditCard,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { getAllActivities } from "@/services/activityService"; // Removed paymentService

const extractList = (d) => (Array.isArray(d) ? d : Array.isArray(d?.content) ? d.content : Array.isArray(d?.data) ? d.data : []);

const formatCurrency = (a) => new Intl.NumberFormat("en-RW", { style: "currency", currency: "RWF", maximumFractionDigits: 0 }).format(a || 0);

const StatCard = ({ title, value, icon: Icon, color = "emerald" }) => {
  const colorMap = {
    emerald: { accent: "#10b981", bg: "bg-emerald-50/50", text: "text-emerald-600", border: "border-emerald-100" },
    blue: { accent: "#3b82f6", bg: "bg-blue-50/50", text: "text-blue-600", border: "border-blue-100" },
    amber: { accent: "#f59e0b", bg: "bg-amber-50/50", text: "text-amber-600", border: "border-amber-100" },
  };
  const cmap = colorMap[color] || colorMap.emerald;
  return (
      <Card className={`overflow-hidden border ${cmap.border} dark:border-gray-850 bg-white dark:bg-gray-900 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group`}>
        <CardContent className="p-6 relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-550">{title}</p>
              <p className="mt-3 text-3xl font-extrabold text-gray-950 dark:text-white tracking-tight">{value}</p>
            </div>
            <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${cmap.bg} dark:bg-gray-800 ${cmap.text} dark:text-emerald-450 transition-all duration-300 group-hover:scale-110`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
          {/* Decorative colored glow on the side */}
          <div className="absolute right-0 top-0 bottom-0 w-[3px] transition-all duration-300" style={{ backgroundColor: cmap.accent }} />
        </CardContent>
      </Card>
  );
};

const AccountantDashboard = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Fetch only activities, since they now contain all payment data!
        const aRes = await getAllActivities();
        setActivities(extractList(aRes?.data));
      } catch { /* fail silently */ }
      finally { setLoading(false); }
    })();
  }, []);

  // --- THE NEW MATH LOGIC ---
  const getStatus = (a) => (a.status || a.paymentStatus || "UNPROCESSED").toUpperCase();

  const paidActivities = activities.filter(a => getStatus(a) === "PAID");
  const approvedActivities = activities.filter(a => getStatus(a) === "APPROVED");

  const totalPayments = paidActivities.length;
  const pendingPayouts = approvedActivities.length; // Activities waiting for the accountant to pay

  // Sum up revenue ONLY for activities that have been marked as PAID
  const totalRevenue = paidActivities.reduce((sum, a) => sum + (a.totalRevenue || a.revenue || 0), 0);

  const recentPayments = paidActivities.slice(0, 5);
  const recentActivities = activities.slice(0, 10);

  const formatDate = (d) => {
    if (!d) return "-";
    const date = new Date(d);
    return isNaN(date.getTime()) ? "-" : new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "short", day: "2-digit" }).format(date);
  };

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Accountant Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Financial overview and recent payment activity</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Total Payments" value={totalPayments} icon={CreditCard} color="blue" />
          <StatCard title="Pending Payouts" value={pendingPayouts} icon={CalendarDays} color="amber" />
          <StatCard title="Total Revenue" value={formatCurrency(totalRevenue)} icon={TrendingUp} color="emerald" />
        </div>

        {/* Recent Payments (Now pulling from Paid Activities) */}
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader className="pb-3 border-b dark:border-gray-800">
            <CardTitle className="flex items-center gap-2 text-base text-gray-900 dark:text-white">
              <Banknote className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Recent Payments
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {recentPayments.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">No recent payments found</div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
                  <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                    <thead className="bg-gray-50/75 dark:bg-gray-800/70">
                    <tr>
                      {["Date", "Member", "Item", "Qty", "Amount"].map(h => (
                          <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{h}</th>
                      ))}
                    </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-50 dark:divide-gray-850">
                    {recentPayments.map(p => (
                        <tr key={p.id} className="hover:bg-emerald-50/15 dark:hover:bg-emerald-950/10 transition-colors duration-150">
                          <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(p.date || p.createdAt)}</td>
                          <td className="px-5 py-3.5 text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                            {p.memberUsername || p.memberName || p.username || "-"}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-600/10 dark:ring-emerald-500/20">
                              {p.itemName || "-"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs font-mono font-medium text-gray-600 dark:text-gray-350 whitespace-nowrap">{p.metricValue || 0}</td>
                          <td className="px-5 py-3.5 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            {formatCurrency(p.totalRevenue || p.revenue)}
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader className="pb-3 border-b dark:border-gray-800">
            <CardTitle className="text-base text-gray-900 dark:text-white">Recent Activities</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {recentActivities.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">No activities found</div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
                  <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                    <thead className="bg-gray-50/75 dark:bg-gray-800/70">
                    <tr>
                      {["Date", "Member", "Type", "Status"].map(h => (
                          <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{h}</th>
                      ))}
                    </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-50 dark:divide-gray-850">
                    {recentActivities.map(a => {
                      const status = getStatus(a);
                      return (
                          <tr key={a.id} className="hover:bg-emerald-50/15 dark:hover:bg-emerald-950/10 transition-colors duration-150">
                            <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              {formatDate(a.createdAt || a.activityDate)}
                            </td>
                            <td className="px-5 py-3.5 text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                              {a.memberUsername || a.memberName || a.username || "-"}
                            </td>
                            <td className="px-5 py-3.5 text-xs text-gray-750 dark:text-gray-300 whitespace-nowrap">{a.type || a.itemName || "-"}</td>
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <Badge
                                  variant="outline"
                                  className={
                                    status === "PAID" 
                                      ? "bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900 hover:bg-purple-50 dark:hover:bg-purple-950/20" 
                                      : status === "APPROVED" 
                                        ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border-emerald-200 dark:border-emerald-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/20" 
                                        : status === "REJECTED" 
                                          ? "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/20" 
                                          : "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                                  }
                              >
                                {status === "UNPROCESSED" ? "PENDING REVIEW" : status}
                              </Badge>
                            </td>
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

export default AccountantDashboard;