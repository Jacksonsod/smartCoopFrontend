import { useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { getAllCooperatives, activateCooperative, deactivateCooperative } from "@/services/cooperativeService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const PendingCooperatives = () => {
  const [cooperatives, setCooperatives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activatingId, setActivatingId] = useState(null);
  const [deactivatingId, setDeactivatingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCooperatives = async () => {
    setLoading(true); setError("");
    try {
      const { data } = await getAllCooperatives();
      setCooperatives(Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : Array.isArray(data?.data) ? data.data : []);
    } catch { setError("Failed to load cooperatives."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCooperatives(); }, []);

  const handleActivate = async (id) => {
    setActivatingId(id); setError(""); setSuccessMsg("");
    try {
      await activateCooperative(id);
      setSuccessMsg("Cooperative activated! Welcome email sent."); setTimeout(() => setSuccessMsg(""), 4000);
      fetchCooperatives();
    } catch { setError("Activation failed."); }
    finally { setActivatingId(null); }
  };

  const handleDeactivate = async (id) => {
    setDeactivatingId(id); setError(""); setSuccessMsg("");
    try {
      await deactivateCooperative(id);
      setSuccessMsg("Cooperative deactivated."); setTimeout(() => setSuccessMsg(""), 4000);
      fetchCooperatives();
    } catch { setError("Deactivation failed."); }
    finally { setDeactivatingId(null); }
  };

  const filtered = cooperatives.filter(c => {
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    return (c.name || "").toLowerCase().includes(t) || (c.representativeName || "").toLowerCase().includes(t);
  });

  const pendingCount = cooperatives.filter(c => c.status === "INACTIVE").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cooperative Applications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-450 mt-1">
            Review and approve cooperative registrations. <span className="font-semibold text-amber-600 dark:text-amber-400">{pendingCount} pending</span>
          </p>
        </div>
        <Button variant="outline" onClick={fetchCooperatives} disabled={loading} className="dark:border-gray-700 dark:hover:bg-gray-800">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Alerts */}
      {successMsg && (
        <Alert className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 animate-slide-down rounded-xl shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <AlertDescription className="font-semibold text-xs">{successMsg}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="animate-slide-down rounded-xl shadow-xs">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        <Input placeholder="Search by name or representative..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 focus:border-emerald-500" />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mb-2" />
          <p className="text-sm text-gray-400 dark:text-gray-500">Loading cooperatives...</p>
        </div>
      )}

      {/* Empty */}
      {!loading && cooperatives.length === 0 && (
        <Card className="py-16 text-center border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl">
          <Building2 className="mx-auto h-10 w-10 text-gray-350 dark:text-gray-650 mb-3" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No cooperative applications found</p>
        </Card>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <Card className="border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {["Name", "RCA Number", "Category", "Representative", "Email", "Status", "Action"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-550">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/80">
                {filtered.map(coop => (
                  <tr key={coop.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">{coop.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-550 dark:text-gray-400 font-mono whitespace-nowrap">{coop.rcaNumber || coop.rcaRegistrationNumber || "-"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30" variant="secondary">{coop.category || "-"}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{coop.representativeName || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-450 dark:text-gray-450 whitespace-nowrap truncate max-w-[12rem]">{coop.representativeEmail || "-"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge className={coop.status === "ACTIVE" 
                        ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30" 
                        : "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-450 border border-amber-100 dark:border-amber-900/30"} variant="secondary">
                        {coop.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {coop.status === "INACTIVE" && (
                        <Button size="sm" onClick={() => handleActivate(coop.id)} disabled={activatingId === coop.id}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                          {activatingId === coop.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                          Approve
                        </Button>
                      )}
                      {coop.status === "ACTIVE" && (
                        <Button size="sm" variant="outline" onClick={() => handleDeactivate(coop.id)} disabled={deactivatingId === coop.id}
                          className="text-xs text-red-600 border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-950/20">
                          {deactivatingId === coop.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                          Deactivate
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

export default PendingCooperatives;
