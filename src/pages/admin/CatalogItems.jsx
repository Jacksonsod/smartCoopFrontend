import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { getAllItems, createItem, updateItem, deleteItem } from "@/services/itemService";
import { getSectorUnits } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const SECTOR_OPTIONS = ["AGRICULTURE", "MINING", "TRANSPORT", "ARTISAN", "SERVICE"];
const initialFormState = { name: "", sectorType: "", unitOfMeasure: "", defaultUnitPrice: "", category: "" };

const CatalogItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [sectorUnits, setSectorUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchItems = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = (await getAllItems()).data;
      setItems(Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : Array.isArray(data?.data) ? data.data : []);
    } catch {
      setError("Failed to load catalog items."); setItems([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

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

  const filteredItems = items.filter(item => {
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    return (item.name || "").toLowerCase().includes(t) || (item.unitOfMeasure || "").toLowerCase().includes(t);
  });

   const handleInputChange = (e) => { const { name, value } = e.target; setFormData(p => ({ ...p, [name]: value })); };

   const handleSectorChange = (value) => {
     setFormData((prev) => ({ ...prev, sectorType: value, unitOfMeasure: "" }));
   };

   const handleUnitChange = (value) => {
     setFormData((prev) => ({ ...prev, unitOfMeasure: value }));
   };

  const openCreateModal = () => { setEditingItem(null); setFormData(initialFormState); setError(null); setIsModalOpen(true); };
   const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || "",
      sectorType: item.sectorType || "",
      unitOfMeasure: item.unitOfMeasure || "",
      defaultUnitPrice: item.defaultUnitPrice ?? "",
      category: item.category || ""
    });
    setError(null); setIsModalOpen(true);
  };
  const closeModal = () => { setIsModalOpen(false); setEditingItem(null); setFormData(initialFormState); setError(null); };

   const handleSubmit = async (e) => {
     e.preventDefault(); setSubmitting(true); setError(null); setSuccessMsg(null);

     // Validate required fields
     if (!formData.name.trim() || !formData.sectorType || !formData.unitOfMeasure || !formData.defaultUnitPrice) {
       setError("Please fill in all required fields (Name, Sector, Unit, Price)");
       setSubmitting(false);
       return;
     }

     const payload = {
       name: formData.name.trim(),
       sectorType: formData.sectorType,
       unitOfMeasure: formData.unitOfMeasure,
       defaultUnitPrice: parseFloat(formData.defaultUnitPrice),
       category: formData.category.trim() || formData.sectorType
     };
     try {
       if (editingItem) { await updateItem(editingItem.id, payload); setSuccessMsg("Item updated!"); }
       else { await createItem(payload); setSuccessMsg("Item created!"); }
       closeModal(); await fetchItems(); setTimeout(() => setSuccessMsg(null), 4000);
     } catch (err) {
       setError(err.response?.data?.message || `Failed to ${editingItem ? "update" : "create"} item.`);
     } finally { setSubmitting(false); }
   };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item permanently?")) return;
    setDeletingId(id); setError(null); setSuccessMsg(null);
    try {
      await deleteItem(id);
      setItems(prev => prev.filter(item => item.id !== id));
      setSuccessMsg("Item deleted!"); setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete item.");
    } finally { setDeletingId(null); }
  };

  const formatRWF = (amount) => {
    if (amount == null || isNaN(amount)) return "—";
    return new Intl.NumberFormat("en-RW", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catalog Items</h1>
          <p className="text-sm text-gray-500 mt-1">Manage the commodities and services your cooperative handles</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchItems} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button onClick={openCreateModal} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <Alert className="bg-emerald-50 border-emerald-200 text-emerald-700 animate-slide-down">
          <AlertDescription>{successMsg}</AlertDescription>
        </Alert>
      )}
      {error && !isModalOpen && (
        <Alert variant="destructive" className="animate-slide-down">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input placeholder="Search items by name or unit…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
           <table className="min-w-full">
             <thead>
               <tr className="border-b bg-gray-50/50">
                 {["Name", "Sector", "Unit of Measure", "Default Unit Price (RWF)", "Actions"].map(h => (
                   <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">{h}</th>
                 ))}
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-50">
               {loading ? (
                 <tr>
                   <td colSpan={5} className="py-16 text-center">
                     <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-500" />
                     <p className="mt-2 text-sm text-gray-400">Loading items…</p>
                   </td>
                 </tr>
               ) : items.length === 0 ? (
                 <tr>
                   <td colSpan={5} className="py-16 text-center">
                     <Package className="mx-auto h-10 w-10 text-gray-300" />
                     <p className="mt-2 text-sm text-gray-400">No catalog items yet. Add one to get started.</p>
                   </td>
                 </tr>
               ) : filteredItems.length === 0 ? (
                 <tr>
                   <td colSpan={5} className="py-16 text-center">
                     <Search className="mx-auto h-10 w-10 text-gray-300" />
                     <p className="mt-2 text-sm text-gray-400">No items match your search.</p>
                   </td>
                 </tr>
               ) : (
                 filteredItems.map(item => (
                   <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                     <td className="whitespace-nowrap px-5 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                     <td className="whitespace-nowrap px-5 py-3 text-sm text-gray-500">{item.sectorType || "—"}</td>
                     <td className="whitespace-nowrap px-5 py-3 text-sm text-gray-500">{item.unitOfMeasure}</td>
                     <td className="whitespace-nowrap px-5 py-3 text-sm font-mono text-gray-700">{formatRWF(item.defaultUnitPrice)} RWF</td>
                     <td className="whitespace-nowrap px-5 py-3">
                       <div className="flex items-center gap-1.5">
                         <Button size="sm" variant="outline" onClick={() => openEditModal(item)}
                           className="text-xs text-amber-700 border-amber-200 hover:bg-amber-50">
                           <Pencil className="h-3 w-3 mr-1" /> Edit
                         </Button>
                         <Button size="sm" variant="outline" onClick={() => handleDelete(item.id)} disabled={deletingId === item.id}
                           className="text-xs text-red-600 border-red-200 hover:bg-red-50">
                           {deletingId === item.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3 w-3 mr-1" />}
                           Delete
                         </Button>
                       </div>
                     </td>
                   </tr>
                 ))
               )}
             </tbody>
           </table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
            <DialogDescription>{editingItem ? "Update the item details below" : "Fill in the item details to add it to your catalog"}</DialogDescription>
          </DialogHeader>
           <form onSubmit={handleSubmit} className="space-y-4 pt-2">
             {error && isModalOpen && (
               <Alert variant="destructive">
                 <AlertDescription>{error}</AlertDescription>
               </Alert>
             )}

             <div className="space-y-1.5">
               <Label htmlFor="name">Item Name <span className="text-red-500">*</span></Label>
               <Input id="name" name="name" required placeholder="e.g. Coffee Beans" value={formData.name} onChange={handleInputChange} disabled={submitting} />
             </div>

             <div className="space-y-1.5">
               <Label htmlFor="sectorType">Sector Type <span className="text-red-500">*</span></Label>
               <Select value={formData.sectorType} onValueChange={handleSectorChange} disabled={submitting}>
                 <SelectTrigger>
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

             <div className="space-y-1.5">
               <Label htmlFor="unitOfMeasure">Unit of Measure <span className="text-red-500">*</span></Label>
               {loadingUnits ? (
                 <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-500">
                   <Loader2 className="h-4 w-4 animate-spin" />
                   Loading units...
                 </div>
               ) : (
                 <Select value={formData.unitOfMeasure} onValueChange={handleUnitChange} disabled={submitting || sectorUnits.length === 0}>
                   <SelectTrigger>
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

             <div className="space-y-1.5">
               <Label htmlFor="category">Category (Optional)</Label>
               <Input id="category" name="category" placeholder="e.g. Premium" value={formData.category} onChange={handleInputChange} disabled={submitting} />
             </div>

             <div className="space-y-1.5">
               <Label htmlFor="defaultUnitPrice">Default Unit Price (RWF) <span className="text-red-500">*</span></Label>
               <Input id="defaultUnitPrice" name="defaultUnitPrice" type="number" required min="0" step="any" placeholder="e.g. 1500" value={formData.defaultUnitPrice} onChange={handleInputChange} disabled={submitting} />
             </div>

             <div className="flex justify-end gap-3 pt-4 border-t">
               <Button type="button" variant="outline" onClick={closeModal} disabled={submitting}>Cancel</Button>
               <Button type="submit" disabled={submitting || loadingUnits} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                 {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                 {submitting ? (editingItem ? "Updating…" : "Creating…") : (editingItem ? "Update Item" : "Create Item")}
               </Button>
             </div>
           </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CatalogItems;
