import RejectionReason from "@/components/shared/RejectionReason";
import api from "@/services/api";
import ActivityPhoto from "@/components/shared/ActivityPhoto";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  FileDown,
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
import { downloadActivityReportPdf } from "@/services/documentService";
import { useAuth } from "@/context/AuthContext";
import PageHeader from "@/components/shared/PageHeader";
import ResponsiveTable from "@/components/shared/ResponsiveTable";
import EmptyState from "@/components/shared/EmptyState";
import { toast } from "@/lib/toast";
import { useTranslation } from "react-i18next";

const extractList = (p) => (Array.isArray(p) ? p : Array.isArray(p?.content) ? p.content : Array.isArray(p?.data) ? p.data : []);

const Activities = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [members, setMembers] = useState([]);
  const [catalogItems, setCatalogItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ memberId: "", itemId: "", metricValue: "", notes: "", activityDate: new Date().toISOString().slice(0, 10) });
  const [photo, setPhoto] = useState(null);
  const [photoDocuments, setPhotoDocuments] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [exportingPdf, setExportingPdf] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const isStaffOrAdmin = user?.role === "COOP_ADMIN" || user?.role === "FIELD_OFFICER";
      if (isStaffOrAdmin) {
        const [aRes, mRes, iRes] = await Promise.all([getCoopActivities(), getMyCoopStaff(), getAllItems()]);
        setActivities(extractList(aRes?.data));
        setMembers(extractList(mRes?.data));
        setCatalogItems(extractList(iRes?.data));
      } else {
        const aRes = await getCoopActivities();
        setActivities(extractList(aRes?.data));
        setMembers([]);
        setCatalogItems([]);
      }
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
    setForm({ memberId: "", itemId: "", metricValue: "", notes: "", activityDate: new Date().toISOString().slice(0, 10) });
    setError("");
    setPhoto(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (photo && (!['image/jpeg', 'image/png', 'image/webp'].includes(photo.type) || photo.size > 5 * 1024 * 1024)) {
      setError(t('photos.invalid')); return;
    }
    setIsSubmitting(true);
    setError("");

    try {
      const { data: recorded } = await recordActivity({
        // FIX: Converted string IDs to Numbers for the backend
        memberId: Number(form.memberId),
        itemId: Number(form.itemId),
        metricValue: Number(form.metricValue),
        notes: form.notes,
        activityDate: form.activityDate
      });

      let photoFailed = false;
      if (photo) {
        try {
          const upload = new FormData(); upload.append('file', photo);
          const { data: document } = await api.post(`/activities/${recorded.id}/photo`, upload, { headers: { 'Content-Type': undefined }, quietForbidden: true });
          if (!document?.id) throw Error();
          setPhotoDocuments(current => ({ ...current, [recorded.id]: document.id }));
        } catch { photoFailed = true; }
      }
      closeModal();
      setSuccessMsg(t(photoFailed ? 'photos.uploadError' : 'photos.recorded'));
      if (!photoFailed) setTimeout(() => setSuccessMsg(""), 4000);
      await fetchAll();

    } catch (err) {
      setError(err.response?.data?.message || "Failed to record activity.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      await downloadActivityReportPdf();
      toast.success("Activity report exported successfully.");
    } catch (err) {
      toast.error(err?.message || "Failed to export PDF.");
    } finally {
      setExportingPdf(false);
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
        <PageHeader
          title={t("activities.title")}
          subtitle={t("activities.subtitle")}
          actions={
            <>
              <Button
                variant="outline"
                onClick={handleExportPdf}
                disabled={exportingPdf || loading}
                className="gap-2 rounded-xl border-gray-200 hover:bg-gray-50"
                id="btn-export-activity-pdf"
              >
                {exportingPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
                Export PDF
              </Button>
              {(user?.role === "COOP_ADMIN" || user?.role === "FIELD_OFFICER") && (
                <Button onClick={openModal} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="mr-2 h-4 w-4" /> Record Activity
                </Button>
              )}
            </>
          }
        />

        {/* Alerts */}
        {successMsg && (
            <Alert className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 animate-slide-down rounded-xl shadow-xs">
              <AlertDescription>{successMsg}</AlertDescription>
            </Alert>
        )}

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <Input placeholder={t("activities.search")} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700" />
          </div>
          <Button variant="outline" size="icon" onClick={fetchAll} disabled={loading} className="dark:border-gray-700 dark:hover:bg-gray-800">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500">
          Showing <span className="font-semibold text-gray-700 dark:text-gray-300">{filtered.length}</span> of <span className="font-semibold text-gray-700 dark:text-gray-300">{activities.length}</span>
        </p>

        {/* Loading */}
        {loading && (
            <div className="flex flex-col items-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mb-2" />
              <p className="text-sm text-gray-400 dark:text-gray-500">{ t("activities.loading") }</p>
            </div>
        )}

        {/* Empty */}
        {!loading && activities.length === 0 && (
          <EmptyState
            icon={ClipboardList}
            title={t("activities.noActivities")}
            subtitle={
              (user?.role === "COOP_ADMIN" || user?.role === "FIELD_OFFICER")
                ? "Use the Record Activity button above to log the first activity."
                : "Activities recorded by field officers will appear here."
            }
          />
        )}

        {/* Table */}
        {!loading && filtered.length > 0 && (
          <Card className="border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900">
            <ResponsiveTable minWidth="700px">
              <table className="min-w-full">
                <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {[t("activities.col.date"), t("activities.col.member"), t("activities.col.item"), t("activities.col.quantity"), t("activities.col.notes")].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-550">{h}</th>
                  ))}
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/80">
                {filtered.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <CalendarDays className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />
                        {formatDate(a.activityDate || a.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      {a.memberName || a.memberUsername || a.member?.fullName || a.member?.username || "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30" variant="secondary">
                        {a.itemName || a.item?.name || a.serviceName || "-"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-700 dark:text-gray-350 whitespace-nowrap">{a.metricValue}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs">{a.notes || "-"}<ActivityPhoto activityId={a.id} allowUpload initialDocumentId={photoDocuments[a.id]} /><RejectionReason activity={a} showStatus /></td>
                  </tr>
                ))}
                </tbody>
              </table>
            </ResponsiveTable>
          </Card>
        )}

        {/* Record Activity Modal */}
        <Dialog open={isModalOpen} onOpenChange={open => { if (!open && !isSubmitting) closeModal(); }}>
          <DialogContent className="max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">{ t("dashboard.recordActivity") }</DialogTitle>
              <DialogDescription className="text-gray-500 dark:text-gray-400">Log a member transaction, delivery, or service record</DialogDescription>
            </DialogHeader>
            <form className="space-y-4 pt-2" onSubmit={handleSubmit}>
              {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="memberId" className="text-gray-700 dark:text-gray-350">{ t("common.member") }</Label>
                <select id="memberId" name="memberId" value={form.memberId} onChange={handleFormChange} required
                        className="flex h-9 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-1 text-sm text-gray-900 dark:text-white shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus:border-emerald-500">
                  <option value="" disabled className="dark:bg-gray-900 dark:text-white">Select member</option>
                  {filteredMembers.length === 0 ? (
                      <option value="" disabled className="dark:bg-gray-900 dark:text-white">No members available</option>
                  ) : (
                      filteredMembers.map(m => (
                          <option key={m.id} value={m.id} className="dark:bg-gray-900 dark:text-white">{m.fullName || m.username || `Member #${m.id}`}</option>
                      ))
                  )}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="itemId" className="text-gray-700 dark:text-gray-350">{ t("activities.col.item") }</Label>
                <select id="itemId" name="itemId" value={form.itemId} onChange={handleFormChange} required
                        className="flex h-9 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-1 text-sm text-gray-900 dark:text-white shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus:border-emerald-500">
                  <option value="" disabled className="dark:bg-gray-900 dark:text-white">Select item</option>
                  {catalogItems.map(i => (
                      <option key={i.id} value={i.id} className="dark:bg-gray-900 dark:text-white">{i.name || `Item #${i.id}`}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="metricValue" className="text-gray-700 dark:text-gray-350">Quantity / Volume</Label>
                <Input id="metricValue" name="metricValue" type="number" min="0" step="any" value={form.metricValue} onChange={handleFormChange} required placeholder="Enter quantity" className="bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <Label className="text-gray-700 dark:text-gray-350">Activity Date</Label>
                <input
                  type="date"
                  name="activityDate"
                  value={form.activityDate}
                  onChange={handleFormChange}
                  className="flex h-9 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-1 text-sm text-gray-900 dark:text-white shadow-sm focus-visible:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-gray-700 dark:text-gray-350">Notes</Label>
                <textarea id="notes" name="notes" value={form.notes} onChange={handleFormChange} rows={3} placeholder="Optional details"
                          className="flex w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-white shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus:border-emerald-500" />
              </div>
              <label className="block text-sm">{t('photos.upload')}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={isSubmitting} onChange={e => setPhoto(e.target.files?.[0] || null)} className="block w-full mt-1" /></label>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <Button type="button" variant="outline" disabled={isSubmitting} onClick={closeModal} className="dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-300">{ t("common.cancel") }</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? t("common.loading") : "Record Activity"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default Activities;
