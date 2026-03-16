import api from "./api";

export const getAllPayments = async () => await api.get("/payments/coop");
export const updatePaymentStatus = async (id, status) => await api.patch(`/payments/${id}/status`, { status });

