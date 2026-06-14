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
      await api.patch(`/payments/${id}/pay?reference=`);
      setSuccessMsg("Payment approved!"); setTimeout(() => setSuccessMsg(""), 4000);
      fetchPending();
    } catch { setError("Failed to approve payment."); }
    finally { setProcessingId(null); }
  };

  const isLegacy = localStorage.getItem("designMode") === "legacy";

  if (isLegacy) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pending Payments</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Approve payments for completed member activities</p>
          </div>
          <Button variant="outline" className="dark:border-gray-800 dark:hover:bg-gray-900 dark:text-gray-300" onClick={fetchPending} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        {successMsg && (
          <Alert className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-450 animate-slide-down">
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
            <p className="text-sm text-gray-400 dark:text-gray-500">Loading pending payments...</p>
          </div>
        ) : activities.length === 0 ? (
          <Card className="py-16 text-center dark:bg-gray-900 dark:border-gray-800">
            <CreditCard className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-650 mb-3" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No pending payments</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">All member activities are up to date</p>
          </Card>
        ) : (
          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b dark:border-gray-800">
                    {["Member", "Item", "Quantity", "Revenue (RWF)", "Status", "Action"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {activities.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">{a.memberName || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{a.itemName || "-"}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-700 dark:text-gray-350 whitespace-nowrap">{a.metricValue || 0}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-700 dark:text-gray-300 whitespace-nowrap">{formatCurrency(a.revenue || a.totalAmount)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge className={
                          a.status === "COMPLETED" 
                            ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 dark:border-emerald-900/50" 
                            : "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-450 dark:border-amber-900/50"
                        } variant="secondary">
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
  }

  // ─── Modernized Render ────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Pending Payments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Approve payments for completed member activities</p>
        </div>
        <Button
          variant="outline"
          onClick={fetchPending}
          disabled={loading}
          className="rounded-xl border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 gap-2 text-xs font-bold dark:text-gray-300 dark:hover:text-white"
        >
          <RefreshCw className={`h-4 w-4 text-gray-550 dark:text-gray-400 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Alerts */}
      {successMsg && (
        <Alert className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-450 animate-slide-down rounded-xl shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <AlertDescription className="font-medium text-xs">{successMsg}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="animate-slide-down rounded-xl shadow-xs">
          <AlertDescription className="font-medium text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {/* States */}
      {loading ? (
        <Card className="border border-gray-100 dark:border-gray-800 rounded-xl shadow-xs bg-white dark:bg-gray-900">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-emerald-500 dark:text-emerald-400 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading pending payments...</p>
          </div>
        </Card>
      ) : activities.length === 0 ? (
        <Card className="py-20 text-center border border-gray-100 dark:border-gray-800 rounded-xl shadow-xs bg-white dark:bg-gray-900">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 mb-4 shadow-sm mx-auto">
            <CreditCard className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-base font-bold text-gray-955 dark:text-white">All caught up!</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 max-w-xs mx-auto">No pending payments. All member activities are fully processed.</p>
        </Card>
      ) : (
        <>
          <Card className="hidden md:block overflow-hidden border border-gray-150 dark:border-gray-800 shadow-xs rounded-xl bg-white dark:bg-gray-900">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-850">
                <thead className="bg-gray-50/75 dark:bg-gray-800/70">
                  <tr>
                    {["Member", "Item", "Quantity", "Revenue", "Status", "Action"].map(h => (
                      <th
                        key={h}
                        className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800 bg-white dark:bg-gray-900">
                  {activities.map(a => {
                    const memberName = a.memberName || "-";
                    const initial = memberName.charAt(0).toUpperCase();

                    return (
                      <tr key={a.id} className="hover:bg-emerald-50/10 dark:hover:bg-emerald-950/10 transition-colors duration-150">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-xs">
                              {initial}
                            </div>
                            <span className="text-xs font-semibold text-gray-900 dark:text-white">{memberName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {a.itemName || "—"}
                        </td>
                        <td className="px-5 py-4 text-xs font-mono font-medium text-gray-650 dark:text-gray-400 whitespace-nowrap">
                          {a.metricValue || 0}
                        </td>
                        <td className="px-5 py-4 text-xs font-mono font-bold text-gray-950 dark:text-white whitespace-nowrap">
                          {formatCurrency(a.revenue || a.totalAmount)}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <Badge
                            className={
                              a.status === "COMPLETED"
                                ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-250 dark:border-emerald-900 text-[10px]"
                                : "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-450 border-amber-250 dark:border-amber-900 text-[10px]"
                            }
                            variant="outline"
                          >
                            {a.status || "PENDING"}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {a.status !== "COMPLETED" && (
                            <Button
                              size="sm"
                              onClick={() => handleApprove(a.id)}
                              disabled={processingId === a.id}
                              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 h-8 rounded-lg shadow-xs active:scale-[0.98] transition-transform duration-100 flex items-center justify-center gap-1"
                            >
                              {processingId === a.id && <Loader2 className="h-3 w-3 animate-spin" />}
                              Approve
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

          <div className="grid grid-cols-1 gap-4 md:hidden">
            {activities.map(a => {
              const memberName = a.memberName || "-";
              const initial = memberName.charAt(0).toUpperCase();

              return (
                <div
                  key={a.id}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-150 dark:border-gray-800 p-4 shadow-xs space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-semibold shadow-xs">
                        {initial}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{memberName}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-550 font-medium">Activity Payment</p>
                      </div>
                    </div>
                    <Badge
                      className={
                        a.status === "COMPLETED"
                          ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-250 dark:border-emerald-900 text-[10px]"
                          : "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-450 border-amber-250 dark:border-amber-900 text-[10px]"
                      }
                      variant="outline"
                    >
                      {a.status || "PENDING"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs border-y border-gray-50 dark:border-gray-800 py-2.5">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-550 block tracking-wider">Item</span>
                      <span className="text-gray-800 dark:text-gray-300 font-medium">{a.itemName || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-550 block tracking-wider">Quantity</span>
                      <span className="text-gray-800 dark:text-gray-350 font-mono font-medium">{a.metricValue || 0}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-550 block tracking-wider">Revenue</span>
                      <span className="text-sm font-bold text-gray-950 dark:text-white font-mono">
                        {formatCurrency(a.revenue || a.totalAmount)}
                      </span>
                    </div>

                    {a.status !== "COMPLETED" && (
                      <Button
                        size="sm"
                        onClick={() => handleApprove(a.id)}
                        disabled={processingId === a.id}
                        className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 h-8.5 rounded-lg shadow-xs active:scale-[0.98] transition-transform duration-100 flex items-center justify-center gap-1"
                      >
                        {processingId === a.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Approve
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Payments;
