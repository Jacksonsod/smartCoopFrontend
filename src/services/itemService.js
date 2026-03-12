import api from "./api";

export const getAllItems = () => {
  return api.get("/items");
};

export const createItem = (data) => {
  return api.post("/items", data);
};

export const updateItem = (id, data) => {
  return api.put(`/items/${id}`, data);
};

export const deleteItem = (id) => {
  return api.delete(`/items/${id}`);
};

