import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  getAllItems,
  createItem,
  updateItem,
  deleteItem,
} from "../../services/itemService";

const initialFormState = {
  name: "",
  unitOfMeasure: "",
  defaultUnitPrice: "",
};

const CatalogItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // ─── Fetch Items ─────────────────────────────────────────────────────────
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllItems();
      const data = response.data;
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.content)
          ? data.content
          : Array.isArray(data?.data)
            ? data.data
            : [];
      setItems(list);
    } catch (err) {
      console.error("Failed to fetch items:", err);
      setError("Failed to load catalog items. Please try again.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // ─── Filtering ───────────────────────────────────────────────────────────
  const filteredItems = items.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.name || "").toLowerCase().includes(term) ||
      (item.unitOfMeasure || "").toLowerCase().includes(term)
    );
  });

  // ─── Form Handlers ──────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData(initialFormState);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || "",
      unitOfMeasure: item.unitOfMeasure || "",
      defaultUnitPrice: item.defaultUnitPrice ?? "",
    });
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData(initialFormState);
    setError(null);
  };

  // ─── Submit (Create / Update) ────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const payload = {
      name: formData.name.trim(),
      unitOfMeasure: formData.unitOfMeasure.trim(),
      defaultUnitPrice: parseFloat(formData.defaultUnitPrice),
    };

    try {
      if (editingItem) {
        await updateItem(editingItem.id, payload);
        setSuccessMsg("Item updated successfully!");
      } else {
        await createItem(payload);
        setSuccessMsg("Item created successfully!");
      }
      closeModal();
      await fetchItems();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error("Failed to save item:", err);
      setError(
        err.response?.data?.message ||
          `Failed to ${editingItem ? "update" : "create"} item. Please try again.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Delete ──────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      return;
    }
    setDeletingId(id);
    setError(null);
    setSuccessMsg(null);
    try {
      await deleteItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      setSuccessMsg("Item deleted successfully!");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error("Failed to delete item:", err);
      setError(
        err.response?.data?.message ||
          "Failed to delete item. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ─── Format currency ────────────────────────────────────────────────────
  const formatRWF = (amount) => {
    if (amount == null || isNaN(amount)) return "—";
    return new Intl.NumberFormat("en-RW", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-slide-up">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/25">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Catalog Items</h1>
            <p className="text-sm text-gray-400">Manage the commodities and services your cooperative handles</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchItems}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-500 hover:to-indigo-600 hover:shadow-xl hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Banners */}
      {successMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200/60 bg-emerald-50 p-4 text-sm font-medium text-emerald-700 animate-slide-down">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">✓</span>
          {successMsg}
        </div>
      )}
      {error && !isModalOpen && (
        <div className="rounded-xl border border-red-200/60 bg-red-50 p-4 text-sm font-medium text-red-700 animate-slide-down">{error}</div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md animate-slide-up" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search items by name or unit…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
        />
      </div>

      {/* Items Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm animate-slide-up" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-50/50">
                {["Name", "Unit of Measure", "Default Unit Price (RWF)", "Actions"].map((header) => (
                  <th key={header} className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-500" />
                    <p className="mt-3 text-sm text-gray-400">Loading items…</p>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <Package className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-3 text-sm text-gray-400">No catalog items found. Add one to get started.</p>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <Search className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-3 text-sm text-gray-400">No items match your search.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="transition-colors duration-150 hover:bg-indigo-50/30">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">{item.name}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{item.unitOfMeasure}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-gray-700">{formatRWF(item.defaultUnitPrice)} RWF</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200/60 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-all hover:bg-amber-100 hover:shadow-sm hover:-translate-y-0.5"
                          title="Edit item"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-red-200/60 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-all hover:bg-red-100 hover:shadow-sm hover:-translate-y-0.5 disabled:opacity-50"
                          title="Delete item"
                        >
                          {deletingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-gray-200/60 bg-white shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-md shadow-indigo-500/20">
                  <Package className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">{editingItem ? "Edit Item" : "Add New Item"}</h2>
              </div>
              <button onClick={closeModal} className="rounded-xl p-2 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5">
              {error && isModalOpen && (
                <div className="mb-4 rounded-xl border border-red-200/60 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-gray-700">Item Name</label>
                  <input
                    id="name" name="name" type="text" required value={formData.name} onChange={handleInputChange}
                    placeholder="e.g. Coffee Beans, Transport Service"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-sm shadow-sm transition-all duration-200 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="unitOfMeasure" className="mb-1.5 block text-sm font-semibold text-gray-700">Unit of Measure</label>
                  <input
                    id="unitOfMeasure" name="unitOfMeasure" type="text" required value={formData.unitOfMeasure} onChange={handleInputChange}
                    placeholder="e.g. KG, MT, TRIPS, LITERS"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-sm shadow-sm transition-all duration-200 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="defaultUnitPrice" className="mb-1.5 block text-sm font-semibold text-gray-700">Default Unit Price (RWF)</label>
                  <input
                    id="defaultUnitPrice" name="defaultUnitPrice" type="number" required min="0" step="any" value={formData.defaultUnitPrice} onChange={handleInputChange}
                    placeholder="e.g. 1500"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-sm shadow-sm transition-all duration-200 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button" onClick={closeModal}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 hover:shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-500 hover:to-indigo-600 hover:shadow-xl disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? (editingItem ? "Updating…" : "Creating…") : (editingItem ? "Update Item" : "Create Item")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogItems;

