import api from "./api";

export const getAllPayments = async () => await api.get("/payments/pending");
export const updatePaymentStatus = async (id, status) => await api.patch(`/payments/${id}/status`, { status });

