import { useEffect, useState } from "react";
import {
  CheckCircle2,
  HelpCircle,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
} from "lucide-react";
import { getCoopIssues, resolveIssue } from "@/services/issueService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AdminHelpdesk = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [resolvingId, setResolvingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchIssues = async () => {
    setLoading(true); setError("");
    try {
      const res = await getCoopIssues();
      setIssues(Array.isArray(res.data) ? res.data : res.data?.content || res.data?.data || []);
    } catch { setError("Failed to fetch issues."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchIssues(); }, []);

  const handleResolve = async (id) => {
    setResolvingId(id); setSuccess(""); setError("");
    try {
      await resolveIssue(id);
      setSuccess("Issue marked as resolved!"); setTimeout(() => setSuccess(""), 4000);
      fetchIssues();
    } catch { setError("Failed to resolve issue."); }
    finally { setResolvingId(null); }
  };

  const filtered = issues.filter(i => {
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    return (i.title || "").toLowerCase().includes(t) ||
      (i.memberName || i.member?.name || "").toLowerCase().includes(t) ||
      (i.description || "").toLowerCase().includes(t);
  });

  const openCount = issues.filter(i => i.status === "OPEN").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Helpdesk</h1>
          <p className="text-sm text-gray-500 mt-1">
            View and resolve member-reported issues. <span className="font-semibold text-amber-600">{openCount} open</span>
          </p>
        </div>
        <Button variant="outline" onClick={fetchIssues} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Alerts */}
      {success && (
        <Alert className="bg-emerald-50 border-emerald-200 text-emerald-700 animate-slide-down">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="animate-slide-down">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input placeholder="Search issues..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mb-2" />
          <p className="text-sm text-gray-400">Loading issues...</p>
        </div>
      )}

      {/* Empty */}
      {!loading && issues.length === 0 && (
        <Card className="py-16 text-center">
          <MessageSquare className="mx-auto h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-500">No issues reported yet</p>
        </Card>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  {["Date", "Member", "Title", "Description", "Status", "Action"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(issue => (
                  <tr key={issue.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(issue.createdAt || issue.issueDate).toLocaleString("en-GB", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {issue.memberName || issue.member?.name || issue.user?.fullName || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{issue.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate" title={issue.description}>{issue.description}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge className={issue.status === "RESOLVED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"} variant="secondary">
                        {issue.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {issue.status === "OPEN" ? (
                        <Button size="sm" onClick={() => handleResolve(issue.id)} disabled={resolvingId === issue.id}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                          {resolvingId === issue.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                          Resolve
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400">Resolved</span>
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

export default AdminHelpdesk;
