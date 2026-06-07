// src/services/paymentService.js
import api from "./api";

export const getAllPayments = async () =>
  await api.get("/payments/pending");

export const markPaymentAsPaid = async (id, reference = "web-portal") =>
  await api.patch(`/payments/${id}/pay?reference=${reference}`);
