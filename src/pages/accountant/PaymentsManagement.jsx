// src/pages/accountant/PaymentsManagement.jsx
import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  FileDown,
  Loader2,
  RefreshCw,
  Smartphone,
  X,
} from "lucide-react";
import { getPendingPayments, markPaymentAsPaid } from "@/services/paymentService";
import { downloadPaymentSummaryExcel } from "@/services/documentService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ─── Helpers ────────────────────────────────────────────────────────────────

const extractList = (d) =>
  Array.isArray(d)
    ? d
    : Array.isArray(d?.content)
    ? d.content
    : Array.isArray(d?.data)
    ? d.data
    : [];

const formatDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  return isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-GB", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      }).format(date);
};

const formatCurrency = (a) =>
  new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency: "RWF",
    maximumFractionDigits: 0,
  }).format(a || 0);

// ─── Inline Toast System ─────────────────────────────────────────────────────

const TOAST_DURATION_MS = 5000;

let _toastId = 0;

const useToasts = () => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
  };

  const addToast = (message, type = "success") => {
    const id = ++_toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    timers.current[id] = setTimeout(() => dismiss(id), TOAST_DURATION_MS);
  };

  const toast = {
    success: (msg) => addToast(msg, "success"),
    error: (msg) => addToast(msg, "error"),
  };

  return { toasts, toast, dismiss };
};

const ToastContainer = ({ toasts, dismiss }) => (
  <div
    aria-live="polite"
    className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]"
  >
    {toasts.map(({ id, message, type }) => (
      <div
        key={id}
        role="alert"
        className={`
          flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg
          animate-in slide-in-from-bottom-4 fade-in duration-300
          ${
            type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }
        `}
      >
        {type === "success" ? (
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" />
        ) : (
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-600" />
        )}
        <p className="text-sm flex-1 leading-snug">{message}</p>
        <button
          onClick={() => dismiss(id)}
          className="ml-auto shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    ))}
  </div>
);

// ─── Stat Card ───────────────────────────────────────────────────────────────

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <Card className="overflow-hidden">
    <CardContent className="p-0">
      <div className="flex items-center gap-4 p-5">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colorClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 truncate">
            {title}
          </p>
          <p className="mt-0.5 text-2xl font-bold text-gray-900 truncate">{value}</p>
        </div>
      </div>
      <div className={`h-1 w-full ${colorClass.includes("amber") ? "bg-amber-400" : colorClass.includes("blue") ? "bg-blue-400" : "bg-emerald-400"}`} />
    </CardContent>
  </Card>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const s = (status || "").toUpperCase();
  const styles = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
    FAILED: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <Badge variant="outline" className={styles[s] ?? "bg-gray-50 text-gray-600 border-gray-200"}>
      {s}
    </Badge>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const PaymentsManagement = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [exporting, setExporting] = useState(false);

  const { toasts, toast, dismiss } = useToasts();

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data } = await getPendingPayments();
      setPayments(extractList(data));
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // ── Approve Payout ───────────────────────────────────────────────────────
  const handleApprovePayout = async (payment) => {
    const id = payment.id;
    setProcessingId(id);
    try {
      await markPaymentAsPaid(id, "");
      // Optimistic UI: remove from list immediately
      setPayments((prev) => prev.filter((p) => p.id !== id));
      toast.success(
        "Payment approved and Kinyarwanda SMS notification dispatched to member phone!"
      );
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "Payout failed. Please try again.";
      toast.error(typeof msg === "string" ? msg : "Payout failed. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  // ── Export ───────────────────────────────────────────────────────────────
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      await downloadPaymentSummaryExcel();
      toast.success("Payment summary exported successfully.");
    } catch (err) {
      toast.error(err?.message || "Failed to export payments.");
    } finally {
      setExporting(false);
    }
  };

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalPending = payments.length;
  const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const uniqueMembers = new Set(payments.map((p) => p.memberName || p.memberId)).size;

  // ── Render ────────────────────────────────────────────────────────────────
  const isLegacy = localStorage.getItem("designMode") === "legacy";

  if (isLegacy) {
    return (
      <>
        <ToastContainer toasts={toasts} dismiss={dismiss} />

        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payments Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Review and approve pending MoMo payouts in real-time
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:shrink-0">
              <Button
                variant="outline"
                onClick={handleExportExcel}
                disabled={exporting || loading}
                className="gap-2"
                id="btn-export-excel"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
                Export Excel
              </Button>
              <Button
                variant="outline"
                onClick={fetchPayments}
                disabled={loading}
                className="gap-2"
                id="btn-refresh-payments"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              title="Pending Payouts"
              value={loading ? "—" : totalPending}
              icon={Clock}
              colorClass="bg-amber-100 text-amber-600"
            />
            <StatCard
              title="Total Amount Due"
              value={loading ? "—" : formatCurrency(totalAmount)}
              icon={Banknote}
              colorClass="bg-emerald-100 text-emerald-600"
            />
            <StatCard
              title="Members Awaiting"
              value={loading ? "—" : uniqueMembers}
              icon={Smartphone}
              colorClass="bg-blue-100 text-blue-600"
            />
          </div>

          {/* Payments Table */}
          {loading ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-7 w-7 animate-spin text-emerald-500 mb-3" />
                <p className="text-sm text-gray-400">Fetching pending payments…</p>
              </CardContent>
            </Card>
          ) : payments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-20">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 mb-4">
                  <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                </div>
                <p className="text-base font-medium text-gray-700">All clear!</p>
                <p className="text-sm text-gray-400 mt-1">
                  No pending payments — all payouts have been processed.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                  Pending Payments
                  <Badge className="ml-1 bg-amber-100 text-amber-700 border-amber-200" variant="outline">
                    {totalPending}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80">
                      <TableHead className="pl-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Member Name
                      </TableHead>
                      <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Phone Number
                      </TableHead>
                      <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Amount (RWF)
                      </TableHead>
                      <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Date
                      </TableHead>
                      <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Status
                      </TableHead>
                      <TableHead className="pr-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p) => {
                      const isProcessing = processingId === p.id;
                      return (
                        <TableRow
                          key={p.id}
                          className={`transition-colors ${isProcessing ? "bg-emerald-50/40" : "hover:bg-gray-50/70"}`}
                        >
                          <TableCell className="pl-4 py-3.5">
                            <span className="text-sm font-medium text-gray-900">
                              {p.memberName || p.memberUsername || "—"}
                            </span>
                          </TableCell>
                          <TableCell className="py-3.5">
                            <span className="text-sm font-mono text-gray-600">
                              {p.phoneNumber || p.phone || "—"}
                            </span>
                          </TableCell>
                          <TableCell className="py-3.5">
                            <span className="text-sm font-mono font-semibold text-gray-800">
                              {formatCurrency(p.amount)}
                            </span>
                          </TableCell>
                          <TableCell className="py-3.5">
                            <span className="text-sm text-gray-500">
                              {formatDate(p.date || p.createdAt || p.paymentDate)}
                            </span>
                          </TableCell>
                          <TableCell className="py-3.5">
                            <StatusBadge status={p.status || "PENDING"} />
                          </TableCell>
                          <TableCell className="pr-4 py-3.5 text-right">
                            <Button
                              id={`btn-approve-payout-${p.id}`}
                              size="sm"
                              onClick={() => handleApprovePayout(p)}
                              disabled={isProcessing || processingId !== null}
                              className={`
                                gap-1.5 text-xs font-semibold transition-all
                                ${
                                  isProcessing
                                    ? "bg-emerald-600 text-white opacity-90"
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                }
                              `}
                            >
                              {isProcessing ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  Processing…
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Approve Payout
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </>
    );
  }

  // ─── Modernized Render ─────────────────────────────────────────────────────
  return (
    <>
      <ToastContainer toasts={toasts} dismiss={dismiss} />

      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Payments Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Review and approve pending MoMo payouts in real-time
            </p>
          </div>
          <div className="flex items-center gap-2 sm:shrink-0">
            <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={exporting || loading}
              className="gap-2 rounded-xl border-gray-200 hover:bg-gray-50"
              id="btn-export-excel"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
              ) : (
                <FileDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              )}
              Export Excel
            </Button>
            <Button
              variant="outline"
              onClick={fetchPayments}
              disabled={loading}
              className="gap-2 rounded-xl border-gray-200 dark:border-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              id="btn-refresh-payments"
            >
              <RefreshCw className={`h-4 w-4 text-gray-500 dark:text-gray-400 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="overflow-hidden border border-gray-100 dark:border-gray-800 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-xl bg-white dark:bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Pending Payouts
                  </p>
                  <p className="text-3xl font-extrabold text-gray-950 dark:text-white tracking-tight">
                    {loading ? "—" : totalPending}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-955/20 text-amber-600 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/30 shadow-xs">
                  <Clock className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border border-gray-100 dark:border-gray-800 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-xl bg-white dark:bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Total Amount Due
                  </p>
                  <p className="text-3xl font-extrabold text-gray-950 dark:text-white tracking-tight">
                    {loading ? "—" : formatCurrency(totalAmount)}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30 shadow-xs">
                  <Banknote className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border border-gray-100 dark:border-gray-800 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-xl bg-white dark:bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Members Awaiting
                  </p>
                  <p className="text-3xl font-extrabold text-gray-950 dark:text-white tracking-tight">
                    {loading ? "—" : uniqueMembers}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-955/20 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30 shadow-xs">
                  <Smartphone className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payments Table / Mobile Card List */}
        {loading ? (
          <Card className="border border-gray-100 dark:border-gray-850 rounded-xl shadow-xs bg-white dark:bg-gray-900">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Fetching pending payments…</p>
            </CardContent>
          </Card>
        ) : payments.length === 0 ? (
          <Card className="border border-gray-100 dark:border-gray-850 rounded-xl shadow-xs bg-white dark:bg-gray-900">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 mb-4 shadow-sm">
                <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-base font-bold text-gray-950 dark:text-white">All Clear!</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
                No pending payments — all payouts have been successfully processed.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop View (Table) */}
            <Card className="hidden md:block overflow-hidden border border-gray-150 dark:border-gray-800 shadow-xs rounded-xl bg-white dark:bg-gray-900">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                  <thead className="bg-gray-50/75 dark:bg-gray-950/50">
                    <tr>
                      {["Member Name", "Phone Number", "Amount", "Date", "Status", "Action"].map((h) => (
                        <th
                           key={h}
                           className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-50 dark:divide-gray-800">
                    {payments.map((p) => {
                      const isProcessing = processingId === p.id;
                      const memberName = p.memberName || p.memberUsername || "—";
                      const initial = memberName.charAt(0).toUpperCase();

                      return (
                        <tr
                          key={p.id}
                          className={`hover:bg-emerald-50/10 dark:hover:bg-emerald-950/10 transition-colors duration-150 ${
                            isProcessing ? "bg-emerald-50/30 dark:bg-emerald-950/20 animate-pulse" : ""
                          }`}
                        >
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-xs">
                                {initial}
                              </div>
                              <span className="text-xs font-semibold text-gray-900 dark:text-white">{memberName}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-xs font-mono font-semibold text-gray-600 dark:text-gray-400">
                            {p.phoneNumber || p.phone || "—"}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-xs font-mono font-bold text-gray-900 dark:text-white">
                            {formatCurrency(p.amount)}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(p.date || p.createdAt || p.paymentDate)}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className="bg-amber-50 dark:bg-amber-955/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30 text-[10px] px-2 py-0.5 rounded-md font-bold"
                            >
                              {p.status || "PENDING"}
                            </Badge>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-right">
                            <Button
                              id={`btn-approve-payout-${p.id}`}
                              size="sm"
                              onClick={() => handleApprovePayout(p)}
                              disabled={isProcessing || processingId !== null}
                              className={`
                                text-xs font-bold px-3 py-1.5 h-8.5 rounded-lg shadow-xs flex items-center justify-center gap-1.5 ml-auto active:scale-[0.98] transition-transform duration-100
                                ${
                                  isProcessing
                                    ? "bg-emerald-600 text-white opacity-90"
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                }
                              `}
                            >
                              {isProcessing ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  Processing…
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Approve Payout
                                </>
                              )}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Mobile View (Card List) */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {payments.map((p) => {
                const isProcessing = processingId === p.id;
                const memberName = p.memberName || p.memberUsername || "—";
                const initial = memberName.charAt(0).toUpperCase();

                return (
                  <div
                    key={p.id}
                    className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-150 dark:border-gray-800 p-4 shadow-xs space-y-3 transition-colors ${
                      isProcessing ? "bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-semibold shadow-xs">
                          {initial}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{memberName}</p>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-mono">
                            {p.phoneNumber || p.phone || "—"}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-amber-50 dark:bg-amber-955/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30 text-[10px] px-2 py-0.5 rounded-md font-bold"
                      >
                        {p.status || "PENDING"}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center text-xs border-t border-gray-50 dark:border-gray-800 pt-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 block tracking-wider">Amount</span>
                        <span className="text-sm font-bold text-gray-950 dark:text-white font-mono">
                          {formatCurrency(p.amount)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 block tracking-wider">Date</span>
                        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                          {formatDate(p.date || p.createdAt || p.paymentDate)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-gray-50 dark:border-gray-800 flex justify-end">
                      <Button
                        id={`btn-approve-payout-${p.id}`}
                        size="sm"
                        onClick={() => handleApprovePayout(p)}
                        disabled={isProcessing || processingId !== null}
                        className={`
                          w-full sm:w-auto text-xs font-bold py-2 px-4 h-9 rounded-lg shadow-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform duration-100
                          ${
                            isProcessing
                              ? "bg-emerald-600 text-white opacity-90"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white"
                          }
                        `}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Processing…
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Approve Payout
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default PaymentsManagement;
