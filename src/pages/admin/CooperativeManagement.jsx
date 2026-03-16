import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Filter,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import {
  activateCooperative,
  getAllCooperatives,
  registerCooperative,
} from "@/services/cooperativeService";
import { registerCoopAdmin, createUserProfile } from "@/services/userService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

// ─── Constants ───────────────────────────────────────────────────
const COOPERATIVE_TYPES = ["AGRICULTURE", "FINANCIAL", "SERVICE", "TRANSPORT", "ARTISAN"];
const initialFormState = {
  name: "", tinNumber: "", rcaRegistrationNumber: "", category: "", type: "",
  province: "", district: "", sector: "",
  representativeName: "", representativePhone: "", representativeEmail: "",
};
const resetAdminForm = () => ({
  username: "", email: "", phone: "", password: "",
  fullName: "", nationalId: "", address: "", dateOfBirth: "", gender: "",
});

const statusConfig = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  INACTIVE: "bg-amber-50 text-amber-700",
  PENDING: "bg-orange-50 text-orange-600",
};

const categoryConfig = {
  AGRICULTURE: "bg-emerald-50 text-emerald-700",
  FINANCIAL: "bg-blue-50 text-blue-700",
  SERVICE: "bg-purple-50 text-purple-700",
  TRANSPORT: "bg-amber-50 text-amber-700",
  ARTISAN: "bg-rose-50 text-rose-700",
};

// ─── Field Components ────────────────────────────────────────────
const Field = ({ id, label, placeholder, type = "text", required = true, value, onChange }) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>{label}</Label>
    <Input id={id} name={id} type={type} required={required} value={value} onChange={onChange} placeholder={placeholder} />
  </div>
);

const Select = ({ id, label, options, placeholder, value, onChange }) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>{label}</Label>
    <select id={id} name={id} required value={value} onChange={onChange}
      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
      <option value="" disabled>{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
    </select>
  </div>
);

// ═══════════════════════════════════════════════════════════════════
const CooperativeManagement = () => {
  const [cooperatives, setCooperatives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [activatingId, setActivatingId] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminFormData, setAdminFormData] = useState(resetAdminForm());
  const [selectedCoopId, setSelectedCoopId] = useState(null);
  const [submittingAdmin, setSubmittingAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("cards");

  const fetchCooperatives = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await getAllCooperatives();
      const d = res.data;
      setCooperatives(Array.isArray(d) ? d : Array.isArray(d?.content) ? d.content : Array.isArray(d?.data) ? d.data : []);
    } catch {
      setError("Failed to load cooperatives."); setCooperatives([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCooperatives(); }, [fetchCooperatives]);

  const handleInputChange = (e) => { const { name, value } = e.target; setFormData(p => ({ ...p, [name]: value })); };
  const handleAdminInputChange = (e) => { const { name, value } = e.target; setAdminFormData(p => ({ ...p, [name]: value })); };

  const handleRegister = async (e) => {
    e.preventDefault(); setSubmitting(true); setError(null); setSuccessMsg(null);
    try {
      await registerCooperative(formData);
      setShowModal(false); setFormData(initialFormState);
      setSuccessMsg("Cooperative registered successfully!");
      await fetchCooperatives(); setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to register cooperative.");
    } finally { setSubmitting(false); }
  };

  const handleActivate = async (id) => {
    setActivatingId(id); setError(null); setSuccessMsg(null);
    try {
      await activateCooperative(id);
      setSuccessMsg("Cooperative activated!"); await fetchCooperatives(); setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to activate cooperative.");
    } finally { setActivatingId(null); }
  };

  const handleOpenAdminModal = (coopId) => {
    setSelectedCoopId(coopId); setAdminFormData(resetAdminForm()); setShowAdminModal(true);
  };

  const handleRegisterAdmin = async (e) => {
    e.preventDefault(); setSubmittingAdmin(true); setError(null); setSuccessMsg(null);
    const { username, email, phone, password, fullName, nationalId, address, dateOfBirth, gender } = adminFormData;
    try {
      const r = await registerCoopAdmin({ username, email, phone, password, cooperativeId: selectedCoopId });
      const uid = r.data?.id || r.data?.user?.id || r.data?.data?.id || r.data?.userId;
      if (!uid) { closeAdminModal(); setError("Account created but no user ID returned."); return; }
      try { await createUserProfile(uid, { fullName, nationalId, address, dateOfBirth, gender }); } catch (pe) {
        closeAdminModal(); setError("Account created but profile failed: " + (pe.response?.data?.message || "")); return;
      }
      closeAdminModal(); setSuccessMsg("Coop Admin created successfully!"); setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to register coop admin.");
    } finally { setSubmittingAdmin(false); }
  };

  const closeAdminModal = () => { setShowAdminModal(false); setAdminFormData(resetAdminForm()); setSelectedCoopId(null); setSubmittingAdmin(false); };

  const filtered = cooperatives.filter(c => {
    if (searchTerm) { const t = searchTerm.toLowerCase(); if (!(c.name || "").toLowerCase().includes(t) && !(c.tinNumber || "").toLowerCase().includes(t)) return false; }
    if (categoryFilter !== "ALL" && c.category?.toUpperCase() !== categoryFilter) return false;
    if (statusFilter !== "ALL" && c.status?.toUpperCase() !== statusFilter) return false;
    return true;
  });

  const total = cooperatives.length;
  const active = cooperatives.filter(c => c.status?.toUpperCase() === "ACTIVE").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cooperatives</h1>
          <p className="text-sm text-gray-500 mt-1">Register, activate, and assign admins to cooperatives.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{active} active of {total}</span>
          <Button onClick={() => setShowModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="mr-2 h-4 w-4" /> Register
          </Button>
        </div>
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
          <AlertDescription className="flex items-center justify-between">
            {error}
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
          </AlertDescription>
        </Alert>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search cooperatives…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bg-transparent text-sm focus:outline-none cursor-pointer">
              <option value="ALL">All Categories</option>
              {COOPERATIVE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-transparent text-sm focus:outline-none cursor-pointer">
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <Button variant="outline" size="icon" onClick={fetchCooperatives} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <div className="flex rounded-md border border-input overflow-hidden">
            <button onClick={() => setViewMode("cards")} className={`px-3 py-1.5 text-xs font-medium ${viewMode === "cards" ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}>Cards</button>
            <button onClick={() => setViewMode("table")} className={`px-3 py-1.5 text-xs font-medium ${viewMode === "table" ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}>Table</button>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Showing <span className="font-semibold text-gray-700">{filtered.length}</span> of <span className="font-semibold text-gray-700">{total}</span>
      </p>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mb-2" />
          <p className="text-sm text-gray-400">Loading cooperatives…</p>
        </div>
      )}

      {/* Empty */}
      {!loading && cooperatives.length === 0 && (
        <Card className="py-16 text-center">
          <CardContent>
            <Building2 className="mx-auto h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-500">No cooperatives yet</p>
            <Button onClick={() => setShowModal(true)} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="mr-2 h-4 w-4" /> Register Cooperative
            </Button>
          </CardContent>
        </Card>
      )}

      {/* No match */}
      {!loading && cooperatives.length > 0 && filtered.length === 0 && (
        <Card className="py-16 text-center">
          <CardContent>
            <Search className="mx-auto h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-500">No cooperatives match your filters</p>
          </CardContent>
        </Card>
      )}

      {/* Cards View */}
      {!loading && filtered.length > 0 && viewMode === "cards" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(coop => {
            const isActive = coop.status?.toUpperCase() === "ACTIVE";
            const isInactive = coop.status?.toUpperCase() === "INACTIVE";
            return (
              <Card key={coop.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <Badge className={statusConfig[coop.status?.toUpperCase()] || "bg-gray-50 text-gray-600"} variant="secondary">
                      {coop.status || "—"}
                    </Badge>
                  </div>

                  <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">{coop.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    <span className="font-mono">{coop.tinNumber || "—"}</span>
                    <span>·</span>
                    <Badge className={categoryConfig[coop.category?.toUpperCase()] || "bg-gray-50 text-gray-600"} variant="secondary">
                      {coop.category?.replace(/_/g, " ") || "—"}
                    </Badge>
                  </div>

                  {(coop.province || coop.district) && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{[coop.sector, coop.district, coop.province].filter(Boolean).join(", ")}</span>
                    </div>
                  )}

                  <div className="flex-1" />

                  <Separator className="my-3" />

                  <div className="flex items-center gap-2">
                    {isInactive && (
                      <Button size="sm" onClick={() => handleActivate(coop.id)} disabled={activatingId === coop.id}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                        {activatingId === coop.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                        Activate
                      </Button>
                    )}
                    {isActive && (
                      <>
                        <Badge className="bg-emerald-50 text-emerald-700" variant="secondary">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                        </Badge>
                        <Button size="sm" onClick={() => handleOpenAdminModal(coop.id)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                          <UserPlus className="h-3 w-3 mr-1" /> Assign Admin
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {!loading && filtered.length > 0 && viewMode === "table" && (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  {["Cooperative", "TIN", "Category", "Location", "Status", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(coop => {
                  const isActive = coop.status?.toUpperCase() === "ACTIVE";
                  const isInactive = coop.status?.toUpperCase() === "INACTIVE";
                  return (
                    <tr key={coop.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                            <Building2 className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{coop.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 font-mono whitespace-nowrap">{coop.tinNumber}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge className={categoryConfig[coop.category?.toUpperCase()] || "bg-gray-50 text-gray-600"} variant="secondary">
                          {coop.category?.replace(/_/g, " ") || "—"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{[coop.district, coop.province].filter(Boolean).join(", ") || "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge className={statusConfig[coop.status?.toUpperCase()] || "bg-gray-50 text-gray-600"} variant="secondary">{coop.status}</Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isInactive && (
                            <Button size="sm" variant="outline" onClick={() => handleActivate(coop.id)} disabled={activatingId === coop.id}
                              className="text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                              {activatingId === coop.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />} Activate
                            </Button>
                          )}
                          {isActive && (
                            <Button size="sm" variant="outline" onClick={() => handleOpenAdminModal(coop.id)}
                              className="text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                              <UserPlus className="h-3 w-3 mr-1" /> Assign Admin
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

      {/* Register Modal */}
      <Dialog open={showModal} onOpenChange={(open) => { if (!open) { setShowModal(false); setFormData(initialFormState); setError(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register Cooperative</DialogTitle>
            <DialogDescription>Fill in the cooperative details below</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegister} className="space-y-6 pt-2">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Separator className="flex-1" /><span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Basic Information</span><Separator className="flex-1" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field id="name" label="Cooperative Name" placeholder="e.g. Sunrise Farmers Coop" value={formData.name} onChange={handleInputChange} />
                <Field id="tinNumber" label="TIN Number" placeholder="e.g. 1234567890" value={formData.tinNumber} onChange={handleInputChange} />
                <Field id="rcaRegistrationNumber" label="RCA Registration" placeholder="e.g. RCA-2024-001" value={formData.rcaRegistrationNumber} onChange={handleInputChange} />
                <Select id="category" label="Category" options={COOPERATIVE_TYPES} placeholder="Select category" value={formData.category} onChange={handleInputChange} />
                <Select id="type" label="Type" options={COOPERATIVE_TYPES} placeholder="Select type" value={formData.type} onChange={handleInputChange} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Separator className="flex-1" /><span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Location</span><Separator className="flex-1" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field id="province" label="Province" placeholder="e.g. Kigali" value={formData.province} onChange={handleInputChange} />
                <Field id="district" label="District" placeholder="e.g. Gasabo" value={formData.district} onChange={handleInputChange} />
                <Field id="sector" label="Sector" placeholder="e.g. Remera" value={formData.sector} onChange={handleInputChange} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Separator className="flex-1" /><span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Representative</span><Separator className="flex-1" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field id="representativeName" label="Name" placeholder="e.g. Jean Bosco" value={formData.representativeName} onChange={handleInputChange} />
                <Field id="representativePhone" label="Phone" placeholder="e.g. 0788123456" type="tel" value={formData.representativePhone} onChange={handleInputChange} />
                <Field id="representativeEmail" label="Representative Email" type="email" placeholder="e.g. bosco@coop.rw" value={formData.representativeEmail} onChange={handleInputChange} required={true} />
              </div>
            </div>
            <Separator />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => { setShowModal(false); setFormData(initialFormState); setError(null); }}>Cancel</Button>
              <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitting ? "Registering…" : "Register Cooperative"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Admin Modal */}
      <Dialog open={showAdminModal} onOpenChange={(open) => { if (!open) { closeAdminModal(); setError(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Coop Admin</DialogTitle>
            <DialogDescription>Create an admin account for this cooperative</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegisterAdmin} className="space-y-6 pt-2">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Separator className="flex-1" /><span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Account Details</span><Separator className="flex-1" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field id="username" label="Username" placeholder="e.g. admin_john" value={adminFormData.username} onChange={handleAdminInputChange} />
                <Field id="email" label="Email" type="email" placeholder="e.g. john@coop.rw" value={adminFormData.email} onChange={handleAdminInputChange} />
                <Field id="phone" label="Phone" type="tel" placeholder="e.g. 0788123456" value={adminFormData.phone} onChange={handleAdminInputChange} />
                <Field id="password" label="Password" type="password" placeholder="Secure password" value={adminFormData.password} onChange={handleAdminInputChange} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Separator className="flex-1" /><span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Personal Profile</span><Separator className="flex-1" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field id="fullName" label="Full Name" placeholder="e.g. Jean Bosco Uwimana" value={adminFormData.fullName} onChange={handleAdminInputChange} />
                <Field id="nationalId" label="National ID" placeholder="e.g. 1199880012345678" value={adminFormData.nationalId} onChange={handleAdminInputChange} />
                <Field id="dateOfBirth" label="Date of Birth" type="date" placeholder="" value={adminFormData.dateOfBirth} onChange={handleAdminInputChange} />
                <Select id="gender" label="Gender" options={["MALE", "FEMALE"]} placeholder="Select gender" value={adminFormData.gender} onChange={handleAdminInputChange} />
                <div className="sm:col-span-2">
                  <Field id="address" label="Address" placeholder="e.g. Kigali, Gasabo, Remera" value={adminFormData.address} onChange={handleAdminInputChange} required={false} />
                </div>
              </div>
            </div>
            <Separator />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => { closeAdminModal(); setError(null); }}>Cancel</Button>
              <Button type="submit" disabled={submittingAdmin} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {submittingAdmin && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submittingAdmin ? "Creating…" : "Create Admin"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CooperativeManagement;
