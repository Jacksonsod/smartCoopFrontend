import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSectorUnits } from "@/services/api";
import { createItem } from "@/services/itemService";

const SECTOR_OPTIONS = ["AGRICULTURE", "MINING", "TRANSPORT", "ARTISAN", "SERVICE"];

const CoopItemForm = ({ onSubmitSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    sectorType: "",
    unitOfMeasure: "",
    defaultUnitPrice: "",
    description: "",
  });

  const [sectorUnits, setSectorUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch sector units when sector changes
  useEffect(() => {
    if (!formData.sectorType) {
      setSectorUnits([]);
      setFormData((prev) => ({ ...prev, unitOfMeasure: "" }));
      return;
    }

    const fetchUnits = async () => {
      setLoadingUnits(true);
      try {
        const response = await getSectorUnits(formData.sectorType);
        const units = Array.isArray(response.data) ? response.data : response?.data?.units || [];
        setSectorUnits(units);
      } catch (err) {
        console.error("Failed to fetch sector units:", err);
        setSectorUnits([]);
      } finally {
        setLoadingUnits(false);
      }
    };

    fetchUnits();
  }, [formData.sectorType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSectorChange = (value) => {
    setFormData((prev) => ({ ...prev, sectorType: value, unitOfMeasure: "" }));
  };

  const handleUnitChange = (value) => {
    setFormData((prev) => ({ ...prev, unitOfMeasure: value }));
  };

   const handleSubmit = async (e) => {
     e.preventDefault();
     setError("");
     setSuccess("");
     setSubmitting(true);

     try {
       if (!formData.name || !formData.sectorType || !formData.unitOfMeasure || !formData.defaultUnitPrice) {
         throw new Error("Please fill in all required fields.");
       }

       const payload = {
         name: formData.name,
         category: formData.category || formData.sectorType,
         sectorType: formData.sectorType,
         unitOfMeasure: formData.unitOfMeasure,
         defaultUnitPrice: parseFloat(formData.defaultUnitPrice),
         description: formData.description || null,
       };

       const response = await createItem(payload);

       setSuccess("Item created successfully!");
       setFormData({
         name: "",
         category: "",
         sectorType: "",
         unitOfMeasure: "",
         defaultUnitPrice: "",
         description: "",
       });
       setSectorUnits([]);

       if (onSubmitSuccess) {
         setTimeout(() => onSubmitSuccess(response.data), 1000);
       }
     } catch (err) {
       const message = err.response?.data?.message || err.message || "Failed to create item.";
       setError(message);
     } finally {
       setSubmitting(false);
     }
   };

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

      {/* Item Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="font-medium text-sm">
          Item Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Organic Coffee Beans"
          className="h-10 border-gray-300"
          required
          disabled={submitting}
        />
      </div>

      {/* Sector Type */}
      <div className="space-y-2">
        <Label htmlFor="sectorType" className="font-medium text-sm">
          Sector Type <span className="text-red-500">*</span>
        </Label>
        <Select value={formData.sectorType} onValueChange={handleSectorChange} disabled={submitting}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Select a sector..." />
          </SelectTrigger>
          <SelectContent>
            {SECTOR_OPTIONS.map((sector) => (
              <SelectItem key={sector} value={sector}>
                {sector}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Unit of Measure (Dynamic based on Sector) */}
      <div className="space-y-2">
        <Label htmlFor="unitOfMeasure" className="font-medium text-sm">
          Unit of Measure <span className="text-red-500">*</span>
        </Label>
        {loadingUnits ? (
          <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading units for {formData.sectorType}...
          </div>
        ) : (
          <Select value={formData.unitOfMeasure} onValueChange={handleUnitChange} disabled={submitting || sectorUnits.length === 0}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder={sectorUnits.length === 0 ? "Select a sector first..." : "Select unit..."} />
            </SelectTrigger>
            <SelectContent>
              {sectorUnits.length > 0 ? (
                sectorUnits.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="" disabled>
                  No units available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Category (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="category" className="font-medium text-sm text-gray-700">
          Category (Optional)
        </Label>
        <Input
          id="category"
          name="category"
          type="text"
          value={formData.category}
          onChange={handleChange}
          placeholder="e.g., Premium"
          className="h-10 border-gray-300"
          disabled={submitting}
        />
      </div>

      {/* Default Unit Price */}
      <div className="space-y-2">
        <Label htmlFor="defaultUnitPrice" className="font-medium text-sm">
          Default Unit Price (RWF) <span className="text-red-500">*</span>
        </Label>
        <Input
          id="defaultUnitPrice"
          name="defaultUnitPrice"
          type="number"
          step="0.01"
          min="0"
          value={formData.defaultUnitPrice}
          onChange={handleChange}
          placeholder="e.g., 1500"
          className="h-10 border-gray-300"
          required
          disabled={submitting}
        />
      </div>

      {/* Description (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="description" className="font-medium text-sm text-gray-700">
          Description (Optional)
        </Label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Add details about this item..."
          className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none text-sm resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={submitting}
        />
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={submitting || loadingUnits}
          className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-all"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Item"
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

export default CoopItemForm;

