import api from "./api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getNotifications = async () => {
  const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
  if (!token) {
    return { notifications: [], unread_count: 0 };
  }
  const res = await api.get("/notifications", { headers: getAuthHeaders() });
  return {
    notifications: res.data?.notifications || [],
    unread_count: res.data?.unread_count || 0,
  };
};

export const markNotificationAsRead = async (notificationId) => {
  const res = await api.patch(
    `/notifications/${notificationId}/read`,
    {},
    { headers: getAuthHeaders() }
  );
  return res.data;
};

export const markAllNotificationsAsRead = async () => {
  const res = await api.post(
    "/notifications/read-all",
    {},
    { headers: getAuthHeaders() }
  );
  return res.data;
};

export function formatNotificationTime(dateString, { relative = false } = {}) {
  if (!dateString) return "";
  const date = new Date(dateString);

  if (relative) {
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}