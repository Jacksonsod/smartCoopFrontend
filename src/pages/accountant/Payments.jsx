import PaymentTable from "@/components/shared/PaymentTable";
import { useAuth } from "@/context/AuthContext";
import PaymentReferenceAction from "@/components/shared/PaymentReferenceAction";
import ActivityPhoto from "@/components/shared/ActivityPhoto";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  Loader2,
  RefreshCw,
  Shield,
} from "lucide-react";
import api from "@/services/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";

const extractList = (d) => (Array.isArray(d) ? d : Array.isArray(d?.content) ? d.content : Array.isArray(d?.data) ? d.data : []);

const Payments = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canProcess = user?.role === "ACCOUNTANT";
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  const fetchPending = async () => {
    setLoading(true);
    setIsUnauthorized(false);
    try {
      const { data } = await api.get("/payments/pending");
      setActivities(extractList(data));
    } catch (err) {
      if (err.response?.status === 403) {
        setIsUnauthorized(true);
      }
      setActivities([]);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleApprove = async (id, reference) => {
    if (!canProcess || !reference?.trim() || processingId !== null) return;
    setProcessingId(id); setError("");
    try {
      await api.patch(`/payments/${id}/pay`, null, { params: { reference: reference.trim() } });
      setSuccessMsg("Payment approved!"); setTimeout(() => setSuccessMsg(""), 4000);
      fetchPending();
    } catch { setError("Failed to approve payment."); }
    finally { setProcessingId(null); }
  };

  const renderPaymentActions = canProcess ? payment => !['PAID', 'COMPLETED'].includes(payment.status) && (
    <PaymentReferenceAction paymentId={payment.id} busy={processingId === payment.id} disabled={processingId !== null} onConfirm={reference => handleApprove(payment.id, reference)} />
  ) : undefined;
  const tableProps = {
    payments: activities, columns: ['member', 'item', 'quantity', 'amount', 'status'],
    processingId, renderActions: renderPaymentActions,
    renderDetails: payment => <ActivityPhoto activityId={payment.id} />,
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
            <PaymentTable {...tableProps} legacy />
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
      ) : isUnauthorized ? (
        <Card className="py-20 text-center border border-red-100 dark:border-red-900/50 rounded-xl shadow-xs bg-white dark:bg-gray-900">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 mb-4 shadow-sm mx-auto">
            <Shield className="h-7 w-7 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-base font-bold text-gray-900 dark:text-white">Access Denied</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs mx-auto">
            Your account role does not have permission to view or approve pending payments. Please contact your system administrator or log in as an Accountant.
          </p>
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
        <PaymentTable {...tableProps} />
      )}
    </div>
  );
};

export default Payments;
