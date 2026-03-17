import React, { useEffect, useState } from "react";
import { getAllActivities } from "../../services/activityService";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const ActivitiesLedger = () => {
  const [activities, setActivities] = useState([]);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    console.log("Current User:", user);
    getAllActivities().then(({ data }) => setActivities(data));
  }, []);

  useEffect(() => {
    setFiltered(
      (activities || []).filter(a =>
        a.memberName?.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, activities]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Activities Ledger</h2>
      <div className="flex flex-col sm:flex-row gap-4 items-center mb-6">
        <Input
          className="border border-gray-300 rounded-lg shadow-sm px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          placeholder="Search by member name"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {/* Add date filter if needed */}
      </div>
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2">Member Name</th>
            <th className="px-4 py-2">Item</th>
            <th className="px-4 py-2">Quantity</th>
            <th className="px-4 py-2">Unit</th>
            <th className="px-4 py-2">Revenue</th>
            <th className="px-4 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {(filtered || []).map(a => (
            <tr key={a.id} className="border-t">
              <td className="px-4 py-2">{new Date(a.date).toLocaleDateString()}</td>
              <td className="px-4 py-2">{a.memberName}</td>
              <td className="px-4 py-2">{a.itemName}</td>
              <td className="px-4 py-2">{a.metricValue}</td>
              <td className="px-4 py-2">{a.unitOfMeasure}</td>
              <td className="px-4 py-2">{a.revenue}</td>
              <td className="px-4 py-2">
                <Badge className={a.status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                  {a.status}
                </Badge>
                {user?.role === "ACCOUNTANT" && a.status === "UNPROCESSED" && (
                  <button
                    className="ml-2 px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                    onClick={async () => {
                      try {
                        await api.patch(`/activities/${a.id}/pay`);
                        getAllActivities().then(({ data }) => setActivities(data));
                      } catch (err) {
                        alert("Failed to mark as paid.");
                      }
                    }}
                  >
                    Process Payment
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ActivitiesLedger;
