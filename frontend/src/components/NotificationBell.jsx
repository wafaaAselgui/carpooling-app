import { useEffect, useState } from "react";
import { Dropdown, Badge, Button, Spinner } from "react-bootstrap";
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
        // Poll every 30 seconds for new alerts
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleItemClick = async (notif) => {
        if (!notif.read_at) {
            const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
            await api.patch(`/notifications/${notif.id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
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
            await api.post("/notifications/read-all", {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
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
            <Dropdown.Toggle variant="light" className="position-relative border-0 bg-transparent p-2">
                <span style={{ fontSize: "1.25rem" }}>🔔</span>
                {unreadCount > 0 && (
                    <Badge
                        pill
                        bg="danger"
                        className="position-absolute top-0 start-100 translate-middle"
                        style={{ fontSize: "0.65rem" }}
                    >
                        {unreadCount}
                    </Badge>
                )}
            </Dropdown.Toggle>

            <Dropdown.Menu style={{ width: "320px", maxHeight: "420px", overflowY: "auto" }} className="shadow">
                <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
                    <span className="fw-bold small">Notifications</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="link"
                            size="sm"
                            className="p-0 text-decoration-none small"
                            onClick={handleMarkAllRead}
                            disabled={loading}
                        >
                            Mark all read
                        </Button>
                    )}
                </div>

                {notifications.length === 0 ? (
                    <div className="text-center py-3 text-muted small">No notifications yet.</div>
                ) : (
                    notifications.map((n) => {
                        const isUnread = !n.read_at;
                        return (
                            <Dropdown.Item
                                key={n.id}
                                className={`px-3 py-2 text-wrap border-bottom ${isUnread ? "bg-light fw-semibold" : ""}`}
                                onClick={() => handleItemClick(n)}
                            >
                                <div className="d-flex justify-content-between align-items-baseline">
                                    <span className="small text-primary">{n.data?.title || "Update"}</span>
                                    {isUnread && <span className="badge bg-primary rounded-pill p-1"> </span>}
                                </div>
                                <div className="small text-secondary mt-1">{n.data?.message}</div>
                                <div className="text-muted mt-1" style={{ fontSize: "10px" }}>
                                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </Dropdown.Item>
                        );
                    })
                )}
            </Dropdown.Menu>
        </Dropdown>
    );
}