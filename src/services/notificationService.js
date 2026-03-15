import api from "./api";

const extractNotifications = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const getMyNotifications = async () => await api.get("/notifications/me");

export const getUnreadCount = async () => {
  const response = await api.get("/notifications/me");
  const data = response?.data;

  if (typeof data?.unreadCount === "number") {
    return { ...response, data: data.unreadCount };
  }

  if (typeof data?.totalUnread === "number") {
    return { ...response, data: data.totalUnread };
  }

  const notifications = extractNotifications(data);
  const unread = notifications.filter((notification) => !notification?.isRead).length;
  return { ...response, data: unread };
};

export const markAsRead = async (id) => await api.patch(`/notifications/${id}/read`);

