import axios from "axios";

// Ensure Vite proxy mapping works: prefer explicit VITE_SERVER then fall back to proxy path
const baseURL = import.meta.env.VITE_SERVER || 'http://localhost:8089/api/v1';

const api = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    }
});

const isTokenExpired = (token) => {
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const now = Math.floor(Date.now() / 1000);
        return payload.exp && payload.exp < now;
    } catch {
        return true;
    }
};

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            if (isTokenExpired(token)) {
                console.warn("[API] Token expired — clearing and redirecting to login.");
                localStorage.removeItem("token");
                window.location.href = "/login";
                return Promise.reject(new Error("Token expired"));
            }
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            console.error(
                `[API ${error.response.status}] ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
                "\nAuth header sent:", error.config?.headers?.Authorization ? "YES" : "NO",
                "\nResponse body:", error.response?.data
            );
        }
        return Promise.reject(error);
    }
);

export default api;

export const getAvailableBackends = () => [baseURL];

export const setBackendUrl = (url) => {
    if (typeof window === "undefined") return;
    try { localStorage.setItem("backendUrl", String(url)); window.location.reload(); } catch (e) { /* noop */ }
};

// ─── Phase 1: Sector & Report Endpoints ─────────────────────────
export const getSectorUnits = async (sectorType) => {
    return api.get(`/sectors/${sectorType}/units`);
};

export const getReportSummary = async () => {
    return api.get('/reports/summary');
};

export const applyForCooperative = (data) => api.post('/public/cooperatives/apply', data);
//good
