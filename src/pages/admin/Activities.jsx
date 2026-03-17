import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  Loader2,
  Plus,
  RefreshCw,
  Search
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getCoopActivities, recordActivity } from "@/services/activityService";
import { getMyCoopStaff } from "@/services/userService";
import { getAllItems } from "@/services/itemService";

const extractList = (p) => (Array.isArray(p) ? p : Array.isArray(p?.content) ? p.content : Array.isArray(p?.data) ? p.data : []);

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [members, setMembers] = useState([]);
  const [catalogItems, setCatalogItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ memberId: "", itemId: "", metricValue: "", notes: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [aRes, mRes, iRes] = await Promise.all([getCoopActivities(), getMyCoopStaff(), getAllItems()]);
      setActivities(extractList(aRes?.data));
      setMembers(extractList(mRes?.data));
      setCatalogItems(extractList(iRes?.data));
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const filteredMembers = useMemo(() => members.filter(m => String(m.role).toLowerCase() === "member"), [members]);

  const filtered = useMemo(() => {
    if (!searchTerm) return activities;
    const t = searchTerm.toLowerCase();
    return activities.filter(a =>
        (a.memberName || a.memberUsername || a.member?.fullName || a.member?.username || "").toLowerCase().includes(t) ||
        (a.itemName || a.item?.name || "").toLowerCase().includes(t)
    );
  }, [activities, searchTerm]);

  const handleFormChange = (e) => { const { name, value } = e.target; setForm(p => ({ ...p, [name]: value })); };

  const openModal = () => {
    setForm({ memberId: "", itemId: "", metricValue: "", notes: "" });
    setError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await recordActivity({
        // FIX: Converted string IDs to Numbers for the backend
        memberId: Number(form.memberId),
        itemId: Number(form.itemId),
        metricValue: Number(form.metricValue),
        notes: form.notes
      });

      closeModal();
      setSuccessMsg("Activity recorded!");
      setTimeout(() => setSuccessMsg(""), 4000);
      await fetchAll();

    } catch (err) {
      setError(err.response?.data?.message || "Failed to record activity.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return "-";
    const date = new Date(d);
    if (isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
  };

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
            <p className="text-sm text-gray-500 mt-1">Record and track member activities, deliveries, and transactions.</p>
          </div>
          <Button onClick={openModal} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="mr-2 h-4 w-4" /> Record Activity
          </Button>
        </div>

        {/* Alerts */}
        {successMsg && (
            <Alert className="bg-emerald-50 border-emerald-200 text-emerald-700 animate-slide-down">
              <AlertDescription>{successMsg}</AlertDescription>
            </Alert>
        )}

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search by member or item..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          <Button variant="outline" size="icon" onClick={fetchAll} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <p className="text-xs text-gray-400">
          Showing <span className="font-semibold text-gray-700">{filtered.length}</span> of <span className="font-semibold text-gray-700">{activities.length}</span>
        </p>

        {/* Loading */}
        {loading && (
            <div className="flex flex-col items-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mb-2" />
              <p className="text-sm text-gray-400">Loading activities...</p>
            </div>
        )}

        {/* Empty */}
        {!loading && activities.length === 0 && (
            <Card className="py-16 text-center">
              <CardContent>
                <ClipboardList className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-500">No activities recorded yet</p>
                <Button onClick={openModal} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="mr-2 h-4 w-4" /> Record Activity
                </Button>
              </CardContent>
            </Card>
        )}

        {/* Table */}
        {!loading && filtered.length > 0 && (
            <Card>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                  <tr className="border-b">
                    {["Date", "Member", "Item / Service", "Quantity", "Notes"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">{h}</th>
                    ))}
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                  {filtered.map(a => (
                      <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CalendarDays className="h-3.5 w-3.5 text-gray-300" />
                            {formatDate(a.activityDate || a.createdAt)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                          {a.memberName || a.memberUsername || a.member?.fullName || a.member?.username || "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge className="bg-emerald-50 text-emerald-700" variant="secondary">
                            {a.itemName || a.item?.name || a.serviceName || "-"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-700 whitespace-nowrap">{a.metricValue}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{a.notes || "-"}</td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            </Card>
        )}

        {/* Record Activity Modal */}
        <Dialog open={isModalOpen} onOpenChange={open => { if (!open) closeModal(); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Activity</DialogTitle>
              <DialogDescription>Log a member transaction, delivery, or service record</DialogDescription>
            </DialogHeader>
            <form className="space-y-4 pt-2" onSubmit={handleSubmit}>
              {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="memberId">Member</Label>
                <select id="memberId" name="memberId" value={form.memberId} onChange={handleFormChange} required
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value="" disabled>Select member</option>
                  {filteredMembers.length === 0 ? (
                      <option value="" disabled>No members available</option>
                  ) : (
                      filteredMembers.map(m => (
                          <option key={m.id} value={m.id}>{m.fullName || m.username || `Member #${m.id}`}</option>
                      ))
                  )}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="itemId">Item / Service</Label>
                <select id="itemId" name="itemId" value={form.itemId} onChange={handleFormChange} required
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value="" disabled>Select item</option>
                  {catalogItems.map(i => (
                      <option key={i.id} value={i.id}>{i.name || `Item #${i.id}`}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="metricValue">Quantity / Volume</Label>
                <Input id="metricValue" name="metricValue" type="number" min="0" step="any" value={form.metricValue} onChange={handleFormChange} required placeholder="Enter quantity" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <textarea id="notes" name="notes" value={form.notes} onChange={handleFormChange} rows={3} placeholder="Optional details"
                          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? "Recording..." : "Record Activity"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default Activities;