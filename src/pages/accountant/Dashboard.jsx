import ActivityPhoto from "@/components/shared/ActivityPhoto";
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
import { getAllActivities } from "@/services/activityService";
import StatCard from "@/components/shared/StatCard";
import ResponsiveTable from "@/components/shared/ResponsiveTable";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { useTranslation } from "react-i18next";

const extractList = (d) => (Array.isArray(d) ? d : Array.isArray(d?.content) ? d.content : Array.isArray(d?.data) ? d.data : []);
const formatCurrency = (a) => new Intl.NumberFormat("en-RW", { style: "currency", currency: "RWF", maximumFractionDigits: 0 }).format(a || 0);

const AccountantDashboard = () => {
  const { t } = useTranslation();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const aRes = await getAllActivities();
        setActivities(extractList(aRes?.data));
      } catch { /* fail silently */ }
      finally { setLoading(false); }
    })();
  }, []);

  const getStatus = (a) => (a.status || a.paymentStatus || "UNPROCESSED").toUpperCase();

  const paidActivities = activities.filter(a => getStatus(a) === "PAID");
  const approvedActivities = activities.filter(a => getStatus(a) === "APPROVED");

  const totalPayments = paidActivities.length;
  const pendingPayouts = approvedActivities.length;

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
        <p className="text-sm text-gray-400">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t("accountantDash.title")}
        subtitle={t("accountantDash.subtitle")}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label={t("accountantDash.totalPayments")} value={totalPayments} icon={CreditCard} color="blue" />
        <StatCard label={t("accountantDash.pendingPayouts")} value={pendingPayouts} icon={CalendarDays} color="amber" />
        <StatCard label={t("accountantDash.totalRevenue")} value={formatCurrency(totalRevenue)} icon={TrendingUp} color="emerald" />
      </div>

      {/* Recent Payments */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader className="pb-3 border-b dark:border-gray-800">
          <CardTitle className="flex items-center gap-2 text-base text-gray-900 dark:text-white">
            <Banknote className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> {t("accountantDash.recentPayments")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {recentPayments.length === 0 ? (
            <EmptyState title={t("accountantDash.noPayments")} subtitle={t("accountantDash.noPaymentsSubtitle")} />
          ) : (
            <ResponsiveTable minWidth="540px" className="rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                <thead className="bg-gray-50/75 dark:bg-gray-800/70">
                <tr>
                  {[t("accountantDash.col.date"), t("accountantDash.col.member"), t("accountantDash.col.item"), t("accountantDash.col.qty"), t("accountantDash.col.amount")].map(h => (
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
            </ResponsiveTable>
          )}
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader className="pb-3 border-b dark:border-gray-800">
          <CardTitle className="text-base text-gray-900 dark:text-white">{t("accountantDash.recentActivities")}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {recentActivities.length === 0 ? (
            <EmptyState title={t("accountantDash.noActivities")} />
          ) : (
            <ResponsiveTable minWidth="500px" className="rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                <thead className="bg-gray-50/75 dark:bg-gray-800/70">
                <tr>
                  {[t("accountantDash.col.date"), t("accountantDash.col.member"), t("accountantDash.col.type"), t("accountantDash.col.status")].map(h => (
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
                          {t("status." + status, status === "UNPROCESSED" ? "PENDING REVIEW" : status)}
                        </Badge><ActivityPhoto activityId={a.id} />
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </ResponsiveTable>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountantDashboard;