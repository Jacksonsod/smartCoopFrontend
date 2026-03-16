import React, { useEffect, useState } from "react";
import { getAllPayments, updatePaymentStatus } from "../../services/paymentService";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../context/AuthContext";

const PaymentsManagement = () => {
  const [payments, setPayments] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  const { user } = useAuth();

  const fetchPayments = async () => {
    const { data } = await getAllPayments();
    setPayments(data);
  };

  useEffect(() => {
    console.log("Current User:", user);
    fetchPayments();
  }, []);

  const handleMarkAsPaid = async (id) => {
    setProcessingId(id);
    await updatePaymentStatus(id, "COMPLETED");
    if (window.toast) window.toast.success("Payment marked as completed!");
    fetchPayments();
    setProcessingId(null);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Manage Payments</h2>
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2">Member Name</th>
            <th className="px-4 py-2">Amount</th>
            <th className="px-4 py-2">Method</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {(payments || []).map(p => (
            <tr key={p.id} className="border-t">
              <td className="px-4 py-2">{new Date(p.date).toLocaleDateString()}</td>
              <td className="px-4 py-2">{p.memberName}</td>
              <td className="px-4 py-2">{p.amount}</td>
              <td className="px-4 py-2">{p.method}</td>
              <td className="px-4 py-2">
                <Badge className={p.status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                  {p.status}
                </Badge>
              </td>
              <td className="px-4 py-2">
                {p.status === "PENDING" && (
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={processingId === p.id}
                    onClick={() => handleMarkAsPaid(p.id)}
                  >
                    {processingId === p.id ? "Processing..." : "Mark as Paid"}
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentsManagement;

