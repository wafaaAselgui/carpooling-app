import { useEffect, useState } from "react";
import { Navbar, Nav, Container, Dropdown, Badge, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function AppNavbar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingRead, setLoadingRead] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
      if (!token) return;

      const res = await api.get("/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000);
    return () => clearInterval(interval);
  }, [user]);

  const handleNotificationClick = async (notif) => {
    if (!notif.read_at) {
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
        await api.patch(`/notifications/${notif.id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error(err);
      }
    }

    if (notif.data?.link) {
      navigate(notif.data.link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setLoadingRead(true);
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
      setLoadingRead(false);
    }
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm">
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold">
          🚗 Carpooling
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-navbar-nav" />
        <Navbar.Collapse id="main-navbar-nav">
          <Nav className="ms-auto align-items-center gap-1">
            <Nav.Link as={Link} to="/">
              Trips
            </Nav.Link>

            {user ? (
              <>
                <Nav.Link as={Link} to="/create-trip" className="d-flex align-items-center gap-1">
                  Publish Trip
                  {user?.verification_status === "verified" ? (
                    <Badge bg="success-subtle" text="success" className="border border-success-subtle ms-1" style={{ fontSize: "10px" }}>
                      ✓ Verified
                    </Badge>
                  ) : user?.verification_status === "pending" ? (
                    <Badge bg="warning-subtle" text="dark" className="border border-warning-subtle ms-1" style={{ fontSize: "10px" }}>
                      ⏳ Pending
                    </Badge>
                  ) : (
                    <Badge bg="secondary-subtle" text="secondary" className="border border-secondary-subtle ms-1" style={{ fontSize: "10px" }}>
                      🔒 Unverified
                    </Badge>
                  )}
                </Nav.Link>

                <Nav.Link as={Link} to="/my-bookings">
                  My Bookings
                </Nav.Link>

                <Nav.Link as={Link} to="/driver/trips">
                  My Offered Trips
                </Nav.Link>

                <Nav.Link as={Link} to="/profile">
                  Mon Profil
                </Nav.Link>

                {user?.is_admin && (
                  <Nav.Link as={Link} to="/admin" className="text-warning fw-bold">
                    Admin Panel
                  </Nav.Link>
                )}

                {/* Notifications Bell Dropdown */}
                <Dropdown align="end" className="mx-1">
                  <Dropdown.Toggle
                    variant="link"
                    className="p-1 text-white-50 text-decoration-none position-relative d-flex align-items-center"
                    id="notifications-dropdown"
                  >
                    <span style={{ fontSize: "1.2rem" }}>🔔</span>
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

                  <Dropdown.Menu
                    style={{ width: "320px", maxHeight: "400px", overflowY: "auto" }}
                    className="shadow border-0"
                  >
                    <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
                      <span className="fw-bold small text-dark">Notifications</span>
                      {unreadCount > 0 && (
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 text-decoration-none small text-muted"
                          onClick={handleMarkAllRead}
                          disabled={loadingRead}
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
                            className={`px-3 py-2 text-wrap border-bottom ${
                              isUnread ? "bg-light fw-semibold" : ""
                            }`}
                            onClick={() => handleNotificationClick(n)}
                          >
                            <div className="d-flex justify-content-between align-items-baseline mb-1">
                              <span className="small text-primary">{n.data?.title || "Update"}</span>
                              {isUnread && <Badge bg="primary" pill style={{ width: 7, height: 7, padding: 0 }} />}
                            </div>
                            <div className="small text-dark mb-1">{n.data?.message}</div>
                            <div className="text-muted" style={{ fontSize: "10px" }}>
                              {new Date(n.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </Dropdown.Item>
                        );
                      })
                    )}
                  </Dropdown.Menu>
                </Dropdown>

                <Nav.Link onClick={logoutUser} className="text-danger-emphasis">
                  Logout
                </Nav.Link>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">
                  Login
                </Nav.Link>

                <Nav.Link as={Link} to="/register">
                  Register
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}