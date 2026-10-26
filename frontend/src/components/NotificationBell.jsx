import { useEffect, useState } from "react";
import { Dropdown, Badge, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
      if (!token) return;

      const res = await api.get("/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleItemClick = async (notif) => {
    if (!notif.read_at) {
      const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
      await api.patch(
        `/notifications/${notif.id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    if (notif.data?.link) {
      navigate(notif.data.link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
      await api.post(
        "/notifications/read-all",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dropdown align="end">
      <Dropdown.Toggle
        variant="link"
        className="position-relative border-0 bg-transparent p-2 text-decoration-none d-flex align-items-center"
        style={{ color: "var(--color-text-main)" }}
        aria-label="Notifications"
      >
        {/* Minimal Bell SVG Icon */}
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unreadCount > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "#ffffff",
              fontSize: "0.65rem",
              padding: "0.25em 0.5em",
            }}
          >
            {unreadCount}
          </span>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu
        style={{ width: "320px", maxHeight: "420px", overflowY: "auto" }}
        className="shadow-sm border mt-2"
      >
        <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
          <span className="fw-semibold small text-dark">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="link"
              size="sm"
              className="p-0 text-decoration-none small text-muted"
              onClick={handleMarkAllRead}
              disabled={loading}
            >
              Mark all read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-4 text-muted small">No notifications yet.</div>
        ) : (
          notifications.map((n) => {
            const isUnread = !n.read_at;
            return (
              <Dropdown.Item
                key={n.id}
                className="px-3 py-2 text-wrap border-bottom"
                style={{
                  backgroundColor: isUnread ? "rgba(246, 226, 233, 0.25)" : "transparent",
                }}
                onClick={() => handleItemClick(n)}
              >
                <div className="d-flex justify-content-between align-items-baseline">
                  <span className="small fw-semibold" style={{ color: "var(--color-primary)" }}>
                    {n.data?.title || "Update"}
                  </span>
                  {isUnread && (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: "var(--color-primary)",
                        display: "inline-block",
                      }}
                    />
                  )}
                </div>
                <div className="small text-muted mt-1">{n.data?.message}</div>
                <div className="text-muted mt-1" style={{ fontSize: "11px" }}>
                  {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </Dropdown.Item>
            );
          })
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
}