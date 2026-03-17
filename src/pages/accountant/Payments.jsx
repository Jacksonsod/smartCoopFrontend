import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { Badge } from "../../components/ui/badge";

const Payments = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchPendingActivities = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/payments/pending");
      setActivities(data || []);
    } catch (err) {
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingActivities();
  }, []);

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      await api.patch(`/payments/${id}/approve`);
      fetchPendingActivities();
    } catch (err) {
      alert("Failed to approve payment.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Pending Payments</h2>
      {loading ? (
        <div className="flex justify-center items-center h-40">Loading...</div>
      ) : activities.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No pending payments found.</div>
      ) : (
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2">Member Name</th>
              <th className="px-4 py-2">Item</th>
              <th className="px-4 py-2">Quantity</th>
              <th className="px-4 py-2">Total Revenue (RWF)</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="px-4 py-2">{a.memberName}</td>
                <td className="px-4 py-2">{a.itemName}</td>
                <td className="px-4 py-2">{a.metricValue}</td>
                <td className="px-4 py-2">{a.revenue}</td>
                <td className="px-4 py-2">
                  <Badge className={a.status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>{a.status}</Badge>
                </td>
                <td className="px-4 py-2">
                  {a.status !== "COMPLETED" && (
                    <button
                      className="px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                      disabled={processingId === a.id}
                      onClick={() => handleApprove(a.id)}
                    >
                      {processingId === a.id ? "Processing..." : "Approve Payment"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Payments;
