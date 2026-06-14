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

  const isLegacy = localStorage.getItem("designMode") === "legacy";

  if (isLegacy) {
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
  }

  // ─── Modernized Render ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Catalog Items</h1>
          <p className="text-sm text-gray-500 mt-1">Manage the commodities and services your cooperative handles</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchItems}
            disabled={loading}
            className="rounded-xl border-gray-200 hover:bg-gray-50 gap-2 text-xs font-bold"
          >
            <RefreshCw className={`h-4 w-4 text-gray-550 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button
            onClick={openCreateModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs text-xs font-bold gap-1.5 h-9"
          >
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <Alert className="bg-emerald-50 border-emerald-200 text-emerald-700 animate-slide-down rounded-xl shadow-xs">
          <AlertDescription className="font-medium text-xs">{successMsg}</AlertDescription>
        </Alert>
      )}
      {error && !isModalOpen && (
        <Alert variant="destructive" className="animate-slide-down rounded-xl shadow-xs">
          <AlertDescription className="font-medium text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search items by name or unit…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-9 rounded-xl border-gray-205 focus-visible:ring-emerald-500/25"
        />
      </div>
      <Card className="overflow-hidden border border-gray-150 dark:border-gray-800 shadow-xs rounded-xl bg-white dark:bg-gray-900">
        <div className="overflow-x-auto">
           {loading ? (
             <div className="py-20 text-center flex flex-col items-center justify-center">
               <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-2" />
               <p className="text-sm text-gray-500 dark:text-gray-400">Loading catalog items…</p>
             </div>
           ) : items.length === 0 ? (
             <div className="py-20 text-center flex flex-col items-center justify-center">
               <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 mb-4 shadow-sm">
                 <Package className="h-7 w-7 text-emerald-650 dark:text-emerald-400" />
               </div>
               <p className="text-base font-bold text-gray-950 dark:text-white">No catalog items yet</p>
               <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 max-w-xs mx-auto">Add commodities or services to get started with transactions.</p>
             </div>
           ) : filteredItems.length === 0 ? (
             <div className="py-20 text-center flex flex-col items-center justify-center">
               <Search className="h-10 w-10 text-gray-300 dark:text-gray-700 mb-2" />
               <p className="text-sm text-gray-450 dark:text-gray-400">No items match your search query.</p>
             </div>
           ) : (
             <>
               {/* Desktop View (Table) */}
               <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800 hidden md:table">
                 <thead className="bg-gray-50/75 dark:bg-gray-950/50">
                   <tr>
                     {["Name", "Sector", "Unit of Measure", "Default Unit Price", "Actions"].map(h => (
                       <th
                         key={h}
                         className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-550"
                       >
                         {h}
                       </th>
                     ))}
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50 dark:divide-gray-800 bg-white dark:bg-gray-900">
                   {filteredItems.map(item => (
                     <tr key={item.id} className="hover:bg-emerald-50/10 dark:hover:bg-emerald-955/10 transition-colors duration-150">
                       <td className="whitespace-nowrap px-5 py-4 text-xs font-semibold text-gray-900 dark:text-white">
                         <div className="flex items-center gap-2">
                           <div className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-955/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-650 dark:text-emerald-400">
                             <Package className="h-3.5 w-3.5" />
                           </div>
                           {item.name}
                         </div>
                       </td>
                       <td className="whitespace-nowrap px-5 py-4 text-xs text-gray-500 dark:text-gray-400">
                         <span className="inline-flex items-center rounded-md bg-gray-50 dark:bg-gray-800 px-2 py-1 text-xs font-medium text-gray-650 dark:text-gray-350 ring-1 ring-inset ring-gray-500/10 dark:ring-gray-700/30">
                           {item.sectorType || "—"}
                         </span>
                       </td>
                       <td className="whitespace-nowrap px-5 py-4 text-xs text-gray-550 dark:text-gray-400 font-medium">{item.unitOfMeasure}</td>
                       <td className="whitespace-nowrap px-5 py-4 text-xs font-mono font-bold text-gray-900 dark:text-white">
                         {formatRWF(item.defaultUnitPrice)} RWF
                       </td>
                       <td className="whitespace-nowrap px-5 py-4 text-xs">
                         <div className="flex items-center gap-1.5">
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => openEditModal(item)}
                             className="text-xs font-bold text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50 hover:bg-amber-50 dark:hover:bg-amber-955/20 h-8 px-2.5 rounded-lg"
                           >
                             <Pencil className="h-3 w-3 mr-1" /> Edit
                           </Button>
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => handleDelete(item.id)}
                             disabled={deletingId === item.id}
                             className="text-xs font-bold text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-955/20 h-8 px-2.5 rounded-lg"
                           >
                             {deletingId === item.id ? (
                               <Loader2 className="h-3 w-3 animate-spin mr-1" />
                             ) : (
                               <Trash2 className="h-3 w-3 mr-1" />
                             )}
                             Delete
                           </Button>
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>

               {/* Mobile View (Card List) */}
               <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                 {filteredItems.map(item => (
                   <div
                     key={item.id}
                     className="bg-white dark:bg-gray-900 rounded-xl border border-gray-150 dark:border-gray-800 p-4 shadow-xs space-y-3"
                   >
                     <div className="flex justify-between items-start">
                       <div className="flex items-center gap-2">
                         <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-955/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                           <Package className="h-4 w-4" />
                         </div>
                         <div>
                           <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.name}</p>
                           {item.category && (
                             <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">{item.category}</p>
                           )}
                         </div>
                       </div>
                       <span className="inline-flex items-center rounded-md bg-gray-50 dark:bg-gray-800 px-2 py-0.5 text-[10px] font-bold text-gray-650 dark:text-gray-350 ring-1 ring-inset ring-gray-500/10 dark:ring-gray-700/30">
                         {item.sectorType || "—"}
                       </span>
                     </div>

                     <div className="grid grid-cols-2 gap-2 text-xs border-y border-gray-50 dark:border-gray-800 py-2.5">
                       <div>
                         <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 block tracking-wider">Unit</span>
                         <span className="text-gray-800 dark:text-gray-200 font-medium block mt-0.5">{item.unitOfMeasure}</span>
                       </div>
                       <div>
                         <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 block tracking-wider">Unit Price</span>
                         <span className="text-gray-900 dark:text-white font-mono font-bold block mt-0.5">{formatRWF(item.defaultUnitPrice)} RWF</span>
                       </div>
                     </div>

                     <div className="flex gap-2 pt-1">
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={() => openEditModal(item)}
                         className="flex-1 text-xs font-bold text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50 hover:bg-amber-50 dark:hover:bg-amber-955/20 h-8.5 rounded-lg"
                       >
                         <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                       </Button>
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={() => handleDelete(item.id)}
                         disabled={deletingId === item.id}
                         className="flex-1 text-xs font-bold text-red-650 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-955/20 h-8.5 rounded-lg"
                       >
                         {deletingId === item.id ? (
                           <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                         ) : (
                           <Trash2 className="h-3.5 w-3.5 mr-1" />
                         )}
                         Delete
                       </Button>
                     </div>
                   </div>
                 ))}
               </div>
             </>
           )}
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-950">{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
            <DialogDescription className="text-xs text-gray-500 mt-1">
              {editingItem ? "Update the item details below" : "Fill in the item details to add it to your catalog"}
            </DialogDescription>
          </DialogHeader>
           <form onSubmit={handleSubmit} className="space-y-4 pt-2">
             {error && isModalOpen && (
               <Alert variant="destructive" className="rounded-xl shadow-xs">
                 <AlertDescription className="font-medium text-xs">{error}</AlertDescription>
               </Alert>
             )}

             <div className="space-y-1.5">
               <Label htmlFor="name" className="text-xs font-semibold text-gray-800">Item Name <span className="text-red-500">*</span></Label>
               <Input
                 id="name"
                 name="name"
                 required
                 placeholder="e.g. Coffee Beans"
                 value={formData.name}
                 onChange={handleInputChange}
                 disabled={submitting}
                 className="rounded-xl border-gray-250 focus-visible:ring-emerald-500/25 text-xs"
               />
             </div>

             <div className="space-y-1.5">
               <Label htmlFor="sectorType" className="text-xs font-semibold text-gray-800">Sector Type <span className="text-red-500">*</span></Label>
               <Select value={formData.sectorType} onValueChange={handleSectorChange} disabled={submitting}>
                 <SelectTrigger className="rounded-xl border-gray-250 text-xs">
                   <SelectValue placeholder="Select a sector..." />
                 </SelectTrigger>
                 <SelectContent className="rounded-xl">
                   {SECTOR_OPTIONS.map((sector) => (
                     <SelectItem key={sector} value={sector} className="text-xs">
                       {sector}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>

             <div className="space-y-1.5">
               <Label htmlFor="unitOfMeasure" className="text-xs font-semibold text-gray-800">Unit of Measure <span className="text-red-500">*</span></Label>
               {loadingUnits ? (
                 <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-500">
                   <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                   Loading units...
                 </div>
               ) : (
                 <Select value={formData.unitOfMeasure} onValueChange={handleUnitChange} disabled={submitting || sectorUnits.length === 0}>
                   <SelectTrigger className="rounded-xl border-gray-250 text-xs">
                     <SelectValue placeholder={sectorUnits.length === 0 ? "Select a sector first..." : "Select unit..."} />
                   </SelectTrigger>
                   <SelectContent className="rounded-xl">
                     {sectorUnits.length > 0 ? (
                       sectorUnits.map((unit) => (
                         <SelectItem key={unit} value={unit} className="text-xs">
                           {unit}
                         </SelectItem>
                       ))
                     ) : (
                       <SelectItem value="" disabled className="text-xs">
                         No units available
                       </SelectItem>
                     )}
                   </SelectContent>
                 </Select>
               )}
             </div>

             <div className="space-y-1.5">
               <Label htmlFor="category" className="text-xs font-semibold text-gray-800">Category (Optional)</Label>
               <Input
                 id="category"
                 name="category"
                 placeholder="e.g. Premium"
                 value={formData.category}
                 onChange={handleInputChange}
                 disabled={submitting}
                 className="rounded-xl border-gray-250 focus-visible:ring-emerald-500/25 text-xs"
               />
             </div>

             <div className="space-y-1.5">
               <Label htmlFor="defaultUnitPrice" className="text-xs font-semibold text-gray-800">Default Unit Price (RWF) <span className="text-red-500">*</span></Label>
               <Input
                 id="defaultUnitPrice"
                 name="defaultUnitPrice"
                 type="number"
                 required
                 min="0"
                 step="any"
                 placeholder="e.g. 1500"
                 value={formData.defaultUnitPrice}
                 onChange={handleInputChange}
                 disabled={submitting}
                 className="rounded-xl border-gray-250 focus-visible:ring-emerald-500/25 text-xs"
               />
             </div>

             <div className="flex justify-end gap-2.5 pt-4 border-t">
               <Button
                 type="button"
                 variant="outline"
                 onClick={closeModal}
                 disabled={submitting}
                 className="rounded-xl border-gray-200 hover:bg-gray-50 text-xs font-bold"
               >
                 Cancel
               </Button>
               <Button
                 type="submit"
                 disabled={submitting || loadingUnits}
                 className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs text-xs font-bold gap-1.5"
               >
                 {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
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
