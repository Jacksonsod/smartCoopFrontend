import api from "./api";

export const getMyActivities = async () => await api.get("/activities/me");
export const getCoopActivities = async () => await api.get("/activities/coop");
export const recordActivity = async (payload) => await api.post("/activities", payload);
export const getAllActivities = async () => await api.get("/activities/coop");
export const updateActivityStatus = async (id, status) => {
    return await api.patch(`/activities/${id}/status?status=${status}`);
}
export const payActivity = async (id) => {
    // Uses the exact endpoint we created in your Java Controller
    return await api.patch(`/activities/${id}/pay`);
};