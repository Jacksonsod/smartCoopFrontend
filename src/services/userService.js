import api from "./api";

export const registerCoopAdmin = (data) => {
  return api.post("/auth/register-coop-admin", data);
};

export const getAllUsers = () => {
  return api.get("/users/all");
};

export const toggleUserStatus = (id) => {
  return api.patch(`/users/${id}/toggle-status`);
};

export const createUserProfile = (userId, profileData) => {
  return api.post(`/users/${userId}/profile`, profileData);
};

export const deleteUser = (userId) => {
  return api.delete(`/users/${userId}`);
};

export const getMyCoopStaff = () => {
  return api.get("/users/my-coop");
};

export const createCoopStaff = (data) => {
  return api.post("/users/staff", data);
};

