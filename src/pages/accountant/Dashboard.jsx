import React, { useEffect, useState } from "react";
import { getAllPayments } from "../../services/paymentService";
import { getAllActivities } from "../../services/activityService";
import { Badge } from "../../components/ui/badge";
import { useAuth } from "../../context/AuthContext";

const AccountantDashboard = () => {
  const [payments, setPayments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    console.log("Current User:", user);
    const fetchData = async () => {
      setLoading(true);
      try {
        const [paymentsRes, activitiesRes] = await Promise.all([
          getAllPayments(),
          getAllActivities(),
        ]);
        setPayments(paymentsRes.data || []);
        setActivities(activitiesRes.data || []);
      } catch (err) {
        // Optionally show error toast
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Stats
  const totalPayments = payments.length;
  const totalRevenue = payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingPayouts = payments.filter((p) => p.status === "PENDING").length;
  const recentPayments = payments.slice(0, 5);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Accountant Dashboard</h2>
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <svg className="animate-spin h-6 w-6 text-green-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
          Loading dashboard...
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-green-700">{totalPayments}</div>
              <div className="text-gray-500 mt-2">Total Payments</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-yellow-600">{pendingPayouts}</div>
              <div className="text-gray-500 mt-2">Pending Payouts</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-emerald-700">{totalRevenue.toLocaleString()} RWF</div>
              <div className="text-gray-500 mt-2">Total Revenue</div>
            </div>
          </div>

          {/* Recent Payments Table */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="font-semibold mb-2">Recent Payments</div>
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Member</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Method</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-400">No payments found.</td>
                  </tr>
                ) : (
                  recentPayments.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="px-3 py-2">{p.date ? new Date(p.date).toLocaleDateString() : "-"}</td>
                      <td className="px-3 py-2">{p.memberName || "-"}</td>
                      <td className="px-3 py-2">{p.amount?.toLocaleString()} RWF</td>
                      <td className="px-3 py-2">{p.method}</td>
                      <td className="px-3 py-2">
                        <Badge className={p.status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>{p.status}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default AccountantDashboard;

