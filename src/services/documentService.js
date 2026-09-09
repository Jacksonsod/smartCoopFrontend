// src/services/documentService.js
import { downloadFile } from "@/utils/downloadUtils";

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Downloads a payment invoice PDF for the given paymentId.
 * Accessible to ROLE_ACCOUNTANT and ROLE_COOP_ADMIN.
 */
export const downloadInvoicePdf = (paymentId) =>
    downloadFile(
        `/documents/invoice/${paymentId}`,
        `invoice-${paymentId}.pdf`
    );

/**
 * Downloads the cooperative activity report PDF.
 * Accessible to ROLE_COOP_ADMIN, ROLE_ACCOUNTANT, ROLE_FIELD_OFFICER.
 */
export const downloadActivityReportPdf = () =>
    downloadFile(
        `/documents/activities/pdf`,
        `activity-report-${today()}.pdf`
    );

/**
 * Downloads the payment summary Excel workbook.
 * Accepts optional date range and status filters.
 * Accessible to ROLE_ACCOUNTANT and ROLE_COOP_ADMIN.
 */
export const downloadPaymentSummaryExcel = (fromDate = null, toDate = null, status = null) => {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate)   params.append('toDate', toDate);
    if (status)   params.append('status', status);
    const qs = params.toString();
    return downloadFile(
        `/documents/payments/excel${qs ? '?' + qs : ''}`,
        `payments-${today()}.xlsx`
    );
};

/**
 * Downloads the full audit log Excel workbook.
 * Accessible to ROLE_SUPER_ADMIN only.
 */
export const downloadAuditLogExcel = () =>
    downloadFile(
        `/documents/audit-logs/excel`,
        `audit-log-${today()}.xlsx`
    );

/**
 * Downloads the entity_audit_trail (payment state-transition) Excel export.
 * SUPER_ADMIN only. Separate from /audit-logs/excel.
 */
export const downloadEntityAuditTrailExcel = (fromDate = null, toDate = null) => {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate)   params.append('toDate', toDate);
    const qs = params.toString();
    return downloadFile(
        `/documents/payment-audit-trail/excel${qs ? '?' + qs : ''}`,
        `payment-audit-trail-${today()}.xlsx`
    );
};
