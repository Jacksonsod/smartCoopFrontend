import api from "./api";

export const getAuditLogs = async () => await api.get("/admin/audit-logs");

