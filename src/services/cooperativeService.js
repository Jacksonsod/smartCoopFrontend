import axios from "axios";
import api from "./api";

const COOPERATIVES_BASE = "/admin/cooperatives";
const publicApi = axios.create({
  baseURL: "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

export const getAllCooperatives = () => {
  return api.get(COOPERATIVES_BASE);
};

export const registerCooperative = (data) => {
  return api.post(COOPERATIVES_BASE, data);
};

export const activateCooperative = (id) => {
  return api.put(`${COOPERATIVES_BASE}/${id}/activate`);
};

export const submitCooperativeApplication = (data) => {
  return publicApi.post("/public/cooperatives/apply", data);
};

