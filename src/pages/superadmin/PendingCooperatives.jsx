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
          <h1 className="text-2xl font-bold text-gray-900">Cooperative Applications</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and approve cooperative registrations. <span className="font-semibold text-amber-600">{pendingCount} pending</span>
          </p>
        </div>
        <Button variant="outline" onClick={fetchCooperatives} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Alerts */}
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

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input placeholder="Search by name or representative..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mb-2" />
          <p className="text-sm text-gray-400">Loading cooperatives...</p>
        </div>
      )}

      {/* Empty */}
      {!loading && cooperatives.length === 0 && (
        <Card className="py-16 text-center">
          <Building2 className="mx-auto h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-500">No cooperative applications found</p>
        </Card>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  {["Name", "RCA Number", "Category", "Representative", "Email", "Status", "Action"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(coop => (
                  <tr key={coop.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{coop.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono whitespace-nowrap">{coop.rcaNumber || coop.rcaRegistrationNumber || "-"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge className="bg-blue-50 text-blue-700" variant="secondary">{coop.category || "-"}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{coop.representativeName || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap truncate max-w-[12rem]">{coop.representativeEmail || "-"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge className={coop.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"} variant="secondary">
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
                          className="text-xs text-red-600 border-red-200 hover:bg-red-50">
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
