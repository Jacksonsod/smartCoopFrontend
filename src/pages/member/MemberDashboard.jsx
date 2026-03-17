import { useEffect, useMemo, useState } from "react";
import { Banknote, Layers, Package, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMyActivities } from "@/services/activityService";
import api from "@/services/api";

const greet = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; };

const parseNumeric = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getActivityRevenue = (activity) => {
  const directTotal = parseNumeric(activity?.totalAmount);
  if (directTotal > 0) {
    return directTotal;
  }

  const quantity = parseNumeric(activity?.metricValue);
  const unitPrice = parseNumeric(activity?.item?.defaultUnitPrice ?? activity?.defaultUnitPrice);
  return quantity * unitPrice;
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency: "RWF",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
};

const getStatusBadgeClass = (status) => {
  const normalized = String(status || "PENDING").toUpperCase();
  if (normalized === "PAID") {
    return "bg-green-50 text-green-700 hover:bg-green-50 border-green-100";
  }
  if (normalized === "UNPROCESSED") {
    return "bg-orange-50 text-orange-700 hover:bg-orange-50 border-orange-100";
  }
  return "bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200";
};

const extractActivities = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.content)) {
    return payload.content;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

const StatCard = ({ title, value, icon: Icon, accentClass = "text-emerald-600 bg-emerald-50" }) => (
  <Card className="border border-gray-200 shadow-sm">
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accentClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const MemberDashboard = () => {
  const [activities, setActivities] = useState([]);
  const [coopName, setCoopName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchActivities = async () => {
      setLoading(true);
      try {
        const [response] = await Promise.all([
          getMyActivities()
        ]);
        if (mounted) {
          setActivities(extractActivities(response?.data));
        }
      } catch (error) {
        console.error("Failed to load member activities:", error);
        if (mounted) {
          setActivities([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchActivities();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const totalActivities = activities.length;
    const totalVolume = activities.reduce((sum, activity) => sum + parseNumeric(activity?.metricValue), 0);
    const totalRevenue = activities.reduce((sum, activity) => sum + getActivityRevenue(activity), 0);

    return {
      totalActivities,
      totalVolume,
      totalRevenue,
    };
  }, [activities]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {greet()}, {coopName || user?.username || "Member"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Track your deliveries, service records, and payment progress in one place.
        </p>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
          <span className="text-sm text-gray-500">Loading your activity data...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <StatCard title="Total Deliveries / Activities" value={stats.totalActivities} icon={Package} />
            <StatCard title="Total Volume / Units" value={stats.totalVolume.toLocaleString()} icon={Layers} />
            <StatCard
              title="Estimated Revenue (RWF)"
              value={formatCurrency(stats.totalRevenue)}
              icon={Banknote}
              accentClass="text-green-700 bg-green-50"
            />
          </div>

          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 py-10 text-center text-sm text-gray-500">
                  No activities found yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Item / Service</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Revenue (RWF)</TableHead>
                      <TableHead>Payment Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((activity, index) => {
                      const itemName = activity?.item?.name || activity?.itemName || activity?.serviceName || "-";
                      const quantity = parseNumeric(activity?.metricValue);
                      const unit = activity?.item?.unitOfMeasure || activity?.unitOfMeasure || "";
                      const activityDate = activity?.activityDate || activity?.date || activity?.createdAt;
                      const paymentStatus = String(activity?.paymentStatus || activity?.status || "PENDING").toUpperCase();
                      const revenue = getActivityRevenue(activity);

                      return (
                        <TableRow key={activity?.id || `${itemName}-${index}`}>
                          <TableCell className="text-gray-600">{formatDate(activityDate)}</TableCell>
                          <TableCell className="font-medium text-gray-900">{itemName}</TableCell>
                          <TableCell className="text-gray-600">{`${quantity.toLocaleString()} ${unit}`.trim()}</TableCell>
                          <TableCell className="font-medium text-gray-900">{formatCurrency(revenue)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusBadgeClass(paymentStatus)}>
                              {paymentStatus}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default MemberDashboard;

