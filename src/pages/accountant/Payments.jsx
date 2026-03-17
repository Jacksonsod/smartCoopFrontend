import { useEffect, useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  Loader2,
  RefreshCw,
} from "lucide-react";
import api from "@/services/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const extractList = (d) => (Array.isArray(d) ? d : Array.isArray(d?.content) ? d.content : Array.isArray(d?.data) ? d.data : []);
const formatCurrency = (a) => new Intl.NumberFormat("en-RW", { style: "currency", currency: "RWF", maximumFractionDigits: 0 }).format(a || 0);

const Payments = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  const fetchPending = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/payments/pending");
      setActivities(extractList(data));
    } catch { setActivities([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleApprove = async (id) => {
    setProcessingId(id); setError("");
    try {
      await api.patch(`/payments/${id}/approve`);
      setSuccessMsg("Payment approved!"); setTimeout(() => setSuccessMsg(""), 4000);
      fetchPending();
    } catch { setError("Failed to approve payment."); }
    finally { setProcessingId(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Payments</h1>
          <p className="text-sm text-gray-500 mt-1">Approve payments for completed member activities</p>
        </div>
        <Button variant="outline" onClick={fetchPending} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {successMsg && (
        <Alert className="bg-emerald-50 border-emerald-200 text-emerald-700 animate-slide-down">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{successMsg}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="animate-slide-down">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex flex-col items-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mb-2" />
          <p className="text-sm text-gray-400">Loading pending payments...</p>
        </div>
      ) : activities.length === 0 ? (
        <Card className="py-16 text-center">
          <CreditCard className="mx-auto h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-500">No pending payments</p>
          <p className="text-xs text-gray-400 mt-1">All member activities are up to date</p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  {["Member", "Item", "Quantity", "Revenue (RWF)", "Status", "Action"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {activities.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{a.memberName || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{a.itemName || "-"}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-700 whitespace-nowrap">{a.metricValue || 0}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-700 whitespace-nowrap">{formatCurrency(a.revenue || a.totalAmount)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge className={a.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"} variant="secondary">
                        {a.status || "PENDING"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {a.status !== "COMPLETED" && (
                        <Button size="sm" onClick={() => handleApprove(a.id)} disabled={processingId === a.id}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                          {processingId === a.id && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                          Approve
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Payments;
