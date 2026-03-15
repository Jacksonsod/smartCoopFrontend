import api from "./api";

export const getMyActivities = async () => await api.get("/activities/me");
export const getCoopActivities = async () => await api.get("/activities/coop");
export const recordActivity = async (payload) => await api.post("/activities", payload);
