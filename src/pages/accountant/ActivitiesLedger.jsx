import { useEffect, useState } from "react";
import {
  BookOpen,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import { getAllActivities } from "@/services/activityService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";

const extractList = (d) => (Array.isArray(d) ? d : Array.isArray(d?.content) ? d.content : Array.isArray(d?.data) ? d.data : []);

const formatDate = (d) => {
  if (!d) return "-";
  const date = new Date(d);
  return isNaN(date.getTime()) ? "-" : new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "short", day: "2-digit" }).format(date);
};

const ActivitiesLedger = () => {
  const [activities, setActivities] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const { user } = useAuth();

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const { data } = await getAllActivities();
      setActivities(extractList(data));
    } catch { setActivities([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchActivities(); }, []);

  const filtered = activities.filter(a =>
      !search || (a.memberName || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleProcess = async (id) => {
    setProcessingId(id);
    try {
      await api.patch(`/activities/${id}/pay`);
      await fetchActivities(); // Instantly refresh the table to show the new PAID status!
    } catch {
      alert("Failed to process payment. Ensure the activity is approved.");
    }
    finally { setProcessingId(null); }
  };

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Activities Ledger</h1>
            <p className="text-sm text-gray-500 mt-1">View all cooperative activities and process payments</p>
          </div>
          <Button variant="outline" onClick={fetchActivities} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search by member name..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {/* Loading */}
        {loading && (
            <div className="flex flex-col items-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mb-2" />
              <p className="text-sm text-gray-400">Loading activities...</p>
            </div>
        )}

        {/* Empty */}
        {!loading && activities.length === 0 && (
            <Card className="py-16 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-500">No activities found</p>
            </Card>
        )}

        {/* Table */}
        {!loading && filtered.length > 0 && (
            <Card>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                  <tr className="border-b">
                    {["Date", "Member", "Item", "Qty", "Unit", "Revenue", "Status"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">{h}</th>
                    ))}
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                  {filtered.map(a => {
                    // THE FIX: Cleanly checking the true status without any hacks
                    const currentStatus = (a.status || a.paymentStatus || "UNPROCESSED").toUpperCase();

                    // Optional: Make "UNPROCESSED" read nicely as "PENDING REVIEW" for the Accountant
                    const displayStatus = currentStatus === "UNPROCESSED" ? "PENDING REVIEW" : currentStatus;

                    return (
                        <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(a.date || a.activityDate || a.createdAt)}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{a.memberName || "-"}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{a.itemName || "-"}</td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-700 whitespace-nowrap">{a.metricValue || 0}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{a.unitOfMeasure || "-"}</td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-700 whitespace-nowrap">{a.totalRevenue || a.revenue || "-"}</td>
                          <td className="px-4 py-3 whitespace-nowrap flex items-center gap-2">

                            {/* Dynamic Badges */}
                            <Badge
                                variant="outline"
                                className={
                                  currentStatus === "PAID" ? "bg-purple-50 text-purple-700 border-purple-200" :
                                      currentStatus === "APPROVED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                          currentStatus === "REJECTED" ? "bg-red-50 text-red-700 border-red-200" :
                                              "bg-amber-50 text-amber-700 border-amber-200"
                                }
                            >
                              {displayStatus}
                            </Badge>

                            {/* Button ONLY appears if legally APPROVED */}
                            {user?.role === "ACCOUNTANT" && currentStatus === "APPROVED" && (
                                <Button
                                    size="sm"
                                    onClick={() => handleProcess(a.id)}
                                    disabled={processingId === a.id}
                                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white h-8 px-3"
                                >
                                  {processingId === a.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                                  Make Payment
                                </Button>
                            )}

                          </td>
                        </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
            </Card>
        )}
      </div>
  );
};

export default ActivitiesLedger;