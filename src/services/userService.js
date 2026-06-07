import api from "./api";

export const getAllUsers = () => api.get("/users/all");
export const getMyCoopStaff = () => api.get("/users/my-coop");
export const createCoopStaff = (data) => api.post("/users/staff", data);
export const registerCoopAdmin = (data) =>
  api.post("/auth/register-coop-admin", data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const toggleUserStatus = (id) =>
  api.patch(`/users/${id}/toggle-status`);
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const createUserProfile = (userId, data) =>
  api.post(`/users/${userId}/profile`, data);

