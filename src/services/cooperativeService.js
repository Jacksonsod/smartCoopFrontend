import axios from "axios";
import api from "./api";

const COOPERATIVES_BASE = "/admin/cooperatives";
const publicApi = axios.create({
  // Using the exact same variable as your api.js!
  baseURL: import.meta.env.VITE_SERVER || "https://smart-coop-production.up.railway.app/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

export const getAllCooperatives = async () => await api.get(COOPERATIVES_BASE);

export const registerCooperative = (data) => {
  return api.post(COOPERATIVES_BASE, data);
};

export const activateCooperative = async (id) => await api.put(`${COOPERATIVES_BASE}/${id}/activate`);
export const deactivateCooperative = async (id) => await api.put(`${COOPERATIVES_BASE}/${id}/deactivate`);

export const submitCooperativeApplication = (data) => {
  return publicApi.post("/public/cooperatives/apply", data);
};
