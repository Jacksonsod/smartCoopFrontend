import { useEffect, useState } from "react";
import {
  CreditCard,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { getAllPayments, updatePaymentStatus } from "@/services/paymentService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const extractList = (d) => (Array.isArray(d) ? d : Array.isArray(d?.content) ? d.content : Array.isArray(d?.data) ? d.data : []);
const formatDate = (d) => { if (!d) return "-"; const date = new Date(d); return isNaN(date.getTime()) ? "-" : new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "short", day: "2-digit" }).format(date); };
const formatCurrency = (a) => new Intl.NumberFormat("en-RW", { style: "currency", currency: "RWF", maximumFractionDigits: 0 }).format(a || 0);

const PaymentsManagement = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data } = await getAllPayments();
      setPayments(extractList(data));
    } catch { setPayments([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPayments(); }, []);

  const handleMarkAsPaid = async (id) => {
    setProcessingId(id);
    try {
      await updatePaymentStatus(id, "COMPLETED");
      setSuccessMsg("Payment marked as completed!"); setTimeout(() => setSuccessMsg(""), 4000);
      fetchPayments();
    } catch { /* silently handle */ }
    finally { setProcessingId(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments Management</h1>
          <p className="text-sm text-gray-500 mt-1">View and process all cooperative payments</p>
        </div>
        <Button variant="outline" onClick={fetchPayments} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {successMsg && (
        <Alert className="bg-emerald-50 border-emerald-200 text-emerald-700 animate-slide-down">
          <AlertDescription>{successMsg}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex flex-col items-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mb-2" />
          <p className="text-sm text-gray-400">Loading payments...</p>
        </div>
      ) : payments.length === 0 ? (
        <Card className="py-16 text-center">
          <CreditCard className="mx-auto h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-500">No payments found</p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  {["Date", "Member", "Amount", "Method", "Status", "Action"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map(p => (
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
                    <td className="px-4 py-3 whitespace-nowrap">
                      {p.status === "PENDING" && (
                        <Button size="sm" onClick={() => handleMarkAsPaid(p.id)} disabled={processingId === p.id}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                          {processingId === p.id && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                          Mark Paid
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

export default PaymentsManagement;
