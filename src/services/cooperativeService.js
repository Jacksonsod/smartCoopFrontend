import api from "./api";

const COOPERATIVES_BASE = "/admin/cooperatives";

export const getAllCooperatives = () => {
  return api.get(COOPERATIVES_BASE);
};

export const registerCooperative = (data) => {
  return api.post(COOPERATIVES_BASE, data);
};

export const activateCooperative = (id) => {
  return api.put(`${COOPERATIVES_BASE}/${id}/activate`);
};

