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
import { getAllPayments } from "@/services/paymentService";
import { getAllActivities } from "@/services/activityService";

const extractList = (d) => (Array.isArray(d) ? d : Array.isArray(d?.content) ? d.content : Array.isArray(d?.data) ? d.data : []);

const formatCurrency = (a) => new Intl.NumberFormat("en-RW", { style: "currency", currency: "RWF", maximumFractionDigits: 0 }).format(a || 0);

const StatCard = ({ title, value, icon: Icon, color = "emerald" }) => {
  const cls = {
    emerald: "text-emerald-600 bg-emerald-50",
    amber: "text-amber-600 bg-amber-50",
    blue: "text-blue-600 bg-blue-50",
  }[color] || "text-emerald-600 bg-emerald-50";
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

const AccountantDashboard = () => {
  const [payments, setPayments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [pRes, aRes] = await Promise.all([getAllPayments(), getAllActivities()]);
        setPayments(extractList(pRes?.data));
        setActivities(extractList(aRes?.data));
      } catch { /* fail silently */ }
      finally { setLoading(false); }
    })();
  }, []);

  const totalPayments = payments.length;
  const totalRevenue = payments.filter(p => p.status === "COMPLETED").reduce((s, p) => s + (p.amount || 0), 0);
  const pendingPayouts = payments.filter(p => p.status === "PENDING").length;
  const recentPayments = payments.slice(0, 5);
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
        <h1 className="text-2xl font-bold text-gray-900">Accountant Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Financial overview and recent payment activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard title="Total Payments" value={totalPayments} icon={CreditCard} color="blue" />
        <StatCard title="Pending Payouts" value={pendingPayouts} icon={CalendarDays} color="amber" />
        <StatCard title="Total Revenue" value={formatCurrency(totalRevenue)} icon={TrendingUp} color="emerald" />
      </div>

      {/* Recent Payments */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Banknote className="h-4 w-4 text-emerald-600" /> Recent Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentPayments.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">No payments found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    {["Date", "Member", "Amount", "Method", "Status"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentPayments.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(p.date || p.createdAt)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{p.memberName || "-"}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-700 whitespace-nowrap">{formatCurrency(p.amount)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{p.method || "-"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge className={p.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"} variant="secondary">
                          {p.status}
                        </Badge>
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
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">No activities found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    {["Date", "Type", "Amount", "Notes"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentActivities.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(a.createdAt || a.activityDate)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{a.type || a.itemName || "-"}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-700 whitespace-nowrap">{a.amount || a.metricValue || 0}</td>
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

export default AccountantDashboard;
