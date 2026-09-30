// src/services/paymentService.js
import api from "./api";

/**
 * Fetch all payments that are currently in PENDING status.
 * GET /api/v1/payments/pending
 */
export const getPendingPayments = async () =>
  api.get("/payments/pending");

/**
 * Mark a payment as paid, triggering a MoMo payout via Africa's Talking.
 * PATCH /api/v1/payments/{paymentId}/pay?reference={reference}
 */
export const markPaymentAsPaid = async (paymentId, reference) => {
  const value = typeof reference === "string" ? reference.trim() : "";
  if (!value) throw new Error("PAYMENT_REFERENCE_REQUIRED");
  return api.patch(`/payments/${paymentId}/pay`, null, { params: { reference: value } });
};

// ── Legacy alias kept for backward compatibility with other pages ──────────
/** @deprecated Use getPendingPayments() instead */
export const getAllPayments = getPendingPayments;
