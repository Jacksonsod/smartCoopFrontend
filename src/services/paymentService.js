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
export const markPaymentAsPaid = async (paymentId, reference = "web-portal") =>
  api.patch(`/payments/${paymentId}/pay?reference=${reference}`);

// ── Legacy alias kept for backward compatibility with other pages ──────────
/** @deprecated Use getPendingPayments() instead */
export const getAllPayments = getPendingPayments;
