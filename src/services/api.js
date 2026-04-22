import axios from "axios";

const normalizeBaseUrl = (url) => {
    if (!url || typeof url !== "string") return null;
    const trimmed = url.trim().replace(/\/+$/, "");
    if (!trimmed) return null;
    return trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`;
};

const getStoredBackend = () => {
    if (typeof window === "undefined") return null;
    return normalizeBaseUrl(localStorage.getItem("backendUrl"));
};

const availableBackends = [
    getStoredBackend(),
    normalizeBaseUrl(import.meta.env.VITE_SERVER),
    normalizeBaseUrl(import.meta.env.VITE_SERVER_PRIMARY),
    normalizeBaseUrl(import.meta.env.VITE_SERVER_SECONDARY),
    "http://localhost:8080/api/v1",
].filter(Boolean);

const baseURL = availableBackends[0];

const api = axios.create({
    // Supports a selected backend URL, then falls back to configured primary/secondary endpoints.
    baseURL,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true, // Required for the CORS configuration we set on the backend
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

export const getAvailableBackends = () => [...new Set(availableBackends)];

export const setBackendUrl = (url) => {
    if (typeof window === "undefined") return;
    const normalized = normalizeBaseUrl(url);
    if (!normalized) return;
    localStorage.setItem("backendUrl", normalized);
    window.location.reload();
};
