import { useEffect, useState } from "react";
import {
  BookOpen,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import { FileDown, FileText } from "lucide-react";
import { getAllActivities } from "@/services/activityService";
import {
  downloadActivityReportPdf,
  downloadInvoicePdf,
} from "@/services/documentService";
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

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency: "RWF",
    maximumFractionDigits: 0,
  }).format(amount);

const ActivitiesLedger = () => {
  const [activities, setActivities] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);
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

  const handleDownloadReport = async () => {
    setDownloading(true);
    try {
      await downloadActivityReportPdf();
    } catch (err) {
      alert(err.message || "Failed to download report.");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadInvoice = async (activityId) => {
    setDownloadingInvoiceId(activityId);
    try {
      await downloadInvoicePdf(activityId);
    } catch (err) {
      alert(err.message || "Failed to download invoice.");
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activities Ledger</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              View all cooperative activities and process payments
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadReport}
              disabled={downloading || loading}
              className="gap-2 dark:border-gray-800 dark:hover:bg-gray-900 dark:text-gray-300"
            >
              {downloading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <FileDown className="h-4 w-4" />}
              Download PDF
            </Button>
            <Button variant="outline" className="dark:border-gray-800 dark:hover:bg-gray-900 dark:text-gray-300" onClick={fetchActivities} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <Input placeholder="Search by member name..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {/* Loading */}
        {loading && (
            <div className="flex flex-col items-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mb-2" />
              <p className="text-sm text-gray-400 dark:text-gray-500">Loading activities...</p>
            </div>
        )}

        {/* Empty */}
        {!loading && activities.length === 0 && (
            <Card className="py-16 text-center dark:bg-gray-900 dark:border-gray-800">
              <BookOpen className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-650 mb-3" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No activities found</p>
            </Card>
        )}

        {/* Desktop View (Table) */}
        {!loading && filtered.length > 0 && (
          <Card className="hidden md:block overflow-hidden border border-gray-150 dark:border-gray-850 shadow-xs rounded-xl bg-white dark:bg-gray-900">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                <thead className="bg-gray-50/75 dark:bg-gray-800/70">
                  <tr>
                    {["Date", "Member", "Item", "Qty", "Unit", "Revenue", "Status"].map(h => (
                      <th
                        key={h}
                        className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-50 dark:divide-gray-850">
                  {filtered.map(a => {
                    const currentStatus = (a.status || a.paymentStatus || "UNPROCESSED").toUpperCase();
                    const displayStatus = currentStatus === "UNPROCESSED" ? "PENDING REVIEW" : currentStatus;
                    const memberName = a.memberName || a.memberUsername || a.member?.fullName || a.member?.username || "-";
                    const initial = memberName.charAt(0).toUpperCase();

                    return (
                      <tr key={a.id} className="hover:bg-emerald-50/10 dark:hover:bg-emerald-950/10 transition-colors duration-150">
                        <td className="px-5 py-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatDate(a.date || a.activityDate || a.createdAt)}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                              {initial}
                            </div>
                            <span className="text-xs font-semibold text-gray-900 dark:text-white">{memberName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {a.itemName || "-"}
                        </td>
                        <td className="px-5 py-4 text-xs font-mono font-medium text-gray-600 dark:text-gray-350 whitespace-nowrap">
                          {a.metricValue || 0}
                        </td>
                        <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">
                          <span className="inline-flex items-center rounded-md bg-gray-50 dark:bg-gray-800 px-2 py-1 text-xs font-medium text-gray-650 dark:text-gray-300 ring-1 ring-inset ring-gray-500/10 dark:ring-gray-700/50">
                            {a.unitOfMeasure || "-"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs font-mono font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                          {formatCurrency(a.totalRevenue || a.revenue || 0)}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                currentStatus === "PAID" ? "bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900" :
                                currentStatus === "APPROVED" ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border-emerald-200 dark:border-emerald-900" :
                                currentStatus === "REJECTED" ? "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900" :
                                "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900"
                              }
                            >
                              {displayStatus}
                            </Badge>

                            {user?.role === "ACCOUNTANT" && currentStatus === "APPROVED" && (
                              <Button
                                size="sm"
                                onClick={() => handleProcess(a.id)}
                                disabled={processingId === a.id}
                                className="text-xs bg-blue-600 hover:bg-blue-700 text-white h-8 px-3 rounded-lg"
                              >
                                {processingId === a.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                                Make Payment
                              </Button>
                            )}

                            {currentStatus === "PAID" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadInvoice(a.id)}
                                disabled={downloadingInvoiceId === a.id}
                                className="text-xs h-8 px-2.5 gap-1 rounded-lg dark:border-gray-800 dark:hover:bg-gray-800 dark:text-gray-300"
                              >
                                {downloadingInvoiceId === a.id
                                  ? <Loader2 className="h-3 w-3 animate-spin" />
                                  : <FileText className="h-3 w-3" />}
                                Invoice
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Mobile View (Card List) */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filtered.map(a => {
              const currentStatus = (a.status || a.paymentStatus || "UNPROCESSED").toUpperCase();
              const displayStatus = currentStatus === "UNPROCESSED" ? "PENDING REVIEW" : currentStatus;
              const memberName = a.memberName || a.memberUsername || a.member?.fullName || a.member?.username || "-";
              const initial = memberName.charAt(0).toUpperCase();

              return (
                <div key={a.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-150 dark:border-gray-800 p-4 shadow-xs space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-semibold">
                        {initial}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{memberName}</p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">{formatDate(a.date || a.activityDate || a.createdAt)}</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        currentStatus === "PAID" ? "bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900 text-[10px]" :
                        currentStatus === "APPROVED" ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border-emerald-200 dark:border-emerald-900 text-[10px]" :
                        currentStatus === "REJECTED" ? "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900 text-[10px]" :
                        "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900 text-[10px]"
                      }
                    >
                      {displayStatus}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs border-y border-gray-50 dark:border-gray-800 py-2.5">
                    <div>
                      <span className="text-gray-455 block text-[10px] uppercase font-bold text-gray-400 dark:text-gray-550">Item</span>
                      <span className="text-gray-800 dark:text-gray-300 font-medium">{a.itemName || "-"}</span>
                    </div>
                    <div>
                      <span className="text-gray-455 block text-[10px] uppercase font-bold text-gray-400 dark:text-gray-550">Quantity</span>
                      <span className="text-gray-800 dark:text-gray-350 font-mono font-medium">{a.metricValue || 0} {a.unitOfMeasure || ""}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <div>
                      <span className="text-gray-455 block text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">Revenue</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">
                        {formatCurrency(a.totalRevenue || a.revenue || 0)}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {user?.role === "ACCOUNTANT" && currentStatus === "APPROVED" && (
                        <Button
                          size="sm"
                          onClick={() => handleProcess(a.id)}
                          disabled={processingId === a.id}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3 rounded-lg"
                        >
                          {processingId === a.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                          Pay
                        </Button>
                      )}

                      {currentStatus === "PAID" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadInvoice(a.id)}
                          disabled={downloadingInvoiceId === a.id}
                          className="text-xs h-8 px-2.5 gap-1 rounded-lg dark:border-gray-800 dark:hover:bg-gray-800 dark:text-gray-300"
                        >
                          {downloadingInvoiceId === a.id
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <FileText className="h-3 w-3" />}
                          Invoice
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
  );
};

export default ActivitiesLedger;