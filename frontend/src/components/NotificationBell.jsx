import { useEffect, useState, useCallback } from "react";
import { Dropdown, Button } from "react-bootstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  formatNotificationTime,
} from "../services/notifications";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications, location.pathname]);

  const handleItemClick = async (notif) => {
    setDropdownOpen(false);
    if (!notif.read_at) {
      try {
        await markNotificationAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error(err);
      }
    }

    if (notif.data?.link) {
      navigate(notif.data.link);
    }
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      setLoading(true);
      await markAllNotificationsAsRead();
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

  const bellIconWithBadge = (
    <>
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
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </>
  );

  const previewNotifications = notifications.slice(0, 6);

  return (
    <>
      {/* Mobile (< 768px): Direct Link to Full Notifications Page */}
      <Link
        to="/notifications"
        className="d-inline-flex d-md-none position-relative p-2 text-decoration-none align-items-center"
        style={{ color: "var(--color-text-main)" }}
        aria-label="Notifications"
      >
        {bellIconWithBadge}
      </Link>

      {/* Desktop (>= 768px): Quick Dropdown + Link to Full Page */}
      <Dropdown
        align="end"
        className="d-none d-md-inline-block"
        show={dropdownOpen}
        onToggle={(isOpen) => setDropdownOpen(isOpen)}
      >
        <Dropdown.Toggle
          variant="link"
          className="position-relative border-0 bg-transparent p-2 text-decoration-none d-flex align-items-center shadow-none"
          style={{ color: "var(--color-text-main)" }}
          aria-label="Notifications"
        >
          {bellIconWithBadge}
        </Dropdown.Toggle>

        <Dropdown.Menu
          style={{ width: "340px", borderColor: "var(--color-border)" }}
          className="shadow-sm border mt-2 p-0 overflow-hidden"
        >
          <div
            className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom bg-white"
            style={{ borderColor: "var(--color-border-subtle)" }}
          >
            <span className="fw-semibold small" style={{ color: "var(--color-text-main)" }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <Button
                variant="link"
                size="sm"
                className="p-0 text-decoration-none small"
                style={{ color: "var(--color-primary-text)", fontSize: "12px" }}
                onClick={handleMarkAllRead}
                disabled={loading}
              >
                Mark all read
              </Button>
            )}
          </div>

          <div style={{ maxHeight: "340px", overflowY: "auto" }}>
            {previewNotifications.length === 0 ? (
              <div className="text-center py-4 text-muted small">No notifications yet.</div>
            ) : (
              previewNotifications.map((n) => {
                const isUnread = !n.read_at;
                return (
                  <Dropdown.Item
                    key={n.id}
                    className="px-3 py-2 text-wrap border-bottom"
                    style={{
                      backgroundColor: isUnread
                        ? "var(--color-surface-tint)"
                        : "var(--color-surface)",
                      borderColor: "var(--color-border-subtle)",
                    }}
                    onClick={() => handleItemClick(n)}
                  >
                    <div className="d-flex justify-content-between align-items-baseline gap-2">
                      <span
                        className="small fw-semibold"
                        style={{
                          color: isUnread
                            ? "var(--color-primary-text)"
                            : "var(--color-text-main)",
                        }}
                      >
                        {n.data?.title || "Update"}
                      </span>
                      {isUnread && (
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            backgroundColor: "var(--color-primary)",
                            display: "inline-block",
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </div>
                    <div className="small text-muted mt-1">{n.data?.message}</div>
                    <div className="text-muted mt-1" style={{ fontSize: "11px" }}>
                      {formatNotificationTime(n.created_at)}
                    </div>
                  </Dropdown.Item>
                );
              })
            )}
          </div>

          <div
            className="border-top text-center py-2"
            style={{
              backgroundColor: "var(--color-canvas)",
              borderColor: "var(--color-border-subtle)",
            }}
          >
            <Link
              to="/notifications"
              onClick={() => setDropdownOpen(false)}
              className="small fw-semibold text-decoration-none d-block"
              style={{ color: "var(--color-primary-text)" }}
            >
              View all notifications
            </Link>
          </div>
        </Dropdown.Menu>
      </Dropdown>
    </>
  );
}