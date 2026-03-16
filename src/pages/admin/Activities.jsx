import { useEffect, useMemo, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getCoopActivities, recordActivity } from "@/services/activityService";
import { getMyCoopStaff } from "@/services/userService";
import { getAllItems } from "@/services/itemService";

const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [members, setMembers] = useState([]);
  const [catalogItems, setCatalogItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    memberId: "",
    itemId: "",
    metricValue: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      getCoopActivities(),
      getMyCoopStaff(),
      getAllItems(),
    ]).then(([activitiesRes, membersRes, itemsRes]) => {
      if (!mounted) return;
      setActivities(extractList(activitiesRes?.data));
      const membersList = extractList(membersRes?.data);
      console.log("[Activities] Members fetched:", membersList);
      setMembers(membersList);
      setCatalogItems(extractList(itemsRes?.data));
      setLoading(false);
    }).catch(() => {
      if (!mounted) return;
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const filteredMembers = useMemo(() =>
    members.filter((m) => String(m.role).toLowerCase() === "member"),
    [members]
  );

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenModal = () => {
    setForm({ memberId: "", itemId: "", metricValue: "", notes: "" });
    setError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const payload = {
        memberId: form.memberId,
        itemId: form.itemId,
        metricValue: Number(form.metricValue),
        notes: form.notes,
      };
      await recordActivity(payload);
      setIsModalOpen(false);
      setIsSubmitting(false);
      // Refresh activities
      setLoading(true);
      const activitiesRes = await getCoopActivities();
      setActivities(extractList(activitiesRes?.data));
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record activity.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Cooperative Activities</h1>
        <Button onClick={handleOpenModal} className="bg-emerald-600 text-white hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" /> Record Activity
        </Button>
      </div>
      <Separator />
      <Card>
        <CardHeader>
          <CardTitle>Activity Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-40 items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
              <span className="text-sm text-gray-500">Loading activities...</span>
            </div>
          ) : activities.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">No activities recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-md">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Member Name</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Item/Service</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Quantity</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity) => (
                    <tr key={activity.id} className="border-b last:border-b-0">
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {new Date(activity.activityDate || activity.createdAt).toLocaleString("en-GB", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {activity.memberName || activity.member?.fullName || activity.member?.username || "-"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {activity.itemName || activity.item?.name || activity.serviceName || "-"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {activity.metricValue}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {activity.notes || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Record Activity</h2>
            {error && (
              <div className="mb-3 text-sm text-red-600">{error}</div>
            )}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="memberId">Member</Label>
                <select
                  id="memberId"
                  name="memberId"
                  value={form.memberId}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="" disabled>Select member</option>
                   {filteredMembers.length === 0 ? (
                     <option value="" disabled>No members available</option>
                   ) : (
                     filteredMembers.map((member) => (
                       <option key={member.id} value={member.id}>
                         {member.fullName || member.username || `Member #${member.id}`}
                       </option>
                     ))
                   )}
                </select>
              </div>
              <div>
                <Label htmlFor="itemId">Item/Service</Label>
                <select
                  id="itemId"
                  name="itemId"
                  value={form.itemId}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="" disabled>Select item/service</option>
                  {catalogItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name || item.serviceName || `Item #${item.id}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="metricValue">Quantity / Volume</Label>
                <Input
                  id="metricValue"
                  name="metricValue"
                  type="number"
                  min="0"
                  value={form.metricValue}
                  onChange={handleFormChange}
                  required
                  className="w-full"
                  placeholder="Enter quantity"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  name="notes"
                  value={form.notes}
                  onChange={handleFormChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Optional details"
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-end gap-3 mt-4">
                <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
                <Button type="submit" className="bg-emerald-600 text-white" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Record Activity
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Activities;

