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
 * Accessible to ROLE_ACCOUNTANT and ROLE_COOP_ADMIN.
 */
export const downloadPaymentSummaryExcel = () =>
    downloadFile(
        `/documents/payments/excel`,
        `payments-${today()}.xlsx`
    );

/**
 * Downloads the full audit log Excel workbook.
 * Accessible to ROLE_SUPER_ADMIN only.
 */
export const downloadAuditLogExcel = () =>
    downloadFile(
        `/documents/audit-logs/excel`,
        `audit-log-${today()}.xlsx`
    );