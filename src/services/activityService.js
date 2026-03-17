import api from "./api";
import axios from "axios";

export const getMyActivities = async () => await api.get("/activities/me");
export const getCoopActivities = async () => await api.get("/activities/coop");
export const recordActivity = async (payload) => await api.post("/activities", payload);
export const getAllActivities = async () => await api.get("/activities/coop");
export const updateActivityStatus = async (id, status) => {
    // Note: Because the backend uses @RequestParam, we pass status in the URL
    return await axios.patch(`/api/v1/activities/${id}/status?status=${status}`);
};
