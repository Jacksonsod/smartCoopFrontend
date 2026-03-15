import { useEffect, useMemo, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
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
import { getAuditLogs } from "@/services/adminService";

const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const getMethodClass = (method) => {
  const normalized = String(method || "").toUpperCase();
  if (normalized === "POST") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (normalized === "PUT") return "bg-blue-50 text-blue-700 border-blue-100";
  if (normalized === "DELETE") return "bg-red-50 text-red-700 border-red-100";
  return "bg-slate-50 text-slate-700 border-slate-200";
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Audit Logs</h1>
        <p className="mt-1 text-sm text-gray-500">
          End-to-end traceability of actions performed across the platform.
        </p>
      </div>

      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-emerald-600" />
            Action Trace
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-40 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
              <span className="text-sm text-gray-500">Loading audit logs...</span>
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center text-sm text-gray-500">
              No audit logs available yet.
            </div>
          ) : (
            <Table className="min-w-[980px]">
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
                    <TableCell className="text-gray-600">{row.timestamp}</TableCell>
                    <TableCell className="font-medium text-gray-900">{row.user}</TableCell>
                    <TableCell className="text-gray-600">{row.role}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getMethodClass(row.method)}>
                        {row.method}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-gray-700">{row.endpoint}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemLogs;

