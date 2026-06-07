import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generateSyncUuid, getCurrentLocation, formatDateToISO } from "@/utils/syncUtils";
import api from "@/services/api";

const ActivityForm = ({ onSubmitSuccess, onCancel, activityDate = null, memberId = null }) => {
  const [formData, setFormData] = useState({
    activityDate: activityDate || formatDateToISO(),
    memberId: memberId || "",
    itemId: "",
    metricValue: "",
    notes: "",
    latitude: null,
    longitude: null,
    syncUuid: "",
  });

  const [members, setMembers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [geoStatus, setGeoStatus] = useState("pending"); // pending, loading, success, denied

  // Initialize form with UUID and attempt geolocation capture
  useEffect(() => {
    const initializeForm = async () => {
      setLoading(true);
      try {
        // Generate sync UUID
        const uuid = generateSyncUuid();
        setFormData((prev) => ({ ...prev, syncUuid: uuid }));

        // Fetch members and items in parallel
        const [membersRes, itemsRes] = await Promise.all([
          api.get("/users/my-coop/members").catch(() => ({ data: [] })),
          api.get("/items").catch(() => ({ data: [] })),
        ]);

        setMembers(Array.isArray(membersRes?.data) ? membersRes.data : membersRes?.data?.content || []);
        setItems(Array.isArray(itemsRes?.data) ? itemsRes.data : itemsRes?.data?.content || []);
      } catch (err) {
        console.error("Failed to initialize form:", err);
        setError("Failed to load form data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    // Attempt geolocation capture
    const captureLocation = async () => {
      setGeoStatus("loading");
      const location = await getCurrentLocation();
      if (location) {
        setFormData((prev) => ({
          ...prev,
          latitude: location.latitude,
          longitude: location.longitude,
        }));
        setGeoStatus("success");
      } else {
        setGeoStatus("denied");
      }
    };

    initializeForm();
    captureLocation();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      if (!formData.memberId || !formData.itemId || !formData.metricValue) {
        throw new Error("Please fill in all required fields.");
      }

      const payload = {
        activityDate: formData.activityDate,
        memberId: parseInt(formData.memberId, 10),
        itemId: parseInt(formData.itemId, 10),
        metricValue: parseFloat(formData.metricValue),
        notes: formData.notes || null,
        latitude: formData.latitude,
        longitude: formData.longitude,
        syncUuid: formData.syncUuid,
      };

      const response = await api.post("/activities", payload);

      setSuccess("Activity recorded successfully!");
      setFormData({
        activityDate: formatDateToISO(),
        memberId: "",
        itemId: "",
        metricValue: "",
        notes: "",
        latitude: formData.latitude,
        longitude: formData.longitude,
        syncUuid: generateSyncUuid(),
      });

      if (onSubmitSuccess) {
        setTimeout(() => onSubmitSuccess(response.data), 1000);
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to submit activity.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="animate-slide-down">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800 animate-slide-down">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Geolocation Status */}
      {geoStatus !== "loading" && (
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
            geoStatus === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}
        >
          <MapPin className="h-3.5 w-3.5" />
          {geoStatus === "success"
            ? `📍 Location captured (${formData.latitude?.toFixed(4)}, ${formData.longitude?.toFixed(4)})`
            : "📍 Location permission denied - activity will be recorded without GPS"}
        </div>
      )}

      {/* Activity Date (Read-only for now, can be edited) */}
      <div className="space-y-2">
        <Label htmlFor="activityDate" className="font-medium text-sm">
          Activity Date
        </Label>
        <Input
          id="activityDate"
          name="activityDate"
          type="date"
          value={formData.activityDate}
          onChange={handleChange}
          className="h-10 border-gray-300"
          required
          disabled={submitting}
        />
      </div>

      {/* Member Selection */}
      <div className="space-y-2">
        <Label htmlFor="memberId" className="font-medium text-sm">
          Member <span className="text-red-500">*</span>
        </Label>
        <select
          id="memberId"
          name="memberId"
          value={formData.memberId}
          onChange={handleChange}
          className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          required
          disabled={submitting}
        >
          <option value="">Select a member...</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.fullName || m.username}
            </option>
          ))}
        </select>
      </div>

      {/* Item/Service Selection */}
      <div className="space-y-2">
        <Label htmlFor="itemId" className="font-medium text-sm">
          Item / Service <span className="text-red-500">*</span>
        </Label>
        <select
          id="itemId"
          name="itemId"
          value={formData.itemId}
          onChange={handleChange}
          className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          required
          disabled={submitting}
        >
          <option value="">Select an item...</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} ({item.unitOfMeasure})
            </option>
          ))}
        </select>
      </div>

      {/* Quantity / Metric Value */}
      <div className="space-y-2">
        <Label htmlFor="metricValue" className="font-medium text-sm">
          Quantity <span className="text-red-500">*</span>
        </Label>
        <Input
          id="metricValue"
          name="metricValue"
          type="number"
          step="0.01"
          min="0"
          value={formData.metricValue}
          onChange={handleChange}
          placeholder="Enter quantity"
          className="h-10 border-gray-300"
          required
          disabled={submitting}
        />
      </div>

      {/* Notes (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="font-medium text-sm text-gray-700">
          Notes (Optional)
        </Label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Add any additional details..."
          className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none text-sm resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={submitting}
        />
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={submitting || loading}
          className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-all"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Recording...
            </>
          ) : (
            "Record Activity"
          )}
        </Button>
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            variant="outline"
            className="flex-1 h-10 rounded-lg"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};

export default ActivityForm;

