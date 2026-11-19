import { useEffect, useState, useMemo, useCallback } from "react";
import { Container, Card, Button, Spinner, Alert, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  formatNotificationTime,
} from "../services/notifications";
import { getFriendlyError } from "../utils/errorHandler";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // 'all' | 'unread'
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch (err) {
      setError(getFriendlyError(err, "Failed to load notifications."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((n) => !n.read_at);
    }
    return notifications;
  }, [notifications, filter]);

  const handleNotificationClick = async (notif) => {
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
        console.error("Failed to mark notification as read", err);
      }
    }

    if (notif.data?.link) {
      navigate(notif.data.link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      setError(getFriendlyError(err, "Unable to mark notifications as read."));
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <Container fluid className="py-3 py-md-4 px-3 px-lg-5" style={{ maxWidth: "820px" }}>
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2 mb-3">
        <div>
          <h2
            className="fw-bold mb-1 fs-4 fs-md-2"
            style={{ color: "var(--color-text-main)", letterSpacing: "-0.02em" }}
          >
            Notifications
          </h2>
          <p className="text-muted small mb-0">
            Stay updated on booking requests, trip status changes, and reviews.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline-secondary"
            size="sm"
            className="align-self-stretch align-self-sm-auto px-3 py-2"
            onClick={handleMarkAllRead}
            disabled={markingAll}
          >
            {markingAll ? "Marking..." : "Mark all as read"}
          </Button>
        )}
      </div>

      {/* Filter Pills */}
      <div className="d-flex align-items-center gap-2 mb-3">
        {[
          { key: "all", label: "All", count: notifications.length },
          { key: "unread", label: "Unread", count: unreadCount },
        ].map((tab) => {
          const isActive = filter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className="btn btn-sm rounded-pill px-3 py-1 d-inline-flex align-items-center gap-2 border"
              style={{
                backgroundColor: isActive ? "var(--color-primary)" : "var(--color-surface)",
                color: isActive ? "#ffffff" : "var(--color-text-muted)",
                borderColor: isActive ? "var(--color-primary)" : "var(--color-border)",
                fontWeight: isActive ? 600 : 500,
              }}
            >
              <span>{tab.label}</span>
              <Badge
                bg={isActive ? "light" : "secondary"}
                text={isActive ? "dark" : "light"}
                pill
                style={{ fontSize: "10.5px" }}
              >
                {tab.count}
              </Badge>
            </button>
          );
        })}
      </div>

      {error && (
        <Alert
          dismissible
          onClose={() => setError(null)}
          style={{
            backgroundColor: "var(--color-danger-subtle)",
            color: "var(--color-danger)",
            border: "none",
          }}
        >
          {error}
        </Alert>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" style={{ color: "var(--color-primary)" }} />
          <p className="mt-2 text-muted small">Loading notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card className="border-0 shadow-sm p-4 p-md-5 text-center">
          <div
            className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
            style={{
              width: 48,
              height: 48,
              backgroundColor: "var(--color-surface-tint)",
              color: "var(--color-primary)",
            }}
          >
            <svg
              width="22"
              height="22"
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
          </div>
          <h6 className="fw-semibold mb-1" style={{ color: "var(--color-text-main)" }}>
            {filter === "unread" ? "You're all caught up!" : "No notifications yet"}
          </h6>
          <p className="text-muted small mb-0">
            {filter === "unread"
              ? "You have no unread notifications right now."
              : "When passengers book your rides or drivers respond to your requests, alerts will appear here."}
          </p>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="list-group list-group-flush">
            {filteredNotifications.map((n) => {
              const isUnread = !n.read_at;
              const isClickable = Boolean(n.data?.link);

              return (
                <div
                  key={n.id}
                  role={isClickable ? "button" : undefined}
                  tabIndex={isClickable ? 0 : undefined}
                  onClick={() => handleNotificationClick(n)}
                  onKeyDown={(e) => {
                    if (isClickable && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      handleNotificationClick(n);
                    }
                  }}
                  className="list-group-item p-3 p-md-4 border-bottom"
                  style={{
                    backgroundColor: isUnread
                      ? "var(--color-surface-tint)"
                      : "var(--color-surface)",
                    borderColor: "var(--color-border-subtle)",
                    cursor: isClickable ? "pointer" : "default",
                    transition: "background-color 0.15s ease",
                  }}
                >
                  <div className="d-flex align-items-start gap-3">
                    {/* Unread Indicator Dot */}
                    <div className="pt-1 flex-shrink-0" style={{ width: 10 }}>
                      {isUnread && (
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: "var(--color-primary)",
                            display: "inline-block",
                          }}
                          title="Unread"
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <div className="d-flex justify-content-between align-items-baseline gap-2 mb-1">
                        <span
                          className="fw-semibold small"
                          style={{
                            color: isUnread
                              ? "var(--color-primary-text)"
                              : "var(--color-text-main)",
                          }}
                        >
                          {n.data?.title || "Update"}
                        </span>
                        <span
                          className="text-muted flex-shrink-0"
                          style={{ fontSize: "11.5px" }}
                        >
                          {formatNotificationTime(n.created_at, { relative: true })}
                        </span>
                      </div>

                      <p
                        className="small mb-0"
                        style={{
                          color: isUnread
                            ? "var(--color-text-main)"
                            : "var(--color-text-muted)",
                        }}
                      >
                        {n.data?.message}
                      </p>
                    </div>

                    {/* Chevron if navigable */}
                    {isClickable && (
                      <div className="align-self-center text-muted flex-shrink-0">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </Container>
  );
}