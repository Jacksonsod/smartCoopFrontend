import { useEffect, useMemo, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { downloadAuditLogExcel, downloadEntityAuditTrailExcel } from "@/services/documentService";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAuditLogs } from "@/services/adminService";
import PageHeader from "@/components/shared/PageHeader";
import ResponsiveTable from "@/components/shared/ResponsiveTable";
import EmptyState from "@/components/shared/EmptyState";
import { toast } from "@/lib/toast";

const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const getMethodClass = (method) => {
  const normalized = String(method || "").toUpperCase();
  if (normalized === "POST") return "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30";
  if (normalized === "PUT") return "bg-blue-50 dark:bg-blue-955/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/30";
  if (normalized === "DELETE") return "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30";
  return "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-705";
};

const getMethod = (log) => {
  if (log?.method) return String(log.method).toUpperCase();
  if (log?.httpMethod) return String(log.httpMethod).toUpperCase();

  const actionText = String(log?.action || "").toUpperCase();
  const [first] = actionText.split(" ");
  if (["GET", "POST", "PUT", "PATCH", "DELETE"].includes(first)) {
    return first;
  }

  return "N/A";
};

const getEndpoint = (log) => {
  if (log?.endpoint) return log.endpoint;
  if (log?.path) return log.path;
  if (log?.url) return log.url;

  const actionText = String(log?.action || "");
  const parts = actionText.split(" ");
  if (parts.length >= 2 && parts[1].startsWith("/")) {
    return parts[1];
  }

  return "-";
};

const formatTimestamp = (value) => {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchLogs = async () => {
      setLoading(true);
      try {
        const response = await getAuditLogs();
        if (mounted) {
          setLogs(extractList(response?.data));
        }
      } catch (error) {
        console.error("Failed to fetch audit logs:", error);
        if (mounted) {
          setLogs([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchLogs();
    return () => {
      mounted = false;
    };
  }, []);

  const [exporting, setExporting] = useState(false);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      await downloadAuditLogExcel();
      toast.success("Audit log exported successfully.");
    } catch (err) {
      toast.error(err.message || "Failed to export audit log.");
    } finally {
      setExporting(false);
    }
  };

  const [exportingTrail, setExportingTrail] = useState(false);

  const handleExportTrailExcel = async () => {
    setExportingTrail(true);
    try {
      await downloadEntityAuditTrailExcel();
      toast.success("Payment audit trail exported successfully.");
    } catch (err) {
      toast.error(err.message || "Failed to export payment audit trail.");
    } finally {
      setExportingTrail(false);
    }
  };

  const rows = useMemo(
    () =>
      logs.map((log, index) => {
        const method = getMethod(log);
        return {
          id: log?.id || `${log?.timestamp || log?.createdAt || "row"}-${index}`,
          timestamp: formatTimestamp(log?.timestamp || log?.createdAt || log?.time),
          user: log?.username || log?.user?.username || log?.actor || log?.performedBy || "System",
          role: log?.role || log?.userRole || log?.user?.role || "-",
          method,
          endpoint: getEndpoint(log),
        };
      }),
    [logs]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Audit Logs"
        subtitle="End-to-end traceability of actions performed across the platform."
        actions={
          <>
            <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={exporting || loading}
              className="gap-2 dark:border-gray-800 dark:hover:bg-gray-800 dark:text-gray-300"
            >
              {exporting
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <FileDown className="h-4 w-4" />}
              Export Audit Log
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportTrailExcel}
              disabled={exportingTrail}
              className="flex items-center gap-1.5"
            >
              {exportingTrail ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              Export Payment Trail
            </Button>
          </>
        }
      />

      <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-gray-900 dark:text-white">
            <FileText className="h-4 w-4 text-emerald-600" />
            Action Trace
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-40 items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Loading audit logs...</span>
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              title="No audit logs available yet."
              subtitle="Actions performed on the platform will appear here."
            />
          ) : (
            <ResponsiveTable minWidth="980px">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Endpoint</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-gray-600 dark:text-gray-400">{row.timestamp}</TableCell>
                      <TableCell className="font-medium text-gray-900 dark:text-white">{row.user}</TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400">{row.role}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getMethodClass(row.method)}>
                          {row.method}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-700 dark:text-gray-350">{row.endpoint}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ResponsiveTable>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemLogs;
