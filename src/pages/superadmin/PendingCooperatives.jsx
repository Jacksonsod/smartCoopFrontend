import React, { useEffect, useState } from "react";
import { getAllCooperatives, activateCooperative, deactivateCooperative } from "../../services/cooperativeService";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";

const PendingCooperatives = () => {
  const [cooperatives, setCooperatives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activatingId, setActivatingId] = useState(null);
  const [deactivatingId, setDeactivatingId] = useState(null);

  const fetchCooperatives = async () => {
    setLoading(true);
    try {
      const { data } = await getAllCooperatives();
      setCooperatives(data);
    } catch (err) {
      // handle error (optional: show toast)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCooperatives();
  }, []);

  const handleActivate = async (id) => {
    setActivatingId(id);
    try {
      await activateCooperative(id);
      // Show toast (success)
      if (window.toast) window.toast.success("Cooperative activated! Welcome email sent.");
      fetchCooperatives();
    } catch (err) {
      if (window.toast) window.toast.error("Activation failed. Try again.");
    } finally {
      setActivatingId(null);
    }
  };

  const handleDeactivate = async (id) => {
    setDeactivatingId(id);
    try {
      await deactivateCooperative(id);
      if (window.toast) window.toast.success("Cooperative deactivated successfully.");
      fetchCooperatives();
    } catch (err) {
      if (window.toast) window.toast.error("Deactivation failed. Try again.");
    } finally {
      setDeactivatingId(null);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Pending Cooperatives</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">RCA Number</th>
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2 text-left">Representative</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8">Loading...</td>
              </tr>
            ) : cooperatives.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8">No cooperatives found.</td>
              </tr>
            ) : (
              cooperatives.map((coop) => (
                <tr key={coop.id} className="border-t">
                  <td className="px-4 py-2">{coop.name}</td>
                  <td className="px-4 py-2">{coop.rcaNumber}</td>
                  <td className="px-4 py-2">{coop.category}</td>
                  <td className="px-4 py-2">{coop.representativeName}</td>
                  <td className="px-4 py-2 text-gray-500 text-sm w-48 truncate max-w-xs">{coop.representativeEmail || "—"}</td>
                  <td className="px-4 py-2">
                    {coop.status === "ACTIVE" ? (
                      <Badge className="bg-green-100 text-green-700 border border-green-400">ACTIVE</Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-400">INACTIVE</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {coop.status === "INACTIVE" ? (
                      <Button
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={activatingId === coop.id}
                        onClick={() => handleActivate(coop.id)}
                      >
                        {activatingId === coop.id ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                            </svg>
                            Activating...
                          </span>
                        ) : "Approve & Activate"}
                      </Button>
                    ) : coop.status === "ACTIVE" ? (
                      <Button
                        className="bg-red-600 hover:bg-red-700 text-white"
                        disabled={deactivatingId === coop.id}
                        onClick={() => handleDeactivate(coop.id)}
                      >
                        {deactivatingId === coop.id ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                            </svg>
                            Deactivating...
                          </span>
                        ) : "Deactivate"}
                      </Button>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PendingCooperatives;
